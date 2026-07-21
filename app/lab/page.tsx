"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const notoSerifKr = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["500", "600", "700", "900"],
});

type MessageType = "success" | "error" | "info";

function PulseMark({ width = 200 }: { width?: number }) {
  return (
    <svg
      className="brf-pulse"
      width={width}
      height={48}
      viewBox="0 0 240 48"
      role="img"
      aria-label="심전도 파형이 그려지는 모순책장 마크"
    >
      <polyline points="2,30 70,30 84,30 94,8 106,44 116,30 152,30 238,30" />
    </svg>
  );
}

export default function LabPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("info");
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [consented, setConsented] = useState(false);

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

    if (!consented) {
      setMessage("개인정보 수집·이용에 동의해야 구독 신청이 가능합니다.");
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
    <div
      className={`${notoSansKr.className} brf`}
      style={{ "--brf-serif": notoSerifKr.style.fontFamily } as CSSProperties}
    >
      <header className="brf-topbar">
        <div className="brf-shell brf-topbar-inner">
          <a href="/" className="brf-wordmark">
            Mosun Brief
          </a>
          <nav className="brf-topnav" aria-label="주요 메뉴">
            <a href="https://mosunbrief.kr" rel="noopener">
              모순책장
            </a>
            <a href="/" className="brf-topnav-cta">
              브리핑 보러가기
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="brf-shell brf-lab-hero">
          <p className="brf-eyebrow brf-rise">모순책장 · 응급실 밖 기록</p>
          <PulseMark />
          <h1 className="brf-h1 brf-rise" style={{ animationDelay: "0.1s" }}>
            응급실에서는 환자를 봅니다.
            <br />
            응급실 밖에서는 AI와 함께 회사를 만들어 나갑니다.
          </h1>
          <p className="brf-lead-sub brf-rise" style={{ animationDelay: "0.22s" }}>
            응급의학과 의사가 AI와 협업하며 1인 기업을 만들어가는 기록입니다.
            새 글이 나오면 이메일로 보내드립니다.
          </p>

          <div
            className="brf-lab-rules brf-rise"
            style={{ animationDelay: "0.3s" }}
          >
            <div className="brf-check-item">
              <span className="mark">✓</span>
              <span>숫자를 전부 공개합니다 — 방문자, 구독자, 수익 0원부터</span>
            </div>
            <div className="brf-check-item">
              <span className="mark">✓</span>
              <span>실패도 기록합니다 — 접은 아이디어와 헛돈 쓴 시도까지</span>
            </div>
            <div className="brf-check-item">
              <span className="mark">✓</span>
              <span>재현 가능하게 씁니다 — 따라 할 수 있는 AI 협업 과정</span>
            </div>
          </div>

          <form
            className="brf-subscribe-form brf-rise"
            style={{ animationDelay: "0.38s" }}
            onSubmit={handleSubscribe}
          >
            <input
              className="brf-input"
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
              aria-label="이메일 주소"
            />
            <button
              type="submit"
              className="brf-btn"
              disabled={isLoading || isCompleted}
            >
              {isLoading
                ? "처리 중..."
                : isCompleted
                ? "구독 완료"
                : "기록 구독하기"}
            </button>
          </form>

          <label className="brf-consent" style={{ maxWidth: 560 }}>
            <input
              type="checkbox"
              checked={consented}
              onChange={(e) => setConsented(e.target.checked)}
            />
            <span>
              [필수] 개인정보 수집·이용에 동의합니다.{" "}
              <a href="/privacy" target="_blank" rel="noopener">
                개인정보처리방침
              </a>
            </span>
          </label>

          {message && (
            <div
              className={`brf-msg ${
                messageType === "success" ? "success" : "error"
              }`}
              style={{ maxWidth: 560 }}
            >
              {message}
            </div>
          )}

          <p className="brf-form-note" style={{ textAlign: "left" }}>
            광고나 스팸은 없습니다. 언제든{" "}
            <a href="/unsubscribe" style={{ color: "inherit" }}>
              구독 취소
            </a>
            할 수 있습니다. 첫 작품이 궁금하다면{" "}
            <a href="/" style={{ color: "var(--brf-clay-deep)", fontWeight: 700 }}>
              Mosun Brief
            </a>
            도 둘러보세요.
          </p>
        </section>
      </main>

      <footer className="brf-footer">
        <div className="brf-shell brf-footer-inner">
          <span>© {new Date().getFullYear()} 모순책장 · 응급실 밖 기록</span>
          <div className="brf-footer-links">
            <a href="https://mosunbrief.kr" rel="noopener">
              모순책장
            </a>
            <a href="/unsubscribe">구독 취소</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
