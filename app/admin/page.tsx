"use client";

import { useState } from "react";

type PersonaCount = {
  persona: string;
  count: number;
};

type FeedbackCount = {
  type: string;
  count: number;
};

type Subscriber = {
  id: string;
  email: string;
  ai_emotion: string | null;
  ai_intent: string | null;
  blocker: string | null;
  action_time: string | null;
  persona_type: string | null;
  created_at: string;
};

type Feedback = {
  id: number;
  subscriber_email: string | null;
  feedback_type: string | null;
  action_done: boolean | null;
  free_text: string | null;
  created_at: string;
};

type AdminStats = {
  totalSubscribers: number;
  totalFeedbacks: number;
  personaCounts: PersonaCount[];
  feedbackCounts: FeedbackCount[];
  recentSubscribers: Subscriber[];
  recentFeedbacks: Feedback[];
};

function getFeedbackLabel(type: string | null) {
  switch (type) {
    case "done":
      return "해봤다";
    case "hard":
      return "어렵다";
    case "not_interested":
      return "관심 없다";
    case "deeper":
      return "더 깊게 알고 싶다";
    case "less_anxious":
      return "불안이 줄었다";
    case "different":
      return "다른 방향 필요";
    default:
      return "알 수 없음";
  }
}

function getValueLabel(value: string | null) {
  if (!value) return "-";

  const labels: Record<string, string> = {
    curious: "호기심",
    expectation: "기대감",
    anxious: "불안",
    fatigue: "피로감",
    skeptical: "회의감",
    unknown: "잘 모르겠음",

    work_efficiency: "업무 효율",
    service_building: "서비스 만들기",
    study: "공부",
    creation: "창작",
    money: "돈/사업 기회",
    avoid: "피하고 싶음",
    not_sure: "아직 모름",

    too_much_information: "정보 과잉",
    dont_know_start: "시작점 모름",
    too_technical: "기술이 어려움",
    no_time: "시간 부족",
    fear: "뒤처질 불안",
    no_need: "필요성 모름",

    "10min": "10분",
    "30min": "30분",
    "2hours": "2시간",
    weekend: "주말 반나절",
  };

  return labels[value] || value;
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString("ko-KR");
  } catch {
    return value;
  }
}

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [message, setMessage] = useState("");
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const loadStats = async () => {
    setMessage("");
    setIsLoadingStats(true);

    try {
      const response = await fetch(
        `/api/admin-stats?secret=${encodeURIComponent(secret)}`
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "관리자 통계 조회에 실패했습니다.");
        setIsLoadingStats(false);
        return;
      }

      setStats(data);
      setMessage("관리자 데이터를 불러왔습니다.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setMessage(`관리자 통계 조회 중 오류가 발생했습니다. ${errorMessage}`);
    }

    setIsLoadingStats(false);
  };

  const sendNewsletter = async () => {
    const confirmed = window.confirm(
      "현재 구독자들에게 AI-FU 브리프를 발송할까요?"
    );

    if (!confirmed) return;

    setMessage("");
    setIsSending(true);

    try {
      const response = await fetch(
        `/api/send-newsletter?secret=${encodeURIComponent(secret)}`
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "브리프 발송에 실패했습니다.");
        setIsSending(false);
        return;
      }

      setMessage(data.message || "브리프 발송이 완료되었습니다.");
      await loadStats();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setMessage(`브리프 발송 중 오류가 발생했습니다. ${errorMessage}`);
    }

    setIsSending(false);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        padding: "40px 16px",
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
        }}
      >
        <section
          style={{
            marginBottom: 28,
          }}
        >
          <p
            style={{
              display: "inline-block",
              background: "rgba(37,99,235,0.20)",
              color: "#93c5fd",
              border: "1px solid rgba(147,197,253,0.35)",
              borderRadius: 999,
              padding: "8px 14px",
              fontSize: 13,
              fontWeight: 900,
              marginBottom: 14,
            }}
          >
            AI-FU Admin
          </p>

          <h1
            style={{
              fontSize: 42,
              lineHeight: 1.15,
              letterSpacing: "-0.04em",
              margin: "0 0 12px 0",
            }}
          >
            관리자 대시보드
          </h1>

          <p
            style={{
              color: "#cbd5e1",
              fontSize: 16,
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            구독자 상태, persona 분포, 피드백 반응, 브리프 발송을 한 곳에서
            확인합니다.
          </p>
        </section>

        <section
          style={{
            background: "white",
            color: "#111827",
            borderRadius: 24,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <label
            style={{
              display: "block",
              fontSize: 14,
              fontWeight: 800,
              marginBottom: 8,
            }}
          >
            ADMIN_SECRET
          </label>

          <input
            type="password"
            placeholder="ADMIN_SECRET 값을 입력하세요"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            style={{
              width: "100%",
              border: "1px solid #d1d5db",
              borderRadius: 12,
              padding: "13px 14px",
              fontSize: 15,
              marginBottom: 14,
            }}
          />

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <button
              onClick={loadStats}
              disabled={isLoadingStats || !secret}
              style={{
                border: "none",
                borderRadius: 12,
                padding: "13px 16px",
                background: isLoadingStats || !secret ? "#9ca3af" : "#2563eb",
                color: "white",
                fontSize: 15,
                fontWeight: 900,
                cursor: isLoadingStats || !secret ? "not-allowed" : "pointer",
              }}
            >
              {isLoadingStats ? "불러오는 중..." : "관리자 데이터 불러오기"}
            </button>

            <button
              onClick={sendNewsletter}
              disabled={isSending || !secret}
              style={{
                border: "none",
                borderRadius: 12,
                padding: "13px 16px",
                background: isSending || !secret ? "#9ca3af" : "#059669",
                color: "white",
                fontSize: 15,
                fontWeight: 900,
                cursor: isSending || !secret ? "not-allowed" : "pointer",
              }}
            >
              {isSending ? "발송 중..." : "AI-FU 브리프 발송"}
            </button>
          </div>

          {message && (
            <div
              style={{
                marginTop: 16,
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 14,
                fontSize: 14,
                fontWeight: 800,
                color: "#374151",
              }}
            >
              {message}
            </div>
          )}
        </section>

        {stats && (
          <>
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 16,
                marginBottom: 24,
              }}
            >
              <StatCard title="총 구독자" value={stats.totalSubscribers} />
              <StatCard title="최근 피드백" value={stats.totalFeedbacks} />
              <StatCard
                title="대표 Persona"
                value={stats.personaCounts[0]?.persona || "-"}
              />
              <StatCard
                title="대표 반응"
                value={getFeedbackLabel(stats.feedbackCounts[0]?.type || null)}
              />
            </section>

            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 16,
                marginBottom: 24,
              }}
            >
              <Panel title="Persona 분포">
                {stats.personaCounts.length === 0 ? (
                  <EmptyText text="아직 persona 데이터가 없습니다." />
                ) : (
                  stats.personaCounts.map((item) => (
                    <BarRow
                      key={item.persona}
                      label={item.persona}
                      value={item.count}
                      max={Math.max(
                        ...stats.personaCounts.map((count) => count.count)
                      )}
                    />
                  ))
                )}
              </Panel>

              <Panel title="피드백 분포">
                {stats.feedbackCounts.length === 0 ? (
                  <EmptyText text="아직 피드백 데이터가 없습니다." />
                ) : (
                  stats.feedbackCounts.map((item) => (
                    <BarRow
                      key={item.type}
                      label={getFeedbackLabel(item.type)}
                      value={item.count}
                      max={Math.max(
                        ...stats.feedbackCounts.map((count) => count.count)
                      )}
                    />
                  ))
                )}
              </Panel>
            </section>

            <section
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: 16,
              }}
            >
              <Panel title="최근 구독자">
                {stats.recentSubscribers.length === 0 ? (
                  <EmptyText text="아직 구독자가 없습니다." />
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: 14,
                      }}
                    >
                      <thead>
                        <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                          <TableHeader text="이메일" />
                          <TableHeader text="Persona" />
                          <TableHeader text="감정" />
                          <TableHeader text="목적" />
                          <TableHeader text="막힘" />
                          <TableHeader text="시간" />
                          <TableHeader text="가입일" />
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentSubscribers.map((subscriber) => (
                          <tr
                            key={subscriber.id}
                            style={{ borderBottom: "1px solid #f3f4f6" }}
                          >
                            <TableCell text={subscriber.email} />
                            <TableCell text={subscriber.persona_type || "-"} />
                            <TableCell
                              text={getValueLabel(subscriber.ai_emotion)}
                            />
                            <TableCell
                              text={getValueLabel(subscriber.ai_intent)}
                            />
                            <TableCell
                              text={getValueLabel(subscriber.blocker)}
                            />
                            <TableCell
                              text={getValueLabel(subscriber.action_time)}
                            />
                            <TableCell text={formatDate(subscriber.created_at)} />
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>

              <Panel title="최근 피드백">
                {stats.recentFeedbacks.length === 0 ? (
                  <EmptyText text="아직 피드백이 없습니다." />
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        fontSize: 14,
                      }}
                    >
                      <thead>
                        <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                          <TableHeader text="이메일" />
                          <TableHeader text="피드백" />
                          <TableHeader text="Action 완료" />
                          <TableHeader text="작성일" />
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentFeedbacks.map((feedback) => (
                          <tr
                            key={feedback.id}
                            style={{ borderBottom: "1px solid #f3f4f6" }}
                          >
                            <TableCell text={feedback.subscriber_email || "-"} />
                            <TableCell
                              text={getFeedbackLabel(feedback.feedback_type)}
                            />
                            <TableCell
                              text={feedback.action_done ? "예" : "아니오"}
                            />
                            <TableCell text={formatDate(feedback.created_at)} />
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div
      style={{
        background: "white",
        color: "#111827",
        borderRadius: 20,
        padding: 22,
      }}
    >
      <div
        style={{
          fontSize: 13,
          color: "#6b7280",
          fontWeight: 800,
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 30,
          fontWeight: 900,
          letterSpacing: "-0.03em",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "white",
        color: "#111827",
        borderRadius: 20,
        padding: 22,
      }}
    >
      <h2
        style={{
          fontSize: 20,
          fontWeight: 900,
          margin: "0 0 16px 0",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function BarRow({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          fontSize: 14,
          marginBottom: 6,
        }}
      >
        <strong>{label}</strong>
        <span>{value}</span>
      </div>
      <div
        style={{
          height: 10,
          background: "#e5e7eb",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${percent}%`,
            background: "#2563eb",
            borderRadius: 999,
          }}
        />
      </div>
    </div>
  );
}

function EmptyText({ text }: { text: string }) {
  return (
    <p
      style={{
        color: "#6b7280",
        fontSize: 14,
        lineHeight: 1.7,
        margin: 0,
      }}
    >
      {text}
    </p>
  );
}

function TableHeader({ text }: { text: string }) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: "10px 8px",
        fontSize: 13,
        color: "#6b7280",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </th>
  );
}

function TableCell({ text }: { text: string }) {
  return (
    <td
      style={{
        padding: "12px 8px",
        color: "#374151",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </td>
  );
}