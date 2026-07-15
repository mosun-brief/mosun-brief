"use client";

import { useEffect, useState } from "react";
import type { CSSProperties, FormEvent } from "react";

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

type PatchResult = {
  ok?: boolean;
  message?: string;
  request?: BuildConsultationRequest;
  rawText?: string;
};

const STATUS_OPTIONS = [
  { value: "pending", label: "대기" },
  { value: "reviewing", label: "검토중" },
  { value: "done", label: "완료" },
  { value: "rejected", label: "보류" },
];

function labelOfStatus(status: string | null | undefined) {
  if (status === "pending") return "대기";
  if (status === "reviewing") return "검토중";
  if (status === "done") return "완료";
  if (status === "rejected") return "보류";
  return "미확인";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString("ko-KR");
  } catch {
    return value;
  }
}

async function readListResponse(
  response: Response
): Promise<BuildConsultationListResult> {
  const text = await response.text();

  if (!text) {
    return {
      ok: false,
      message: `빈 응답을 받았습니다. status=${response.status}`,
    };
  }

  try {
    return JSON.parse(text) as BuildConsultationListResult;
  } catch {
    return {
      ok: false,
      message: `JSON이 아닌 응답을 받았습니다. status=${response.status}`,
      rawText: text.slice(0, 1000),
    };
  }
}

async function readPatchResponse(response: Response): Promise<PatchResult> {
  const text = await response.text();

  if (!text) {
    return {
      ok: false,
      message: `빈 응답을 받았습니다. status=${response.status}`,
    };
  }

  try {
    return JSON.parse(text) as PatchResult;
  } catch {
    return {
      ok: false,
      message: `JSON이 아닌 응답을 받았습니다. status=${response.status}`,
      rawText: text.slice(0, 1000),
    };
  }
}

