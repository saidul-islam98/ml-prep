/**
 * Allowlisted diagnostic builder (WEBAPP_SPEC.md section 16): the copied
 * diagnostic contains only the app version, route, error code/class, browser
 * family, and timestamp - never free-form messages, URLs, user content,
 * email, or tokens.
 */

export const DIAGNOSTIC_VERSION = "0.1.0";

export interface DiagnosticInput {
  error: unknown;
  route: string;
  userAgent: string;
  now?: Date;
}

const BROWSER_FAMILIES: [RegExp, string][] = [
  [/Edg\//, "Edge"],
  [/Firefox\//, "Firefox"],
  [/Chrome\//, "Chrome"],
  [/Safari\//, "Safari"],
];

export function browserFamily(userAgent: string): string {
  for (const [pattern, name] of BROWSER_FAMILIES) {
    if (pattern.test(userAgent)) return name;
  }
  return "unknown";
}

/** Only the error's class name is allowlisted - never its message. */
export function errorClass(error: unknown): string {
  if (error instanceof Error) return error.name;
  return typeof error === "object" && error !== null
    ? (error.constructor?.name ?? "UnknownError")
    : typeof error;
}

/** Strip any query string from a hash route: routes stay, params go. */
export function safeRoute(route: string): string {
  return route.split("?")[0] ?? route;
}

export function buildDiagnostic(input: DiagnosticInput): string {
  const diagnostic = {
    app: "ml-prep",
    version: DIAGNOSTIC_VERSION,
    route: safeRoute(input.route),
    errorClass: errorClass(input.error),
    browser: browserFamily(input.userAgent),
    timestamp: (input.now ?? new Date()).toISOString(),
  };
  return JSON.stringify(diagnostic, null, 2);
}
