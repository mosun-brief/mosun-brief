import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
  difficulty: string | null;
  ai_emotion: string | null;
  ai_intent: string | null;
  blocker: string | null;
  action_time: string | null;
  persona_type: string | null;
  is_active: boolean | null;
  unsubscribed_at: string | null;
  created_at: string;
  updated_at: string | null;
};

type SubscriberCategoryAnswer = {
  subscriber_id: string;
  group_key: CategoryGroupKey;
  option_value: string;
};

type NewsletterItem = {
  id: number;
  title: string | null;
  category: string | null;
  difficulty: string | null;
  target_ai_emotion: string | null;
  target_ai_intent: string | null;
  target_blocker: string | null;
  target_action_time: string | null;
  is_active: boolean | null;
  is_sent: boolean | null;
  created_at: string | null;
};

type DeliveryLog = {
  id: number;
  subscriber_id: string | null;
  subscriber_email: string;
  newsletter_item_id: number | null;
  status: string | null;
  error_message: string | null;
  created_at: string;
};

type Feedback = {
  id: number;
  subscriber_id: string | null;
  subscriber_email: string | null;
  newsletter_item_id: number | null;
  feedback_type: string | null;
  action_done: boolean | null;
  free_text: string | null;
  created_at: string;
};

type RequestBody = {
  admin_secret?: string;
};

type CountRow = {
  value: string;
  count: number;
};

type BooleanCounts = {
  true: number;
  false: number;
  unknown: number;
};

type FeedbackGroupCounts = {
  reaction: {
    useful: number;
    deeper: number;
    not_relevant: number;
    hard: number;
    less_anxious: number;
    different: number;
    unknown: number;
  };
  execution: {
    action_done: number;
    action_not_done: number;
    unknown: number;
  };
};

type SubscriberStats = {
  total: number;
  active: number;
  inactive: number;
  unsubscribed: number;
  unknown: number;
};

type NewsletterItemWithFeedbackStats = NewsletterItem & {
  feedback_total_count: number;
  feedback_useful_count: number;
  feedback_deeper_count: number;
  feedback_not_relevant_count: number;
  feedback_action_done_count: number;
  feedback_action_not_done_count: number;
};

type FeedbackWithItemTitle = Feedback & {
  newsletter_item_title: string | null;
};

type DeliveryLogWithItemTitle = DeliveryLog & {
  newsletter_item_title: string | null;
};

type OperationReviewItem = {
  id: number;
  title: string | null;
  category: string | null;
  difficulty: string | null;
  totalFeedbackCount: number;
  usefulCount: number;
  deeperCount: number;
  notRelevantCount: number;
  actionDoneCount: number;
  actionNotDoneCount: number;
  score: number;
};

type OperationReview = {
  totalDeliveryLogs: number;
  sentLogCount: number;
  failedLogCount: number;
  totalFeedbacks: number;
  usefulCount: number;
  deeperCount: number;
  notRelevantCount: number;
  actionDoneCount: number;
  actionNotDoneCount: number;
  executionRate: number;
  notRelevantRate: number;
  topPerformingItems: OperationReviewItem[];
  needsImprovementItems: OperationReviewItem[];
  nextContentRecommendations: string[];
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
  writing_creation: "글쓰기/창작",
  business_opportunity: "사업 기회나 돈 벌 기회",
  business_money: "사업 기회나 돈 벌 기회",
  avoid_but_need: "피하고 싶으나 알아야겠음",

  too_much_info: "정보가 너무 많아 정리가 안됨",
  no_clear_start: "뭘 해야할 지 모르겠음",
  dont_know_what_to_do: "뭘 해야할 지 모르겠음",
  too_technical: "기술적인 내용이 어려움",
  technical_difficulty: "기술적인 내용이 어려움",
  no_time: "시간 없음",
  fear_of_falling_behind: "뒤처질까봐 불안",
  low_need: "아직 필요성을 모르겠음",
  not_needed_yet: "아직 필요성을 모르겠음",

  "10min": "10분",
  "30min": "30분",
  "2hours": "2시간",
  half_day_weekend: "주말 반나절",
  half_weekend: "주말 반나절",

  useful: "좋음",
  deeper: "더 깊게",
  not_relevant: "별로",
  action_done: "실행해봄",
  action_not_done: "실행안해봄",

  general_ai: "전반적인 AI",
  productivity: "업무 활용",
  healthcare_ai: "의료 AI",
  robotics: "로봇",
  investment: "AI 투자",
  research: "연구",
  startup: "스타트업",
  ethics: "윤리/리스크",

  easy: "입문",
  normal: "중간",
  expert: "심화",
};

