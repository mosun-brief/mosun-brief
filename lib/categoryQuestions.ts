// 구독/재진단 진단 문항의 단일 소스입니다.
//
// 저장값 불변 원칙: 아래 각 옵션의 `value`는 Supabase의 subscribers,
// subscriber_category_answers, newsletter_items, newsletter_item_category_targets
// 테이블에 이미 저장돼 있는 문자열과 정확히 같아야 합니다. 이 값들을 바꾸면
// 기존에 저장된 구독자 답변·아이템 타겟팅 데이터가 더 이상 매칭되지 않습니다.
// 문구(label/description/question/helper, adminLabel/adminDescription/adminHelper)는
// 언제든 자유롭게 다듬어도 저장값에는 전혀 영향이 없습니다.
//
// label/description/question/helper — 구독자가 보는 문구("나는 이렇다" 1인칭 상태
// 서술). app/page.tsx(구독 폼), app/profile/page.tsx(재진단)가 씁니다.
//
// adminLabel/adminDescription/adminHelper — 관리자가 새 자료를 등록하며 타깃을
// 고를 때 보는 문구("이 자료는 이런 사람에게 맞다" 3인칭 서술). 구독자용 문구와
// 방향이 반대라 재사용하면 어색해서 별도 필드로 분리했습니다.
// app/admin/newsletter-items/page.tsx가 씁니다.
//
// app/api/subscribe/route.ts(검증), app/api/category-groups/route.ts,
// app/api/category-options/route.ts도 이 파일을 참조합니다.

export type CategoryGroupKey = "ai_emotion" | "ai_intent" | "blocker" | "action_time";

export type CategoryOption = {
  value: string;
  label: string;
  description: string;
  adminLabel: string;
  adminDescription: string;
};

