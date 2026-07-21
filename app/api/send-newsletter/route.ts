import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { feedbackToken, unsubscribeToken } from "@/lib/linkTokens";
import {
  timingSafeEqualStr,
  getClientIp,
  isRateLimited,
  recordFailure,
  recordSuccess,
} from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

type CategoryGroupKey =
  | "ai_emotion"
  | "ai_intent"
  | "blocker"
  | "action_time";

type Subscriber = {
  id: string;
  email: string;
  job_role: string | null;
  interest_area: string | null;
  purpose: string | null;
  difficulty: string | null;
  ai_emotion: string | null;
  ai_intent: string | null;
  blocker: string | null;
  action_time: string | null;
  persona_type: string | null;
  is_active: boolean | null;
  unsubscribed_at: string | null;
};

type SubscriberCategoryAnswer = {
  subscriber_id: string;
  group_key: CategoryGroupKey;
  option_value: string;
};

type NewsletterItem = {
  id: number;
  title: string | null;
  summary: string | null;
  url: string | null;
  source_url: string | null;
  main_summary: string | null;
  balance_summary: string | null;
  action_hint: string | null;

  target_user_state: string | null;
  target_persona: string | null;
  target_ai_emotion: string | null;
  target_ai_intent: string | null;
  target_blocker: string | null;
  target_action_time: string | null;

  category: string | null;
  difficulty: string | null;
  source_type: string | null;
  stance: string | null;
  is_active: boolean | null;
  is_sent: boolean | null;
  created_at: string | null;
};

type NewsletterItemCategoryTarget = {
  newsletter_item_id: number;
  group_key: CategoryGroupKey;
  option_value: string;
};

type Feedback = {
  id: number;
  subscriber_id: string | null;
  subscriber_email: string | null;
  newsletter_item_id: number | null;
  feedback_type: string | null;
  action_done: boolean | null;
  created_at: string | null;
};

type DeliveryLog = {
  subscriber_id: string | null;
  subscriber_email: string | null;
  newsletter_item_id: number | null;
  status: string | null;
  created_at: string | null;
};

type DailySendLock = {
  subscriber_id: string | null;
  subscriber_email: string | null;
  send_date_kst: string | null;
  status: string | null;
  created_at: string | null;
};

type RequestBody = {
  admin_secret?: string;
  mode?: "preview" | "test" | "full";
  test_email?: string;
};

type SubscriberAnswerMap = Record<CategoryGroupKey, string>;
type ItemTargetMap = Record<CategoryGroupKey, string[]>;

type ScoredItem = {
  item: NewsletterItem;
  score: number;
  matchedReasons: string[];
};

type FeedbackContext = {
  feedbacksBySubscriberKey: Record<string, Feedback[]>;
  feedbackItemsById: Record<number, NewsletterItem>;
  targetsByItemId: Record<number, ItemTargetMap>;
};

const CATEGORY_LABELS: Record<CategoryGroupKey, string> = {
  ai_emotion: "감정",
  ai_intent: "의도",
  blocker: "막힘",
  action_time: "행동 시간",
};

const VALUE_LABELS: Record<string, string> = {
  curious: "호기심",
  excited: "기대됨",
  anxious: "불안",
  fatigue: "정보가 너무 많아 피곤",
  skeptical: "회의적",
  unsure: "잘 모르겠음",

  not_sure: "아직 모름",
  work_efficiency: "업무 효율 높이기",
  service_building: "서비스나 사이트 만들기",
  learning: "공부나 자기계발",
  creative_writing: "글쓰기/창작",
  business_opportunity: "사업 기회나 돈 벌 기회",
  avoid_but_need: "피하고 싶으나 알아야겠음",

  too_much_info: "정보가 너무 많아 정리가 안됨",
  no_clear_start: "뭘 해야할 지 모르겠음",
  too_technical: "기술적인 내용이 어려움",
  no_time: "시간 없음",
  fear_of_falling_behind: "뒤처질까봐 불안",
  low_need: "아직 필요성을 모르겠음",

  "10min": "10분",
  "30min": "30분",
  "2hours": "2시간",
  half_day_weekend: "주말 반나절",

  easy: "입문",
  normal: "중간",
  expert: "심화",
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

function getSiteUrl() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";

  if (siteUrl.startsWith("http://") || siteUrl.startsWith("https://")) {
    return siteUrl.replace(/\/$/, "");
  }

  return `https://${siteUrl}`.replace(/\/$/, "");
}

async function readRequestBody(request: Request): Promise<RequestBody> {
  try {
    const body = await request.json();
    return body || {};
  } catch {
    return {};
  }
}

function getAdminSecretFromRequest(request: Request, body: RequestBody) {
  // 시크릿은 헤더 또는 본문에서만 받습니다. 쿼리스트링은 받지 않습니다.
  const headerSecret = request.headers.get("x-admin-secret");

  if (headerSecret) return headerSecret.trim();

  if (body.admin_secret) return String(body.admin_secret).trim();

  return "";
}

function verifyAdminSecret(request: Request, body: RequestBody) {
  const ip = getClientIp(request);

  if (isRateLimited(ip)) {
    return {
      ok: false,
      message: "너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.",
    };
  }

  const serverSecret = process.env.ADMIN_SECRET;

  if (!serverSecret) {
    return {
      ok: false,
      message: "서버에 ADMIN_SECRET이 설정되어 있지 않습니다.",
    };
  }

  const requestSecret = getAdminSecretFromRequest(request, body);

  if (!requestSecret) {
    return {
      ok: false,
      message: "ADMIN_SECRET이 필요합니다.",
    };
  }

  if (!timingSafeEqualStr(requestSecret, serverSecret)) {
    recordFailure(ip);
    return {
      ok: false,
      message: "ADMIN_SECRET이 올바르지 않습니다.",
    };
  }

  recordSuccess(ip);
  return {
    ok: true,
    message: "ok",
  };
}

function getKoreaToday() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
}

function isCategoryGroupKey(value: unknown): value is CategoryGroupKey {
  return (
    value === "ai_emotion" ||
    value === "ai_intent" ||
    value === "blocker" ||
    value === "action_time"
  );
}

