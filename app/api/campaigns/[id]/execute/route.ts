import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { canContactCustomer } from "@/lib/campaign-eligibility";
import { providerConfigured } from "@/lib/providers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BATCH_SIZE = 100;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const requestedBatch = Number(body?.batchSize ?? 50);
  const batchSize = Math.max(1, Math.min(MAX_BATCH_SIZE, requestedBatch));

  const campaign = await db.campaign.findUnique({
    where: { id },
    include: {
      recipients: {
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" },
        take: batchSize,
        include: {
          customer: {
            include: { optOuts: true },
          },
        },
      },
      _count: { select: { recipients: true } },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  if (campaign.status === "PAUSED") {
    return NextResponse.json(
      { error: "Campaign is paused. Resume it before sending." },
      { status: 409 }
    );
  }

  if (campaign.status === "COMPLETED") {
    return NextResponse.json(
      { error: "Campaign is already completed." },
      { status: 409 }
    );
  }

  if (!providerConfigured(campaign.channel)) {
    return NextResponse.json(
      {
        error: `${campaign.channel} provider is not configured`,
        channel: campaign.channel,
      },
      { status: 409 }
    );
  }

  if (campaign.channel !== "NUNES_CONNECT") {
    return NextResponse.json(
      {
        error: `${campaign.channel} external provider adapter is not connected yet`,
        channel: campaign.channel,
      },
      { status: 409 }
    );
  }

  const now = new Date();

  if (!campaign.startedAt || campaign.status === "DRAFT" || campaign.status === "SCHEDULED") {
    await db.campaign.update({
      where: { id: campaign.id },
      data: {
        status: "RUNNING",
        startedAt: campaign.startedAt ?? now,
      },
    });
  }

  let sent = 0;
  let skipped = 0;
  const failures: Array<{ customerId: string; reason: string }> = [];

  for (const recipient of campaign.recipients) {
    const customer = recipient.customer;

    if (!canContactCustomer(customer, campaign.channel)) {
      skipped += 1;
      failures.push({
        customerId: customer.id,
        reason: "Customer is no longer eligible for this channel",
      });
      continue;
    }

    try {
      await db.$transaction(async (tx) => {
        let conversation = await tx.conversation.findFirst({
          where: {
            customerId: customer.id,
            channel: "NUNES_CONNECT",
            status: "OPEN",
          },
          orderBy: { updatedAt: "desc" },
        });

        if (!conversation) {
          conversation = await tx.conversation.create({
            data: {
              customerId: customer.id,
              channel: "NUNES_CONNECT",
              status: "OPEN",
              lastMessageAt: now,
            },
          });
        }

        const message = await tx.message.create({
          data: {
            conversationId: conversation.id,
            direction: "OUTBOUND",
            channel: "NUNES_CONNECT",
            body: campaign.message,
            status: "SENT",
            externalId: `campaign:${campaign.id}:recipient:${recipient.id}`,
            sentAt: now,
          },
        });

        await tx.conversation.update({
          where: { id: conversation.id },
          data: { lastMessageAt: now },
        });

        await tx.customer.update({
          where: { id: customer.id },
          data: { lastContactAt: now },
        });

        await tx.campaignRecipient.update({
          where: { id: recipient.id },
          data: {
            status: "SENT",
            sentAt: now,
          },
        });

        await tx.auditLog.create({
          data: {
            customerId: customer.id,
            action: "CAMPAIGN_MESSAGE_SENT",
            entityType: "Campaign",
            entityId: campaign.id,
            metadata: {
              recipientId: recipient.id,
              messageId: message.id,
              channel: campaign.channel,
            },
          },
        });
      });

      sent += 1;
    } catch (error) {
      failures.push({
        customerId: customer.id,
        reason: error instanceof Error ? error.message : "Unknown send error",
      });
    }
  }

  const remainingPending = await db.campaignRecipient.count({
    where: {
      campaignId: campaign.id,
      status: "PENDING",
    },
  });

  if (remainingPending === 0) {
    await db.campaign.update({
      where: { id: campaign.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });
  }

  const statusCounts = await db.campaignRecipient.groupBy({
    by: ["status"],
    where: { campaignId: campaign.id },
    _count: { _all: true },
  });

  return NextResponse.json({
    ok: failures.length === 0,
    campaignId: campaign.id,
    channel: campaign.channel,
    batchSize,
    sent,
    skipped,
    failed: failures.length - skipped,
    remainingPending,
    failures,
    statusCounts: Object.fromEntries(
      statusCounts.map((row) => [row.status, row._count._all])
    ),
  });
}
