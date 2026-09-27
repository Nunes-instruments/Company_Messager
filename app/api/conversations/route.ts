import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { conversationCreateSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const customerId = request.nextUrl.searchParams.get("customerId");
  const conversations = await db.conversation.findMany({
    where: customerId ? { customerId } : undefined,
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
    take: 100,
    include: {
      customer: true,
      assignedUser: { select: { id: true, name: true, email: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: true, leads: true } },
    },
  });
  return NextResponse.json({ conversations });
}

export async function POST(request: NextRequest) {
  const parsed = conversationCreateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid conversation data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const conversation = await db.conversation.create({
    data: parsed.data,
    include: { customer: true },
  });
  return NextResponse.json({ conversation }, { status: 201 });
}
