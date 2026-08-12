export type ProtectedText = {
  value: string;
  findings: string[];
};

const protectionPatterns: Array<{
  label: string;
  pattern: RegExp;
  replacement: string;
}> = [
  {
    label: "Private Key",
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g,
    replacement: "[REDACTED_PRIVATE_KEY]",
  },
  {
    label: "Bearer Token",
    pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{10,}/gi,
    replacement: "Bearer [REDACTED_TOKEN]",
  },
  {
    label: "API Key",
    pattern: /\b(?:sk|rk|pk|airk)_(?:live|test|proj)?_?[A-Za-z0-9_-]{12,}/gi,
    replacement: "[REDACTED_API_KEY]",
  },
  {
    label: "Payment Card",
    pattern: /\b(?:\d[ -]*?){13,19}\b/g,
    replacement: "[REDACTED_CARD]",
  },
  {
    label: "Email",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    replacement: "[REDACTED_EMAIL]",
  },
  {
    label: "Phone Number",
    pattern: /(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g,
    replacement: "[REDACTED_PHONE]",
  },
  {
    label: "Government ID",
    pattern: /\b(?:SSN|TIN|EIN|ID|Government ID)[:#]?\s*[A-Z0-9-]{6,}\b/gi,
    replacement: "[REDACTED_ID]",
  },
];

export function protectCapturedText(value: string | null | undefined): ProtectedText {
  if (!value) {
    return {
      value: "",
      findings: [],
    };
  }

  const findings = new Set<string>();
  let protectedValue = value;

  for (const { label, pattern, replacement } of protectionPatterns) {
    protectedValue = protectedValue.replace(pattern, (match) => {
      findings.add(label);
      return preserveShortMaskedValues(match, replacement);
    });
  }

  return {
    value: protectedValue,
    findings: [...findings],
  };
}

export function protectOptionalCapturedText(value: string | null | undefined) {
  const protectedText = protectCapturedText(value);
  return value == null ? null : protectedText.value;
}

export function protectCapturedFields(fields: {
  prompt: string;
  output: string;
  ragContext: string;
  toolCall?: string | null;
}) {
  const prompt = protectCapturedText(fields.prompt);
  const output = protectCapturedText(fields.output);
  const ragContext = protectCapturedText(fields.ragContext);
  const toolCall = protectCapturedText(fields.toolCall ?? "");
  const findings = new Set([
    ...prompt.findings,
    ...output.findings,
    ...ragContext.findings,
    ...toolCall.findings,
  ]);

  return {
    prompt: prompt.value,
    output: output.value,
    ragContext: ragContext.value,
    toolCall: fields.toolCall ? toolCall.value : null,
    findings: [...findings],
    mode: "masked" as const,
  };
}

export function dataProtectionMeta(findings: string[] = []) {
  return {
    mode: "masked",
    rawContentAvailable: false,
    appliedFindings: findings,
  };
}

function preserveShortMaskedValues(match: string, replacement: string) {
  if (replacement === "[REDACTED_CARD]") {
    const digits = match.replace(/\D/g, "");
    return digits.length >= 4 ? `[REDACTED_CARD_${digits.slice(-4)}]` : replacement;
  }

  return replacement;
}
