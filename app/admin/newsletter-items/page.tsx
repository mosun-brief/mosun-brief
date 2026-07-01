"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";

type CategoryGroupKey = "ai_emotion" | "ai_intent" | "blocker" | "action_time";

type CategoryGroup = {
  id?: number;
  group_key: CategoryGroupKey;
  label: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

type CategoryOption = {
  id?: number;
  group_key: CategoryGroupKey;
  option_value: string;
  label: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

type CategoryBundle = {
  group: CategoryGroup;
  options: CategoryOption[];
};

type NewsletterItem = {
  id: number;
  title: string | null;
  category: string | null;
  difficulty: string | null;
  summary: string | null;
  url: string | null;
  source_type: string | null;
  stance: string | null;
  target_persona: string | null;
  source_url: string | null;
  main_summary: string | null;
  balance_summary: string | null;
  action_hint: string | null;
  target_user_state: string | null;
  target_ai_emotion: string | null;
  target_ai_intent: string | null;
  target_blocker: string | null;
  target_action_time: string | null;
  is_active: boolean | null;
  is_sent: boolean | null;
  created_at: string | null;
  category_targets?: {
    group_key: CategoryGroupKey;
    option_value: string;
  }[];
};

type NewsletterItemsResponse = {
  ok?: boolean;
  message?: string;
  items?: NewsletterItem[];
  item?: NewsletterItem;
  rawText?: string;
};

const FALLBACK_GROUPS: CategoryGroup[] = [
  {
    group_key: "ai_emotion",
    label: "AI에 대한 감정",
    description: "AI를 볼 때 지금 가장 가까운 감정",
    sort_order: 1,
    is_active: true,
  },
  {
    group_key: "ai_intent",
    label: "AI로 하고 싶은 거",
    description: "AI를 통해 얻고 싶은 목적",
    sort_order: 2,
    is_active: true,
  },
  {
    group_key: "blocker",
    label: "지금 막히는 거",
    description: "AI 활용을 시작하지 못하게 하는 이유",
    sort_order: 3,
    is_active: true,
  },
  {
    group_key: "action_time",
    label: "이번 주 가능한 행동 시간",
    description: "이번 주에 실제로 쓸 수 있는 시간",
    sort_order: 4,
    is_active: true,
  },
];

const FALLBACK_OPTIONS: CategoryOption[] = [
  {
    group_key: "ai_emotion",
    option_value: "curious",
    label: "호기심",
    description: null,
    sort_order: 1,
    is_active: true,
  },
  {
    group_key: "ai_emotion",
    option_value: "excited",
    label: "기대됨",
    description: null,
    sort_order: 2,
    is_active: true,
  },
  {
    group_key: "ai_emotion",
    option_value: "anxious",
    label: "불안",
    description: null,
    sort_order: 3,
    is_active: true,
  },
  {
    group_key: "ai_emotion",
    option_value: "fatigue",
    label: "정보가 너무 많아 피곤",
    description: null,
    sort_order: 4,
    is_active: true,
  },
  {
    group_key: "ai_emotion",
    option_value: "skeptical",
    label: "회의적",
    description: null,
    sort_order: 5,
    is_active: true,
  },
  {
    group_key: "ai_emotion",
    option_value: "unsure",
    label: "잘 모르겠음",
    description: null,
    sort_order: 6,
    is_active: true,
  },
  {
    group_key: "ai_intent",
    option_value: "not_sure",
    label: "아직 모름",
    description: null,
    sort_order: 1,
    is_active: true,
  },
  {
    group_key: "ai_intent",
    option_value: "work_efficiency",
    label: "업무 효율 높이기",
    description: null,
    sort_order: 2,
    is_active: true,
  },
  {
    group_key: "ai_intent",
    option_value: "service_building",
    label: "서비스나 사이트 만들기",
    description: null,
    sort_order: 3,
    is_active: true,
  },
  {
    group_key: "ai_intent",
    option_value: "learning",
    label: "공부나 자기계발",
    description: null,
    sort_order: 4,
    is_active: true,
  },
  {
    group_key: "ai_intent",
    option_value: "creative_writing",
    label: "글쓰기/창작",
    description: null,
    sort_order: 5,
    is_active: true,
  },
  {
    group_key: "ai_intent",
    option_value: "writing_creation",
    label: "글쓰기/창작",
    description: null,
    sort_order: 5,
    is_active: true,
  },
  {
    group_key: "ai_intent",
    option_value: "business_opportunity",
    label: "사업 기회나 돈 벌 기회",
    description: null,
    sort_order: 6,
    is_active: true,
  },
  {
    group_key: "ai_intent",
    option_value: "business_money",
    label: "사업 기회나 돈 벌 기회",
    description: null,
    sort_order: 6,
    is_active: true,
  },
  {
    group_key: "ai_intent",
    option_value: "avoid_but_need",
    label: "피하고 싶으나 알아야겠음",
    description: null,
    sort_order: 7,
    is_active: true,
  },
  {
    group_key: "blocker",
    option_value: "too_much_info",
    label: "정보가 너무 많아 정리가 안됨",
    description: null,
    sort_order: 1,
    is_active: true,
  },
  {
    group_key: "blocker",
    option_value: "no_clear_start",
    label: "뭘 해야할 지 모르겠음",
    description: null,
    sort_order: 2,
    is_active: true,
  },
  {
    group_key: "blocker",
    option_value: "dont_know_what_to_do",
    label: "뭘 해야할 지 모르겠음",
    description: null,
    sort_order: 2,
    is_active: true,
  },
  {
    group_key: "blocker",
    option_value: "too_technical",
    label: "기술적인 내용이 어려움",
    description: null,
    sort_order: 3,
    is_active: true,
  },
  {
    group_key: "blocker",
    option_value: "technical_difficulty",
    label: "기술적인 내용이 어려움",
    description: null,
    sort_order: 3,
    is_active: true,
  },
  {
    group_key: "blocker",
    option_value: "no_time",
    label: "시간 없음",
    description: null,
    sort_order: 4,
    is_active: true,
  },
  {
    group_key: "blocker",
    option_value: "fear_of_falling_behind",
    label: "뒤처질까봐 불안",
    description: null,
    sort_order: 5,
    is_active: true,
  },
  {
    group_key: "blocker",
    option_value: "low_need",
    label: "아직 필요성을 모르겠음",
    description: null,
    sort_order: 6,
    is_active: true,
  },
  {
    group_key: "blocker",
    option_value: "not_needed_yet",
    label: "아직 필요성을 모르겠음",
    description: null,
    sort_order: 6,
    is_active: true,
  },
  {
    group_key: "action_time",
    option_value: "10min",
    label: "10분",
    description: null,
    sort_order: 1,
    is_active: true,
  },
  {
    group_key: "action_time",
    option_value: "30min",
    label: "30분",
    description: null,
    sort_order: 2,
    is_active: true,
  },
  {
    group_key: "action_time",
    option_value: "2hours",
    label: "2시간",
    description: null,
    sort_order: 3,
    is_active: true,
  },
  {
    group_key: "action_time",
    option_value: "half_day_weekend",
    label: "주말 반나절",
    description: null,
    sort_order: 4,
    is_active: true,
  },
  {
    group_key: "action_time",
    option_value: "half_weekend",
    label: "주말 반나절",
    description: null,
    sort_order: 4,
    is_active: true,
  },
];

const CATEGORY_OPTIONS = [
  { value: "general_ai", label: "전반적인 AI" },
  { value: "productivity", label: "업무 활용" },
  { value: "healthcare_ai", label: "의료 AI" },
  { value: "robotics", label: "로봇" },
  { value: "investment", label: "AI 투자" },
  { value: "research", label: "연구" },
  { value: "startup", label: "스타트업" },
  { value: "ethics", label: "윤리/리스크" },
];

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "입문" },
  { value: "normal", label: "중간" },
  { value: "expert", label: "심화" },
];

