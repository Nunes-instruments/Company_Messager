import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [
    customers,
    openConversations,
    openServiceJobs,
    calibrationDue,
    newLeads,
    activeCampaigns,
  ] = await Promise.all([
    db.customer.count({ where: { status: "ACTIVE" } }),
    db.conversation.count({ where: { status: "OPEN" } }),
    db.serviceJob.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "READY"] } },
    }),
    db.calibrationRecord.count({
      where: { status: { in: ["DUE_SOON", "OVERDUE"] } },
    }),
    db.lead.count({
      where: { status: { in: ["NEW", "ASSIGNED", "FOLLOW_UP", "QUOTATION"] } },
    }),
    db.campaign.count({ where: { status: { in: ["SCHEDULED", "RUNNING"] } } }),
  ]);

  return NextResponse.json({
    customers,
    openConversations,
    openServiceJobs,
    calibrationDue,
    newLeads,
    activeCampaigns,
  });
}