export type CategoryGroup = {
  key: CategoryGroupKey;
  step: string;
  label: string;
  question: string;
  helper: string;
  adminLabel: string;
  adminHelper: string;
  options: CategoryOption[];
};

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    key: "ai_emotion",
    step: "01",
    label: "AI에 대한 감정",
    question: "요즘 AI를 볼 때 가장 가까운 감정은 무엇인가요?",
    helper:
      "정답은 없습니다. 지금 드는 느낌에 가장 가까운 것 하나만 골라주세요. (행동을 막는 이유는 다음 문항에서 따로 물어봐요)",
    adminLabel: "타깃 감정 상태",
    adminHelper:
      "이 자료가 어떤 감정 상태인 구독자에게 맞는지 고르세요. (행동을 막는 구체적 이유는 '타깃 막힘 지점' 축에서 따로 고릅니다)",
    options: [
      {
        value: "curious",
        label: "호기심",
        description: "AI로 뭘 할 수 있는지 궁금해서 하나씩 살펴보고 싶은 기분이에요",
        adminLabel: "호기심 단계",
        adminDescription: "AI로 뭘 할 수 있는지 탐색하고 싶어하는 사람에게 맞는 자료",
      },
      {
        value: "excited",
        label: "기대됨",
        description: "AI가 내 일이나 삶에 실제로 도움을 줄 거라 기대돼요",
        adminLabel: "기대 단계",
        adminDescription: "AI가 실제로 도움될 거라 기대하는 사람에게 맞는 자료",
      },
      {
        value: "anxious",
        label: "불안",
        description: "AI 때문에 뒤처지거나 대체될까 봐 걱정되는 기분이에요",
        adminLabel: "불안 단계",
        adminDescription:
          "뒤처지거나 대체될까 걱정하는 사람에게 맞는 자료 (막힘 축 '불안-회피형'과는 다름 — 이건 감정 상태 자체)",
      },
      {
        value: "fatigue",
        label: "정보가 너무 많아 피곤",
        description: "AI 소식과 도구가 쏟아져서 그 자체로 피곤함을 느껴요",
        adminLabel: "정보 피로 단계",
        adminDescription:
          "AI 소식이 너무 많아 피로감을 느끼는 사람에게 맞는 자료 (막힘 축 '정보 과잉형'과는 다름 — 이건 행동이 아니라 감정/피로 상태)",
      },
      {
        value: "skeptical",
        label: "회의적",
        description: "AI가 과장된 것 같아서 실제 효과를 의심하고 있어요",
        adminLabel: "회의적 단계",
        adminDescription: "AI 효과를 의심하는 사람에게 맞는 자료",
      },
      {
        value: "unsure",
        label: "잘 모르겠음",
        description: "AI에 대해 아직 뚜렷한 감정이 생기지 않았어요",
        adminLabel: "무감정 단계",
        adminDescription: "AI에 대한 감정이 아직 뚜렷하지 않은 사람에게 맞는 자료",
      },
    ],
  },
  {
    key: "ai_intent",
    step: "02",
    label: "AI로 하고 싶은 것",
    question: "AI로 가장 먼저 해보고 싶은 것은 무엇인가요?",
    helper: "목표가 뚜렷하지 않아도 괜찮습니다. '아직 모름'도 중요한 신호입니다.",
    adminLabel: "타깃 목적",
    adminHelper: "이 자료가 어떤 목적을 가진 구독자에게 맞는지 고르세요.",
    options: [
      {
        value: "not_sure",
        label: "아직 모름",
        description: "AI로 뭘 할 수 있을지 아직 방향이 안 잡혔어요",
        adminLabel: "목적 미정형",
        adminDescription: "AI로 뭘 할지 방향을 못 잡은 사람에게 맞는 자료",
      },
      {
        value: "work_efficiency",
        label: "업무 효율 높이기",
        description: "반복 업무나 문서 작업 시간을 줄이고 싶어요",
        adminLabel: "업무 효율형",
        adminDescription: "반복 업무·문서 작업을 줄이고 싶은 사람에게 맞는 자료",
      },
      {
        value: "service_building",
        label: "서비스나 사이트 만들기",
        description: "AI로 직접 서비스나 자동화 도구를 만들고 싶어요",
        adminLabel: "서비스 빌더형",
        adminDescription: "서비스나 자동화 도구를 직접 만들고 싶은 사람에게 맞는 자료",
      },
      {
        value: "learning",
        label: "공부나 자기계발",
        description: "AI를 학습하거나 역량을 키우는 데 쓰고 싶어요",
        adminLabel: "학습형",
        adminDescription: "AI를 학습·역량 개발에 쓰고 싶은 사람에게 맞는 자료",
      },
      {
        value: "creative_writing",
        label: "글쓰기/창작",
        description: "글, 콘텐츠, 기획 같은 창작에 AI를 활용하고 싶어요",
        adminLabel: "창작형",
        adminDescription: "글쓰기·콘텐츠·기획에 AI를 쓰고 싶은 사람에게 맞는 자료",
      },
      {
        value: "business_opportunity",
        label: "사업 기회나 돈 벌 기회",
        description: "AI로 부업이나 수익화 기회를 찾고 싶어요",
        adminLabel: "수익화형",
        adminDescription: "부업이나 사업 기회를 찾는 사람에게 맞는 자료",
      },
      {
        value: "avoid_but_need",
        label: "피하고 싶으나 알아야겠음",
        description: "적극적으로 쓰고 싶진 않지만 변화는 알아둬야 할 것 같아요",
        adminLabel: "소극적 수용형",
        adminDescription:
          "적극적이진 않지만 흐름은 알아둬야 한다는 사람에게 맞는 자료",
      },
    ],
  },
  {
    key: "blocker",
    step: "03",
    label: "지금 막히는 지점",
    question: "AI를 실제로 시작하지 못하게 막는 가장 큰 이유는 무엇인가요?",
    helper: "지금 기분이 아니라, 행동을 못 하게 막는 구체적인 이유를 골라주세요.",
    adminLabel: "타깃 막힘 지점",
    adminHelper:
      "이 자료가 어떤 행동 장벽을 가진 구독자에게 맞는지 고르세요. (감정 상태가 아니라 실제로 행동을 막는 구체적 이유 기준입니다 — '타깃 감정 상태' 축과 겹치지 않게 구분해서 고르세요)",
    options: [
      {
        value: "too_much_info",
        label: "정보가 너무 많아 정리가 안됨",
        description: "무엇부터 봐야 할지 골라내는 단계에서 막혀요",
        adminLabel: "정보 과잉형 막힘",
        adminDescription:
          "무엇부터 봐야 할지 골라내는 단계에서 막힌 사람에게 맞는 자료 (감정 축 '정보 피로'와는 다름 — 이건 선별 행동의 막힘)",
      },
      {
        value: "no_clear_start",
        label: "뭘 해야할 지 모르겠음",
        description: "관심은 있지만 첫 행동을 뭘로 시작할지 못 정했어요",
        adminLabel: "시작점 부재형 막힘",
        adminDescription: "관심은 있지만 첫 행동을 못 정한 사람에게 맞는 자료",
      },
      {
        value: "too_technical",
        label: "기술적인 내용이 어려움",
        description: "용어나 구현 방식이 어려워서 진도가 안 나가요",
        adminLabel: "기술 장벽형 막힘",
        adminDescription: "용어·구현이 어려워 진도가 안 나가는 사람에게 맞는 자료",
      },
      {
        value: "no_time",
        label: "시간 없음",
        description: "방향은 있지만 실제로 써볼 시간이 없어요",
        adminLabel: "시간 부족형 막힘",
        adminDescription: "방향은 있지만 실제로 써볼 시간이 없는 사람에게 맞는 자료",
      },
      {
        value: "fear_of_falling_behind",
        label: "뒤처질까봐 불안",
        description: "불안한 마음 때문에 오히려 손이 안 가요",
        adminLabel: "불안-회피형 막힘",
        adminDescription:
          "불안한 마음 때문에 오히려 행동을 못 하는 사람에게 맞는 자료 (감정 축 '불안'과는 다름 — 이건 그 불안이 실제로 행동을 막는 상태)",
      },
      {
        value: "low_need",
        label: "아직 필요성을 모르겠음",
        description: "왜 지금 AI를 써야 하는지 스스로 납득이 안 돼요",
        adminLabel: "필요성 미인식형 막힘",
        adminDescription: "왜 AI를 써야 하는지 납득이 안 된 사람에게 맞는 자료",
      },
    ],
  },
  {
    key: "action_time",
    step: "04",
    label: "이번 주 가능한 행동 시간",
    question: "이번 주에 실제로 AI에 써볼 수 있는 시간은 얼마나 되나요?",
    helper: "선택한 시간 안에 끝낼 수 있는 실행 제안을 함께 보내드립니다.",
    adminLabel: "타깃 가능 시간",
    adminHelper:
      "이 자료(와 Action hint)를 소화하는 데 필요한 시간과 맞는 구독자를 고르세요.",
    options: [
      {
        value: "10min",
        label: "10분",
        description: "짧게 훑어보는 정도만 가능해요",
        adminLabel: "10분 소화형",
        adminDescription: "짧게 훑어보는 정도만 가능한 사람에게 맞는 분량/난이도",
      },
      {
        value: "30min",
        label: "30분",
        description: "하나를 읽고 적용 아이디어까지 생각해볼 수 있어요",
        adminLabel: "30분 소화형",
        adminDescription:
          "읽고 적용 아이디어까지 생각해볼 수 있는 사람에게 맞는 분량/난이도",
      },
      {
        value: "2hours",
        label: "2시간",
        description: "작은 실험이나 프롬프트 하나 정도는 만들어볼 수 있어요",
        adminLabel: "2시간 소화형",
        adminDescription:
          "작은 실험이나 프롬프트 하나 정도 만들어볼 수 있는 사람에게 맞는 분량/난이도",
      },
      {
        value: "half_day_weekend",
        label: "주말 반나절",
        description: "결과물 하나를 만들어볼 정도의 시간이 있어요",
        adminLabel: "반나절 소화형",
        adminDescription: "결과물 하나를 만들어볼 정도 시간이 있는 사람에게 맞는 분량/난이도",
      },
    ],
  },
];

