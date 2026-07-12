"use client";

import { useMemo, useState } from "react";

type MessageType = "success" | "error" | "info";

export default function LabPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("info");
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const isValidEmail = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    setMessage("");
    setMessageType("info");

    if (!normalizedEmail || !isValidEmail) {
      setMessage("올바른 이메일 주소를 입력해주세요.");
      setMessageType("error");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/subscribe-lab", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
        }),
      });

      const data = await res.json();

      setIsLoading(false);

      if (!res.ok || !data.ok) {
        setMessage(data.message || "구독 신청에 실패했습니다.");
        setMessageType("error");
        return;
      }

      setMessage(data.message || "구독이 완료되었습니다.");
      setMessageType("success");
      setIsCompleted(true);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "알 수 없는 오류";

      setIsLoading(false);
      setMessage("구독 신청 중 오류가 발생했습니다: " + errorMessage);
      setMessageType("error");
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #111827 0%, #1f2937 45%, #0f172a 100%)",
        padding: "48px 16px",
        color: "white",
        display: "flex",
        alignItems: "center",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 560,
          margin: "0 auto",
          backgroundColor: "white",
          color: "#111827",
          borderRadius: 28,
          padding: "36px 28px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <p
            style={{
              display: "inline-block",
              fontSize: 13,
              fontWeight: 800,
              color: "#2563eb",
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: 999,
              padding: "7px 12px",
              margin: "0 0 14px 0",
            }}
          >
            모순책장 · 응급실 밖 실험실
          </p>

          <h1
            style={{
              fontSize: 27,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.4,
              margin: "0 0 12px 0",
            }}
          >
            응급실에서는 환자를 봅니다.
            <br />
            응급실 밖에서는 AI와 회사를 짓습니다.
          </h1>

          <p
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: "#6b7280",
              margin: 0,
            }}
          >
            응급의학과 의사가 AI와 협업하며 1인 기업을 만들어가는 실험
            일지입니다. 새 기록이 나오면 이메일로 보내드립니다.
          </p>
        </div>

        <ul
          style={{
            listStyle: "none",
            margin: "0 0 26px 0",
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <PromiseItem>
            숫자를 전부 공개합니다 — 방문자, 구독자, 수익 0원부터
          </PromiseItem>
          <PromiseItem>
            실패도 기록합니다 — 접은 아이디어와 헛돈 쓴 시도까지
          </PromiseItem>
          <PromiseItem>
            재현 가능하게 씁니다 — 따라 할 수 있는 AI 협업 과정
          </PromiseItem>
        </ul>

        <form
          onSubmit={handleSubscribe}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div>
            <label style={labelStyle}>이메일</label>
            <input
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setMessage("");
                setMessageType("info");
              }}
              required
              disabled={isLoading || isCompleted}
              style={{
                ...inputStyle,
                backgroundColor: isCompleted ? "#f9fafb" : "white",
                color: isCompleted ? "#6b7280" : "#111827",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || isCompleted}
            style={{
              width: "100%",
              border: "none",
              borderRadius: 14,
              padding: "15px 18px",
              fontSize: 16,
              fontWeight: 900,
              color: "white",
              backgroundColor: isCompleted
                ? "#10b981"
                : isLoading
                ? "#9ca3af"
                : "#111827",
              cursor: isLoading || isCompleted ? "not-allowed" : "pointer",
            }}
          >
            {isLoading
              ? "처리 중..."
              : isCompleted
              ? "구독 완료"
              : "실험 일지 구독하기"}
          </button>
        </form>

        {message && (
          <div
            style={{
              marginTop: 18,
              backgroundColor:
                messageType === "success"
                  ? "#ecfdf5"
                  : messageType === "error"
                  ? "#fef2f2"
                  : "#eff6ff",
              border:
                messageType === "success"
                  ? "1px solid #10b981"
                  : messageType === "error"
                  ? "1px solid #ef4444"
                  : "1px solid #3b82f6",
              borderRadius: 14,
              padding: 14,
              textAlign: "center",
              color:
                messageType === "success"
                  ? "#065f46"
                  : messageType === "error"
                  ? "#991b1b"
                  : "#1e40af",
              fontWeight: 800,
              lineHeight: 1.6,
            }}
          >
            {message}
          </div>
        )}

        <p
          style={{
            margin: "22px 0 0 0",
            textAlign: "center",
            fontSize: 13,
            color: "#9ca3af",
            lineHeight: 1.6,
          }}
        >
          광고나 스팸은 없습니다. 언제든{" "}
          <a href="/unsubscribe" style={{ color: "#6b7280" }}>
            구독 취소
          </a>
          할 수 있습니다.
          <br />
          첫 실험작이 궁금하다면{" "}
          <a href="/" style={{ color: "#2563eb", fontWeight: 700 }}>
            Mosun Brief
          </a>
          도 둘러보세요.
        </p>
      </section>
    </main>
  );
}

function PromiseItem({ children }: { children: React.ReactNode }) {
  return (
    <li
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        backgroundColor: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: 14,
        padding: "12px 14px",
        fontSize: 14,
        fontWeight: 600,
        color: "#374151",
        lineHeight: 1.6,
      }}
    >
      <span aria-hidden="true" style={{ color: "#2563eb", fontWeight: 900 }}>
        ✓
      </span>
      <span>{children}</span>
    </li>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 14,
  fontWeight: 700,
  color: "#374151",
  marginBottom: 8,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #d1d5db",
  borderRadius: 12,
  padding: "12px 14px",
  fontSize: 15,
  color: "#111827",
  backgroundColor: "white",
};
