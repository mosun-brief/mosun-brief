"use client";

import { useEffect, useMemo, useState } from "react";

type SatisfactionType = "useful" | "deeper" | "not_relevant";
type ExecutionType = "action_done" | "action_not_done";

type SatisfactionButtonDef = {
  type: SatisfactionType;
  label: string;
  helper: string;
};

type ExecutionButtonDef = {
  type: ExecutionType;
  label: string;
  helper: string;
};

const SATISFACTION_BUTTONS: SatisfactionButtonDef[] = [
  { type: "useful", label: "좋음", helper: "비슷한 자료를 더 받을게요" },
  { type: "deeper", label: "더 깊게", helper: "이 방향을 더 심화할게요" },
  { type: "not_relevant", label: "별로", helper: "다음 추천에서 낮출게요" },
];

const EXECUTION_BUTTONS: ExecutionButtonDef[] = [
  { type: "action_done", label: "실행해봄", helper: "실행 가능한 방향을 더 줄게요" },
  { type: "action_not_done", label: "실행안해봄", helper: "난이도와 시간을 다시 맞출게요" },
];

type FeedbackStateResponse = {
  ok?: boolean;
  message?: string;
  satisfaction?: SatisfactionType | null;
  execution?: ExecutionType | null;
  note?: string | null;
};

async function readApiResponse(response: Response): Promise<FeedbackStateResponse> {
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
    };
  }
}

