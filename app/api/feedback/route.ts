import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type FeedbackType =
  | "useful"
  | "deeper"
  | "not_relevant"
  | "action_done"
  | "action_not_done"
  | "hard"
  | "not_interested"
  | "less_anxious"
  | "different"
  | "done"
  | "not_done"
  | "not_executed"
  | "less_relevant";

type NormalizedFeedbackType =
  | "useful"
  | "deeper"
  | "not_relevant"
  | "action_done"
  | "action_not_done"
  | "hard"
  | "less_anxious"
  | "different";

type RequestBody = {
  subscriber_id?: string | null;
  email?: string | null;
  subscriber_email?: string | null;

  newsletter_item_id?: number | string | null;
  item_id?: number | string | null;

  type?: string | null;
  feedback_type?: string | null;

  action_done?: boolean | string | null;
  free_text?: string | null;

  feedback_id?: number | string | null;
};

type SaveFeedbackInput = {
  subscriberId: string | null;
  subscriberEmail: string | null;
  newsletterItemId: number | null;
  feedbackType: NormalizedFeedbackType;
  actionDone: boolean | null;
  freeText: string | null;
};

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

function normalizeText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeEmail(value: unknown) {
  return normalizeText(value).toLowerCase();
}

function parseNumberId(value: unknown) {
  if (value === null || value === undefined || value === "") return null;

  const numeric = Number(value);

  if (!numeric || Number.isNaN(numeric)) return null;

  return numeric;
}

function parseBoolean(value: unknown) {
  if (typeof value === "boolean") return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") return true;
    if (normalized === "false") return false;
    if (normalized === "1") return true;
    if (normalized === "0") return false;
    if (normalized === "yes") return true;
    if (normalized === "no") return false;
  }

  return null;
}

function normalizeFeedbackType(
  value: unknown
): NormalizedFeedbackType | null {
  const raw = normalizeText(value) as FeedbackType | "";

  if (!raw) return null;

  if (raw === "done") return "action_done";
  if (raw === "not_done") return "action_not_done";
  if (raw === "not_executed") return "action_not_done";
  if (raw === "not_interested") return "not_relevant";
  if (raw === "less_relevant") return "not_relevant";

  if (
    raw === "useful" ||
    raw === "deeper" ||
    raw === "not_relevant" ||
    raw === "action_done" ||
    raw === "action_not_done" ||
    raw === "hard" ||
    raw === "less_anxious" ||
    raw === "different"
  ) {
    return raw;
  }

  return null;
}

