"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [interestArea, setInterestArea] = useState("general_ai");
  const [purpose, setPurpose] = useState("trend_following");
  const [difficulty, setDifficulty] = useState("normal");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setMessage("");
    setMessageType("info");
    setIsLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    const { error } = await supabase.from("subscribers").insert([
      {
        email: normalizedEmail,
        job_role: jobRole.trim(),
        interest_area: interestArea,
        purpose,
        difficulty,
      },
    ]);

    setIsLoading(false);

    if (error) {
      const isDuplicateEmail =
        error.code === "23505" ||
        error.message.toLowerCase().includes("duplicate") ||
        error.message.toLowerCase().includes("unique");

      if (isDuplicateEmail) {
        setMessage(
          "이미 구독 신청이 완료된 이메일입니다. 곧 모순책장 브리프를 받아볼 수 있습니다."
        );
        setMessageType("info");
        return;
      }

      setMessage(
        "구독 신청 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
      );
      setMessageType("error");
      return;
    }

    setMessage(
      "구독 신청이 완료되었습니다. 곧 당신의 관심사에 맞춘 모순책장 브리프를 받아볼 수 있습니다."
    );
    setMessageType("success");

    setEmail("");
    setJobRole("");
    setInterestArea("general_ai");
    setPurpose("trend_following");
    setDifficulty("normal");
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #111827 0%, #1f2937 45%, #0f172a 100%)",
        padding: "48px 16px",
        color: "white",
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 32,
        }}
      >
        <section
          style={{
            textAlign: "center",
            paddingTop: 24,
            paddingBottom: 8,
          }}
        >
          <p
            style={{
              display: "inline-block",
              fontSize: 14,
              fontWeight: 700,
              color: "#93c5fd",
              backgroundColor: "rgba(37, 99, 235, 0.18)",
              border: "1px solid rgba(147, 197, 253, 0.35)",
              borderRadius: 999,
              padding: "8px 14px",
              marginBottom: 20,
            }}
          >
            모순책장 브리프
          </p>

          <h1
            style={{
              fontSize: "clamp(34px, 6vw, 64px)",
              lineHeight: 1.08,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              margin: "0 0 20px 0",
            }}
          >
            AI와 인간,
            <br />
            기술과 사회의 모순을 읽다
          </h1>

          <p
            style={{
              maxWidth: 720,
              margin: "0 auto",
              fontSize: 18,
              lineHeight: 1.7,
              color: "#d1d5db",
            }}
          >
            매일 쏟아지는 AI 뉴스 중에서 나에게 필요한 흐름만 골라
            보내드립니다. 관심 분야, 목적, 난이도에 맞춰 읽기 좋은
            브리프로 정리합니다.
          </p>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          <FeatureCard
            title="관심 분야 기반"
            description="의료 AI, 로봇, 투자, 생산성, 연구 동향 등 관심사에 맞춰 뉴스를 선별합니다."
          />
          <FeatureCard
            title="목적 기반 요약"
            description="공부, 업무 활용, 투자 판단, 사업 아이디어 등 읽는 목적에 맞춰 관점을 제공합니다."
          />
          <FeatureCard
            title="짧고 명확하게"
            description="긴 기사보다 핵심 흐름과 바로 생각해볼 지점을 중심으로 정리합니다."
          />
        </section>

        <section
          style={{
            backgroundColor: "white",
            color: "#111827",
            borderRadius: 28,
            padding: "28px 24px",
            boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <h2
              style={{
                fontSize: 30,
                fontWeight: 900,
                letterSpacing: "-0.03em",
                margin: "0 0 8px 0",
              }}
            >
              맞춤 AI 브리프 구독하기
            </h2>
            <p
              style={{
                color: "#6b7280",
                fontSize: 15,
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              이메일과 관심사를 남기면, 선택한 기준에 맞춰 AI 뉴스를
              받아볼 수 있습니다.
            </p>
          </div>

          <form
            onSubmit={handleSubscribe}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div>
              <label style={labelStyle}>이메일</label>
              <input
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>직업 / 역할</label>
              <input
                type="text"
                placeholder="예: 의사, 학생, 개발자, 투자자, 기획자"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
                required
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>관심 분야</label>
              <select
                value={interestArea}
                onChange={(e) => setInterestArea(e.target.value)}
                required
                style={inputStyle}
              >
                <option value="general_ai">전반적인 AI 뉴스</option>
                <option value="healthcare_ai">의료 AI</option>
                <option value="robotics">로봇 / 피지컬 AI</option>
                <option value="investment">AI 투자 / 산업 분석</option>
                <option value="productivity">업무 자동화 / 생산성</option>
                <option value="research">논문 / 연구 동향</option>
                <option value="education">교육 / 학습</option>
                <option value="startup">스타트업 / 비즈니스</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>구독 목적</label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                required
                style={inputStyle}
              >
                <option value="trend_following">최신 트렌드 파악</option>
                <option value="work_application">업무 활용</option>
                <option value="investment_decision">투자 판단</option>
                <option value="study">공부 / 자기계발</option>
                <option value="business_idea">사업 아이디어 발굴</option>
                <option value="research_reference">연구 참고</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>읽기 난이도</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                required
                style={inputStyle}
              >
                <option value="easy">쉽게 설명</option>
                <option value="normal">보통 수준</option>
                <option value="expert">전문가 수준</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                border: "none",
                borderRadius: 14,
                padding: "16px 20px",
                fontSize: 17,
                fontWeight: 900,
                color: "white",
                backgroundColor: isLoading ? "#9ca3af" : "#2563eb",
                cursor: isLoading ? "not-allowed" : "pointer",
                marginTop: 6,
              }}
            >
              {isLoading ? "구독 신청 중..." : "모순책장 브리프 구독하기"}
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
        </section>

        <section
          style={{
            textAlign: "center",
            color: "#9ca3af",
            fontSize: 13,
            lineHeight: 1.7,
            paddingBottom: 24,
          }}
        >
          <p style={{ margin: 0 }}>
            현재는 MVP 테스트 버전입니다. 구독 정보는 맞춤 뉴스 발송을 위한
            목적으로만 사용됩니다.
          </p>
        </section>
      </div>
    </main>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        backgroundColor: "rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: 20,
        padding: 20,
        backdropFilter: "blur(10px)",
      }}
    >
      <h3
        style={{
          fontSize: 18,
          fontWeight: 800,
          margin: "0 0 8px 0",
          color: "white",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: 14,
          lineHeight: 1.7,
          color: "#d1d5db",
          margin: 0,
        }}
      >
        {description}
      </p>
    </div>
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