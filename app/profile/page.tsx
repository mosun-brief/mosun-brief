"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";

type CategoryGroupKey =
  | "ai_emotion"
  | "ai_intent"
  | "blocker"
  | "action_time";

type CategoryOption = {
  group_key: CategoryGroupKey;
  option_value: string;
  label: string;
  description: string;
};

type Selections = Record<CategoryGroupKey, string>;

const CATEGORY_GROUPS: {
  group_key: CategoryGroupKey;
  label: string;
  description: string;
  step: string;
}[] = [
  {
    group_key: "ai_emotion",
    label: "AI에 대한 감정",
    description: "요즘 AI를 볼 때 가장 가까운 감정은 무엇인가요?",
    step: "01",
  },
  {
    group_key: "ai_intent",
    label: "AI로 하고 싶은 것",
    description: "지금 AI로 가장 먼저 해보고 싶은 것은 무엇인가요?",
    step: "02",
  },
  {
    group_key: "blocker",
    label: "지금 막히는 지점",
    description: "AI를 실제로 쓰지 못하게 만드는 가장 큰 이유는 무엇인가요?",
    step: "03",
  },
  {
    group_key: "action_time",
    label: "이번 주 가능한 행동 시간",
    description: "이번 주에 실제로 AI를 써볼 수 있는 시간은 어느 정도인가요?",
    step: "04",
  },
];

const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    group_key: "ai_emotion",
    option_value: "curious",
    label: "호기심",
    description: "AI가 무엇을 가능하게 하는지 궁금해요.",
  },
  {
    group_key: "ai_emotion",
    option_value: "excited",
    label: "기대됨",
    description: "AI가 내 일이나 삶에 도움이 될 것 같아요.",
  },
  {
    group_key: "ai_emotion",
    option_value: "anxious",
    label: "불안",
    description: "뒤처지거나 대체될까 봐 불안해요.",
  },
  {
    group_key: "ai_emotion",
    option_value: "fatigue",
    label: "정보가 너무 많아 피곤",
    description: "볼 것은 많은데 정리가 안 돼요.",
  },
  {
    group_key: "ai_emotion",
    option_value: "skeptical",
    label: "회의적",
    description: "AI가 과장된 것 같고 실제 효과가 궁금해요.",
  },
  {
    group_key: "ai_emotion",
    option_value: "unsure",
    label: "잘 모르겠음",
    description: "좋은 건지 위험한 건지 아직 판단이 안 돼요.",
  },

  {
    group_key: "ai_intent",
    option_value: "not_sure",
    label: "아직 모름",
    description: "AI로 뭘 할 수 있는지부터 알고 싶어요.",
  },
  {
    group_key: "ai_intent",
    option_value: "work_efficiency",
    label: "업무 효율 높이기",
    description: "문서, 정리, 검색, 반복 업무에 쓰고 싶어요.",
  },
  {
    group_key: "ai_intent",
    option_value: "service_building",
    label: "서비스나 사이트 만들기",
    description: "웹사이트, 서비스, 자동화 도구를 만들고 싶어요.",
  },
  {
    group_key: "ai_intent",
    option_value: "learning",
    label: "공부나 자기계발",
    description: "학습, 시험 준비, 지식 습득에 쓰고 싶어요.",
  },
  {
    group_key: "ai_intent",
    option_value: "creative_writing",
    label: "글쓰기/창작",
    description: "글, 콘텐츠, 기획, 이미지 작업에 쓰고 싶어요.",
  },
  {
    group_key: "ai_intent",
    option_value: "business_opportunity",
    label: "사업 기회나 돈 벌 기회",
    description: "수익화, 부업, 사업 아이디어를 찾고 싶어요.",
  },
  {
    group_key: "ai_intent",
    option_value: "avoid_but_need",
    label: "피하고 싶으나 알아야겠음",
    description: "적극적으로 쓰고 싶진 않지만 변화는 따라가야 할 것 같아요.",
  },

  {
    group_key: "blocker",
    option_value: "too_much_info",
    label: "정보가 너무 많아 정리가 안됨",
    description: "무엇이 중요한지 고르기 어려워요.",
  },
  {
    group_key: "blocker",
    option_value: "no_clear_start",
    label: "뭘 해야할 지 모르겠음",
    description: "첫 행동을 정하지 못하고 있어요.",
  },
  {
    group_key: "blocker",
    option_value: "too_technical",
    label: "기술적인 내용이 어려움",
    description: "용어, 개발, 모델 설명이 부담스러워요.",
  },
  {
    group_key: "blocker",
    option_value: "no_time",
    label: "시간 없음",
    description: "관심은 있지만 실제로 해볼 시간이 부족해요.",
  },
  {
    group_key: "blocker",
    option_value: "fear_of_falling_behind",
    label: "뒤처질까봐 불안",
    description: "AI 변화 속도에 비해 내가 늦는 느낌이에요.",
  },
  {
    group_key: "blocker",
    option_value: "low_need",
    label: "아직 필요성을 모르겠음",
    description: "왜 써야 하는지 아직 납득이 안 돼요.",
  },

  {
    group_key: "action_time",
    option_value: "10min",
    label: "10분",
    description: "짧게 읽고 바로 하나만 해볼 수 있어요.",
  },
  {
    group_key: "action_time",
    option_value: "30min",
    label: "30분",
    description: "짧은 튜토리얼이나 간단한 적용이 가능해요.",
  },
  {
    group_key: "action_time",
    option_value: "2hours",
    label: "2시간",
    description: "작은 산출물이나 미니 실습이 가능해요.",
  },
  {
    group_key: "action_time",
    option_value: "half_day_weekend",
    label: "주말 반나절",
    description: "주말에 미니 프로젝트나 깊은 작업이 가능해요.",
  },
];

