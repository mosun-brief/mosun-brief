"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

type CategoryGroupKey =
  | "ai_emotion"
  | "ai_intent"
  | "blocker"
  | "action_time";

type PreviewItem = {
  id: number;
  title: string | null;
  category: string | null;
  difficulty: string | null;
  sourceType: string | null;
  stance: string | null;
  sourceUrl: string | null;
  mainSummary: string | null;
  balanceSummary: string | null;
  actionHint: string | null;
  score: number;
  matchedReasons: string[];
};

type PreviewDetail = {
  subscriberId: string;
  subscriberEmail: string;
  persona: string;
  answers: Record<CategoryGroupKey, string>;
  alreadySentItemIds: number[];
  willSend: boolean;
  selectedItemIds: number[];
  selectedItems: PreviewItem[];
  skippedReason: string | null;
};

type PreviewResult = {
  ok?: boolean;
  mode?: "preview";
  message?: string;
  totalSubscribers?: number;
  totalActiveItems?: number;
  previewSendableCount?: number;
  previewSkippedCount?: number;
  selectedItemIds?: number[];
  previewDetails?: PreviewDetail[];
  note?: string;
  rawText?: string;
};

type SendResult = {
  ok?: boolean;
  mode?: "full";
  message?: string;
  successCount?: number;
  failCount?: number;
  skippedSubscriberCount?: number;
  selectedItemIds?: number[];
  updatedItemIds?: number[];
  failedReasons?: string[];
  sentDetails?: {
    subscriber_email: string;
    item_ids: number[];
    scores?: {
      item_id: number;
      score: number;
      matched_reasons: string[];
    }[];
  }[];
  note?: string;
  rawText?: string;
};

type ApiResult = PreviewResult & SendResult;

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

function scoreTone(score: number) {
  if (score >= 8) return "strong";
  if (score >= 4) return "good";
  if (score > 0) return "weak";
  return "none";
}

