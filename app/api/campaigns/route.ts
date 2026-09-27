import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { campaignCreateSchema } from "@/lib/validators";

export async function GET() {
  const campaigns = await db.campaign.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: { _count: { select: { recipients: true } } },
  });
  return NextResponse.json({ campaigns });
}

export async function POST(request: NextRequest) {
  const parsed = campaignCreateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid campaign data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const recipientIds = Array.from(new Set(data.recipientCustomerIds ?? []));

  const campaign = await db.campaign.create({
    data: {
      name: data.name,
      type: data.type,
      subject: data.subject,
      message: data.message,
      channel: data.channel,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      status: data.scheduledAt ? "SCHEDULED" : "DRAFT",
      recipients: recipientIds.length
        ? {
            create: recipientIds.map((customerId) => ({ customerId })),
          }
        : undefined,
    },
    include: {
      _count: { select: { recipients: true } },
    },
  });

  return NextResponse.json({ campaign }, { status: 201 });
}
