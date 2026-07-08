"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import { createClient } from "@supabase/supabase-js";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const notoSerifKr = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["500", "600", "700", "900"],
});

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

type ApiResult = {
  ok?: boolean;
  message?: string;
  code?: string;
  feedback_count?: number;
  required_feedback_count?: number;
  rawText?: string;
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
  blocker: "이 막힘을 기준으로 자료와 실행 단계를 줄입니다.",
  action_time: "선택한 시간 안에 끝낼 수 있는 행동 제안을 함께 보냅니다.",
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
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

async function readJsonResponse(response: Response): Promise<ApiResult> {
  const text = await response.text();

  if (!text) {
    return {
      ok: false,
      message: `빈 응답을 받았습니다. status=${response.status}`,
    };
  }

  try {
    return JSON.parse(text) as ApiResult;
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

    const normalizedEmail = normalizeEmail(email);

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
          difficulty: difficulty || "easy",
          ai_emotion: selections.ai_emotion,
          ai_intent: selections.ai_intent,
          blocker: selections.blocker,
          action_time: selections.action_time,
        }),
      });

      const result = await readJsonResponse(response);

      if (!response.ok || !result.ok) {
        setMessage(result.message || "브리핑 설정 저장 중 오류가 발생했습니다.");
        return;
      }

      setSubmittedEmail(normalizedEmail);
      setIsSuccess(true);
      setMessage(
        result.message ||
          "신청이 완료되었습니다. 같은 이메일로 다시 신청한 경우 기존 설정이 업데이트됩니다."
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
    <main
      className={notoSansKr.className}
      style={{ ...styles.page, ...(isMobile ? styles.mobilePage : {}) }}
    >
      <div style={styles.monetLayer} />
      <div style={styles.darkLayer} />

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
              Personal AI Briefing
            </p>

            <h1
              style={{
                ...styles.title,
                ...(isMobile ? styles.mobileTitle : {}),
              }}
            >
              알고는 있지만,
              <br />
              아직 만들지는
              <br />
              못했다.
            </h1>

            <p
              style={{
                ...styles.description,
                ...(isMobile ? styles.mobileDescription : {}),
              }}
            >
              AI 시대가 온다는 말은 충분히 들었습니다. 이제 필요한 것은 더 많은
              정보가 아니라, 당신이 직접 해보는 첫 번째 행동입니다.
            </p>

            <p
              style={{
                ...styles.descriptionSmall,
                ...(isMobile ? styles.mobileDescriptionSmall : {}),
              }}
            >
              당신의 감정, 목적, 막히는 지점, 가능한 시간을 바탕으로 이번 주
              실행할 수 있는 개인 맞춤 AI 브리핑을 보냅니다.
            </p>

            <div
              style={{
                ...styles.promiseGrid,
                ...(isMobile ? styles.mobilePromiseGrid : {}),
              }}
            >
              <PromiseItem number="01" title="상태">
                AI에 대한 지금의 감정
              </PromiseItem>
              <PromiseItem number="02" title="방향">
                당신에게 필요한 다음 주제
              </PromiseItem>
              <PromiseItem number="03" title="실행">
                이번 주 해볼 수 있는 한 가지
              </PromiseItem>
              <PromiseItem number="04" title="반응">
                피드백으로 정교해지는 추천
              </PromiseItem>
            </div>
          </div>

          <aside
            style={{
              ...styles.previewPanel,
              ...(isMobile ? styles.mobilePreviewPanel : {}),
            }}
          >
            <p style={styles.previewEyebrow}>받게 되는 것</p>
            <h2 style={styles.previewTitle}>개인 맞춤 AI 브리핑</h2>

            <div style={styles.previewList}>
              <PreviewRow>지금 볼 만한 AI 자료</PreviewRow>
              <PreviewRow>이 자료가 필요한 이유</PreviewRow>
              <PreviewRow>10분·30분·2시간 실행 제안</PreviewRow>
              <PreviewRow>좋음 / 더 깊게 / 별로 피드백 반영</PreviewRow>
              <PreviewRow>반응이 쌓일수록 더 정확해지는 추천</PreviewRow>
            </div>

            <p style={styles.previewNote}>
              목표는 AI를 많이 아는 것이 아닙니다. AI와 함께 무언가를
              만들어내는 것입니다.
            </p>
          </aside>
        </section>

        <section
          style={{
            ...styles.statementBox,
            ...(isMobile ? styles.mobileStatementBox : {}),
          }}
        >
          <p style={styles.statementText}>
            정보는 이미 많습니다. 문제는 시작점입니다.
            <br />
            Personal AI Briefing은 막연한 관심을 이번 주의 작은 실행으로
            바꿉니다.
          </p>
        </section>

        <BriefingPreviewSection isMobile={isMobile} />

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
                  <p style={styles.cardKicker}>무료 브리핑 설정</p>
                  <h2
                    style={{
                      ...styles.cardTitle,
                      ...(isMobile ? styles.mobileCardTitle : {}),
                    }}
                  >
                    내 AI 브리핑 시작하기
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
                  {submitting ? "저장 중..." : "내 AI 브리핑 시작하기"}
                </button>

                {message && (
                  <div
                    style={{
                      ...styles.messageBox,
                      background: "#fff1f2",
                      borderColor: "#fecdd3",
                      color: "#be123c",
                    }}
                  >
                    {message}
                  </div>
                )}

                <p style={styles.footerNote}>
                  같은 이메일로 다시 신청하면 기존 정보가 업데이트됩니다.
                </p>

                <div style={styles.privacyNotice}>
                  입력하신 이메일과 선택 정보는 맞춤 AI 브리핑 발송 및 품질 개선
                  목적으로만 사용됩니다. 수집한 정보는 제3자에게 판매하거나
                  제공하지 않으며, 이메일 하단의 구독 취소 링크를 통해 언제든
                  구독을 중단할 수 있습니다.
                </div>
              </form>
            </>
          )}
        </section>

        <BuildSection isMobile={isMobile} />
      </section>
    </main>
  );
}

function PromiseItem({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div style={styles.promiseItem}>
      <span style={styles.promiseNumber}>{number}</span>
      <strong style={styles.promiseTitle}>{title}</strong>
      <span style={styles.promiseText}>{children}</span>
    </div>
  );
}