function labelOf(value: string | null | undefined) {
  if (!value) return "-";
  return VALUE_LABELS[value] || value;
}

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

async function readRequestBody(request: Request): Promise<RequestBody> {
  try {
    const body = await request.json();
    return body || {};
  } catch {
    return {};
  }
}

function getSecretFromRequest(request: NextRequest, body?: RequestBody) {
  const headerSecret = request.headers.get("x-admin-secret");

  if (headerSecret) {
    return headerSecret.trim();
  }

  const querySecret =
    request.nextUrl.searchParams.get("secret") ||
    request.nextUrl.searchParams.get("admin_secret");

  if (querySecret) {
    return querySecret.trim();
  }

  if (body?.admin_secret) {
    return String(body.admin_secret).trim();
  }

  return "";
}

function verifyAdminSecret(request: NextRequest, body?: RequestBody) {
  const serverSecret = process.env.ADMIN_SECRET;

  if (!serverSecret) {
    return {
      ok: false,
      message: "서버에 ADMIN_SECRET이 설정되어 있지 않습니다.",
    };
  }

  const requestSecret = getSecretFromRequest(request, body);

  if (!requestSecret) {
    return {
      ok: false,
      message: "ADMIN_SECRET이 필요합니다.",
    };
  }

  if (requestSecret !== serverSecret) {
    return {
      ok: false,
      message: "ADMIN_SECRET이 올바르지 않습니다.",
    };
  }

  return {
    ok: true,
    message: "ok",
  };
}

function normalizeText(value: string | null | undefined) {
  if (!value) return "";
  return String(value).trim();
}