const SOURCE_TYPE_OPTIONS = [
  { value: "main", label: "메인" },
  { value: "counter", label: "반대/주의" },
  { value: "case", label: "사례" },
];

const STANCE_OPTIONS = [
  { value: "neutral", label: "중립" },
  { value: "pro_ai", label: "긍정" },
  { value: "critical", label: "비판" },
];

const OPERATION_TEMPLATE = `[AI-FU 자료 등록 템플릿]

1. 자료 제목:
2. 원문 URL:
3. 이 자료를 한 줄로 말하면:
4. 이 자료가 중요한 이유:
5. AI에 대한 감정 타깃:
6. AI로 하고 싶은 것 타깃:
7. 지금 막히는 것 타깃:
8. 이번 주 가능한 행동 시간:
9. 추천 action_hint:
10. 이메일 본문 초안:

[등록 전 판단]
- 이 자료는 누구에게 특히 필요한가?
- 읽고 끝나는 자료인가, 작은 행동으로 이어지는 자료인가?
- 과장/한계/주의점을 함께 설명할 수 있는가?`;

const QUICK_DRAFT_TEMPLATE = `제목:
원문 URL:
카테고리: general_ai / productivity / healthcare_ai / robotics / investment / research / startup / ethics
난이도: easy / normal / expert
자료 유형: main / counter / case
관점: neutral / pro_ai / critical

메인 요약:

균형 관점:

Action hint:

타깃:
- AI에 대한 감정:
- AI로 하고 싶은 거:
- 지금 막히는 거:
- 이번 주 가능한 행동 시간:`;

const OPERATION_CHECKLIST = [
  "제목만 봐도 누가 읽어야 할지 보이는가?",
  "이 자료가 온 이유를 설명할 수 있는가?",
  "action_hint가 실제로 이번 주 안에 가능한 작은 행동인가?",
  "너무 일반적인 AI 뉴스가 아니라 특정 감정/목적/막힘에 연결되는가?",
  "균형 관점에 과장, 한계, 주의점 중 하나 이상이 들어가는가?",
  "원문 URL을 통해 출처 확인이 가능한가?",
];

const VALUE_LABELS: Record<string, string> = {
  ai_emotion: "AI에 대한 감정",
  ai_intent: "AI로 하고 싶은 거",
  blocker: "지금 막히는 거",
  action_time: "이번 주 가능한 행동 시간",

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

  main: "메인",
  counter: "반대/주의",
  case: "사례",

  neutral: "중립",
  pro_ai: "긍정",
  critical: "비판",
};

function labelOf(value: string | null | undefined) {
  if (!value) return "-";
  return VALUE_LABELS[value] || value;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString("ko-KR");
  } catch {
    return value;
  }
}

function buildBundles(groups: CategoryGroup[], options: CategoryOption[]) {
  return groups
    .filter((group) => group.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((group) => ({
      group,
      options: options
        .filter(
          (option) => option.is_active && option.group_key === group.group_key
        )
        .sort((a, b) => a.sort_order - b.sort_order),
    }));
}

async function readApiResponse(
  response: Response
): Promise<NewsletterItemsResponse> {
  const text = await response.text();

  if (!text) {
    return {
      ok: false,
      message: `API가 빈 응답을 반환했습니다. status=${response.status}`,
    };
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      ok: false,
      message: `JSON이 아닌 응답을 받았습니다. status=${response.status}`,
      rawText: text.slice(0, 1000),
    };
  }
}

const DRAFT_SECTION_LABELS = [
  "제목",
  "원문 URL",
  "카테고리",
  "난이도",
  "자료 유형",
  "관점",
  "메인 요약",
  "균형 관점",
  "Action hint",
  "추천 타깃",
  "타깃",
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractDraftSection(rawText: string, label: string) {
  const normalized = rawText.replace(/\r\n/g, "\n").trim();
  const labelPattern = DRAFT_SECTION_LABELS.map(escapeRegExp).join("|");

  const pattern = new RegExp(
    `(?:^|\\n)${escapeRegExp(label)}\\s*:\\s*\\n?([\\s\\S]*?)(?=\\n(?:${labelPattern})\\s*:\\s*\\n?|$)`,
    "i"
  );

  const match = normalized.match(pattern);
  return match?.[1]?.trim() || "";
}

function extractOptionValue(rawValue: string, allowedValues: string[]) {
  const cleaned = rawValue.trim();

  if (!cleaned) return "";

  const parenthesisMatch = cleaned.match(/\(([^)]+)\)/);
  if (parenthesisMatch && allowedValues.includes(parenthesisMatch[1])) {
    return parenthesisMatch[1];
  }

  const directValue = allowedValues.find((value) => cleaned.includes(value));
  if (directValue) return directValue;

  const labelValue = allowedValues.find((value) =>
    cleaned.includes(labelOf(value))
  );
  return labelValue || "";
}

function optionValuesForGroup(groupKey: CategoryGroupKey) {
  return FALLBACK_OPTIONS.filter((option) => option.group_key === groupKey).map(
    (option) => option.option_value
  );
}

function parseTargetLine(targetText: string, groupKey: CategoryGroupKey) {
  const groupLabelMap: Record<CategoryGroupKey, string[]> = {
    ai_emotion: ["AI에 대한 감정", "ai_emotion"],
    ai_intent: ["AI로 하고 싶은 것", "AI로 하고 싶은 거", "ai_intent"],
    blocker: ["지금 막히는 것", "지금 막히는 거", "blocker"],
    action_time: ["이번 주 가능한 행동 시간", "action_time"],
  };

  const labels = groupLabelMap[groupKey];
  const targetLine = targetText
    .split("\n")
    .map((line) => line.replace(/^[-•]\s*/, "").trim())
    .find((line) => labels.some((label) => line.startsWith(label)));

  if (!targetLine) return [];

  const valueText = targetLine.split(":").slice(1).join(":").trim();
  if (!valueText || valueText === "전체") return [];

  const allowedValues = optionValuesForGroup(groupKey);
  const pieces = valueText
    .split(",")
    .map((piece) => piece.trim())
    .filter(Boolean);

  const matched = pieces
    .map((piece) => extractOptionValue(piece, allowedValues))
    .filter(Boolean);

  return Array.from(new Set(matched));
}

