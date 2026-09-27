import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messageCreateSchema } from "@/lib/validators";

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

    const message = await tx.message.create({
      data: {
        ...parsed.data,
        status: isInternalChannel ? "SENT" : "PENDING",
        sentAt: isInternalChannel ? now : null,
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

    await tx.auditLog.create({
      data: {
        customerId: conversation.customerId,
        action: "MESSAGE_CREATED",
        entityType: "Message",
        entityId: message.id,
        metadata: {
          channel: parsed.data.channel,
          direction: parsed.data.direction,
        },
      },
    });

    return message;
  });

  return NextResponse.json({ message: result }, { status: 201 });
}
