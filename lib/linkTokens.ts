import { createHmac, timingSafeEqual } from "crypto";

// 이메일에 담기는 unsubscribe / feedback 링크를 위조 불가능하게 서명합니다.
// 서명 키는 LINK_SIGNING_SECRET을 우선 사용하고, 없으면 서버 전용인 ADMIN_SECRET을
// 재사용합니다(둘 다 클라이언트에 노출되지 않습니다). 링크 위·변조 방지가 목적이라
// 별도 env가 없어도 배포가 깨지지 않도록 fallback을 둡니다.
function getSigningSecret(): string {
  return process.env.LINK_SIGNING_SECRET || process.env.ADMIN_SECRET || "";
}

function sign(payload: string): string {
  const secret = getSigningSecret();

  if (!secret) {
    throw new Error("링크 서명 키가 없습니다. LINK_SIGNING_SECRET 또는 ADMIN_SECRET을 설정하세요.");
  }

  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function verify(payload: string, token: string | null | undefined): boolean {
  if (!token) return false;

  const secret = getSigningSecret();
  if (!secret) return false;

  let expected: Buffer;
  let provided: Buffer;

  try {
    expected = createHmac("sha256", secret).update(payload).digest();
    provided = Buffer.from(token, "base64url");
  } catch {
    return false;
  }

  if (expected.length !== provided.length) return false;

  return timingSafeEqual(expected, provided);
}

function normalizeEmail(email: string): string {
  return String(email ?? "").trim().toLowerCase();
}

export function unsubscribeToken(email: string): string {
  return sign(`unsubscribe:${normalizeEmail(email)}`);
}

export function verifyUnsubscribeToken(
  email: string,
  token: string | null | undefined
): boolean {
  return verify(`unsubscribe:${normalizeEmail(email)}`, token);
}

function feedbackPayload(subscriberId: string, itemId: number | string | null): string {
  return `feedback:${String(subscriberId ?? "")}:${String(itemId ?? "")}`;
}

export function feedbackToken(input: {
  subscriberId: string;
  itemId: number | string | null;
}): string {
  return sign(feedbackPayload(input.subscriberId, input.itemId));
}

export function verifyFeedbackToken(
  input: { subscriberId: string | null; itemId: number | string | null },
  token: string | null | undefined
): boolean {
  if (!input.subscriberId) return false;
  return verify(feedbackPayload(input.subscriberId, input.itemId), token);
}
