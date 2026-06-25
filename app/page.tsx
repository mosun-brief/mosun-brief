"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type MessageType = "success" | "error" | "info";

function getPersonaType(aiEmotion: string, aiIntent: string) {
  if (aiIntent === "service_building" && aiEmotion === "anxious") {
    return "Builder-Anxious";
  }

  if (aiIntent === "service_building") {
    return "Builder";
  }

  if (aiIntent === "work_efficiency") {
    return "Adopter";
  }

  if (aiEmotion === "anxious") {
    return "Anxious";
  }

  if (aiEmotion === "skeptical") {
    return "Skeptic";
  }

  if (aiEmotion === "fatigue") {
    return "Avoider";
  }

  if (aiEmotion === "curious") {
    return "Explorer";
  }

  return "Explorer";
}

export default function HomePage() {
  const [email, setEmail] = useState("");

  const [aiEmotion, setAiEmotion] = useState("curious");
  const [aiIntent, setAiIntent] = useState("not_sure");
  const [blocker, setBlocker] = useState("too_much_information");
  const [actionTime, setActionTime] = useState("30min");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("info");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setMessage("");
    setMessageType("info");
    setIsLoading(true);

    const normalizedEmail = email.trim().toLowerCase();
    const personaType = getPersonaType(aiEmotion, aiIntent);

    const { error } = await supabase.from("subscribers").insert([
      {
        email: normalizedEmail,

        ai_emotion: aiEmotion,
        ai_intent: aiIntent,
        blocker,
        action_time: actionTime,
        persona_type: personaType,

        // 기존 MVP 컬럼은 당장 삭제하지 않고,
        // 호환성을 위해 최소값만 같이 저장
        job_role: null,
        interest_area: "general_ai",
        purpose: "personal_action",
        difficulty:
          actionTime === "10min"
            ? "easy"
            : actionTime === "2hours" || actionTime === "weekend"
            ? "expert"
            : "normal",
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
          "이미 구독 신청이 완료된 이메일입니다. 곧 AI-FU 브리프를 받아볼 수 있습니다."
        );
        setMessageType("info");
        return;
      }

      setMessage(
        `구독 신청 중 문제가 발생했습니다. ${error.message}`
      );
      setMessageType("error");
      return;
    }

    setMessage(
      "구독 신청이 완료되었습니다. 이제 AI-FU가 당신의 상태에 맞는 첫 번째 실행 브리프를 준비합니다."
    );
    setMessageType("success");

    setEmail("");
    setAiEmotion("curious");
    setAiIntent("not_sure");
    setBlocker("too_much_information");
    setActionTime("30min");
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
            AI-FU
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
            AI 시대,
            <br />
            막연한 불안을 다음 행동으로
          </h1>

          <p
            style={{
              maxWidth: 740,
              margin: "0 auto",
              fontSize: 18,
              lineHeight: 1.7,
              color: "#d1d5db",
            }}
          >
            AI-FU는 쏟아지는 AI 뉴스 속에서 멈춰 있는 사람을 위해,
            당신의 감정과 상황을 바탕으로 읽을거리와 작은 실행 계획을
            함께 보내는 개인 맞춤 AI 서비스입니다.
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
            title="상태 기반"
            description="직업이나 관심사보다 먼저, AI를 바라보는 기대·불안·피로감·호기심을 파악합니다."
          />
          <FeatureCard
            title="균형 잡힌 해석"
            description="AI를 무조건 낙관하거나 두려워하지 않도록, 핵심 자료와 반대 관점을 함께 읽습니다."
          />
          <FeatureCard
            title="작은 Action"
            description="뉴스를 읽고 끝내지 않고, 이번 주에 실제로 해볼 수 있는 10분·30분·2시간 행동으로 연결합니다."
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
              AI-FU 브리프 시작하기
            </h2>
            <p
              style={{
                color: "#6b7280",
                fontSize: 15,
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              몇 가지 질문에 답하면, 당신의 AI 상태에 맞춘 첫 번째 실행
              브리프를 준비합니다.
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
              <label style={labelStyle}>
                AI를 생각하면 가장 가까운 감정은?
              </label>
              <select
                value={aiEmotion}
                onChange={(e) => setAiEmotion(e.target.value)}
                required
                style={inputStyle}
              >
                <option value="curious">호기심이 든다</option>
                <option value="expectation">기대된다</option>
                <option value="anxious">불안하다</option>
                <option value="fatigue">정보가 너무 많아 피곤하다</option>
                <option value="skeptical">과장된 것 같아 회의적이다</option>
                <option value="unknown">잘 모르겠다</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>AI로 하고 싶은 것은?</label>
              <select
                value={aiIntent}
                onChange={(e) => setAiIntent(e.target.value)}
                required
                style={inputStyle}
              >
                <option value="not_sure">아직 잘 모르겠다</option>
                <option value="work_efficiency">업무 효율을 높이고 싶다</option>
                <option value="service_building">서비스나 사이트를 만들고 싶다</option>
                <option value="study">공부나 자기계발에 쓰고 싶다</option>
                <option value="creation">글쓰기·창작에 활용하고 싶다</option>
                <option value="money">돈 벌기나 사업 기회를 찾고 싶다</option>
                <option value="avoid">되도록 피하고 싶지만 알아야 할 것 같다</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>지금 가장 막히는 것은?</label>
              <select
                value={blocker}
                onChange={(e) => setBlocker(e.target.value)}
                required
                style={inputStyle}
              >
                <option value="too_much_information">
                  정보가 너무 많아서 정리가 안 된다
                </option>
                <option value="dont_know_start">
                  뭘 해야 할지 모르겠다
                </option>
                <option value="too_technical">
                  기술적인 내용이 어렵다
                </option>
                <option value="no_time">시간이 없다</option>
                <option value="fear">뒤처질까 봐 불안하다</option>
                <option value="no_need">아직 필요성을 잘 모르겠다</option>
              </select>
            </div>

            <div>
              <label style={labelStyle}>이번 주 가능한 행동 시간은?</label>
              <select
                value={actionTime}
                onChange={(e) => setActionTime(e.target.value)}
                required
                style={inputStyle}
              >
                <option value="10min">10분</option>
                <option value="30min">30분</option>
                <option value="2hours">2시간</option>
                <option value="weekend">주말 반나절</option>
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
              {isLoading ? "구독 신청 중..." : "AI-FU 브리프 시작하기"}
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
            현재는 MVP 테스트 버전입니다. 답변은 개인 맞춤 브리프 제공을
            위해 사용되며, 다른 사람에게 공유될 경우 익명화된 형태로만
            사용됩니다.
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