export type DifficultyValue = "easy" | "normal" | "expert";

export type DifficultyOption = {
  value: DifficultyValue;
  label: string;
  description: string;
};

export const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  {
    value: "easy",
    label: "입문",
    description: "AI 관련 개념이나 용어가 아직 낯설어요",
  },
  {
    value: "normal",
    label: "중간",
    description: "기본 개념은 알고, 실제 활용 사례를 찾고 있어요",
  },
  {
    value: "expert",
    label: "심화",
    description: "이미 AI를 써봤고, 더 깊은 활용법을 찾고 있어요",
  },
];

export const VALID_DIFFICULTIES: DifficultyValue[] = DIFFICULTY_OPTIONS.map(
  (option) => option.value
);

export const DEFAULT_DIFFICULTY: DifficultyValue = "easy";

export const DEFAULT_CATEGORY_SELECTIONS: Record<CategoryGroupKey, string> = {
  ai_emotion: "fatigue",
  ai_intent: "not_sure",
  blocker: "too_much_info",
  action_time: "30min",
};

export function getCategoryGroup(key: CategoryGroupKey): CategoryGroup | undefined {
  return CATEGORY_GROUPS.find((group) => group.key === key);
}

export function getValidCategoryValues(key: CategoryGroupKey): string[] {
  return getCategoryGroup(key)?.options.map((option) => option.value) ?? [];
}