function normalizeValue(value: string | null | undefined) {
  if (!value) return "";
  return String(value).trim();
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getReadableValue(value: string | null | undefined) {
  const normalized = normalizeValue(value);
  if (!normalized) return "";
  return VALUE_LABELS[normalized] || normalized;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// 메일 본문을 <html>/<head>로 감싸 color-scheme을 명시합니다. 이게 없으면
// iOS Mail/Apple Mail의 "스마트 다크 모드"가 배경·글자색을 요소별로 제멋대로
// 반전시켜(#111827 짙은 네이비 히어로가 밝은 라벤더로 바뀌는 식) 블록마다
// 일관성이 깨집니다. color-scheme meta로 "라이트/다크 둘 다 우리가 직접
// 그린다"고 선언한 뒤, @media (prefers-color-scheme: dark)로 실제 다크
// 팔레트를 명시적으로 지정합니다. 모든 다크 규칙은 class 선택자 + !important만
// 쓰고, 라이트 모드 inline style(색상 값)은 그대로 둬 라이트 모드 렌더링에는
// 영향이 없습니다.
function wrapEmailDocument(bodyHtml: string) {
  const darkStyle = `
    @media (prefers-color-scheme: dark) {
      body, .afu-page { background:#0b0f1a !important; }

      .afu-notice { background:#3a2a06 !important; border-color:#92651b !important; }
      .afu-notice, .afu-notice * { color:#fcd34d !important; }

      .afu-hero { background:#111827 !important; color:#ffffff !important; }

      .afu-card { background:#151a24 !important; border-color:#232a38 !important; }
      .afu-card-title { color:#f3f4f6 !important; }
      .afu-card-text { color:#cbd5e1 !important; }

      .afu-box-neutral { background:#1a2030 !important; }

      .afu-box-green { background:#0f2b1f !important; border-color:#1c4a35 !important; }
      .afu-box-green-title { color:#6ee7b7 !important; }
      .afu-box-green-text { color:#86efac !important; }

      .afu-box-orange { background:#2b1a08 !important; border-color:#5c3a12 !important; }
      .afu-box-orange-text { color:#fdba74 !important; }

      .afu-box-blue { background:#0f1d33 !important; border-color:#1e3a5f !important; }
      .afu-box-blue-title { color:#93c5fd !important; }
      .afu-box-blue-text { color:#bfdbfe !important; }

      .afu-chip { background:#1c2434 !important; border-color:#2e3648 !important; color:#cbd5e1 !important; }
      .afu-chip-accent { background:#16233d !important; color:#93c5fd !important; }

      .afu-btn-primary { background:#f3f4f6 !important; color:#111827 !important; }
      .afu-btn-secondary { background:#151a24 !important; border-color:#e5e7eb !important; color:#e5e7eb !important; }
      .afu-btn-accent { background:#3b82f6 !important; color:#ffffff !important; }

      .afu-muted { color:#94a3b8 !important; }
    }
  `;

  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>AI-FU 브리프</title>
    <style>${darkStyle}</style>
  </head>
  <body style="margin:0;padding:0;">
    ${bodyHtml}
  </body>
</html>`;
}

function getProfileUrl(subscriber: Subscriber) {
  const params = new URLSearchParams();
  params.set("email", subscriber.email);

  return `${getSiteUrl()}/profile?${params.toString()}`;
}

function getUnsubscribeUrl(subscriber: Subscriber) {
  const params = new URLSearchParams();
  params.set("email", subscriber.email);
  params.set("token", unsubscribeToken(subscriber.email));

  return `${getSiteUrl()}/unsubscribe?${params.toString()}`;
}

function getReadablePersona(subscriber: Subscriber) {
  if (subscriber.persona_type) return subscriber.persona_type;

  if (subscriber.ai_intent === "service_building") return "Builder";
  if (subscriber.ai_intent === "work_efficiency") return "Adopter";
  if (subscriber.ai_emotion === "anxious") return "Anxious";
  if (subscriber.ai_emotion === "skeptical") return "Skeptic";
  if (subscriber.ai_emotion === "fatigue") return "Overloaded";
  if (subscriber.ai_emotion === "curious") return "Explorer";
  if (subscriber.ai_emotion === "excited") return "Optimist";
  if (subscriber.ai_emotion === "unsure") return "Unclear";

  return "AI-FU 구독자";
}

function getReadablePersonaKorean(subscriber: Subscriber) {
  const persona = getReadablePersona(subscriber);

  const personaLabels: Record<string, string> = {
    Builder: "직접 만들어보고 싶은 Builder",
    Adopter: "업무에 적용하고 싶은 Adopter",
    Anxious: "AI 변화가 불안한 관찰자",
    Skeptic: "과장을 경계하는 Skeptic",
    Overloaded: "정보 과부하 상태의 구독자",
    Avoider: "정보 과부하 상태의 구독자",
    Explorer: "가능성을 탐색하는 Explorer",
    Optimist: "기대감을 가진 Optimist",
    Unclear: "아직 방향을 찾는 구독자",
    Test: "테스트 구독자",
  };

  return personaLabels[persona] || persona;
}

function getItemMainSummary(item: NewsletterItem) {
  return item.main_summary || item.summary || "";
}

function getItemSourceUrl(item: NewsletterItem) {
  return item.source_url || item.url || "";
}

function getEmptySubscriberAnswerMap(): SubscriberAnswerMap {
  return {
    ai_emotion: "",
    ai_intent: "",
    blocker: "",
    action_time: "",
  };
}

function getEmptyItemTargetMap(): ItemTargetMap {
  return {
    ai_emotion: [],
    ai_intent: [],
    blocker: [],
    action_time: [],
  };
}

function getSubscriberAnswers(
  subscriber: Subscriber,
  answersBySubscriberId: Record<string, SubscriberAnswerMap>
): SubscriberAnswerMap {
  const tableAnswers = answersBySubscriberId[subscriber.id];

  return {
    ai_emotion:
      normalizeValue(tableAnswers?.ai_emotion) ||
      normalizeValue(subscriber.ai_emotion),
    ai_intent:
      normalizeValue(tableAnswers?.ai_intent) ||
      normalizeValue(subscriber.ai_intent),
    blocker:
      normalizeValue(tableAnswers?.blocker) ||
      normalizeValue(subscriber.blocker),
    action_time:
      normalizeValue(tableAnswers?.action_time) ||
      normalizeValue(subscriber.action_time),
  };
}

function getItemTargets(
  item: NewsletterItem,
  targetsByItemId: Record<number, ItemTargetMap>
): ItemTargetMap {
  const tableTargets = targetsByItemId[item.id] || getEmptyItemTargetMap();

  const targetEmotion =
    normalizeValue(item.target_ai_emotion) ||
    normalizeValue(item.target_user_state) ||
    normalizeValue(item.target_persona);

  const fallbackTargets: ItemTargetMap = {
    ai_emotion: targetEmotion ? [targetEmotion] : [],
    ai_intent: normalizeValue(item.target_ai_intent)
      ? [normalizeValue(item.target_ai_intent)]
      : [],
    blocker: normalizeValue(item.target_blocker)
      ? [normalizeValue(item.target_blocker)]
      : [],
    action_time: normalizeValue(item.target_action_time)
      ? [normalizeValue(item.target_action_time)]
      : [],
  };

  return {
    ai_emotion:
      tableTargets.ai_emotion.length > 0
        ? tableTargets.ai_emotion
        : fallbackTargets.ai_emotion,
    ai_intent:
      tableTargets.ai_intent.length > 0
        ? tableTargets.ai_intent
        : fallbackTargets.ai_intent,
    blocker:
      tableTargets.blocker.length > 0
        ? tableTargets.blocker
        : fallbackTargets.blocker,
    action_time:
      tableTargets.action_time.length > 0
        ? tableTargets.action_time
        : fallbackTargets.action_time,
  };
}

function countSharedTargets(a: ItemTargetMap, b: ItemTargetMap) {
  let count = 0;

  for (const groupKey of Object.keys(a) as CategoryGroupKey[]) {
    for (const value of a[groupKey]) {
      if (b[groupKey].includes(value)) count += 1;
    }
  }

  return count;
}

function buildAnswersBySubscriberId(
  subscribers: Subscriber[],
  answers: SubscriberCategoryAnswer[]
) {
  const map: Record<string, SubscriberAnswerMap> = {};

  for (const subscriber of subscribers) {
    map[subscriber.id] = getEmptySubscriberAnswerMap();
  }

  for (const answer of answers) {
    if (!isCategoryGroupKey(answer.group_key)) continue;

    if (!map[answer.subscriber_id]) {
      map[answer.subscriber_id] = getEmptySubscriberAnswerMap();
    }

    map[answer.subscriber_id][answer.group_key] = normalizeValue(
      answer.option_value
    );
  }

  return map;
}

function buildTargetsByItemId(targets: NewsletterItemCategoryTarget[]) {
  const map: Record<number, ItemTargetMap> = {};

  for (const target of targets) {
    if (!isCategoryGroupKey(target.group_key)) continue;

    if (!map[target.newsletter_item_id]) {
      map[target.newsletter_item_id] = getEmptyItemTargetMap();
    }

    const value = normalizeValue(target.option_value);
    if (!value) continue;

    if (!map[target.newsletter_item_id][target.group_key].includes(value)) {
      map[target.newsletter_item_id][target.group_key].push(value);
    }
  }

  return map;
}

function buildFeedbacksBySubscriberKey(feedbacks: Feedback[]) {
  const map: Record<string, Feedback[]> = {};

  for (const feedback of feedbacks) {
    if (feedback.subscriber_id) {
      if (!map[feedback.subscriber_id]) map[feedback.subscriber_id] = [];
      map[feedback.subscriber_id].push(feedback);
    }

    if (typeof feedback.subscriber_email === "string") {
      const emailKey = normalizeEmail(feedback.subscriber_email);
      if (!map[emailKey]) map[emailKey] = [];
      map[emailKey].push(feedback);
    }
  }

  return map;
}

function buildFeedbackItemsById(items: NewsletterItem[]) {
  const map: Record<number, NewsletterItem> = {};

  for (const item of items) {
    map[item.id] = item;
  }

  return map;
}

function getSubscriberFeedbacks(
  subscriber: Subscriber,
  feedbackContext: FeedbackContext
) {
  const byId = feedbackContext.feedbacksBySubscriberKey[subscriber.id] || [];
  const byEmail =
    feedbackContext.feedbacksBySubscriberKey[normalizeEmail(subscriber.email)] ||
    [];

  const merged = [...byId, ...byEmail];
  const deduped = new Map<number, Feedback>();

  for (const feedback of merged) {
    deduped.set(feedback.id, feedback);
  }

  return Array.from(deduped.values());
}

function getFeedbackInfluenceScore({
  item,
  subscriber,
  itemTargets,
  feedbackContext,
}: {
  item: NewsletterItem;
  subscriber: Subscriber;
  itemTargets: ItemTargetMap;
  feedbackContext?: FeedbackContext;
}) {
  if (!feedbackContext) {
    return {
      score: 0,
      reasons: [] as string[],
    };
  }

  const feedbacks = getSubscriberFeedbacks(subscriber, feedbackContext);

  if (feedbacks.length === 0) {
    return {
      score: 0,
      reasons: [] as string[],
    };
  }

  let score = 0;
  const reasons: string[] = [];

  for (const feedback of feedbacks) {
    if (!feedback.newsletter_item_id) continue;

    const feedbackItem =
      feedbackContext.feedbackItemsById[feedback.newsletter_item_id];

    if (!feedbackItem) continue;

    const feedbackItemTargets =
      feedbackContext.targetsByItemId[feedbackItem.id] ||
      getItemTargets(feedbackItem, feedbackContext.targetsByItemId);

    const sharedTargetCount = countSharedTargets(itemTargets, feedbackItemTargets);

    const sameCategory =
      normalizeValue(item.category) &&
      normalizeValue(item.category) === normalizeValue(feedbackItem.category);

    const sameDifficulty =
      normalizeValue(item.difficulty) &&
      normalizeValue(item.difficulty) === normalizeValue(feedbackItem.difficulty);

    const similarity =
      sharedTargetCount * 2 + (sameCategory ? 1 : 0) + (sameDifficulty ? 1 : 0);

    if (similarity <= 0) continue;

    const feedbackType = normalizeValue(feedback.feedback_type);

    if (feedbackType === "action_done" || feedback.action_done === true) {
      score += similarity * 2;
      reasons.push("이전에 실행해본 자료와 유사");
      continue;
    }

    if (
      feedbackType === "action_not_done" ||
      feedbackType === "not_done" ||
      feedback.action_done === false
    ) {
      score -= sameDifficulty ? 1 : 0.5;
      reasons.push("이전 미실행 피드백 반영");
      continue;
    }

    if (feedbackType === "deeper") {
      score += similarity * 1.5;
      reasons.push("이전에 더 깊게 보고 싶다고 한 방향과 유사");
      continue;
    }

    if (feedbackType === "useful") {
      score += similarity;
      reasons.push("이전에 좋다고 평가한 자료와 유사");
      continue;
    }

    if (feedbackType === "not_relevant") {
      score -= similarity * 2;
      reasons.push("이전에 별로라고 평가한 방향은 낮게 반영");
      continue;
    }

    if (feedbackType === "hard") {
      score -= sameDifficulty ? 2 : 1;
      reasons.push("이전에 어렵다고 한 난이도 반영");
      continue;
    }

    if (feedbackType === "different") {
      score -= sameCategory ? 2 : 1;
      reasons.push("이전에 다른 방향이 필요하다는 피드백 반영");
      continue;
    }

    if (feedbackType === "less_anxious") {
      score += sameCategory ? 1 : 0.5;
      reasons.push("이전에 불안을 낮춰준 자료와 유사");
      continue;
    }
  }

  return {
    score,
    reasons: Array.from(new Set(reasons)),
  };
}

function getMatchScore({
  item,
  subscriber,
  answersBySubscriberId,
  targetsByItemId,
  feedbackContext,
}: {
  item: NewsletterItem;
  subscriber: Subscriber;
  answersBySubscriberId: Record<string, SubscriberAnswerMap>;
  targetsByItemId: Record<number, ItemTargetMap>;
  feedbackContext?: FeedbackContext;
}): ScoredItem {
  let score = 0;
  const matchedReasons: string[] = [];

  const subscriberAnswers = getSubscriberAnswers(
    subscriber,
    answersBySubscriberId
  );
  const itemTargets = getItemTargets(item, targetsByItemId);

  if (
    itemTargets.ai_emotion.length > 0 &&
    itemTargets.ai_emotion.includes(subscriberAnswers.ai_emotion)
  ) {
    score += 4;
    matchedReasons.push(
      `현재 감정이 “${getReadableValue(subscriberAnswers.ai_emotion)}”인 구독자에게 맞는 자료`
    );
  }

  if (
    itemTargets.ai_intent.length > 0 &&
    itemTargets.ai_intent.includes(subscriberAnswers.ai_intent)
  ) {
    score += 4;
    matchedReasons.push(
      `관심 방향이 “${getReadableValue(subscriberAnswers.ai_intent)}”인 구독자에게 맞는 자료`
    );
  }

  if (
    itemTargets.blocker.length > 0 &&
    itemTargets.blocker.includes(subscriberAnswers.blocker)
  ) {
    score += 3;
    matchedReasons.push(
      `막히는 지점인 “${getReadableValue(subscriberAnswers.blocker)}”을 줄이는 자료`
    );
  }

  if (
    itemTargets.action_time.length > 0 &&
    itemTargets.action_time.includes(subscriberAnswers.action_time)
  ) {
    score += 2;
    matchedReasons.push(
      `이번 주 가능한 시간 “${getReadableValue(subscriberAnswers.action_time)}” 안에 시도하기 쉬운 자료`
    );
  }

  const subscriberDifficulty = normalizeValue(subscriber.difficulty);
  const itemDifficulty = normalizeValue(item.difficulty);

  if (
    itemDifficulty &&
    subscriberDifficulty &&
    itemDifficulty === subscriberDifficulty
  ) {
    score += 1;
    matchedReasons.push(
      `선호 난이도 “${getReadableValue(subscriberDifficulty)}”에 맞는 자료`
    );
  }

  const hasAnyTarget =
    itemTargets.ai_emotion.length > 0 ||
    itemTargets.ai_intent.length > 0 ||
    itemTargets.blocker.length > 0 ||
    itemTargets.action_time.length > 0;

  if (!hasAnyTarget) {
    score += 1;
    matchedReasons.push("전체 구독자에게 기본 추천할 만한 자료");
  }

  const feedbackInfluence = getFeedbackInfluenceScore({
    item,
    subscriber,
    itemTargets,
    feedbackContext,
  });

  if (feedbackInfluence.score !== 0) {
    score += feedbackInfluence.score;
    matchedReasons.push(...feedbackInfluence.reasons);
  }

  return {
    item,
    score,
    matchedReasons: Array.from(new Set(matchedReasons)),
  };
}

function getAlreadySentItemIdsForSubscriber({
  subscriber,
  deliveryLogs,
}: {
  subscriber: Subscriber;
  deliveryLogs: DeliveryLog[];
}) {
  const sentIds = new Set<number>();
  const subscriberEmail = normalizeEmail(subscriber.email);

  for (const log of deliveryLogs) {
    if (log.status !== "sent") continue;
    if (!log.newsletter_item_id) continue;

    const sameSubscriberId =
      typeof log.subscriber_id === "string" && log.subscriber_id === subscriber.id;

    const sameSubscriberEmail =
      typeof log.subscriber_email === "string" &&
      normalizeEmail(log.subscriber_email) === subscriberEmail;

    if (sameSubscriberId || sameSubscriberEmail) {
      sentIds.add(log.newsletter_item_id);
    }
  }

  return sentIds;
}

function pickScoredItemsForSubscriber({
  items,
  subscriber,
  answersBySubscriberId,
  targetsByItemId,
  feedbackContext,
  deliveryLogs,
  ignoreDeliveryHistory,
}: {
  items: NewsletterItem[];
  subscriber: Subscriber;
  answersBySubscriberId: Record<string, SubscriberAnswerMap>;
  targetsByItemId: Record<number, ItemTargetMap>;
  feedbackContext?: FeedbackContext;
  deliveryLogs: DeliveryLog[];
  ignoreDeliveryHistory: boolean;
}) {
  const alreadySentItemIds = ignoreDeliveryHistory
    ? new Set<number>()
    : getAlreadySentItemIdsForSubscriber({
        subscriber,
        deliveryLogs,
      });

  const availableItems = items.filter(
    (item) => !alreadySentItemIds.has(item.id)
  );

  const scoredItems = availableItems
    .map((item) =>
      getMatchScore({
        item,
        subscriber,
        answersBySubscriberId,
        targetsByItemId,
        feedbackContext,
      })
    )
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.item.id - a.item.id;
    });

  const positiveMatchedItems = scoredItems.filter((entry) => entry.score > 0);

  if (positiveMatchedItems.length > 0) {
    return positiveMatchedItems.slice(0, 3);
  }

  return scoredItems.slice(0, 3);
}

function hasSubscriberReceivedToday({
  subscriber,
  dailySendLocks,
  todayKorea,
}: {
  subscriber: Subscriber;
  dailySendLocks: DailySendLock[];
  todayKorea: string;
}) {
  const subscriberEmail = normalizeEmail(subscriber.email);

  return dailySendLocks.some((lock) => {
    if (lock.status !== "sent") return false;
    if (!lock.send_date_kst) return false;

    const sameSubscriberId =
      typeof lock.subscriber_id === "string" &&
      lock.subscriber_id === subscriber.id;

    const sameSubscriberEmail =
      typeof lock.subscriber_email === "string" &&
      normalizeEmail(lock.subscriber_email) === subscriberEmail;

    if (!sameSubscriberId && !sameSubscriberEmail) return false;

    return lock.send_date_kst === todayKorea;
  });
}

function buildSubscriberStatusText(
  subscriber: Subscriber,
  answersBySubscriberId: Record<string, SubscriberAnswerMap>
) {
  const answers = getSubscriberAnswers(subscriber, answersBySubscriberId);

  const lines = Object.entries(answers)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => {
      const groupKey = key as CategoryGroupKey;
      return `${CATEGORY_LABELS[groupKey]}: ${getReadableValue(value)}`;
    });

  if (lines.length === 0) {
    return "현재 분류 정보가 충분하지 않습니다.";
  }

  return lines.join(" / ");
}

// 이메일에는 아이템당 피드백 링크 1개만 넣고, 실제 그룹 선택(만족도/실행 여부)은
// /feedback 페이지(실제 웹앱, JS 상태 보유)에서 처리합니다. 토큰은 type과
// 무관하게 (subscriber, item)에만 서명되어 있어 그대로 재사용할 수 있습니다.
function buildFeedbackPageUrl({
  subscriber,
  item,
}: {
  subscriber: Subscriber;
  item: NewsletterItem;
}) {
  const siteUrl = getSiteUrl();
  const params = new URLSearchParams();

  params.set("subscriber_id", subscriber.id);
  params.set("email", subscriber.email);
  params.set("newsletter_item_id", String(item.id));
  params.set(
    "token",
    feedbackToken({ subscriberId: subscriber.id, itemId: item.id })
  );

  return `${siteUrl}/feedback?${params.toString()}`;
}

// 원문 보기(주 행동, 채움 버튼)와 나란히 놓이므로 여기서는 카드/배경 없이
// 아웃라인(보조) 버튼과 캡션만 반환합니다. 왼쪽 정렬은 호출부에서
// 원문 보기와 같은 컨테이너에 넣어 맞춥니다. flex/grid 없이 block 요소만
// 사용해 구형 메일 클라이언트에서도 그대로 쌓입니다.
function buildFeedbackButtons({
  subscriber,
  item,
}: {
  subscriber: Subscriber;
  item: NewsletterItem;
}) {
  const url = escapeHtml(buildFeedbackPageUrl({ subscriber, item }));

  return `
    <a href="${url}" class="afu-btn-secondary" style="display:inline-block;padding:13px 18px;border-radius:12px;background:#ffffff;color:#111827;border:1.5px solid #111827;text-decoration:none;font-size:14px;font-weight:800;">
      피드백 남기기
    </a>
    <p class="afu-muted" style="margin:8px 0 0;font-size:12px;line-height:1.6;color:#9ca3af;">
      자료 만족도와 실행 여부를 한 화면에서 남길 수 있어요 · 다음 추천에 반영돼요
    </p>
  `;
}

function buildMatchedReasonHtml(scoredItem: ScoredItem) {
  const reasons = scoredItem.matchedReasons.filter(Boolean);

  if (reasons.length === 0) {
    return `
      <div class="afu-box-orange" style="margin-top:16px;padding:14px;border-radius:12px;background:#fff7ed;border:1px solid #fed7aa;">
        <p class="afu-box-orange-text" style="margin:0 0 6px;font-size:14px;font-weight:800;color:#9a3412;">
          이 자료가 나에게 온 이유
        </p>
        <p class="afu-box-orange-text" style="margin:0;font-size:14px;line-height:1.7;color:#9a3412;">
          아직 개인화 근거가 충분하지 않아, 전체 추천 자료로 포함했어요.
        </p>
      </div>
    `;
  }

  return `
    <div class="afu-box-orange" style="margin-top:16px;padding:14px;border-radius:12px;background:#fff7ed;border:1px solid #fed7aa;">
      <p class="afu-box-orange-text" style="margin:0 0 8px;font-size:14px;font-weight:800;color:#9a3412;">
        이 자료가 나에게 온 이유
      </p>
      <div class="afu-box-orange-text" style="font-size:14px;line-height:1.75;color:#9a3412;">
        ${reasons
          .map((reason) => `<div>• ${escapeHtml(reason)}</div>`)
          .join("")}
      </div>
    </div>
  `;
}

function buildProfileLinkHtml(subscriber: Subscriber) {
  const profileUrl = escapeHtml(getProfileUrl(subscriber));

  return `
    <div class="afu-box-blue" style="margin-top:22px;padding:20px;border-radius:18px;background:#eff6ff;border:1px solid #bfdbfe;">
      <p class="afu-box-blue-title" style="margin:0 0 8px;font-size:15px;font-weight:900;color:#1d4ed8;">
        지금 상태가 바뀌었나요?
      </p>
      <p class="afu-box-blue-text" style="margin:0 0 14px;font-size:14px;line-height:1.75;color:#1e3a8a;">
        AI에 대한 감정, 목적, 막히는 지점은 계속 바뀝니다. 지금 상태가 달라졌다면 재진단 화면에서 다시 설정하세요.
        다음 브리프부터 새 상태가 추천 점수에 반영됩니다.
      </p>
      <a href="${profileUrl}" class="afu-btn-accent" style="display:inline-block;padding:12px 16px;border-radius:13px;background:#2563eb;color:#ffffff;text-decoration:none;font-size:14px;font-weight:900;">
        내 상태 다시 설정하기
      </a>
      <p class="afu-muted" style="margin:12px 0 0;font-size:12px;line-height:1.6;color:#64748b;">
        같은 이메일로 제출하면 기존 구독자 정보가 업데이트됩니다.
      </p>
    </div>
  `;
}

function buildEmailFooterHtml(subscriber: Subscriber) {
  const privacyUrl = escapeHtml(`${getSiteUrl()}/privacy`);
  const unsubscribeUrl = escapeHtml(getUnsubscribeUrl(subscriber));

  return `
    <div style="margin-top:18px;text-align:center;">
      <p class="afu-muted" style="margin:0;font-size:12px;line-height:1.7;color:#9ca3af;">
        이 메일은 Mosun Brief 구독 신청자에게 발송되었습니다.
      </p>
      <p class="afu-muted" style="margin:8px 0 0;font-size:12px;line-height:1.7;color:#9ca3af;">
        <a href="${privacyUrl}" class="afu-muted" style="color:#6b7280;text-decoration:underline;">개인정보처리방침</a>
        <span class="afu-muted" style="color:#d1d5db;"> · </span>
        <a href="${unsubscribeUrl}" class="afu-muted" style="color:#6b7280;text-decoration:underline;">구독 취소</a>
      </p>
    </div>
  `;
}

function buildNewsletterHtml({
  subscriber,
  scoredItems,
  mode,
  answersBySubscriberId,
}: {
  subscriber: Subscriber;
  scoredItems: ScoredItem[];
  mode: "test" | "full";
  answersBySubscriberId: Record<string, SubscriberAnswerMap>;
}) {
  const persona = escapeHtml(getReadablePersonaKorean(subscriber));
  const statusText = escapeHtml(
    buildSubscriberStatusText(subscriber, answersBySubscriberId)
  );
  const modeLabel = mode === "test" ? "TEST BRIEFING" : "AI-FU 실행 브리프";

  const itemHtml = scoredItems
    .map((scoredItem, index) => {
      const item = scoredItem.item;
      const title = escapeHtml(item.title || "제목 없음");
      const mainSummary = escapeHtml(getItemMainSummary(item));
      const sourceUrl = getItemSourceUrl(item);
      const safeSourceUrl = escapeHtml(sourceUrl);
      const balanceSummary = escapeHtml(item.balance_summary || "");
      const actionHint = escapeHtml(item.action_hint || "");
      const category = escapeHtml(item.category || "AI");
      const difficulty = escapeHtml(getReadableValue(item.difficulty) || "기본");
      const sourceType = escapeHtml(item.source_type || "자료");
      const stance = escapeHtml(item.stance || "");
      const feedbackButtons = buildFeedbackButtons({ subscriber, item });
      const matchedReasonHtml = buildMatchedReasonHtml(scoredItem);

      return `
        <div class="afu-card" style="padding:20px;border:1px solid #e5e7eb;border-radius:18px;margin:18px 0;background:#ffffff;">
          <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px;">
            <span class="afu-chip-accent" style="display:inline-block;padding:6px 9px;border-radius:999px;background:#eff6ff;color:#1d4ed8;font-size:12px;font-weight:900;">
              추천 ${index + 1}
            </span>
            <span class="afu-chip" style="display:inline-block;padding:6px 9px;border-radius:999px;background:#f8fafc;color:#475569;border:1px solid #e2e8f0;font-size:12px;font-weight:800;">
              ${category}
            </span>
            <span class="afu-chip" style="display:inline-block;padding:6px 9px;border-radius:999px;background:#f8fafc;color:#475569;border:1px solid #e2e8f0;font-size:12px;font-weight:800;">
              ${difficulty}
            </span>
            <span class="afu-chip" style="display:inline-block;padding:6px 9px;border-radius:999px;background:#f8fafc;color:#475569;border:1px solid #e2e8f0;font-size:12px;font-weight:800;">
              ${sourceType}
            </span>
            ${
              stance
                ? `
                  <span class="afu-chip" style="display:inline-block;padding:6px 9px;border-radius:999px;background:#f8fafc;color:#475569;border:1px solid #e2e8f0;font-size:12px;font-weight:800;">
                    ${stance}
                  </span>
                `
                : ""
            }
          </div>

          <h2 class="afu-card-title" style="margin:0;font-size:21px;line-height:1.4;color:#111827;">
            ${title}
          </h2>

          ${matchedReasonHtml}

          ${
            mainSummary
              ? `
                <div style="margin-top:16px;">
                  <p class="afu-card-title" style="margin:0 0 6px;font-size:14px;font-weight:800;color:#111827;">
                    먼저 이것만 이해하세요
                  </p>
                  <p class="afu-card-text" style="margin:0;font-size:15px;line-height:1.75;color:#374151;">
                    ${mainSummary}
                  </p>
                </div>
              `
              : ""
          }

          ${
            balanceSummary
              ? `
                <div class="afu-box-neutral" style="margin-top:16px;padding:14px;border-radius:12px;background:#f9fafb;">
                  <p class="afu-card-title" style="margin:0 0 6px;font-size:14px;font-weight:800;color:#111827;">
                    균형 관점
                  </p>
                  <p class="afu-card-text" style="margin:0;font-size:15px;line-height:1.75;color:#4b5563;">
                    ${balanceSummary}
                  </p>
                </div>
              `
              : ""
          }

          <div class="afu-box-green" style="margin-top:16px;padding:16px;border-radius:14px;background:#ecfdf5;border:1px solid #a7f3d0;">
            <p class="afu-box-green-title" style="margin:0 0 7px;font-size:14px;font-weight:900;color:#047857;">
              오늘 딱 하나 할 일
            </p>
            <p class="afu-box-green-text" style="margin:0;font-size:15px;line-height:1.75;color:#065f46;">
              ${
                actionHint ||
                "이 자료의 제목과 핵심 요약만 보고, 내 일이나 생활에 적용할 수 있는 장면을 하나만 적어보세요."
              }
            </p>
          </div>

          <div style="margin-top:18px;">
            ${
              safeSourceUrl
                ? `
                  <a href="${safeSourceUrl}" class="afu-btn-primary" style="display:inline-block;padding:13px 18px;border-radius:12px;background:#111827;color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;">
                    원문 보기
                  </a>
                  <div style="margin-top:10px;">
                    ${feedbackButtons}
                  </div>
                `
                : feedbackButtons
            }
          </div>
        </div>
      `;
    })
    .join("");

  const bodyHtml = `
    <div class="afu-page" style="margin:0;padding:0;background:#f6f7fb;">
      <div style="max-width:680px;margin:0 auto;padding:32px 20px;font-family:Arial,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;">
        ${
          mode === "test"
            ? `
              <div class="afu-notice" style="margin-bottom:16px;padding:12px 16px;border-radius:12px;background:#fef3c7;border:1px solid #f59e0b;">
                <p style="margin:0;font-size:14px;font-weight:800;color:#92400e;">
                  테스트 발송입니다. 실제 구독자 발송 로그와 하루 발송 제한 잠금은 변경하지 않습니다.
                </p>
              </div>
            `
            : ""
        }

        <div class="afu-hero" style="padding:26px;border-radius:22px;background:#111827;color:#ffffff;">
          <p style="margin:0 0 8px;font-size:14px;color:#93c5fd;font-weight:800;">
            ${modeLabel}
          </p>
          <h1 style="margin:0;font-size:28px;line-height:1.35;">
            오늘은 많이 읽지 말고,<br />
            하나만 실행해보세요.
          </h1>
          <p style="margin:14px 0 0;font-size:15px;line-height:1.75;color:#d1d5db;">
            현재 분류: <strong style="color:#ffffff;">${persona}</strong>
          </p>
          <p style="margin:8px 0 0;font-size:13px;line-height:1.7;color:#9ca3af;">
            ${statusText}
          </p>
        </div>

        <div class="afu-card" style="margin-top:22px;padding:20px;border-radius:18px;background:#ffffff;border:1px solid #e5e7eb;">
          <p class="afu-card-title" style="margin:0 0 8px;font-size:15px;font-weight:900;color:#111827;">
            AI-FU는 뉴스레터가 아니라 실행 브리프입니다
          </p>
          <p class="afu-card-text" style="margin:0;font-size:15px;line-height:1.8;color:#374151;">
            AI 소식을 많이 보내는 대신, 지금 당신에게 필요한 자료를 고르고
            “왜 이 자료가 왔는지”와 “오늘 딱 하나 할 일”을 함께 보냅니다.
          </p>
        </div>

        ${itemHtml}

        ${buildProfileLinkHtml(subscriber)}

        <div class="afu-card" style="margin-top:24px;padding:18px;border-radius:16px;background:#ffffff;border:1px solid #e5e7eb;">
          <p class="afu-card-title" style="margin:0 0 8px;font-size:14px;font-weight:900;color:#111827;">
            다음 브리프를 더 잘 맞추는 방법
          </p>
          <p class="afu-card-text" style="margin:0;font-size:13px;line-height:1.75;color:#6b7280;">
            각 자료 아래의 "피드백 남기기"를 눌러 만족도와 실행 여부를 남겨주세요. 다음 자료 선택, 난이도, Action hint 추천 점수에 반영됩니다.
          </p>
          <p class="afu-muted" style="margin:10px 0 0;font-size:13px;line-height:1.7;color:#9ca3af;">
            이 메일은 AI-FU MVP 테스트/운영 발송입니다.
          </p>
        </div>

        ${buildEmailFooterHtml(subscriber)}
      </div>
    </div>
  `;

  return wrapEmailDocument(bodyHtml);
}

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "AI-FU <onboarding@resend.dev>";

  if (!resendApiKey) {
    return {
      ok: false,
      message: "RESEND_API_KEY is missing",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to,
      subject,
      html,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    return {
      ok: false,
      message: result?.message || JSON.stringify(result),
    };
  }

  return {
    ok: true,
    message: "sent",
  };
}

function makeTestSubscriber(testEmail: string, baseSubscriber?: Subscriber) {
  return {
    id: baseSubscriber?.id || "00000000-0000-0000-0000-000000000000",
    email: testEmail,
    job_role: baseSubscriber?.job_role || null,
    interest_area: baseSubscriber?.interest_area || null,
    purpose: baseSubscriber?.purpose || null,
    difficulty: baseSubscriber?.difficulty || "easy",
    ai_emotion: baseSubscriber?.ai_emotion || "curious",
    ai_intent: baseSubscriber?.ai_intent || "not_sure",
    blocker: baseSubscriber?.blocker || "too_much_info",
    action_time: baseSubscriber?.action_time || "30min",
    persona_type: baseSubscriber?.persona_type || "Test",
    is_active: true,
    unsubscribed_at: null,
  };
}

async function fetchSubscriberAnswers({
  supabase,
  subscriberIds,
}: {
  supabase: ReturnType<typeof getSupabaseAdminClient>;
  subscriberIds: string[];
}) {
  if (subscriberIds.length === 0) return [];

  const { data, error } = await supabase
    .from("subscriber_category_answers")
    .select("subscriber_id, group_key, option_value")
    .in("subscriber_id", subscriberIds);

  if (error) {
    throw new Error(`subscriber_category_answers 조회 실패: ${error.message}`);
  }

  return (data ?? []) as SubscriberCategoryAnswer[];
}

async function fetchNewsletterItemTargets({
  supabase,
  itemIds,
}: {
  supabase: ReturnType<typeof getSupabaseAdminClient>;
  itemIds: number[];
}) {
  if (itemIds.length === 0) return [];

  const { data, error } = await supabase
    .from("newsletter_item_category_targets")
    .select("newsletter_item_id, group_key, option_value")
    .in("newsletter_item_id", itemIds);

  if (error) {
    throw new Error(
      `newsletter_item_category_targets 조회 실패: ${error.message}`
    );
  }

  return (data ?? []) as NewsletterItemCategoryTarget[];
}

async function fetchRecentFeedbacks({
  supabase,
  subscriberIds,
  subscriberEmails,
}: {
  supabase: ReturnType<typeof getSupabaseAdminClient>;
  subscriberIds: string[];
  subscriberEmails: string[];
}) {
  if (subscriberIds.length === 0 && subscriberEmails.length === 0) {
    return [];
  }

  const idList = subscriberIds.map((id) => `"${id}"`).join(",");
  const emailList = subscriberEmails.map((email) => `"${email}"`).join(",");

  const filters: string[] = [];

  if (idList) filters.push(`subscriber_id.in.(${idList})`);
  if (emailList) filters.push(`subscriber_email.in.(${emailList})`);

  const { data, error } = await supabase
    .from("feedbacks")
    .select(
      `
      id,
      subscriber_id,
      subscriber_email,
      newsletter_item_id,
      feedback_type,
      action_done,
      created_at
    `
    )
    .or(filters.join(","))
    .not("newsletter_item_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(300);

  if (error) {
    throw new Error(`feedbacks 조회 실패: ${error.message}`);
  }

  return (data ?? []) as Feedback[];
}

async function fetchFeedbackItems({
  supabase,
  itemIds,
}: {
  supabase: ReturnType<typeof getSupabaseAdminClient>;
  itemIds: number[];
}) {
  if (itemIds.length === 0) return [];

  const { data, error } = await supabase
    .from("newsletter_items")
    .select(
      `
      id,
      title,
      summary,
      url,
      source_url,
      main_summary,
      balance_summary,
      action_hint,
      target_user_state,
      target_persona,
      target_ai_emotion,
      target_ai_intent,
      target_blocker,
      target_action_time,
      category,
      difficulty,
      source_type,
      stance,
      is_active,
      is_sent,
      created_at
    `
    )
    .in("id", itemIds);

  if (error) {
    throw new Error(`피드백 대상 newsletter_items 조회 실패: ${error.message}`);
  }

  return (data ?? []) as NewsletterItem[];
}

async function fetchDeliveryLogs({
  supabase,
  subscriberIds,
  subscriberEmails,
}: {
  supabase: ReturnType<typeof getSupabaseAdminClient>;
  subscriberIds: string[];
  subscriberEmails: string[];
}) {
  if (subscriberIds.length === 0 && subscriberEmails.length === 0) {
    return [];
  }

  const idList = subscriberIds.map((id) => `"${id}"`).join(",");
  const emailList = subscriberEmails.map((email) => `"${email}"`).join(",");

  const filters: string[] = [];

  if (idList) filters.push(`subscriber_id.in.(${idList})`);
  if (emailList) filters.push(`subscriber_email.in.(${emailList})`);

  const { data, error } = await supabase
    .from("newsletter_delivery_logs")
    .select("subscriber_id, subscriber_email, newsletter_item_id, status, created_at")
    .or(filters.join(","))
    .eq("status", "sent")
    .limit(5000);

  if (error) {
    throw new Error(`newsletter_delivery_logs 조회 실패: ${error.message}`);
  }

  return (data ?? []) as DeliveryLog[];
}

async function fetchDailySendLocks({
  supabase,
  todayKorea,
}: {
  supabase: ReturnType<typeof getSupabaseAdminClient>;
  todayKorea: string;
}) {
  const { data, error } = await supabase
    .from("newsletter_daily_send_locks")
    .select("subscriber_id, subscriber_email, send_date_kst, status, created_at")
    .eq("send_date_kst", todayKorea)
    .eq("status", "sent")
    .limit(5000);

  if (error) {
    throw new Error(`newsletter_daily_send_locks 조회 실패: ${error.message}`);
  }

  return (data ?? []) as DailySendLock[];
}

async function createDailySendLock({
  supabase,
  subscriber,
  todayKorea,
}: {
  supabase: ReturnType<typeof getSupabaseAdminClient>;
  subscriber: Subscriber;
  todayKorea: string;
}) {
  const { data, error } = await supabase
    .from("newsletter_daily_send_locks")
    .insert({
      subscriber_id: subscriber.id,
      subscriber_email: normalizeEmail(subscriber.email),
      send_date_kst: todayKorea,
      status: "sent",
    })
    .select("subscriber_id, subscriber_email, send_date_kst, status, created_at")
    .single();

  if (!error) {
    return {
      ok: true,
      alreadyExists: false,
      lock: data as DailySendLock,
      message: "created",
    };
  }

  const isDuplicate =
    error.code === "23505" ||
    error.message.toLowerCase().includes("duplicate key");

  if (isDuplicate) {
    return {
      ok: false,
      alreadyExists: true,
      lock: null,
      message: "already sent today",
    };
  }

  return {
    ok: false,
    alreadyExists: false,
    lock: null,
    message: error.message,
  };
}

async function deleteDailySendLock({
  supabase,
  subscriber,
  todayKorea,
}: {
  supabase: ReturnType<typeof getSupabaseAdminClient>;
  subscriber: Subscriber;
  todayKorea: string;
}) {
  const { error } = await supabase
    .from("newsletter_daily_send_locks")
    .delete()
    .eq("send_date_kst", todayKorea)
    .eq("subscriber_email", normalizeEmail(subscriber.email));

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  return {
    ok: true,
    message: "deleted",
  };
}

async function buildFeedbackContext({
  supabase,
  subscribers,
}: {
  supabase: ReturnType<typeof getSupabaseAdminClient>;
  subscribers: Subscriber[];
}): Promise<FeedbackContext> {
  const subscriberIds = subscribers.map((subscriber) => subscriber.id);
  const subscriberEmails = subscribers.map((subscriber) =>
    normalizeEmail(subscriber.email)
  );

  const feedbacks = await fetchRecentFeedbacks({
    supabase,
    subscriberIds,
    subscriberEmails,
  });

  const feedbackItemIds = Array.from(
    new Set(
      feedbacks
        .map((feedback) => feedback.newsletter_item_id)
        .filter((id): id is number => typeof id === "number")
    )
  );

  const feedbackItems = await fetchFeedbackItems({
    supabase,
    itemIds: feedbackItemIds,
  });

  const feedbackItemTargets = await fetchNewsletterItemTargets({
    supabase,
    itemIds: feedbackItemIds,
  });

  return {
    feedbacksBySubscriberKey: buildFeedbacksBySubscriberKey(feedbacks),
    feedbackItemsById: buildFeedbackItemsById(feedbackItems),
    targetsByItemId: buildTargetsByItemId(feedbackItemTargets),
  };
}

function buildPreviewItem(entry: ScoredItem) {
  return {
    id: entry.item.id,
    title: entry.item.title,
    category: entry.item.category,
    difficulty: entry.item.difficulty,
    sourceType: entry.item.source_type,
    stance: entry.item.stance,
    sourceUrl: getItemSourceUrl(entry.item),
    mainSummary: getItemMainSummary(entry.item),
    balanceSummary: entry.item.balance_summary,
    actionHint: entry.item.action_hint,
    score: entry.score,
    matchedReasons: entry.matchedReasons,
  };
}

export async function POST(request: Request) {
  try {
    const body = await readRequestBody(request);
    const auth = verifyAdminSecret(request, body);

    if (!auth.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: auth.message,
        },
        { status: 401 }
      );
    }

    const mode =
      body.mode === "preview" ? "preview" : body.mode === "test" ? "test" : "full";
    const testEmail = String(body.test_email ?? "").trim();

    if (mode === "test" && !testEmail) {
      return NextResponse.json(
        {
          ok: false,
          message: "테스트 발송에는 test_email이 필요합니다.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();
    const todayKorea = getKoreaToday();

    const { data: subscribers, error: subscribersError } = await supabase
      .from("subscribers")
      .select(
        `
        id,
        email,
        job_role,
        interest_area,
        purpose,
        difficulty,
        ai_emotion,
        ai_intent,
        blocker,
        action_time,
        persona_type,
        is_active,
        unsubscribed_at
      `
      )
      .not("email", "is", null)
      .eq("is_active", true)
      // 기록(/lab) 구독자에게는 AI 브리핑을 보내지 않습니다.
      .neq("signup_source", "lab")
      .order("created_at", { ascending: false });

    if (subscribersError) {
      return NextResponse.json(
        { ok: false, message: subscribersError.message },
        { status: 500 }
      );
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({
        ok: false,
        message: "발송 기준으로 사용할 활성 구독자가 없습니다.",
      });
    }

    const typedSubscribers = subscribers as Subscriber[];

    const { data: newsletterItems, error: itemsError } = await supabase
      .from("newsletter_items")
      .select(
        `
        id,
        title,
        summary,
        url,
        source_url,
        main_summary,
        balance_summary,
        action_hint,
        target_user_state,
        target_persona,
        target_ai_emotion,
        target_ai_intent,
        target_blocker,
        target_action_time,
        category,
        difficulty,
        source_type,
        stance,
        is_active,
        is_sent,
        created_at
      `
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(200);

    if (itemsError) {
      return NextResponse.json(
        { ok: false, message: itemsError.message },
        { status: 500 }
      );
    }

    if (!newsletterItems || newsletterItems.length === 0) {
      return NextResponse.json({
        ok: false,
        message:
          "발송할 뉴스 자료가 없습니다. /admin/newsletter-items에서 자료를 먼저 등록해주세요.",
      });
    }

    const typedNewsletterItems = newsletterItems as NewsletterItem[];

    const subscriberIds = typedSubscribers.map((subscriber) => subscriber.id);
    const subscriberEmails = typedSubscribers.map((subscriber) =>
      normalizeEmail(subscriber.email)
    );
    const itemIds = typedNewsletterItems.map((item) => item.id);

    const subscriberAnswers = await fetchSubscriberAnswers({
      supabase,
      subscriberIds,
    });

    const newsletterItemTargets = await fetchNewsletterItemTargets({
      supabase,
      itemIds,
    });

    const deliveryLogs = await fetchDeliveryLogs({
      supabase,
      subscriberIds,
      subscriberEmails,
    });

    const dailySendLocks = await fetchDailySendLocks({
      supabase,
      todayKorea,
    });

    const answersBySubscriberId = buildAnswersBySubscriberId(
      typedSubscribers,
      subscriberAnswers
    );

    const targetsByItemId = buildTargetsByItemId(newsletterItemTargets);

    const feedbackContext = await buildFeedbackContext({
      supabase,
      subscribers: typedSubscribers,
    });

    if (mode === "preview") {
      let previewSendableCount = 0;
      let previewSkippedCount = 0;

      const previewDetails = typedSubscribers.map((subscriber) => {
        const alreadyReceivedToday = hasSubscriberReceivedToday({
          subscriber,
          dailySendLocks,
          todayKorea,
        });

        const selectedScoredItems = alreadyReceivedToday
          ? []
          : pickScoredItemsForSubscriber({
              items: typedNewsletterItems,
              subscriber,
              answersBySubscriberId,
              targetsByItemId,
              feedbackContext,
              deliveryLogs,
              ignoreDeliveryHistory: false,
            });

        const alreadySentItemIds = Array.from(
          getAlreadySentItemIdsForSubscriber({
            subscriber,
            deliveryLogs,
          })
        );

        if (selectedScoredItems.length > 0) {
          previewSendableCount += 1;
        } else {
          previewSkippedCount += 1;
        }

        return {
          subscriberId: subscriber.id,
          subscriberEmail: subscriber.email,
          persona: getReadablePersonaKorean(subscriber),
          profileUrl: getProfileUrl(subscriber),
          unsubscribeUrl: getUnsubscribeUrl(subscriber),
          answers: getSubscriberAnswers(subscriber, answersBySubscriberId),
          alreadySentItemIds,
          alreadyReceivedToday,
          willSend: selectedScoredItems.length > 0,
          selectedItemIds: selectedScoredItems.map((entry) => entry.item.id),
          selectedItems: selectedScoredItems.map(buildPreviewItem),
          skippedReason: alreadyReceivedToday
            ? `${todayKorea}에 이미 발송된 구독자입니다.`
            : selectedScoredItems.length === 0
            ? "이미 발송된 자료를 제외하면 보낼 수 있는 활성 자료가 없습니다."
            : null,
        };
      });

      const uniquePreviewItemIds = Array.from(
        new Set(
          previewDetails.flatMap((detail) =>
            detail.selectedItems.map((item) => item.id)
          )
        )
      );

      return NextResponse.json({
        ok: true,
        mode: "preview",
        todayKorea,
        message: `발송 전 미리보기 생성 완료: 발송 가능 ${previewSendableCount}명, 스킵 ${previewSkippedCount}명.`,
        totalSubscribers: typedSubscribers.length,
        totalActiveItems: typedNewsletterItems.length,
        previewSendableCount,
        previewSkippedCount,
        selectedItemIds: uniquePreviewItemIds,
        previewDetails,
        note: "미리보기 모드이므로 이메일 발송, newsletter_daily_send_locks 저장, newsletter_delivery_logs 저장, 자료 상태 변경을 하지 않았습니다.",
      });
    }

    if (mode === "test") {
      const baseSubscriber = typedSubscribers[0];
      const testSubscriber = makeTestSubscriber(testEmail, baseSubscriber);

      const testAnswersBySubscriberId = {
        ...answersBySubscriberId,
        [testSubscriber.id]: answersBySubscriberId[baseSubscriber.id] || {
          ai_emotion: testSubscriber.ai_emotion || "curious",
          ai_intent: testSubscriber.ai_intent || "not_sure",
          blocker: testSubscriber.blocker || "too_much_info",
          action_time: testSubscriber.action_time || "30min",
        },
      };

      const selectedScoredItems = pickScoredItemsForSubscriber({
        items: typedNewsletterItems,
        subscriber: testSubscriber,
        answersBySubscriberId: testAnswersBySubscriberId,
        targetsByItemId,
        feedbackContext,
        deliveryLogs,
        ignoreDeliveryHistory: true,
      });

      const html = buildNewsletterHtml({
        subscriber: testSubscriber,
        scoredItems: selectedScoredItems,
        mode: "test",
        answersBySubscriberId: testAnswersBySubscriberId,
      });

      const sendResult = await sendEmail({
        to: testEmail,
        subject: "[AI-FU TEST] 오늘은 많이 읽지 말고, 하나만 실행해보세요",
        html,
      });

      if (!sendResult.ok) {
        return NextResponse.json(
          {
            ok: false,
            message: `테스트 발송 실패: ${sendResult.message}`,
            selectedItemIds: selectedScoredItems.map((entry) => entry.item.id),
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        message: `테스트 브리프 발송 완료: ${testEmail}`,
        mode: "test",
        profileUrl: getProfileUrl(testSubscriber),
        unsubscribeUrl: getUnsubscribeUrl(testSubscriber),
        selectedItemIds: selectedScoredItems.map((entry) => entry.item.id),
        selectedItems: selectedScoredItems.map((entry) => ({
          id: entry.item.id,
          title: entry.item.title,
          score: entry.score,
          matchedReasons: entry.matchedReasons,
        })),
        note: "테스트 발송이므로 newsletter_daily_send_locks, newsletter_delivery_logs, 자료 발송 상태는 변경하지 않았습니다.",
      });
    }

    let successCount = 0;
    let failCount = 0;
    let skippedSubscriberCount = 0;
    let skippedTodayCount = 0;

    const sentItemIds = new Set<number>();
    const failedReasons: string[] = [];
    const sentDetails: {
      subscriber_email: string;
      profile_url: string;
      unsubscribe_url: string;
      item_ids: number[];
      scores: {
        item_id: number;
        score: number;
        matched_reasons: string[];
      }[];
    }[] = [];

    for (const subscriber of typedSubscribers) {
      const alreadyReceivedToday = hasSubscriberReceivedToday({
        subscriber,
        dailySendLocks,
        todayKorea,
      });

      if (alreadyReceivedToday) {
        skippedTodayCount += 1;
        skippedSubscriberCount += 1;
        failedReasons.push(
          `${subscriber.email}: ${todayKorea}에 이미 발송된 구독자라서 건너뛰었습니다.`
        );
        continue;
      }

      const selectedScoredItems = pickScoredItemsForSubscriber({
        items: typedNewsletterItems,
        subscriber,
        answersBySubscriberId,
        targetsByItemId,
        feedbackContext,
        deliveryLogs,
        ignoreDeliveryHistory: false,
      });

      if (selectedScoredItems.length === 0) {
        skippedSubscriberCount += 1;
        failedReasons.push(
          `${subscriber.email}: 이미 발송된 자료를 제외하면 보낼 수 있는 활성 자료가 없습니다.`
        );
        continue;
      }

      const lockResult = await createDailySendLock({
        supabase,
        subscriber,
        todayKorea,
      });

      if (!lockResult.ok) {
        if (lockResult.alreadyExists) {
          skippedTodayCount += 1;
          skippedSubscriberCount += 1;
          failedReasons.push(
            `${subscriber.email}: ${todayKorea}에 이미 발송된 구독자라서 건너뛰었습니다.`
          );
          continue;
        }

        failCount += 1;
        failedReasons.push(
          `${subscriber.email}: daily send lock 생성 실패: ${lockResult.message}`
        );
        continue;
      }

      const html = buildNewsletterHtml({
        subscriber,
        scoredItems: selectedScoredItems,
        mode: "full",
        answersBySubscriberId,
      });

      const sendResult = await sendEmail({
        to: subscriber.email,
        subject: "[AI-FU] 오늘은 많이 읽지 말고, 하나만 실행해보세요",
        html,
      });

      if (sendResult.ok) {
        successCount += 1;

        dailySendLocks.push({
          subscriber_id: subscriber.id,
          subscriber_email: normalizeEmail(subscriber.email),
          send_date_kst: todayKorea,
          status: "sent",
          created_at: new Date().toISOString(),
        });

        const scoreDetails = selectedScoredItems.map((entry) => ({
          item_id: entry.item.id,
          score: entry.score,
          matched_reasons: entry.matchedReasons,
        }));

        sentDetails.push({
          subscriber_email: subscriber.email,
          profile_url: getProfileUrl(subscriber),
          unsubscribe_url: getUnsubscribeUrl(subscriber),
          item_ids: selectedScoredItems.map((entry) => entry.item.id),
          scores: scoreDetails,
        });

        for (const entry of selectedScoredItems) {
          const item = entry.item;
          sentItemIds.add(item.id);

          const { error: logError } = await supabase
            .from("newsletter_delivery_logs")
            .insert({
              subscriber_id: subscriber.id,
              subscriber_email: subscriber.email,
              newsletter_item_id: item.id,
              status: "sent",
            });

          if (logError) {
            failedReasons.push(`log insert error: ${logError.message}`);
          }

          deliveryLogs.push({
            subscriber_id: subscriber.id,
            subscriber_email: subscriber.email,
            newsletter_item_id: item.id,
            status: "sent",
            created_at: new Date().toISOString(),
          });
        }
      } else {
        failCount += 1;
        failedReasons.push(`${subscriber.email}: ${sendResult.message}`);

        const deleteLockResult = await deleteDailySendLock({
          supabase,
          subscriber,
          todayKorea,
        });

        if (!deleteLockResult.ok) {
          failedReasons.push(
            `${subscriber.email}: failed daily lock delete error: ${deleteLockResult.message}`
          );
        }

        const { error: logError } = await supabase
          .from("newsletter_delivery_logs")
          .insert({
            subscriber_id: subscriber.id,
            subscriber_email: subscriber.email,
            newsletter_item_id: selectedScoredItems[0]?.item.id ?? null,
            status: "failed",
            error_message: sendResult.message,
          });

        if (logError) {
          failedReasons.push(`failed log insert error: ${logError.message}`);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      mode: "full",
      message: `발송 완료: ${successCount}명에게 발송했습니다. 실패: ${failCount}명. 스킵: ${skippedSubscriberCount}명. 오늘 이미 받은 구독자: ${skippedTodayCount}명. 자료별 전역 is_sent는 변경하지 않았습니다.`,
      todayKorea,
      successCount,
      failCount,
      skippedSubscriberCount,
      skippedTodayCount,
      selectedItemIds: Array.from(sentItemIds),
      updatedItemIds: [],
      failedReasons,
      sentDetails,
      note: "A-4 재발송 정책 적용: 자료 자체는 재사용 가능하며, 같은 구독자에게 이미 sent 로그가 있는 자료만 제외합니다. D-1 수정 적용: 하루 1회 메일 제한은 newsletter_daily_send_locks로 관리하고, newsletter_delivery_logs는 자료별 발송 기록으로 유지합니다. D-6 적용: 이메일 하단에 /profile 재진단 링크가 포함됩니다. D-7 적용: is_active=true 구독자에게만 발송하고 이메일 하단에 /unsubscribe 구독 취소 링크가 포함됩니다.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";

    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}