function PreviewRow({ children }: { children: ReactNode }) {
  return (
    <div style={styles.previewRow}>
      <span style={styles.previewDot} />
      <span>{children}</span>
    </div>
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
          이제 브리핑이 당신에게 맞춰집니다.
        </h2>
        <p
          style={{
            ...styles.successDescription,
            ...(isMobile ? styles.mobileSuccessDescription : {}),
          }}
        >
          입력한 상태를 기준으로 앞으로 발송되는 AI 자료, 이유 설명, 실행 제안이
          맞춤화됩니다. 첫 브리핑을 받은 뒤 피드백을 누를수록 추천 정확도가 더
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
        <ResultCard label="AI에 대한 현재 감정" value={summary.aiEmotion} />
        <ResultCard label="AI로 하고 싶은 것" value={summary.aiIntent} />
        <ResultCard label="지금 막히는 지점" value={summary.blocker} />
        <ResultCard label="이번 주 가능한 행동 시간" value={summary.actionTime} />
        <ResultCard label="선호 난이도" value={difficultyLabel} />
      </div>

      <section
        style={{
          ...styles.nextStepBox,
          ...(isMobile ? styles.mobileNextStepBox : {}),
        }}
      >
        <p style={styles.nextStepKicker}>다음에 하면 좋은 것</p>
        <h3
          style={{
            ...styles.nextStepTitle,
            ...(isMobile ? styles.mobileNextStepTitle : {}),
          }}
        >
          첫 브리핑을 받기 전 준비
        </h3>

        <div style={styles.nextStepList}>
          <NextStepItem number="1" title="메일함에서 브리핑을 확인하세요">
            첫 메일이 스팸함이나 프로모션함으로 들어갈 수 있습니다. 메일이
            도착하면 한 번 열어주세요.
          </NextStepItem>

          <NextStepItem number="2" title="자료를 전부 읽으려고 하지 마세요">
            목표는 정보 과식이 아니라 선택입니다. “왜 이 자료가 왔는지”와
            “이번 주 실행”만 먼저 보면 됩니다.
          </NextStepItem>

          <NextStepItem number="3" title="피드백 버튼을 눌러주세요">
            좋음, 더 깊게, 별로, 실행해봄, 실행안해봄 피드백이 쌓이면 다음
            브리핑이 더 개인화됩니다.
          </NextStepItem>
        </div>
      </section>

      <section style={styles.briefingExampleBox}>
        <p style={styles.briefingExampleKicker}>
          앞으로 이런 식으로 받게 됩니다
        </p>
        <div style={styles.briefingExample}>
          <strong style={styles.briefingExampleTitle}>
            “정보가 너무 많아 피곤한 사람을 위한 이번 주 AI 브리핑”
          </strong>
          <p style={styles.briefingExampleText}>
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

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.resultCard}>
      <span style={styles.resultLabel}>{label}</span>
      <strong style={styles.resultValue}>{value}</strong>
    </div>
  );
}

