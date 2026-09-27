import { Channel } from "@prisma/client";

export type ProviderSendInput = {
  channel: Channel;
  customerId: string;
  recipient: string;
  body: string;
  subject?: string | null;
};

export type ProviderSendResult = {
  ok: boolean;
  externalId?: string;
  error?: string;
};

export function providerConfigured(channel: Channel) {
  if (channel === "NUNES_CONNECT") return true;
  if (channel === "EMAIL") {
    return Boolean(
      process.env.EMAIL_PROVIDER &&
      process.env.EMAIL_FROM &&
      process.env.EMAIL_API_KEY
    );
  }
  if (channel === "WHATSAPP") {
    return Boolean(
      process.env.WHATSAPP_PROVIDER &&
      process.env.WHATSAPP_ACCESS_TOKEN &&
      process.env.WHATSAPP_PHONE_NUMBER_ID
    );
  }
  return false;
}

export async function sendThroughExternalProvider(
  input: ProviderSendInput
): Promise<ProviderSendResult> {
  if (input.channel === "NUNES_CONNECT") {
    return { ok: true };
  }

  if (!providerConfigured(input.channel)) {
    return {
      ok: false,
      error: `${input.channel} provider is not configured`,
    };
  }

  // Provider-specific HTTP delivery will be implemented when the approved
  // provider credentials are connected. Do not report a message as sent
  // until an external provider returns a real delivery/message identifier.
  return {
    ok: false,
    error: `${input.channel} provider adapter is not implemented yet`,
  };
}