export function isValidCategoryValue(key: CategoryGroupKey, value: string): boolean {
  return getValidCategoryValues(key).includes(value);
}

export function isValidDifficulty(value: string): value is DifficultyValue {
  return (VALID_DIFFICULTIES as string[]).includes(value);
}

export function getCategoryOptionLabel(key: CategoryGroupKey, value: string): string {
  return (
    getCategoryGroup(key)?.options.find((option) => option.value === value)?.label ??
    value
  );
}

export function getDifficultyLabel(value: string): string {
  return DIFFICULTY_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

// --- persona (ai_emotion + ai_intent로부터 파생되는 표시용 분류) ---
//
// 점수 계산에는 전혀 쓰이지 않고 이메일 문구 표시에만 쓰입니다
// (send-newsletter/route.ts getMatchScore 참고). subscribe/route.ts가
// 구독 시점에 계산해 저장하고, send-newsletter/route.ts는 저장된 값이
// 비어있는 극히 예외적인 경우에만 이 함수로 다시 계산합니다 — 두 곳이
// 같은 함수를 쓰므로 규칙이 어긋날 일이 없습니다.
export function getPersonaType({
  aiEmotion,
  aiIntent,
}: {
  aiEmotion: string;
  aiIntent: string;
}): string {
  if (aiIntent === "service_building" && aiEmotion === "anxious") {
    return "Builder-Anxious";
  }

  if (aiIntent === "service_building") return "Builder";
  if (aiIntent === "work_efficiency") return "Adopter";
  if (aiEmotion === "anxious") return "Anxious";
  if (aiEmotion === "skeptical") return "Skeptic";
  if (aiEmotion === "fatigue") return "Avoider";
  if (aiEmotion === "curious") return "Explorer";
  if (aiEmotion === "excited") return "Optimist";
  if (aiEmotion === "unsure") return "Unclear";

  return "AI-FU Subscriber";
}

export const PERSONA_LABELS_KOREAN: Record<string, string> = {
  Builder: "직접 만들어보고 싶은 Builder",
  "Builder-Anxious": "만들고 싶지만 불안도 큰 Builder",
  Adopter: "업무에 적용하고 싶은 Adopter",
  Anxious: "AI 변화가 불안한 관찰자",
  Skeptic: "과장을 경계하는 Skeptic",
  Avoider: "정보 과부하 상태의 구독자",
  Explorer: "가능성을 탐색하는 Explorer",
  Optimist: "기대감을 가진 Optimist",
  Unclear: "아직 방향을 찾는 구독자",
  Test: "테스트 구독자",
  "AI-FU Subscriber": "AI-FU 구독자",
};

export function getReadablePersonaKorean(persona: string): string {
  return PERSONA_LABELS_KOREAN[persona] || persona;
}
