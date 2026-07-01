"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

type RecentSubscriber = {
  id: string;
  email: string;
  job_role?: string | null;
  difficulty?: string | null;
  ai_emotion: string | null;
  ai_intent: string | null;
  blocker: string | null;
  action_time: string | null;
  persona_type: string | null;
  created_at: string;
  updated_at?: string | null;
};

type RecentFeedback = {
  id: number;
  subscriber_email: string | null;
  newsletter_item_id: number | null;
  newsletter_item_title?: string | null;
  feedback_type: string | null;
  action_done: boolean | null;
  free_text: string | null;
  created_at: string;
};

type RecentDeliveryLog = {
  id: number;
  subscriber_id: string | null;
  subscriber_email: string;
  newsletter_item_id: number | null;
  newsletter_item_title?: string | null;
  status: string | null;
  error_message: string | null;
  created_at: string;
};

type AdminStatsResult = {
  ok?: boolean;
  message?: string;
  totalSubscribers?: number;
  recentSubscribers?: RecentSubscriber[];
  recentFeedbacks?: RecentFeedback[];
  recentDeliveryLogs?: RecentDeliveryLog[];
  fallbackWarnings?: string[];
  detail?: string;
  rawText?: string;
};

const VALUE_LABELS: Record<string, string> = {
  curious: "호기심",
  excited: "기대됨",
  anxious: "불안",
  fatigue: "정보 피로",
  skeptical: "회의적",
  unsure: "잘 모르겠음",

  not_sure: "아직 모름",
  work_efficiency: "업무 효율",
  service_building: "서비스/사이트",
  learning: "공부/자기계발",
  creative_writing: "글쓰기/창작",
  writing_creation: "글쓰기/창작",
  business_opportunity: "사업/수익",
  business_money: "사업/수익",
  avoid_but_need: "피하고 싶지만 필요",

  too_much_info: "정보 과다",
  no_clear_start: "시작점 모름",
  dont_know_what_to_do: "시작점 모름",
  too_technical: "기술 어려움",
  technical_difficulty: "기술 어려움",
  no_time: "시간 없음",
  fear_of_falling_behind: "뒤처질 불안",
  low_need: "필요성 낮음",
  not_needed_yet: "필요성 낮음",

  "10min": "10분",
  "30min": "30분",
  "2hours": "2시간",
  half_day_weekend: "주말 반나절",
  half_weekend: "주말 반나절",

  easy: "입문",
  normal: "중간",
  expert: "심화",

  useful: "좋음",
  deeper: "더 깊게",
  not_relevant: "별로",
  hard: "어려움",
  less_anxious: "불안 감소",
  different: "다른 자료 원함",
  action_done: "실행해봄",
  action_not_done: "실행안해봄",
  done: "실행해봄",
  not_done: "실행안해봄",
  not_executed: "실행안해봄",

  sent: "발송 성공",
  failed: "발송 실패",
  skipped_duplicate: "중복 제외",
  unknown: "미확인",
  Unknown: "미확인",
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

function normalizeEmailKey(email: string | null | undefined) {
  return (email || "").trim().toLowerCase();
}

function getProfileUrl(email: string) {
  return `/profile?email=${encodeURIComponent(email)}`;
}

function getStatusScore(subscriber: RecentSubscriber) {
  return [
    subscriber.ai_emotion,
    subscriber.ai_intent,
    subscriber.blocker,
    subscriber.action_time,
  ].filter(Boolean).length;
}

function getStatusLabel(subscriber: RecentSubscriber) {
  const score = getStatusScore(subscriber);

  if (score >= 4) return "진단 완료";
  if (score >= 2) return "일부 진단";
  return "진단 부족";
}

function getStatusTone(subscriber: RecentSubscriber) {
  const score = getStatusScore(subscriber);

  if (score >= 4) return "green";
  if (score >= 2) return "gray";
  return "red";
}

function getUpdateLabel(subscriber: RecentSubscriber) {
  if (!subscriber.updated_at) {
    return "추적 컬럼 없음";
  }

  const createdTime = new Date(subscriber.created_at).getTime();
  const updatedTime = new Date(subscriber.updated_at).getTime();

  if (Number.isNaN(createdTime) || Number.isNaN(updatedTime)) {
    return "갱신 확인";
  }

  if (updatedTime > createdTime + 1000) {
    return "재진단됨";
  }

  return "가입 상태";
}

function getUpdateTone(subscriber: RecentSubscriber) {
  const label = getUpdateLabel(subscriber);

  if (label === "재진단됨") return "green";
  if (label === "추적 컬럼 없음") return "gray";
  return "blue";
}

function getRecentFeedbackByEmail(feedbacks: RecentFeedback[]) {
  const map = new Map<string, RecentFeedback>();

  for (const feedback of feedbacks) {
    const key = normalizeEmailKey(feedback.subscriber_email);

    if (!key || map.has(key)) continue;

    map.set(key, feedback);
  }

  return map;
}

function getRecentDeliveryLogByEmail(logs: RecentDeliveryLog[]) {
  const map = new Map<string, RecentDeliveryLog>();

  for (const log of logs) {
    const key = normalizeEmailKey(log.subscriber_email);

    if (!key || map.has(key)) continue;

    map.set(key, log);
  }

  return map;
}

async function readApiResponse(response: Response): Promise<AdminStatsResult> {
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

export default function AdminSubscribersPage() {
  const [adminSecret, setAdminSecret] = useState("");
  const [stats, setStats] = useState<AdminStatsResult | null>(null);
  const [message, setMessage] = useState("");
  const [debugText, setDebugText] = useState("");
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "complete" | "partial" | "weak"
  >("all");

  useEffect(() => {
    const savedSecret = window.localStorage.getItem("aifu_admin_secret") || "";
    setAdminSecret(savedSecret);
  }, []);

  const subscribers = stats?.recentSubscribers || [];
  const feedbacks = stats?.recentFeedbacks || [];
  const deliveryLogs = stats?.recentDeliveryLogs || [];

  const recentFeedbackByEmail = useMemo(
    () => getRecentFeedbackByEmail(feedbacks),
    [feedbacks]
  );

  const recentDeliveryLogByEmail = useMemo(
    () => getRecentDeliveryLogByEmail(deliveryLogs),
    [deliveryLogs]
  );

  const filteredSubscribers = useMemo(() => {
    const keyword = query.trim().toLowerCase();

    return subscribers.filter((subscriber) => {
      const score = getStatusScore(subscriber);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "complete" && score >= 4) ||
        (statusFilter === "partial" && score >= 2 && score < 4) ||
        (statusFilter === "weak" && score < 2);

      const matchesQuery =
        !keyword ||
        subscriber.email.toLowerCase().includes(keyword) ||
        (subscriber.job_role || "").toLowerCase().includes(keyword) ||
        labelOf(subscriber.ai_emotion).toLowerCase().includes(keyword) ||
        labelOf(subscriber.ai_intent).toLowerCase().includes(keyword) ||
        labelOf(subscriber.blocker).toLowerCase().includes(keyword);

      return matchesStatus && matchesQuery;
    });
  }, [query, statusFilter, subscribers]);

  const completeCount = subscribers.filter(
    (subscriber) => getStatusScore(subscriber) >= 4
  ).length;

  const partialCount = subscribers.filter((subscriber) => {
    const score = getStatusScore(subscriber);
    return score >= 2 && score < 4;
  }).length;

  const weakCount = subscribers.filter(
    (subscriber) => getStatusScore(subscriber) < 2
  ).length;

  const trackedUpdatedCount = subscribers.filter(
    (subscriber) => getUpdateLabel(subscriber) === "재진단됨"
  ).length;

  const feedbackLinkedCount = subscribers.filter((subscriber) =>
    recentFeedbackByEmail.has(normalizeEmailKey(subscriber.email))
  ).length;

  const deliveryLinkedCount = subscribers.filter((subscriber) =>
    recentDeliveryLogByEmail.has(normalizeEmailKey(subscriber.email))
  ).length;

  async function loadSubscribers() {
    if (!adminSecret.trim()) {
      setMessage("ADMIN_SECRET을 입력해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");
    setStats(null);

    try {
      const response = await fetch("/api/admin-stats", {
        method: "GET",
        headers: {
          "x-admin-secret": adminSecret.trim(),
        },
      });

      const result = await readApiResponse(response);

      setDebugText(JSON.stringify(result, null, 2));

      if (!response.ok || !result.ok) {
        setMessage(result.message || "구독자 상태 데이터를 불러오지 못했습니다.");
        return;
      }

      window.localStorage.setItem("aifu_admin_secret", adminSecret.trim());
      setStats(result);
      setMessage(result.message || "구독자 상태 데이터를 불러왔습니다.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setMessage(`구독자 상태 데이터 로딩 중 오류가 발생했습니다. ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <p style={styles.badge}>AI-FU Admin · D-11</p>

        <h1 style={styles.title}>구독자 상태 상세</h1>

        <p style={styles.description}>
          재진단 후 구독자의 현재 AI 감정, 목적, 막힘, 행동 시간, 난이도,
          최근 피드백과 최근 발송 로그를 운영자가 빠르게 확인하는 화면입니다.
        </p>
      </section>

      <section style={styles.controlCard}>
        <div style={styles.formGrid}>
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
        </div>

        <div style={styles.buttonRow}>
          <button
            type="button"
            style={styles.primaryButton}
            onClick={loadSubscribers}
            disabled={loading}
          >
            {loading ? "불러오는 중..." : "구독자 상태 불러오기"}
          </button>

          <a href="/admin" style={styles.secondaryLink}>
            관리자 메인
          </a>

          <a href="/profile" style={styles.secondaryLink}>
            재진단 화면
          </a>
        </div>

        {message && <div style={styles.messageBox}>{message}</div>}

        {stats?.fallbackWarnings && stats.fallbackWarnings.length > 0 && (
          <div style={styles.warningBox}>
            {stats.fallbackWarnings.map((warning) => (
              <p key={warning} style={styles.warningText}>
                {warning}
              </p>
            ))}
          </div>
        )}
      </section>

      {stats?.ok && (
        <section style={styles.dashboard}>
          <section style={styles.summaryGrid}>
            <SummaryCard
              label="최근 구독자"
              value={subscribers.length}
              help="API에서 내려온 recentSubscribers 기준"
            />
            <SummaryCard
              label="진단 완료"
              value={completeCount}
              help="감정/목적/막힘/시간 4개가 모두 있음"
            />
            <SummaryCard
              label="일부 진단"
              value={partialCount}
              help="상태값 일부만 있음"
            />
            <SummaryCard
              label="진단 부족"
              value={weakCount}
              help="상태값 보강 필요"
            />
            <SummaryCard
              label="재진단 추적"
              value={trackedUpdatedCount}
              help="updated_at 기준 재진단 확인"
            />
            <SummaryCard
              label="피드백 연결"
              value={feedbackLinkedCount}
              help="최근 피드백이 있는 구독자"
            />
            <SummaryCard
              label="발송 연결"
              value={deliveryLinkedCount}
              help="최근 발송 로그가 있는 구독자"
            />
          </section>

          <section style={styles.filterCard}>
            <div style={styles.filterGrid}>
              <label style={styles.label}>
                검색
                <input
                  style={styles.input}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="이메일, 직업, 상태값 검색"
                />
              </label>

              <label style={styles.label}>
                진단 상태
                <select
                  style={styles.input}
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as
                        | "all"
                        | "complete"
                        | "partial"
                        | "weak"
                    )
                  }
                >
                  <option value="all">전체</option>
                  <option value="complete">진단 완료</option>
                  <option value="partial">일부 진단</option>
                  <option value="weak">진단 부족</option>
                </select>
              </label>
            </div>

            <p style={styles.filterHelp}>
              표시 중: {filteredSubscribers.length.toLocaleString("ko-KR")}명
            </p>
          </section>

          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle}>구독자별 상태</h2>
                <p style={styles.panelDescription}>
                  “재진단 링크”를 누르면 해당 이메일이 자동 입력된 상태로
                  /profile 화면이 열립니다.
                </p>
              </div>
            </div>

            {filteredSubscribers.length === 0 ? (
              <p style={styles.emptyText}>표시할 구독자가 없습니다.</p>
            ) : (
              <div style={styles.subscriberGrid}>
                {filteredSubscribers.map((subscriber) => {
                  const emailKey = normalizeEmailKey(subscriber.email);
                  const recentFeedback = recentFeedbackByEmail.get(emailKey);
                  const recentDeliveryLog = recentDeliveryLogByEmail.get(emailKey);

                  return (
                    <SubscriberCard
                      key={subscriber.id}
                      subscriber={subscriber}
                      recentFeedback={recentFeedback}
                      recentDeliveryLog={recentDeliveryLog}
                    />
                  );
                })}
              </div>
            )}
          </section>

          {debugText && (
            <details style={styles.debugDetails}>
              <summary style={styles.debugSummary}>원본 JSON 보기</summary>
              <pre style={styles.debugBox}>{debugText}</pre>
            </details>
          )}
        </section>
      )}
    </main>
  );
}

function SubscriberCard({
  subscriber,
  recentFeedback,
  recentDeliveryLog,
}: {
  subscriber: RecentSubscriber;
  recentFeedback?: RecentFeedback;
  recentDeliveryLog?: RecentDeliveryLog;
}) {
  return (
    <article style={styles.subscriberCard}>
      <div style={styles.subscriberTop}>
        <div>
          <div style={styles.badgeRow}>
            <StatusBadge
              label={getStatusLabel(subscriber)}
              tone={getStatusTone(subscriber)}
            />
            <StatusBadge
              label={getUpdateLabel(subscriber)}
              tone={getUpdateTone(subscriber)}
            />
          </div>

          <h3 style={styles.emailTitle}>{subscriber.email}</h3>

          <p style={styles.smallMuted}>
            {subscriber.job_role || "직업/상황 미입력"}
          </p>
        </div>

        <a href={getProfileUrl(subscriber.email)} style={styles.profileLink}>
          재진단 링크
        </a>
      </div>

      <div style={styles.statusGrid}>
        <StatusCell label="AI 감정" value={labelOf(subscriber.ai_emotion)} />
        <StatusCell label="하고 싶은 것" value={labelOf(subscriber.ai_intent)} />
        <StatusCell label="막히는 지점" value={labelOf(subscriber.blocker)} />
        <StatusCell label="행동 시간" value={labelOf(subscriber.action_time)} />
        <StatusCell label="난이도" value={labelOf(subscriber.difficulty)} />
        <StatusCell
          label="페르소나"
          value={subscriber.persona_type || "-"}
        />
      </div>

      <div style={styles.timelineBox}>
        <div>
          <p style={styles.timelineLabel}>가입</p>
          <p style={styles.timelineValue}>{formatDate(subscriber.created_at)}</p>
        </div>

        <div>
          <p style={styles.timelineLabel}>갱신</p>
          <p style={styles.timelineValue}>{formatDate(subscriber.updated_at)}</p>
        </div>
      </div>

      <div style={styles.activityGrid}>
        <ActivityBox
          title="최근 피드백"
          emptyText="최근 피드백 없음"
          content={
            recentFeedback ? (
              <>
                <strong>{labelOf(recentFeedback.feedback_type)}</strong>
                <span>
                  {formatDate(recentFeedback.created_at)}
                  {recentFeedback.newsletter_item_id
                    ? ` · #${recentFeedback.newsletter_item_id}`
                    : ""}
                </span>
                {recentFeedback.newsletter_item_title && (
                  <span>{recentFeedback.newsletter_item_title}</span>
                )}
                {recentFeedback.free_text && (
                  <span>메모: {recentFeedback.free_text}</span>
                )}
              </>
            ) : null
          }
        />

        <ActivityBox
          title="최근 발송"
          emptyText="최근 발송 로그 없음"
          content={
            recentDeliveryLog ? (
              <>
                <strong>{labelOf(recentDeliveryLog.status)}</strong>
                <span>
                  {formatDate(recentDeliveryLog.created_at)}
                  {recentDeliveryLog.newsletter_item_id
                    ? ` · #${recentDeliveryLog.newsletter_item_id}`
                    : ""}
                </span>
                {recentDeliveryLog.newsletter_item_title && (
                  <span>{recentDeliveryLog.newsletter_item_title}</span>
                )}
                {recentDeliveryLog.error_message && (
                  <span>오류: {recentDeliveryLog.error_message}</span>
                )}
              </>
            ) : null
          }
        />
      </div>
    </article>
  );
}

function StatusCell({ label, value }: { label: string; value: string }) {
  return (
    <div style={styles.statusCell}>
      <p style={styles.statusCellLabel}>{label}</p>
      <p style={styles.statusCellValue}>{value}</p>
    </div>
  );
}

function ActivityBox({
  title,
  emptyText,
  content,
}: {
  title: string;
  emptyText: string;
  content: React.ReactNode;
}) {
  return (
    <div style={styles.activityBox}>
      <p style={styles.activityTitle}>{title}</p>

      {content ? (
        <div style={styles.activityContent}>{content}</div>
      ) : (
        <p style={styles.activityEmpty}>{emptyText}</p>
      )}
    </div>
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

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "green" | "red" | "gray" | "blue";
}) {
  const toneStyle =
    tone === "green"
      ? styles.statusGreen
      : tone === "red"
      ? styles.statusRed
      : tone === "blue"
      ? styles.statusBlue
      : styles.statusGray;

  return <span style={{ ...styles.statusBadge, ...toneStyle }}>{label}</span>;
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "48px 20px",
    background: "#0f172a",
    color: "#ffffff",
  },
  hero: {
    maxWidth: 1180,
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
    fontSize: 42,
    letterSpacing: "-0.05em",
  },
  description: {
    maxWidth: 820,
    margin: "16px 0 0",
    color: "#dbeafe",
    fontSize: 16,
    lineHeight: 1.7,
  },
  controlCard: {
    maxWidth: 1180,
    margin: "0 auto 24px",
    background: "#ffffff",
    color: "#111827",
    borderRadius: 24,
    padding: 28,
    boxShadow: "0 16px 40px rgba(0,0,0,0.22)",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
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
  secondaryLink: {
    height: 46,
    border: "1px solid #d1d5db",
    borderRadius: 12,
    padding: "0 16px",
    background: "#ffffff",
    color: "#111827",
    fontSize: 14,
    fontWeight: 900,
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
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
  warningBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    background: "#fffbeb",
    border: "1px solid #fcd34d",
  },
  warningText: {
    margin: "0 0 6px",
    color: "#92400e",
    fontSize: 13,
    lineHeight: 1.6,
    fontWeight: 800,
  },
  dashboard: {
    maxWidth: 1180,
    margin: "24px auto 0",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 12,
  },
  summaryCard: {
    background: "#ffffff",
    color: "#111827",
    borderRadius: 20,
    padding: 18,
    border: "1px solid #e5e7eb",
  },
  summaryLabel: {
    margin: 0,
    color: "#64748b",
    fontSize: 13,
    fontWeight: 900,
  },
  summaryValue: {
    margin: "8px 0 4px",
    color: "#111827",
    fontSize: 30,
    fontWeight: 950,
    letterSpacing: "-0.04em",
  },
  summaryHelp: {
    margin: 0,
    color: "#64748b",
    fontSize: 12,
    lineHeight: 1.5,
  },
  filterCard: {
    background: "#ffffff",
    color: "#111827",
    borderRadius: 24,
    padding: 22,
  },
  filterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 14,
  },
  filterHelp: {
    margin: 0,
    color: "#64748b",
    fontSize: 13,
    fontWeight: 800,
  },
  panel: {
    background: "#ffffff",
    color: "#111827",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 16px 40px rgba(0,0,0,0.18)",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 18,
  },
  panelTitle: {
    margin: 0,
    color: "#111827",
    fontSize: 24,
    letterSpacing: "-0.04em",
  },
  panelDescription: {
    margin: "8px 0 0",
    color: "#64748b",
    fontSize: 14,
    lineHeight: 1.6,
  },
  emptyText: {
    margin: 0,
    color: "#64748b",
    fontSize: 14,
  },
  subscriberGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: 16,
  },
  subscriberCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 22,
    background: "#f8fafc",
    padding: 18,
  },
  subscriberTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "flex-start",
    marginBottom: 14,
  },
  badgeRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  emailTitle: {
    margin: 0,
    color: "#111827",
    fontSize: 18,
    letterSpacing: "-0.03em",
    wordBreak: "break-all",
  },
  smallMuted: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: 13,
    lineHeight: 1.5,
  },
  profileLink: {
    display: "inline-flex",
    alignItems: "center",
    height: 36,
    padding: "0 11px",
    borderRadius: 10,
    background: "#2563eb",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  statusGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
  },
  statusCell: {
    padding: 12,
    borderRadius: 14,
    background: "#ffffff",
    border: "1px solid #e5e7eb",
  },
  statusCellLabel: {
    margin: "0 0 5px",
    color: "#64748b",
    fontSize: 12,
    fontWeight: 900,
  },
  statusCellValue: {
    margin: 0,
    color: "#111827",
    fontSize: 14,
    fontWeight: 950,
    lineHeight: 1.45,
  },
  timelineBox: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    background: "#ffffff",
    border: "1px solid #e5e7eb",
  },
  timelineLabel: {
    margin: "0 0 4px",
    color: "#64748b",
    fontSize: 12,
    fontWeight: 900,
  },
  timelineValue: {
    margin: 0,
    color: "#111827",
    fontSize: 13,
    lineHeight: 1.45,
    fontWeight: 800,
  },
  activityGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 10,
    marginTop: 12,
  },
  activityBox: {
    padding: 12,
    borderRadius: 14,
    background: "#ffffff",
    border: "1px solid #e5e7eb",
  },
  activityTitle: {
    margin: "0 0 8px",
    color: "#111827",
    fontSize: 13,
    fontWeight: 950,
  },
  activityContent: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    color: "#374151",
    fontSize: 12,
    lineHeight: 1.5,
  },
  activityEmpty: {
    margin: 0,
    color: "#94a3b8",
    fontSize: 12,
    lineHeight: 1.5,
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
  },
  statusGreen: {
    background: "#ecfdf5",
    color: "#047857",
    border: "1px solid #a7f3d0",
  },
  statusRed: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
  },
  statusGray: {
    background: "#f3f4f6",
    color: "#4b5563",
    border: "1px solid #d1d5db",
  },
  statusBlue: {
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
  },
  debugDetails: {
    background: "#020617",
    color: "#d1d5db",
    borderRadius: 18,
    padding: 16,
  },
  debugSummary: {
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 900,
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