function parseDraftPasteText(rawText: string) {
  const categoryValues = CATEGORY_OPTIONS.map((option) => option.value);
  const difficultyValues = DIFFICULTY_OPTIONS.map((option) => option.value);
  const sourceTypeValues = SOURCE_TYPE_OPTIONS.map((option) => option.value);
  const stanceValues = STANCE_OPTIONS.map((option) => option.value);

  const targetText =
    extractDraftSection(rawText, "추천 타깃") ||
    extractDraftSection(rawText, "타깃");

  return {
    title: extractDraftSection(rawText, "제목"),
    sourceUrl: extractDraftSection(rawText, "원문 URL"),
    category: extractOptionValue(
      extractDraftSection(rawText, "카테고리"),
      categoryValues
    ),
    difficulty: extractOptionValue(
      extractDraftSection(rawText, "난이도"),
      difficultyValues
    ),
    sourceType: extractOptionValue(
      extractDraftSection(rawText, "자료 유형"),
      sourceTypeValues
    ),
    stance: extractOptionValue(
      extractDraftSection(rawText, "관점"),
      stanceValues
    ),
    mainSummary: extractDraftSection(rawText, "메인 요약"),
    balanceSummary: extractDraftSection(rawText, "균형 관점"),
    actionHint: extractDraftSection(rawText, "Action hint"),
    targets: {
      ai_emotion: parseTargetLine(targetText, "ai_emotion"),
      ai_intent: parseTargetLine(targetText, "ai_intent"),
      blocker: parseTargetLine(targetText, "blocker"),
      action_time: parseTargetLine(targetText, "action_time"),
    } satisfies Record<CategoryGroupKey, string[]>,
  };
}

function hasParsedDraftValue(parsed: ReturnType<typeof parseDraftPasteText>) {
  return Boolean(
    parsed.title ||
      parsed.sourceUrl ||
      parsed.mainSummary ||
      parsed.balanceSummary ||
      parsed.actionHint ||
      parsed.category ||
      parsed.difficulty ||
      parsed.sourceType ||
      parsed.stance ||
      Object.values(parsed.targets).some((values) => values.length > 0)
  );
}

