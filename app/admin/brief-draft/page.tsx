"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";

type CategoryGroupKey = "ai_emotion" | "ai_intent" | "blocker" | "action_time";

type DraftTargets = Record<CategoryGroupKey, string[]>;

type DraftResult = {
  mainSummary: string;
  balanceSummary: string;
  actionHint: string;
  targetText: string;
  fullDraft: string;
};

const AI_EMOTION_OPTIONS = [
  { value: "curious", label: "호기심" },
  { value: "excited", label: "기대됨" },
  { value: "anxious", label: "불안" },
  { value: "fatigue", label: "정보가 너무 많아 피곤" },
  { value: "skeptical", label: "회의적" },
  { value: "unsure", label: "잘 모르겠음" },
];

const AI_INTENT_OPTIONS = [
  { value: "not_sure", label: "아직 모름" },
  { value: "work_efficiency", label: "업무 효율 높이기" },
  { value: "service_building", label: "서비스나 사이트 만들기" },
  { value: "learning", label: "공부나 자기계발" },
  { value: "creative_writing", label: "글쓰기/창작" },
  { value: "business_opportunity", label: "사업 기회나 돈 벌 기회" },
  { value: "avoid_but_need", label: "피하고 싶으나 알아야겠음" },
];

const BLOCKER_OPTIONS = [
  { value: "too_much_info", label: "정보가 너무 많아 정리가 안됨" },
  { value: "no_clear_start", label: "뭘 해야할 지 모르겠음" },
  { value: "too_technical", label: "기술적인 내용이 어려움" },
  { value: "no_time", label: "시간 없음" },
  { value: "fear_of_falling_behind", label: "뒤처질까봐 불안" },
  { value: "low_need", label: "아직 필요성을 모르겠음" },
];

