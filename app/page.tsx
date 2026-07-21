"use client";

import { useMemo, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import Image from "next/image";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import {
  CATEGORY_GROUPS,
  DEFAULT_CATEGORY_SELECTIONS,
  DEFAULT_DIFFICULTY,
  DIFFICULTY_OPTIONS,
  getCategoryOptionLabel,
  getDifficultyLabel,
} from "@/lib/categoryQuestions";
import type { CategoryGroupKey } from "@/lib/categoryQuestions";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const notoSerifKr = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["500", "600", "700", "900"],
});

// lib/categoryQuestions.ts의 문항 형태를 이 페이지의 카드 렌더링(QuestionBlock)이
// 기대하는 group/options 번들 모양으로 맞춰주기만 하는 어댑터입니다. 렌더링
// 컴포넌트 자체는 손대지 않아서 위험을 최소화했습니다.
type CategoryBundle = {
  group: {
    group_key: CategoryGroupKey;
    label: string;
    description: string;
    step: string;
    helper: string;
  };
  options: {
    group_key: CategoryGroupKey;
    option_value: string;
    label: string;
    description: string;
  }[];
};

const BUNDLES: CategoryBundle[] = CATEGORY_GROUPS.map((group) => ({
  group: {
    group_key: group.key,
    label: group.label,
    description: group.question,
    step: group.step,
    helper: group.helper,
  },
  options: group.options.map((option) => ({
    group_key: group.key,
    option_value: option.value,
    label: option.label,
    description: option.description,
  })),
}));

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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
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

/* 심전도 마크 — 접속 시 한 번 그려지는 브랜드 모션 */
function PulseMark({ width = 220 }: { width?: number }) {
  return (
    <svg
      className="brf-pulse"
      width={width}
      height={48}
      viewBox="0 0 240 48"
      role="img"
      aria-label="심전도 파형이 그려지는 Mosun Brief 마크"
    >
      <polyline points="2,30 70,30 84,30 94,8 106,44 116,30 152,30 238,30" />
    </svg>
  );
}