function getActionDoneValue({
  feedbackType,
  bodyActionDone,
}: {
  feedbackType: NormalizedFeedbackType;
  bodyActionDone?: boolean | string | null;
}) {
  if (feedbackType === "action_done") return true;
  if (feedbackType === "action_not_done") return false;

  const parsed = parseBoolean(bodyActionDone);

  if (parsed !== null) {
    return parsed;
  }

  return null;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getFeedbackCopy(feedbackType: NormalizedFeedbackType) {
  if (feedbackType === "useful") {
    return {
      eyebrow: "자료 평가 저장 완료",
      title: "좋아요. 비슷한 방향을 더 반영할게요.",
      shortTitle: "좋음",
      message:
        "이 자료가 도움이 되었다는 신호로 저장했습니다. 다음 브리프에서는 비슷한 주제, 난이도, 관점의 자료 점수를 더 높입니다.",
      nextBriefChange: "비슷한 자료 추천 점수 상승",
      actionMeaning: "자료 방향 선호도에 반영",
      accent: "#2563eb",
      background: "#eff6ff",
      border: "#bfdbfe",
      emoji: "👍",
    };
  }

  if (feedbackType === "deeper") {
    return {
      eyebrow: "자료 평가 저장 완료",
      title: "더 깊게 볼게요.",
      shortTitle: "더 깊게",
      message:
        "이 주제에 더 깊은 해석이 필요하다는 신호로 저장했습니다. 다음에는 심화 자료나 맥락 설명을 더 우선하겠습니다.",
      nextBriefChange: "심화 자료와 추가 맥락 점수 상승",
      actionMeaning: "관심 주제의 깊이 조절에 반영",
      accent: "#7c3aed",
      background: "#f5f3ff",
      border: "#ddd6fe",
      emoji: "🔎",
    };
  }

  if (feedbackType === "not_relevant") {
    return {
      eyebrow: "자료 평가 저장 완료",
      title: "맞지 않았군요. 다음에는 낮춰볼게요.",
      shortTitle: "별로",
      message:
        "이 자료가 지금 상황과 맞지 않았다는 신호로 저장했습니다. 다음 브리프에서는 이 방향의 추천 점수를 낮춥니다.",
      nextBriefChange: "맞지 않은 자료 방향 점수 하락",
      actionMeaning: "자료 적합도 조절에 반영",
      accent: "#dc2626",
      background: "#fef2f2",
      border: "#fecaca",
      emoji: "↘️",
    };
  }

  if (feedbackType === "action_done") {
    return {
      eyebrow: "실행 피드백 저장 완료",
      title: "실행까지 해봤군요. 이게 제일 중요합니다.",
      shortTitle: "실행해봄",
      message:
        "AI-FU가 가장 중요하게 보는 신호입니다. 다음에는 실제 행동으로 이어질 가능성이 높은 자료와 Action hint를 더 우선합니다.",
      nextBriefChange: "실행 가능한 자료와 Action hint 점수 상승",
      actionMeaning: "실행 가능성 학습에 강하게 반영",
      accent: "#059669",
      background: "#ecfdf5",
      border: "#a7f3d0",
      emoji: "✅",
    };
  }

  if (feedbackType === "action_not_done") {
    return {
      eyebrow: "실행 피드백 저장 완료",
      title: "아직 실행하지 않았군요. 더 작게 쪼개볼게요.",
      shortTitle: "실행안해봄",
      message:
        "자료는 괜찮아도 행동이 부담스러웠을 수 있습니다. 다음에는 더 짧고 구체적인 Action hint로 조정할 수 있게 반영합니다.",
      nextBriefChange: "Action hint 난이도와 시간 부담 조정",
      actionMeaning: "실행 장벽 조절에 반영",
      accent: "#4b5563",
      background: "#f9fafb",
      border: "#d1d5db",
      emoji: "⏸️",
    };
  }

  if (feedbackType === "hard") {
    return {
      eyebrow: "난이도 피드백 저장 완료",
      title: "어렵게 느껴졌군요. 더 쉽게 맞춰볼게요.",
      shortTitle: "어려움",
      message:
        "난이도가 높았다는 신호로 저장했습니다. 다음에는 설명을 더 쉽게 하고, 입문 자료의 점수를 높이겠습니다.",
      nextBriefChange: "난이도 하향 조정",
      actionMeaning: "설명 수준 조절에 반영",
      accent: "#d97706",
      background: "#fffbeb",
      border: "#fde68a",
      emoji: "🧩",
    };
  }

  if (feedbackType === "less_anxious") {
    return {
      eyebrow: "감정 피드백 저장 완료",
      title: "불안이 줄었다니 좋아요.",
      shortTitle: "불안 감소",
      message:
        "균형 잡힌 해석이 도움이 되었다는 신호로 저장했습니다. 다음에도 불안을 줄이고 판단을 돕는 자료를 더 반영하겠습니다.",
      nextBriefChange: "균형 관점 자료 점수 상승",
      actionMeaning: "AI 감정 상태 조절에 반영",
      accent: "#0891b2",
      background: "#ecfeff",
      border: "#a5f3fc",
      emoji: "🌤️",
    };
  }

  if (feedbackType === "different") {
    return {
      eyebrow: "방향 피드백 저장 완료",
      title: "다른 방향이 필요하군요.",
      shortTitle: "다른 방향",
      message:
        "현재 자료 방향이 원하는 목적과 다르다는 신호로 저장했습니다. 다음 브리프에서는 카테고리와 주제 우선순위를 조정합니다.",
      nextBriefChange: "자료 카테고리 우선순위 조정",
      actionMeaning: "관심 방향 재조정에 반영",
      accent: "#9333ea",
      background: "#faf5ff",
      border: "#e9d5ff",
      emoji: "🧭",
    };
  }

  return {
    eyebrow: "피드백 저장 완료",
    title: "피드백이 저장되었습니다.",
    shortTitle: "저장 완료",
    message: "다음 브리프에 반영할게요.",
    nextBriefChange: "다음 추천에 반영",
    actionMeaning: "개인화 신호에 반영",
    accent: "#111827",
    background: "#f9fafb",
    border: "#d1d5db",
    emoji: "💬",
  };
}

function getFeedbackGroupLabel(feedbackType: NormalizedFeedbackType) {
  if (
    feedbackType === "useful" ||
    feedbackType === "deeper" ||
    feedbackType === "not_relevant" ||
    feedbackType === "hard" ||
    feedbackType === "less_anxious" ||
    feedbackType === "different"
  ) {
    return "자료 평가";
  }

  return "실행 여부";
}

function buildHtmlPage({
  feedbackType,
  feedbackId,
  subscriberId,
  subscriberEmail,
  newsletterItemId,
  freeTextSaved,
}: {
  feedbackType: NormalizedFeedbackType;
  feedbackId: number | null;
  subscriberId: string | null;
  subscriberEmail: string | null;
  newsletterItemId: number | null;
  freeTextSaved?: boolean;
}) {
  const copy = getFeedbackCopy(feedbackType);
  const groupLabel = getFeedbackGroupLabel(feedbackType);

  const hiddenInputs = `
    <input type="hidden" name="subscriber_id" value="${escapeHtml(
      subscriberId || ""
    )}" />
    <input type="hidden" name="subscriber_email" value="${escapeHtml(
      subscriberEmail || ""
    )}" />
    <input type="hidden" name="newsletter_item_id" value="${escapeHtml(
      newsletterItemId ? String(newsletterItemId) : ""
    )}" />
    <input type="hidden" name="type" value="${escapeHtml(feedbackType)}" />
    <input type="hidden" name="feedback_id" value="${escapeHtml(
      feedbackId ? String(feedbackId) : ""
    )}" />
  `;

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>AI-FU 피드백 저장 완료</title>
</head>
<body style="margin:0;background:linear-gradient(135deg,#020617 0%,#0f172a 42%,#111827 100%);font-family:Arial,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;color:#111827;">
  <main style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:34px 18px;">
    <section style="width:100%;max-width:720px;">
      <div style="margin-bottom:16px;color:#bfdbfe;font-size:14px;font-weight:900;">
        AI-FU Feedback
      </div>

      <section style="background:#ffffff;border-radius:28px;padding:28px;box-shadow:0 24px 70px rgba(0,0,0,0.35);">
        <div style="padding:22px;border-radius:22px;background:${copy.background};border:1px solid ${copy.border};">
          <div style="display:flex;align-items:flex-start;gap:16px;">
            <div style="width:52px;height:52px;border-radius:18px;background:#ffffff;display:flex;align-items:center;justify-content:center;font-size:28px;box-shadow:0 8px 22px rgba(15,23,42,0.08);">
              ${copy.emoji}
            </div>

            <div style="flex:1;min-width:0;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:900;color:${copy.accent};">
                ${copy.eyebrow}
              </p>

              <h1 style="margin:0;font-size:30px;line-height:1.28;letter-spacing:-0.055em;color:#111827;">
                ${copy.title}
              </h1>

              <p style="margin:14px 0 0;font-size:16px;line-height:1.75;color:#374151;word-break:keep-all;">
                ${copy.message}
              </p>
            </div>
          </div>
        </div>

        ${
          freeTextSaved
            ? `
              <div style="margin-top:18px;padding:15px;border-radius:16px;background:#ecfdf5;border:1px solid #a7f3d0;color:#047857;font-size:14px;font-weight:900;line-height:1.6;">
                추가 의견까지 저장되었습니다.
              </div>
            `
            : ""
        }

        <section style="margin-top:20px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;">
          <div style="padding:15px;border-radius:16px;background:#f8fafc;border:1px solid #e5e7eb;">
            <p style="margin:0 0 6px;font-size:12px;font-weight:900;color:#64748b;">
              저장된 피드백
            </p>
            <p style="margin:0;font-size:15px;font-weight:950;line-height:1.45;color:#111827;">
              ${escapeHtml(copy.shortTitle)}
            </p>
          </div>

          <div style="padding:15px;border-radius:16px;background:#f8fafc;border:1px solid #e5e7eb;">
            <p style="margin:0 0 6px;font-size:12px;font-weight:900;color:#64748b;">
              반영 영역
            </p>
            <p style="margin:0;font-size:15px;font-weight:950;line-height:1.45;color:#111827;">
              ${escapeHtml(groupLabel)}
            </p>
          </div>

          <div style="padding:15px;border-radius:16px;background:#f8fafc;border:1px solid #e5e7eb;">
            <p style="margin:0 0 6px;font-size:12px;font-weight:900;color:#64748b;">
              다음 변화
            </p>
            <p style="margin:0;font-size:15px;font-weight:950;line-height:1.45;color:#111827;word-break:keep-all;">
              ${escapeHtml(copy.nextBriefChange)}
            </p>
          </div>
        </section>

        <section style="margin-top:20px;padding:20px;border-radius:20px;background:#111827;color:#ffffff;">
          <p style="margin:0 0 8px;font-size:14px;font-weight:900;color:#93c5fd;">
            이 피드백이 하는 일
          </p>
          <h2 style="margin:0;font-size:22px;line-height:1.35;letter-spacing:-0.04em;">
            다음 브리프가 조금 더 당신 쪽으로 움직입니다.
          </h2>
          <p style="margin:12px 0 0;font-size:14px;line-height:1.75;color:#d1d5db;word-break:keep-all;">
            AI-FU는 피드백을 기준으로 자료 선택, 난이도, Action hint의 크기, 주제 방향을 조정합니다.
            지금 누른 버튼은 <strong style="color:#ffffff;">${escapeHtml(
              copy.actionMeaning
            )}</strong>됩니다.
          </p>
        </section>

        <form method="POST" action="/api/feedback" style="margin-top:22px;">
          ${hiddenInputs}

          <label style="display:block;font-size:15px;font-weight:950;color:#111827;margin-bottom:8px;">
            추가로 남길 말이 있나요?
          </label>

          <p style="margin:0 0 12px;font-size:13px;line-height:1.65;color:#6b7280;word-break:keep-all;">
            선택 버튼만으로 부족하면 한 줄만 남겨주세요. 예를 들어 “더 쉽게”, “실행 시간이 너무 김”, “이 주제 더 보고 싶음”처럼 적어도 됩니다.
          </p>

          <textarea
            name="free_text"
            rows="5"
            placeholder="예: 이 자료는 좋았지만 실행 시간이 더 짧으면 좋겠어요."
            style="width:100%;box-sizing:border-box;border:1px solid #d1d5db;border-radius:16px;padding:14px;font-size:15px;line-height:1.6;resize:vertical;outline:none;"
          ></textarea>

          <button
            type="submit"
            style="margin-top:14px;width:100%;height:54px;border:none;border-radius:16px;background:#111827;color:#ffffff;font-size:16px;font-weight:950;cursor:pointer;"
          >
            추가 의견 저장
          </button>
        </form>

        <div style="margin-top:20px;padding-top:18px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;font-size:13px;line-height:1.7;color:#6b7280;text-align:center;word-break:keep-all;">
            이제 이 창은 닫아도 됩니다. 다음 AI-FU 브리프에서 이 피드백이 반영됩니다.
          </p>
        </div>
      </section>
    </section>
  </main>
</body>
</html>`;
}

function buildErrorHtmlPage(message: string) {
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>AI-FU 피드백 오류</title>
</head>
<body style="margin:0;background:linear-gradient(135deg,#020617 0%,#0f172a 42%,#111827 100%);font-family:Arial,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;color:#111827;">
  <main style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:34px 18px;">
    <section style="width:100%;max-width:600px;background:#ffffff;border-radius:28px;padding:28px;box-shadow:0 24px 70px rgba(0,0,0,0.35);">
      <div style="padding:22px;border-radius:22px;background:#fef2f2;border:1px solid #fecaca;">
        <p style="margin:0 0 8px;font-size:14px;font-weight:900;color:#dc2626;">
          AI-FU Feedback Error
        </p>
        <h1 style="margin:0;font-size:28px;line-height:1.35;letter-spacing:-0.05em;color:#111827;">
          피드백을 저장하지 못했습니다.
        </h1>
        <p style="margin:14px 0 0;font-size:15px;line-height:1.75;color:#374151;word-break:keep-all;">
          ${escapeHtml(message)}
        </p>
      </div>

      <p style="margin:18px 0 0;font-size:13px;line-height:1.7;color:#6b7280;text-align:center;">
        메일의 피드백 버튼을 다시 눌러보거나, 관리자 화면에서 저장 여부를 확인해주세요.
      </p>
    </section>
  </main>
</body>
</html>`;
}

async function readRequestBody(request: NextRequest): Promise<RequestBody> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      const body = await request.json();
      return body || {};
    } catch {
      return {};
    }
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();

    return {
      subscriber_id: normalizeText(formData.get("subscriber_id")),
      subscriber_email: normalizeText(formData.get("subscriber_email")),
      email: normalizeText(formData.get("email")),
      newsletter_item_id: normalizeText(formData.get("newsletter_item_id")),
      item_id: normalizeText(formData.get("item_id")),
      type: normalizeText(formData.get("type")),
      feedback_type: normalizeText(formData.get("feedback_type")),
      action_done: normalizeText(formData.get("action_done")),
      free_text: normalizeText(formData.get("free_text")),
      feedback_id: normalizeText(formData.get("feedback_id")),
    };
  }

  return {};
}