const DEFAULT_SELECTIONS: Selections = {
  ai_emotion: "fatigue",
  ai_intent: "not_sure",
  blocker: "too_much_info",
  action_time: "30min",
};

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "입문",
  normal: "중간",
  expert: "심화",
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getEmailFromCurrentUrl() {
  if (typeof window === "undefined") return "";

  const params = new URLSearchParams(window.location.search);
  const emailFromUrl = params.get("email");

  if (!emailFromUrl) return "";

  return emailFromUrl.trim().toLowerCase();
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return {
      ok: false,
      message: `빈 응답을 받았습니다. status=${response.status}`,
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

function getOptionLabel(groupKey: CategoryGroupKey, optionValue: string) {
  return (
    CATEGORY_OPTIONS.find(
      (option) =>
        option.group_key === groupKey && option.option_value === optionValue
    )?.label || optionValue
  );
}

function getSuccessMessageBySelection(selections: Selections) {
  if (selections.blocker === "too_much_info") {
    return "다음 브리프에서는 정보를 더 많이 주기보다, 정리된 핵심과 하나의 행동을 더 우선합니다.";
  }

  if (selections.blocker === "no_clear_start") {
    return "다음 브리프에서는 ‘어디서 시작할지’가 분명한 자료와 작은 첫 행동을 더 우선합니다.";
  }

  if (selections.blocker === "too_technical") {
    return "다음 브리프에서는 기술 용어보다 따라할 수 있는 설명과 쉬운 자료를 더 우선합니다.";
  }

  if (selections.blocker === "no_time") {
    return "다음 브리프에서는 긴 분석보다 짧은 시간 안에 확인할 수 있는 자료를 더 우선합니다.";
  }

  if (selections.blocker === "fear_of_falling_behind") {
    return "다음 브리프에서는 불안을 키우는 속보보다, 지금 해도 되는 작은 행동을 더 우선합니다.";
  }

  if (selections.blocker === "low_need") {
    return "다음 브리프에서는 과장된 트렌드보다 실제 필요성과 비용 대비 효과를 더 우선합니다.";
  }

  return "다음 브리프부터 새 상태가 추천 점수에 반영됩니다.";
}

export default function ProfilePage() {
  const [email, setEmail] = useState("");
  const [emailLoadedFromUrl, setEmailLoadedFromUrl] = useState(false);
  const [jobRole, setJobRole] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [selections, setSelections] = useState<Selections>(DEFAULT_SELECTIONS);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState("");

  const summary = useMemo(
    () => ({
      aiEmotion: getOptionLabel("ai_emotion", selections.ai_emotion),
      aiIntent: getOptionLabel("ai_intent", selections.ai_intent),
      blocker: getOptionLabel("blocker", selections.blocker),
      actionTime: getOptionLabel("action_time", selections.action_time),
      difficulty: DIFFICULTY_LABELS[difficulty] || difficulty,
    }),
    [difficulty, selections]
  );

  const successMessage = useMemo(
    () => getSuccessMessageBySelection(selections),
    [selections]
  );

  useEffect(() => {
    const emailFromUrl = getEmailFromCurrentUrl();

    if (!emailFromUrl) return;

    setEmail(emailFromUrl);
    setEmailLoadedFromUrl(true);
  }, []);

  function handleSelect(groupKey: CategoryGroupKey, optionValue: string) {
    setSelections((prev) => ({
      ...prev,
      [groupKey]: optionValue,
    }));

    if (showSuccessScreen) {
      setShowSuccessScreen(false);
      setIsSuccess(false);
      setMessage("");
    }
  }

  function resetSuccessScreen() {
    setShowSuccessScreen(false);
    setIsSuccess(false);
    setMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setIsSuccess(false);
    setShowSuccessScreen(false);

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      setMessage("올바른 이메일을 입력해주세요.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          job_role: jobRole.trim() || null,
          difficulty,
          ai_emotion: selections.ai_emotion,
          ai_intent: selections.ai_intent,
          blocker: selections.blocker,
          action_time: selections.action_time,
        }),
      });

      const result = await readJsonResponse(response);

      if (!response.ok || !result.ok) {
        setMessage(result.message || "상태 업데이트 중 오류가 발생했습니다.");
        return;
      }

      setIsSuccess(true);
      setShowSuccessScreen(true);
      setLastUpdatedAt(new Date().toLocaleString("ko-KR"));
      setMessage(
        result.message ||
          "상태가 업데이트되었습니다. 다음 브리프부터 새 진단값이 반영됩니다."
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setMessage(`상태 업데이트 중 오류가 발생했습니다: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.shell}>
        <section style={styles.hero}>
          <p style={styles.badge}>AI-FU 재진단</p>

          <h1 style={styles.title}>
            지금 상태가 바뀌었다면,
            <br />
            브리프도 다시 맞춰야 합니다.
          </h1>

          <p style={styles.description}>
            AI에 대한 감정, 목적, 막히는 지점은 계속 바뀝니다. 같은 이메일로
            다시 제출하면 기존 구독자 정보가 업데이트되고, 다음 발송부터 새
            상태가 반영됩니다.
          </p>
        </section>

        <section style={styles.card}>
          {showSuccessScreen ? (
            <SuccessPanel
              email={email}
              jobRole={jobRole}
              summary={summary}
              successMessage={successMessage}
              lastUpdatedAt={lastUpdatedAt}
              onEditAgain={resetSuccessScreen}
            />
          ) : (
            <>
              <div style={styles.cardHeader}>
                <div>
                  <p style={styles.cardKicker}>상태 변경</p>
                  <h2 style={styles.cardTitle}>
                    내 AI-FU 상태 다시 설정하기
                  </h2>
                </div>

                <p style={styles.cardSubtext}>
                  구독을 새로 만드는 것이 아니라, 같은 이메일의 진단값을
                  갱신하는 화면입니다.
                </p>
              </div>

              {emailLoadedFromUrl && (
                <section style={styles.autoEmailBox}>
                  <strong style={styles.autoEmailTitle}>
                    이메일이 자동으로 입력되었습니다.
                  </strong>
                  <p style={styles.autoEmailText}>
                    메일에서 재진단 링크를 통해 들어왔기 때문에{" "}
                    <strong>{email}</strong> 주소로 상태를 업데이트합니다.
                  </p>
                </section>
              )}

              <form onSubmit={handleSubmit}>
                <div style={styles.formBlock}>
                  <label style={styles.label}>
                    구독 이메일
                    <input
                      style={styles.input}
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setEmailLoadedFromUrl(false);
                      }}
                      placeholder="briefing@example.com"
                      required
                    />
                  </label>

                  <label style={styles.label}>
                    직업/상황
                    <input
                      style={styles.input}
                      type="text"
                      value={jobRole}
                      onChange={(event) => setJobRole(event.target.value)}
                      placeholder="예: 인턴, 직장인, 창업 준비, 학생"
                    />
                  </label>

                  <label style={styles.label}>
                    선호 난이도
                    <select
                      style={styles.input}
                      value={difficulty}
                      onChange={(event) => setDifficulty(event.target.value)}
                    >
                      <option value="easy">입문</option>
                      <option value="normal">중간</option>
                      <option value="expert">심화</option>
                    </select>
                  </label>
                </div>

                <section style={styles.noticeBox}>
                  <strong style={styles.noticeTitle}>
                    이럴 때 다시 설정하세요
                  </strong>
                  <p style={styles.noticeText}>
                    AI가 막연히 불안했는데 이제 직접 써보고 싶어졌거나,
                    반대로 정보가 너무 많아서 피곤해졌다면 상태를 다시 고르는
                    게 좋습니다.
                  </p>
                </section>

                <div style={styles.questionStack}>
                  {CATEGORY_GROUPS.map((group) => {
                    const options = CATEGORY_OPTIONS.filter(
                      (option) => option.group_key === group.group_key
                    );

                    return (
                      <section
                        key={group.group_key}
                        style={styles.questionBlock}
                      >
                        <div style={styles.questionHeader}>
                          <div style={styles.stepBadge}>{group.step}</div>

                          <div>
                            <h3 style={styles.questionTitle}>{group.label}</h3>
                            <p style={styles.questionDescription}>
                              {group.description}
                            </p>
                          </div>
                        </div>

                        <div style={styles.optionGrid}>
                          {options.map((option) => {
                            const selected =
                              selections[group.group_key] ===
                              option.option_value;

                            return (
                              <button
                                key={`${option.group_key}-${option.option_value}`}
                                type="button"
                                style={{
                                  ...styles.optionButton,
                                  ...(selected
                                    ? styles.optionButtonSelected
                                    : {}),
                                }}
                                onClick={() =>
                                  handleSelect(
                                    option.group_key,
                                    option.option_value
                                  )
                                }
                              >
                                <span style={styles.optionTopLine}>
                                  <span style={styles.optionLabel}>
                                    {option.label}
                                  </span>
                                  {selected && (
                                    <span style={styles.selectedPill}>
                                      선택됨
                                    </span>
                                  )}
                                </span>

                                <span style={styles.optionDescription}>
                                  {option.description}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>

                <section style={styles.summaryBox}>
                  <p style={styles.summaryKicker}>업데이트될 상태</p>
                  <p style={styles.summaryText}>
                    <strong>{summary.aiEmotion}</strong> 상태에서{" "}
                    <strong>{summary.aiIntent}</strong>에 관심이 있고,{" "}
                    <strong>{summary.blocker}</strong> 때문에 막혀 있으며,
                    이번 주에는 <strong>{summary.actionTime}</strong> 정도
                    실행할 수 있습니다. 난이도는{" "}
                    <strong>{summary.difficulty}</strong>입니다.
                  </p>
                </section>

                <button
                  type="submit"
                  style={{
                    ...styles.submitButton,
                    opacity: submitting ? 0.65 : 1,
                  }}
                  disabled={submitting}
                >
                  {submitting ? "업데이트 중..." : "내 상태 업데이트하기"}
                </button>

                {message && (
                  <div
                    style={{
                      ...styles.messageBox,
                      background: isSuccess ? "#ecfdf5" : "#fef2f2",
                      borderColor: isSuccess ? "#a7f3d0" : "#fecaca",
                      color: isSuccess ? "#047857" : "#b91c1c",
                    }}
                  >
                    {message}
                  </div>
                )}

                <p style={styles.footerNote}>
                  업데이트 후 다음 발송부터 새 상태가 추천 점수에 반영됩니다.
                </p>
              </form>
            </>
          )}
        </section>
      </section>
    </main>
  );
}

function SuccessPanel({
  email,
  jobRole,
  summary,
  successMessage,
  lastUpdatedAt,
  onEditAgain,
}: {
  email: string;
  jobRole: string;
  summary: {
    aiEmotion: string;
    aiIntent: string;
    blocker: string;
    actionTime: string;
    difficulty: string;
  };
  successMessage: string;
  lastUpdatedAt: string;
  onEditAgain: () => void;
}) {
  return (
    <section>
      <div style={styles.successHero}>
        <p style={styles.successBadge}>재진단 저장 완료</p>

        <h2 style={styles.successTitle}>
          다음 AI-FU 브리프가
          <br />
          새 상태를 기준으로 조정됩니다.
        </h2>

        <p style={styles.successDescription}>{successMessage}</p>
      </div>

      <section style={styles.successInfoGrid}>
        <div style={styles.successInfoCard}>
          <p style={styles.successInfoLabel}>이메일</p>
          <p style={styles.successInfoValue}>{email}</p>
        </div>

        <div style={styles.successInfoCard}>
          <p style={styles.successInfoLabel}>직업/상황</p>
          <p style={styles.successInfoValue}>{jobRole || "미입력"}</p>
        </div>

        <div style={styles.successInfoCard}>
          <p style={styles.successInfoLabel}>저장 시각</p>
          <p style={styles.successInfoValue}>{lastUpdatedAt || "-"}</p>
        </div>
      </section>

      <section style={styles.successSummaryBox}>
        <p style={styles.successSummaryKicker}>업데이트된 내 상태</p>

        <div style={styles.successSummaryGrid}>
          <SummaryChip label="AI 감정" value={summary.aiEmotion} />
          <SummaryChip label="하고 싶은 것" value={summary.aiIntent} />
          <SummaryChip label="막히는 지점" value={summary.blocker} />
          <SummaryChip label="가능한 시간" value={summary.actionTime} />
          <SummaryChip label="난이도" value={summary.difficulty} />
        </div>
      </section>

      <section style={styles.nextBox}>
        <p style={styles.nextBoxTitle}>이제 어떻게 반영되나요?</p>

        <div style={styles.nextStepList}>
          <div style={styles.nextStepItem}>
            <span style={styles.nextStepNumber}>1</span>
            <p style={styles.nextStepText}>
              다음 발송 때 이 상태와 맞는 자료의 추천 점수가 올라갑니다.
            </p>
          </div>

          <div style={styles.nextStepItem}>
            <span style={styles.nextStepNumber}>2</span>
            <p style={styles.nextStepText}>
              “이 자료가 온 이유” 문구가 새 상태 기준으로 더 정확해집니다.
            </p>
          </div>

          <div style={styles.nextStepItem}>
            <span style={styles.nextStepNumber}>3</span>
            <p style={styles.nextStepText}>
              Action hint의 크기와 난이도도 가능한 시간에 맞춰 조정됩니다.
            </p>
          </div>
        </div>
      </section>

      <div style={styles.successButtonRow}>
        <button type="button" style={styles.editButton} onClick={onEditAgain}>
          다시 수정하기
        </button>

        <a href="/" style={styles.homeLink}>
          구독 화면으로 이동
        </a>
      </div>

      <p style={styles.successFooterNote}>
        이 창은 닫아도 됩니다. 다음 메일의 피드백 버튼을 누르면 추천이 한 번
        더 조정됩니다.
      </p>
    </section>
  );
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.summaryChip}>
      <p style={styles.summaryChipLabel}>{label}</p>
      <p style={styles.summaryChipValue}>{value}</p>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(59,130,246,0.28), transparent 32%), linear-gradient(135deg, #020617 0%, #0f172a 45%, #111827 100%)",
    padding: "48px 18px",
    color: "#ffffff",
  },
  shell: {
    width: "100%",
    maxWidth: 1040,
    margin: "0 auto",
  },
  hero: {
    marginBottom: 26,
  },
  badge: {
    display: "inline-block",
    margin: "0 0 18px",
    padding: "8px 14px",
    borderRadius: 999,
    background: "rgba(59,130,246,0.16)",
    border: "1px solid rgba(147,197,253,0.42)",
    color: "#bfdbfe",
    fontSize: 14,
    fontWeight: 900,
  },
  title: {
    margin: 0,
    fontSize: "clamp(36px, 5vw, 58px)",
    lineHeight: 1.08,
    letterSpacing: "-0.075em",
  },
  description: {
    maxWidth: 780,
    margin: "20px 0 0",
    color: "#dbeafe",
    fontSize: 18,
    lineHeight: 1.78,
    wordBreak: "keep-all",
  },
  card: {
    padding: 28,
    borderRadius: 30,
    background: "#ffffff",
    color: "#111827",
    boxShadow: "0 24px 70px rgba(0,0,0,0.34)",
  },
  cardHeader: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(260px, 0.8fr)",
    gap: 18,
    alignItems: "end",
    marginBottom: 24,
  },
  cardKicker: {
    margin: "0 0 8px",
    color: "#2563eb",
    fontSize: 13,
    fontWeight: 950,
  },
  cardTitle: {
    margin: 0,
    color: "#111827",
    fontSize: 30,
    lineHeight: 1.25,
    letterSpacing: "-0.055em",
  },
  cardSubtext: {
    margin: 0,
    color: "#6b7280",
    fontSize: 14,
    lineHeight: 1.65,
    wordBreak: "keep-all",
  },
  autoEmailBox: {
    padding: 17,
    borderRadius: 18,
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    marginBottom: 18,
  },
  autoEmailTitle: {
    display: "block",
    marginBottom: 6,
    color: "#047857",
    fontSize: 14,
    fontWeight: 950,
  },
  autoEmailText: {
    margin: 0,
    color: "#065f46",
    fontSize: 14,
    lineHeight: 1.7,
    wordBreak: "keep-all",
  },
  formBlock: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
    marginBottom: 18,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 9,
    fontSize: 14,
    fontWeight: 900,
    color: "#111827",
  },
  input: {
    height: 52,
    borderRadius: 15,
    border: "1px solid #d1d5db",
    padding: "0 14px",
    fontSize: 15,
    color: "#111827",
    background: "#ffffff",
    outline: "none",
  },
  noticeBox: {
    padding: 17,
    borderRadius: 18,
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    marginBottom: 20,
  },
  noticeTitle: {
    display: "block",
    marginBottom: 6,
    color: "#1d4ed8",
    fontSize: 14,
    fontWeight: 950,
  },
  noticeText: {
    margin: 0,
    color: "#1e3a8a",
    fontSize: 14,
    lineHeight: 1.7,
    wordBreak: "keep-all",
  },
  questionStack: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  questionBlock: {
    padding: 20,
    borderRadius: 22,
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
  },
  questionHeader: {
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
    marginBottom: 15,
  },
  stepBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#111827",
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 950,
    flex: "0 0 auto",
  },
  questionTitle: {
    margin: 0,
    fontSize: 21,
    letterSpacing: "-0.04em",
    color: "#111827",
  },
  questionDescription: {
    margin: "7px 0 0",
    color: "#4b5563",
    fontSize: 14,
    lineHeight: 1.6,
    wordBreak: "keep-all",
  },
  optionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 10,
  },
  optionButton: {
    minHeight: 92,
    textAlign: "left",
    border: "1px solid #e5e7eb",
    borderRadius: 17,
    background: "#ffffff",
    padding: 14,
    cursor: "pointer",
    color: "#111827",
  },
  optionButtonSelected: {
    border: "2px solid #2563eb",
    background: "#eff6ff",
    boxShadow: "0 0 0 3px rgba(37,99,235,0.12)",
  },
  optionTopLine: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 7,
  },
  optionLabel: {
    display: "block",
    fontSize: 15,
    fontWeight: 950,
    lineHeight: 1.35,
  },
  selectedPill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px 7px",
    borderRadius: 999,
    background: "#2563eb",
    color: "#ffffff",
    fontSize: 11,
    fontWeight: 900,
    flex: "0 0 auto",
  },
  optionDescription: {
    display: "block",
    fontSize: 13,
    lineHeight: 1.55,
    color: "#6b7280",
    wordBreak: "keep-all",
  },
  summaryBox: {
    marginTop: 22,
    padding: 18,
    borderRadius: 20,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
  },
  summaryKicker: {
    margin: "0 0 8px",
    color: "#2563eb",
    fontSize: 13,
    fontWeight: 950,
  },
  summaryText: {
    margin: 0,
    color: "#111827",
    fontSize: 15,
    lineHeight: 1.75,
    wordBreak: "keep-all",
  },
  submitButton: {
    width: "100%",
    height: 60,
    border: "none",
    borderRadius: 19,
    background: "#111827",
    color: "#ffffff",
    marginTop: 22,
    fontSize: 17,
    fontWeight: 950,
    cursor: "pointer",
  },
  messageBox: {
    marginTop: 16,
    padding: 15,
    borderRadius: 15,
    border: "1px solid",
    fontSize: 14,
    lineHeight: 1.6,
    fontWeight: 800,
  },
  footerNote: {
    margin: "14px 0 0",
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 1.6,
    textAlign: "center",
  },
  successHero: {
    padding: 28,
    borderRadius: 24,
    background: "linear-gradient(135deg,#111827,#1e3a8a)",
    color: "#ffffff",
  },
  successBadge: {
    display: "inline-flex",
    margin: "0 0 14px",
    padding: "7px 11px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.28)",
    color: "#dbeafe",
    fontSize: 13,
    fontWeight: 950,
  },
  successTitle: {
    margin: 0,
    fontSize: "clamp(30px, 4vw, 46px)",
    lineHeight: 1.13,
    letterSpacing: "-0.07em",
  },
  successDescription: {
    maxWidth: 720,
    margin: "18px 0 0",
    color: "#dbeafe",
    fontSize: 17,
    lineHeight: 1.75,
    wordBreak: "keep-all",
  },
  successInfoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 12,
    marginTop: 18,
  },
  successInfoCard: {
    padding: 16,
    borderRadius: 18,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
  },
  successInfoLabel: {
    margin: "0 0 7px",
    color: "#64748b",
    fontSize: 12,
    fontWeight: 950,
  },
  successInfoValue: {
    margin: 0,
    color: "#111827",
    fontSize: 15,
    fontWeight: 950,
    lineHeight: 1.45,
    wordBreak: "break-all",
  },
  successSummaryBox: {
    marginTop: 18,
    padding: 20,
    borderRadius: 22,
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
  },
  successSummaryKicker: {
    margin: "0 0 12px",
    color: "#1d4ed8",
    fontSize: 14,
    fontWeight: 950,
  },
  successSummaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 10,
  },
  summaryChip: {
    padding: 14,
    borderRadius: 16,
    background: "#ffffff",
    border: "1px solid #dbeafe",
  },
  summaryChipLabel: {
    margin: "0 0 6px",
    color: "#64748b",
    fontSize: 12,
    fontWeight: 950,
  },
  summaryChipValue: {
    margin: 0,
    color: "#111827",
    fontSize: 15,
    fontWeight: 950,
    lineHeight: 1.45,
  },
  nextBox: {
    marginTop: 18,
    padding: 20,
    borderRadius: 22,
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
  },
  nextBoxTitle: {
    margin: "0 0 14px",
    color: "#047857",
    fontSize: 15,
    fontWeight: 950,
  },
  nextStepList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  nextStepItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
  },
  nextStepNumber: {
    width: 26,
    height: 26,
    borderRadius: 999,
    background: "#047857",
    color: "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 950,
    flex: "0 0 auto",
  },
  nextStepText: {
    margin: 0,
    color: "#065f46",
    fontSize: 14,
    lineHeight: 1.65,
    fontWeight: 800,
    wordBreak: "keep-all",
  },
  successButtonRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 20,
  },
  editButton: {
    height: 52,
    border: "none",
    borderRadius: 15,
    background: "#111827",
    color: "#ffffff",
    padding: "0 18px",
    fontSize: 15,
    fontWeight: 950,
    cursor: "pointer",
  },
  homeLink: {
    height: 52,
    borderRadius: 15,
    background: "#f3f4f6",
    color: "#111827",
    border: "1px solid #d1d5db",
    padding: "0 18px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    textDecoration: "none",
    fontSize: 15,
    fontWeight: 950,
  },
  successFooterNote: {
    margin: "16px 0 0",
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 1.65,
    textAlign: "center",
    wordBreak: "keep-all",
  },
};