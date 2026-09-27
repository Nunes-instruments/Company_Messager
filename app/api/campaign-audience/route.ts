import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Channel } from "@prisma/client";
import { canContactCustomer } from "@/lib/campaign-eligibility";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const validChannels = new Set(["NUNES_CONNECT", "EMAIL", "WHATSAPP"]);

export async function GET(request: NextRequest) {
  const channelRaw = request.nextUrl.searchParams.get("channel") ?? "NUNES_CONNECT";
  const industry = request.nextUrl.searchParams.get("industry")?.trim() ?? "";
  const city = request.nextUrl.searchParams.get("city")?.trim() ?? "";

  if (!validChannels.has(channelRaw)) {
    return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
  }

  const channel = channelRaw as Channel;

  const customers = await db.customer.findMany({
    where: {
      status: "ACTIVE",
      ...(industry
        ? { industry: { contains: industry, mode: "insensitive" } }
        : {}),
      ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
    },
    include: {
      optOuts: true,
      _count: {
        select: {
          conversations: true,
          instruments: true,
          leads: true,
        },
      },
    },
    orderBy: [{ company: "asc" }, { name: "asc" }],
    take: 5000,
  });

  const eligible = customers.filter((customer) =>
    canContactCustomer(customer, channel)
  );

  return NextResponse.json({
    channel,
    filters: { industry, city },
    totalMatched: customers.length,
    eligibleCount: eligible.length,
    customers: eligible.map((customer) => ({
      id: customer.id,
      name: customer.name,
      company: customer.company,
      phone: customer.phone,
      email: customer.email,
      city: customer.city,
      state: customer.state,
      industry: customer.industry,
      relationship: customer._count,
    })),
  });
}