async function findSubscriberIdByEmail({
  supabase,
  email,
}: {
  supabase: ReturnType<typeof getSupabaseAdminClient>;
  email: string;
}) {
  if (!email) return null;

  const { data, error } = await supabase
    .from("subscribers")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data?.id || null;
}

async function saveFeedback({
  subscriberId,
  subscriberEmail,
  newsletterItemId,
  feedbackType,
  actionDone,
  freeText,
}: SaveFeedbackInput) {
  const supabase = getSupabaseAdminClient();

  const resolvedSubscriberId =
    subscriberId ||
    (subscriberEmail
      ? await findSubscriberIdByEmail({
          supabase,
          email: subscriberEmail,
        })
      : null);

  const insertPayload = {
    subscriber_id: resolvedSubscriberId,
    subscriber_email: subscriberEmail,
    newsletter_item_id: newsletterItemId,
    feedback_type: feedbackType,
    action_done: actionDone,
    free_text: freeText,
  };

  const { data, error } = await supabase
    .from("feedbacks")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data?.id ? Number(data.id) : null;
}

async function updateFeedbackFreeText({
  feedbackId,
  freeText,
}: {
  feedbackId: number;
  freeText: string;
}) {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("feedbacks")
    .update({
      free_text: freeText,
    })
    .eq("id", feedbackId)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.id ? Number(data.id) : feedbackId;
}

