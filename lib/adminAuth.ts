import { timingSafeEqual } from "crypto";

// 관리자 시크릿 비교 및 실패 시도 제한을 한 곳에서 관리합니다.

// 상수 시간 비교: 시크릿 값에 따라 응답 시간이 달라지지 않도록 합니다.
export function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(String(a ?? ""), "utf8");
  const bb = Buffer.from(String(b ?? ""), "utf8");

  if (ab.length !== bb.length) {
    // 길이가 다르면 즉시 false지만, 타이밍 차이를 줄이기 위해 동일 길이 비교를 한 번 수행합니다.
    timingSafeEqual(ab, ab);
    return false;
  }

  return timingSafeEqual(ab, bb);
}

type Bucket = { count: number; resetAt: number };

// in-memory 제한. 서버리스에서는 인스턴스별로만 유지되어 완벽하지 않지만,
// 무제한 브루트포스를 막는 1차 방어선입니다. 강한 보호가 필요하면 Upstash 등
// 외부 스토어로 승격하세요.
const failureBuckets = new Map<string, Bucket>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILURES = 10;

type HeaderReadable = { headers: { get(name: string): string | null } };

export function getClientIp(request: HeaderReadable): string {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const first = forwarded.split(",")[0].trim();

  return first || request.headers.get("x-real-ip") || "unknown";
}

export function isRateLimited(ip: string): boolean {
  const bucket = failureBuckets.get(ip);
  if (!bucket) return false;

  if (Date.now() > bucket.resetAt) {
    failureBuckets.delete(ip);
    return false;
  }

  return bucket.count >= MAX_FAILURES;
}

export function recordFailure(ip: string): void {
  const now = Date.now();
  const bucket = failureBuckets.get(ip);

  if (!bucket || now > bucket.resetAt) {
    failureBuckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  bucket.count += 1;
}

export function recordSuccess(ip: string): void {
  failureBuckets.delete(ip);
}