const ACTION_TIME_OPTIONS = [
  { value: "10min", label: "10분" },
  { value: "30min", label: "30분" },
  { value: "2hours", label: "2시간" },
  { value: "half_day_weekend", label: "주말 반나절" },
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

const LABELS: Record<string, string> = {
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

function labelOf(value: string) {
  return LABELS[value] || value;
}

function labelsOf(values: string[]) {
  if (values.length === 0) return "전체";
  return values.map(labelOf).join(", ");
}

function normalizeText(value: string) {
  return value.trim().replace(/\n{3,}/g, "\n\n");
}

function buildMainSummary({
  title,
  rawContent,
  whyImportant,
  readerBenefit,
}: {
  title: string;
  rawContent: string;
  whyImportant: string;
  readerBenefit: string;
}) {
  const cleanTitle = normalizeText(title);
  const cleanContent = normalizeText(rawContent);
  const cleanWhy = normalizeText(whyImportant);
  const cleanBenefit = normalizeText(readerBenefit);

  const lines = [];

  if (cleanTitle) {
    lines.push(`이번 자료는 "${cleanTitle}"에 대한 브리프입니다.`);
  } else {
    lines.push("이번 자료는 최근 AI 흐름을 이해하기 위한 브리프입니다.");
  }

  if (cleanContent) {
    lines.push(cleanContent);
  }

  if (cleanWhy) {
    lines.push(`중요한 이유는 ${cleanWhy}`);
  }

  if (cleanBenefit) {
    lines.push(`특히 ${cleanBenefit} 사람에게 도움이 됩니다.`);
  }

  return lines.join("\n\n");
}

function buildBalanceSummary({
  caution,
  stance,
}: {
  caution: string;
  stance: string;
}) {
  const cleanCaution = normalizeText(caution);

  if (cleanCaution) {
    return `다만 이 자료는 ${cleanCaution}

AI-FU 관점에서는 이 흐름을 무조건 따라가야 할 신호로 보기보다, 내 상황에 맞게 작게 실험해볼 수 있는 참고 자료로 보는 것이 좋습니다.`;
  }

  if (stance === "pro_ai") {
    return "긍정적인 가능성을 보여주는 자료이지만, 실제 적용에는 시간, 비용, 조직 적응, 품질 검증 문제가 남아 있을 수 있습니다. AI-FU 관점에서는 기대를 행동으로 옮기되, 작은 실험부터 시작하는 것이 좋습니다.";
  }

  if (stance === "critical") {
    return "주의점이 큰 자료이지만, AI를 무조건 피해야 한다는 뜻은 아닙니다. AI-FU 관점에서는 위험을 이해한 뒤, 필요한 만큼만 안전하게 활용하는 방향이 현실적입니다.";
  }

  return "이 자료는 하나의 흐름을 보여주지만, 모든 사람에게 같은 의미를 갖지는 않습니다. AI-FU 관점에서는 과장된 기대나 막연한 불안을 줄이고, 내 상황에서 가능한 작은 행동으로 바꾸는 것이 중요합니다.";
}

function buildActionHint({
  actionIdea,
  actionTimeValues,
}: {
  actionIdea: string;
  actionTimeValues: string[];
}) {
  const cleanAction = normalizeText(actionIdea);
  const timeLabel = labelsOf(actionTimeValues);

  if (cleanAction) {
    return `${timeLabel} 안에 해볼 행동: ${cleanAction}`;
  }

  if (actionTimeValues.includes("10min")) {
    return "10분 안에 해볼 행동: 이 자료에서 내 일이나 관심사에 바로 연결되는 문장 1개만 골라 메모해보세요.";
  }

  if (actionTimeValues.includes("30min")) {
    return "30분 안에 해볼 행동: 이 자료의 내용을 바탕으로 ChatGPT에게 내 상황에 맞는 활용 예시 3개를 물어보세요.";
  }

  if (actionTimeValues.includes("2hours")) {
    return "2시간 안에 해볼 행동: 이 자료에서 소개된 흐름을 내 업무나 프로젝트에 적용하는 작은 테스트를 하나 만들어보세요.";
  }

  if (actionTimeValues.includes("half_day_weekend")) {
    return "주말 반나절 안에 해볼 행동: 이 자료를 참고해서 작은 자동화, 글 초안, 서비스 아이디어, 학습 계획 중 하나를 실제 결과물로 만들어보세요.";
  }

  return "이번 주 해볼 행동: 이 자료에서 내 상황과 연결되는 부분을 하나 고르고, 바로 실행 가능한 작은 실험으로 바꿔보세요.";
}

function buildTargetText(targets: DraftTargets) {
  return `- AI에 대한 감정: ${labelsOf(targets.ai_emotion)}
- AI로 하고 싶은 것: ${labelsOf(targets.ai_intent)}
- 지금 막히는 것: ${labelsOf(targets.blocker)}
- 이번 주 가능한 행동 시간: ${labelsOf(targets.action_time)}`;
}

function buildFullDraft({
  title,
  sourceUrl,
  category,
  difficulty,
  sourceType,
  stance,
  mainSummary,
  balanceSummary,
  actionHint,
  targetText,
}: {
  title: string;
  sourceUrl: string;
  category: string;
  difficulty: string;
  sourceType: string;
  stance: string;
  mainSummary: string;
  balanceSummary: string;
  actionHint: string;
  targetText: string;
}) {
  return `제목:
${title}

원문 URL:
${sourceUrl}

카테고리:
${labelOf(category)} (${category})

난이도:
${labelOf(difficulty)} (${difficulty})

자료 유형:
${labelOf(sourceType)} (${sourceType})

관점:
${labelOf(stance)} (${stance})

메인 요약:
${mainSummary}

균형 관점:
${balanceSummary}

Action hint:
${actionHint}

추천 타깃:
${targetText}`;
}

export default function BriefDraftPage() {
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [category, setCategory] = useState("general_ai");
  const [difficulty, setDifficulty] = useState("normal");
  const [sourceType, setSourceType] = useState("main");
  const [stance, setStance] = useState("neutral");

  const [rawContent, setRawContent] = useState("");
  const [whyImportant, setWhyImportant] = useState("");
  const [readerBenefit, setReaderBenefit] = useState("");
  const [caution, setCaution] = useState("");
  const [actionIdea, setActionIdea] = useState("");

  const [targets, setTargets] = useState<DraftTargets>({
    ai_emotion: [],
    ai_intent: [],
    blocker: [],
    action_time: [],
  });

  const [copyMessage, setCopyMessage] = useState("");

  const draft: DraftResult = useMemo(() => {
    const mainSummary = buildMainSummary({
      title,
      rawContent,
      whyImportant,
      readerBenefit,
    });

    const balanceSummary = buildBalanceSummary({
      caution,
      stance,
    });

    const actionHint = buildActionHint({
      actionIdea,
      actionTimeValues: targets.action_time,
    });

    const targetText = buildTargetText(targets);

    const fullDraft = buildFullDraft({
      title,
      sourceUrl,
      category,
      difficulty,
      sourceType,
      stance,
      mainSummary,
      balanceSummary,
      actionHint,
      targetText,
    });

    return {
      mainSummary,
      balanceSummary,
      actionHint,
      targetText,
      fullDraft,
    };
  }, [
    title,
    sourceUrl,
    category,
    difficulty,
    sourceType,
    stance,
    rawContent,
    whyImportant,
    readerBenefit,
    caution,
    actionIdea,
    targets,
  ]);

  const requiredReady =
    title.trim().length > 0 &&
    rawContent.trim().length > 0 &&
    whyImportant.trim().length > 0;

  const selectedTargetCount = Object.values(targets).reduce(
    (sum, values) => sum + values.length,
    0
  );

  function toggleTarget(groupKey: CategoryGroupKey, value: string) {
    setTargets((prev) => {
      const current = prev[groupKey];
      const exists = current.includes(value);

      return {
        ...prev,
        [groupKey]: exists
          ? current.filter((item) => item !== value)
          : [...current, value],
      };
    });
  }

  async function copyText(text: string, message: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage(message);
      window.setTimeout(() => setCopyMessage(""), 2200);
    } catch {
      setCopyMessage("복사 실패. 텍스트를 직접 선택해서 복사해주세요.");
      window.setTimeout(() => setCopyMessage(""), 3000);
    }
  }

  function resetForm() {
    setTitle("");
    setSourceUrl("");
    setCategory("general_ai");
    setDifficulty("normal");
    setSourceType("main");
    setStance("neutral");
    setRawContent("");
    setWhyImportant("");
    setReaderBenefit("");
    setCaution("");
    setActionIdea("");
    setTargets({
      ai_emotion: [],
      ai_intent: [],
      blocker: [],
      action_time: [],
    });
    setCopyMessage("");
  }

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <p style={styles.badge}>AI-FU Admin · C-2</p>
        <h1 style={styles.title}>브리프 초안 생성</h1>
        <p style={styles.description}>
          뉴스, 논문, 툴, 사례를 보고 핵심 정보만 입력하면 AI-FU 등록용 메인
          요약, 균형 관점, Action hint, 추천 타깃 초안을 빠르게 만듭니다. 아직
          DB/API에는 저장하지 않고, 운영자가 복사해서 뉴스 자료 등록 화면에
          붙여넣는 방식입니다.
        </p>

        <div style={styles.heroButtonRow}>
          <a href="/admin/newsletter-items" style={styles.heroLink}>
            뉴스 자료 등록으로
          </a>
          <a href="/admin" style={styles.heroLink}>
            관리자 대시보드로
          </a>
        </div>
      </section>

      <section style={styles.layout}>
        <section style={styles.card}>
          <div style={styles.statusBox}>
            <div>
              <h2 style={styles.sectionTitle}>입력 폼</h2>
              <p style={styles.helpText}>
                최소한 제목, 핵심 내용, 중요한 이유를 채우면 초안으로 쓸 수
                있습니다.
              </p>
            </div>

            <div
              style={{
                ...styles.statusBadge,
                ...(requiredReady ? styles.statusReady : styles.statusNeed),
              }}
            >
              {requiredReady ? "초안 가능" : "입력 필요"}
            </div>
          </div>

          <div style={styles.formGrid}>
            <label style={styles.label}>
              자료 제목
              <input
                style={styles.input}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="예: AI 에이전트가 업무 자동화에 미치는 영향"
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
            핵심 내용
            <textarea
              style={styles.textarea}
              value={rawContent}
              onChange={(event) => setRawContent(event.target.value)}
              placeholder="자료의 핵심 내용을 2~5문장으로 붙여넣기"
            />
          </label>

          <label style={styles.label}>
            이 자료가 중요한 이유
            <textarea
              style={styles.textarea}
              value={whyImportant}
              onChange={(event) => setWhyImportant(event.target.value)}
              placeholder="왜 지금 이 자료를 구독자에게 보내야 하는지"
            />
          </label>

          <label style={styles.label}>
            누가 읽으면 좋은지
            <textarea
              style={styles.textarea}
              value={readerBenefit}
              onChange={(event) => setReaderBenefit(event.target.value)}
              placeholder="예: AI를 써보고 싶지만 어디서 시작할지 모르는"
            />
          </label>

          <label style={styles.label}>
            주의할 점 / 한계
            <textarea
              style={styles.textarea}
              value={caution}
              onChange={(event) => setCaution(event.target.value)}
              placeholder="과장, 한계, 비용, 기술 장벽, 개인정보 이슈 등"
            />
          </label>

          <label style={styles.label}>
            이번 주 실행 아이디어
            <textarea
              style={styles.textarea}
              value={actionIdea}
              onChange={(event) => setActionIdea(event.target.value)}
              placeholder="구독자가 바로 해볼 수 있는 작은 행동"
            />
          </label>

          <section style={styles.targetBox}>
            <div style={styles.targetHeader}>
              <div>
                <h2 style={styles.sectionTitle}>추천 타깃</h2>
                <p style={styles.helpText}>
                  선택하지 않은 항목은 전체 대상으로 취급하면 됩니다. 현재 선택{" "}
                  {selectedTargetCount}개.
                </p>
              </div>
            </div>

            <TargetGroup
              title="AI에 대한 감정"
              options={AI_EMOTION_OPTIONS}
              selected={targets.ai_emotion}
              onToggle={(value) => toggleTarget("ai_emotion", value)}
            />

            <TargetGroup
              title="AI로 하고 싶은 거"
              options={AI_INTENT_OPTIONS}
              selected={targets.ai_intent}
              onToggle={(value) => toggleTarget("ai_intent", value)}
            />

            <TargetGroup
              title="지금 막히는 거"
              options={BLOCKER_OPTIONS}
              selected={targets.blocker}
              onToggle={(value) => toggleTarget("blocker", value)}
            />

            <TargetGroup
              title="이번 주 가능한 행동 시간"
              options={ACTION_TIME_OPTIONS}
              selected={targets.action_time}
              onToggle={(value) => toggleTarget("action_time", value)}
            />
          </section>

          <div style={styles.buttonRow}>
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={resetForm}
            >
              입력 초기화
            </button>
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.previewHeader}>
            <div>
              <h2 style={styles.sectionTitle}>생성된 초안</h2>
              <p style={styles.helpText}>
                아래 내용을 복사해서 뉴스 자료 등록 페이지에 붙여넣으면 됩니다.
              </p>
            </div>
          </div>

          {copyMessage && <div style={styles.copyBox}>{copyMessage}</div>}

          <DraftBlock
            title="메인 요약"
            text={draft.mainSummary}
            onCopy={() => copyText(draft.mainSummary, "메인 요약 복사 완료")}
          />

          <DraftBlock
            title="균형 관점"
            text={draft.balanceSummary}
            onCopy={() => copyText(draft.balanceSummary, "균형 관점 복사 완료")}
          />

          <DraftBlock
            title="Action hint"
            text={draft.actionHint}
            onCopy={() => copyText(draft.actionHint, "Action hint 복사 완료")}
          />

          <DraftBlock
            title="추천 타깃"
            text={draft.targetText}
            onCopy={() => copyText(draft.targetText, "추천 타깃 복사 완료")}
          />

          <div style={styles.fullDraftBox}>
            <div style={styles.fullDraftHeader}>
              <h3 style={styles.subTitle}>전체 등록 초안</h3>

              <button
                type="button"
                style={styles.copyButton}
                onClick={() =>
                  copyText(draft.fullDraft, "전체 등록 초안 복사 완료")
                }
              >
                전체 복사
              </button>
            </div>

            <pre style={styles.fullDraftPre}>{draft.fullDraft}</pre>
          </div>
        </section>
      </section>
    </main>
  );
}

function TargetGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div style={styles.targetGroup}>
      <h3 style={styles.targetTitle}>{title}</h3>

      <div style={styles.chipWrap}>
        {options.map((option) => {
          const isSelected = selected.includes(option.value);

          return (
            <button
              key={option.value}
              type="button"
              style={{
                ...styles.chip,
                ...(isSelected ? styles.chipSelected : {}),
              }}
              onClick={() => onToggle(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DraftBlock({
  title,
  text,
  onCopy,
}: {
  title: string;
  text: string;
  onCopy: () => void;
}) {
  return (
    <section style={styles.draftBlock}>
      <div style={styles.draftBlockHeader}>
        <h3 style={styles.subTitle}>{title}</h3>

        <button type="button" style={styles.copyButton} onClick={onCopy}>
          복사
        </button>
      </div>

      <pre style={styles.draftText}>{text}</pre>
    </section>
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
    maxWidth: 920,
    margin: "16px 0 0",
    color: "#dbeafe",
    fontSize: 16,
    lineHeight: 1.7,
  },
  heroButtonRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 18,
  },
  heroLink: {
    display: "inline-flex",
    alignItems: "center",
    height: 44,
    padding: "0 14px",
    borderRadius: 12,
    background: "#ffffff",
    color: "#111827",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 900,
  },
  layout: {
    maxWidth: 1280,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "minmax(420px, 0.95fr) minmax(420px, 1.05fr)",
    gap: 22,
    alignItems: "start",
  },
  card: {
    background: "#ffffff",
    color: "#111827",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 16px 40px rgba(0,0,0,0.22)",
  },
  statusBox: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 18,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 22,
    letterSpacing: "-0.03em",
  },
  subTitle: {
    margin: 0,
    fontSize: 16,
    letterSpacing: "-0.02em",
  },
  helpText: {
    margin: "8px 0 0",
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 1.6,
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 34,
    padding: "0 12px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  statusReady: {
    background: "#ecfdf5",
    color: "#047857",
    border: "1px solid #a7f3d0",
  },
  statusNeed: {
    background: "#fffbeb",
    color: "#92400e",
    border: "1px solid #fcd34d",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: 14,
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
    minHeight: 104,
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
  targetBox: {
    marginTop: 20,
    padding: 16,
    borderRadius: 18,
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
  },
  targetHeader: {
    marginBottom: 14,
  },
  targetGroup: {
    padding: 14,
    borderRadius: 14,
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    marginTop: 12,
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
  buttonRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 18,
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
  previewHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 18,
  },
  copyBox: {
    marginBottom: 14,
    padding: 12,
    borderRadius: 14,
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    color: "#1d4ed8",
    fontSize: 13,
    fontWeight: 900,
  },
  draftBlock: {
    padding: 16,
    borderRadius: 18,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    marginBottom: 14,
  },
  draftBlockHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  copyButton: {
    height: 34,
    border: "1px solid #bfdbfe",
    borderRadius: 10,
    padding: "0 10px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: 13,
    fontWeight: 900,
    cursor: "pointer",
  },
  draftText: {
    margin: 0,
    color: "#374151",
    fontSize: 14,
    lineHeight: 1.65,
    whiteSpace: "pre-wrap",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  fullDraftBox: {
    marginTop: 20,
    padding: 18,
    borderRadius: 18,
    background: "#111827",
    color: "#ffffff",
  },
  fullDraftHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  fullDraftPre: {
    margin: 0,
    color: "#e5e7eb",
    fontSize: 13,
    lineHeight: 1.65,
    whiteSpace: "pre-wrap",
    overflowX: "auto",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
};