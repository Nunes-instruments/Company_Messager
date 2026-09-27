import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messageCreateSchema } from "@/lib/validators";
import {
  detectReplyIntent,
  isPositiveIntent,
  leadTypeFromIntent,
} from "@/lib/reply-intent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const conversationId = request.nextUrl.searchParams.get("conversationId");

  if (!conversationId) {
    return NextResponse.json(
      { error: "conversationId is required" },
      { status: 400 }
    );
  }

  const messages = await db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 500,
  });

  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest) {
  const parsed = messageCreateSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid message data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const now = new Date();

  const result = await db.$transaction(async (tx) => {
    const conversation = await tx.conversation.findUnique({
      where: { id: parsed.data.conversationId },
      select: { id: true, customerId: true },
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const isInternalChannel = parsed.data.channel === "NUNES_CONNECT";
    const isInbound = parsed.data.direction === "INBOUND";

    const message = await tx.message.create({
      data: {
        ...parsed.data,
        status: isInternalChannel
          ? isInbound
            ? "DELIVERED"
            : "SENT"
          : "PENDING",
        sentAt: isInternalChannel && !isInbound ? now : null,
        deliveredAt: isInternalChannel && isInbound ? now : null,
      },
    });

    await tx.conversation.update({
      where: { id: parsed.data.conversationId },
      data: { lastMessageAt: now },
    });

    await tx.customer.update({
      where: { id: conversation.customerId },
      data: { lastContactAt: now },
    });

    let replyIntent: string | null = null;
    let createdLeadId: string | null = null;
    let respondedCampaignId: string | null = null;

    if (isInbound) {
      replyIntent = detectReplyIntent(parsed.data.body);

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
          const [, campaignId, recipientId] = match;
          respondedCampaignId = campaignId;

          await tx.campaignRecipient.updateMany({
            where: {
              id: recipientId,
              campaignId,
              customerId: conversation.customerId,
            },
            data: {
              respondedAt: now,
              status: "READ",
            },
          });

          const campaign = await tx.campaign.findUnique({
            where: { id: campaignId },
            select: { id: true, type: true, name: true },
          });

          if (campaign && isPositiveIntent(replyIntent)) {
            const leadType = leadTypeFromIntent(replyIntent, campaign.type);

            if (leadType) {
              const duplicateLead = await tx.lead.findFirst({
                where: {
                  customerId: conversation.customerId,
                  conversationId: conversation.id,
                  source: `campaign:${campaign.id}`,
                  status: {
                    in: ["NEW", "ASSIGNED", "FOLLOW_UP", "QUOTATION"],
                  },
                },
              });

              if (!duplicateLead) {
                const lead = await tx.lead.create({
                  data: {
                    customerId: conversation.customerId,
                    conversationId: conversation.id,
                    type: leadType,
                    status: replyIntent === "QUOTATION" ? "QUOTATION" : "NEW",
                    requirement: parsed.data.body,
                    source: `campaign:${campaign.id}`,
                  },
                });

                createdLeadId = lead.id;
              } else {
                createdLeadId = duplicateLead.id;
              }
            }
          }
        }
      }
    }

    await tx.auditLog.create({
      data: {
        customerId: conversation.customerId,
        action: isInbound ? "CUSTOMER_REPLY_RECEIVED" : "MESSAGE_CREATED",
        entityType: "Message",
        entityId: message.id,
        metadata: {
          channel: parsed.data.channel,
          direction: parsed.data.direction,
          replyIntent,
          respondedCampaignId,
          createdLeadId,
        },
      },
    });

    return {
      message,
      replyAutomation: {
        intent: replyIntent,
        campaignId: respondedCampaignId,
        leadId: createdLeadId,
      },
    };
  });

  return NextResponse.json(result, { status: 201 });
}
