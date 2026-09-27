import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolvePortalCustomer } from "@/lib/portal-token";
import {
  detectReplyIntent,
  isPositiveIntent,
  leadTypeFromIntent,
} from "@/lib/reply-intent";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const replySchema = z.object({
  body: z.string().trim().min(1).max(10000),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const access = await resolvePortalCustomer(token);

  if (!access) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 401 });
  }

  const parsed = replySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid message", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const now = new Date();

  const result = await db.$transaction(async (tx) => {
    let conversation = await tx.conversation.findFirst({
      where: {
        customerId: access.customerId,
        channel: "NUNES_CONNECT",
        status: "OPEN",
      },
      orderBy: { updatedAt: "desc" },
    });

    if (!conversation) {
      conversation = await tx.conversation.create({
        data: {
          customerId: access.customerId,
          channel: "NUNES_CONNECT",
          status: "OPEN",
        },
      });
    }

    const message = await tx.message.create({
      data: {
        conversationId: conversation.id,
        direction: "INBOUND",
        channel: "NUNES_CONNECT",
        body: parsed.data.body,
        status: "DELIVERED",
        deliveredAt: now,
      },
    });

    await tx.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: now },
    });

    await tx.customer.update({
      where: { id: access.customerId },
      data: { lastContactAt: now },
    });

    const intent = detectReplyIntent(parsed.data.body);
    let campaignId: string | null = null;
    let leadId: string | null = null;

    const recentCampaignMessage = await tx.message.findFirst({
      where: {
        conversationId: conversation.id,
        direction: "OUTBOUND",
        externalId: { startsWith: "campaign:" },
        createdAt: {
          gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recentCampaignMessage?.externalId) {
      const match = recentCampaignMessage.externalId.match(
        /^campaign:([^:]+):recipient:([^:]+)$/
      );

      if (match) {
        const [, detectedCampaignId, recipientId] = match;
        campaignId = detectedCampaignId;

        await tx.campaignRecipient.updateMany({
          where: {
            id: recipientId,
            campaignId,
            customerId: access.customerId,
          },
          data: {
            respondedAt: now,
            status: "READ",
          },
        });

        const campaign = await tx.campaign.findUnique({
          where: { id: campaignId },
          select: { id: true, type: true },
        });

        if (campaign && isPositiveIntent(intent)) {
          const leadType = leadTypeFromIntent(intent, campaign.type);

          if (leadType) {
            const duplicate = await tx.lead.findFirst({
              where: {
                customerId: access.customerId,
                conversationId: conversation.id,
                source: `campaign:${campaign.id}`,
                status: {
                  in: ["NEW", "ASSIGNED", "FOLLOW_UP", "QUOTATION"],
                },
              },
            });

            if (duplicate) {
              leadId = duplicate.id;
            } else {
              const lead = await tx.lead.create({
                data: {
                  customerId: access.customerId,
                  conversationId: conversation.id,
                  type: leadType,
                  status: intent === "QUOTATION" ? "QUOTATION" : "NEW",
                  requirement: parsed.data.body,
                  source: `campaign:${campaign.id}`,
                },
              });
              leadId = lead.id;
            }
          }
        }
      }
    }

    await tx.auditLog.create({
      data: {
        customerId: access.customerId,
        action: "CUSTOMER_PORTAL_REPLY",
        entityType: "Message",
        entityId: message.id,
        metadata: { intent, campaignId, leadId },
      },
    });

    return { message, intent, campaignId, leadId };
  });

  return NextResponse.json(result, { status: 201 });
}
