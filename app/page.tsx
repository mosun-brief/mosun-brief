"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import { createClient } from "@supabase/supabase-js";

type CategoryGroupKey =
  | "ai_emotion"
  | "ai_intent"
  | "blocker"
  | "action_time";

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

type SelectedSummary = {
  aiEmotion: string;
  aiIntent: string;
  blocker: string;
  actionTime: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const FALLBACK_GROUPS: CategoryGroup[] = [
  {
    group_key: "ai_emotion",
    label: "AI에 대한 감정",
    description: "AI를 볼 때 지금 가장 가까운 감정을 골라주세요.",
    sort_order: 1,
    is_active: true,
  },
  {
    group_key: "ai_intent",
    label: "AI로 하고 싶은 것",
    description: "AI를 통해 가장 먼저 얻고 싶은 방향을 골라주세요.",
    sort_order: 2,
    is_active: true,
  },
  {
    group_key: "blocker",
    label: "지금 막히는 지점",
    description: "AI를 시작하지 못하게 만드는 가장 큰 이유를 골라주세요.",
    sort_order: 3,
    is_active: true,
  },
  {
    group_key: "action_time",
    label: "이번 주 가능한 행동 시간",
    description: "이번 주에 실제로 써볼 수 있는 시간을 골라주세요.",
    sort_order: 4,
    is_active: true,
  },
];

const FALLBACK_OPTIONS: CategoryOption[] = [
  {
    group_key: "ai_emotion",
    option_value: "curious",
    label: "호기심",
    description: "AI가 무엇을 가능하게 하는지 궁금해요.",
    sort_order: 1,
    is_active: true,
  },
  {
    group_key: "ai_emotion",
    option_value: "excited",
    label: "기대됨",
    description: "AI가 내 일이나 삶에 도움이 될 것 같아요.",
    sort_order: 2,
    is_active: true,
  },
  {
    group_key: "ai_emotion",
    option_value: "anxious",
    label: "불안",
    description: "뒤처지거나 대체될까 봐 불안해요.",
    sort_order: 3,
    is_active: true,
  },
  {
    group_key: "ai_emotion",
    option_value: "fatigue",
    label: "정보가 너무 많아 피곤",
    description: "볼 것은 많은데 정리가 안 돼요.",
    sort_order: 4,
    is_active: true,
  },
  {
    group_key: "ai_emotion",
    option_value: "skeptical",
    label: "회의적",
    description: "AI가 과장된 것 같고 실제 효과가 궁금해요.",
    sort_order: 5,
    is_active: true,
  },
  {
    group_key: "ai_emotion",
    option_value: "unsure",
    label: "잘 모르겠음",
    description: "좋은 건지 위험한 건지 아직 판단이 안 돼요.",
    sort_order: 6,
    is_active: true,
  },

  {
    group_key: "ai_intent",
    option_value: "not_sure",
    label: "아직 모름",
    description: "AI로 뭘 할 수 있는지부터 알고 싶어요.",
    sort_order: 1,
    is_active: true,
  },
  {
    group_key: "ai_intent",
    option_value: "work_efficiency",
    label: "업무 효율 높이기",
    description: "문서, 정리, 검색, 반복 업무에 쓰고 싶어요.",
    sort_order: 2,
    is_active: true,
  },
  {
    group_key: "ai_intent",
    option_value: "service_building",
    label: "서비스나 사이트 만들기",
    description: "웹사이트, 서비스, 자동화 도구를 만들고 싶어요.",
    sort_order: 3,
    is_active: true,
  },
  {
    group_key: "ai_intent",
    option_value: "learning",
    label: "공부나 자기계발",
    description: "학습, 시험 준비, 지식 습득에 쓰고 싶어요.",
    sort_order: 4,
    is_active: true,
  },
  {
    group_key: "ai_intent",
    option_value: "creative_writing",
    label: "글쓰기/창작",
    description: "글, 콘텐츠, 기획, 이미지 작업에 쓰고 싶어요.",
    sort_order: 5,
    is_active: true,
  },
  {
    group_key: "ai_intent",
    option_value: "business_opportunity",
    label: "사업 기회나 돈 벌 기회",
    description: "수익화, 부업, 사업 아이디어를 찾고 싶어요.",
    sort_order: 6,
    is_active: true,
  },
  {
    group_key: "ai_intent",
    option_value: "avoid_but_need",
    label: "피하고 싶으나 알아야겠음",
    description: "적극적으로 쓰고 싶진 않지만 변화는 따라가야 할 것 같아요.",
    sort_order: 7,
    is_active: true,
  },

  {
    group_key: "blocker",
    option_value: "too_much_info",
    label: "정보가 너무 많아 정리가 안됨",
    description: "무엇이 중요한지 고르기 어려워요.",
    sort_order: 1,
    is_active: true,
  },
  {
    group_key: "blocker",
    option_value: "no_clear_start",
    label: "뭘 해야할 지 모르겠음",
    description: "첫 행동을 정하지 못하고 있어요.",
    sort_order: 2,
    is_active: true,
  },
  {
    group_key: "blocker",
    option_value: "too_technical",
    label: "기술적인 내용이 어려움",
    description: "용어, 개발, 모델 설명이 부담스러워요.",
    sort_order: 3,
    is_active: true,
  },
  {
    group_key: "blocker",
    option_value: "no_time",
    label: "시간 없음",
    description: "관심은 있지만 실제로 해볼 시간이 부족해요.",
    sort_order: 4,
    is_active: true,
  },
  {
    group_key: "blocker",
    option_value: "fear_of_falling_behind",
    label: "뒤처질까봐 불안",
    description: "AI 변화 속도에 비해 내가 늦는 느낌이에요.",
    sort_order: 5,
    is_active: true,
  },
  {
    group_key: "blocker",
    option_value: "low_need",
    label: "아직 필요성을 모르겠음",
    description: "왜 써야 하는지 아직 납득이 안 돼요.",
    sort_order: 6,
    is_active: true,
  },

  {
    group_key: "action_time",
    option_value: "10min",
    label: "10분",
    description: "짧게 읽고 바로 하나만 해볼 수 있어요.",
    sort_order: 1,
    is_active: true,
  },
  {
    group_key: "action_time",
    option_value: "30min",
    label: "30분",
    description: "짧은 튜토리얼이나 간단한 적용이 가능해요.",
    sort_order: 2,
    is_active: true,
  },
  {
    group_key: "action_time",
    option_value: "2hours",
    label: "2시간",
    description: "작은 산출물이나 미니 실습이 가능해요.",
    sort_order: 3,
    is_active: true,
  },
  {
    group_key: "action_time",
    option_value: "half_day_weekend",
    label: "주말 반나절",
    description: "주말에 미니 프로젝트나 긴 실험이 가능해요.",
    sort_order: 4,
    is_active: true,
  },
];

const DEFAULT_SELECTIONS: Record<CategoryGroupKey, string> = {
  ai_emotion: "fatigue",
  ai_intent: "not_sure",
  blocker: "too_much_info",
  action_time: "30min",
};

const GROUP_STEP_LABELS: Record<CategoryGroupKey, string> = {
  ai_emotion: "01",
  ai_intent: "02",
  blocker: "03",
  action_time: "04",
};

const GROUP_HELP_TEXTS: Record<CategoryGroupKey, string> = {
  ai_emotion: "정답은 없습니다. 지금 가장 가까운 느낌 하나만 고르면 됩니다.",
  ai_intent: "목표가 뚜렷하지 않아도 괜찮습니다. ‘아직 모름’도 중요한 신호입니다.",
  blocker: "AI-FU는 이 막힘을 기준으로 자료와 실행 단계를 줄입니다.",
  action_time: "선택한 시간 안에 끝낼 수 있는 행동 제안을 함께 보냅니다.",
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildBundles(groups: CategoryGroup[], options: CategoryOption[]) {
  return groups
    .filter((group) => group.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((group) => ({
      group,
      options: options
        .filter(
          (option) =>
            option.is_active && option.group_key === group.group_key
        )
        .sort((a, b) => a.sort_order - b.sort_order),
    }));
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

function findSelectedLabel(
  options: CategoryOption[],
  groupKey: CategoryGroupKey,
  value: string
) {
  return (
    options.find(
      (option) =>
        option.group_key === groupKey && option.option_value === value
    )?.label || value
  );
}

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [difficulty, setDifficulty] = useState("easy");

  const [groups, setGroups] = useState<CategoryGroup[]>(FALLBACK_GROUPS);
  const [options, setOptions] = useState<CategoryOption[]>(FALLBACK_OPTIONS);

  const [selections, setSelections] =
    useState<Record<CategoryGroupKey, string>>(DEFAULT_SELECTIONS);

  const [isMobile, setIsMobile] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const bundles = useMemo(() => buildBundles(groups, options), [groups, options]);

  const selectedSummary = useMemo(
    () => ({
      aiEmotion: findSelectedLabel(options, "ai_emotion", selections.ai_emotion),
      aiIntent: findSelectedLabel(options, "ai_intent", selections.ai_intent),
      blocker: findSelectedLabel(options, "blocker", selections.blocker),
      actionTime: findSelectedLabel(
        options,
        "action_time",
        selections.action_time
      ),
    }),
    [options, selections]
  );

  useEffect(() => {
    function updateIsMobile() {
      setIsMobile(window.innerWidth <= 760);
    }

    updateIsMobile();
    window.addEventListener("resize", updateIsMobile);

    return () => {
      window.removeEventListener("resize", updateIsMobile);
    };
  }, []);

  useEffect(() => {
    async function loadCategories() {
      setLoadingCategories(true);

      if (!supabaseUrl || !supabaseAnonKey) {
        setGroups(FALLBACK_GROUPS);
        setOptions(FALLBACK_OPTIONS);
        setLoadingCategories(false);
        return;
      }

      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        const [
          { data: groupData, error: groupError },
          { data: optionData, error: optionError },
        ] = await Promise.all([
          supabase
            .from("subscriber_category_groups")
            .select("id, group_key, label, description, sort_order, is_active")
            .eq("is_active", true)
            .order("sort_order", { ascending: true }),
          supabase
            .from("subscriber_category_options")
            .select(
              "id, group_key, option_value, label, description, sort_order, is_active"
            )
            .eq("is_active", true)
            .order("sort_order", { ascending: true }),
        ]);

        if (groupError || optionError) {
          setGroups(FALLBACK_GROUPS);
          setOptions(FALLBACK_OPTIONS);
          return;
        }

        if (groupData && groupData.length > 0) {
          setGroups(groupData as CategoryGroup[]);
        }

        if (optionData && optionData.length > 0) {
          setOptions(optionData as CategoryOption[]);
        }
      } catch {
        setGroups(FALLBACK_GROUPS);
        setOptions(FALLBACK_OPTIONS);
      } finally {
        setLoadingCategories(false);
      }
    }

    loadCategories();
  }, []);

  function handleSelect(groupKey: CategoryGroupKey, optionValue: string) {
    setSelections((prev) => ({
      ...prev,
      [groupKey]: optionValue,
    }));
  }

  function handleResetForm() {
    setIsSuccess(false);
    setMessage("");
    setSubmittedEmail("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setIsSuccess(false);

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      setMessage("올바른 이메일을 입력해주세요.");
      return;
    }

    const aiEmotion = selections.ai_emotion;
    const aiIntent = selections.ai_intent;
    const blocker = selections.blocker;
    const actionTime = selections.action_time;

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
          difficulty: difficulty || "easy",
          ai_emotion: aiEmotion,
          ai_intent: aiIntent,
          blocker,
          action_time: actionTime,
        }),
      });

      const result = await readJsonResponse(response);

      if (!response.ok || !result.ok) {
        setMessage(result.message || "구독 저장 중 오류가 발생했습니다.");
        return;
      }

      setSubmittedEmail(normalizedEmail);
      setIsSuccess(true);
      setMessage(
        result.message ||
          "신청이 완료되었습니다. 같은 이메일로 다시 신청한 경우 기존 진단 정보가 업데이트됩니다."
      );

      window.setTimeout(() => {
        const element = document.getElementById("subscribe-result");
        element?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setMessage(`저장 중 오류가 발생했습니다: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ ...styles.page, ...(isMobile ? styles.mobilePage : {}) }}>
      <section
        style={{ ...styles.shell, ...(isMobile ? styles.mobileShell : {}) }}
      >
        <section
          style={{ ...styles.hero, ...(isMobile ? styles.mobileHero : {}) }}
        >
          <div
            style={{
              ...styles.heroText,
              ...(isMobile ? styles.mobileHeroText : {}),
            }}
          >
            <p style={{ ...styles.badge, ...(isMobile ? styles.mobileBadge : {}) }}>
              AI-FU MVP
            </p>

            <h1
              style={{
                ...styles.title,
                ...(isMobile ? styles.mobileTitle : {}),
              }}
            >
              AI를 알아야 할 것 같은데,
              <br />
              어디서부터 시작할지 모르겠다면
            </h1>

            <p
              style={{
                ...styles.description,
                ...(isMobile ? styles.mobileDescription : {}),
              }}
            >
              AI-FU는 더 많은 뉴스를 보내는 서비스가 아닙니다. 지금 당신의
              AI 감정, 목적, 막히는 지점, 가능한 시간을 기준으로 이번 주에
              실제로 해볼 수 있는 작은 실행 브리프를 보내드립니다.
            </p>

            <div
              style={{
                ...styles.promiseGrid,
                ...(isMobile ? styles.mobilePromiseGrid : {}),
              }}
            >
              <div
                style={{
                  ...styles.promiseItem,
                  ...(isMobile ? styles.mobilePromiseItem : {}),
                }}
              >
                <strong style={styles.promiseTitle}>진단</strong>
                <span style={styles.promiseText}>AI에 대한 현재 상태 확인</span>
              </div>
              <div
                style={{
                  ...styles.promiseItem,
                  ...(isMobile ? styles.mobilePromiseItem : {}),
                }}
              >
                <strong style={styles.promiseTitle}>해석</strong>
                <span style={styles.promiseText}>나에게 왜 필요한지 설명</span>
              </div>
              <div
                style={{
                  ...styles.promiseItem,
                  ...(isMobile ? styles.mobilePromiseItem : {}),
                }}
              >
                <strong style={styles.promiseTitle}>실행</strong>
                <span style={styles.promiseText}>이번 주 가능한 행동 제안</span>
              </div>
            </div>
          </div>

          <aside
            style={{
              ...styles.previewPanel,
              ...(isMobile ? styles.mobilePreviewPanel : {}),
            }}
          >
            <p style={styles.previewEyebrow}>구독 후 받게 될 것</p>
            <h2 style={styles.previewTitle}>개인 맞춤 AI 실행 브리프</h2>

            <div style={styles.previewList}>
              <div style={styles.previewRow}>
                <span style={styles.previewDot} />
                <span>지금 볼 만한 AI 자료</span>
              </div>
              <div style={styles.previewRow}>
                <span style={styles.previewDot} />
                <span>이 자료가 나에게 온 이유</span>
              </div>
              <div style={styles.previewRow}>
                <span style={styles.previewDot} />
                <span>10분·30분·2시간 단위 실행 제안</span>
              </div>
              <div style={styles.previewRow}>
                <span style={styles.previewDot} />
                <span>좋음 / 더 깊게 / 별로 피드백 반영</span>
              </div>
            </div>

            <p style={styles.previewNote}>
              목표는 “많이 아는 것”이 아니라, 압도되지 않고 하나라도 해보는
              것입니다.
            </p>
          </aside>
        </section>

        <section
          style={{ ...styles.card, ...(isMobile ? styles.mobileCard : {}) }}
          id="subscribe-result"
        >
          {isSuccess ? (
            <SuccessOnboarding
              email={submittedEmail}
              summary={selectedSummary}
              difficulty={difficulty}
              onReset={handleResetForm}
              isMobile={isMobile}
            />
          ) : (
            <>
              <div
                style={{
                  ...styles.cardHeader,
                  ...(isMobile ? styles.mobileCardHeader : {}),
                }}
              >
                <div>
                  <p style={styles.cardKicker}>무료 진단 구독</p>
                  <h2
                    style={{
                      ...styles.cardTitle,
                      ...(isMobile ? styles.mobileCardTitle : {}),
                    }}
                  >
                    내 AI-FU 브리핑 설정하기
                  </h2>
                </div>
                <p style={styles.cardSubtext}>
                  1분이면 충분합니다. 선택값은 이후 발송되는 자료 추천과 실행
                  제안에 사용됩니다.
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div
                  style={{
                    ...styles.formBlock,
                    ...(isMobile ? styles.mobileFormBlock : {}),
                  }}
                >
                  <label style={styles.label}>
                    이메일
                    <input
                      style={styles.input}
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
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

                {loadingCategories && (
                  <p style={styles.loadingText}>
                    진단 항목을 불러오는 중입니다. 불러오기에 실패하면 기본
                    항목으로 진행됩니다.
                  </p>
                )}

                <div style={styles.questionStack}>
                  {bundles.map((bundle) => (
                    <QuestionBlock
                      key={bundle.group.group_key}
                      bundle={bundle}
                      selectedValue={selections[bundle.group.group_key]}
                      onSelect={handleSelect}
                      isMobile={isMobile}
                    />
                  ))}
                </div>

                <section
                  style={{
                    ...styles.summaryBox,
                    ...(isMobile ? styles.mobileSummaryBox : {}),
                  }}
                >
                  <div>
                    <p style={styles.summaryKicker}>현재 선택 요약</p>
                    <p style={styles.summaryText}>
                      <strong>{selectedSummary.aiEmotion}</strong> 상태에서{" "}
                      <strong>{selectedSummary.aiIntent}</strong>에 관심이 있고,{" "}
                      <strong>{selectedSummary.blocker}</strong> 때문에 막혀
                      있으며, 이번 주에는{" "}
                      <strong>{selectedSummary.actionTime}</strong> 정도 실행할 수
                      있습니다.
                    </p>
                  </div>
                </section>

                <button
                  type="submit"
                  style={{
                    ...styles.submitButton,
                    ...(isMobile ? styles.mobileSubmitButton : {}),
                    opacity: submitting ? 0.65 : 1,
                  }}
                  disabled={submitting}
                >
                  {submitting ? "저장 중..." : "내 AI-FU 브리핑 신청하기"}
                </button>

                {message && (
                  <div
                    style={{
                      ...styles.messageBox,
                      background: "#fef2f2",
                      borderColor: "#fecaca",
                      color: "#b91c1c",
                    }}
                  >
                    {message}
                  </div>
                )}

                <p style={styles.footerNote}>
                  같은 이메일로 다시 신청하면 기존 정보가 업데이트됩니다.
                </p>
              </form>
            </>
          )}
        </section>
      </section>
    </main>
  );
}

function SuccessOnboarding({
  email,
  summary,
  difficulty,
  onReset,
  isMobile,
}: {
  email: string;
  summary: SelectedSummary;
  difficulty: string;
  onReset: () => void;
  isMobile: boolean;
}) {
  const difficultyLabel =
    difficulty === "expert" ? "심화" : difficulty === "normal" ? "중간" : "입문";

  return (
    <section style={styles.successWrap}>
      <div
        style={{
          ...styles.successHero,
          ...(isMobile ? styles.mobileSuccessHero : {}),
        }}
      >
        <p style={styles.successBadge}>신청 완료</p>
        <h2
          style={{
            ...styles.successTitle,
            ...(isMobile ? styles.mobileSuccessTitle : {}),
          }}
        >
          이제 AI-FU가 당신에게 맞춰집니다.
        </h2>
        <p
          style={{
            ...styles.successDescription,
            ...(isMobile ? styles.mobileSuccessDescription : {}),
          }}
        >
          입력한 상태를 기준으로 앞으로 발송되는 AI 자료, 해석, 실행 제안이
          맞춤화됩니다. 첫 브리프를 받은 뒤 피드백을 누를수록 추천 정확도가 더
          좋아집니다.
        </p>

        <div style={styles.successEmailBox}>
          <span style={styles.successEmailLabel}>발송 이메일</span>
          <strong style={styles.successEmail}>{email}</strong>
        </div>
      </div>

      <div
        style={{
          ...styles.resultGrid,
          ...(isMobile ? styles.mobileResultGrid : {}),
        }}
      >
        <div style={styles.resultCard}>
          <span style={styles.resultLabel}>AI에 대한 현재 감정</span>
          <strong style={styles.resultValue}>{summary.aiEmotion}</strong>
        </div>
        <div style={styles.resultCard}>
          <span style={styles.resultLabel}>AI로 하고 싶은 것</span>
          <strong style={styles.resultValue}>{summary.aiIntent}</strong>
        </div>
        <div style={styles.resultCard}>
          <span style={styles.resultLabel}>지금 막히는 지점</span>
          <strong style={styles.resultValue}>{summary.blocker}</strong>
        </div>
        <div style={styles.resultCard}>
          <span style={styles.resultLabel}>이번 주 가능한 행동 시간</span>
          <strong style={styles.resultValue}>{summary.actionTime}</strong>
        </div>
        <div style={styles.resultCard}>
          <span style={styles.resultLabel}>선호 난이도</span>
          <strong style={styles.resultValue}>{difficultyLabel}</strong>
        </div>
      </div>

      <section
        style={{
          ...styles.nextStepBox,
          ...(isMobile ? styles.mobileNextStepBox : {}),
        }}
      >
        <div style={styles.nextStepHeader}>
          <p style={styles.nextStepKicker}>다음에 하면 좋은 것</p>
          <h3
            style={{
              ...styles.nextStepTitle,
              ...(isMobile ? styles.mobileNextStepTitle : {}),
            }}
          >
            첫 브리프를 받기 전 준비
          </h3>
        </div>

        <div style={styles.nextStepList}>
          <NextStepItem number="1">
            <strong style={styles.nextStepItemTitle}>
              메일함에서 AI-FU를 확인하세요
            </strong>
            <p style={styles.nextStepItemText}>
              첫 메일이 스팸함이나 프로모션함으로 들어갈 수 있습니다. 메일이
              도착하면 한 번 열어주세요.
            </p>
          </NextStepItem>

          <NextStepItem number="2">
            <strong style={styles.nextStepItemTitle}>
              자료를 전부 읽으려고 하지 마세요
            </strong>
            <p style={styles.nextStepItemText}>
              AI-FU의 목표는 정보 과식이 아니라 선택입니다. 브리프에서
              “왜 이 자료가 왔는지”와 “이번 주 행동”만 먼저 보면 됩니다.
            </p>
          </NextStepItem>

          <NextStepItem number="3">
            <strong style={styles.nextStepItemTitle}>
              피드백 버튼을 눌러주세요
            </strong>
            <p style={styles.nextStepItemText}>
              좋음, 더 깊게, 별로, 실행해봄, 실행안해봄 피드백이 쌓이면 다음
              브리프가 더 개인화됩니다.
            </p>
          </NextStepItem>
        </div>
      </section>

      <section style={styles.briefExampleBox}>
        <p style={styles.briefExampleKicker}>앞으로 이런 식으로 받게 됩니다</p>
        <div style={styles.briefExample}>
          <strong style={styles.briefExampleTitle}>
            “정보가 너무 많아 피곤한 사람을 위한 이번 주 AI 브리프”
          </strong>
          <p style={styles.briefExampleText}>
            오늘의 자료 1개 → 나에게 온 이유 → 핵심 요약 → 이번 주{" "}
            {summary.actionTime} 안에 해볼 행동 1개
          </p>
        </div>
      </section>

      <div style={styles.successActions}>
        <button type="button" style={styles.secondaryButton} onClick={onReset}>
          다른 이메일로 다시 신청하기
        </button>
      </div>
    </section>
  );
}

function NextStepItem({
  number,
  children,
}: {
  number: string;
  children: ReactNode;
}) {
  return (
    <div style={styles.nextStepItem}>
      <div style={styles.nextStepNumber}>{number}</div>
      <div>{children}</div>
    </div>
  );
}

function QuestionBlock({
  bundle,
  selectedValue,
  onSelect,
  isMobile,
}: {
  bundle: CategoryBundle;
  selectedValue: string;
  onSelect: (groupKey: CategoryGroupKey, optionValue: string) => void;
  isMobile: boolean;
}) {
  const groupKey = bundle.group.group_key;

  return (
    <section
      style={{
        ...styles.questionBlock,
        ...(isMobile ? styles.mobileQuestionBlock : {}),
      }}
    >
      <div
        style={{
          ...styles.questionHeader,
          ...(isMobile ? styles.mobileQuestionHeader : {}),
        }}
      >
        <div
          style={{
            ...styles.stepBadge,
            ...(isMobile ? styles.mobileStepBadge : {}),
          }}
        >
          {GROUP_STEP_LABELS[groupKey]}
        </div>

        <div>
          <h3
            style={{
              ...styles.questionTitle,
              ...(isMobile ? styles.mobileQuestionTitle : {}),
            }}
          >
            {bundle.group.label}
          </h3>
          {bundle.group.description && (
            <p style={styles.questionDescription}>{bundle.group.description}</p>
          )}
          <p style={styles.questionHelp}>{GROUP_HELP_TEXTS[groupKey]}</p>
        </div>
      </div>

      <div
        style={{
          ...styles.optionGrid,
          ...(isMobile ? styles.mobileOptionGrid : {}),
        }}
      >
        {bundle.options.map((option) => {
          const selected = selectedValue === option.option_value;

          return (
            <button
              key={`${option.group_key}-${option.option_value}`}
              type="button"
              style={{
                ...styles.optionButton,
                ...(isMobile ? styles.mobileOptionButton : {}),
                ...(selected ? styles.optionButtonSelected : {}),
              }}
              onClick={() => onSelect(option.group_key, option.option_value)}
            >
              <span style={styles.optionTopLine}>
                <span style={styles.optionLabel}>{option.label}</span>
                {selected && <span style={styles.selectedPill}>선택됨</span>}
              </span>

              {option.description && (
                <span style={styles.optionDescription}>
                  {option.description}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(59,130,246,0.28), transparent 32%), linear-gradient(135deg, #020617 0%, #0f172a 45%, #111827 100%)",
    padding: "48px 18px",
    color: "#ffffff",
    overflowX: "hidden",
  },
  mobilePage: {
    padding: "26px 14px",
  },
  shell: {
    width: "100%",
    maxWidth: 1120,
    margin: "0 auto",
  },
  mobileShell: {
    maxWidth: "100%",
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.25fr) minmax(300px, 0.75fr)",
    gap: 24,
    alignItems: "stretch",
    marginBottom: 26,
  },
  mobileHero: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
    marginBottom: 18,
  },
  heroText: {
    padding: "18px 0",
    minWidth: 0,
  },
  mobileHeroText: {
    padding: "4px 0 0",
    width: "100%",
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
  mobileBadge: {
    marginBottom: 14,
    fontSize: 12,
    padding: "7px 11px",
  },
  title: {
    margin: 0,
    fontSize: "clamp(36px, 5vw, 62px)",
    lineHeight: 1.08,
    letterSpacing: "-0.075em",
    wordBreak: "keep-all",
  },
  mobileTitle: {
    fontSize: 38,
    lineHeight: 1.14,
    letterSpacing: "-0.055em",
    maxWidth: "100%",
    wordBreak: "keep-all",
    overflowWrap: "normal",
  },
  description: {
    maxWidth: 780,
    margin: "22px 0 0",
    color: "#dbeafe",
    fontSize: 18,
    lineHeight: 1.78,
    wordBreak: "keep-all",
  },
  mobileDescription: {
    marginTop: 16,
    fontSize: 15,
    lineHeight: 1.72,
    maxWidth: "100%",
    wordBreak: "keep-all",
    overflowWrap: "normal",
  },
  promiseGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 12,
    marginTop: 28,
    maxWidth: 680,
  },
  mobilePromiseGrid: {
    gridTemplateColumns: "1fr",
    gap: 10,
    marginTop: 18,
    maxWidth: "100%",
  },
  promiseItem: {
    padding: 16,
    borderRadius: 18,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.12)",
    minWidth: 0,
  },
  mobilePromiseItem: {
    padding: 14,
  },
  promiseTitle: {
    display: "block",
    marginBottom: 6,
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 950,
  },
  promiseText: {
    display: "block",
    color: "#cbd5e1",
    fontSize: 13,
    lineHeight: 1.55,
    wordBreak: "keep-all",
  },
  previewPanel: {
    alignSelf: "end",
    padding: 24,
    borderRadius: 28,
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.16)",
    boxShadow: "0 22px 60px rgba(0,0,0,0.22)",
    backdropFilter: "blur(14px)",
    minWidth: 0,
  },
  mobilePreviewPanel: {
    alignSelf: "stretch",
    padding: 18,
    borderRadius: 22,
    width: "100%",
    boxSizing: "border-box",
  },
  previewEyebrow: {
    margin: "0 0 8px",
    color: "#93c5fd",
    fontSize: 13,
    fontWeight: 900,
  },
  previewTitle: {
    margin: 0,
    color: "#ffffff",
    fontSize: 24,
    lineHeight: 1.25,
    letterSpacing: "-0.04em",
    wordBreak: "keep-all",
  },
  previewList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginTop: 20,
  },
  previewRow: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    color: "#e5e7eb",
    fontSize: 14,
    lineHeight: 1.6,
    wordBreak: "keep-all",
  },
  previewDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    background: "#60a5fa",
    marginTop: 7,
    flex: "0 0 auto",
  },
  previewNote: {
    margin: "20px 0 0",
    paddingTop: 18,
    borderTop: "1px solid rgba(255,255,255,0.13)",
    color: "#cbd5e1",
    fontSize: 13,
    lineHeight: 1.65,
    wordBreak: "keep-all",
  },
  card: {
    padding: 28,
    borderRadius: 30,
    background: "#ffffff",
    color: "#111827",
    boxShadow: "0 24px 70px rgba(0,0,0,0.34)",
    width: "100%",
    boxSizing: "border-box",
  },
  mobileCard: {
    padding: 16,
    borderRadius: 22,
  },
  cardHeader: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(260px, 0.8fr)",
    gap: 18,
    alignItems: "end",
    marginBottom: 24,
  },
  mobileCardHeader: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    gap: 10,
    marginBottom: 18,
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
    wordBreak: "keep-all",
  },
  mobileCardTitle: {
    fontSize: 24,
    lineHeight: 1.3,
  },
  cardSubtext: {
    margin: 0,
    color: "#6b7280",
    fontSize: 14,
    lineHeight: 1.65,
    wordBreak: "keep-all",
  },
  formBlock: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
    marginBottom: 24,
  },
  mobileFormBlock: {
    gridTemplateColumns: "1fr",
    gap: 12,
    marginBottom: 18,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 9,
    fontSize: 14,
    fontWeight: 900,
    color: "#111827",
    minWidth: 0,
  },
  input: {
    width: "100%",
    height: 52,
    borderRadius: 15,
    border: "1px solid #d1d5db",
    padding: "0 14px",
    fontSize: 15,
    color: "#111827",
    background: "#ffffff",
    outline: "none",
    boxSizing: "border-box",
  },
  loadingText: {
    margin: "4px 0 20px",
    padding: 14,
    borderRadius: 14,
    background: "#f8fafc",
    color: "#64748b",
    fontSize: 14,
    lineHeight: 1.6,
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
    minWidth: 0,
  },
  mobileQuestionBlock: {
    padding: 14,
    borderRadius: 18,
  },
  questionHeader: {
    display: "flex",
    gap: 14,
    alignItems: "flex-start",
    marginBottom: 15,
  },
  mobileQuestionHeader: {
    gap: 10,
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
  mobileStepBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    fontSize: 13,
  },
  questionTitle: {
    margin: 0,
    fontSize: 21,
    letterSpacing: "-0.04em",
    color: "#111827",
    wordBreak: "keep-all",
  },
  mobileQuestionTitle: {
    fontSize: 19,
    lineHeight: 1.35,
  },
  questionDescription: {
    margin: "7px 0 0",
    color: "#4b5563",
    fontSize: 14,
    lineHeight: 1.6,
    wordBreak: "keep-all",
  },
  questionHelp: {
    margin: "7px 0 0",
    color: "#2563eb",
    fontSize: 13,
    lineHeight: 1.55,
    fontWeight: 800,
    wordBreak: "keep-all",
  },
  optionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 10,
  },
  mobileOptionGrid: {
    gridTemplateColumns: "1fr",
    gap: 9,
  },
  optionButton: {
    width: "100%",
    minHeight: 92,
    textAlign: "left",
    border: "1px solid #e5e7eb",
    borderRadius: 17,
    background: "#ffffff",
    padding: 14,
    cursor: "pointer",
    color: "#111827",
    transition: "border 120ms ease, box-shadow 120ms ease, background 120ms ease",
    boxSizing: "border-box",
  },
  mobileOptionButton: {
    minHeight: "auto",
    padding: 13,
    borderRadius: 15,
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
    wordBreak: "keep-all",
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
  mobileSummaryBox: {
    marginTop: 18,
    padding: 15,
    borderRadius: 17,
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
  mobileSubmitButton: {
    height: 56,
    borderRadius: 17,
    fontSize: 15,
  },
  messageBox: {
    marginTop: 16,
    padding: 15,
    borderRadius: 15,
    border: "1px solid",
    fontSize: 14,
    lineHeight: 1.6,
    fontWeight: 800,
    wordBreak: "keep-all",
  },
  footerNote: {
    margin: "14px 0 0",
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 1.6,
    textAlign: "center",
    wordBreak: "keep-all",
  },
  successWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 22,
  },
  successHero: {
    padding: 26,
    borderRadius: 26,
    background:
      "radial-gradient(circle at top right, rgba(37,99,235,0.16), transparent 34%), #f8fafc",
    border: "1px solid #e2e8f0",
  },
  mobileSuccessHero: {
    padding: 18,
    borderRadius: 20,
  },
  successBadge: {
    display: "inline-block",
    margin: "0 0 12px",
    padding: "7px 12px",
    borderRadius: 999,
    background: "#dcfce7",
    color: "#15803d",
    fontSize: 13,
    fontWeight: 950,
  },
  successTitle: {
    margin: 0,
    color: "#111827",
    fontSize: 32,
    lineHeight: 1.22,
    letterSpacing: "-0.06em",
    wordBreak: "keep-all",
  },
  mobileSuccessTitle: {
    fontSize: 25,
    lineHeight: 1.3,
  },
  successDescription: {
    maxWidth: 820,
    margin: "14px 0 0",
    color: "#4b5563",
    fontSize: 16,
    lineHeight: 1.75,
    wordBreak: "keep-all",
  },
  mobileSuccessDescription: {
    fontSize: 14,
    lineHeight: 1.7,
  },
  successEmailBox: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
    marginTop: 20,
    padding: 14,
    borderRadius: 16,
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    minWidth: 0,
  },
  successEmailLabel: {
    color: "#6b7280",
    fontSize: 13,
    fontWeight: 900,
  },
  successEmail: {
    color: "#111827",
    fontSize: 15,
    fontWeight: 950,
    wordBreak: "break-all",
  },
  resultGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
  },
  mobileResultGrid: {
    gridTemplateColumns: "1fr",
  },
  resultCard: {
    padding: 16,
    borderRadius: 18,
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    boxShadow: "0 8px 22px rgba(15,23,42,0.05)",
  },
  resultLabel: {
    display: "block",
    marginBottom: 8,
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 900,
    lineHeight: 1.4,
  },
  resultValue: {
    display: "block",
    color: "#111827",
    fontSize: 16,
    fontWeight: 950,
    lineHeight: 1.45,
    wordBreak: "keep-all",
  },
  nextStepBox: {
    padding: 22,
    borderRadius: 24,
    background: "#111827",
    color: "#ffffff",
  },
  mobileNextStepBox: {
    padding: 16,
    borderRadius: 20,
  },
  nextStepHeader: {
    marginBottom: 18,
  },
  nextStepKicker: {
    margin: "0 0 7px",
    color: "#93c5fd",
    fontSize: 13,
    fontWeight: 950,
  },
  nextStepTitle: {
    margin: 0,
    fontSize: 24,
    lineHeight: 1.3,
    letterSpacing: "-0.04em",
  },
  mobileNextStepTitle: {
    fontSize: 21,
  },
  nextStepList: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  nextStepItem: {
    display: "flex",
    gap: 13,
    padding: 16,
    borderRadius: 18,
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  nextStepNumber: {
    width: 30,
    height: 30,
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#ffffff",
    color: "#111827",
    fontSize: 14,
    fontWeight: 950,
    flex: "0 0 auto",
  },
  nextStepItemTitle: {
    display: "block",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 950,
    lineHeight: 1.45,
    wordBreak: "keep-all",
  },
  nextStepItemText: {
    margin: "5px 0 0",
    color: "#cbd5e1",
    fontSize: 14,
    lineHeight: 1.65,
    wordBreak: "keep-all",
  },
  briefExampleBox: {
    padding: 20,
    borderRadius: 22,
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
  },
  briefExampleKicker: {
    margin: "0 0 12px",
    color: "#2563eb",
    fontSize: 13,
    fontWeight: 950,
  },
  briefExample: {
    padding: 16,
    borderRadius: 18,
    background: "#ffffff",
    border: "1px solid #dbeafe",
  },
  briefExampleTitle: {
    display: "block",
    color: "#111827",
    fontSize: 17,
    fontWeight: 950,
    lineHeight: 1.5,
    wordBreak: "keep-all",
  },
  briefExampleText: {
    margin: "9px 0 0",
    color: "#4b5563",
    fontSize: 14,
    lineHeight: 1.7,
    wordBreak: "keep-all",
  },
  successActions: {
    display: "flex",
    justifyContent: "center",
  },
  secondaryButton: {
    minHeight: 48,
    border: "1px solid #d1d5db",
    borderRadius: 15,
    background: "#ffffff",
    color: "#111827",
    padding: "0 18px",
    fontSize: 14,
    fontWeight: 950,
    cursor: "pointer",
  },
};