export default function FeedbackPage() {
  const params = useMemo(() => {
    if (typeof window === "undefined") {
      return { email: "", subscriberId: "", itemId: "", token: "" };
    }

    const searchParams = new URLSearchParams(window.location.search);

    return {
      email: searchParams.get("email") || "",
      subscriberId: searchParams.get("subscriber_id") || "",
      itemId:
        searchParams.get("newsletter_item_id") || searchParams.get("item_id") || "",
      token: searchParams.get("token") || "",
    };
  }, []);

  const [pageStatus, setPageStatus] = useState<"loading" | "ready" | "invalid">(
    "loading"
  );
  const [pageError, setPageError] = useState("");

  const [satisfaction, setSatisfaction] = useState<SatisfactionType | null>(null);
  const [execution, setExecution] = useState<ExecutionType | null>(null);
  const [savingSatisfaction, setSavingSatisfaction] = useState(false);
  const [savingExecution, setSavingExecution] = useState(false);
  const [groupError, setGroupError] = useState("");

  const [freeText, setFreeText] = useState("");
  const [noteStatus, setNoteStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [noteMessage, setNoteMessage] = useState("");

  useEffect(() => {
    if (!params.subscriberId || !params.itemId || !params.token) {
      setPageStatus("invalid");
      setPageError(
        "피드백 저장에 필요한 정보가 부족합니다. 받으신 최신 메일의 버튼을 다시 눌러주세요."
      );
      return;
    }

    let cancelled = false;

    async function loadState() {
      try {
        const url = new URL("/api/feedback/state", window.location.origin);
        url.searchParams.set("subscriber_id", params.subscriberId);
        url.searchParams.set("newsletter_item_id", params.itemId);
        url.searchParams.set("token", params.token);

        const response = await fetch(url.toString());
        const result = await readApiResponse(response);

        if (cancelled) return;

        if (!response.ok || !result.ok) {
          setPageStatus("invalid");
          setPageError(result.message || "피드백 상태를 불러오지 못했습니다.");
          return;
        }

        setSatisfaction(result.satisfaction ?? null);
        setExecution(result.execution ?? null);
        setFreeText(result.note ?? "");
        setPageStatus("ready");
      } catch {
        if (cancelled) return;
        setPageStatus("invalid");
        setPageError("네트워크 오류로 피드백 상태를 불러오지 못했습니다.");
      }
    }

    loadState();

    return () => {
      cancelled = true;
    };
  }, [params.subscriberId, params.itemId, params.token]);

  async function handleSelect(
    group: "satisfaction" | "execution",
    type: SatisfactionType | ExecutionType
  ) {
    const isSatisfactionGroup = group === "satisfaction";
    const current = isSatisfactionGroup ? satisfaction : execution;
    const isDeselecting = current === type;
    const action = isDeselecting ? "clear" : "select";

    const previousSatisfaction = satisfaction;
    const previousExecution = execution;

    setGroupError("");

    if (isSatisfactionGroup) {
      setSatisfaction(isDeselecting ? null : (type as SatisfactionType));
      setSavingSatisfaction(true);
    } else {
      setExecution(isDeselecting ? null : (type as ExecutionType));
      setSavingExecution(true);
    }

    try {
      const response = await fetch("/api/feedback/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriber_id: params.subscriberId,
          subscriber_email: params.email || null,
          newsletter_item_id: Number(params.itemId),
          token: params.token,
          action,
          type,
        }),
      });

      const result = await readApiResponse(response);

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "저장하지 못했습니다.");
      }

      setSatisfaction(result.satisfaction ?? null);
      setExecution(result.execution ?? null);
    } catch (error) {
      setSatisfaction(previousSatisfaction);
      setExecution(previousExecution);
      setGroupError(
        error instanceof Error
          ? error.message
          : "저장하지 못했습니다. 다시 눌러주세요."
      );
    } finally {
      if (isSatisfactionGroup) setSavingSatisfaction(false);
      else setSavingExecution(false);
    }
  }

  async function handleSaveNote() {
    setNoteStatus("saving");
    setNoteMessage("");

    try {
      const response = await fetch("/api/feedback/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriber_id: params.subscriberId,
          subscriber_email: params.email || null,
          newsletter_item_id: Number(params.itemId),
          token: params.token,
          action: "note",
          free_text: freeText.trim(),
        }),
      });

      const result = await readApiResponse(response);

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "저장하지 못했습니다.");
      }

      setNoteStatus("saved");
      setNoteMessage(
        freeText.trim() ? "저장되었습니다." : "추가 의견을 지웠습니다."
      );
    } catch (error) {
      setNoteStatus("error");
      setNoteMessage(
        error instanceof Error ? error.message : "저장하지 못했습니다."
      );
    }
  }

  if (pageStatus === "invalid") {
    return (
      <main style={styles.page}>
        <section style={styles.card}>
          <p style={styles.badge}>AI-FU Feedback</p>
          <h1 style={styles.title}>피드백을 열 수 없습니다</h1>
          <p style={styles.description}>{pageError}</p>
          <a href="/" style={styles.link}>
            구독 화면으로 돌아가기
          </a>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <p style={styles.badge}>AI-FU Feedback</p>

        <h1 style={styles.title}>이 자료, 어땠나요?</h1>
        <p style={styles.description}>
          {pageStatus === "loading"
            ? "이전에 남긴 피드백을 불러오는 중입니다…"
            : "그룹별로 하나만 골라주세요. 다시 누르면 선택이 풀립니다. 누르는 즉시 저장되고, 페이지 이동은 없습니다."}
        </p>

        {groupError && <p style={styles.errorBanner}>{groupError}</p>}

        <div style={styles.groupBlock}>
          <p style={styles.groupLabel}>자료가 어땠나요?</p>
          <div style={styles.buttonGrid}>
            {SATISFACTION_BUTTONS.map((button) => {
              const selected = satisfaction === button.type;

              return (
                <button
                  key={button.type}
                  type="button"
                  disabled={pageStatus === "loading" || savingSatisfaction}
                  onClick={() => handleSelect("satisfaction", button.type)}
                  style={{
                    ...styles.optionButton,
                    ...(selected ? styles.optionButtonSelected : {}),
                    opacity: pageStatus === "loading" ? 0.6 : 1,
                  }}
                >
                  <span style={styles.optionLabel}>
                    {selected ? "✓ " : ""}
                    {button.label}
                  </span>
                  <span
                    style={{
                      ...styles.optionHelper,
                      ...(selected ? styles.optionHelperSelected : {}),
                    }}
                  >
                    {button.helper}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={styles.groupBlock}>
          <p style={styles.groupLabel}>실행해봤나요?</p>
          <div style={styles.buttonGrid}>
            {EXECUTION_BUTTONS.map((button) => {
              const selected = execution === button.type;

              return (
                <button
                  key={button.type}
                  type="button"
                  disabled={pageStatus === "loading" || savingExecution}
                  onClick={() => handleSelect("execution", button.type)}
                  style={{
                    ...styles.optionButton,
                    ...(selected ? styles.optionButtonSelected : {}),
                    opacity: pageStatus === "loading" ? 0.6 : 1,
                  }}
                >
                  <span style={styles.optionLabel}>
                    {selected ? "✓ " : ""}
                    {button.label}
                  </span>
                  <span
                    style={{
                      ...styles.optionHelper,
                      ...(selected ? styles.optionHelperSelected : {}),
                    }}
                  >
                    {button.helper}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={styles.textBox}>
          <label style={styles.label}>
            추가로 남기고 싶은 말
            <textarea
              style={styles.textarea}
              value={freeText}
              onChange={(event) => setFreeText(event.target.value)}
              placeholder="예: 이 자료는 좋았는데, 다음에는 실제 예시를 더 보고 싶어요."
              disabled={pageStatus === "loading"}
            />
          </label>

          <button
            type="button"
            style={styles.button}
            onClick={handleSaveNote}
            disabled={pageStatus === "loading" || noteStatus === "saving"}
          >
            {noteStatus === "saving" ? "저장 중..." : "추가 의견 저장"}
          </button>

          {noteMessage && (
            <p
              style={{
                ...styles.noteMessage,
                color: noteStatus === "error" ? "#dc2626" : "#059669",
              }}
            >
              {noteMessage}
            </p>
          )}
        </div>

        <a href="/" style={styles.link}>
          구독 화면으로 돌아가기
        </a>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #111827 0%, #1f2937 45%, #0f172a 100%)",
    padding: "32px 16px",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: 620,
    background: "#ffffff",
    color: "#111827",
    borderRadius: 28,
    padding: 26,
    boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
  },
  badge: {
    display: "inline-block",
    margin: "0 0 16px",
    padding: "8px 14px",
    borderRadius: 999,
    background: "#eff6ff",
    color: "#2563eb",
    fontSize: 14,
    fontWeight: 900,
  },
  title: {
    margin: 0,
    fontSize: 30,
    letterSpacing: "-0.04em",
  },
  description: {
    margin: "12px 0 0",
    color: "#4b5563",
    fontSize: 15,
    lineHeight: 1.7,
  },
  errorBanner: {
    margin: "14px 0 0",
    padding: "12px 14px",
    borderRadius: 14,
    background: "#fef2f2",
    border: "1px solid #fecaca",
    color: "#dc2626",
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1.6,
  },
  groupBlock: {
    marginTop: 22,
  },
  groupLabel: {
    margin: "0 0 10px",
    fontSize: 12,
    fontWeight: 900,
    color: "#9ca3af",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  buttonGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 10,
  },
  optionButton: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 4,
    minHeight: 64,
    padding: "14px 16px",
    borderRadius: 16,
    background: "#ffffff",
    color: "#111827",
    border: "1px solid #d1d5db",
    cursor: "pointer",
    textAlign: "left",
    WebkitTapHighlightColor: "transparent",
  },
  optionButtonSelected: {
    background: "#111827",
    color: "#ffffff",
    border: "1px solid #111827",
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: 900,
    color: "inherit",
  },
  optionHelper: {
    fontSize: 12,
    fontWeight: 600,
    color: "#6b7280",
    lineHeight: 1.5,
  },
  optionHelperSelected: {
    color: "#d1d5db",
  },
  textBox: {
    marginTop: 26,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    fontSize: 14,
    fontWeight: 900,
  },
  textarea: {
    minHeight: 110,
    border: "1px solid #d1d5db",
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    lineHeight: 1.6,
    outline: "none",
    resize: "vertical",
    color: "#111827",
    background: "#ffffff",
  },
  button: {
    width: "100%",
    height: 52,
    marginTop: 12,
    border: "none",
    borderRadius: 14,
    background: "#111827",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: 900,
    cursor: "pointer",
  },
  noteMessage: {
    margin: "10px 0 0",
    fontSize: 13,
    fontWeight: 800,
  },
  link: {
    display: "inline-block",
    marginTop: 22,
    color: "#2563eb",
    fontSize: 14,
    fontWeight: 900,
    textDecoration: "none",
  },
};
