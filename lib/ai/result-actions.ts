export const quickActions = ["shorter", "warmer", "professional", "another"] as const;
export type QuickAction = typeof quickActions[number];

export function isQuickAction(value: unknown): value is QuickAction {
  return typeof value === "string" && (quickActions as readonly string[]).includes(value);
}

export const quickActionInstruction: Record<QuickAction, string> = {
  shorter: "Make the current result meaningfully shorter while preserving all important facts and required actions.",
  warmer: "Make the current result warmer and more human without becoming casual, adding promises, or changing facts.",
  professional: "Make the current result more professional, precise, and polished without adding facts or unnecessary jargon.",
  another: "Create a genuinely different version with a fresh wording or structure while preserving the same facts, intent, and constraints."
};
