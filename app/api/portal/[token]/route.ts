import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { resolvePortalCustomer } from "@/lib/portal-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const access = await resolvePortalCustomer(token);

  if (!access) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 401 });
  }

  let conversation = await db.conversation.findFirst({
    where: {
      customerId: access.customerId,
      channel: "NUNES_CONNECT",
      status: "OPEN",
    },
    orderBy: { updatedAt: "desc" },
  });

  if (!conversation) {
    conversation = await db.conversation.create({
      data: {
        customerId: access.customerId,
        channel: "NUNES_CONNECT",
        status: "OPEN",
      },
    });
  }

  const messages = await db.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    take: 500,
  });

  const unreadOutboundIds = messages
    .filter(
      (message) =>
        message.direction === "OUTBOUND" &&
        ["SENT", "DELIVERED"].includes(message.status)
    )
    .map((message) => message.id);

  if (unreadOutboundIds.length) {
    await db.message.updateMany({
      where: { id: { in: unreadOutboundIds } },
      data: { status: "READ", readAt: new Date(), deliveredAt: new Date() },
    });
  }

  return NextResponse.json({
    customer: {
      id: access.customer.id,
      name: access.customer.name,
      company: access.customer.company,
      instruments: access.customer.instruments,
      calibrations: access.customer.calibrations,
      serviceJobs: access.customer.serviceJobs,
    },
    conversation: {
      id: conversation.id,
      channel: conversation.channel,
    },
    messages: messages.map((message) => ({
      ...message,
      status:
        unreadOutboundIds.includes(message.id) && message.direction === "OUTBOUND"
          ? "READ"
          : message.status,
    })),
  });
}
