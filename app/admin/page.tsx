"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";

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
  reaction?: {
    useful?: number;
    deeper?: number;
    not_relevant?: number;
    hard?: number;
    less_anxious?: number;
    different?: number;
    unknown?: number;
  };
  execution?: {
    action_done?: number;
    action_not_done?: number;
    unknown?: number;
  };
};

type NewsletterStats = {
  total: number;
  active: number;
  inactive: number;
  sent: number;
  unsent: number;
  byCategory: CountRow[];
  byDifficulty: CountRow[];
  bySentStatus: BooleanCounts;
  byActiveStatus: BooleanCounts;
};

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

type RecentNewsletterItem = {
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

  feedback_total_count?: number;
  feedback_useful_count?: number;
  feedback_deeper_count?: number;
  feedback_not_relevant_count?: number;
  feedback_action_done_count?: number;
  feedback_action_not_done_count?: number;
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

type SentDetail = {
  subscriber_email: string;
  profile_url?: string;
  item_ids: number[];
  scores?: {
    item_id: number;
    score: number;
    matched_reasons: string[];
  }[];
};

type SelectedItem = {
  id: number;
  title: string | null;
  score?: number;
  matchedReasons?: string[];
};

type AdminStatsResult = {
  ok?: boolean;
  message?: string;

  totalSubscribers?: number;
  totalFeedbacks?: number;
  totalNewsletterItems?: number;
  totalDeliveryLogs?: number;

  personaCounts?: CountRow[];
  aiEmotionCounts?: CountRow[];
  aiIntentCounts?: CountRow[];
  blockerCounts?: CountRow[];
  actionTimeCounts?: CountRow[];

  categoryAnswerCounts?: {
    ai_emotion?: CountRow[];
    ai_intent?: CountRow[];
    blocker?: CountRow[];
    action_time?: CountRow[];
  };

  feedbackCounts?: CountRow[];
  feedbackGroupCounts?: FeedbackGroupCounts;
  reactionFeedbackCounts?: CountRow[];
  executionFeedbackCounts?: CountRow[];
  actionDoneCounts?: BooleanCounts;
  deliveryStatusCounts?: CountRow[];

  newsletterStats?: NewsletterStats;
  operationReview?: OperationReview;

  recentSubscribers?: RecentSubscriber[];
  recentFeedbacks?: RecentFeedback[];
  recentDeliveryLogs?: RecentDeliveryLog[];
  recentNewsletterItems?: RecentNewsletterItem[];

  detail?: string;
  rawText?: string;
};

type SendResult = {
  ok?: boolean;
  message?: string;
  mode?: "test" | "full";
  successCount?: number;
  failCount?: number;
  skippedSubscriberCount?: number;
  selectedItemIds?: number[];
  updatedItemIds?: number[];
  failedReasons?: string[];
  sentDetails?: SentDetail[];
  selectedItems?: SelectedItem[];
  note?: string;
  rawText?: string;
};

type ApiResult = AdminStatsResult & SendResult;

type BuildConsultationRequest = {
  id: string;
  email: string;
  name: string | null;
  want_to_build: string | null;
  blocked_point: string | null;
  ai_experience: string | null;
  help_type: string | null;
  feedback_count_at_request: number | null;
  status: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string | null;
};

type BuildConsultationListResult = {
  ok?: boolean;
  message?: string;
  requests?: BuildConsultationRequest[];
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

  useful: "좋음",
  deeper: "더 깊게",
  not_relevant: "별로",
  hard: "어려움",
  less_anxious: "불안 감소",
  different: "다른 자료 원함",
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

  sent: "발송 성공",
  failed: "발송 실패",
  skipped_duplicate: "중복 제외",

  pending: "대기",
  reviewing: "검토중",
  done: "완료",
  rejected: "보류",

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

function getTotalFromRows(rows: CountRow[] | undefined) {
  return (rows || []).reduce((sum, row) => sum + row.count, 0);
}

function getMaxCount(rows: CountRow[] | undefined) {
  return Math.max(1, ...(rows || []).map((row) => row.count));
}

function getBooleanCount(
  counts: BooleanCounts | undefined,
  key: keyof BooleanCounts
) {
  return counts?.[key] ?? 0;
}

function getReactionRows(stats: AdminStatsResult): CountRow[] {
  if (stats.reactionFeedbackCounts && stats.reactionFeedbackCounts.length > 0) {
    return stats.reactionFeedbackCounts;
  }

  const reaction = stats.feedbackGroupCounts?.reaction || {};

  return [
    { value: "useful", count: reaction.useful || 0 },
    { value: "deeper", count: reaction.deeper || 0 },
    { value: "not_relevant", count: reaction.not_relevant || 0 },
    { value: "hard", count: reaction.hard || 0 },
    { value: "less_anxious", count: reaction.less_anxious || 0 },
    { value: "different", count: reaction.different || 0 },
  ].filter((row) => row.count > 0);
}

function getExecutionRows(stats: AdminStatsResult): CountRow[] {
  if (
    stats.executionFeedbackCounts &&
    stats.executionFeedbackCounts.length > 0
  ) {
    return stats.executionFeedbackCounts;
  }

  const execution = stats.feedbackGroupCounts?.execution || {};

  return [
    { value: "action_done", count: execution.action_done || 0 },
    { value: "action_not_done", count: execution.action_not_done || 0 },
  ].filter((row) => row.count > 0);
}

function normalizeEmailKey(email: string | null | undefined) {
  return (email || "").trim().toLowerCase();
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

function getSubscriberStatusScore(subscriber: RecentSubscriber) {
  const fields = [
    subscriber.ai_emotion,
    subscriber.ai_intent,
    subscriber.blocker,
    subscriber.action_time,
  ];

  return fields.filter(Boolean).length;
}

function getSubscriberStatusLabel(subscriber: RecentSubscriber) {
  const score = getSubscriberStatusScore(subscriber);

  if (score >= 4) return "진단 완료";
  if (score >= 2) return "일부 진단";
  return "진단 부족";
}

function getSubscriberStatusTone(subscriber: RecentSubscriber) {
  const score = getSubscriberStatusScore(subscriber);

  if (score >= 4) return "green";
  if (score >= 2) return "gray";
  return "red";
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

async function readBuildConsultationResponse(
  response: Response
): Promise<BuildConsultationListResult> {
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

export default function AdminPage() {
  const [adminSecret, setAdminSecret] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [stats, setStats] = useState<AdminStatsResult | null>(null);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);
  const [buildRequests, setBuildRequests] = useState<
    BuildConsultationRequest[]
  >([]);
  const [buildRequestsMessage, setBuildRequestsMessage] = useState("");
  const [message, setMessage] = useState("");
  const [debugText, setDebugText] = useState("");
  const [showDebug, setShowDebug] = useState(false);
  const [loadingAction, setLoadingAction] = useState<
    "stats" | "test" | "full" | null
  >(null);

  const loading = loadingAction !== null;
  const hasStats = Boolean(stats?.ok);
  const hasSendResult = Boolean(sendResult);

  useEffect(() => {
    const savedSecret = window.localStorage.getItem("aifu_admin_secret") || "";
    const savedTestEmail = window.localStorage.getItem("aifu_test_email") || "";

    setAdminSecret(savedSecret);
    setTestEmail(savedTestEmail);
  }, []);

  async function loadBuildConsultationRequests(secret: string) {
    if (!secret) {
      setBuildRequests([]);
      setBuildRequestsMessage(
        "ADMIN_SECRET을 입력하면 상담 신청 목록을 불러옵니다."
      );
      return;
    }

    try {
      const response = await fetch("/api/build-consultation", {
        method: "GET",
        headers: {
          "x-admin-secret": secret,
        },
      });

      const result = await readBuildConsultationResponse(response);

      if (!response.ok || !result.ok) {
        setBuildRequests([]);
        setBuildRequestsMessage(
          result.message || "상담 신청 목록을 불러오지 못했습니다."
        );
        return;
      }

      setBuildRequests(result.requests || []);
      setBuildRequestsMessage(
        result.message || "Personal AI Build 상담 신청 목록을 불러왔습니다."
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setBuildRequests([]);
      setBuildRequestsMessage(
        `상담 신청 목록 로딩 중 오류가 발생했습니다. ${errorMessage}`
      );
    }
  }

  async function handleLoadStats(secret = adminSecret.trim()) {
    if (!secret) {
      setMessage("ADMIN_SECRET을 입력해주세요.");
      return;
    }

    setLoadingAction("stats");
    setMessage("");
    setSendResult(null);

    try {
      const response = await fetch("/api/admin-stats", {
        method: "GET",
        headers: {
          "x-admin-secret": secret,
        },
      });

      const result = await readApiResponse(response);

      if (!response.ok || !result.ok) {
        setMessage(result.message || "관리자 데이터를 불러오지 못했습니다.");
        setDebugText(result.rawText || JSON.stringify(result, null, 2));
        return;
      }

      setStats(result);
      setMessage(result.message || "관리자 데이터를 불러왔습니다.");
      setDebugText(JSON.stringify(result, null, 2));
      await loadBuildConsultationRequests(secret);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setMessage(`관리자 데이터 로딩 중 오류가 발생했습니다. ${errorMessage}`);
    } finally {
      setLoadingAction(null);
    }
  }

  function saveAdminSecret() {
    if (!adminSecret.trim()) {
      setMessage("ADMIN_SECRET을 입력해주세요.");
      return;
    }

    window.localStorage.setItem("aifu_admin_secret", adminSecret.trim());
    window.localStorage.setItem("aifu_test_email", testEmail.trim());
    setMessage("ADMIN_SECRET과 테스트 이메일이 저장되었습니다.");
    handleLoadStats(adminSecret.trim());
  }

  async function sendBrief(mode: "test" | "full") {
    if (!adminSecret.trim()) {
      setMessage("ADMIN_SECRET을 입력해주세요.");
      return;
    }

    if (mode === "test" && !testEmail.trim()) {
      setMessage("테스트 발송에는 테스트 이메일이 필요합니다.");
      return;
    }

    const confirmed =
      mode === "test"
        ? window.confirm(`${testEmail.trim()} 으로 테스트 브리프를 발송할까요?`)
        : window.confirm(
            "전체 브리프를 발송할까요? newsletter_delivery_logs 기준으로 이미 받은 자료는 중복 발송되지 않습니다."
          );

    if (!confirmed) return;

    setLoadingAction(mode);
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
          mode,
          test_email: mode === "test" ? testEmail.trim() : undefined,
        }),
      });

      const result = await readApiResponse(response);

      setSendResult(result);
      setDebugText(JSON.stringify(result, null, 2));

      if (!response.ok || !result.ok) {
        setMessage(result.message || "브리프 발송 중 오류가 발생했습니다.");
        return;
      }

      setMessage(result.message || "브리프 발송이 완료되었습니다.");
      await handleLoadStats(adminSecret.trim());
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setMessage(`브리프 발송 중 오류가 발생했습니다. ${errorMessage}`);
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <p style={styles.badge}>Personal AI Briefing Admin</p>
        <h1 style={styles.title}>운영 대시보드</h1>
        <p style={styles.description}>
          구독자, 뉴스 자료, 피드백, 발송 로그, Personal AI Build 상담 신청을
          확인하고 오늘 운영 가능한 상태인지 점검합니다.
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

          <label style={styles.label}>
            테스트 이메일
            <input
              style={styles.input}
              type="email"
              value={testEmail}
              onChange={(event) => setTestEmail(event.target.value)}
              placeholder="테스트로 받을 이메일"
            />
          </label>
        </div>

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
            onClick={() => handleLoadStats(adminSecret.trim())}
            disabled={loading}
          >
            {loadingAction === "stats"
              ? "불러오는 중..."
              : "관리자 데이터 불러오기"}
          </button>

          <button
            type="button"
            style={styles.blackButton}
            onClick={() => sendBrief("test")}
            disabled={loading}
          >
            {loadingAction === "test"
              ? "테스트 발송 중..."
              : "테스트 브리핑 발송"}
          </button>

          <button
            type="button"
            style={styles.redButton}
            onClick={() => sendBrief("full")}
            disabled={loading}
          >
            {loadingAction === "full"
              ? "전체 발송 중..."
              : "전체 브리핑 발송"}
          </button>
        </div>

        {message && <div style={styles.messageBox}>{message}</div>}
      </section>

      <section style={styles.linkCard}>
        <h2 style={styles.sectionTitle}>운영 메뉴</h2>

        <div style={styles.linkGrid}>
          <a href="/admin/subscribers" style={styles.featuredAdminLink}>
            구독자 상태 상세
          </a>

          <a href="/admin/send-preview" style={styles.adminLink}>
            발송 전 미리보기
          </a>

          <a href="/admin/brief-draft" style={styles.adminLink}>
            브리핑 초안 생성
          </a>

          <a href="/admin/newsletter-items" style={styles.adminLink}>
            뉴스 자료 등록
          </a>

          <a href="/" style={styles.adminLink}>
            구독 신청 화면
          </a>

          <a href="/profile" style={styles.adminLink}>
            재진단 화면
          </a>
        </div>
      </section>

      {hasSendResult && sendResult && <SendResultPanel result={sendResult} />}

      {hasStats && (
        <BuildConsultationRequestsPanel
          requests={buildRequests}
          message={buildRequestsMessage}
        />
      )}

      {hasStats && stats && <StatsDashboard stats={stats} />}

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

function BuildConsultationRequestsPanel({
  requests,
  message,
}: {
  requests: BuildConsultationRequest[];
  message: string;
}) {
  return (
    <section style={styles.buildRequestPanel}>
      <div style={styles.buildRequestHeader}>
        <div>
          <p style={styles.buildRequestBadge}>Personal AI Build</p>
          <h2 style={styles.panelTitle}>상담 신청 목록</h2>
          <p style={styles.reviewDescription}>
            피드백 50개 이상 조건을 통과해 저장된 1:1 AI 프로젝트 상담 신청을
            확인합니다.
          </p>
        </div>

        <div style={styles.buildRequestCountBox}>
          <span style={styles.buildRequestCount}>
            {requests.length.toLocaleString("ko-KR")}
          </span>
          <span style={styles.buildRequestCountLabel}>최근 신청</span>
        </div>
      </div>

      {message && <div style={styles.buildRequestMessage}>{message}</div>}

      {requests.length === 0 ? (
        <p style={styles.emptyText}>아직 상담 신청이 없습니다.</p>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>상태</th>
                <th style={styles.th}>신청일</th>
                <th style={styles.th}>이메일</th>
                <th style={styles.th}>이름</th>
                <th style={styles.th}>만들고 싶은 것</th>
                <th style={styles.th}>막힌 지점</th>
                <th style={styles.th}>AI 경험</th>
                <th style={styles.th}>원하는 도움</th>
                <th style={styles.th}>피드백 수</th>
                <th style={styles.th}>관리 메모</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td style={styles.td}>
                    <StatusBadge
                      label={labelOf(request.status)}
                      tone={
                        request.status === "done"
                          ? "green"
                          : request.status === "rejected"
                          ? "red"
                          : "gray"
                      }
                    />
                  </td>
                  <td style={styles.td}>{formatDate(request.created_at)}</td>
                  <td style={styles.td}>
                    <strong>{request.email}</strong>
                  </td>
                  <td style={styles.td}>{request.name || "-"}</td>
                  <td style={styles.td}>
                    <div style={styles.longTextCell}>
                      {request.want_to_build || "-"}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.longTextCell}>
                      {request.blocked_point || "-"}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.longTextCell}>
                      {request.ai_experience || "-"}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.longTextCell}>
                      {request.help_type || "-"}
                    </div>
                  </td>
                  <td style={styles.td}>
                    {(request.feedback_count_at_request ?? 0).toLocaleString(
                      "ko-KR"
                    )}
                    개
                  </td>
                  <td style={styles.td}>
                    <div style={styles.longTextCell}>
                      {request.admin_note || "-"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function StatsDashboard({ stats }: { stats: AdminStatsResult }) {
  const newsletterStats = stats.newsletterStats;
  const reactionRows = getReactionRows(stats);
  const executionRows = getExecutionRows(stats);

  return (
    <section style={styles.dashboard}>
      <div style={styles.summaryGrid}>
        <SummaryCard
          label="구독자"
          value={stats.totalSubscribers ?? 0}
          help="현재 저장된 전체 구독자"
        />
        <SummaryCard
          label="피드백"
          value={stats.totalFeedbacks ?? 0}
          help="저장된 전체 반응 수"
        />
        <SummaryCard
          label="뉴스 자료"
          value={stats.totalNewsletterItems ?? 0}
          help="등록된 전체 뉴스 자료"
        />
        <SummaryCard
          label="발송 로그"
          value={stats.totalDeliveryLogs ?? 0}
          help="중복 발송 방지 기준 로그"
        />
      </div>

      <SubscriberStatusOverviewPanel stats={stats} />

      <OperationChecklistPanel stats={stats} />

      {stats.operationReview && (
        <OperationReviewPanel review={stats.operationReview} />
      )}

      {newsletterStats && (
        <section style={styles.panel}>
          <h2 style={styles.panelTitle}>뉴스 자료 상태</h2>

          <div style={styles.summaryGrid}>
            <SummaryCard
              label="전체 자료"
              value={newsletterStats.total}
              help="newsletter_items 전체"
              compact
            />
            <SummaryCard
              label="활성 자료"
              value={newsletterStats.active}
              help="발송 후보"
              compact
            />
            <SummaryCard
              label="비활성 자료"
              value={newsletterStats.inactive}
              help="발송 제외"
              compact
            />
            <SummaryCard
              label="미발송 자료"
              value={newsletterStats.unsent}
              help="아직 전역 발송 처리되지 않은 자료"
              compact
            />
          </div>

          <div style={styles.twoColumn}>
            <CountPanel
              title="카테고리별 자료"
              rows={newsletterStats.byCategory}
            />
            <CountPanel
              title="난이도별 자료"
              rows={newsletterStats.byDifficulty}
            />
          </div>
        </section>
      )}

      <section style={styles.twoColumn}>
        <CountPanel title="AI 감정 분포" rows={stats.aiEmotionCounts || []} />
        <CountPanel title="AI 활용 목적 분포" rows={stats.aiIntentCounts || []} />
        <CountPanel title="막히는 지점 분포" rows={stats.blockerCounts || []} />
        <CountPanel
          title="가능한 행동 시간 분포"
          rows={stats.actionTimeCounts || []}
        />
      </section>

      <section style={styles.twoColumn}>
        <CountPanel title="자료 평가 피드백" rows={reactionRows} />
        <CountPanel title="실행 여부 피드백" rows={executionRows} />
      </section>

      <section style={styles.twoColumn}>
        <BooleanPanel
          title="Action done 구버전 집계"
          counts={stats.actionDoneCounts}
          trueLabel="실행함"
          falseLabel="실행 안 함"
        />

        <CountPanel title="발송 상태" rows={stats.deliveryStatusCounts || []} />
      </section>

      <section style={styles.panel}>
        <h2 style={styles.panelTitle}>최근 등록 뉴스 자료</h2>
        <RecentNewsletterItemsTable items={stats.recentNewsletterItems || []} />
      </section>

      <section id="feedbacks" style={styles.panel}>
        <h2 style={styles.panelTitle}>최근 피드백</h2>
        <RecentFeedbackTable feedbacks={stats.recentFeedbacks || []} />
      </section>

      <section id="delivery-logs" style={styles.panel}>
        <h2 style={styles.panelTitle}>최근 발송 로그</h2>
        <RecentDeliveryLogsTable logs={stats.recentDeliveryLogs || []} />
      </section>

      <section style={styles.panel}>
        <h2 style={styles.panelTitle}>최근 구독자</h2>
        <RecentSubscribersTable subscribers={stats.recentSubscribers || []} />
      </section>
    </section>
  );
}

function SubscriberStatusOverviewPanel({ stats }: { stats: AdminStatsResult }) {
  const subscribers = stats.recentSubscribers || [];
  const recentFeedbackByEmail = useMemo(
    () => getRecentFeedbackByEmail(stats.recentFeedbacks || []),
    [stats.recentFeedbacks]
  );
  const recentDeliveryLogByEmail = useMemo(
    () => getRecentDeliveryLogByEmail(stats.recentDeliveryLogs || []),
    [stats.recentDeliveryLogs]
  );

  const completeCount = subscribers.filter(
    (subscriber) => getSubscriberStatusScore(subscriber) >= 4
  ).length;
  const partialCount = subscribers.filter((subscriber) => {
    const score = getSubscriberStatusScore(subscriber);
    return score >= 2 && score < 4;
  }).length;
  const weakCount = subscribers.filter(
    (subscriber) => getSubscriberStatusScore(subscriber) < 2
  ).length;
  const feedbackLinkedCount = subscribers.filter((subscriber) =>
    recentFeedbackByEmail.has(normalizeEmailKey(subscriber.email))
  ).length;
  const deliveryLinkedCount = subscribers.filter((subscriber) =>
    recentDeliveryLogByEmail.has(normalizeEmailKey(subscriber.email))
  ).length;

  return (
    <section style={styles.subscriberStatusPanel}>
      <div style={styles.subscriberStatusHeader}>
        <div>
          <p style={styles.subscriberStatusBadge}>구독자 상태</p>
          <h2 style={styles.panelTitle}>구독자 상태 / 재진단 확인</h2>
          <p style={styles.reviewDescription}>
            최근 구독자 기준으로 현재 AI 감정, 목적, 막힘, 행동 시간, 난이도,
            최근 피드백과 최근 발송 로그를 한 번에 확인합니다.
          </p>
        </div>

        <div style={styles.subscriberStatusActionRow}>
          <a href="/admin/subscribers" style={styles.profileAdminLink}>
            구독자 상세
          </a>

          <a href="/profile" style={styles.profileAdminLinkSecondary}>
            재진단 화면
          </a>
        </div>
      </div>

      <div style={styles.subscriberStatusSummaryGrid}>
        <SummaryCard
          label="진단 완료"
          value={completeCount}
          help="4개 상태값이 모두 있는 최근 구독자"
          compact
        />
        <SummaryCard
          label="일부 진단"
          value={partialCount}
          help="상태값 일부만 있는 구독자"
          compact
        />
        <SummaryCard
          label="진단 부족"
          value={weakCount}
          help="상태값 보강이 필요한 구독자"
          compact
        />
        <SummaryCard
          label="최근 피드백 연결"
          value={feedbackLinkedCount}
          help="최근 피드백이 확인되는 구독자"
          compact
        />
        <SummaryCard
          label="최근 발송 연결"
          value={deliveryLinkedCount}
          help="최근 발송 로그가 확인되는 구독자"
          compact
        />
      </div>

      {subscribers.length === 0 ? (
        <p style={styles.emptyText}>최근 구독자 데이터가 없습니다.</p>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>상태</th>
                <th style={styles.th}>이메일</th>
                <th style={styles.th}>감정</th>
                <th style={styles.th}>목적</th>
                <th style={styles.th}>막힘</th>
                <th style={styles.th}>시간</th>
                <th style={styles.th}>난이도</th>
                <th style={styles.th}>최근 피드백</th>
                <th style={styles.th}>최근 발송</th>
                <th style={styles.th}>업데이트 확인</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((subscriber) => {
                const emailKey = normalizeEmailKey(subscriber.email);
                const recentFeedback = recentFeedbackByEmail.get(emailKey);
                const recentDeliveryLog = recentDeliveryLogByEmail.get(emailKey);

                return (
                  <tr key={subscriber.id}>
                    <td style={styles.td}>
                      <StatusBadge
                        label={getSubscriberStatusLabel(subscriber)}
                        tone={getSubscriberStatusTone(subscriber)}
                      />
                    </td>
                    <td style={styles.td}>
                      <strong>{subscriber.email}</strong>
                      <div style={styles.smallMuted}>
                        {subscriber.job_role || "직업/상황 미입력"}
                      </div>
                    </td>
                    <td style={styles.td}>{labelOf(subscriber.ai_emotion)}</td>
                    <td style={styles.td}>{labelOf(subscriber.ai_intent)}</td>
                    <td style={styles.td}>{labelOf(subscriber.blocker)}</td>
                    <td style={styles.td}>{labelOf(subscriber.action_time)}</td>
                    <td style={styles.td}>{labelOf(subscriber.difficulty)}</td>
                    <td style={styles.td}>
                      {recentFeedback ? (
                        <>
                          <strong>{labelOf(recentFeedback.feedback_type)}</strong>
                          <div style={styles.smallMuted}>
                            {formatDate(recentFeedback.created_at)}
                            {recentFeedback.newsletter_item_id
                              ? ` · #${recentFeedback.newsletter_item_id}`
                              : ""}
                          </div>
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td style={styles.td}>
                      {recentDeliveryLog ? (
                        <>
                          <StatusBadge
                            label={labelOf(recentDeliveryLog.status)}
                            tone={
                              recentDeliveryLog.status === "sent"
                                ? "green"
                                : "red"
                            }
                          />
                          <div style={styles.smallMuted}>
                            {formatDate(recentDeliveryLog.created_at)}
                            {recentDeliveryLog.newsletter_item_id
                              ? ` · #${recentDeliveryLog.newsletter_item_id}`
                              : ""}
                          </div>
                        </>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td style={styles.td}>
                      <div style={styles.smallMuted}>
                        가입 {formatDate(subscriber.created_at)}
                        <br />
                        갱신 {formatDate(subscriber.updated_at)}
                      </div>
                      <a
                        href={`/profile?email=${encodeURIComponent(
                          subscriber.email
                        )}`}
                        style={styles.smallActionLink}
                      >
                        재진단 링크
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function OperationChecklistPanel({ stats }: { stats: AdminStatsResult }) {
  const newsletterStats = stats.newsletterStats;
  const review = stats.operationReview;

  const activeItemCount = newsletterStats?.active ?? 0;
  const subscriberCount = stats.totalSubscribers ?? 0;
  const feedbackCount = stats.totalFeedbacks ?? 0;
  const recommendationCount = review?.nextContentRecommendations.length ?? 0;

  const recentFailedLogs = (stats.recentDeliveryLogs || []).filter(
    (log) => log.status !== "sent"
  );

  const checklistItems = useMemo(
    () =>
      [
        {
          title: "오늘 발송 가능한 활성 자료",
          value: `${activeItemCount.toLocaleString("ko-KR")}개`,
          status: activeItemCount > 0 ? "ready" : "blocked",
          help:
            activeItemCount > 0
              ? "발송 후보 자료가 있습니다."
              : "활성 자료가 없습니다. 뉴스 자료 등록에서 자료를 활성화하세요.",
          href: "/admin/newsletter-items",
          actionLabel: "자료 등록/관리",
        },
        {
          title: "구독자 상태 상세",
          value: "준비됨",
          status: subscriberCount > 0 ? "ready" : "warning",
          help:
            subscriberCount > 0
              ? "구독자별 상태, 피드백, 발송 로그를 상세 화면에서 확인할 수 있습니다."
              : "구독자가 생기면 상세 화면에서 상태를 확인할 수 있습니다.",
          href: "/admin/subscribers",
          actionLabel: "구독자 상세 열기",
        },
        {
          title: "구독자 수",
          value: `${subscriberCount.toLocaleString("ko-KR")}명`,
          status: subscriberCount > 0 ? "ready" : "blocked",
          help:
            subscriberCount > 0
              ? "발송 대상 구독자가 있습니다."
              : "구독자가 없습니다. 구독 신청 화면에서 테스트 구독자를 먼저 등록하세요.",
          href: "/",
          actionLabel: "구독 신청 화면",
        },
        {
          title: "발송 전 미리보기",
          value: "필수 확인",
          status:
            activeItemCount > 0 && subscriberCount > 0 ? "ready" : "warning",
          help:
            activeItemCount > 0 && subscriberCount > 0
              ? "전체 발송 전 구독자별 매칭 결과를 확인하세요."
              : "자료와 구독자가 준비된 뒤 미리보기를 확인하세요.",
          href: "/admin/send-preview",
          actionLabel: "미리보기 열기",
        },
        {
          title: "최근 실패 로그",
          value: `${recentFailedLogs.length.toLocaleString("ko-KR")}개`,
          status: recentFailedLogs.length === 0 ? "ready" : "warning",
          help:
            recentFailedLogs.length === 0
              ? "최근 발송 실패 로그가 없습니다."
              : "최근 실패/스킵 로그가 있습니다. 오류 메시지를 확인하세요.",
          href: "#delivery-logs",
          actionLabel: "발송 로그 확인",
        },
        {
          title: "피드백 수집 상태",
          value: `${feedbackCount.toLocaleString("ko-KR")}개`,
          status: feedbackCount > 0 ? "ready" : "warning",
          help:
            feedbackCount > 0
              ? "운영 회고에 사용할 피드백이 쌓이고 있습니다."
              : "아직 피드백이 없습니다. 테스트 발송 후 버튼 클릭 흐름을 확인하세요.",
          href: "#feedbacks",
          actionLabel: "피드백 확인",
        },
        {
          title: "다음 등록 추천 방향",
          value: `${recommendationCount.toLocaleString("ko-KR")}개`,
          status: recommendationCount > 0 ? "ready" : "warning",
          help:
            recommendationCount > 0
              ? "운영 회고 기반 다음 자료 방향이 생성되었습니다."
              : "피드백과 발송 로그가 더 쌓이면 추천 방향이 더 좋아집니다.",
          href: "#operation-review",
          actionLabel: "회고 확인",
        },
      ] as const,
    [
      activeItemCount,
      subscriberCount,
      recentFailedLogs.length,
      feedbackCount,
      recommendationCount,
    ]
  );

  const blockedCount = checklistItems.filter(
    (item) => item.status === "blocked"
  ).length;
  const warningCount = checklistItems.filter(
    (item) => item.status === "warning"
  ).length;

  const overallStatus =
    blockedCount > 0
      ? "발송 전 준비 필요"
      : warningCount > 0
      ? "발송 가능 · 보완 권장"
      : "운영 준비 완료";

  const overallHelp =
    blockedCount > 0
      ? "막힌 항목을 먼저 해결한 뒤 발송 전 미리보기를 확인하세요."
      : warningCount > 0
      ? "발송은 가능하지만, 노란색 항목을 확인하면 운영 안정성이 좋아집니다."
      : "자료, 구독자, 미리보기, 회고 흐름이 모두 준비되어 있습니다.";

  return (
    <section style={styles.checklistPanel}>
      <div style={styles.checklistHeader}>
        <div>
          <p style={styles.checklistBadge}>운영 체크리스트</p>
          <h2 style={styles.panelTitle}>오늘 발송 전 최종 점검</h2>
          <p style={styles.reviewDescription}>
            전체 발송 전에 자료, 구독자, 미리보기, 실패 로그, 피드백, 다음 등록
            방향을 한 번에 확인합니다.
          </p>
        </div>

        <div
          style={{
            ...styles.checklistStatusBadge,
            ...(blockedCount > 0
              ? styles.checklistStatusBlocked
              : warningCount > 0
              ? styles.checklistStatusWarning
              : styles.checklistStatusReady),
          }}
        >
          {overallStatus}
        </div>
      </div>

      <p style={styles.checklistOverallHelp}>{overallHelp}</p>

      <div style={styles.checklistGrid}>
        {checklistItems.map((item) => (
          <article key={item.title} style={styles.checklistItemCard}>
            <div style={styles.checklistItemTop}>
              <span
                style={{
                  ...styles.checklistIcon,
                  ...(item.status === "ready"
                    ? styles.checklistIconReady
                    : item.status === "warning"
                    ? styles.checklistIconWarning
                    : styles.checklistIconBlocked),
                }}
              >
                {item.status === "ready"
                  ? "✓"
                  : item.status === "warning"
                  ? "!"
                  : "×"}
              </span>

              <div>
                <p style={styles.checklistItemTitle}>{item.title}</p>
                <p style={styles.checklistItemValue}>{item.value}</p>
              </div>
            </div>

            <p style={styles.checklistItemHelp}>{item.help}</p>

            <a href={item.href} style={styles.checklistLink}>
              {item.actionLabel}
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

function OperationReviewPanel({ review }: { review: OperationReview }) {
  return (
    <section id="operation-review" style={styles.reviewPanel}>
      <div style={styles.reviewHeader}>
        <div>
          <p style={styles.reviewBadge}>운영 회고</p>
          <h2 style={styles.panelTitle}>이번 운영 요약</h2>
          <p style={styles.reviewDescription}>
            발송 로그와 피드백을 바탕으로 어떤 자료가 잘 먹혔고, 다음에 어떤
            자료를 더 등록해야 하는지 확인합니다.
          </p>
        </div>
      </div>

      <div style={styles.reviewSummaryGrid}>
        <SummaryCard
          label="발송 성공"
          value={review.sentLogCount}
          help="sent 발송 로그"
          compact
        />
        <SummaryCard
          label="전체 피드백"
          value={review.totalFeedbacks}
          help="자료 평가 + 실행 여부"
          compact
        />
        <SummaryCard
          label="실행해봄 비율"
          value={review.executionRate}
          help="실행 피드백 중 실행 비율"
          compact
        />
        <SummaryCard
          label="별로 비율"
          value={review.notRelevantRate}
          help="자료 평가 중 별로 비율"
          compact
        />
      </div>

      <div style={styles.reviewMetricLine}>
        <span>좋음 {review.usefulCount}</span>
        <span>더 깊게 {review.deeperCount}</span>
        <span>별로 {review.notRelevantCount}</span>
        <span>실행해봄 {review.actionDoneCount}</span>
        <span>실행안해봄 {review.actionNotDoneCount}</span>
        <span>실패 로그 {review.failedLogCount}</span>
      </div>

      <div style={styles.twoColumn}>
        <OperationReviewItemList
          title="잘 먹힌 자료"
          items={review.topPerformingItems}
          emptyText="아직 반응이 쌓인 자료가 없습니다."
          tone="good"
        />

        <OperationReviewItemList
          title="보완 필요한 자료"
          items={review.needsImprovementItems}
          emptyText="아직 뚜렷하게 보완이 필요한 자료가 없습니다."
          tone="warn"
        />
      </div>

      <div style={styles.recommendationBox}>
        <h3 style={styles.subTitle}>다음 등록 추천 방향</h3>

        {review.nextContentRecommendations.length === 0 ? (
          <p style={styles.emptyText}>아직 추천할 운영 데이터가 부족합니다.</p>
        ) : (
          <ol style={styles.recommendationList}>
            {review.nextContentRecommendations.map((recommendation) => (
              <li key={recommendation}>{recommendation}</li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function OperationReviewItemList({
  title,
  items,
  emptyText,
  tone,
}: {
  title: string;
  items: OperationReviewItem[];
  emptyText: string;
  tone: "good" | "warn";
}) {
  return (
    <section style={styles.reviewSubPanel}>
      <h3 style={styles.subTitle}>{title}</h3>

      {items.length === 0 ? (
        <p style={styles.emptyText}>{emptyText}</p>
      ) : (
        <div style={styles.reviewItemList}>
          {items.map((item) => (
            <article key={item.id} style={styles.reviewItemCard}>
              <div style={styles.reviewItemTop}>
                <div>
                  <p style={styles.reviewItemMeta}>
                    #{item.id} · {labelOf(item.category)} ·{" "}
                    {labelOf(item.difficulty)}
                  </p>
                  <h4 style={styles.reviewItemTitle}>
                    {item.title || "제목 없음"}
                  </h4>
                </div>

                <span
                  style={{
                    ...styles.reviewScoreBadge,
                    ...(tone === "good"
                      ? styles.reviewScoreGood
                      : styles.reviewScoreWarn),
                  }}
                >
                  점수 {item.score}
                </span>
              </div>

              <div style={styles.reviewItemStats}>
                <span>전체 {item.totalFeedbackCount}</span>
                <span>좋음 {item.usefulCount}</span>
                <span>더깊게 {item.deeperCount}</span>
                <span>별로 {item.notRelevantCount}</span>
                <span>실행 {item.actionDoneCount}</span>
                <span>미실행 {item.actionNotDoneCount}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function SummaryCard({
  label,
  value,
  help,
  compact = false,
}: {
  label: string;
  value: number;
  help: string;
  compact?: boolean;
}) {
  return (
    <div style={compact ? styles.summaryCardCompact : styles.summaryCard}>
      <p style={styles.summaryLabel}>{label}</p>
      <p style={styles.summaryValue}>{value.toLocaleString("ko-KR")}</p>
      <p style={styles.summaryHelp}>{help}</p>
    </div>
  );
}

function CountPanel({ title, rows }: { title: string; rows: CountRow[] }) {
  const total = getTotalFromRows(rows);
  const max = getMaxCount(rows);

  return (
    <section style={styles.panel}>
      <h2 style={styles.panelTitle}>{title}</h2>

      {rows.length === 0 ? (
        <p style={styles.emptyText}>표시할 데이터가 없습니다.</p>
      ) : (
        <div style={styles.countList}>
          {rows.map((row) => {
            const percent =
              total > 0 ? Math.round((row.count / total) * 100) : 0;
            const width = `${Math.max(6, (row.count / max) * 100)}%`;

            return (
              <div key={row.value} style={styles.countRow}>
                <div style={styles.countHeader}>
                  <span style={styles.countLabel}>{labelOf(row.value)}</span>
                  <span style={styles.countNumber}>
                    {row.count.toLocaleString("ko-KR")} · {percent}%
                  </span>
                </div>

                <div style={styles.progressTrack}>
                  <div style={{ ...styles.progressBar, width }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function BooleanPanel({
  title,
  counts,
  trueLabel,
  falseLabel,
}: {
  title: string;
  counts: BooleanCounts | undefined;
  trueLabel: string;
  falseLabel: string;
}) {
  const rows: CountRow[] = [
    { value: trueLabel, count: getBooleanCount(counts, "true") },
    { value: falseLabel, count: getBooleanCount(counts, "false") },
    { value: "미확인", count: getBooleanCount(counts, "unknown") },
  ];

  return <CountPanel title={title} rows={rows} />;
}

function SendResultPanel({ result }: { result: SendResult }) {
  const selectedItems = result.selectedItems || [];
  const sentDetails = result.sentDetails || [];
  const failedReasons = result.failedReasons || [];

  return (
    <section style={styles.sendResultCard}>
      <h2 style={styles.sectionTitle}>발송 결과</h2>

      <div style={result.ok ? styles.successBox : styles.warningBox}>
        {result.message || (result.ok ? "발송 완료" : "발송 실패")}
      </div>

      <div style={styles.summaryGrid}>
        <SummaryCard
          label="성공"
          value={result.successCount ?? 0}
          help="발송 성공 구독자 수"
          compact
        />
        <SummaryCard
          label="실패"
          value={result.failCount ?? 0}
          help="발송 실패 수"
          compact
        />
        <SummaryCard
          label="스킵"
          value={result.skippedSubscriberCount ?? 0}
          help="이미 받은 자료만 남아 제외"
          compact
        />
        <SummaryCard
          label="선택 자료"
          value={result.selectedItemIds?.length ?? selectedItems.length}
          help="이번 발송 후보 자료"
          compact
        />
      </div>

      {result.note && <p style={styles.note}>{result.note}</p>}

      {selectedItems.length > 0 && (
        <div style={styles.subSection}>
          <h3 style={styles.subTitle}>선택된 자료</h3>
          <div style={styles.miniList}>
            {selectedItems.map((item) => (
              <div key={item.id} style={styles.miniCard}>
                <p style={styles.miniTitle}>
                  #{item.id} {item.title || "제목 없음"}
                </p>
                {typeof item.score === "number" && (
                  <p style={styles.miniText}>매칭 점수: {item.score}</p>
                )}
                {item.matchedReasons && item.matchedReasons.length > 0 && (
                  <p style={styles.miniText}>
                    매칭 이유: {item.matchedReasons.join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {sentDetails.length > 0 && (
        <div style={styles.subSection}>
          <h3 style={styles.subTitle}>구독자별 발송 상세</h3>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>이메일</th>
                  <th style={styles.th}>재진단</th>
                  <th style={styles.th}>자료 ID</th>
                  <th style={styles.th}>점수</th>
                </tr>
              </thead>
              <tbody>
                {sentDetails.map((detail) => (
                  <tr
                    key={`${detail.subscriber_email}-${detail.item_ids.join(
                      "-"
                    )}`}
                  >
                    <td style={styles.td}>{detail.subscriber_email}</td>
                    <td style={styles.td}>
                      {detail.profile_url ? (
                        <a href={detail.profile_url} style={styles.smallActionLink}>
                          재진단 링크
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td style={styles.td}>{detail.item_ids.join(", ")}</td>
                    <td style={styles.td}>
                      {detail.scores && detail.scores.length > 0 ? (
                        <div style={styles.scoreList}>
                          {detail.scores.map((score) => (
                            <div key={score.item_id}>
                              #{score.item_id}: {score.score}
                              {score.matched_reasons?.length
                                ? ` · ${score.matched_reasons.join(", ")}`
                                : ""}
                            </div>
                          ))}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {failedReasons.length > 0 && (
        <div style={styles.subSection}>
          <h3 style={styles.subTitle}>실패/스킵 사유</h3>
          <ul style={styles.errorList}>
            {failedReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function RecentNewsletterItemsTable({
  items,
}: {
  items: RecentNewsletterItem[];
}) {
  if (items.length === 0) {
    return <p style={styles.emptyText}>최근 등록 자료가 없습니다.</p>;
  }

  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>제목</th>
            <th style={styles.th}>카테고리</th>
            <th style={styles.th}>난이도</th>
            <th style={styles.th}>상태</th>
            <th style={styles.th}>피드백</th>
            <th style={styles.th}>등록일</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td style={styles.td}>#{item.id}</td>
              <td style={styles.td}>
                <strong>{item.title || "제목 없음"}</strong>
                <div style={styles.smallMuted}>
                  {[
                    item.target_ai_emotion &&
                      `감정 ${labelOf(item.target_ai_emotion)}`,
                    item.target_ai_intent &&
                      `목적 ${labelOf(item.target_ai_intent)}`,
                    item.target_blocker &&
                      `막힘 ${labelOf(item.target_blocker)}`,
                    item.target_action_time &&
                      `시간 ${labelOf(item.target_action_time)}`,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "전체 대상"}
                </div>
              </td>
              <td style={styles.td}>{labelOf(item.category)}</td>
              <td style={styles.td}>{labelOf(item.difficulty)}</td>
              <td style={styles.td}>
                <StatusBadge
                  label={item.is_active ? "활성" : "비활성"}
                  tone={item.is_active ? "green" : "gray"}
                />
              </td>
              <td style={styles.td}>
                전체 {item.feedback_total_count ?? 0}
                <div style={styles.smallMuted}>
                  좋음 {item.feedback_useful_count ?? 0} · 더깊게{" "}
                  {item.feedback_deeper_count ?? 0} · 별로{" "}
                  {item.feedback_not_relevant_count ?? 0}
                  <br />
                  실행 {item.feedback_action_done_count ?? 0} · 미실행{" "}
                  {item.feedback_action_not_done_count ?? 0}
                </div>
              </td>
              <td style={styles.td}>{formatDate(item.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecentFeedbackTable({ feedbacks }: { feedbacks: RecentFeedback[] }) {
  if (feedbacks.length === 0) {
    return <p style={styles.emptyText}>최근 피드백이 없습니다.</p>;
  }

  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>시간</th>
            <th style={styles.th}>이메일</th>
            <th style={styles.th}>자료</th>
            <th style={styles.th}>피드백</th>
            <th style={styles.th}>실행</th>
            <th style={styles.th}>메모</th>
          </tr>
        </thead>
        <tbody>
          {feedbacks.map((feedback) => (
            <tr key={feedback.id}>
              <td style={styles.td}>{formatDate(feedback.created_at)}</td>
              <td style={styles.td}>{feedback.subscriber_email || "-"}</td>
              <td style={styles.td}>
                {feedback.newsletter_item_id
                  ? `#${feedback.newsletter_item_id}`
                  : "-"}
                <div style={styles.smallMuted}>
                  {feedback.newsletter_item_title || ""}
                </div>
              </td>
              <td style={styles.td}>{labelOf(feedback.feedback_type)}</td>
              <td style={styles.td}>
                {feedback.action_done === true
                  ? "실행함"
                  : feedback.action_done === false
                  ? "실행 안 함"
                  : "-"}
              </td>
              <td style={styles.td}>{feedback.free_text || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecentDeliveryLogsTable({ logs }: { logs: RecentDeliveryLog[] }) {
  if (logs.length === 0) {
    return <p style={styles.emptyText}>최근 발송 로그가 없습니다.</p>;
  }

  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>시간</th>
            <th style={styles.th}>이메일</th>
            <th style={styles.th}>자료</th>
            <th style={styles.th}>상태</th>
            <th style={styles.th}>오류</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td style={styles.td}>{formatDate(log.created_at)}</td>
              <td style={styles.td}>{log.subscriber_email}</td>
              <td style={styles.td}>
                {log.newsletter_item_id ? `#${log.newsletter_item_id}` : "-"}
                <div style={styles.smallMuted}>
                  {log.newsletter_item_title || ""}
                </div>
              </td>
              <td style={styles.td}>
                <StatusBadge
                  label={labelOf(log.status)}
                  tone={log.status === "sent" ? "green" : "red"}
                />
              </td>
              <td style={styles.td}>{log.error_message || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecentSubscribersTable({
  subscribers,
}: {
  subscribers: RecentSubscriber[];
}) {
  if (subscribers.length === 0) {
    return <p style={styles.emptyText}>최근 구독자가 없습니다.</p>;
  }

  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>가입일</th>
            <th style={styles.th}>이메일</th>
            <th style={styles.th}>직업/상황</th>
            <th style={styles.th}>감정</th>
            <th style={styles.th}>목적</th>
            <th style={styles.th}>막힘</th>
            <th style={styles.th}>시간</th>
            <th style={styles.th}>난이도</th>
            <th style={styles.th}>페르소나</th>
            <th style={styles.th}>갱신</th>
          </tr>
        </thead>
        <tbody>
          {subscribers.map((subscriber) => (
            <tr key={subscriber.id}>
              <td style={styles.td}>{formatDate(subscriber.created_at)}</td>
              <td style={styles.td}>{subscriber.email}</td>
              <td style={styles.td}>{subscriber.job_role || "-"}</td>
              <td style={styles.td}>{labelOf(subscriber.ai_emotion)}</td>
              <td style={styles.td}>{labelOf(subscriber.ai_intent)}</td>
              <td style={styles.td}>{labelOf(subscriber.blocker)}</td>
              <td style={styles.td}>{labelOf(subscriber.action_time)}</td>
              <td style={styles.td}>{labelOf(subscriber.difficulty)}</td>
              <td style={styles.td}>{subscriber.persona_type || "-"}</td>
              <td style={styles.td}>{formatDate(subscriber.updated_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "green" | "red" | "gray";
}) {
  const style =
    tone === "green"
      ? {
          background: "#ecfdf5",
          color: "#047857",
          border: "1px solid #a7f3d0",
        }
      : tone === "red"
      ? {
          background: "#fef2f2",
          color: "#b91c1c",
          border: "1px solid #fecaca",
        }
      : {
          background: "#f3f4f6",
          color: "#4b5563",
          border: "1px solid #d1d5db",
        };

  return <span style={{ ...styles.statusBadge, ...style }}>{label}</span>;
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
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
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
  blackButton: {
    height: 46,
    border: "none",
    borderRadius: 12,
    padding: "0 16px",
    background: "#111827",
    color: "#ffffff",
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
  linkCard: {
    maxWidth: 1180,
    margin: "0 auto 24px",
    background: "#ffffff",
    color: "#111827",
    borderRadius: 24,
    padding: 28,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 22,
    letterSpacing: "-0.03em",
  },
  linkGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 18,
  },
  adminLink: {
    display: "inline-flex",
    alignItems: "center",
    height: 46,
    padding: "0 16px",
    borderRadius: 12,
    background: "#f3f4f6",
    color: "#111827",
    textDecoration: "none",
    fontSize: 15,
    fontWeight: 900,
  },
  featuredAdminLink: {
    display: "inline-flex",
    alignItems: "center",
    height: 46,
    padding: "0 16px",
    borderRadius: 12,
    background: "#2563eb",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: 15,
    fontWeight: 900,
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
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
    marginBottom: 18,
  },
  summaryCard: {
    background: "#ffffff",
    color: "#111827",
    borderRadius: 22,
    padding: 22,
    boxShadow: "0 14px 34px rgba(15, 23, 42, 0.12)",
  },
  summaryCardCompact: {
    background: "#f8fafc",
    color: "#111827",
    borderRadius: 18,
    padding: 18,
    border: "1px solid #e5e7eb",
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
  sendResultCard: {
    maxWidth: 1180,
    margin: "0 auto 24px",
    background: "#ffffff",
    color: "#111827",
    borderRadius: 24,
    padding: 28,
    boxShadow: "0 16px 40px rgba(0,0,0,0.18)",
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
  twoColumn: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 18,
  },
  panel: {
    background: "#ffffff",
    color: "#111827",
    borderRadius: 22,
    padding: 22,
    boxShadow: "0 14px 34px rgba(15, 23, 42, 0.12)",
  },
  panelTitle: {
    margin: "0 0 16px",
    fontSize: 21,
    letterSpacing: "-0.03em",
  },
  countList: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  countRow: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  countHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  countLabel: {
    fontSize: 14,
    fontWeight: 900,
    color: "#111827",
  },
  countNumber: {
    fontSize: 13,
    fontWeight: 800,
    color: "#6b7280",
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    background: "#f3f4f6",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 999,
    background: "#2563eb",
  },
  tableWrap: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 860,
  },
  th: {
    textAlign: "left",
    padding: "12px 10px",
    borderBottom: "1px solid #e5e7eb",
    color: "#6b7280",
    fontSize: 13,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  td: {
    padding: "12px 10px",
    borderBottom: "1px solid #f3f4f6",
    color: "#111827",
    fontSize: 13,
    lineHeight: 1.5,
    verticalAlign: "top",
    whiteSpace: "nowrap",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "4px 8px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
  },
  emptyText: {
    margin: 0,
    color: "#6b7280",
    fontSize: 14,
  },
  smallMuted: {
    marginTop: 4,
    color: "#6b7280",
    fontSize: 12,
    lineHeight: 1.5,
    whiteSpace: "normal",
    maxWidth: 320,
  },
  note: {
    margin: "14px 0 0",
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 1.6,
  },
  subSection: {
    marginTop: 18,
  },
  subTitle: {
    margin: "0 0 10px",
    fontSize: 16,
    letterSpacing: "-0.02em",
  },
  miniList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  miniCard: {
    padding: 14,
    borderRadius: 14,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
  },
  miniTitle: {
    margin: 0,
    color: "#111827",
    fontSize: 14,
    fontWeight: 900,
  },
  miniText: {
    margin: "6px 0 0",
    color: "#4b5563",
    fontSize: 13,
    lineHeight: 1.5,
  },
  scoreList: {
    marginTop: 8,
  },
  errorList: {
    margin: 0,
    paddingLeft: 20,
    color: "#991b1b",
    fontSize: 13,
    lineHeight: 1.7,
  },
  checklistPanel: {
    background: "#ffffff",
    color: "#111827",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 16px 40px rgba(0,0,0,0.18)",
    border: "1px solid #bbf7d0",
  },
  checklistHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    marginBottom: 14,
  },
  checklistBadge: {
    display: "inline-flex",
    margin: "0 0 10px",
    padding: "6px 10px",
    borderRadius: 999,
    background: "#ecfdf5",
    color: "#047857",
    border: "1px solid #a7f3d0",
    fontSize: 12,
    fontWeight: 900,
  },
  checklistStatusBadge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
    padding: "0 12px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  checklistStatusReady: {
    background: "#ecfdf5",
    color: "#047857",
    border: "1px solid #a7f3d0",
  },
  checklistStatusWarning: {
    background: "#fffbeb",
    color: "#92400e",
    border: "1px solid #fcd34d",
  },
  checklistStatusBlocked: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
  },
  checklistOverallHelp: {
    margin: "0 0 16px",
    color: "#374151",
    fontSize: 14,
    lineHeight: 1.6,
    fontWeight: 800,
  },
  checklistGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: 12,
  },
  checklistItemCard: {
    padding: 16,
    borderRadius: 18,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
  },
  checklistItemTop: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
  },
  checklistIcon: {
    width: 24,
    height: 24,
    borderRadius: 999,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontSize: 13,
    fontWeight: 900,
  },
  checklistIconReady: {
    background: "#ecfdf5",
    color: "#047857",
  },
  checklistIconWarning: {
    background: "#fffbeb",
    color: "#92400e",
  },
  checklistIconBlocked: {
    background: "#fef2f2",
    color: "#b91c1c",
  },
  checklistItemTitle: {
    margin: 0,
    color: "#111827",
    fontSize: 14,
    fontWeight: 900,
  },
  checklistItemValue: {
    margin: "4px 0 0",
    color: "#111827",
    fontSize: 22,
    fontWeight: 900,
    letterSpacing: "-0.03em",
  },
  checklistItemHelp: {
    margin: "12px 0 0",
    color: "#4b5563",
    fontSize: 13,
    lineHeight: 1.6,
    fontWeight: 700,
  },
  checklistLink: {
    display: "inline-flex",
    alignItems: "center",
    height: 34,
    marginTop: 12,
    padding: "0 10px",
    borderRadius: 10,
    background: "#111827",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 900,
  },
  reviewPanel: {
    background: "#ffffff",
    color: "#111827",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 16px 40px rgba(0,0,0,0.18)",
    border: "1px solid #dbeafe",
  },
  reviewHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    marginBottom: 18,
  },
  reviewBadge: {
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
  reviewDescription: {
    margin: "8px 0 0",
    color: "#6b7280",
    fontSize: 14,
    lineHeight: 1.6,
  },
  reviewSummaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
    marginBottom: 14,
  },
  reviewMetricLine: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    margin: "0 0 18px",
    color: "#374151",
    fontSize: 13,
    fontWeight: 900,
  },
  reviewSubPanel: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    padding: 16,
  },
  reviewItemList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  reviewItemCard: {
    padding: 14,
    borderRadius: 14,
    background: "#ffffff",
    border: "1px solid #e5e7eb",
  },
  reviewItemTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  reviewItemMeta: {
    margin: "0 0 6px",
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 800,
  },
  reviewItemTitle: {
    margin: 0,
    color: "#111827",
    fontSize: 14,
    lineHeight: 1.45,
    letterSpacing: "-0.02em",
  },
  reviewScoreBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 9px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  reviewScoreGood: {
    background: "#ecfdf5",
    color: "#047857",
    border: "1px solid #a7f3d0",
  },
  reviewScoreWarn: {
    background: "#fffbeb",
    color: "#92400e",
    border: "1px solid #fcd34d",
  },
  reviewItemStats: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
    color: "#4b5563",
    fontSize: 12,
    fontWeight: 800,
  },
  recommendationBox: {
    marginTop: 18,
    padding: 16,
    borderRadius: 18,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
  },
  recommendationList: {
    margin: "8px 0 0",
    paddingLeft: 20,
    color: "#374151",
    fontSize: 14,
    lineHeight: 1.75,
    fontWeight: 700,
  },
  subscriberStatusPanel: {
    background: "#ffffff",
    color: "#111827",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 16px 40px rgba(0,0,0,0.18)",
    border: "1px solid #bfdbfe",
  },
  subscriberStatusHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    marginBottom: 18,
  },
  subscriberStatusBadge: {
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
  subscriberStatusSummaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 12,
    marginBottom: 18,
  },
  subscriberStatusActionRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-end",
  },
  profileAdminLink: {
    display: "inline-flex",
    alignItems: "center",
    height: 40,
    padding: "0 12px",
    borderRadius: 12,
    background: "#2563eb",
    color: "#ffffff",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  profileAdminLinkSecondary: {
    display: "inline-flex",
    alignItems: "center",
    height: 40,
    padding: "0 12px",
    borderRadius: 12,
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  smallActionLink: {
    display: "inline-flex",
    alignItems: "center",
    height: 30,
    marginTop: 6,
    padding: "0 9px",
    borderRadius: 9,
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
    textDecoration: "none",
    fontSize: 12,
    fontWeight: 900,
    whiteSpace: "nowrap",
  },
  buildRequestPanel: {
    maxWidth: 1180,
    margin: "0 auto 24px",
    background: "#ffffff",
    color: "#111827",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 16px 40px rgba(0,0,0,0.18)",
    border: "1px solid #e9d5ff",
  },
  buildRequestHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    marginBottom: 16,
  },
  buildRequestBadge: {
    display: "inline-flex",
    margin: "0 0 10px",
    padding: "6px 10px",
    borderRadius: 999,
    background: "#faf5ff",
    color: "#7e22ce",
    border: "1px solid #e9d5ff",
    fontSize: 12,
    fontWeight: 900,
  },
  buildRequestCountBox: {
    minWidth: 120,
    padding: 14,
    borderRadius: 18,
    background: "#faf5ff",
    border: "1px solid #e9d5ff",
    textAlign: "right",
  },
  buildRequestCount: {
    display: "block",
    color: "#581c87",
    fontSize: 30,
    lineHeight: 1,
    fontWeight: 900,
    letterSpacing: "-0.04em",
  },
  buildRequestCountLabel: {
    display: "block",
    marginTop: 6,
    color: "#7e22ce",
    fontSize: 12,
    fontWeight: 900,
  },
  buildRequestMessage: {
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    background: "#fafafa",
    border: "1px solid #e5e7eb",
    color: "#374151",
    fontSize: 13,
    lineHeight: 1.6,
    fontWeight: 800,
  },
  longTextCell: {
    maxWidth: 280,
    whiteSpace: "normal",
    color: "#374151",
    fontSize: 13,
    lineHeight: 1.6,
  },
  debugSection: {
    maxWidth: 1180,
    margin: "24px auto 0",
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