export default function BuildRequestsAdminPage() {
  const [adminSecret, setAdminSecret] = useState("");
  const [requests, setRequests] = useState<BuildConsultationRequest[]>([]);
  const [statusById, setStatusById] = useState<Record<string, string>>({});
  const [noteById, setNoteById] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [debugText, setDebugText] = useState("");
  const [showDebug, setShowDebug] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const savedSecret = window.sessionStorage.getItem("aifu_admin_secret") || "";
    setAdminSecret(savedSecret);

    if (savedSecret) {
      loadRequests(savedSecret);
    }
  }, []);

  function syncEditableState(nextRequests: BuildConsultationRequest[]) {
    const nextStatusById: Record<string, string> = {};
    const nextNoteById: Record<string, string> = {};

    nextRequests.forEach((request) => {
      nextStatusById[request.id] = request.status || "pending";
      nextNoteById[request.id] = request.admin_note || "";
    });

    setStatusById(nextStatusById);
    setNoteById(nextNoteById);
  }

  async function loadRequests(secret = adminSecret.trim()) {
    if (!secret) {
      setMessage("ADMIN_SECRET을 입력해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/build-consultation", {
        method: "GET",
        headers: {
          "x-admin-secret": secret,
        },
      });

      const result = await readListResponse(response);
      setDebugText(JSON.stringify(result, null, 2));

      if (!response.ok || !result.ok) {
        setRequests([]);
        setMessage(result.message || "상담 신청 목록을 불러오지 못했습니다.");
        return;
      }

      const nextRequests = result.requests || [];
      setRequests(nextRequests);
      syncEditableState(nextRequests);
      setMessage(result.message || "상담 신청 목록을 불러왔습니다.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setMessage(`상담 신청 목록 로딩 중 오류가 발생했습니다: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }

  function saveAdminSecret(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const secret = adminSecret.trim();

    if (!secret) {
      setMessage("ADMIN_SECRET을 입력해주세요.");
      return;
    }

    window.sessionStorage.setItem("aifu_admin_secret", secret);
    setMessage("ADMIN_SECRET이 저장되었습니다.");
    loadRequests(secret);
  }

  async function saveRequest(requestId: string) {
    const secret = adminSecret.trim();

    if (!secret) {
      setMessage("ADMIN_SECRET을 입력해주세요.");
      return;
    }

    const nextStatus = statusById[requestId] || "pending";
    const nextNote = noteById[requestId] || "";

    setSavingId(requestId);
    setMessage("");

    try {
      const response = await fetch("/api/build-consultation", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": secret,
        },
        body: JSON.stringify({
          id: requestId,
          status: nextStatus,
          admin_note: nextNote,
        }),
      });

      const result = await readPatchResponse(response);
      setDebugText(JSON.stringify(result, null, 2));

      if (!response.ok || !result.ok || !result.request) {
        setMessage(result.message || "상담 신청 상태 저장에 실패했습니다.");
        return;
      }

      const updatedRequest = result.request;

      setRequests((prev) =>
        prev.map((request) =>
          request.id === requestId ? updatedRequest : request
        )
      );

      setStatusById((prev) => ({
        ...prev,
        [requestId]: updatedRequest.status || "pending",
      }));

      setNoteById((prev) => ({
        ...prev,
        [requestId]: updatedRequest.admin_note || "",
      }));

      setMessage(result.message || "상담 신청 상태가 저장되었습니다.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setMessage(`상담 신청 상태 저장 중 오류가 발생했습니다: ${errorMessage}`);
    } finally {
      setSavingId(null);
    }
  }

  const pendingCount = requests.filter(
    (request) => request.status === "pending" || !request.status
  ).length;
  const reviewingCount = requests.filter(
    (request) => request.status === "reviewing"
  ).length;
  const doneCount = requests.filter((request) => request.status === "done")
    .length;
  const rejectedCount = requests.filter(
    (request) => request.status === "rejected"
  ).length;

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <p style={styles.badge}>Personal AI Build Admin</p>
        <h1 style={styles.title}>상담 신청 관리</h1>
        <p style={styles.description}>
          피드백 50개 이상 조건을 통과한 Personal AI Build 상담 신청을 확인하고,
          상태와 관리자 메모를 저장합니다.
        </p>
      </section>

      <section style={styles.controlCard}>
        <form style={styles.form} onSubmit={saveAdminSecret}>
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
            <button type="submit" style={styles.primaryButton} disabled={loading}>
              {loading ? "불러오는 중..." : "저장하고 불러오기"}
            </button>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => loadRequests(adminSecret.trim())}
              disabled={loading}
            >
              목록 새로고침
            </button>

            <a href="/admin" style={styles.linkButton}>
              운영 대시보드로
            </a>
          </div>
        </form>

        {message && <div style={styles.messageBox}>{message}</div>}
      </section>

      <section style={styles.summaryGrid}>
        <SummaryCard label="전체 신청" value={requests.length} />
        <SummaryCard label="대기" value={pendingCount} />
        <SummaryCard label="검토중" value={reviewingCount} />
        <SummaryCard label="완료" value={doneCount} />
        <SummaryCard label="보류" value={rejectedCount} />
      </section>

      <section style={styles.listCard}>
        <div style={styles.listHeader}>
          <div>
            <h2 style={styles.sectionTitle}>상담 신청 목록</h2>
            <p style={styles.sectionDescription}>
              상태를 바꾸고 관리자 메모를 입력한 뒤, 각 행의 저장 버튼을 누르면
              Supabase에 반영됩니다.
            </p>
          </div>
        </div>

        {requests.length === 0 ? (
          <p style={styles.emptyText}>아직 상담 신청이 없습니다.</p>
        ) : (
          <div style={styles.requestList}>
            {requests.map((request) => (
              <article key={request.id} style={styles.requestCard}>
                <div style={styles.requestTop}>
                  <div>
                    <div style={styles.statusLine}>
                      <StatusBadge status={request.status || "pending"} />
                      <span style={styles.dateText}>
                        신청일 {formatDate(request.created_at)}
                      </span>
                    </div>

                    <h3 style={styles.requestTitle}>
                      {request.want_to_build || "만들고 싶은 것 미입력"}
                    </h3>

                    <p style={styles.emailText}>
                      {request.email}
                      {request.name ? ` · ${request.name}` : ""}
                    </p>
                  </div>

                  <div style={styles.feedbackBox}>
                    <span style={styles.feedbackNumber}>
                      {(request.feedback_count_at_request ?? 0).toLocaleString(
                        "ko-KR"
                      )}
                    </span>
                    <span style={styles.feedbackLabel}>피드백</span>
                  </div>
                </div>

                <div style={styles.detailGrid}>
                  <DetailBox title="막힌 지점">
                    {request.blocked_point || "-"}
                  </DetailBox>

                  <DetailBox title="AI 활용 경험">
                    {request.ai_experience || "-"}
                  </DetailBox>

                  <DetailBox title="원하는 도움">
                    {request.help_type || "-"}
                  </DetailBox>
                </div>

                <div style={styles.editBox}>
                  <label style={styles.editLabel}>
                    상태
                    <select
                      style={styles.select}
                      value={statusById[request.id] || "pending"}
                      onChange={(event) =>
                        setStatusById((prev) => ({
                          ...prev,
                          [request.id]: event.target.value,
                        }))
                      }
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label style={styles.editLabelWide}>
                    관리자 메모
                    <textarea
                      style={styles.textarea}
                      value={noteById[request.id] || ""}
                      onChange={(event) =>
                        setNoteById((prev) => ({
                          ...prev,
                          [request.id]: event.target.value,
                        }))
                      }
                      placeholder="예: 먼저 30분 상담 제안, 사이트 제작 관심, 유료 전환 가능성 높음"
                    />
                  </label>

                  <button
                    type="button"
                    style={styles.saveButton}
                    onClick={() => saveRequest(request.id)}
                    disabled={savingId === request.id}
                  >
                    {savingId === request.id ? "저장 중..." : "저장"}
                  </button>
                </div>

                <div style={styles.metaLine}>
                  <span>현재 상태: {labelOfStatus(request.status)}</span>
                  <span>최근 수정: {formatDate(request.updated_at)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

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

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.summaryCard}>
      <p style={styles.summaryLabel}>{label}</p>
      <p style={styles.summaryValue}>{value.toLocaleString("ko-KR")}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label = labelOfStatus(status);

  const toneStyle =
    status === "done"
      ? styles.statusDone
      : status === "reviewing"
      ? styles.statusReviewing
      : status === "rejected"
      ? styles.statusRejected
      : styles.statusPending;

  return <span style={{ ...styles.statusBadge, ...toneStyle }}>{label}</span>;
}

function DetailBox({
  title,
  children,
}: {
  title: string;
  children: string;
}) {
  return (
    <div style={styles.detailBox}>
      <p style={styles.detailTitle}>{title}</p>
      <p style={styles.detailText}>{children}</p>
    </div>
  );
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
    background: "#581c87",
    border: "1px solid #c084fc",
    color: "#f3e8ff",
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
    color: "#e9d5ff",
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
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
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
    background: "#7e22ce",
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
  linkButton: {
    display: "inline-flex",
    alignItems: "center",
    height: 46,
    border: "1px solid #d1d5db",
    borderRadius: 12,
    padding: "0 16px",
    background: "#f9fafb",
    color: "#111827",
    fontSize: 14,
    fontWeight: 900,
    textDecoration: "none",
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
  summaryGrid: {
    maxWidth: 1180,
    margin: "0 auto 24px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 14,
  },
  summaryCard: {
    background: "#ffffff",
    color: "#111827",
    borderRadius: 22,
    padding: 22,
    boxShadow: "0 14px 34px rgba(15, 23, 42, 0.12)",
  },
  summaryLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: 13,
    fontWeight: 900,
  },
  summaryValue: {
    margin: "8px 0 0",
    color: "#111827",
    fontSize: 32,
    fontWeight: 900,
    letterSpacing: "-0.04em",
  },
  listCard: {
    maxWidth: 1180,
    margin: "0 auto 24px",
    background: "#ffffff",
    color: "#111827",
    borderRadius: 24,
    padding: 28,
    boxShadow: "0 16px 40px rgba(0,0,0,0.22)",
  },
  listHeader: {
    marginBottom: 18,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 24,
    letterSpacing: "-0.04em",
  },
  sectionDescription: {
    margin: "8px 0 0",
    color: "#6b7280",
    fontSize: 14,
    lineHeight: 1.6,
  },
  emptyText: {
    margin: 0,
    color: "#6b7280",
    fontSize: 14,
  },
  requestList: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  requestCard: {
    padding: 20,
    borderRadius: 20,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
  },
  requestTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    marginBottom: 16,
  },
  statusLine: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 9px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 900,
  },
  statusPending: {
    background: "#f3f4f6",
    color: "#4b5563",
    border: "1px solid #d1d5db",
  },
  statusReviewing: {
    background: "#eff6ff",
    color: "#1d4ed8",
    border: "1px solid #bfdbfe",
  },
  statusDone: {
    background: "#ecfdf5",
    color: "#047857",
    border: "1px solid #a7f3d0",
  },
  statusRejected: {
    background: "#fef2f2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
  },
  dateText: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 800,
  },
  requestTitle: {
    margin: 0,
    color: "#111827",
    fontSize: 22,
    lineHeight: 1.45,
    letterSpacing: "-0.035em",
    wordBreak: "keep-all",
  },
  emailText: {
    margin: "8px 0 0",
    color: "#4b5563",
    fontSize: 13,
    fontWeight: 800,
    wordBreak: "break-all",
  },
  feedbackBox: {
    minWidth: 90,
    padding: 14,
    borderRadius: 16,
    background: "#faf5ff",
    border: "1px solid #e9d5ff",
    textAlign: "right",
  },
  feedbackNumber: {
    display: "block",
    color: "#581c87",
    fontSize: 28,
    lineHeight: 1,
    fontWeight: 900,
    letterSpacing: "-0.04em",
  },
  feedbackLabel: {
    display: "block",
    marginTop: 6,
    color: "#7e22ce",
    fontSize: 12,
    fontWeight: 900,
  },
  detailGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
    marginBottom: 16,
  },
  detailBox: {
    padding: 14,
    borderRadius: 14,
    background: "#ffffff",
    border: "1px solid #e5e7eb",
  },
  detailTitle: {
    margin: "0 0 8px",
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 900,
  },
  detailText: {
    margin: 0,
    color: "#111827",
    fontSize: 13,
    lineHeight: 1.7,
    wordBreak: "keep-all",
    whiteSpace: "pre-wrap",
  },
  editBox: {
    display: "grid",
    gridTemplateColumns: "180px minmax(0, 1fr) 96px",
    gap: 12,
    alignItems: "end",
  },
  editLabel: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    color: "#111827",
    fontSize: 13,
    fontWeight: 900,
  },
  editLabelWide: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    color: "#111827",
    fontSize: 13,
    fontWeight: 900,
  },
  select: {
    width: "100%",
    height: 46,
    border: "1px solid #d1d5db",
    borderRadius: 12,
    padding: "0 12px",
    background: "#ffffff",
    color: "#111827",
    fontSize: 14,
    fontWeight: 800,
    outline: "none",
  },
  textarea: {
    width: "100%",
    minHeight: 80,
    border: "1px solid #d1d5db",
    borderRadius: 12,
    padding: 12,
    background: "#ffffff",
    color: "#111827",
    fontSize: 14,
    lineHeight: 1.6,
    resize: "vertical",
    boxSizing: "border-box",
    outline: "none",
  },
  saveButton: {
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
  metaLine: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
    color: "#6b7280",
    fontSize: 12,
    fontWeight: 800,
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