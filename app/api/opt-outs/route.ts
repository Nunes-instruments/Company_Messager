import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { optOutSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  const customerId = request.nextUrl.searchParams.get("customerId");
  const optOuts = await db.optOut.findMany({
    where: customerId ? { customerId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 250,
  });
  return NextResponse.json({ optOuts });
}

export async function POST(request: NextRequest) {
  const parsed = optOutSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid opt-out data", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const optOut = await db.optOut.upsert({
    where: {
      customerId_channel: {
        customerId: parsed.data.customerId,
        channel: parsed.data.channel,
      },
    },
    create: parsed.data,
    update: { reason: parsed.data.reason },
  });

  if (parsed.data.channel === "WHATSAPP") {
    await db.customer.update({
      where: { id: parsed.data.customerId },
      data: { consentWhatsApp: false },
    });
  } else if (parsed.data.channel === "EMAIL") {
    await db.customer.update({
      where: { id: parsed.data.customerId },
      data: { consentEmail: false },
    });
  } else {
    await db.customer.update({
      where: { id: parsed.data.customerId },
      data: { consentPush: false },
    });
  }

  return NextResponse.json({ optOut }, { status: 201 });
}