function PulseGlyph() {
  return (
    <svg width={34} height={20} viewBox="0 0 68 40" aria-hidden="true">
      <polyline
        points="2,24 20,24 26,24 32,6 40,36 46,24 54,24 66,24"
        fill="none"
        stroke="var(--brf-clay)"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* 첫 화면 fold — 카유보트 「창가의 젊은 남자」(1876) 오마주(Ⅴ안, v1인
   함메르쇠이는 폐기). 존 버거식 "이미 소유한 사람의 무관심한 시선"을
   첫 인상으로 쓰고, 기존 공감형 히어로 카피는 바로 아래 섹션으로
   유지한다. 카피는 확정본이라 그대로 두고, 텍스트/스크린리더 이용자를
   위해 alt만 정확히 채운다. 데스크톱(≥880px)에서는 CSS(.mh-fold의
   row-reverse)가 그림을 오른쪽으로 옮긴다 — 인물이 바라보는 열린 창이
   그림 프레임 왼쪽에 있어, 그림을 오른쪽에 두면 그 시선이 왼쪽 카피
   쪽을 향한다(이유는 globals.css .mh-fold 주석 참고). DOM 순서는
   그림 먼저·카피 나중으로 그대로 둬 스크린리더 낭독 순서는 안 바뀐다. */
function MuseumFold() {
  return (
    <section className="mh-fold">
      <figure className="mh-art">
        <div className="mh-frame">
          <Image
            src="/art/caillebotte.jpg"
            alt="귀스타브 카유보트, 창가의 젊은 남자, 1876"
            width={1095}
            height={1600}
            priority
            sizes="(min-width: 880px) 45vw, 75vw"
          />
        </div>
        <figcaption className="mh-plaque">
          <span className="mh-plq-title">「전망을 가진 사람」</span>
          <span className="mh-plq-credit">after Gustave Caillebotte · 《창가의 젊은 남자》 1876</span>
          <span className="mh-plq-credit">J. Paul Getty Museum, Los Angeles</span>
        </figcaption>
      </figure>

      <div className="mh-copy">
        <p className="mh-eyebrow">Personal AI Briefing</p>
        <h1 className="mh-h1">
          그는 도시를 내려다본다.
          <br />
          <em>모두가 뉴스에 쫓기는 시간에.</em>
        </h1>
        <p className="mh-line">
          매주, 단 한 사람을 위해 쓰입니다.
          <br />
          이 전망은 아직 당신의 것이 아닙니다.
        </p>
        <a className="mh-cta" href="#subscribe-result">
          나의 브리핑 받기
        </a>
        <a className="mh-peek" href="#preview">
          어느 구독자에게 간 브리핑 엿보기 ↓
        </a>
      </div>

      <div className="mh-rustbar" />
    </section>
  );
}

function SiteHeader() {
  return (
    <header className="brf-topbar">
      <div className="brf-shell brf-topbar-inner">
        <a href="/" className="brf-wordmark">
          <PulseGlyph />
          Mosun Brief
        </a>
        <nav className="brf-topnav" aria-label="주요 메뉴">
          <a href="https://mosunbrief.kr" rel="noopener">
            모순책장
          </a>
          <a href="/lab">기록들</a>
          <a href="#subscribe-result" className="brf-topnav-cta">
            브리핑 시작하기
          </a>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="brf-footer">
      <div className="brf-shell brf-footer-inner">
        <span>© {new Date().getFullYear()} Mosun Brief · 모순책장의 첫 작품</span>
        <div className="brf-footer-links">
          <a href="https://mosunbrief.kr" rel="noopener">
            모순책장
          </a>
          <a href="/privacy">개인정보처리방침</a>
          <a href="/unsubscribe">구독 취소</a>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [difficulty, setDifficulty] = useState<string>(DEFAULT_DIFFICULTY);

  const [selections, setSelections] = useState<Record<CategoryGroupKey, string>>(
    DEFAULT_CATEGORY_SELECTIONS
  );

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const bundles = BUNDLES;

  const selectedSummary = useMemo(
    () => ({
      aiEmotion: getCategoryOptionLabel("ai_emotion", selections.ai_emotion),
      aiIntent: getCategoryOptionLabel("ai_intent", selections.ai_intent),
      blocker: getCategoryOptionLabel("blocker", selections.blocker),
      actionTime: getCategoryOptionLabel("action_time", selections.action_time),
    }),
    [selections]
  );

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
    <div
      className={`${notoSansKr.className} brf`}
      style={{ "--brf-serif": notoSerifKr.style.fontFamily } as CSSProperties}
    >
      <SiteHeader />

      <main>
        {/* ── fold: 함메르쇠이 전시실 (B안) ── */}
        <MuseumFold />

        {/* ── 기존 히어로 카피: fold 아래로 이동(삭제 아님, 2단계에서 재배치 예정) ── */}
        <section className="brf-hero">
          <div className="brf-shell">
            <p className="brf-eyebrow brf-rise">Personal AI Briefing</p>
            <PulseMark />
            <h1 className="brf-h1 brf-rise" style={{ animationDelay: "0.1s" }}>
              알고는 있지만,
              <br />
              아직 만들지는 못했다.
            </h1>
            <p className="brf-lead brf-rise" style={{ animationDelay: "0.22s" }}>
              AI 시대가 온다는 말은 충분히 들었습니다. 이제 필요한 것은 더 많은
              정보가 아니라, 당신이 직접 해보는 첫 번째 행동입니다.
            </p>
            <p
              className="brf-lead-sub brf-rise"
              style={{ animationDelay: "0.3s" }}
            >
              당신의 감정, 목적, 막히는 지점, 가능한 시간을 바탕으로 이번 주
              실행할 수 있는 개인 맞춤 AI 브리핑을 보냅니다.
            </p>

            <div
              className="brf-cta-row brf-rise"
              style={{ animationDelay: "0.38s" }}
            >
              <a href="#subscribe-result" className="brf-btn">
                내 브리핑 시작하기
              </a>
              <a href="#preview" className="brf-btn-ghost">
                받게 될 브리핑 미리보기
              </a>
            </div>

            <div className="brf-grid4 brf-rise" style={{ animationDelay: "0.46s" }}>
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
        </section>

        {/* ── 선언 ── */}
        <section className="brf-band">
          <div className="brf-shell">
            <p className="brf-quote">
              정보는 이미 많습니다. 문제는 시작점입니다. Personal AI Briefing은
              막연한 관심을 <em>이번 주의 작은 실행</em>으로 바꿉니다.
            </p>
          </div>
        </section>

        {/* ── 브리핑 미리보기 ── */}
        <BriefingPreviewSection />

        {/* ── 신청 폼 ── */}
        <section className="brf-band" id="subscribe-result">
          <div className="brf-shell">
            <div className="brf-card">
              {isSuccess ? (
                <SuccessOnboarding
                  email={submittedEmail}
                  summary={selectedSummary}
                  difficulty={difficulty}
                  onReset={handleResetForm}
                />
              ) : (
                <>
                  <div className="brf-form-head">
                    <div>
                      <p className="brf-kicker">무료 브리핑 설정</p>
                      <h2 className="brf-h2">내 AI 브리핑 시작하기</h2>
                    </div>
                    <p>
                      1분이면 충분합니다. 선택값은 이후 발송되는 자료 추천과
                      실행 제안에 사용됩니다.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="brf-field-row">
                      <label className="brf-label">
                        이메일
                        <input
                          className="brf-input"
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          placeholder="briefing@example.com"
                          required
                        />
                      </label>

                      <label className="brf-label">
                        직업/상황
                        <input
                          className="brf-input"
                          type="text"
                          value={jobRole}
                          onChange={(event) => setJobRole(event.target.value)}
                          placeholder="예: 인턴, 직장인, 창업 준비, 학생"
                        />
                      </label>

                      <label className="brf-label">
                        선호 난이도
                        <select
                          className="brf-input"
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
                    </div>

                    <div>
                      {bundles.map((bundle) => (
                        <QuestionBlock
                          key={bundle.group.group_key}
                          bundle={bundle}
                          selectedValue={selections[bundle.group.group_key]}
                          onSelect={handleSelect}
                        />
                      ))}
                    </div>

                    <section className="brf-summary">
                      <p className="brf-summary-kicker">현재 선택 요약</p>
                      <p className="brf-summary-text">
                        <strong>{selectedSummary.aiEmotion}</strong> 상태에서{" "}
                        <strong>{selectedSummary.aiIntent}</strong>에 관심이
                        있고, <strong>{selectedSummary.blocker}</strong> 때문에
                        막혀 있으며, 이번 주에는{" "}
                        <strong>{selectedSummary.actionTime}</strong> 정도 실행할
                        수 있습니다.
                      </p>
                    </section>

                    <button
                      type="submit"
                      className="brf-btn"
                      style={{ width: "100%" }}
                      disabled={submitting}
                    >
                      {submitting ? "저장 중..." : "내 AI 브리핑 시작하기"}
                    </button>

                    {message && <div className="brf-msg error">{message}</div>}

                    <p className="brf-form-note">
                      같은 이메일로 다시 신청하면 기존 정보가 업데이트됩니다.
                    </p>

                    <div className="brf-privacy">
                      <p>
                        입력하신 이메일과 선택 정보는 맞춤 AI 브리핑 발송 및
                        품질 개선 목적으로만 사용됩니다. 수집한 정보는 제3자에게
                        판매하거나 제공하지 않습니다.
                      </p>
                      <p>
                        이메일 하단의 구독 취소 링크 또는 구독 취소 페이지를
                        통해 언제든 수신을 중단할 수 있습니다.
                      </p>
                      <div className="brf-privacy-links">
                        <a href="/privacy">개인정보처리방침</a>
                        {" · "}
                        <a href="/unsubscribe">구독 취소</a>
                      </div>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ── Personal AI Build ── */}
        <BuildSection />
      </main>

      <SiteFooter />
    </div>
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
    <div className="brf-grid4-item">
      <span className="brf-grid4-no">{number}</span>
      <strong className="brf-grid4-title">{title}</strong>
      <span className="brf-grid4-text">{children}</span>
    </div>
  );
}

function SuccessOnboarding({
  email,
  summary,
  difficulty,
  onReset,
}: {
  email: string;
  summary: SelectedSummary;
  difficulty: string;
  onReset: () => void;
}) {
  const difficultyLabel = getDifficultyLabel(difficulty);

  return (
    <section>
      <span className="brf-success-badge">신청 완료</span>
      <h2 className="brf-h2">이제 브리핑이 당신에게 맞춰집니다.</h2>
      <p className="brf-section-desc">
        입력한 상태를 기준으로 앞으로 발송되는 AI 자료, 이유 설명, 실행 제안이
        맞춤화됩니다. 첫 브리핑을 받은 뒤 피드백을 누를수록 추천 정확도가 더
        좋아집니다.
      </p>

      <div className="brf-email-box">
        <span>발송 이메일</span>
        <strong>{email}</strong>
      </div>

      <div className="brf-result-grid">
        <ResultCard label="AI에 대한 현재 감정" value={summary.aiEmotion} />
        <ResultCard label="AI로 하고 싶은 것" value={summary.aiIntent} />
        <ResultCard label="지금 막히는 지점" value={summary.blocker} />
        <ResultCard label="이번 주 가능한 행동 시간" value={summary.actionTime} />
        <ResultCard label="선호 난이도" value={difficultyLabel} />
      </div>

      <section className="brf-inner-box-plain">
        <p className="brf-inner-title-plain">첫 브리핑을 받기 전 준비</p>
        <div className="brf-next-list">
          <NextStepItem number="1" title="메일함에서 브리핑을 확인하세요">
            첫 메일이 스팸함이나 프로모션함으로 들어갈 수 있습니다. 메일이
            도착하면 한 번 열어주세요.
          </NextStepItem>

          <NextStepItem number="2" title="자료를 전부 읽으려고 하지 마세요">
            목표는 정보 과식이 아니라 선택입니다. “왜 이 자료가 왔는지”와 “이번
            주 실행”만 먼저 보면 됩니다.
          </NextStepItem>

          <NextStepItem number="3" title="피드백 버튼을 눌러주세요">
            좋음, 더 깊게, 별로, 실행해봄, 실행안해봄 피드백이 쌓이면 다음
            브리핑이 더 개인화됩니다.
          </NextStepItem>
        </div>
      </section>

      <section className="brf-inner-box">
        <p className="brf-inner-title">앞으로 이런 식으로 받게 됩니다</p>
        <p className="brf-inner-text">
          <strong>
            “정보가 너무 많아 피곤한 사람을 위한 이번 주 AI 브리핑”
          </strong>
          <br />
          오늘의 자료 1개 → 나에게 온 이유 → 핵심 요약 → 이번 주{" "}
          {summary.actionTime} 안에 해볼 행동 1개
        </p>
      </section>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
        <button type="button" className="brf-btn-ghost" onClick={onReset}>
          다른 이메일로 다시 신청하기
        </button>
      </div>
    </section>
  );
}

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="brf-result-card">
      <span>{label}</span>
      <strong>{value}</strong>
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
    <div className="brf-next-item">
      <div className="brf-next-no">{number}</div>
      <div>
        <strong>{title}</strong>
        <p>{children}</p>
      </div>
    </div>
  );
}

function QuestionBlock({
  bundle,
  selectedValue,
  onSelect,
}: {
  bundle: CategoryBundle;
  selectedValue: string;
  onSelect: (groupKey: CategoryGroupKey, optionValue: string) => void;
}) {
  return (
    <section className="brf-q">
      <div className="brf-q-head">
        <div className="brf-q-step">{bundle.group.step}</div>
        <div>
          <h3 className="brf-q-title">{bundle.group.label}</h3>
          {bundle.group.description && (
            <p className="brf-q-desc">{bundle.group.description}</p>
          )}
          <p className="brf-q-help">{bundle.group.helper}</p>
        </div>
      </div>

      <div className="brf-opt-grid">
        {bundle.options.map((option) => {
          const selected = selectedValue === option.option_value;

          return (
            <button
              key={`${option.group_key}-${option.option_value}`}
              type="button"
              className={`brf-opt${selected ? " selected" : ""}`}
              onClick={() => onSelect(option.group_key, option.option_value)}
            >
              <span className="brf-opt-top">
                <span className="brf-opt-label">{option.label}</span>
                {selected && <span className="brf-opt-pill">선택됨</span>}
              </span>

              {option.description && (
                <span className="brf-opt-desc">{option.description}</span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function BriefingPreviewSection() {
  return (
    <section className="brf-section" id="preview">
      <div className="brf-shell">
        <p className="brf-kicker">브리핑 미리보기</p>
        <h2 className="brf-h2">
          실제로 이런 브리핑을
          <br />
          받게 됩니다.
        </h2>
        <p className="brf-section-desc">
          단순히 AI 뉴스를 모아 보내는 것이 아니라, 당신의 상태·관심사·난이도·
          피드백에 따라 이번 주 하나의 자료와 실행 과제를 추천합니다.
        </p>

        <div className="brf-preview-grid">
          <article className="brf-card">
            <div className="brf-tags">
              <span className="brf-tag brf-tag-primary">추천 1</span>
              <span className="brf-tag">general_ai</span>
              <span className="brf-tag">중간</span>
              <span className="brf-tag">neutral</span>
            </div>

            <h3 className="brf-card-title">
              AI 에이전트가 웹을 대신 돌아다니는 시대를 보고 싶은 사람을 위한
              Tabstack by Mozilla
            </h3>

            <section className="brf-inner-box">
              <p className="brf-inner-title">이 자료가 나에게 온 이유</p>
              <ul className="brf-inner-list">
                <li>현재 감정이 ‘기대됨’인 구독자에게 맞는 자료</li>
                <li>관심 방향이 ‘사업 기회나 돈 벌 기회’인 구독자에게 맞는 자료</li>
                <li>‘기술적인 내용이 어려움’을 줄이는 자료</li>
                <li>이전에 실행해본 자료와 유사한 방향</li>
              </ul>
            </section>

            <section className="brf-inner-box-plain">
              <p className="brf-inner-title-plain">먼저 이것만 이해하세요</p>
              <p className="brf-inner-text">
                앞으로 브라우저는 단순히 웹페이지를 보여주는 도구를 넘어,
                사용자를 대신해 정보를 찾고 정리하는 방향으로 바뀌고 있습니다.
                중요한 것은 모든 기술을 이해하는 것이 아니라, 내 일에서 어떤
                흐름을 맡길 수 있는지 상상해보는 것입니다.
              </p>
            </section>

            <section className="brf-inner-box-plain">
              <p className="brf-inner-title-plain">균형 관점</p>
              <p className="brf-inner-text">
                비개발자가 바로 쓰기에는 아직 어렵습니다. 하지만 “앞으로 AI
                서비스가 단순 답변을 넘어 실제 웹 작업을 대신한다”는 흐름을
                이해하기에는 좋은 자료입니다.
              </p>
            </section>

            <section className="brf-inner-box">
              <p className="brf-inner-title">오늘 딱 하나 할 일</p>
              <p className="brf-inner-text">
                Tabstack 소개 페이지를 읽고 “AI가 웹에서 대신 해주면 좋을 일”을
                3개 적어보세요. 예: 경쟁사 가격 조사, 채용공고 수집, 여행지 후보
                비교. 그중 하나를 골라 이 작업을 사람이 하면 몇 단계가
                필요한지만 적어봅니다.
              </p>
            </section>

            <span className="brf-fake-btn brf-fake-btn-primary">
              원문 보기
            </span>

            <div className="brf-feedback-secondary">
              <span className="brf-fake-btn">피드백 남기기</span>
              <p className="brf-feedback-caption">
                자료 만족도와 실행 여부를 한 화면에서 남길 수 있어요 · 다음
                추천에 반영돼요
              </p>
            </div>

            <section>
              <p className="brf-inner-title-plain" style={{ marginBottom: 4 }}>
                “피드백 남기기”를 누르면 이런 화면이 열려요
              </p>
              <p
                className="brf-opt-desc"
                style={{ marginTop: 0, marginBottom: 12 }}
              >
                자료 만족도와 실행 여부를 각각 하나씩 고를 수 있어요. 누르는
                즉시 저장되고, 다시 누르면 선택이 풀립니다.
              </p>

              <p className="brf-feedback-group-label">자료가 어땠나요?</p>
              <div className="brf-feedback-grid">
                <FeedbackPreviewButton title="좋음">
                  비슷한 자료를 더 받을래요
                </FeedbackPreviewButton>
                <FeedbackPreviewButton title="더 깊게">
                  이 방향을 더 심화할래요
                </FeedbackPreviewButton>
                <FeedbackPreviewButton title="별로">
                  다음 추천에서 낮출게요
                </FeedbackPreviewButton>
              </div>

              <p className="brf-feedback-group-label">실행해봤나요?</p>
              <div className="brf-feedback-grid">
                <FeedbackPreviewButton title="실행해봄">
                  실행 가능한 방향을 더 줄게요
                </FeedbackPreviewButton>
                <FeedbackPreviewButton title="실행안해봄">
                  난이도와 시간을 다시 맞출게요
                </FeedbackPreviewButton>
              </div>
            </section>
          </article>

          <aside>
            <div className="brf-card" style={{ marginBottom: 16 }}>
              <p className="brf-kicker">받게 되는 것</p>
              <h3 className="brf-card-title" style={{ marginBottom: 8 }}>
                개인 맞춤 AI 브리핑
              </h3>
              <div className="brf-check-list">
                <PreviewCheckItem>지금 볼 만한 AI 자료</PreviewCheckItem>
                <PreviewCheckItem>이 자료가 필요한 이유</PreviewCheckItem>
                <PreviewCheckItem>10분·30분·2시간 실행 제안</PreviewCheckItem>
                <PreviewCheckItem>
                  좋음 / 더 깊게 / 별로 피드백 반영
                </PreviewCheckItem>
                <PreviewCheckItem>
                  반응이 쌓일수록 더 정확해지는 추천
                </PreviewCheckItem>
              </div>
              <p className="brf-build-muted">
                목표는 AI를 많이 아는 것이 아닙니다. AI와 함께 무언가를
                만들어내는 것입니다.
              </p>
            </div>

            <div className="brf-card">
              <p className="brf-kicker">왜 보여드리나요?</p>
              <h3 className="brf-card-title" style={{ marginBottom: 8 }}>
                메일을 넣기 전, 받을 결과물을 먼저 확인할 수 있어야 합니다.
              </h3>
              <p className="brf-inner-text">
                Personal AI Briefing은 뉴스 목록이 아니라 “이 자료가 왜 나에게
                왔는지”와 “오늘 하나만 한다면 무엇을 할지”를 함께 보냅니다.
              </p>
              <div className="brf-check-list">
                <PreviewCheckItem>자료 1개를 고르는 이유</PreviewCheckItem>
                <PreviewCheckItem>초보자도 이해할 핵심 요약</PreviewCheckItem>
                <PreviewCheckItem>균형 잡힌 관점</PreviewCheckItem>
                <PreviewCheckItem>이번 주 가능한 행동 1개</PreviewCheckItem>
                <PreviewCheckItem>다음 추천을 바꾸는 피드백</PreviewCheckItem>
              </div>
            </div>
          </aside>
        </div>
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
    <div className="brf-feedback-item">
      <strong>{title}</strong>
      <span>{children}</span>
    </div>
  );
}

function PreviewCheckItem({ children }: { children: ReactNode }) {
  return (
    <div className="brf-check-item">
      <span className="mark">✓</span>
      <span>{children}</span>
    </div>
  );
}

function BuildSection() {
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
    <section className="brf-section">
      <div className="brf-shell">
        <p className="brf-kicker">Personal AI Build</p>
        <h2 className="brf-h2">
          충분히 반응이 쌓이면,
          <br />
          이제 직접 만들 차례입니다.
        </h2>

        <div className="brf-lock">
          <strong>50+</strong>
          <span>피드백 50개 이상부터 신청 가능</span>
        </div>

        <div className="brf-build-grid">
          <div>
            <p className="brf-build-para">
              Personal AI Build는 AI로 직접 무언가를 만들고 싶은 사람을 위한
              1:1 방향 상담입니다.
            </p>
            <p className="brf-build-para">
              사이트, 자동화, 글쓰기, 콘텐츠, 작은 서비스, 사업 아이디어까지.
              막연한 생각을 실제 실행 순서로 바꾸는 과정입니다.
            </p>
            <p className="brf-build-muted">
              아직은 충분한 피드백이 쌓인 사람에게만 열립니다. 당신이 어떤
              자료에 반응했고, 무엇을 어려워했고, 실제로 무엇을 해봤는지 알아야
              더 정확한 방향을 제안할 수 있기 때문입니다.
            </p>

            <div className="brf-condition">
              <span>신청 조건</span>
              <strong>피드백 {requiredFeedbackCount}개 이상</strong>
              <p>
                같은 이메일로 남긴 자료 평가와 실행 여부 피드백을 기준으로
                확인합니다.
                {feedbackCount !== null
                  ? ` 현재 확인된 피드백은 ${feedbackCount}개입니다.`
                  : ""}
              </p>
            </div>
          </div>

          <form className="brf-card" onSubmit={handleBuildSubmit}>
            <h3 className="brf-card-title" style={{ marginBottom: 18 }}>
              상담 신청
            </h3>

            <div
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              <label className="brf-label">
                이메일
                <input
                  className="brf-input"
                  type="email"
                  value={buildEmail}
                  onChange={(event) => setBuildEmail(event.target.value)}
                  placeholder="briefing@example.com"
                  required
                />
              </label>

              <label className="brf-label">
                이름
                <input
                  className="brf-input"
                  type="text"
                  value={buildName}
                  onChange={(event) => setBuildName(event.target.value)}
                  placeholder="선택 입력"
                />
              </label>

              <label className="brf-label">
                무엇을 만들고 싶나요?
                <textarea
                  className="brf-textarea"
                  value={wantToBuild}
                  onChange={(event) => setWantToBuild(event.target.value)}
                  placeholder="예: 개인 웹사이트, 자동화 도구, 콘텐츠 채널, 작은 서비스, 사업 아이디어"
                  required
                />
              </label>

              <label className="brf-label">
                현재 어디서 막혀 있나요?
                <textarea
                  className="brf-textarea"
                  value={blockedPoint}
                  onChange={(event) => setBlockedPoint(event.target.value)}
                  placeholder="예: 아이디어는 있는데 구현 순서를 모르겠음, 어떤 AI 도구를 써야 할지 모르겠음"
                  required
                />
              </label>

              <label className="brf-label">
                AI를 어느 정도 활용해봤나요?
                <textarea
                  className="brf-textarea"
                  style={{ minHeight: 72 }}
                  value={aiExperience}
                  onChange={(event) => setAiExperience(event.target.value)}
                  placeholder="예: ChatGPT로 글쓰기만 해봄, 사이트 제작은 처음, 자동화는 안 해봄"
                />
              </label>

              <label className="brf-label">
                어떤 도움을 받고 싶나요?
                <textarea
                  className="brf-textarea"
                  style={{ minHeight: 72 }}
                  value={helpType}
                  onChange={(event) => setHelpType(event.target.value)}
                  placeholder="예: 실행 순서 정리, 도구 추천, 첫 화면 설계, 기능 우선순위 정리"
                />
              </label>

              <button type="submit" className="brf-btn" disabled={buildSubmitting}>
                {buildSubmitting ? "신청 확인 중..." : "상담 신청하기"}
              </button>
            </div>

            {buildMessage && (
              <div className={`brf-msg ${buildSuccess ? "success" : "error"}`}>
                {buildMessage}
              </div>
            )}

            <p className="brf-form-note">
              피드백이 부족하면 신청은 저장되지 않습니다. 먼저 브리핑에 반응을
              남겨주세요.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
