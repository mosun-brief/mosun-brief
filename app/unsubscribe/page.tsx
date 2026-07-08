"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

type MessageType = "success" | "error" | "info";

function UnsubscribeContent() {
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("info");
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const emailFromQuery = searchParams.get("email") || "";

    if (emailFromQuery) {
      setEmail(emailFromQuery.trim().toLowerCase());
    }
  }, [searchParams]);

  const isValidEmail = useMemo(() => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  const handleUnsubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
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
    setIsCompleted(false);

    try {
      const res = await fetch("/api/unsubscribe", {
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

      if (!res.ok || data.error) {
        setMessage(data.detail || data.error || "구독 해지에 실패했습니다.");
        setMessageType("error");
        return;
      }

      setMessage(data.message || "구독 해지가 완료되었습니다.");
      setMessageType("success");
      setIsCompleted(true);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "알 수 없는 오류";

      setIsLoading(false);
      setMessage("구독 해지 요청 중 오류가 발생했습니다: " + errorMessage);
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
          padding: "32px 24px",
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
            Mosun Brief
          </p>

          <h1
            style={{
              fontSize: 34,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              margin: "0 0 10px 0",
            }}
          >
            구독 취소
          </h1>

          <p
            style={{
              fontSize: 15,
              lineHeight: 1.7,
              color: "#6b7280",
              margin: 0,
            }}
          >
            더 이상 Mosun Brief를 받고 싶지 않다면 이메일을 확인한 뒤 구독을
            취소할 수 있습니다.
          </p>
        </div>

        <form
          onSubmit={handleUnsubscribe}
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
                setIsCompleted(false);
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
              ? "구독 취소 완료"
              : "구독 취소하기"}
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
          다시 구독하고 싶다면 메인 페이지에서 언제든 다시 신청할 수 있습니다.
        </p>
      </section>
    </main>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={null}>
      <UnsubscribeContent />
    </Suspense>
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