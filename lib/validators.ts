import { z } from "zod";

export const customerCreateSchema = z.object({
  name: z.string().min(2).max(120),
  company: z.string().max(160).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  email: z.string().email().optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().default("India"),
  industry: z.string().max(120).optional().nullable(),
  consentWhatsApp: z.boolean().optional().default(false),
  consentEmail: z.boolean().optional().default(false),
  consentPush: z.boolean().optional().default(false),
});

export const conversationCreateSchema = z.object({
  customerId: z.string().min(1),
  channel: z.enum(["NUNES_CONNECT", "EMAIL", "WHATSAPP"]),
  assignedUserId: z.string().optional().nullable(),
});

export const messageCreateSchema = z.object({
  conversationId: z.string().min(1),
  direction: z.enum(["INBOUND", "OUTBOUND"]),
  channel: z.enum(["NUNES_CONNECT", "EMAIL", "WHATSAPP"]),
  body: z.string().min(1).max(10000),
  senderUserId: z.string().optional().nullable(),
});

export const leadCreateSchema = z.object({
  customerId: z.string().min(1),
  conversationId: z.string().optional().nullable(),
  type: z.enum(["PRODUCT", "SERVICE", "CALIBRATION"]),
  requirement: z.string().min(2).max(5000),
  assignedUserId: z.string().optional().nullable(),
  source: z.string().max(100).optional().nullable(),
});