function countByValue<T>(
  rows: T[],
  getValue: (row: T) => string | null | undefined,
  unknownLabel = "Unknown"
) {
  const counts: Record<string, number> = {};

  for (const row of rows) {
    const rawValue = getValue(row);
    const value = rawValue && rawValue.trim() ? rawValue.trim() : unknownLabel;

    counts[value] = (counts[value] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([value, count]) => ({
      value,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

function countByBoolean<T>(
  rows: T[],
  getValue: (row: T) => boolean | null | undefined
) {
  const counts = {
    true: 0,
    false: 0,
    unknown: 0,
  };

  for (const row of rows) {
    const value = getValue(row);

    if (value === true) {
      counts.true += 1;
    } else if (value === false) {
      counts.false += 1;
    } else {
      counts.unknown += 1;
    }
  }

  return counts;
}

function getSubscriberStats(subscribers: Subscriber[]): SubscriberStats {
  const total = subscribers.length;
  const active = subscribers.filter(
    (subscriber) => subscriber.is_active === true
  ).length;
  const inactive = subscribers.filter(
    (subscriber) => subscriber.is_active === false
  ).length;
  const unknown = subscribers.filter(
    (subscriber) => typeof subscriber.is_active !== "boolean"
  ).length;
  const unsubscribed = subscribers.filter(
    (subscriber) =>
      subscriber.is_active === false || Boolean(subscriber.unsubscribed_at)
  ).length;

  return {
    total,
    active,
    inactive,
    unsubscribed,
    unknown,
  };
}

function getRecentUnsubscribedSubscribers(subscribers: Subscriber[]) {
  return subscribers
    .filter(
      (subscriber) =>
        subscriber.is_active === false || Boolean(subscriber.unsubscribed_at)
    )
    .sort((a, b) => {
      const aTime = new Date(a.unsubscribed_at || a.updated_at || a.created_at)
        .getTime();
      const bTime = new Date(b.unsubscribed_at || b.updated_at || b.created_at)
        .getTime();

      return bTime - aTime;
    })
    .slice(0, 20);
}

function getCategoryAnswerCounts(answers: SubscriberCategoryAnswer[]) {
  const result: Record<CategoryGroupKey, CountRow[]> = {
    ai_emotion: [],
    ai_intent: [],
    blocker: [],
    action_time: [],
  };

  const grouped: Record<CategoryGroupKey, Record<string, number>> = {
    ai_emotion: {},
    ai_intent: {},
    blocker: {},
    action_time: {},
  };

  for (const answer of answers) {
    if (
      answer.group_key !== "ai_emotion" &&
      answer.group_key !== "ai_intent" &&
      answer.group_key !== "blocker" &&
      answer.group_key !== "action_time"
    ) {
      continue;
    }

    const value = answer.option_value || "Unknown";
    grouped[answer.group_key][value] =
      (grouped[answer.group_key][value] || 0) + 1;
  }

  for (const groupKey of Object.keys(grouped) as CategoryGroupKey[]) {
    result[groupKey] = Object.entries(grouped[groupKey])
      .map(([value, count]) => ({
        value,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }

  return result;
}

function getNewsletterStats(items: NewsletterItem[]) {
  const total = items.length;
  const active = items.filter((item) => item.is_active === true).length;
  const inactive = items.filter((item) => item.is_active === false).length;
  const sent = items.filter((item) => item.is_sent === true).length;
  const unsent = items.filter((item) => item.is_sent === false).length;

  return {
    total,
    active,
    inactive,
    sent,
    unsent,
    byCategory: countByValue(items, (item) => item.category, "uncategorized"),
    byDifficulty: countByValue(items, (item) => item.difficulty, "unknown"),
    bySentStatus: countByBoolean(items, (item) => item.is_sent),
    byActiveStatus: countByBoolean(items, (item) => item.is_active),
  };
}

function buildNewsletterItemMap(items: NewsletterItem[]) {
  const map: Record<number, NewsletterItem> = {};

  for (const item of items) {
    map[item.id] = item;
  }

  return map;
}

function getFeedbackGroupCounts(feedbacks: Feedback[]): FeedbackGroupCounts {
  const counts: FeedbackGroupCounts = {
    reaction: {
      useful: 0,
      deeper: 0,
      not_relevant: 0,
      hard: 0,
      less_anxious: 0,
      different: 0,
      unknown: 0,
    },
    execution: {
      action_done: 0,
      action_not_done: 0,
      unknown: 0,
    },
  };

  for (const feedback of feedbacks) {
    const type = normalizeText(feedback.feedback_type);

    if (type === "useful") {
      counts.reaction.useful += 1;
      continue;
    }

    if (type === "deeper") {
      counts.reaction.deeper += 1;
      continue;
    }

    if (
      type === "not_relevant" ||
      type === "not_interested" ||
      type === "less_relevant"
    ) {
      counts.reaction.not_relevant += 1;
      continue;
    }

    if (type === "hard") {
      counts.reaction.hard += 1;
      continue;
    }

    if (type === "less_anxious") {
      counts.reaction.less_anxious += 1;
      continue;
    }

    if (type === "different") {
      counts.reaction.different += 1;
      continue;
    }

    if (type === "action_done" || type === "done") {
      counts.execution.action_done += 1;
      continue;
    }

    if (
      type === "action_not_done" ||
      type === "not_done" ||
      type === "not_executed"
    ) {
      counts.execution.action_not_done += 1;
      continue;
    }

    if (feedback.action_done === true) {
      counts.execution.action_done += 1;
      continue;
    }

    if (feedback.action_done === false) {
      counts.execution.action_not_done += 1;
      continue;
    }

    counts.reaction.unknown += 1;
  }

  return counts;
}

function getNewsletterItemFeedbackStats({
  item,
  feedbacks,
}: {
  item: NewsletterItem;
  feedbacks: Feedback[];
}): NewsletterItemWithFeedbackStats {
  const itemFeedbacks = feedbacks.filter(
    (feedback) => feedback.newsletter_item_id === item.id
  );

  const countByType = (types: string[]) =>
    itemFeedbacks.filter((feedback) =>
      types.includes(normalizeText(feedback.feedback_type))
    ).length;

  return {
    ...item,
    feedback_total_count: itemFeedbacks.length,
    feedback_useful_count: countByType(["useful"]),
    feedback_deeper_count: countByType(["deeper"]),
    feedback_not_relevant_count: countByType([
      "not_relevant",
      "not_interested",
      "less_relevant",
    ]),
    feedback_action_done_count:
      countByType(["action_done", "done"]) +
      itemFeedbacks.filter((feedback) => feedback.action_done === true).length,
    feedback_action_not_done_count:
      countByType(["action_not_done", "not_done", "not_executed"]) +
      itemFeedbacks.filter((feedback) => feedback.action_done === false).length,
  };
}

function attachFeedbackItemTitle({
  feedbacks,
  itemMap,
}: {
  feedbacks: Feedback[];
  itemMap: Record<number, NewsletterItem>;
}): FeedbackWithItemTitle[] {
  return feedbacks.map((feedback) => {
    const item =
      typeof feedback.newsletter_item_id === "number"
        ? itemMap[feedback.newsletter_item_id]
        : null;

    return {
      ...feedback,
      newsletter_item_title: item?.title || null,
    };
  });
}

function attachDeliveryLogItemTitle({
  deliveryLogs,
  itemMap,
}: {
  deliveryLogs: DeliveryLog[];
  itemMap: Record<number, NewsletterItem>;
}): DeliveryLogWithItemTitle[] {
  return deliveryLogs.map((log) => {
    const item =
      typeof log.newsletter_item_id === "number"
        ? itemMap[log.newsletter_item_id]
        : null;

    return {
      ...log,
      newsletter_item_title: item?.title || null,
    };
  });
}

function getItemReviewRows({
  items,
  feedbacks,
}: {
  items: NewsletterItem[];
  feedbacks: Feedback[];
}): OperationReviewItem[] {
  return items.map((item) => {
    const itemFeedbacks = feedbacks.filter(
      (feedback) => feedback.newsletter_item_id === item.id
    );

    const countByType = (types: string[]) =>
      itemFeedbacks.filter((feedback) =>
        types.includes(normalizeText(feedback.feedback_type))
      ).length;

    const usefulCount = countByType(["useful"]);
    const deeperCount = countByType(["deeper"]);
    const notRelevantCount = countByType([
      "not_relevant",
      "not_interested",
      "less_relevant",
    ]);
    const actionDoneCount =
      countByType(["action_done", "done"]) +
      itemFeedbacks.filter((feedback) => feedback.action_done === true).length;
    const actionNotDoneCount =
      countByType(["action_not_done", "not_done", "not_executed"]) +
      itemFeedbacks.filter((feedback) => feedback.action_done === false).length;

    const score =
      usefulCount * 2 +
      deeperCount * 2 +
      actionDoneCount * 3 -
      notRelevantCount * 3 -
      actionNotDoneCount;

    return {
      id: item.id,
      title: item.title,
      category: item.category,
      difficulty: item.difficulty,
      totalFeedbackCount: itemFeedbacks.length,
      usefulCount,
      deeperCount,
      notRelevantCount,
      actionDoneCount,
      actionNotDoneCount,
      score,
    };
  });
}

function getTopCountValue(rows: CountRow[]) {
  if (rows.length === 0) return null;
  return rows[0];
}

function buildNextContentRecommendations({
  aiEmotionCounts,
  aiIntentCounts,
  blockerCounts,
  actionTimeCounts,
  operationReviewItems,
}: {
  aiEmotionCounts: CountRow[];
  aiIntentCounts: CountRow[];
  blockerCounts: CountRow[];
  actionTimeCounts: CountRow[];
  operationReviewItems: OperationReviewItem[];
}) {
  const recommendations: string[] = [];

  const topEmotion = getTopCountValue(aiEmotionCounts);
  const topIntent = getTopCountValue(aiIntentCounts);
  const topBlocker = getTopCountValue(blockerCounts);
  const topActionTime = getTopCountValue(actionTimeCounts);

  if (topEmotion?.value === "anxious") {
    recommendations.push(
      "불안형 구독자가 많습니다. 과장된 AI 뉴스보다 ‘무엇을 안 해도 되는지’와 ‘작게 확인할 수 있는 것’을 설명하는 자료를 추가하세요."
    );
  }

  if (topEmotion?.value === "fatigue") {
    recommendations.push(
      "정보 피로형 구독자가 많습니다. 긴 전망보다 10분 안에 정리되는 체크리스트형 자료를 우선 등록하세요."
    );
  }

  if (topEmotion?.value === "skeptical") {
    recommendations.push(
      "회의적인 구독자가 많습니다. 성공 사례만보다 한계, 실패 사례, 비용 대비 효과가 함께 보이는 자료를 추가하세요."
    );
  }

  if (topIntent?.value === "service_building") {
    recommendations.push(
      "서비스나 사이트 만들기 목적이 강합니다. ‘아이디어 → 간단한 랜딩페이지 → 사용자 반응 확인’처럼 실행 단계가 보이는 자료를 늘리세요."
    );
  }

  if (topIntent?.value === "work_efficiency") {
    recommendations.push(
      "업무 효율 목적이 많습니다. 이메일, 문서정리, 반복업무 자동화처럼 바로 써볼 수 있는 업무형 AI 활용 자료를 추가하세요."
    );
  }

  if (
    topIntent?.value === "business_opportunity" ||
    topIntent?.value === "business_money"
  ) {
    recommendations.push(
      "사업 기회 관심이 있습니다. 단순 트렌드보다 실제 수익화 구조, 고객 문제, MVP 검증 사례가 있는 자료를 등록하세요."
    );
  }

  if (
    topBlocker?.value === "too_much_info" ||
    topBlocker?.value === "no_clear_start" ||
    topBlocker?.value === "dont_know_what_to_do"
  ) {
    recommendations.push(
      "시작점이 막힌 구독자가 많습니다. ‘오늘 하나만 한다면 무엇인가’가 분명한 자료와 action_hint를 우선하세요."
    );
  }

  if (
    topBlocker?.value === "too_technical" ||
    topBlocker?.value === "technical_difficulty"
  ) {
    recommendations.push(
      "기술 장벽을 느끼는 구독자가 있습니다. 코드 설명보다 결과물, 화면, 따라하기 순서가 보이는 입문 자료를 보강하세요."
    );
  }

  if (topActionTime?.value === "10min" || topActionTime?.value === "30min") {
    recommendations.push(
      `${labelOf(
        topActionTime.value
      )} 안에 할 수 있는 짧은 action_hint가 중요합니다. 자료 등록 시 ‘읽기’보다 ‘한 번 입력해보기’ 수준으로 행동을 줄이세요.`
    );
  }

  const strongItems = operationReviewItems
    .filter((item) => item.score >= 3)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  for (const item of strongItems) {
    recommendations.push(
      `반응이 좋은 자료 “${
        item.title || `#${item.id}`
      }”와 비슷한 카테고리의 후속 자료를 1개 더 등록하세요.`
    );
  }

  const weakItems = operationReviewItems
    .filter(
      (item) =>
        item.totalFeedbackCount > 0 &&
        (item.notRelevantCount > 0 || item.actionNotDoneCount > 0)
    )
    .sort((a, b) => {
      const aWeak = a.notRelevantCount * 2 + a.actionNotDoneCount;
      const bWeak = b.notRelevantCount * 2 + b.actionNotDoneCount;
      return bWeak - aWeak;
    })
    .slice(0, 2);

  for (const item of weakItems) {
    recommendations.push(
      `“${
        item.title || `#${item.id}`
      }”는 반응 보완이 필요합니다. 제목, 타깃, action_hint가 실제 구독자 상태와 맞는지 다시 확인하세요.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "아직 회고 데이터가 충분하지 않습니다. 다음 발송에서는 자료마다 action_hint를 명확히 넣고, 피드백 버튼 클릭을 우선 모아보세요."
    );
  }

  return Array.from(new Set(recommendations)).slice(0, 8);
}

function getOperationReview({
  items,
  feedbacks,
  deliveryLogs,
  aiEmotionCounts,
  aiIntentCounts,
  blockerCounts,
  actionTimeCounts,
}: {
  items: NewsletterItem[];
  feedbacks: Feedback[];
  deliveryLogs: DeliveryLog[];
  aiEmotionCounts: CountRow[];
  aiIntentCounts: CountRow[];
  blockerCounts: CountRow[];
  actionTimeCounts: CountRow[];
}): OperationReview {
  const feedbackGroupCounts = getFeedbackGroupCounts(feedbacks);
  const itemReviewRows = getItemReviewRows({ items, feedbacks });

  const sentLogCount = deliveryLogs.filter((log) => log.status === "sent").length;
  const failedLogCount = deliveryLogs.filter(
    (log) => log.status === "failed"
  ).length;

  const usefulCount = feedbackGroupCounts.reaction.useful;
  const deeperCount = feedbackGroupCounts.reaction.deeper;
  const notRelevantCount = feedbackGroupCounts.reaction.not_relevant;
  const actionDoneCount = feedbackGroupCounts.execution.action_done;
  const actionNotDoneCount = feedbackGroupCounts.execution.action_not_done;

  const executionTotal = actionDoneCount + actionNotDoneCount;
  const reactionTotal = usefulCount + deeperCount + notRelevantCount;

  const topPerformingItems = itemReviewRows
    .filter((item) => item.totalFeedbackCount > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.totalFeedbackCount - a.totalFeedbackCount;
    })
    .slice(0, 5);

  const needsImprovementItems = itemReviewRows
    .filter(
      (item) =>
        item.totalFeedbackCount > 0 &&
        (item.notRelevantCount > 0 || item.actionNotDoneCount > 0)
    )
    .sort((a, b) => {
      const aWeak = a.notRelevantCount * 2 + a.actionNotDoneCount;
      const bWeak = b.notRelevantCount * 2 + b.actionNotDoneCount;

      if (bWeak !== aWeak) return bWeak - aWeak;
      return a.score - b.score;
    })
    .slice(0, 5);

  return {
    totalDeliveryLogs: deliveryLogs.length,
    sentLogCount,
    failedLogCount,
    totalFeedbacks: feedbacks.length,
    usefulCount,
    deeperCount,
    notRelevantCount,
    actionDoneCount,
    actionNotDoneCount,
    executionRate:
      executionTotal > 0
        ? Math.round((actionDoneCount / executionTotal) * 100)
        : 0,
    notRelevantRate:
      reactionTotal > 0
        ? Math.round((notRelevantCount / reactionTotal) * 100)
        : 0,
    topPerformingItems,
    needsImprovementItems,
    nextContentRecommendations: buildNextContentRecommendations({
      aiEmotionCounts,
      aiIntentCounts,
      blockerCounts,
      actionTimeCounts,
      operationReviewItems: itemReviewRows,
    }),
  };
}

async function fetchSubscribersWithFallback(
  supabaseAdmin: ReturnType<typeof getSupabaseAdminClient>
) {
  const fullSelect = `
    id,
    email,
    job_role,
    difficulty,
    ai_emotion,
    ai_intent,
    blocker,
    action_time,
    persona_type,
    is_active,
    unsubscribed_at,
    created_at,
    updated_at
  `;

  const fallbackSelectWithoutSubscriptionColumns = `
    id,
    email,
    job_role,
    difficulty,
    ai_emotion,
    ai_intent,
    blocker,
    action_time,
    persona_type,
    created_at,
    updated_at
  `;

  const fallbackSelectWithoutUpdatedAt = `
    id,
    email,
    job_role,
    difficulty,
    ai_emotion,
    ai_intent,
    blocker,
    action_time,
    persona_type,
    created_at
  `;

  const firstResult = await supabaseAdmin
    .from("subscribers")
    .select(fullSelect)
    .order("created_at", { ascending: false });

  if (!firstResult.error) {
    return {
      data: (firstResult.data || []) as Subscriber[],
      error: null,
      usedFallback: false,
      missingSubscriptionColumns: false,
      missingUpdatedAtColumn: false,
    };
  }

  const secondResult = await supabaseAdmin
    .from("subscribers")
    .select(fallbackSelectWithoutSubscriptionColumns)
    .order("created_at", { ascending: false });

  if (!secondResult.error) {
    const subscribers = (secondResult.data || []).map((subscriber) => ({
      ...subscriber,
      is_active: true,
      unsubscribed_at: null,
    })) as Subscriber[];

    return {
      data: subscribers,
      error: null,
      usedFallback: true,
      missingSubscriptionColumns: true,
      missingUpdatedAtColumn: false,
    };
  }

  const fallbackResult = await supabaseAdmin
    .from("subscribers")
    .select(fallbackSelectWithoutUpdatedAt)
    .order("created_at", { ascending: false });

  if (fallbackResult.error) {
    return {
      data: [],
      error: fallbackResult.error,
      usedFallback: true,
      missingSubscriptionColumns: true,
      missingUpdatedAtColumn: true,
    };
  }

  const subscribers = (fallbackResult.data || []).map((subscriber) => ({
    ...subscriber,
    is_active: true,
    unsubscribed_at: null,
    updated_at: null,
  })) as Subscriber[];

  return {
    data: subscribers,
    error: null,
    usedFallback: true,
    missingSubscriptionColumns: true,
    missingUpdatedAtColumn: true,
  };
}

async function fetchFeedbacksWithFallback(
  supabaseAdmin: ReturnType<typeof getSupabaseAdminClient>
) {
  const fullSelect = `
    id,
    subscriber_id,
    subscriber_email,
    newsletter_item_id,
    feedback_type,
    action_done,
    free_text,
    created_at
  `;

  const fallbackSelect = `
    id,
    subscriber_id,
    subscriber_email,
    newsletter_item_id,
    feedback_type,
    action_done,
    created_at
  `;

  const firstResult = await supabaseAdmin
    .from("feedbacks")
    .select(fullSelect)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (!firstResult.error) {
    return {
      data: (firstResult.data || []) as Feedback[],
      error: null,
      usedFallback: false,
    };
  }

  const fallbackResult = await supabaseAdmin
    .from("feedbacks")
    .select(fallbackSelect)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (fallbackResult.error) {
    return {
      data: [],
      error: fallbackResult.error,
      usedFallback: true,
    };
  }

  const feedbacks = (fallbackResult.data || []).map((feedback) => ({
    ...feedback,
    free_text: null,
  })) as Feedback[];

  return {
    data: feedbacks,
    error: null,
    usedFallback: true,
  };
}

async function getAdminStats(request: NextRequest, body?: RequestBody) {
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

  const supabaseAdmin = getSupabaseAdminClient();

  const subscribersResult = await fetchSubscribersWithFallback(supabaseAdmin);

  if (subscribersResult.error) {
    return NextResponse.json(
      {
        ok: false,
        message: "구독자 조회 실패",
        detail: subscribersResult.error.message,
      },
      { status: 500 }
    );
  }

  const safeSubscribers = subscribersResult.data;
  const subscriberStats = getSubscriberStats(safeSubscribers);
  const recentUnsubscribedSubscribers =
    getRecentUnsubscribedSubscribers(safeSubscribers);

  const subscriberIds = safeSubscribers.map((subscriber) => subscriber.id);

  const { data: categoryAnswers, error: categoryAnswersError } =
    subscriberIds.length > 0
      ? await supabaseAdmin
          .from("subscriber_category_answers")
          .select("subscriber_id, group_key, option_value")
          .in("subscriber_id", subscriberIds)
      : { data: [], error: null };

  if (categoryAnswersError) {
    return NextResponse.json(
      {
        ok: false,
        message: "구독자 카테고리 응답 조회 실패",
        detail: categoryAnswersError.message,
      },
      { status: 500 }
    );
  }

  const { data: newsletterItems, error: newsletterItemsError } =
    await supabaseAdmin
      .from("newsletter_items")
      .select(
        `
        id,
        title,
        category,
        difficulty,
        target_ai_emotion,
        target_ai_intent,
        target_blocker,
        target_action_time,
        is_active,
        is_sent,
        created_at
      `
      )
      .order("created_at", { ascending: false });

  if (newsletterItemsError) {
    return NextResponse.json(
      {
        ok: false,
        message: "뉴스 자료 조회 실패",
        detail: newsletterItemsError.message,
      },
      { status: 500 }
    );
  }

  const safeNewsletterItems = (newsletterItems || []) as NewsletterItem[];
  const itemMap = buildNewsletterItemMap(safeNewsletterItems);

  const { data: deliveryLogs, error: deliveryLogsError } = await supabaseAdmin
    .from("newsletter_delivery_logs")
    .select(
      `
      id,
      subscriber_id,
      subscriber_email,
      newsletter_item_id,
      status,
      error_message,
      created_at
    `
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (deliveryLogsError) {
    return NextResponse.json(
      {
        ok: false,
        message: "발송 로그 조회 실패",
        detail: deliveryLogsError.message,
      },
      { status: 500 }
    );
  }

  const feedbacksResult = await fetchFeedbacksWithFallback(supabaseAdmin);

  if (feedbacksResult.error) {
    return NextResponse.json(
      {
        ok: false,
        message: "피드백 조회 실패",
        detail: feedbacksResult.error.message,
      },
      { status: 500 }
    );
  }

  const safeCategoryAnswers =
    (categoryAnswers || []) as SubscriberCategoryAnswer[];
  const safeDeliveryLogs = (deliveryLogs || []) as DeliveryLog[];
  const safeFeedbacks = feedbacksResult.data;

  const newsletterStats = getNewsletterStats(safeNewsletterItems);

  const recentFeedbacks = attachFeedbackItemTitle({
    feedbacks: safeFeedbacks.slice(0, 20),
    itemMap,
  });

  const recentDeliveryLogs = attachDeliveryLogItemTitle({
    deliveryLogs: safeDeliveryLogs.slice(0, 40),
    itemMap,
  });

  const recentNewsletterItems = safeNewsletterItems
    .slice(0, 20)
    .map((item) =>
      getNewsletterItemFeedbackStats({
        item,
        feedbacks: safeFeedbacks,
      })
    );

  const aiEmotionCounts = countByValue(
    safeSubscribers,
    (subscriber) => subscriber.ai_emotion,
    "Unknown"
  );

  const aiIntentCounts = countByValue(
    safeSubscribers,
    (subscriber) => subscriber.ai_intent,
    "Unknown"
  );

  const blockerCounts = countByValue(
    safeSubscribers,
    (subscriber) => subscriber.blocker,
    "Unknown"
  );

  const actionTimeCounts = countByValue(
    safeSubscribers,
    (subscriber) => subscriber.action_time,
    "Unknown"
  );

  const operationReview = getOperationReview({
    items: safeNewsletterItems,
    feedbacks: safeFeedbacks,
    deliveryLogs: safeDeliveryLogs,
    aiEmotionCounts,
    aiIntentCounts,
    blockerCounts,
    actionTimeCounts,
  });

  const fallbackWarnings: string[] = [];

  if (subscribersResult.missingSubscriptionColumns) {
    fallbackWarnings.push(
      "subscribers.is_active 또는 subscribers.unsubscribed_at 컬럼이 없어 구독 상태는 기본 활성으로 표시됩니다. SQL 마이그레이션을 확인하세요."
    );
  }

  if (subscribersResult.missingUpdatedAtColumn) {
    fallbackWarnings.push(
      "subscribers.updated_at 컬럼이 없어 updated_at은 null로 표시됩니다."
    );
  }

  if (feedbacksResult.usedFallback) {
    fallbackWarnings.push(
      "feedbacks.free_text 컬럼이 없어 free_text는 null로 표시됩니다."
    );
  }

  return NextResponse.json({
    ok: true,
    message:
      fallbackWarnings.length > 0
        ? `관리자 데이터를 불러왔습니다. ${fallbackWarnings.join(" ")}`
        : "관리자 데이터를 불러왔습니다.",

    totalSubscribers: safeSubscribers.length,
    activeSubscribers: subscriberStats.active,
    inactiveSubscribers: subscriberStats.inactive,
    unsubscribedSubscribers: subscriberStats.unsubscribed,
    totalFeedbacks: safeFeedbacks.length,
    totalNewsletterItems: newsletterStats.total,
    totalDeliveryLogs: safeDeliveryLogs.length,

    subscriberStats,

    personaCounts: countByValue(
      safeSubscribers,
      (subscriber) => subscriber.persona_type,
      "Unknown"
    ),

    aiEmotionCounts,
    aiIntentCounts,
    blockerCounts,
    actionTimeCounts,

    categoryAnswerCounts: getCategoryAnswerCounts(safeCategoryAnswers),

    feedbackCounts: countByValue(
      safeFeedbacks,
      (feedback) => feedback.feedback_type,
      "unknown"
    ),

    feedbackGroupCounts: getFeedbackGroupCounts(safeFeedbacks),

    reactionFeedbackCounts: countByValue(
      safeFeedbacks.filter((feedback) =>
        [
          "useful",
          "deeper",
          "not_relevant",
          "not_interested",
          "less_relevant",
          "hard",
          "less_anxious",
          "different",
        ].includes(normalizeText(feedback.feedback_type))
      ),
      (feedback) => feedback.feedback_type,
      "unknown"
    ),

    executionFeedbackCounts: countByValue(
      safeFeedbacks.filter((feedback) =>
        [
          "action_done",
          "done",
          "action_not_done",
          "not_done",
          "not_executed",
        ].includes(normalizeText(feedback.feedback_type))
      ),
      (feedback) => feedback.feedback_type,
      "unknown"
    ),

    actionDoneCounts: countByBoolean(
      safeFeedbacks,
      (feedback) => feedback.action_done
    ),

    deliveryStatusCounts: countByValue(
      safeDeliveryLogs,
      (log) => log.status,
      "unknown"
    ),

    newsletterStats,
    operationReview,

    recentSubscribers: safeSubscribers.slice(0, 50),
    recentUnsubscribedSubscribers,
    recentFeedbacks,
    recentDeliveryLogs,
    recentNewsletterItems,

    fallbackWarnings,
  });
}

export async function GET(request: NextRequest) {
  try {
    return await getAdminStats(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        ok: false,
        message: "관리자 통계 조회 중 서버 오류",
        detail: message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readRequestBody(request);
    return await getAdminStats(request, body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        ok: false,
        message: "관리자 통계 조회 중 서버 오류",
        detail: message,
      },
      { status: 500 }
    );
  }
}