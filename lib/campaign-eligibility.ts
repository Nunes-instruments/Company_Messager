import { Channel, Customer } from "@prisma/client";

type CustomerWithOptOuts = Customer & {
  optOuts?: { channel: Channel }[];
};

export function canContactCustomer(
  customer: CustomerWithOptOuts,
  channel: Channel
) {
  if (customer.status === "DO_NOT_CONTACT") return false;
  if (customer.optOuts?.some((item) => item.channel === channel)) return false;

  if (channel === "WHATSAPP") {
    return Boolean(customer.consentWhatsApp && customer.phone?.trim());
  }

  if (channel === "EMAIL") {
    return Boolean(customer.consentEmail && customer.email?.trim());
  }

  if (channel === "NUNES_CONNECT") {
    return customer.consentPush;
  }

  return false;
}