function shouldReturnHtml(request: NextRequest) {
  const accept = request.headers.get("accept") || "";
  return accept.includes("text/html") || accept.includes("*/*");
}

function makeHtmlResponse(html: string, status = 200) {
  return new NextResponse(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
    },
  });
}

function getFeedbackParamsFromSearchParams(searchParams: URLSearchParams) {
  const subscriberId = normalizeText(searchParams.get("subscriber_id")) || null;

  const subscriberEmail =
    normalizeEmail(searchParams.get("email")) ||
    normalizeEmail(searchParams.get("subscriber_email")) ||
    null;

  const newsletterItemId =
    parseNumberId(searchParams.get("newsletter_item_id")) ||
    parseNumberId(searchParams.get("item_id"));

  const feedbackType = normalizeFeedbackType(
    searchParams.get("type") || searchParams.get("feedback_type")
  );

  const freeText = normalizeText(searchParams.get("free_text")) || null;

  const feedbackId = parseNumberId(searchParams.get("feedback_id"));

  return {
    subscriberId,
    subscriberEmail,
    newsletterItemId,
    feedbackType,
    freeText,
    feedbackId,
  };
}

function getFeedbackParamsFromBody(body: RequestBody) {
  const subscriberId = normalizeText(body.subscriber_id) || null;

  const subscriberEmail =
    normalizeEmail(body.subscriber_email) || normalizeEmail(body.email) || null;

  const newsletterItemId =
    parseNumberId(body.newsletter_item_id) || parseNumberId(body.item_id);

  const feedbackType = normalizeFeedbackType(body.type || body.feedback_type);

  const freeText = normalizeText(body.free_text) || null;

  const feedbackId = parseNumberId(body.feedback_id);

  return {
    subscriberId,
    subscriberEmail,
    newsletterItemId,
    feedbackType,
    freeText,
    feedbackId,
  };
}

