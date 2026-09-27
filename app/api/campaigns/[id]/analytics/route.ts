import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const campaign = await db.campaign.findUnique({
    where: { id },
    include: {
      _count: { select: { recipients: true } },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const [statusRows, responded, campaignMessages, linkedLeads] = await Promise.all([
    db.campaignRecipient.groupBy({
      by: ["status"],
      where: { campaignId: id },
      _count: { _all: true },
    }),
    db.campaignRecipient.count({
      where: {
        campaignId: id,
        respondedAt: { not: null },
      },
    }),
    db.message.count({
      where: {
        externalId: { startsWith: `campaign:${id}:recipient:` },
      },
    }),
    db.lead.count({
      where: {
        source: { equals: `campaign:${id}` },
      },
    }),
  ]);

  const status = Object.fromEntries(
    statusRows.map((row) => [row.status, row._count._all])
  );

  return NextResponse.json({
    campaign: {
      id: campaign.id,
      name: campaign.name,
      type: campaign.type,
      channel: campaign.channel,
      status: campaign.status,
      startedAt: campaign.startedAt,
      completedAt: campaign.completedAt,
      totalRecipients: campaign._count.recipients,
    },
    delivery: {
      pending: status.PENDING ?? 0,
      sent: status.SENT ?? 0,
      delivered: status.DELIVERED ?? 0,
      read: status.READ ?? 0,
      failed: status.FAILED ?? 0,
      responded,
      campaignMessages,
      linkedLeads,
    },
  });
}
