"use client";

import { useEffect, useMemo, useState } from "react";

type FeedbackType = "useful" | "deeper" | "not_relevant" | "action_done";

const FEEDBACK_LABELS: Record<FeedbackType, string> = {
  useful: "좋았어요",
  deeper: "더 깊게 알고 싶어요",
  not_relevant: "나와 잘 안 맞았어요",
  action_done: "실행했어요",
};

function isFeedbackType(value: string | null): value is FeedbackType {
  return (
    value === "useful" ||
    value === "deeper" ||
    value === "not_relevant" ||
    value === "action_done"
  );
}

async function readApiResponse(response: Response) {
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

export default function FeedbackPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("피드백을 저장하는 중입니다.");
  const [freeText, setFreeText] = useState("");
  const [savingText, setSavingText] = useState(false);

  const params = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        email: "",
        itemId: "",
        type: null,
      };
    }

    const searchParams = new URLSearchParams(window.location.search);

    return {
      email: searchParams.get("email") || "",
      itemId: searchParams.get("item_id") || "",
      type: searchParams.get("type"),
    };
  }, []);

  const feedbackType = isFeedbackType(params.type) ? params.type : null;

  useEffect(() => {
    async function saveFeedback() {
      if (!params.email || !feedbackType) {
        setStatus("error");
        setMessage("피드백 저장에 필요한 정보가 부족합니다.");
        return;
      }

      try {
        const response = await fetch("/api/feedback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscriber_email: params.email,
            newsletter_item_id: params.itemId ? Number(params.itemId) : null,
            feedback_type: feedbackType,
            action_done: feedbackType === "action_done",
          }),
        });

        const result = await readApiResponse(response);

        if (!response.ok || !result.ok) {
          setStatus("error");
          setMessage(result.message || "피드백 저장 중 오류가 발생했습니다.");
          return;
        }

        setStatus("success");
        setMessage("피드백이 저장되었습니다. 다음 브리프에 반영하겠습니다.");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";

        setStatus("error");
        setMessage(`피드백 저장 중 오류가 발생했습니다. ${errorMessage}`);
      }
    }

    saveFeedback();
  }, [params.email, params.itemId, feedbackType]);

  async function handleSaveFreeText() {
    if (!freeText.trim()) {
      setMessage("추가 의견을 입력해주세요.");
      return;
    }

    if (!params.email || !feedbackType) {
      setStatus("error");
      setMessage("추가 의견 저장에 필요한 정보가 부족합니다.");
      return;
    }

    setSavingText(true);
    setMessage("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriber_email: params.email,
          newsletter_item_id: params.itemId ? Number(params.itemId) : null,
          feedback_type: feedbackType,
          action_done: feedbackType === "action_done",
          free_text: freeText.trim(),
        }),
      });

      const result = await readApiResponse(response);

      if (!response.ok || !result.ok) {
        setStatus("error");
        setMessage(result.message || "추가 의견 저장 중 오류가 발생했습니다.");
        return;
      }

      setStatus("success");
      setMessage("추가 의견까지 저장되었습니다.");
      setFreeText("");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setStatus("error");
      setMessage(`추가 의견 저장 중 오류가 발생했습니다. ${errorMessage}`);
    } finally {
      setSavingText(false);
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <p style={styles.badge}>AI-FU Feedback</p>

        <h1 style={styles.title}>
          {status === "loading"
            ? "피드백 저장 중"
            : status === "success"
            ? "피드백 감사합니다"
            : "피드백 저장 실패"}
        </h1>

        <p style={styles.description}>{message}</p>

        {feedbackType && (
          <div style={styles.feedbackBox}>
            <p style={styles.feedbackLabel}>선택한 피드백</p>
            <p style={styles.feedbackValue}>{FEEDBACK_LABELS[feedbackType]}</p>
          </div>
        )}

        <div style={styles.textBox}>
          <label style={styles.label}>
            추가로 남기고 싶은 말
            <textarea
              style={styles.textarea}
              value={freeText}
              onChange={(event) => setFreeText(event.target.value)}
              placeholder="예: 이 자료는 좋았는데, 다음에는 실제 예시를 더 보고 싶어요."
            />
          </label>

          <button
            type="button"
            style={styles.button}
            onClick={handleSaveFreeText}
            disabled={savingText}
          >
            {savingText ? "저장 중..." : "추가 의견 저장"}
          </button>
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
    padding: "48px 16px",
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
    padding: 32,
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
    fontSize: 34,
    letterSpacing: "-0.04em",
  },
  description: {
    margin: "14px 0 0",
    color: "#4b5563",
    fontSize: 16,
    lineHeight: 1.7,
  },
  feedbackBox: {
    marginTop: 22,
    padding: 18,
    borderRadius: 18,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
  },
  feedbackLabel: {
    margin: 0,
    color: "#6b7280",
    fontSize: 13,
    fontWeight: 900,
  },
  feedbackValue: {
    margin: "8px 0 0",
    color: "#111827",
    fontSize: 20,
    fontWeight: 900,
  },
  textBox: {
    marginTop: 22,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    fontSize: 14,
    fontWeight: 900,
  },
  textarea: {
    minHeight: 120,
    border: "1px solid #d1d5db",
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    lineHeight: 1.6,
    outline: "none",
    resize: "vertical",
    color: "#111827",
    background: "#ffffff",
  },
  button: {
    width: "100%",
    height: 50,
    marginTop: 12,
    border: "none",
    borderRadius: 14,
    background: "#111827",
    color: "#ffffff",
    fontSize: 16,
    fontWeight: 900,
    cursor: "pointer",
  },
  link: {
    display: "inline-block",
    marginTop: 20,
    color: "#2563eb",
    fontSize: 14,
    fontWeight: 900,
    textDecoration: "none",
  },
};