export async function GET(request: NextRequest) {
  try {
    const {
      subscriberId,
      subscriberEmail,
      newsletterItemId,
      feedbackType,
      freeText,
      feedbackId,
    } = getFeedbackParamsFromSearchParams(request.nextUrl.searchParams);

    if (!feedbackType) {
      const message = "올바른 feedback type이 필요합니다.";

      return makeHtmlResponse(buildErrorHtmlPage(message), 400);
    }

    const actionDone = getActionDoneValue({
      feedbackType,
    });

    let savedFeedbackId = feedbackId;

    if (feedbackId && freeText) {
      savedFeedbackId = await updateFeedbackFreeText({
        feedbackId,
        freeText,
      });
    } else {
      savedFeedbackId = await saveFeedback({
        subscriberId,
        subscriberEmail,
        newsletterItemId,
        feedbackType,
        actionDone,
        freeText,
      });
    }

    const html = buildHtmlPage({
      feedbackType,
      feedbackId: savedFeedbackId,
      subscriberId,
      subscriberEmail,
      newsletterItemId,
      freeTextSaved: Boolean(freeText),
    });

    return new NextResponse(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "x-feedback-id": savedFeedbackId ? String(savedFeedbackId) : "",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";

    return makeHtmlResponse(buildErrorHtmlPage(message), 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readRequestBody(request);

    const {
      subscriberId,
      subscriberEmail,
      newsletterItemId,
      feedbackType,
      freeText,
      feedbackId,
    } = getFeedbackParamsFromBody(body);

    if (!feedbackType) {
      const message = "올바른 feedback type이 필요합니다.";

      if (shouldReturnHtml(request)) {
        return makeHtmlResponse(buildErrorHtmlPage(message), 400);
      }

      return NextResponse.json(
        {
          ok: false,
          message,
        },
        { status: 400 }
      );
    }

    const actionDone = getActionDoneValue({
      feedbackType,
      bodyActionDone: body.action_done,
    });

    let savedFeedbackId = feedbackId;

    if (feedbackId && freeText) {
      savedFeedbackId = await updateFeedbackFreeText({
        feedbackId,
        freeText,
      });
    } else {
      savedFeedbackId = await saveFeedback({
        subscriberId,
        subscriberEmail,
        newsletterItemId,
        feedbackType,
        actionDone,
        freeText,
      });
    }

    if (shouldReturnHtml(request)) {
      const html = buildHtmlPage({
        feedbackType,
        feedbackId: savedFeedbackId,
        subscriberId,
        subscriberEmail,
        newsletterItemId,
        freeTextSaved: Boolean(freeText),
      });

      return new NextResponse(html, {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "x-feedback-id": savedFeedbackId ? String(savedFeedbackId) : "",
        },
      });
    }

    return NextResponse.json({
      ok: true,
      message: "피드백이 저장되었습니다.",
      feedback_id: savedFeedbackId,
      feedback_type: feedbackType,
      action_done: actionDone,
      subscriber_id: subscriberId,
      subscriber_email: subscriberEmail,
      newsletter_item_id: newsletterItemId,
      free_text_saved: Boolean(freeText),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";

    if (shouldReturnHtml(request)) {
      return makeHtmlResponse(buildErrorHtmlPage(message), 500);
    }

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status: 500 }
    );
  }
}