import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messageCreateSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const conversationId = request.nextUrl.searchParams.get("conversationId");
  if (!conversationId) {
    return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
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

  const message = await db.$transaction(async (tx) => {
    const created = await tx.message.create({ data: parsed.data });
    await tx.conversation.update({
      where: { id: parsed.data.conversationId },
      data: { lastMessageAt: new Date() },
    });
    return created;
  });

  return NextResponse.json({ message }, { status: 201 });
}