async function readApiResponse(response: Response): Promise<ApiResult> {
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

export default function SendPreviewPage() {
  const [adminSecret, setAdminSecret] = useState("");
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);
  const [message, setMessage] = useState("");
  const [debugText, setDebugText] = useState("");
  const [showDebug, setShowDebug] = useState(false);
  const [showOnlySendable, setShowOnlySendable] = useState(false);
  const [loadingAction, setLoadingAction] = useState<"preview" | "full" | null>(
    null
  );

  const loading = loadingAction !== null;
  const previewDetails = previewResult?.previewDetails || [];

  const filteredDetails = useMemo(() => {
    if (!showOnlySendable) return previewDetails;
    return previewDetails.filter((detail) => detail.willSend);
  }, [previewDetails, showOnlySendable]);

  const uniqueSelectedItemCount = previewResult?.selectedItemIds?.length || 0;
  const sendableCount = previewResult?.previewSendableCount || 0;
  const skippedCount = previewResult?.previewSkippedCount || 0;
  const totalSubscribers = previewResult?.totalSubscribers || 0;
  const totalActiveItems = previewResult?.totalActiveItems || 0;

  useEffect(() => {
    const savedSecret = window.localStorage.getItem("aifu_admin_secret") || "";
    setAdminSecret(savedSecret);
  }, []);

  function saveAdminSecret() {
    if (!adminSecret.trim()) {
      setMessage("ADMIN_SECRET을 입력해주세요.");
      return;
    }

    window.localStorage.setItem("aifu_admin_secret", adminSecret.trim());
    setMessage("ADMIN_SECRET이 저장되었습니다.");
  }

  async function loadPreview() {
    if (!adminSecret.trim()) {
      setMessage("ADMIN_SECRET을 입력해주세요.");
      return;
    }

    setLoadingAction("preview");
    setMessage("");
    setSendResult(null);

    try {
      const response = await fetch("/api/send-newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret.trim(),
        },
        body: JSON.stringify({
          admin_secret: adminSecret.trim(),
          mode: "preview",
        }),
      });

      const result = await readApiResponse(response);

      if (!response.ok || !result.ok) {
        setMessage(result.message || "발송 전 미리보기를 불러오지 못했습니다.");
        setDebugText(result.rawText || JSON.stringify(result, null, 2));
        return;
      }

      setPreviewResult(result);
      setMessage(result.message || "발송 전 미리보기를 불러왔습니다.");
      setDebugText(JSON.stringify(result, null, 2));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setMessage(`발송 전 미리보기 로딩 중 오류가 발생했습니다. ${errorMessage}`);
    } finally {
      setLoadingAction(null);
    }
  }

  async function sendFullBrief() {
    if (!adminSecret.trim()) {
      setMessage("ADMIN_SECRET을 입력해주세요.");
      return;
    }

    if (!previewResult?.ok) {
      setMessage("먼저 발송 전 미리보기를 불러와주세요.");
      return;
    }

    const confirmed = window.confirm(
      `전체 브리프를 발송할까요?\n\n발송 가능: ${sendableCount}명\n스킵 예상: ${skippedCount}명\n선택 자료: ${uniqueSelectedItemCount}개\n\nnewsletter_delivery_logs 기준으로 이미 받은 자료는 중복 발송되지 않습니다.`
    );

    if (!confirmed) return;

    setLoadingAction("full");
    setMessage("");
    setSendResult(null);

    try {
      const response = await fetch("/api/send-newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret.trim(),
        },
        body: JSON.stringify({
          admin_secret: adminSecret.trim(),
          mode: "full",
        }),
      });

      const result = await readApiResponse(response);

      setSendResult(result);
      setDebugText(JSON.stringify(result, null, 2));

      if (!response.ok || !result.ok) {
        setMessage(result.message || "전체 브리프 발송 중 오류가 발생했습니다.");
        return;
      }

      setMessage(result.message || "전체 브리프 발송이 완료되었습니다.");
      await loadPreview();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setMessage(`전체 브리프 발송 중 오류가 발생했습니다. ${errorMessage}`);
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <p style={styles.badge}>AI-FU Admin · C-4</p>
        <h1 style={styles.title}>발송 전 최종 미리보기</h1>
        <p style={styles.description}>
          전체 브리프를 보내기 전에 구독자별로 어떤 자료가 매칭되는지 확인합니다.
          미리보기는 이메일 발송, delivery log 저장, 자료 상태 변경을 하지 않습니다.
        </p>

        <div style={styles.heroButtonRow}>
          <a href="/admin" style={styles.heroLink}>
            관리자 대시보드로
          </a>
          <a href="/admin/newsletter-items" style={styles.heroLink}>
            뉴스 자료 등록으로
          </a>
          <a href="/admin/brief-draft" style={styles.heroLink}>
            브리프 초안 생성으로
          </a>
        </div>
      </section>

      <section style={styles.controlCard}>
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
            disabled={loading}
          >
            ADMIN_SECRET 저장
          </button>

          <button
            type="button"
            style={styles.primaryButton}
            onClick={loadPreview}
            disabled={loading}
          >
            {loadingAction === "preview"
              ? "미리보기 불러오는 중..."
              : "발송 전 미리보기 불러오기"}
          </button>

          <button
            type="button"
            style={styles.redButton}
            onClick={sendFullBrief}
            disabled={loading || !previewResult?.ok || sendableCount === 0}
          >
            {loadingAction === "full" ? "전체 발송 중..." : "확인 후 전체 발송"}
          </button>
        </div>

        {message && <div style={styles.messageBox}>{message}</div>}
      </section>

      {sendResult && (
        <section style={styles.resultCard}>
          <h2 style={styles.sectionTitle}>발송 결과</h2>

          <div style={sendResult.ok ? styles.successBox : styles.warningBox}>
            {sendResult.message || (sendResult.ok ? "발송 완료" : "발송 실패")}
          </div>

          <div style={styles.summaryGrid}>
            <SummaryCard
              label="성공"
              value={sendResult.successCount ?? 0}
              help="발송 성공 구독자 수"
            />
            <SummaryCard
              label="실패"
              value={sendResult.failCount ?? 0}
              help="발송 실패 수"
            />
            <SummaryCard
              label="스킵"
              value={sendResult.skippedSubscriberCount ?? 0}
              help="보낼 수 있는 새 자료가 없어 제외"
            />
            <SummaryCard
              label="발송 자료"
              value={sendResult.selectedItemIds?.length ?? 0}
              help="이번 발송에 사용된 자료 수"
            />
          </div>

          {sendResult.failedReasons && sendResult.failedReasons.length > 0 && (
            <details style={styles.detailsBox}>
              <summary style={styles.detailsSummary}>실패/스킵 사유 보기</summary>
              <ul style={styles.errorList}>
                {sendResult.failedReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </details>
          )}
        </section>
      )}

      {previewResult?.ok && (
        <section style={styles.previewWrapper}>
          <section style={styles.summaryGrid}>
            <SummaryCard
              label="전체 구독자"
              value={totalSubscribers}
              help="미리보기 대상 구독자"
            />
            <SummaryCard
              label="활성 자료"
              value={totalActiveItems}
              help="발송 후보 자료"
            />
            <SummaryCard
              label="발송 가능"
              value={sendableCount}
              help="새 자료가 매칭된 구독자"
            />
            <SummaryCard
              label="스킵 예상"
              value={skippedCount}
              help="이미 받은 자료만 남은 구독자"
            />
            <SummaryCard
              label="선택 자료"
              value={uniqueSelectedItemCount}
              help="이번 발송에 쓰일 고유 자료 수"
            />
          </section>

          {previewResult.note && <p style={styles.note}>{previewResult.note}</p>}

          <section style={styles.previewCard}>
            <div style={styles.previewHeader}>
              <div>
                <h2 style={styles.sectionTitle}>구독자별 발송 미리보기</h2>
                <p style={styles.helpText}>
                  점수와 매칭 이유를 보고, 너무 이상한 자료가 섞이지 않았는지
                  확인하세요.
                </p>
              </div>

              <label style={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={showOnlySendable}
                  onChange={(event) => setShowOnlySendable(event.target.checked)}
                />
                발송 가능 구독자만 보기
              </label>
            </div>

            {filteredDetails.length === 0 ? (
              <p style={styles.emptyText}>표시할 미리보기 결과가 없습니다.</p>
            ) : (
              <div style={styles.detailList}>
                {filteredDetails.map((detail) => (
                  <PreviewDetailCard key={detail.subscriberId} detail={detail} />
                ))}
              </div>
            )}
          </section>
        </section>
      )}

      {debugText && (
        <section style={styles.debugSection}>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={() => setShowDebug((prev) => !prev)}
          >
            {showDebug ? "원본 JSON 숨기기" : "원본 JSON 보기"}
          </button>

          {showDebug && <pre style={styles.debugBox}>{debugText}</pre>}
        </section>
      )}
    </main>
  );
}

