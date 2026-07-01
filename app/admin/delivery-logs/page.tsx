"use client";

import { useEffect, useMemo, useState } from "react";

type CountRow = {
  value: string;
  count: number;
};

type DeliveryLog = {
  id: number;
  subscriber_id: string | null;
  subscriber_email: string | null;
  newsletter_item_id: number | null;
  status: string | null;
  error_message: string | null;
  created_at: string | null;
};

type DeliveryLogsResponse = {
  ok?: boolean;
  message?: string;
  total?: number;
  statusCounts?: CountRow[];
  emailCounts?: CountRow[];
  itemCounts?: CountRow[];
  logs?: DeliveryLog[];
  note?: string;
  deletedCount?: number;
  rawText?: string;
};

const STATUS_LABELS: Record<string, string> = {
  sent: "발송 성공",
  failed: "발송 실패",
  unknown: "미분류",
};

function labelOf(value: string | null | undefined) {
  if (!value) return "-";
  return STATUS_LABELS[value] || value;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString("ko-KR");
  } catch {
    return value;
  }
}

async function readApiResponse(response: Response): Promise<DeliveryLogsResponse> {
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

export default function DeliveryLogsAdminPage() {
  const [adminSecret, setAdminSecret] = useState("");
  const [logs, setLogs] = useState<DeliveryLog[]>([]);
  const [statusCounts, setStatusCounts] = useState<CountRow[]>([]);
  const [emailCounts, setEmailCounts] = useState<CountRow[]>([]);
  const [itemCounts, setItemCounts] = useState<CountRow[]>([]);

  const [message, setMessage] = useState("");
  const [debugText, setDebugText] = useState("");
  const [loading, setLoading] = useState(false);

  const [targetEmail, setTargetEmail] = useState("");
  const [targetItemId, setTargetItemId] = useState("");
  const [confirmText, setConfirmText] = useState("");

  const [filterEmail, setFilterEmail] = useState("");
  const [filterItemId, setFilterItemId] = useState("");

  const filteredLogs = useMemo(() => {
    const emailFilter = filterEmail.trim().toLowerCase();
    const itemFilter = filterItemId.trim();

    return logs.filter((log) => {
      const emailOk = emailFilter
        ? (log.subscriber_email || "").toLowerCase().includes(emailFilter)
        : true;

      const itemOk = itemFilter
        ? String(log.newsletter_item_id || "").includes(itemFilter)
        : true;

      return emailOk && itemOk;
    });
  }, [logs, filterEmail, filterItemId]);

  useEffect(() => {
    const savedSecret = window.localStorage.getItem("aifu_admin_secret") || "";
    setAdminSecret(savedSecret);
  }, []);

  useEffect(() => {
    if (adminSecret.trim()) {
      loadLogs(adminSecret.trim());
    }
  }, [adminSecret]);

  function saveAdminSecret() {
    if (!adminSecret.trim()) {
      setMessage("ADMIN_SECRET을 입력해주세요.");
      return;
    }

    window.localStorage.setItem("aifu_admin_secret", adminSecret.trim());
    setMessage("ADMIN_SECRET이 저장되었습니다.");
    loadLogs(adminSecret.trim());
  }

  async function loadLogs(secret = adminSecret.trim()) {
    if (!secret) {
      setMessage("ADMIN_SECRET을 입력해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/delivery-logs", {
        method: "GET",
        headers: {
          "x-admin-secret": secret,
        },
      });

      const result = await readApiResponse(response);

      if (!response.ok || !result.ok) {
        setMessage(result.message || "발송 로그를 불러오지 못했습니다.");
        setDebugText(result.rawText || JSON.stringify(result, null, 2));
        return;
      }

      setLogs(result.logs || []);
      setStatusCounts(result.statusCounts || []);
      setEmailCounts(result.emailCounts || []);
      setItemCounts(result.itemCounts || []);
      setMessage(result.message || "발송 로그를 불러왔습니다.");
      setDebugText(JSON.stringify(result, null, 2));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setMessage(`발송 로그 로딩 중 오류가 발생했습니다. ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }

  async function runAction({
    action,
    subscriberEmail,
    newsletterItemId,
    confirmValue,
  }: {
    action: "clear_all" | "clear_by_email" | "clear_by_item";
    subscriberEmail?: string;
    newsletterItemId?: string;
    confirmValue: string;
  }) {
    if (!adminSecret.trim()) {
      setMessage("ADMIN_SECRET을 입력해주세요.");
      return;
    }

    const confirmed = window.confirm(
      "발송 이력을 삭제합니다. 삭제된 로그는 복구하기 어렵습니다. 진행할까요?"
    );

    if (!confirmed) return;

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/delivery-logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret.trim(),
        },
        body: JSON.stringify({
          admin_secret: adminSecret.trim(),
          action,
          subscriber_email: subscriberEmail,
          newsletter_item_id: newsletterItemId,
          confirm_text: confirmValue,
        }),
      });

      const result = await readApiResponse(response);

      if (!response.ok || !result.ok) {
        setMessage(result.message || "발송 이력 초기화 중 오류가 발생했습니다.");
        setDebugText(result.rawText || JSON.stringify(result, null, 2));
        return;
      }

      setMessage(result.message || "발송 이력을 초기화했습니다.");
      setDebugText(JSON.stringify(result, null, 2));
      setConfirmText("");
      await loadLogs(adminSecret.trim());
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setMessage(`발송 이력 초기화 중 오류가 발생했습니다. ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <p style={styles.badge}>AI-FU Admin</p>
        <h1 style={styles.title}>발송 로그 관리</h1>
        <p style={styles.description}>
          A-4 이후 재발송 제한은 <b>newsletter_delivery_logs</b>를 기준으로
          작동합니다. 테스트 중 다시 발송하고 싶으면 이 페이지에서 발송 이력을
          초기화합니다.
        </p>
      </section>

      <section style={styles.card}>
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
            style={styles.secondaryButton}
            onClick={() => loadLogs(adminSecret.trim())}
            disabled={loading}
          >
            {loading ? "처리 중..." : "발송 로그 새로고침"}
          </button>

          <a href="/admin" style={styles.linkButton}>
            대시보드로
          </a>

          <a href="/admin/newsletter-items" style={styles.linkButton}>
            뉴스 자료 관리
          </a>
        </div>

        {message && <div style={styles.messageBox}>{message}</div>}
      </section>

      <section style={styles.dashboard}>
        <div style={styles.summaryGrid}>
          <SummaryCard label="최근 로그" value={logs.length} help="최근 500개 기준" />
          <SummaryCard
            label="성공 로그"
            value={
              statusCounts.find((row) => row.value === "sent")?.count || 0
            }
            help="status = sent"
          />
          <SummaryCard
            label="실패 로그"
            value={
              statusCounts.find((row) => row.value === "failed")?.count || 0
            }
            help="status = failed"
          />
          <SummaryCard
            label="표시 중"
            value={filteredLogs.length}
            help="현재 필터 결과"
          />
        </div>

        <section style={styles.warningBox}>
          <b>주의:</b> 이 페이지에서 발송 로그를 삭제하면, 해당 구독자에게 같은
          자료를 다시 보낼 수 있게 됩니다. 테스트에는 유용하지만 실제 운영에서는
          신중하게 사용하세요.
        </section>

        <section style={styles.twoColumn}>
          <Panel title="이메일별 발송 수">
            <CountList rows={emailCounts} />
          </Panel>

          <Panel title="자료 ID별 발송 수">
            <CountList rows={itemCounts} />
          </Panel>
        </section>

        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>발송 이력 초기화</h2>

          <div style={styles.resetGrid}>
            <div style={styles.resetBox}>
              <h3 style={styles.subTitle}>특정 이메일 초기화</h3>
              <p style={styles.helpText}>
                해당 이메일의 모든 발송 로그를 삭제합니다. confirm에는 같은
                이메일을 입력해야 합니다.
              </p>

              <input
                style={styles.input}
                value={targetEmail}
                onChange={(event) => setTargetEmail(event.target.value)}
                placeholder="subscriber@example.com"
              />

              <input
                style={styles.input}
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                placeholder="confirm text"
              />

              <button
                type="button"
                style={styles.dangerButton}
                disabled={loading}
                onClick={() =>
                  runAction({
                    action: "clear_by_email",
                    subscriberEmail: targetEmail.trim().toLowerCase(),
                    confirmValue: confirmText.trim().toLowerCase(),
                  })
                }
              >
                이메일 발송 이력 초기화
              </button>
            </div>

            <div style={styles.resetBox}>
              <h3 style={styles.subTitle}>특정 자료 초기화</h3>
              <p style={styles.helpText}>
                특정 자료 ID의 모든 발송 로그를 삭제합니다. confirm에는 같은
                자료 ID를 입력해야 합니다.
              </p>

              <input
                style={styles.input}
                value={targetItemId}
                onChange={(event) => setTargetItemId(event.target.value)}
                placeholder="예: 71"
              />

              <input
                style={styles.input}
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                placeholder="confirm text"
              />

              <button
                type="button"
                style={styles.dangerButton}
                disabled={loading}
                onClick={() =>
                  runAction({
                    action: "clear_by_item",
                    newsletterItemId: targetItemId.trim(),
                    confirmValue: confirmText.trim(),
                  })
                }
              >
                자료 발송 이력 초기화
              </button>
            </div>

            <div style={styles.resetBox}>
              <h3 style={styles.subTitle}>전체 초기화</h3>
              <p style={styles.helpText}>
                모든 발송 로그를 삭제합니다. confirm에는 RESET_DELIVERY_LOGS를
                입력해야 합니다.
              </p>

              <input
                style={styles.input}
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                placeholder="RESET_DELIVERY_LOGS"
              />

              <button
                type="button"
                style={styles.dangerButton}
                disabled={loading}
                onClick={() =>
                  runAction({
                    action: "clear_all",
                    confirmValue: confirmText.trim(),
                  })
                }
              >
                전체 발송 이력 초기화
              </button>
            </div>
          </div>
        </section>

        <section style={styles.card}>
          <div style={styles.tableHeader}>
            <div>
              <h2 style={styles.sectionTitle}>최근 발송 로그</h2>
              <p style={styles.helpText}>최근 500개 로그를 표시합니다.</p>
            </div>

            <div style={styles.filterRow}>
              <input
                style={styles.smallInput}
                value={filterEmail}
                onChange={(event) => setFilterEmail(event.target.value)}
                placeholder="이메일 필터"
              />

              <input
                style={styles.smallInput}
                value={filterItemId}
                onChange={(event) => setFilterItemId(event.target.value)}
                placeholder="자료 ID 필터"
              />
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <p style={styles.emptyText}>표시할 발송 로그가 없습니다.</p>
          ) : (
            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>이메일</th>
                    <th style={styles.th}>자료 ID</th>
                    <th style={styles.th}>상태</th>
                    <th style={styles.th}>오류</th>
                    <th style={styles.th}>일시</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={styles.td}>#{log.id}</td>
                      <td style={styles.td}>{log.subscriber_email || "-"}</td>
                      <td style={styles.td}>
                        {log.newsletter_item_id
                          ? `#${log.newsletter_item_id}`
                          : "-"}
                      </td>
                      <td style={styles.td}>{labelOf(log.status)}</td>
                      <td style={styles.td}>{log.error_message || "-"}</td>
                      <td style={styles.td}>{formatDate(log.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>

      {debugText && (
        <section style={styles.debugSection}>
          <details>
            <summary style={styles.debugSummary}>원본 JSON 보기</summary>
            <pre style={styles.debugBox}>{debugText}</pre>
          </details>
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
  value: string | number;
  help: string;
}) {
  return (
    <div style={styles.summaryCard}>
      <p style={styles.summaryLabel}>{label}</p>
      <p style={styles.summaryValue}>{value}</p>
      <p style={styles.summaryHelp}>{help}</p>
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
    <section style={styles.card}>
      <h2 style={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  );
}

function CountList({ rows }: { rows: CountRow[] }) {
  if (rows.length === 0) {
    return <p style={styles.emptyText}>데이터가 없습니다.</p>;
  }

  return (
    <div style={styles.countList}>
      {rows.map((row) => (
        <div key={row.value} style={styles.countRow}>
          <span style={styles.countLabel}>{row.value}</span>
          <span style={styles.countNumber}>{row.count}</span>
        </div>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
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
    maxWidth: 900,
    margin: "16px 0 0",
    color: "#dbeafe",
    fontSize: 16,
    lineHeight: 1.7,
  },
  card: {
    maxWidth: 1280,
    margin: "0 auto",
    background: "#ffffff",
    color: "#111827",
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 16px 40px rgba(0,0,0,0.22)",
  },
  dashboard: {
    maxWidth: 1280,
    margin: "22px auto 0",
    display: "flex",
    flexDirection: "column",
    gap: 18,
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
    width: "100%",
    height: 50,
    border: "1px solid #d1d5db",
    borderRadius: 14,
    padding: "0 14px",
    fontSize: 15,
    color: "#111827",
    background: "#ffffff",
    outline: "none",
    boxSizing: "border-box",
  },
  smallInput: {
    height: 42,
    border: "1px solid #d1d5db",
    borderRadius: 12,
    padding: "0 12px",
    fontSize: 14,
    color: "#111827",
    background: "#ffffff",
    outline: "none",
  },
  buttonRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
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
  linkButton: {
    display: "inline-flex",
    alignItems: "center",
    height: 44,
    borderRadius: 12,
    padding: "0 14px",
    background: "#eff6ff",
    color: "#1d4ed8",
    fontSize: 14,
    fontWeight: 900,
    textDecoration: "none",
  },
  dangerButton: {
    height: 46,
    border: "none",
    borderRadius: 12,
    padding: "0 14px",
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
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 14,
  },
  summaryCard: {
    padding: 18,
    borderRadius: 18,
    background: "#ffffff",
    color: "#111827",
    border: "1px solid #e5e7eb",
    boxShadow: "0 10px 26px rgba(15, 23, 42, 0.08)",
  },
  summaryLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: 13,
    fontWeight: 900,
  },
  summaryValue: {
    margin: "10px 0 0",
    color: "#111827",
    fontSize: 30,
    fontWeight: 900,
    letterSpacing: "-0.04em",
  },
  summaryHelp: {
    margin: "8px 0 0",
    color: "#9ca3af",
    fontSize: 12,
    lineHeight: 1.5,
  },
  warningBox: {
    maxWidth: 1280,
    margin: "0 auto",
    padding: 16,
    borderRadius: 16,
    background: "#fffbeb",
    border: "1px solid #fcd34d",
    color: "#92400e",
    fontSize: 14,
    lineHeight: 1.7,
    fontWeight: 700,
  },
  twoColumn: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: 18,
  },
  sectionTitle: {
    margin: "0 0 16px",
    fontSize: 22,
    letterSpacing: "-0.03em",
  },
  subTitle: {
    margin: "0 0 8px",
    fontSize: 17,
    letterSpacing: "-0.02em",
  },
  helpText: {
    margin: "0 0 14px",
    color: "#6b7280",
    fontSize: 13,
    lineHeight: 1.6,
  },
  resetGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 16,
  },
  resetBox: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: 16,
    borderRadius: 18,
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
  },
  tableHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    marginBottom: 16,
  },
  filterRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  tableWrap: {
    width: "100%",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    minWidth: 860,
    borderCollapse: "collapse",
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
  countList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  countRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 12,
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
  },
  countLabel: {
    color: "#111827",
    fontSize: 13,
    fontWeight: 800,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  countNumber: {
    color: "#2563eb",
    fontSize: 13,
    fontWeight: 900,
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
  debugSummary: {
    cursor: "pointer",
    color: "#dbeafe",
    fontSize: 14,
    fontWeight: 800,
  },
  debugBox: {
    marginTop: 12,
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