export default function NewsletterItemsAdminPage() {
  const [adminSecret, setAdminSecret] = useState("");

  const [groups, setGroups] = useState<CategoryGroup[]>(FALLBACK_GROUPS);
  const [options, setOptions] = useState<CategoryOption[]>(FALLBACK_OPTIONS);
  const [items, setItems] = useState<NewsletterItem[]>([]);

  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [category, setCategory] = useState("general_ai");
  const [difficulty, setDifficulty] = useState("normal");
  const [sourceType, setSourceType] = useState("main");
  const [stance, setStance] = useState("neutral");
  const [mainSummary, setMainSummary] = useState("");
  const [balanceSummary, setBalanceSummary] = useState("");
  const [actionHint, setActionHint] = useState("");

  const [selectedTargets, setSelectedTargets] = useState<
    Record<CategoryGroupKey, string[]>
  >({
    ai_emotion: [],
    ai_intent: [],
    blocker: [],
    action_time: [],
  });

  const [loading, setLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [message, setMessage] = useState("");
  const [debugText, setDebugText] = useState("");
  const [showInactive, setShowInactive] = useState(true);
  const [copyMessage, setCopyMessage] = useState("");
  const [draftPasteText, setDraftPasteText] = useState("");

  const bundles = useMemo(
    () => buildBundles(groups, options),
    [groups, options]
  );

  const filteredItems = useMemo(() => {
    if (showInactive) return items;
    return items.filter((item) => item.is_active);
  }, [items, showInactive]);

  const activeCount = items.filter((item) => item.is_active).length;
  const inactiveCount = items.filter((item) => !item.is_active).length;

  const selectedTargetCount = Object.values(selectedTargets).reduce(
    (sum, values) => sum + values.length,
    0
  );

  const currentDraftText = useMemo(() => {
    const selectedTargetText = Object.entries(selectedTargets)
      .map(([groupKey, values]) => {
        const labels = values.map((value) => labelOf(value)).join(", ");
        return `- ${labelOf(groupKey)}: ${labels || "전체"}`;
      })
      .join("\n");

    return `제목: ${title || ""}
원문 URL: ${sourceUrl || ""}
카테고리: ${labelOf(category)} (${category})
난이도: ${labelOf(difficulty)} (${difficulty})
자료 유형: ${labelOf(sourceType)} (${sourceType})
관점: ${labelOf(stance)} (${stance})

메인 요약:
${mainSummary || ""}

균형 관점:
${balanceSummary || ""}

Action hint:
${actionHint || ""}

타깃:
${selectedTargetText}`;
  }, [
    title,
    sourceUrl,
    category,
    difficulty,
    sourceType,
    stance,
    mainSummary,
    balanceSummary,
    actionHint,
    selectedTargets,
  ]);

  const qualityChecks = useMemo(() => {
    const trimmedTitle = title.trim();
    const trimmedSourceUrl = sourceUrl.trim();
    const trimmedMainSummary = mainSummary.trim();
    const trimmedBalanceSummary = balanceSummary.trim();
    const trimmedActionHint = actionHint.trim();

    const duplicatedTitle = Boolean(
      trimmedTitle &&
        items.some(
          (item) =>
            (item.title || "").trim().toLowerCase() ===
            trimmedTitle.toLowerCase()
        )
    );

    const duplicatedUrl = Boolean(
      trimmedSourceUrl &&
        items.some((item) => {
          const itemUrl = (item.source_url || item.url || "").trim();
          return itemUrl && itemUrl === trimmedSourceUrl;
        })
    );

    return [
      {
        key: "title",
        level: trimmedTitle ? "pass" : "fail",
        label: "제목 입력됨",
        help: trimmedTitle
          ? "자료 목록과 메일 카드에 표시됩니다."
          : "제목은 필수입니다.",
      },
      {
        key: "mainSummary",
        level: trimmedMainSummary ? "pass" : "fail",
        label: "핵심 요약 입력됨",
        help: trimmedMainSummary
          ? "메일의 핵심 요약 영역에 들어갑니다."
          : "핵심 요약은 필수입니다.",
      },
      {
        key: "actionHint",
        level: trimmedActionHint ? "pass" : "fail",
        label: "Action hint 입력됨",
        help: trimmedActionHint
          ? "구독자가 바로 실행할 작은 행동으로 사용됩니다."
          : "B단계부터 Action hint는 필수입니다.",
      },
      {
        key: "balanceSummary",
        level: trimmedBalanceSummary ? "pass" : "warn",
        label: "균형 관점 입력됨",
        help: trimmedBalanceSummary
          ? "과장/한계/주의점을 함께 전달합니다."
          : "비워도 저장은 가능하지만, 서비스 신뢰도를 위해 보완 권장입니다.",
      },
      {
        key: "targets",
        level: selectedTargetCount > 0 ? "pass" : "warn",
        label: "타깃 카테고리 선택됨",
        help:
          selectedTargetCount > 0
            ? `${selectedTargetCount}개 타깃 조건이 선택되었습니다.`
            : "비워두면 전체 대상 자료로 발송 후보가 됩니다.",
      },
      {
        key: "url",
        level: trimmedSourceUrl ? "pass" : "warn",
        label: "원문 URL 입력됨",
        help: trimmedSourceUrl
          ? "메일의 원문 보기 버튼으로 연결됩니다."
          : "URL이 없어도 저장은 가능하지만, 출처 확인이 어려워집니다.",
      },
      {
        key: "duplicateTitle",
        level: duplicatedTitle ? "warn" : "pass",
        label: "제목 중복 확인",
        help: duplicatedTitle
          ? "이미 같은 제목의 자료가 있습니다. 중복 등록인지 확인하세요."
          : "현재 제목 기준 중복 가능성이 낮습니다.",
      },
      {
        key: "duplicateUrl",
        level: duplicatedUrl ? "warn" : "pass",
        label: "URL 중복 확인",
        help: duplicatedUrl
          ? "이미 같은 URL의 자료가 있습니다. 중복 등록인지 확인하세요."
          : "현재 URL 기준 중복 가능성이 낮습니다.",
      },
    ] as {
      key: string;
      level: "pass" | "warn" | "fail";
      label: string;
      help: string;
    }[];
  }, [
    title,
    sourceUrl,
    mainSummary,
    balanceSummary,
    actionHint,
    selectedTargetCount,
    items,
  ]);

  const qualityFailCount = qualityChecks.filter(
    (check) => check.level === "fail"
  ).length;

  const qualityWarnCount = qualityChecks.filter(
    (check) => check.level === "warn"
  ).length;

  const qualityStatus =
    qualityFailCount > 0
      ? "blocked"
      : qualityWarnCount > 0
      ? "warning"
      : "ready";

  useEffect(() => {
    const savedSecret = window.localStorage.getItem("aifu_admin_secret") || "";
    setAdminSecret(savedSecret);
  }, []);

  useEffect(() => {
    loadCategoryData();
  }, []);

  useEffect(() => {
    if (adminSecret.trim()) {
      loadItems(adminSecret.trim());
    }
  }, [adminSecret]);

  async function copyToClipboard(text: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage(successMessage);
      window.setTimeout(() => setCopyMessage(""), 2200);
    } catch {
      setCopyMessage("복사에 실패했습니다. 텍스트를 직접 선택해서 복사해주세요.");
      window.setTimeout(() => setCopyMessage(""), 3000);
    }
  }

  async function loadCategoryData() {
    try {
      const [groupResponse, optionResponse] = await Promise.all([
        fetch("/api/category-groups"),
        fetch("/api/category-options"),
      ]);

      if (!groupResponse.ok || !optionResponse.ok) {
        setGroups(FALLBACK_GROUPS);
        setOptions(FALLBACK_OPTIONS);
        return;
      }

      const groupResult = await groupResponse.json();
      const optionResult = await optionResponse.json();

      if (groupResult?.groups?.length > 0) {
        setGroups(groupResult.groups);
      }

      if (optionResult?.options?.length > 0) {
        setOptions(optionResult.options);
      }
    } catch {
      setGroups(FALLBACK_GROUPS);
      setOptions(FALLBACK_OPTIONS);
    }
  }

  async function loadItems(secret = adminSecret.trim()) {
    if (!secret) {
      setMessage("ADMIN_SECRET을 입력해주세요.");
      return;
    }

    setLoadingItems(true);
    setMessage("");

    try {
      const response = await fetch("/api/newsletter-items", {
        method: "GET",
        headers: {
          "x-admin-secret": secret,
        },
      });

      const result = await readApiResponse(response);

      if (!response.ok || !result.ok) {
        setMessage(result.message || "뉴스 자료를 불러오지 못했습니다.");
        setDebugText(result.rawText || JSON.stringify(result, null, 2));
        return;
      }

      setItems(result.items || []);
      setMessage(result.message || "뉴스 자료를 불러왔습니다.");
      setDebugText(JSON.stringify(result, null, 2));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setMessage(`뉴스 자료 로딩 중 오류가 발생했습니다. ${errorMessage}`);
    } finally {
      setLoadingItems(false);
    }
  }

  function saveAdminSecret() {
    if (!adminSecret.trim()) {
      setMessage("ADMIN_SECRET을 입력해주세요.");
      return;
    }

    window.localStorage.setItem("aifu_admin_secret", adminSecret.trim());
    setMessage("ADMIN_SECRET이 저장되었습니다.");
    loadItems(adminSecret.trim());
  }

  function toggleTarget(groupKey: CategoryGroupKey, optionValue: string) {
    setSelectedTargets((prev) => {
      const current = prev[groupKey] || [];
      const exists = current.includes(optionValue);

      return {
        ...prev,
        [groupKey]: exists
          ? current.filter((value) => value !== optionValue)
          : [...current, optionValue],
      };
    });
  }

  function resetForm() {
    setTitle("");
    setSourceUrl("");
    setCategory("general_ai");
    setDifficulty("normal");
    setSourceType("main");
    setStance("neutral");
    setMainSummary("");
    setBalanceSummary("");
    setActionHint("");
    setSelectedTargets({
      ai_emotion: [],
      ai_intent: [],
      blocker: [],
      action_time: [],
    });
  }

  function applyDraftPasteText() {
    const parsed = parseDraftPasteText(draftPasteText);

    if (!hasParsedDraftValue(parsed)) {
      setMessage(
        "붙여넣은 초안에서 읽을 수 있는 항목이 없습니다. C-2의 전체 등록 초안 형식인지 확인해주세요."
      );
      return;
    }

    if (parsed.title) setTitle(parsed.title);
    if (parsed.sourceUrl) setSourceUrl(parsed.sourceUrl);
    if (parsed.category) setCategory(parsed.category);
    if (parsed.difficulty) setDifficulty(parsed.difficulty);
    if (parsed.sourceType) setSourceType(parsed.sourceType);
    if (parsed.stance) setStance(parsed.stance);
    if (parsed.mainSummary) setMainSummary(parsed.mainSummary);
    if (parsed.balanceSummary) setBalanceSummary(parsed.balanceSummary);
    if (parsed.actionHint) setActionHint(parsed.actionHint);

    setSelectedTargets(parsed.targets);

    const parsedTargetCount = Object.values(parsed.targets).reduce(
      (sum, values) => sum + values.length,
      0
    );

    setMessage(
      `초안에서 입력값을 채웠습니다. 타깃 ${parsedTargetCount}개를 인식했습니다.`
    );
  }

  function clearDraftPasteText() {
    setDraftPasteText("");
    setMessage("붙여넣기 입력창을 비웠습니다.");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!adminSecret.trim()) {
      setMessage("ADMIN_SECRET을 입력해주세요.");
      return;
    }

    if (!title.trim()) {
      setMessage("제목을 입력해주세요.");
      return;
    }

    if (!mainSummary.trim()) {
      setMessage("메인 요약을 입력해주세요.");
      return;
    }

    if (!actionHint.trim()) {
      setMessage(
        "Action hint를 입력해주세요. B단계부터는 메일의 작은 실행 영역에 반드시 필요합니다."
      );
      return;
    }

    const categoryTargets = Object.entries(selectedTargets).flatMap(
      ([groupKey, values]) =>
        values.map((value) => ({
          group_key: groupKey as CategoryGroupKey,
          option_value: value,
        }))
    );

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/newsletter-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret.trim(),
        },
        body: JSON.stringify({
          admin_secret: adminSecret.trim(),
          title: title.trim(),
          source_url: sourceUrl.trim() || null,
          url: sourceUrl.trim() || null,
          category,
          difficulty,
          source_type: sourceType,
          stance,
          main_summary: mainSummary.trim(),
          summary: mainSummary.trim(),
          balance_summary: balanceSummary.trim() || null,
          action_hint: actionHint.trim() || null,
          category_targets: categoryTargets,
          is_active: true,
        }),
      });

      const result = await readApiResponse(response);

      if (!response.ok || !result.ok) {
        setMessage(result.message || "뉴스 자료 저장 중 오류가 발생했습니다.");
        setDebugText(result.rawText || JSON.stringify(result, null, 2));
        return;
      }

      setMessage(result.message || "뉴스 자료가 등록되었습니다.");
      setDebugText(JSON.stringify(result, null, 2));
      resetForm();
      await loadItems(adminSecret.trim());
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setMessage(`뉴스 자료 저장 중 오류가 발생했습니다. ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(item: NewsletterItem) {
    if (!adminSecret.trim()) {
      setMessage("ADMIN_SECRET을 입력해주세요.");
      return;
    }

    const nextActive = !item.is_active;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/newsletter-items", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret.trim(),
        },
        body: JSON.stringify({
          admin_secret: adminSecret.trim(),
          id: item.id,
          is_active: nextActive,
        }),
      });

      const result = await readApiResponse(response);

      if (!response.ok || !result.ok) {
        setMessage(result.message || "뉴스 자료 상태 변경 중 오류가 발생했습니다.");
        setDebugText(result.rawText || JSON.stringify(result, null, 2));
        return;
      }

      setMessage(result.message || "뉴스 자료 상태를 변경했습니다.");
      setDebugText(JSON.stringify(result, null, 2));
      await loadItems(adminSecret.trim());
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setMessage(`뉴스 자료 상태 변경 중 오류가 발생했습니다. ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <p style={styles.badge}>AI-FU Admin · C-3</p>
        <h1 style={styles.title}>뉴스 자료 등록/관리</h1>
        <p style={styles.description}>
          발송할 자료를 등록하고, 운영 중인 자료를 활성/비활성으로 관리합니다.
          C-3에서는 C-2 전체 등록 초안을 붙여넣어 등록 폼을 자동으로 채우는
          기능을 추가했습니다. 기존 저장/활성화/품질 점검/발송 후보 로직은
          그대로 유지합니다.
        </p>
      </section>

      <section style={{ ...styles.card, maxWidth: 1280, margin: "0 auto" }}>
        <label style={styles.label}>
          ADMIN_SECRET
          <input
            style={styles.input}
            type="password"
            value={adminSecret}
            onChange={(event) => setAdminSecret(event.target.value)}
            placeholder="관리자 비밀키"
          />
        </label>

        <div style={styles.buttonRow}>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={saveAdminSecret}
            disabled={loading || loadingItems}
          >
            ADMIN_SECRET 저장
          </button>

          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => loadItems(adminSecret.trim())}
            disabled={loading || loadingItems}
          >
            {loadingItems ? "자료 불러오는 중..." : "자료 새로고침"}
          </button>

          <a href="/admin/brief-draft" style={styles.linkButton}>
            브리프 초안 생성
          </a>

          <a href="/admin" style={styles.linkButton}>
            대시보드로
          </a>
        </div>

        {message && <div style={styles.messageBox}>{message}</div>}
      </section>

      <section style={styles.gridLayout}>
        <section style={styles.card}>
          <DraftPastePanel
            draftPasteText={draftPasteText}
            onDraftPasteTextChange={setDraftPasteText}
            onApplyDraftPasteText={applyDraftPasteText}
            onClearDraftPasteText={clearDraftPasteText}
          />

          <OperationTemplatePanel
            copyMessage={copyMessage}
            onCopyOperationTemplate={() =>
              copyToClipboard(
                OPERATION_TEMPLATE,
                "자료 수집 템플릿이 복사되었습니다."
              )
            }
            onCopyQuickDraft={() =>
              copyToClipboard(
                QUICK_DRAFT_TEMPLATE,
                "빠른 등록 초안 템플릿이 복사되었습니다."
              )
            }
            onCopyCurrentDraft={() =>
              copyToClipboard(
                currentDraftText,
                "현재 입력값이 등록 초안 형태로 복사되었습니다."
              )
            }
          />

          <h2 style={styles.sectionTitle}>새 뉴스 자료 등록</h2>

          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              <label style={styles.label}>
                제목
                <input
                  style={styles.input}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="예: AI 에이전트가 실제 업무에 들어오는 방식"
                />
              </label>

              <label style={styles.label}>
                원문 URL
                <input
                  style={styles.input}
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                  placeholder="https://..."
                />
              </label>

              <label style={styles.label}>
                카테고리
                <select
                  style={styles.input}
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label style={styles.label}>
                난이도
                <select
                  style={styles.input}
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value)}
                >
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label style={styles.label}>
                자료 유형
                <select
                  style={styles.input}
                  value={sourceType}
                  onChange={(event) => setSourceType(event.target.value)}
                >
                  {SOURCE_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label style={styles.label}>
                관점
                <select
                  style={styles.input}
                  value={stance}
                  onChange={(event) => setStance(event.target.value)}
                >
                  {STANCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label style={styles.label}>
              메인 요약
              <textarea
                style={styles.textarea}
                value={mainSummary}
                onChange={(event) => setMainSummary(event.target.value)}
                placeholder="이 자료가 말하는 핵심을 2~4문장으로 작성"
              />
            </label>

            <label style={styles.label}>
              균형 관점
              <textarea
                style={styles.textarea}
                value={balanceSummary}
                onChange={(event) => setBalanceSummary(event.target.value)}
                placeholder="과장/한계/반대 관점/주의점"
              />
            </label>

            <label style={styles.label}>
              Action hint
              <textarea
                style={styles.textarea}
                value={actionHint}
                onChange={(event) => setActionHint(event.target.value)}
                placeholder="구독자가 이번 주 바로 할 수 있는 작은 행동"
              />
            </label>

            <QualityCheckPanel
              checks={qualityChecks}
              status={qualityStatus}
              failCount={qualityFailCount}
              warnCount={qualityWarnCount}
            />

            <div style={styles.targetSection}>
              <h3 style={styles.subTitle}>타깃 선택</h3>
              <p style={styles.helpText}>
                비워두면 전체 대상 자료로 취급됩니다. 여러 개를 선택할 수 있습니다.
              </p>

              <div style={styles.targetStack}>
                {bundles.map((bundle) => (
                  <div key={bundle.group.group_key} style={styles.targetBlock}>
                    <p style={styles.targetTitle}>{bundle.group.label}</p>

                    <div style={styles.chipWrap}>
                      {bundle.options.map((option) => {
                        const selected = selectedTargets[
                          bundle.group.group_key
                        ]?.includes(option.option_value);

                        return (
                          <button
                            key={`${option.group_key}-${option.option_value}`}
                            type="button"
                            style={{
                              ...styles.chip,
                              ...(selected ? styles.chipSelected : {}),
                            }}
                            onClick={() =>
                              toggleTarget(
                                bundle.group.group_key,
                                option.option_value
                              )
                            }
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.buttonRow}>
              <button
                type="submit"
                style={styles.primaryButton}
                disabled={loading}
              >
                {loading ? "저장 중..." : "뉴스 자료 등록"}
              </button>

              <button
                type="button"
                style={styles.secondaryButton}
                onClick={resetForm}
                disabled={loading}
              >
                입력 초기화
              </button>
            </div>
          </form>
        </section>

        <section style={styles.card}>
          <div style={styles.listHeader}>
            <div>
              <h2 style={styles.sectionTitle}>등록 자료</h2>
              <p style={styles.helpText}>
                활성 {activeCount}개 / 비활성 {inactiveCount}개 / 전체{" "}
                {items.length}개
              </p>
            </div>

            <label style={styles.checkLabel}>
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(event) => setShowInactive(event.target.checked)}
              />
              비활성 자료도 보기
            </label>
          </div>

          {filteredItems.length === 0 ? (
            <p style={styles.emptyText}>표시할 자료가 없습니다.</p>
          ) : (
            <div style={styles.itemList}>
              {filteredItems.map((item) => (
                <NewsletterItemCard
                  key={item.id}
                  item={item}
                  onToggleActive={handleToggleActive}
                  disabled={loading || loadingItems}
                />
              ))}
            </div>
          )}
        </section>
      </section>

      {debugText && (
        <section style={styles.debugSection}>
          <details>
            <summary style={styles.debugSummary}>원본 JSON 보기</summary>
            <pre style={styles.debugBox}>{debugText}</pre>
          </details>
        </section>
      )}
    </main>
  );
}

function DraftPastePanel({
  draftPasteText,
  onDraftPasteTextChange,
  onApplyDraftPasteText,
  onClearDraftPasteText,
}: {
  draftPasteText: string;
  onDraftPasteTextChange: (value: string) => void;
  onApplyDraftPasteText: () => void;
  onClearDraftPasteText: () => void;
}) {
  return (
    <section style={styles.draftPasteBox}>
      <div style={styles.draftPasteHeader}>
        <div>
          <span style={styles.operationBadge}>C-3 복붙 표준화</span>
          <h2 style={styles.sectionTitle}>초안 붙여넣기 → 등록 폼 자동 채우기</h2>
          <p style={styles.helpText}>
            C-2의 전체 등록 초안을 아래에 붙여넣고 버튼을 누르면 제목, URL,
            요약, 균형 관점, Action hint, 추천 타깃이 기존 등록 폼에 자동으로
            채워집니다.
          </p>
        </div>
      </div>

      <textarea
        style={styles.draftPasteTextarea}
        value={draftPasteText}
        onChange={(event) => onDraftPasteTextChange(event.target.value)}
        placeholder={`C-2에서 복사한 전체 등록 초안을 여기에 붙여넣기

제목:
...

원문 URL:
...

메인 요약:
...

추천 타깃:
- AI에 대한 감정: ...`}
      />

      <div style={styles.buttonRow}>
        <button
          type="button"
          style={styles.primaryButton}
          onClick={onApplyDraftPasteText}
        >
          초안에서 입력값 채우기
        </button>

        <button
          type="button"
          style={styles.secondaryButton}
          onClick={onClearDraftPasteText}
        >
          붙여넣기 창 비우기
        </button>
      </div>
    </section>
  );
}

function OperationTemplatePanel({
  copyMessage,
  onCopyOperationTemplate,
  onCopyQuickDraft,
  onCopyCurrentDraft,
}: {
  copyMessage: string;
  onCopyOperationTemplate: () => void;
  onCopyQuickDraft: () => void;
  onCopyCurrentDraft: () => void;
}) {
  return (
    <section style={styles.operationBox}>
      <div style={styles.operationHeader}>
        <div>
          <span style={styles.operationBadge}>C-1 운영 템플릿</span>
          <h2 style={styles.sectionTitle}>자료 수집 → 등록 빠르게 하기</h2>
          <p style={styles.helpText}>
            뉴스, 논문, 툴, 사례를 발견했을 때 아래 템플릿으로 먼저 정리한 뒤
            등록하면 운영 시간이 줄어듭니다.
          </p>
        </div>
      </div>

      <div style={styles.templateButtonGrid}>
        <button
          type="button"
          style={styles.templateButton}
          onClick={onCopyOperationTemplate}
        >
          자료 수집 템플릿 복사
        </button>

        <button
          type="button"
          style={styles.templateButton}
          onClick={onCopyQuickDraft}
        >
          빠른 등록 초안 복사
        </button>

        <button
          type="button"
          style={styles.templateButton}
          onClick={onCopyCurrentDraft}
        >
          현재 입력값 복사
        </button>
      </div>

      {copyMessage && <p style={styles.copyNotice}>{copyMessage}</p>}

      <details style={styles.templateDetails}>
        <summary style={styles.templateSummary}>템플릿 미리보기</summary>
        <pre style={styles.templatePre}>{OPERATION_TEMPLATE}</pre>
      </details>

      <div style={styles.operationChecklistBox}>
        <h3 style={styles.subTitle}>등록 전 운영 체크리스트</h3>
        <div style={styles.operationChecklistList}>
          {OPERATION_CHECKLIST.map((item) => (
            <label key={item} style={styles.operationCheckItem}>
              <input type="checkbox" />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}

function QualityCheckPanel({
  checks,
  status,
  failCount,
  warnCount,
}: {
  checks: {
    key: string;
    level: "pass" | "warn" | "fail";
    label: string;
    help: string;
  }[];
  status: "ready" | "warning" | "blocked";
  failCount: number;
  warnCount: number;
}) {
  const statusText =
    status === "ready"
      ? "발송 가능"
      : status === "warning"
      ? "보완 권장"
      : "저장 불가";

  const statusHelp =
    status === "ready"
      ? "필수 항목과 권장 항목이 모두 채워졌습니다."
      : status === "warning"
      ? `필수 항목은 충족했습니다. 보완 권장 항목 ${warnCount}개를 확인하세요.`
      : `필수 항목 ${failCount}개가 비어 있습니다.`;

  return (
    <div style={styles.qualityBox}>
      <div style={styles.qualityHeader}>
        <div>
          <h3 style={styles.subTitle}>자료 품질 점검</h3>
          <p style={styles.helpText}>
            저장 전에 메일 품질과 개인화 매칭에 필요한 항목을 확인합니다.
          </p>
        </div>

        <div
          style={{
            ...styles.qualityStatusBadge,
            ...(status === "ready"
              ? styles.qualityStatusReady
              : status === "warning"
              ? styles.qualityStatusWarning
              : styles.qualityStatusBlocked),
          }}
        >
          {statusText}
        </div>
      </div>

      <p style={styles.qualityStatusHelp}>{statusHelp}</p>

      <div style={styles.qualityList}>
        {checks.map((check) => (
          <div key={check.key} style={styles.qualityRow}>
            <span
              style={{
                ...styles.qualityIcon,
                ...(check.level === "pass"
                  ? styles.qualityIconPass
                  : check.level === "warn"
                  ? styles.qualityIconWarn
                  : styles.qualityIconFail),
              }}
            >
              {check.level === "pass" ? "✓" : check.level === "warn" ? "!" : "×"}
            </span>

            <div>
              <p style={styles.qualityLabel}>{check.label}</p>
              <p style={styles.qualityHelp}>{check.help}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewsletterItemCard({
  item,
  onToggleActive,
  disabled,
}: {
  item: NewsletterItem;
  onToggleActive: (item: NewsletterItem) => void;
  disabled: boolean;
}) {
  const targets = item.category_targets || [];

  return (
    <article
      style={{
        ...styles.itemCard,
        opacity: item.is_active ? 1 : 0.62,
      }}
    >
      <div style={styles.itemTop}>
        <div>
          <p style={styles.itemMeta}>
            #{item.id} · {labelOf(item.category)} · {labelOf(item.difficulty)}
          </p>

          <h3 style={styles.itemTitle}>{item.title || "제목 없음"}</h3>
        </div>

        <span
          style={{
            ...styles.statusBadge,
            background: item.is_active ? "#ecfdf5" : "#f3f4f6",
            color: item.is_active ? "#047857" : "#4b5563",
            border: item.is_active
              ? "1px solid #a7f3d0"
              : "1px solid #d1d5db",
          }}
        >
          {item.is_active ? "활성" : "비활성"}
        </span>
      </div>

      <p style={styles.itemSummary}>
        {item.main_summary || item.summary || "요약 없음"}
      </p>

      {item.action_hint && (
        <div style={styles.actionBox}>
          <b>Action hint</b>
          <p>{item.action_hint}</p>
        </div>
      )}

      {targets.length > 0 ? (
        <div style={styles.targetPillWrap}>
          {targets.map((target) => (
            <span
              key={`${item.id}-${target.group_key}-${target.option_value}`}
              style={styles.targetPill}
            >
              {target.group_key}: {labelOf(target.option_value)}
            </span>
          ))}
        </div>
      ) : (
        <p style={styles.noTargetText}>전체 대상 자료</p>
      )}

      <div style={styles.itemFooter}>
        <span style={styles.dateText}>{formatDate(item.created_at)}</span>

        <button
          type="button"
          style={item.is_active ? styles.dangerSmallButton : styles.greenButton}
          onClick={() => onToggleActive(item)}
          disabled={disabled}
        >
          {item.is_active ? "비활성화" : "다시 활성화"}
        </button>
      </div>
    </article>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "46px 20px",
    background: "#0f172a",
    color: "#ffffff",
  },
  hero: {
    maxWidth: 1280,
    margin: "0 auto 28px",
  },
  badge: {
    display: "inline-block",
    margin: "0 0 14px",
    padding: "8px 14px",
    borderRadius: 999,
    background: "#1e3a8a",
    border: "1px solid #3b82f6",
    color: "#bfdbfe",
    fontSize: 14,
    fontWeight: 900,
  },
  title: {
    margin: 0,
    fontSize: 40,
    letterSpacing: "-0.05em",
  },
  description: {
    maxWidth: 860,
    margin: "16px 0 0",
    color: "#dbeafe",
    fontSize: 16,
    lineHeight: 1.7,
  },
  card: {
    background: "#ffffff",
    color: "#111827",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 16px 40px rgba(0,0,0,0.22)",
  },
  gridLayout: {
    maxWidth: 1280,
    margin: "22px auto 0",
    display: "grid",
    gridTemplateColumns: "minmax(420px, 0.95fr) minmax(420px, 1.05fr)",
    gap: 22,
    alignItems: "start",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 16,
    fontSize: 14,
    fontWeight: 900,
  },
  input: {
    height: 50,
    border: "1px solid #d1d5db",
    borderRadius: 14,
    padding: "0 14px",
    fontSize: 15,
    color: "#111827",
    background: "#ffffff",
    outline: "none",
  },
  textarea: {
    minHeight: 110,
    border: "1px solid #d1d5db",
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: "#111827",
    background: "#ffffff",
    outline: "none",
    resize: "vertical",
    lineHeight: 1.6,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: 14,
  },
  buttonRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  primaryButton: {
    height: 50,
    border: "none",
    borderRadius: 14,
    padding: "0 18px",
    background: "#111827",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 900,
    cursor: "pointer",
  },
  secondaryButton: {
    height: 44,
    border: "1px solid #d1d5db",
    borderRadius: 12,
    padding: "0 14px",
    background: "#ffffff",
    color: "#111827",
    fontSize: 14,
    fontWeight: 900,
    cursor: "pointer",
  },
  linkButton: {
    display: "inline-flex",
    alignItems: "center",
    height: 44,
    borderRadius: 12,
    padding: "0 14px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: 14,
    fontWeight: 900,
    textDecoration: "none",
  },
  messageBox: {
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    color: "#111827",
    fontSize: 14,
    fontWeight: 800,
    lineHeight: 1.6,
  },
  sectionTitle: {
    margin: "0 0 16px",
    fontSize: 22,
    letterSpacing: "-0.03em",
  },
  subTitle: {
    margin: "0 0 8px",
    fontSize: 17,
    letterSpacing: "-0.02em",
  },
  helpText: {
    margin: "0 0 14px",
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 1.6,
  },
  draftPasteBox: {
    margin: "0 0 22px",
    padding: 18,
    borderRadius: 18,
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
  },
  draftPasteHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
  },
  draftPasteTextarea: {
    width: "100%",
    minHeight: 220,
    border: "1px solid #bfdbfe",
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    fontSize: 14,
    color: "#111827",
    background: "#ffffff",
    outline: "none",
    resize: "vertical",
    lineHeight: 1.65,
    boxSizing: "border-box",
  },
  operationBox: {
    margin: "0 0 22px",
    padding: 18,
    borderRadius: 18,
    background: "#f8fafc",
    border: "1px solid #dbeafe",
  },
  operationHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
  },
  operationBadge: {
    display: "inline-flex",
    margin: "0 0 10px",
    padding: "6px 10px",
    borderRadius: 999,
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    fontSize: 12,
    fontWeight: 900,
  },
  templateButtonGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 10,
    marginTop: 14,
  },
  templateButton: {
    minHeight: 42,
    border: "1px solid #bfdbfe",
    borderRadius: 12,
    padding: "10px 12px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
  },
  copyNotice: {
    margin: "10px 0 0",
    color: "#1d4ed8",
    fontSize: 13,
    fontWeight: 900,
  },
  templateDetails: {
    marginTop: 14,
  },
  templateSummary: {
    cursor: "pointer",
    color: "#374151",
    fontSize: 13,
    fontWeight: 900,
  },
  templatePre: {
    margin: "10px 0 0",
    padding: 14,
    borderRadius: 14,
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    color: "#374151",
    fontSize: 13,
    lineHeight: 1.65,
    whiteSpace: "pre-wrap",
    overflowX: "auto",
  },
  operationChecklistBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    background: "#ffffff",
    border: "1px solid #e5e7eb",
  },
  operationChecklistList: {
    display: "flex",
    flexDirection: "column",
    gap: 9,
  },
  operationCheckItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    color: "#374151",
    fontSize: 13,
    fontWeight: 800,
    lineHeight: 1.5,
  },
  qualityBox: {
    marginTop: 24,
    padding: 18,
    borderRadius: 18,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
  },
  qualityHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
  },
  qualityStatusBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 34,
    padding: "0 12px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  qualityStatusReady: {
    background: "#ecfdf5",
    color: "#047857",
    border: "1px solid #a7f3d0",
  },
  qualityStatusWarning: {
    background: "#fffbeb",
    color: "#92400e",
    border: "1px solid #fcd34d",
  },
  qualityStatusBlocked: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
  },
  qualityStatusHelp: {
    margin: "10px 0 0",
    color: "#4b5563",
    fontSize: 13,
    lineHeight: 1.6,
    fontWeight: 700,
  },
  qualityList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: 10,
    marginTop: 14,
  },
  qualityRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    background: "#ffffff",
    border: "1px solid #e5e7eb",
  },
  qualityIcon: {
    width: 22,
    height: 22,
    borderRadius: 999,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontSize: 13,
    fontWeight: 900,
  },
  qualityIconPass: {
    background: "#ecfdf5",
    color: "#047857",
  },
  qualityIconWarn: {
    background: "#fffbeb",
    color: "#92400e",
  },
  qualityIconFail: {
    background: "#fef2f2",
    color: "#b91c1c",
  },
  qualityLabel: {
    margin: 0,
    color: "#111827",
    fontSize: 13,
    fontWeight: 900,
  },
  qualityHelp: {
    margin: "4px 0 0",
    color: "#6b7280",
    fontSize: 12,
    lineHeight: 1.5,
  },
  targetSection: {
    marginTop: 20,
    padding: 16,
    borderRadius: 18,
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
  },
  targetStack: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  targetBlock: {
    padding: 12,
    borderRadius: 14,
    background: "#ffffff",
    border: "1px solid #e5e7eb",
  },
  targetTitle: {
    margin: "0 0 10px",
    fontSize: 14,
    fontWeight: 900,
    color: "#111827",
  },
  chipWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    border: "1px solid #d1d5db",
    borderRadius: 999,
    padding: "8px 10px",
    background: "#ffffff",
    color: "#374151",
    fontSize: 13,
    fontWeight: 800,
    cursor: "pointer",
  },
  chipSelected: {
    border: "1px solid #2563eb",
    background: "#eff6ff",
    color: "#1d4ed8",
  },
  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "flex-start",
    marginBottom: 16,
  },
  checkLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "#374151",
    fontSize: 13,
    fontWeight: 800,
  },
  itemList: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    maxHeight: "78vh",
    overflowY: "auto",
    paddingRight: 4,
  },
  itemCard: {
    padding: 16,
    borderRadius: 18,
    border: "1px solid #e5e7eb",
    background: "#ffffff",
  },
  itemTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  itemMeta: {
    margin: "0 0 6px",
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 800,
  },
  itemTitle: {
    margin: 0,
    color: "#111827",
    fontSize: 17,
    lineHeight: 1.4,
    letterSpacing: "-0.02em",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    padding: "5px 9px",
    fontSize: 12,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  itemSummary: {
    margin: "12px 0 0",
    color: "#374151",
    fontSize: 14,
    lineHeight: 1.65,
  },
  actionBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    background: "#ecfdf5",
    color: "#065f46",
    fontSize: 13,
    lineHeight: 1.6,
  },
  targetPillWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 12,
  },
  targetPill: {
    padding: "6px 8px",
    borderRadius: 999,
    background: "#f3f4f6",
    color: "#374151",
    fontSize: 12,
    fontWeight: 800,
  },
  noTargetText: {
    margin: "12px 0 0",
    color: "#6b7280",
    fontSize: 13,
    fontWeight: 800,
  },
  itemFooter: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    marginTop: 14,
  },
  dateText: {
    color: "#9ca3af",
    fontSize: 12,
  },
  dangerSmallButton: {
    height: 36,
    border: "none",
    borderRadius: 10,
    padding: "0 12px",
    background: "#fee2e2",
    color: "#b91c1c",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
  },
  greenButton: {
    height: 36,
    border: "none",
    borderRadius: 10,
    padding: "0 12px",
    background: "#dcfce7",
    color: "#15803d",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
  },
  emptyText: {
    margin: 0,
    color: "#6b7280",
    fontSize: 14,
  },
  debugSection: {
    maxWidth: 1280,
    margin: "22px auto 0",
  },
  debugSummary: {
    cursor: "pointer",
    color: "#dbeafe",
    fontSize: 14,
    fontWeight: 800,
  },
  debugBox: {
    marginTop: 12,
    padding: 16,
    borderRadius: 14,
    background: "#020617",
    color: "#d1d5db",
    fontSize: 13,
    lineHeight: 1.6,
    overflowX: "auto",
    whiteSpace: "pre-wrap",
  },
};