import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const conversations = await db.conversation.findMany({
    where: { status: "OPEN" },
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }],
    take: 100,
    include: {
      customer: {
        include: {
          instruments: {
            orderBy: { updatedAt: "desc" },
            take: 5,
          },
          calibrations: {
            orderBy: { dueDate: "asc" },
            take: 5,
          },
          serviceJobs: {
            orderBy: { updatedAt: "desc" },
            take: 5,
          },
          leads: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      assignedUser: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { messages: true, leads: true },
      },
    },
  });

  return NextResponse.json({
    conversations: conversations.map((conversation) => ({
      id: conversation.id,
      channel: conversation.channel,
      status: conversation.status,
      lastMessageAt: conversation.lastMessageAt,
      latestMessage: conversation.messages[0] ?? null,
      customer: conversation.customer,
      assignedUser: conversation.assignedUser,
      messageCount: conversation._count.messages,
      leadCount: conversation._count.leads,
    })),
  });
}