function SummaryCard({
  label,
  value,
  help,
}: {
  label: string;
  value: number;
  help: string;
}) {
  return (
    <div style={styles.summaryCard}>
      <p style={styles.summaryLabel}>{label}</p>
      <p style={styles.summaryValue}>{value.toLocaleString("ko-KR")}</p>
      <p style={styles.summaryHelp}>{help}</p>
    </div>
  );
}

function PreviewDetailCard({ detail }: { detail: PreviewDetail }) {
  return (
    <article style={styles.detailCard}>
      <div style={styles.detailTop}>
        <div>
          <p style={styles.detailMeta}>{detail.persona || "AI-FU 구독자"}</p>
          <h3 style={styles.detailTitle}>{detail.subscriberEmail}</h3>
        </div>

        <span
          style={{
            ...styles.statusBadge,
            ...(detail.willSend ? styles.statusSend : styles.statusSkip),
          }}
        >
          {detail.willSend ? "발송 예정" : "스킵"}
        </span>
      </div>

      <div style={styles.answerGrid}>
        <AnswerPill label="감정" value={labelOf(detail.answers.ai_emotion)} />
        <AnswerPill label="목적" value={labelOf(detail.answers.ai_intent)} />
        <AnswerPill label="막힘" value={labelOf(detail.answers.blocker)} />
        <AnswerPill label="시간" value={labelOf(detail.answers.action_time)} />
      </div>

      {detail.alreadySentItemIds.length > 0 && (
        <p style={styles.alreadySentText}>
          이미 받은 자료 ID: {detail.alreadySentItemIds.join(", ")}
        </p>
      )}

      {!detail.willSend && detail.skippedReason && (
        <div style={styles.skipBox}>{detail.skippedReason}</div>
      )}

      {detail.selectedItems.length > 0 && (
        <div style={styles.itemStack}>
          {detail.selectedItems.map((item) => (
            <PreviewItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </article>
  );
}

function AnswerPill({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.answerPill}>
      <span style={styles.answerLabel}>{label}</span>
      <span style={styles.answerValue}>{value || "-"}</span>
    </div>
  );
}

function PreviewItemCard({ item }: { item: PreviewItem }) {
  const tone = scoreTone(item.score);

  return (
    <div style={styles.itemCard}>
      <div style={styles.itemTop}>
        <div>
          <p style={styles.itemMeta}>
            #{item.id} · {labelOf(item.category)} · {labelOf(item.difficulty)}
          </p>

          <h4 style={styles.itemTitle}>{item.title || "제목 없음"}</h4>
        </div>

        <span
          style={{
            ...styles.scoreBadge,
            ...(tone === "strong"
              ? styles.scoreStrong
              : tone === "good"
              ? styles.scoreGood
              : tone === "weak"
              ? styles.scoreWeak
              : styles.scoreNone),
          }}
        >
          점수 {item.score}
        </span>
      </div>

      {item.matchedReasons.length > 0 ? (
        <div style={styles.reasonWrap}>
          {item.matchedReasons.map((reason) => (
            <span key={reason} style={styles.reasonPill}>
              {reason}
            </span>
          ))}
        </div>
      ) : (
        <p style={styles.mutedText}>매칭 이유 없음</p>
      )}

      {item.mainSummary && <p style={styles.itemSummary}>{item.mainSummary}</p>}

      {item.actionHint && (
        <div style={styles.actionBox}>
          <b>Action hint</b>
          <p>{item.actionHint}</p>
        </div>
      )}

      {item.sourceUrl && (
        <a href={item.sourceUrl} target="_blank" style={styles.sourceLink}>
          원문 보기
        </a>
      )}
    </div>
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
  controlCard: {
    maxWidth: 1280,
    margin: "0 auto 22px",
    background: "#ffffff",
    color: "#111827",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 16px 40px rgba(0,0,0,0.22)",
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
  buttonRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },
  primaryButton: {
    height: 46,
    border: "none",
    borderRadius: 12,
    padding: "0 16px",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 900,
    cursor: "pointer",
  },
  secondaryButton: {
    height: 46,
    border: "1px solid #d1d5db",
    borderRadius: 12,
    padding: "0 16px",
    background: "#ffffff",
    color: "#111827",
    fontSize: 14,
    fontWeight: 900,
    cursor: "pointer",
  },
  redButton: {
    height: 46,
    border: "none",
    borderRadius: 12,
    padding: "0 16px",
    background: "#dc2626",
    color: "#ffffff",
    fontSize: 14,
    fontWeight: 900,
    cursor: "pointer",
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
  resultCard: {
    maxWidth: 1280,
    margin: "0 auto 22px",
    background: "#ffffff",
    color: "#111827",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 16px 40px rgba(0,0,0,0.22)",
  },
  previewWrapper: {
    maxWidth: 1280,
    margin: "0 auto",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
    marginBottom: 18,
  },
  summaryCard: {
    background: "#ffffff",
    color: "#111827",
    borderRadius: 20,
    padding: 20,
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.14)",
  },
  summaryLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: 13,
    fontWeight: 900,
  },
  summaryValue: {
    margin: "8px 0 4px",
    color: "#111827",
    fontSize: 30,
    fontWeight: 900,
    letterSpacing: "-0.04em",
  },
  summaryHelp: {
    margin: 0,
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 1.5,
  },
  previewCard: {
    background: "#ffffff",
    color: "#111827",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 16px 40px rgba(0,0,0,0.22)",
  },
  previewHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "flex-start",
    marginBottom: 18,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 22,
    letterSpacing: "-0.03em",
  },
  helpText: {
    margin: "8px 0 0",
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 1.6,
  },
  checkLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    color: "#374151",
    fontSize: 13,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  detailList: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  detailCard: {
    padding: 18,
    borderRadius: 20,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
  },
  detailTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  detailMeta: {
    margin: "0 0 6px",
    color: "#6b7280",
    fontSize: 13,
    fontWeight: 900,
  },
  detailTitle: {
    margin: 0,
    color: "#111827",
    fontSize: 18,
    letterSpacing: "-0.02em",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  statusSend: {
    background: "#ecfdf5",
    color: "#047857",
    border: "1px solid #a7f3d0",
  },
  statusSkip: {
    background: "#f3f4f6",
    color: "#4b5563",
    border: "1px solid #d1d5db",
  },
  answerGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 8,
    marginTop: 14,
  },
  answerPill: {
    padding: "10px 12px",
    borderRadius: 14,
    background: "#ffffff",
    border: "1px solid #e5e7eb",
  },
  answerLabel: {
    display: "block",
    marginBottom: 4,
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 900,
  },
  answerValue: {
    color: "#111827",
    fontSize: 13,
    fontWeight: 900,
  },
  alreadySentText: {
    margin: "12px 0 0",
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 1.5,
  },
  skipBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    background: "#fffbeb",
    border: "1px solid #fcd34d",
    color: "#92400e",
    fontSize: 13,
    fontWeight: 800,
    lineHeight: 1.6,
  },
  itemStack: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginTop: 14,
  },
  itemCard: {
    padding: 16,
    borderRadius: 18,
    background: "#ffffff",
    border: "1px solid #e5e7eb",
  },
  itemTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
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
    fontSize: 16,
    lineHeight: 1.4,
    letterSpacing: "-0.02em",
  },
  scoreBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 9px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  scoreStrong: {
    background: "#ecfdf5",
    color: "#047857",
    border: "1px solid #a7f3d0",
  },
  scoreGood: {
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
  },
  scoreWeak: {
    background: "#fffbeb",
    color: "#92400e",
    border: "1px solid #fcd34d",
  },
  scoreNone: {
    background: "#f3f4f6",
    color: "#4b5563",
    border: "1px solid #d1d5db",
  },
  reasonWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 12,
  },
  reasonPill: {
    padding: "6px 8px",
    borderRadius: 999,
    background: "#fff7ed",
    color: "#9a3412",
    border: "1px solid #fed7aa",
    fontSize: 12,
    fontWeight: 900,
  },
  mutedText: {
    margin: "12px 0 0",
    color: "#6b7280",
    fontSize: 13,
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
  sourceLink: {
    display: "inline-flex",
    alignItems: "center",
    marginTop: 12,
    height: 34,
    padding: "0 10px",
    borderRadius: 10,
    background: "#111827",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 900,
  },
  successBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    color: "#047857",
    fontSize: 14,
    lineHeight: 1.7,
    fontWeight: 800,
  },
  warningBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    background: "#fffbeb",
    border: "1px solid #fcd34d",
    color: "#92400e",
    fontSize: 14,
    lineHeight: 1.7,
    fontWeight: 700,
  },
  detailsBox: {
    marginTop: 14,
  },
  detailsSummary: {
    cursor: "pointer",
    color: "#374151",
    fontSize: 14,
    fontWeight: 900,
  },
  errorList: {
    margin: "10px 0 0",
    paddingLeft: 20,
    color: "#991b1b",
    fontSize: 13,
    lineHeight: 1.7,
  },
  note: {
    margin: "0 0 18px",
    color: "#dbeafe",
    fontSize: 13,
    lineHeight: 1.6,
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
  debugBox: {
    marginTop: 14,
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