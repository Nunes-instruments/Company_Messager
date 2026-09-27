export type ReplyIntent =
  | "INTERESTED"
  | "QUOTATION"
  | "SERVICE"
  | "CALIBRATION"
  | "NOT_INTERESTED"
  | "GENERAL";

const patterns: Array<{ intent: ReplyIntent; words: string[] }> = [
  {
    intent: "QUOTATION",
    words: [
      "quotation",
      "quote",
      "price",
      "send price",
      "best price",
      "offer",
      "proforma",
      "pi",
    ],
  },
  {
    intent: "CALIBRATION",
    words: [
      "calibration",
      "calibrate",
      "certificate",
      "nabl",
      "due calibration",
    ],
  },
  {
    intent: "SERVICE",
    words: [
      "service",
      "repair",
      "problem",
      "not working",
      "fault",
      "error",
      "maintenance",
    ],
  },
  {
    intent: "NOT_INTERESTED",
    words: [
      "not interested",
      "no thanks",
      "no thank",
      "don't need",
      "do not need",
      "stop",
      "unsubscribe",
    ],
  },
  {
    intent: "INTERESTED",
    words: [
      "interested",
      "yes",
      "need",
      "required",
      "requirement",
      "send details",
      "share details",
      "call me",
      "contact me",
      "available",
    ],
  },
];

export function detectReplyIntent(text: string): ReplyIntent {
  const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();

  for (const rule of patterns) {
    if (rule.words.some((word) => normalized.includes(word))) {
      return rule.intent;
    }
  }

  return "GENERAL";
}

export function leadTypeFromIntent(
  intent: ReplyIntent,
  campaignType?: string | null
): "PRODUCT" | "SERVICE" | "CALIBRATION" | null {
  if (intent === "SERVICE") return "SERVICE";
  if (intent === "CALIBRATION") return "CALIBRATION";

  if (intent === "INTERESTED" || intent === "QUOTATION") {
    if (campaignType === "SERVICE") return "SERVICE";
    if (campaignType === "CALIBRATION") return "CALIBRATION";
    return "PRODUCT";
  }

  return null;
}

export function isPositiveIntent(intent: ReplyIntent) {
  return ["INTERESTED", "QUOTATION", "SERVICE", "CALIBRATION"].includes(intent);
}