function NextStepItem({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div style={styles.nextStepItem}>
      <div style={styles.nextStepNumber}>{number}</div>
      <div>
        <strong style={styles.nextStepItemTitle}>{title}</strong>
        <p style={styles.nextStepItemText}>{children}</p>
      </div>
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

function BriefingPreviewSection({ isMobile }: { isMobile: boolean }) {
  return (
    <section
      style={{
        ...styles.realPreviewSection,
        ...(isMobile ? styles.mobileRealPreviewSection : {}),
      }}
    >
      <div
        style={{
          ...styles.realPreviewHeader,
          ...(isMobile ? styles.mobileRealPreviewHeader : {}),
        }}
      >
        <div>
          <p style={styles.realPreviewKicker}>브리핑 미리보기</p>
          <h2
            style={{
              ...styles.realPreviewTitle,
              ...(isMobile ? styles.mobileRealPreviewTitle : {}),
            }}
          >
            실제로 이런 브리핑을
            <br />
            받게 됩니다.
          </h2>
        </div>

        <p style={styles.realPreviewDescription}>
          단순히 AI 뉴스를 모아 보내는 것이 아니라, 당신의 상태·관심사·난이도·
          피드백에 따라 이번 주 하나의 자료와 실행 과제를 추천합니다.
        </p>
      </div>

      <div
        style={{
          ...styles.realPreviewGrid,
          ...(isMobile ? styles.mobileRealPreviewGrid : {}),
        }}
      >
        <article style={styles.briefingCard}>
          <div style={styles.briefingCardTop}>
            <span style={styles.briefingTagPrimary}>추천 1</span>
            <span style={styles.briefingTag}>general_ai</span>
            <span style={styles.briefingTag}>중간</span>
            <span style={styles.briefingTag}>neutral</span>
          </div>

          <h3
            style={{
              ...styles.briefingCardTitle,
              ...(isMobile ? styles.mobileBriefingCardTitle : {}),
            }}
          >
            AI 에이전트가 웹을 대신 돌아다니는 시대를 보고 싶은 사람을 위한
            Tabstack by Mozilla
          </h3>

          <section style={styles.reasonBox}>
            <p style={styles.reasonTitle}>이 자료가 나에게 온 이유</p>
            <ul style={styles.reasonList}>
              <li style={styles.reasonItem}>
                현재 감정이 ‘기대됨’인 구독자에게 맞는 자료
              </li>
              <li style={styles.reasonItem}>
                관심 방향이 ‘사업 기회나 돈 벌 기회’인 구독자에게 맞는 자료
              </li>
              <li style={styles.reasonItem}>
                ‘기술적인 내용이 어려움’을 줄이는 자료
              </li>
              <li style={styles.reasonItem}>이전에 실행해본 자료와 유사한 방향</li>
            </ul>
          </section>

          <section style={styles.briefingTextBlock}>
            <p style={styles.briefingSmallTitle}>먼저 이것만 이해하세요</p>
            <p style={styles.briefingParagraph}>
              앞으로 브라우저는 단순히 웹페이지를 보여주는 도구를 넘어,
              사용자를 대신해 정보를 찾고 정리하는 방향으로 바뀌고 있습니다.
              중요한 것은 모든 기술을 이해하는 것이 아니라, 내 일에서 어떤
              흐름을 맡길 수 있는지 상상해보는 것입니다.
            </p>
          </section>

          <section style={styles.balanceBox}>
            <p style={styles.balanceTitle}>균형 관점</p>
            <p style={styles.balanceText}>
              비개발자가 바로 쓰기에는 아직 어렵습니다. 하지만 “앞으로 AI
              서비스가 단순 답변을 넘어 실제 웹 작업을 대신한다”는 흐름을
              이해하기에는 좋은 자료입니다.
            </p>
          </section>

          <section style={styles.actionBox}>
            <p style={styles.actionTitle}>오늘 딱 하나 할 일</p>
            <p style={styles.actionText}>
              Tabstack 소개 페이지를 읽고 “AI가 웹에서 대신 해주면 좋을 일”을
              3개 적어보세요. 예: 경쟁사 가격 조사, 채용공고 수집, 여행지 후보
              비교. 그중 하나를 골라 이 작업을 사람이 하면 몇 단계가 필요한지만
              적어봅니다.
            </p>
          </section>

          <button type="button" style={styles.previewReadButton}>
            원문 보기
          </button>

          <section style={styles.feedbackPreviewBox}>
            <div style={styles.feedbackPreviewHeader}>
              <p style={styles.feedbackPreviewTitle}>
                이 버튼이 다음 브리핑을 바꿉니다
              </p>
              <p style={styles.feedbackPreviewDescription}>
                하나만 눌러도 다음 자료 선택, 난이도, Action hint 추천 점수에
                반영됩니다.
              </p>
            </div>

            <div
              style={{
                ...styles.feedbackButtonGrid,
                ...(isMobile ? styles.mobileFeedbackButtonGrid : {}),
              }}
            >
              <FeedbackPreviewButton title="좋음">
                비슷한 자료를 더 받을래요
              </FeedbackPreviewButton>
              <FeedbackPreviewButton title="더 깊게">
                이 방향을 더 심화할래요
              </FeedbackPreviewButton>
              <FeedbackPreviewButton title="별로">
                다음 추천에서 낮출게요
              </FeedbackPreviewButton>
              <FeedbackPreviewButton title="실행해봄">
                실행 가능한 방향을 더 줄게요
              </FeedbackPreviewButton>
              <FeedbackPreviewButton title="실행안해봄">
                난이도와 시간을 다시 맞출게요
              </FeedbackPreviewButton>
            </div>
          </section>
        </article>

        <aside style={styles.previewExplanationBox}>
          <p style={styles.previewExplanationKicker}>왜 보여드리나요?</p>
          <h3 style={styles.previewExplanationTitle}>
            메일을 넣기 전, 받을 결과물을 먼저 확인할 수 있어야 합니다.
          </h3>
          <p style={styles.previewExplanationText}>
            Personal AI Briefing은 뉴스 목록이 아니라 “이 자료가 왜 나에게
            왔는지”와 “오늘 하나만 한다면 무엇을 할지”를 함께 보냅니다.
          </p>
          <div style={styles.previewExplanationList}>
            <PreviewCheckItem>자료 1개를 고르는 이유</PreviewCheckItem>
            <PreviewCheckItem>초보자도 이해할 핵심 요약</PreviewCheckItem>
            <PreviewCheckItem>균형 잡힌 관점</PreviewCheckItem>
            <PreviewCheckItem>이번 주 가능한 행동 1개</PreviewCheckItem>
            <PreviewCheckItem>다음 추천을 바꾸는 피드백</PreviewCheckItem>
          </div>
        </aside>
      </div>
    </section>
  );
}

function FeedbackPreviewButton({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div style={styles.feedbackPreviewButton}>
      <strong style={styles.feedbackPreviewButtonTitle}>{title}</strong>
      <span style={styles.feedbackPreviewButtonText}>{children}</span>
    </div>
  );
}

function PreviewCheckItem({ children }: { children: ReactNode }) {
  return (
    <div style={styles.previewCheckItem}>
      <span style={styles.previewCheckMark}>✓</span>
      <span>{children}</span>
    </div>
  );
}

function BuildSection({ isMobile }: { isMobile: boolean }) {
  const [buildEmail, setBuildEmail] = useState("");
  const [buildName, setBuildName] = useState("");
  const [wantToBuild, setWantToBuild] = useState("");
  const [blockedPoint, setBlockedPoint] = useState("");
  const [aiExperience, setAiExperience] = useState("");
  const [helpType, setHelpType] = useState("");

  const [buildSubmitting, setBuildSubmitting] = useState(false);
  const [buildMessage, setBuildMessage] = useState("");
  const [buildSuccess, setBuildSuccess] = useState(false);
  const [feedbackCount, setFeedbackCount] = useState<number | null>(null);
  const [requiredFeedbackCount, setRequiredFeedbackCount] = useState(50);

  async function handleBuildSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setBuildMessage("");
    setBuildSuccess(false);
    setFeedbackCount(null);

    const normalizedEmail = normalizeEmail(buildEmail);

    if (!isValidEmail(normalizedEmail)) {
      setBuildMessage("올바른 이메일을 입력해주세요.");
      return;
    }

    if (!wantToBuild.trim()) {
      setBuildMessage("무엇을 만들고 싶은지 입력해주세요.");
      return;
    }

    if (!blockedPoint.trim()) {
      setBuildMessage("현재 어디서 막혀 있는지 입력해주세요.");
      return;
    }

    setBuildSubmitting(true);

    try {
      const response = await fetch("/api/build-consultation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          name: buildName.trim() || null,
          want_to_build: wantToBuild.trim(),
          blocked_point: blockedPoint.trim(),
          ai_experience: aiExperience.trim() || null,
          help_type: helpType.trim() || null,
        }),
      });

      const result = await readJsonResponse(response);

      if (typeof result.feedback_count === "number") {
        setFeedbackCount(result.feedback_count);
      }

      if (typeof result.required_feedback_count === "number") {
        setRequiredFeedbackCount(result.required_feedback_count);
      }

      if (!response.ok || !result.ok) {
        setBuildMessage(
          result.message || "상담 신청 처리 중 오류가 발생했습니다."
        );
        return;
      }

      setBuildSuccess(true);
      setBuildMessage(
        result.message ||
          "Personal AI Build 상담 신청이 완료되었습니다. 입력한 내용을 확인한 뒤 연락드릴 수 있습니다."
      );

      setBuildName("");
      setWantToBuild("");
      setBlockedPoint("");
      setAiExperience("");
      setHelpType("");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setBuildMessage(`상담 신청 중 오류가 발생했습니다: ${errorMessage}`);
    } finally {
      setBuildSubmitting(false);
    }
  }

  return (
    <section
      style={{
        ...styles.buildSection,
        ...(isMobile ? styles.mobileBuildSection : {}),
      }}
    >
      <div
        style={{
          ...styles.buildHeader,
          ...(isMobile ? styles.mobileBuildHeader : {}),
        }}
      >
        <div>
          <p style={styles.buildKicker}>Personal AI Build</p>
          <h2
            style={{
              ...styles.buildTitle,
              ...(isMobile ? styles.mobileBuildTitle : {}),
            }}
          >
            충분히 반응이 쌓이면,
            <br />
            이제 직접 만들 차례입니다.
          </h2>
        </div>

        <div style={styles.buildLockBox}>
          <span style={styles.buildLockNumber}>50+</span>
          <span style={styles.buildLockText}>
            피드백 50개 이상부터 신청 가능
          </span>
        </div>
      </div>

      <div
        style={{
          ...styles.buildGrid,
          ...(isMobile ? styles.mobileBuildGrid : {}),
        }}
      >
        <div style={styles.buildTextBox}>
          <p style={styles.buildParagraph}>
            Personal AI Build는 AI로 직접 무언가를 만들고 싶은 사람을 위한 1:1
            방향 상담입니다.
          </p>
          <p style={styles.buildParagraph}>
            사이트, 자동화, 글쓰기, 콘텐츠, 작은 서비스, 사업 아이디어까지.
            막연한 생각을 실제 실행 순서로 바꾸는 과정입니다.
          </p>
          <p style={styles.buildMuted}>
            아직은 충분한 피드백이 쌓인 사람에게만 열립니다. 당신이 어떤 자료에
            반응했고, 무엇을 어려워했고, 실제로 무엇을 해봤는지 알아야 더 정확한
            방향을 제안할 수 있기 때문입니다.
          </p>

          <div style={styles.buildConditionBox}>
            <span style={styles.buildConditionLabel}>신청 조건</span>
            <span style={styles.buildConditionText}>
              피드백 {requiredFeedbackCount}개 이상
            </span>
            <p style={styles.buildConditionNote}>
              같은 이메일로 남긴 자료 평가와 실행 여부 피드백을 기준으로
              확인합니다.
              {feedbackCount !== null
                ? ` 현재 확인된 피드백은 ${feedbackCount}개입니다.`
                : ""}
            </p>
          </div>
        </div>

        <form style={styles.buildFormMock} onSubmit={handleBuildSubmit}>
          <p style={styles.buildFormTitle}>상담 신청</p>

          <label style={styles.buildLabel}>
            이메일
            <input
              style={styles.buildInput}
              type="email"
              value={buildEmail}
              onChange={(event) => setBuildEmail(event.target.value)}
              placeholder="briefing@example.com"
              required
            />
          </label>

          <label style={styles.buildLabel}>
            이름
            <input
              style={styles.buildInput}
              type="text"
              value={buildName}
              onChange={(event) => setBuildName(event.target.value)}
              placeholder="선택 입력"
            />
          </label>

          <label style={styles.buildLabel}>
            무엇을 만들고 싶나요?
            <textarea
              style={styles.buildTextarea}
              value={wantToBuild}
              onChange={(event) => setWantToBuild(event.target.value)}
              placeholder="예: 개인 웹사이트, 자동화 도구, 콘텐츠 채널, 작은 서비스, 사업 아이디어"
              required
            />
          </label>

          <label style={styles.buildLabel}>
            현재 어디서 막혀 있나요?
            <textarea
              style={styles.buildTextarea}
              value={blockedPoint}
              onChange={(event) => setBlockedPoint(event.target.value)}
              placeholder="예: 아이디어는 있는데 구현 순서를 모르겠음, 어떤 AI 도구를 써야 할지 모르겠음"
              required
            />
          </label>

          <label style={styles.buildLabel}>
            AI를 어느 정도 활용해봤나요?
            <textarea
              style={styles.buildTextareaSmall}
              value={aiExperience}
              onChange={(event) => setAiExperience(event.target.value)}
              placeholder="예: ChatGPT로 글쓰기만 해봄, 사이트 제작은 처음, 자동화는 안 해봄"
            />
          </label>

          <label style={styles.buildLabel}>
            어떤 도움을 받고 싶나요?
            <textarea
              style={styles.buildTextareaSmall}
              value={helpType}
              onChange={(event) => setHelpType(event.target.value)}
              placeholder="예: 실행 순서 정리, 도구 추천, 첫 화면 설계, 기능 우선순위 정리"
            />
          </label>

          <button
            type="submit"
            style={{
              ...styles.buildSubmitButton,
              opacity: buildSubmitting ? 0.65 : 1,
            }}
            disabled={buildSubmitting}
          >
            {buildSubmitting ? "신청 확인 중..." : "상담 신청하기"}
          </button>

          {buildMessage && (
            <div
              style={{
                ...styles.buildMessageBox,
                ...(buildSuccess
                  ? styles.buildMessageSuccess
                  : styles.buildMessageError),
              }}
            >
              {buildMessage}
            </div>
          )}

          <p style={styles.buildFormNote}>
            피드백이 부족하면 신청은 저장되지 않습니다. 먼저 브리핑에 반응을
            남겨주세요.
          </p>
        </form>
      </div>
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    position: "relative",
    minHeight: "100vh",
    padding: "46px 18px",
    color: "#f4f0e8",
    background: "#050806",
    overflowX: "hidden",
  },
  mobilePage: {
    padding: "24px 12px",
  },
  monetLayer: {
    position: "fixed",
    inset: 0,
    backgroundImage: "url('/monet-bridge.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    opacity: 0.92,
    filter: "blur(0.2px) saturate(1.18) contrast(1.12) brightness(1.08)",
    transform: "scale(1.03)",
    zIndex: 0,
    pointerEvents: "none",
  },
  darkLayer: {
    position: "fixed",
    inset: 0,
    background:
      "linear-gradient(90deg, rgba(3, 7, 6, 0.66) 0%, rgba(5, 12, 10, 0.36) 42%, rgba(3, 7, 6, 0.58) 100%), radial-gradient(circle at 22% 12%, rgba(230, 231, 204, 0.08), transparent 28%)",
    zIndex: 1,
    pointerEvents: "none",
  },
  shell: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: 1180,
    margin: "0 auto",
  },
  mobileShell: {
    maxWidth: "100%",
  },
  hero: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.12fr) minmax(320px, 0.88fr)",
    gap: 28,
    alignItems: "stretch",
    marginBottom: 24,
  },
  mobileHero: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    marginBottom: 16,
  },
  heroText: {
    padding: "12px 0 0",
    minWidth: 0,
  },
  mobileHeroText: {
    padding: "2px 0 0",
    width: "100%",
  },
  badge: {
    display: "inline-block",
    margin: "0 0 24px",
    padding: "8px 0",
    borderTop: "1px solid rgba(244, 240, 232, 0.72)",
    borderBottom: "1px solid rgba(244, 240, 232, 0.72)",
    color: "#f4f0e8",
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: "0.01em",
  },
  mobileBadge: {
    marginBottom: 16,
    fontSize: 12,
  },
  title: {
    margin: 0,
    maxWidth: 820,
    fontFamily: notoSerifKr.style.fontFamily,
    fontSize: "clamp(52px, 7.1vw, 94px)",
    lineHeight: 1.18,
    letterSpacing: "-0.075em",
    wordBreak: "keep-all",
    color: "#fbf4df",
    fontWeight: 600,
    textShadow: "0 22px 56px rgba(0,0,0,0.48)",
  },
  mobileTitle: {
    fontSize: 46,
    lineHeight: 1.2,
    letterSpacing: "-0.065em",
    maxWidth: "100%",
  },
  description: {
    maxWidth: 760,
    margin: "34px 0 0",
    color: "#f4f0e8",
    fontSize: 18,
    lineHeight: 1.95,
    fontWeight: 500,
    wordBreak: "keep-all",
    textShadow: "0 8px 24px rgba(0,0,0,0.4)",
  },
  mobileDescription: {
    marginTop: 20,
    fontSize: 15,
    lineHeight: 1.8,
    maxWidth: "100%",
  },
  descriptionSmall: {
    maxWidth: 760,
    margin: "14px 0 0",
    color: "rgba(244, 240, 232, 0.78)",
    fontSize: 15,
    lineHeight: 1.9,
    fontWeight: 400,
    wordBreak: "keep-all",
  },
  mobileDescriptionSmall: {
    fontSize: 14,
    lineHeight: 1.74,
  },
  promiseGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 0,
    marginTop: 42,
    maxWidth: 850,
    borderTop: "1px solid rgba(230, 231, 204, 0.3)",
    borderLeft: "1px solid rgba(230, 231, 204, 0.3)",
    background: "rgba(5, 15, 12, 0.34)",
    backdropFilter: "blur(4px)",
  },
  mobilePromiseGrid: {
    gridTemplateColumns: "1fr 1fr",
    marginTop: 24,
    maxWidth: "100%",
  },
  promiseItem: {
    padding: 16,
    borderRight: "1px solid rgba(230, 231, 204, 0.3)",
    borderBottom: "1px solid rgba(230, 231, 204, 0.3)",
    minWidth: 0,
  },
  promiseNumber: {
    display: "block",
    marginBottom: 22,
    color: "#dce6b8",
    fontSize: 12,
    fontWeight: 700,
  },
  promiseTitle: {
    display: "block",
    marginBottom: 7,
    color: "#f7f1df",
    fontSize: 17,
    fontWeight: 700,
  },
  promiseText: {
    display: "block",
    color: "rgba(244, 240, 232, 0.78)",
    fontSize: 13,
    lineHeight: 1.62,
    wordBreak: "keep-all",
  },
  previewPanel: {
    alignSelf: "end",
    padding: 28,
    background:
      "linear-gradient(145deg, rgba(14, 28, 23, 0.72), rgba(13, 19, 24, 0.68))",
    border: "1px solid rgba(230, 231, 204, 0.3)",
    boxShadow: "18px 18px 0 rgba(217, 225, 178, 0.08)",
    backdropFilter: "blur(7px)",
    minWidth: 0,
  },
  mobilePreviewPanel: {
    alignSelf: "stretch",
    padding: 18,
    width: "100%",
    boxSizing: "border-box",
    boxShadow: "8px 8px 0 rgba(217, 225, 178, 0.08)",
  },
  previewEyebrow: {
    margin: "0 0 10px",
    color: "#dce6b8",
    fontSize: 13,
    fontWeight: 700,
  },
  previewTitle: {
    margin: 0,
    color: "#fbf4df",
    fontFamily: notoSerifKr.style.fontFamily,
    fontSize: 30,
    lineHeight: 1.42,
    letterSpacing: "-0.055em",
    fontWeight: 600,
    wordBreak: "keep-all",
  },
  previewList: {
    display: "flex",
    flexDirection: "column",
    gap: 13,
    marginTop: 24,
  },
  previewRow: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    color: "rgba(244, 240, 232, 0.88)",
    fontSize: 14,
    lineHeight: 1.68,
    wordBreak: "keep-all",
  },
  previewDot: {
    width: 7,
    height: 7,
    background: "#dce6b8",
    marginTop: 8,
    flex: "0 0 auto",
  },
  previewNote: {
    margin: "24px 0 0",
    paddingTop: 20,
    borderTop: "1px solid rgba(230, 231, 204, 0.22)",
    color: "rgba(244, 240, 232, 0.72)",
    fontSize: 13,
    lineHeight: 1.82,
    wordBreak: "keep-all",
  },
  statementBox: {
    marginBottom: 24,
    padding: "30px 34px",
    borderTop: "1px solid rgba(230, 231, 204, 0.32)",
    borderBottom: "1px solid rgba(230, 231, 204, 0.32)",
    background:
      "linear-gradient(90deg, rgba(3, 8, 7, 0.44), rgba(17, 47, 33, 0.2), rgba(3, 8, 7, 0.38))",
    backdropFilter: "blur(4px)",
  },
  mobileStatementBox: {
    padding: "20px 18px",
  },
  statementText: {
    margin: 0,
    color: "#fbf4df",
    fontFamily: notoSerifKr.style.fontFamily,
    fontSize: 26,
    lineHeight: 1.82,
    letterSpacing: "-0.055em",
    fontWeight: 600,
    wordBreak: "keep-all",
    textShadow: "0 10px 24px rgba(0,0,0,0.38)",
  },
  realPreviewSection: {
    padding: 30,
    marginBottom: 24,
    border: "1px solid rgba(230, 231, 204, 0.3)",
    background:
      "linear-gradient(145deg, rgba(8, 21, 16, 0.72), rgba(5, 10, 12, 0.7))",
    color: "#f7f1df",
    backdropFilter: "blur(7px)",
  },
  mobileRealPreviewSection: {
    padding: 18,
  },
  realPreviewHeader: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(260px, 0.72fr)",
    gap: 22,
    alignItems: "end",
    marginBottom: 24,
  },
  mobileRealPreviewHeader: {
    gridTemplateColumns: "1fr",
    gap: 10,
  },
  realPreviewKicker: {
    margin: "0 0 10px",
    color: "#dce6b8",
    fontSize: 13,
    fontWeight: 900,
  },
  realPreviewTitle: {
    margin: 0,
    color: "#fbf4df",
    fontFamily: notoSerifKr.style.fontFamily,
    fontSize: 46,
    lineHeight: 1.24,
    letterSpacing: "-0.065em",
    fontWeight: 600,
    wordBreak: "keep-all",
  },
  mobileRealPreviewTitle: {
    fontSize: 31,
  },
  realPreviewDescription: {
    margin: 0,
    color: "rgba(247, 241, 223, 0.7)",
    fontSize: 14,
    lineHeight: 1.8,
    wordBreak: "keep-all",
  },
  realPreviewGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 320px",
    gap: 22,
    alignItems: "start",
  },
  mobileRealPreviewGrid: {
    gridTemplateColumns: "1fr",
  },
  briefingCard: {
    padding: 22,
    background: "rgba(247, 241, 223, 0.96)",
    color: "#07100c",
    border: "1px solid rgba(247, 241, 223, 0.72)",
    boxShadow: "0 22px 70px rgba(0,0,0,0.28)",
  },
  briefingCardTop: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  briefingTagPrimary: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 28,
    padding: "0 10px",
    background: "#eef0d2",
    color: "#1f3f2e",
    border: "1px solid rgba(7, 16, 12, 0.12)",
    fontSize: 12,
    fontWeight: 900,
  },
  briefingTag: {
    display: "inline-flex",
    alignItems: "center",
    minHeight: 28,
    padding: "0 10px",
    background: "#f7f1df",
    color: "rgba(7, 16, 12, 0.72)",
    border: "1px solid rgba(7, 16, 12, 0.12)",
    fontSize: 12,
    fontWeight: 700,
  },
  briefingCardTitle: {
    margin: "0 0 18px",
    color: "#07100c",
    fontFamily: notoSerifKr.style.fontFamily,
    fontSize: 28,
    lineHeight: 1.46,
    letterSpacing: "-0.055em",
    fontWeight: 700,
    wordBreak: "keep-all",
  },
  mobileBriefingCardTitle: {
    fontSize: 22,
    lineHeight: 1.48,
  },
  reasonBox: {
    padding: 18,
    marginBottom: 18,
    background: "#fff4e6",
    border: "1px solid rgba(197, 89, 17, 0.25)",
  },
  reasonTitle: {
    margin: "0 0 10px",
    color: "#a0440e",
    fontSize: 14,
    fontWeight: 900,
  },
  reasonList: {
    margin: 0,
    paddingLeft: 18,
    color: "#b45309",
  },
  reasonItem: {
    margin: "0 0 6px",
    fontSize: 13,
    lineHeight: 1.7,
    wordBreak: "keep-all",
  },
  briefingTextBlock: {
    marginBottom: 16,
  },
  briefingSmallTitle: {
    margin: "0 0 8px",
    color: "#07100c",
    fontSize: 14,
    fontWeight: 900,
  },
  briefingParagraph: {
    margin: 0,
    color: "rgba(7, 16, 12, 0.72)",
    fontSize: 14,
    lineHeight: 1.86,
    wordBreak: "keep-all",
  },
  balanceBox: {
    padding: 16,
    marginBottom: 16,
    background: "rgba(7, 16, 12, 0.04)",
    border: "1px solid rgba(7, 16, 12, 0.08)",
  },
  balanceTitle: {
    margin: "0 0 8px",
    color: "#07100c",
    fontSize: 13,
    fontWeight: 900,
  },
  balanceText: {
    margin: 0,
    color: "rgba(7, 16, 12, 0.64)",
    fontSize: 13,
    lineHeight: 1.78,
    wordBreak: "keep-all",
  },
  actionBox: {
    padding: 18,
    marginBottom: 16,
    background: "#e8fff1",
    border: "1px solid rgba(16, 185, 129, 0.28)",
  },
  actionTitle: {
    margin: "0 0 8px",
    color: "#047857",
    fontSize: 14,
    fontWeight: 900,
  },
  actionText: {
    margin: 0,
    color: "#047857",
    fontSize: 14,
    lineHeight: 1.82,
    fontWeight: 600,
    wordBreak: "keep-all",
  },
  previewReadButton: {
    minHeight: 44,
    marginBottom: 16,
    padding: "0 16px",
    border: "none",
    background: "#0b1711",
    color: "#f7f1df",
    fontSize: 14,
    fontWeight: 900,
  },
  feedbackPreviewBox: {
    padding: 18,
    background: "rgba(7, 16, 12, 0.03)",
    border: "1px solid rgba(7, 16, 12, 0.12)",
  },
  feedbackPreviewHeader: {
    marginBottom: 14,
  },
  feedbackPreviewTitle: {
    margin: "0 0 6px",
    color: "#07100c",
    fontSize: 14,
    fontWeight: 900,
  },
  feedbackPreviewDescription: {
    margin: 0,
    color: "rgba(7, 16, 12, 0.58)",
    fontSize: 12,
    lineHeight: 1.62,
    wordBreak: "keep-all",
  },
  feedbackButtonGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    gap: 8,
  },
  mobileFeedbackButtonGrid: {
    gridTemplateColumns: "1fr 1fr",
  },
  feedbackPreviewButton: {
    minHeight: 66,
    padding: 10,
    background: "#fffdf4",
    border: "1px solid rgba(7, 16, 12, 0.18)",
    color: "#07100c",
  },
  feedbackPreviewButtonTitle: {
    display: "block",
    marginBottom: 4,
    fontSize: 12,
    fontWeight: 900,
  },
  feedbackPreviewButtonText: {
    display: "block",
    color: "rgba(7, 16, 12, 0.56)",
    fontSize: 11,
    lineHeight: 1.45,
    wordBreak: "keep-all",
  },
  previewExplanationBox: {
    padding: 22,
    border: "1px solid rgba(230, 231, 204, 0.24)",
    background: "rgba(5, 11, 9, 0.56)",
  },
  previewExplanationKicker: {
    margin: "0 0 10px",
    color: "#dce6b8",
    fontSize: 13,
    fontWeight: 900,
  },
  previewExplanationTitle: {
    margin: 0,
    color: "#fbf4df",
    fontFamily: notoSerifKr.style.fontFamily,
    fontSize: 25,
    lineHeight: 1.44,
    letterSpacing: "-0.05em",
    fontWeight: 600,
    wordBreak: "keep-all",
  },
  previewExplanationText: {
    margin: "14px 0 0",
    color: "rgba(247, 241, 223, 0.68)",
    fontSize: 14,
    lineHeight: 1.78,
    wordBreak: "keep-all",
  },
  previewExplanationList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginTop: 18,
    paddingTop: 18,
    borderTop: "1px solid rgba(230, 231, 204, 0.16)",
  },
  previewCheckItem: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    color: "rgba(247, 241, 223, 0.8)",
    fontSize: 13,
    lineHeight: 1.62,
    fontWeight: 700,
    wordBreak: "keep-all",
  },
  previewCheckMark: {
    color: "#dce6b8",
    fontWeight: 900,
    flex: "0 0 auto",
  },
  card: {
    padding: 30,
    background: "rgba(247, 241, 223, 0.94)",
    color: "#07100c",
    boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
    border: "1px solid rgba(247, 241, 223, 0.72)",
    width: "100%",
    boxSizing: "border-box",
    marginBottom: 24,
    backdropFilter: "blur(10px)",
  },
  mobileCard: {
    padding: 16,
  },
  cardHeader: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(260px, 0.7fr)",
    gap: 18,
    alignItems: "end",
    marginBottom: 26,
    paddingBottom: 20,
    borderBottom: "1px solid rgba(7, 16, 12, 0.16)",
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
    color: "#203428",
    fontSize: 13,
    fontWeight: 700,
  },
  cardTitle: {
    margin: 0,
    color: "#07100c",
    fontFamily: notoSerifKr.style.fontFamily,
    fontSize: 38,
    lineHeight: 1.32,
    letterSpacing: "-0.06em",
    fontWeight: 600,
    wordBreak: "keep-all",
  },
  mobileCardTitle: {
    fontSize: 27,
    lineHeight: 1.32,
  },
  cardSubtext: {
    margin: 0,
    color: "rgba(7, 16, 12, 0.62)",
    fontSize: 14,
    lineHeight: 1.78,
    wordBreak: "keep-all",
  },
  formBlock: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
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
    fontWeight: 700,
    color: "#07100c",
    minWidth: 0,
  },
  input: {
    width: "100%",
    height: 54,
    border: "1px solid rgba(7, 16, 12, 0.24)",
    padding: "0 14px",
    fontSize: 15,
    color: "#07100c",
    background: "#fffdf4",
    outline: "none",
    boxSizing: "border-box",
  },
  loadingText: {
    margin: "4px 0 20px",
    padding: 14,
    background: "rgba(7, 16, 12, 0.05)",
    color: "rgba(7, 16, 12, 0.62)",
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
    border: "1px solid rgba(7, 16, 12, 0.18)",
    background: "#fffdf4",
    minWidth: 0,
  },
  mobileQuestionBlock: {
    padding: 14,
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
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#0b1711",
    color: "#dce6b8",
    fontSize: 14,
    fontWeight: 700,
    flex: "0 0 auto",
  },
  mobileStepBadge: {
    width: 38,
    height: 38,
    fontSize: 13,
  },
  questionTitle: {
    margin: 0,
    fontSize: 22,
    letterSpacing: "-0.03em",
    lineHeight: 1.34,
    color: "#07100c",
    fontWeight: 700,
    wordBreak: "keep-all",
  },
  mobileQuestionTitle: {
    fontSize: 19,
    lineHeight: 1.38,
  },
  questionDescription: {
    margin: "7px 0 0",
    color: "rgba(7, 16, 12, 0.64)",
    fontSize: 14,
    lineHeight: 1.72,
    wordBreak: "keep-all",
  },
  questionHelp: {
    margin: "7px 0 0",
    color: "#32685d",
    fontSize: 13,
    lineHeight: 1.65,
    fontWeight: 700,
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
    minHeight: 94,
    textAlign: "left",
    border: "1px solid rgba(7, 16, 12, 0.16)",
    background: "#f7f1df",
    padding: 14,
    cursor: "pointer",
    color: "#07100c",
    boxSizing: "border-box",
  },
  mobileOptionButton: {
    minHeight: "auto",
    padding: 13,
  },
  optionButtonSelected: {
    border: "2px solid #0b1711",
    background: "#eef0d2",
    boxShadow: "5px 5px 0 rgba(11, 23, 17, 0.16)",
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
    fontWeight: 700,
    lineHeight: 1.42,
    wordBreak: "keep-all",
  },
  selectedPill: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px 7px",
    background: "#0b1711",
    color: "#dce6b8",
    fontSize: 11,
    fontWeight: 700,
    flex: "0 0 auto",
  },
  optionDescription: {
    display: "block",
    fontSize: 13,
    lineHeight: 1.62,
    color: "rgba(7, 16, 12, 0.62)",
    wordBreak: "keep-all",
  },
  summaryBox: {
    marginTop: 22,
    padding: 18,
    background: "#0b1711",
    border: "1px solid #0b1711",
    color: "#f7f1df",
  },
  mobileSummaryBox: {
    marginTop: 18,
    padding: 15,
  },
  summaryKicker: {
    margin: "0 0 8px",
    color: "#dce6b8",
    fontSize: 13,
    fontWeight: 700,
  },
  summaryText: {
    margin: 0,
    color: "#f7f1df",
    fontSize: 15,
    lineHeight: 1.82,
    wordBreak: "keep-all",
  },
  submitButton: {
    width: "100%",
    height: 62,
    border: "none",
    background: "#0b1711",
    color: "#dce6b8",
    marginTop: 22,
    fontSize: 17,
    fontWeight: 700,
    cursor: "pointer",
  },
  mobileSubmitButton: {
    height: 56,
    fontSize: 15,
  },
  messageBox: {
    marginTop: 16,
    padding: 15,
    border: "1px solid",
    fontSize: 14,
    lineHeight: 1.7,
    fontWeight: 700,
    wordBreak: "keep-all",
  },
  footerNote: {
    margin: "14px 0 0",
    color: "rgba(7, 16, 12, 0.56)",
    fontSize: 13,
    lineHeight: 1.68,
    textAlign: "center",
    wordBreak: "keep-all",
  },
  privacyNotice: {
    margin: "14px 0 0",
    padding: 14,
    background: "rgba(7, 16, 12, 0.04)",
    border: "1px solid rgba(7, 16, 12, 0.12)",
    color: "rgba(7, 16, 12, 0.62)",
    fontSize: 12,
    lineHeight: 1.72,
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
    background: "#0b1711",
    border: "1px solid #0b1711",
  },
  mobileSuccessHero: {
    padding: 18,
  },
  successBadge: {
    display: "inline-block",
    margin: "0 0 12px",
    padding: "7px 10px",
    background: "#dce6b8",
    color: "#0b1711",
    fontSize: 13,
    fontWeight: 700,
  },
  successTitle: {
    margin: 0,
    color: "#f7f1df",
    fontFamily: notoSerifKr.style.fontFamily,
    fontSize: 36,
    lineHeight: 1.34,
    letterSpacing: "-0.055em",
    fontWeight: 600,
    wordBreak: "keep-all",
  },
  mobileSuccessTitle: {
    fontSize: 26,
    lineHeight: 1.34,
  },
  successDescription: {
    maxWidth: 820,
    margin: "14px 0 0",
    color: "rgba(247, 241, 223, 0.72)",
    fontSize: 16,
    lineHeight: 1.82,
    wordBreak: "keep-all",
  },
  mobileSuccessDescription: {
    fontSize: 14,
    lineHeight: 1.74,
  },
  successEmailBox: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
    marginTop: 20,
    padding: 14,
    background: "rgba(247, 241, 223, 0.08)",
    border: "1px solid rgba(247, 241, 223, 0.16)",
    minWidth: 0,
  },
  successEmailLabel: {
    color: "rgba(247, 241, 223, 0.62)",
    fontSize: 13,
    fontWeight: 700,
  },
  successEmail: {
    color: "#f7f1df",
    fontSize: 15,
    fontWeight: 700,
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
    background: "#fffdf4",
    border: "1px solid rgba(7, 16, 12, 0.16)",
  },
  resultLabel: {
    display: "block",
    marginBottom: 8,
    color: "rgba(7, 16, 12, 0.58)",
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.45,
  },
  resultValue: {
    display: "block",
    color: "#07100c",
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.5,
    wordBreak: "keep-all",
  },
  nextStepBox: {
    padding: 22,
    background: "#0b1711",
    color: "#f7f1df",
  },
  mobileNextStepBox: {
    padding: 16,
  },
  nextStepKicker: {
    margin: "0 0 7px",
    color: "#dce6b8",
    fontSize: 13,
    fontWeight: 700,
  },
  nextStepTitle: {
    margin: "0 0 18px",
    fontFamily: notoSerifKr.style.fontFamily,
    fontSize: 27,
    lineHeight: 1.44,
    letterSpacing: "-0.045em",
    fontWeight: 600,
  },
  mobileNextStepTitle: {
    fontSize: 21,
  },
  nextStepList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  nextStepItem: {
    display: "flex",
    gap: 13,
    padding: 16,
    background: "rgba(247, 241, 223, 0.07)",
    border: "1px solid rgba(247, 241, 223, 0.12)",
  },
  nextStepNumber: {
    width: 30,
    height: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#dce6b8",
    color: "#0b1711",
    fontSize: 14,
    fontWeight: 700,
    flex: "0 0 auto",
  },
  nextStepItemTitle: {
    display: "block",
    color: "#f7f1df",
    fontSize: 15,
    fontWeight: 700,
    lineHeight: 1.48,
    wordBreak: "keep-all",
  },
  nextStepItemText: {
    margin: "5px 0 0",
    color: "rgba(247, 241, 223, 0.68)",
    fontSize: 14,
    lineHeight: 1.7,
    wordBreak: "keep-all",
  },
  briefingExampleBox: {
    padding: 20,
    background: "#eef0d2",
    border: "1px solid rgba(7, 16, 12, 0.14)",
  },
  briefingExampleKicker: {
    margin: "0 0 12px",
    color: "#07100c",
    fontSize: 13,
    fontWeight: 700,
  },
  briefingExample: {
    padding: 16,
    background: "#fffdf4",
    border: "1px solid rgba(7, 16, 12, 0.12)",
  },
  briefingExampleTitle: {
    display: "block",
    color: "#07100c",
    fontFamily: notoSerifKr.style.fontFamily,
    fontSize: 18,
    fontWeight: 600,
    lineHeight: 1.72,
    letterSpacing: "-0.04em",
    wordBreak: "keep-all",
  },
  briefingExampleText: {
    margin: "9px 0 0",
    color: "rgba(7, 16, 12, 0.62)",
    fontSize: 14,
    lineHeight: 1.74,
    wordBreak: "keep-all",
  },
  successActions: {
    display: "flex",
    justifyContent: "center",
  },
  secondaryButton: {
    minHeight: 48,
    border: "1px solid rgba(7, 16, 12, 0.2)",
    background: "#fffdf4",
    color: "#07100c",
    padding: "0 18px",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  buildSection: {
    padding: 30,
    border: "1px solid rgba(230, 231, 204, 0.3)",
    background:
      "linear-gradient(145deg, rgba(8, 21, 16, 0.66), rgba(5, 10, 12, 0.68))",
    color: "#f7f1df",
    marginBottom: 20,
    backdropFilter: "blur(7px)",
  },
  mobileBuildSection: {
    padding: 18,
  },
  buildHeader: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 220px",
    gap: 22,
    alignItems: "start",
    marginBottom: 26,
  },
  mobileBuildHeader: {
    gridTemplateColumns: "1fr",
    gap: 14,
  },
  buildKicker: {
    margin: "0 0 10px",
    color: "#dce6b8",
    fontSize: 13,
    fontWeight: 700,
  },
  buildTitle: {
    margin: 0,
    color: "#fbf4df",
    fontFamily: notoSerifKr.style.fontFamily,
    fontSize: 48,
    lineHeight: 1.24,
    letterSpacing: "-0.065em",
    fontWeight: 600,
    wordBreak: "keep-all",
  },
  mobileBuildTitle: {
    fontSize: 31,
    lineHeight: 1.22,
  },
  buildLockBox: {
    padding: 18,
    border: "1px solid rgba(230, 231, 204, 0.28)",
    background: "rgba(5, 11, 9, 0.68)",
  },
  buildLockNumber: {
    display: "block",
    color: "#dce6b8",
    fontSize: 42,
    lineHeight: 1,
    fontWeight: 700,
    letterSpacing: "-0.04em",
  },
  buildLockText: {
    display: "block",
    marginTop: 10,
    color: "rgba(247, 241, 223, 0.72)",
    fontSize: 13,
    lineHeight: 1.62,
    fontWeight: 700,
    wordBreak: "keep-all",
  },
  buildGrid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 0.92fr) minmax(280px, 0.72fr)",
    gap: 22,
  },
  mobileBuildGrid: {
    gridTemplateColumns: "1fr",
  },
  buildTextBox: {
    padding: 22,
    border: "1px solid rgba(230, 231, 204, 0.22)",
    background: "rgba(0, 0, 0, 0.16)",
  },
  buildParagraph: {
    margin: "0 0 14px",
    color: "#f7f1df",
    fontSize: 17,
    lineHeight: 1.82,
    wordBreak: "keep-all",
  },
  buildMuted: {
    margin: "20px 0 0",
    paddingTop: 18,
    borderTop: "1px solid rgba(230, 231, 204, 0.18)",
    color: "rgba(247, 241, 223, 0.66)",
    fontSize: 14,
    lineHeight: 1.76,
    wordBreak: "keep-all",
  },
  buildConditionBox: {
    marginTop: 22,
    padding: 16,
    border: "1px solid rgba(230, 231, 204, 0.22)",
    background: "rgba(5, 11, 9, 0.46)",
  },
  buildConditionLabel: {
    display: "block",
    marginBottom: 8,
    color: "#dce6b8",
    fontSize: 12,
    fontWeight: 700,
  },
  buildConditionText: {
    display: "block",
    color: "#fbf4df",
    fontFamily: notoSerifKr.style.fontFamily,
    fontSize: 18,
    lineHeight: 1.5,
    letterSpacing: "-0.04em",
    fontWeight: 600,
    wordBreak: "keep-all",
  },
  buildConditionNote: {
    margin: "8px 0 0",
    color: "rgba(247, 241, 223, 0.62)",
    fontSize: 13,
    lineHeight: 1.7,
    wordBreak: "keep-all",
  },
  buildFormMock: {
    padding: 22,
    border: "1px solid rgba(247, 241, 223, 0.32)",
    background: "rgba(247, 241, 223, 0.92)",
    color: "#07100c",
  },
  buildFormTitle: {
    margin: "0 0 16px",
    color: "#07100c",
    fontFamily: notoSerifKr.style.fontFamily,
    fontSize: 18,
    lineHeight: 1.5,
    letterSpacing: "-0.04em",
    fontWeight: 600,
  },
  buildLabel: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    marginBottom: 12,
    color: "#07100c",
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.5,
  },
  buildInput: {
    width: "100%",
    height: 50,
    border: "1px solid rgba(7, 16, 12, 0.18)",
    background: "#fffdf4",
    color: "#07100c",
    padding: "0 13px",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  buildTextarea: {
    width: "100%",
    minHeight: 94,
    border: "1px solid rgba(7, 16, 12, 0.18)",
    background: "#fffdf4",
    color: "#07100c",
    padding: "13px",
    fontSize: 14,
    lineHeight: 1.65,
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: notoSansKr.style.fontFamily,
  },
  buildTextareaSmall: {
    width: "100%",
    minHeight: 74,
    border: "1px solid rgba(7, 16, 12, 0.18)",
    background: "#fffdf4",
    color: "#07100c",
    padding: "13px",
    fontSize: 14,
    lineHeight: 1.65,
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: notoSansKr.style.fontFamily,
  },
  buildSubmitButton: {
    width: "100%",
    height: 54,
    marginTop: 4,
    border: "none",
    background: "#0b1711",
    color: "#dce6b8",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
  },
  buildMessageBox: {
    marginTop: 12,
    padding: 14,
    border: "1px solid",
    fontSize: 13,
    lineHeight: 1.7,
    fontWeight: 700,
    wordBreak: "keep-all",
  },
  buildMessageSuccess: {
    background: "#eef0d2",
    borderColor: "rgba(7, 16, 12, 0.16)",
    color: "#0b1711",
  },
  buildMessageError: {
    background: "#fff1f2",
    borderColor: "#fecdd3",
    color: "#be123c",
  },
  buildFormNote: {
    margin: "12px 0 0",
    color: "rgba(7, 16, 12, 0.54)",
    fontSize: 12,
    lineHeight: 1.6,
    textAlign: "center",
    wordBreak: "keep-all",
  },
};