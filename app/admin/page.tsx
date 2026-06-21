"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type ApiResponse = {
  message?: string;
  error?: string;
  detail?: string;
  sent?: number;
  failed?: number;
  skipped?: number;
  inserted?: number;
  available_news_count?: number;
  used_newsletter_items?: number[];
  results?: unknown[];
  items?: unknown[];
  from?: string;
};

type RecentNewsItem = {
  id: number;
  title: string;
  category: string;
  difficulty: string | null;
  is_sent: boolean;
  created_at: string;
};

type DashboardStats = {
  subscriberCount: number;
  pendingNewsCount: number;
  recentNews: RecentNewsItem[];
};

function formatApiMessage(data: ApiResponse) {
  if (data.error) {
    return data.detail ? `${data.error}\n${data.detail}` : data.error;
  }

  return data.message || "요청이 완료되었습니다.";
}

function getCategoryLabel(category: string) {
  switch (category) {
    case "general_ai":
      return "전반적인 AI 뉴스";
    case "healthcare_ai":
      return "의료 AI";
    case "robotics":
      return "로봇 / 피지컬 AI";
    case "investment":
      return "AI 투자 / 산업 분석";
    case "productivity":
      return "업무 자동화 / 생산성";
    case "research":
      return "논문 / 연구 동향";
    case "education":
      return "교육 / 학습";
    case "startup":
      return "스타트업 / 비즈니스";
    default:
      return category;
  }
}

function getDifficultyLabel(difficulty: string | null) {
  switch (difficulty) {
    case "easy":
      return "쉽게 설명";
    case "normal":
      return "보통 수준";
    case "expert":
      return "전문가 수준";
    default:
      return "보통 수준";
  }
}

export default function AdminPage() {
  const [adminSecret, setAdminSecret] = useState("");

  const [newsTitle, setNewsTitle] = useState("");
  const [newsSummary, setNewsSummary] = useState("");
  const [newsUrl, setNewsUrl] = useState("");
  const [newsCategory, setNewsCategory] = useState("");
  const [newsDifficulty, setNewsDifficulty] = useState("normal");

  const [message, setMessage] = useState("");
  const [debugResult, setDebugResult] = useState("");

  const [isFetchingNews, setIsFetchingNews] = useState(false);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  const [stats, setStats] = useState<DashboardStats | null>(null);

  const loadDashboardStats = async () => {
    setMessage("");
    setDebugResult("");

    if (!adminSecret) {
      setMessage("관리자 비밀번호를 입력하세요.");
      return;
    }

    setIsStatsLoading(true);

    try {
      const res = await fetch("/api/admin-stats", {
        method: "POST",
        headers: {
          "x-admin-secret": adminSecret,
        },
      });

      const rawText = await res.text();

      let parsedData: DashboardStats & ApiResponse;

      try {
        parsedData = JSON.parse(rawText) as DashboardStats & ApiResponse;
      } catch {
        setMessage(
          "API가 JSON이 아니라 HTML/텍스트를 반환했습니다. admin-stats route.ts 경로 또는 컴파일 오류를 확인해야 합니다."
        );
        setDebugResult(rawText);
        setIsStatsLoading(false);
        return;
      }

      if (!res.ok || parsedData.error) {
        setMessage(formatApiMessage(parsedData));
        setDebugResult(JSON.stringify(parsedData, null, 2));
        setIsStatsLoading(false);
        return;
      }

      setStats({
        subscriberCount: parsedData.subscriberCount || 0,
        pendingNewsCount: parsedData.pendingNewsCount || 0,
        recentNews: parsedData.recentNews || [],
      });

      setMessage("현재 운영 상태를 불러왔습니다.");
      setDebugResult(JSON.stringify(parsedData, null, 2));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "알 수 없는 오류";

      setMessage("운영 상태 조회 중 오류가 발생했습니다.");
      setDebugResult(errorMessage);
    }

    setIsStatsLoading(false);
  };

  const handleAddNews = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setMessage("");
    setDebugResult("");
    setIsNewsLoading(true);

    const { error } = await supabase.from("newsletter_items").insert([
      {
        title: newsTitle,
        summary: newsSummary,
        url: newsUrl || null,
        category: newsCategory,
        difficulty: newsDifficulty,
      },
    ]);

    setIsNewsLoading(false);

    if (error) {
      setMessage("뉴스 저장 중 오류가 발생했습니다: " + error.message);
      return;
    }

    setMessage("뉴스가 모순책장 브리프에 등록되었습니다.");

    setNewsTitle("");
    setNewsSummary("");
    setNewsUrl("");
    setNewsCategory("");
    setNewsDifficulty("normal");

    if (adminSecret) {
      await loadDashboardStats();
    }
  };

  const handleFetchNews = async () => {
    setMessage("");
    setDebugResult("");

    if (!adminSecret) {
      setMessage("관리자 비밀번호를 입력하세요.");
      return;
    }

    setIsFetchingNews(true);

    try {
      const res = await fetch("/api/fetch-news", {
        method: "POST",
        headers: {
          "x-admin-secret": adminSecret,
        },
      });

      const rawText = await res.text();

      let parsedData: ApiResponse;

      try {
        parsedData = JSON.parse(rawText) as ApiResponse;
      } catch {
        setMessage(
          "API가 JSON이 아니라 HTML/텍스트를 반환했습니다. fetch-news route.ts 경로 또는 컴파일 오류를 확인해야 합니다."
        );
        setDebugResult(rawText);
        setIsFetchingNews(false);
        return;
      }

      setDebugResult(JSON.stringify(parsedData, null, 2));
      setMessage(formatApiMessage(parsedData));

      await loadDashboardStats();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "알 수 없는 오류";

      setMessage("뉴스 자동 수집 요청 중 오류가 발생했습니다.");
      setDebugResult(errorMessage);
    }

    setIsFetchingNews(false);
  };

  const handleSendNewsletter = async () => {
    setMessage("");
    setDebugResult("");

    if (!adminSecret) {
      setMessage("관리자 비밀번호를 입력하세요.");
      return;
    }

    setIsSending(true);

    try {
      const res = await fetch("/api/send-newsletter", {
        method: "POST",
        headers: {
          "x-admin-secret": adminSecret,
        },
      });

      const rawText = await res.text();

      let parsedData: ApiResponse;

      try {
        parsedData = JSON.parse(rawText) as ApiResponse;
      } catch {
        setMessage(
          "API가 JSON이 아니라 HTML/텍스트를 반환했습니다. send-newsletter route.ts 경로 또는 컴파일 오류를 확인해야 합니다."
        );
        setDebugResult(rawText);
        setIsSending(false);
        return;
      }

      setDebugResult(JSON.stringify(parsedData, null, 2));
      setMessage(formatApiMessage(parsedData));

      await loadDashboardStats();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "알 수 없는 오류";

      setMessage("뉴스레터 발송 요청 중 오류가 발생했습니다.");
      setDebugResult(errorMessage);
    }

    setIsSending(false);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f9fafb 0%, #eef2ff 45%, #f8fafc 100%)",
        padding: "40px 16px",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 28,
        }}
      >
        <section
          style={{
            backgroundColor: "#111827",
            borderRadius: 24,
            padding: 28,
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            color: "white",
          }}
        >
          <p
            style={{
              display: "inline-block",
              fontSize: 13,
              fontWeight: 800,
              color: "#93c5fd",
              backgroundColor: "rgba(37, 99, 235, 0.18)",
              border: "1px solid rgba(147, 197, 253, 0.35)",
              borderRadius: 999,
              padding: "7px 12px",
              margin: "0 0 16px 0",
            }}
          >
            Admin Console
          </p>

          <h1
            style={{
              fontSize: 34,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              margin: "0 0 10px 0",
            }}
          >
            모순책장 브리프 관리자
          </h1>

          <p
            style={{
              fontSize: 15,
              color: "#d1d5db",
              lineHeight: 1.7,
              margin: "0 0 24px 0",
            }}
          >
            AI 뉴스를 자동 수집하고, 필요한 뉴스를 직접 추가한 뒤,
            구독자의 관심 분야에 맞춰 뉴스레터를 발송합니다.
          </p>

          <label
            style={{
              display: "block",
              fontSize: 14,
              fontWeight: 700,
              color: "#e5e7eb",
              marginBottom: 8,
            }}
          >
            관리자 비밀번호
          </label>
          <input
            type="password"
            placeholder="ADMIN_SECRET 입력"
            value={adminSecret}
            onChange={(e) => setAdminSecret(e.target.value)}
            style={{
              ...inputStyle,
              backgroundColor: "white",
            }}
          />
        </section>

        <section
          style={{
            backgroundColor: "white",
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 12px 36px rgba(15,23,42,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
              marginBottom: 18,
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#6b7280",
                  margin: "0 0 6px 0",
                }}
              >
                Dashboard
              </p>
              <h2
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  color: "#111827",
                  letterSpacing: "-0.03em",
                  margin: 0,
                }}
              >
                현재 운영 상태
              </h2>
            </div>

            <button
              type="button"
              onClick={loadDashboardStats}
              disabled={isStatsLoading}
              style={{
                backgroundColor: isStatsLoading ? "#9ca3af" : "#111827",
                color: "white",
                border: "none",
                borderRadius: 12,
                padding: "12px 16px",
                fontSize: 14,
                fontWeight: 800,
                cursor: isStatsLoading ? "not-allowed" : "pointer",
              }}
            >
              {isStatsLoading ? "불러오는 중..." : "상태 새로고침"}
            </button>
          </div>

          {stats ? (
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 14,
                  marginBottom: 20,
                }}
              >
                <StatCard
                  label="전체 구독자"
                  value={`${stats.subscriberCount}명`}
                  description="현재 등록된 이메일 수"
                />
                <StatCard
                  label="발송 대기 뉴스"
                  value={`${stats.pendingNewsCount}개`}
                  description="is_sent=false 상태"
                />
              </div>

              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#f9fafb",
                    padding: "12px 14px",
                    borderBottom: "1px solid #e5e7eb",
                    fontSize: 14,
                    fontWeight: 800,
                    color: "#374151",
                  }}
                >
                  최근 등록 뉴스
                </div>

                {stats.recentNews.length === 0 ? (
                  <p
                    style={{
                      padding: 16,
                      margin: 0,
                      color: "#6b7280",
                      fontSize: 14,
                    }}
                  >
                    아직 등록된 뉴스가 없습니다.
                  </p>
                ) : (
                  <div>
                    {stats.recentNews.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          padding: "14px 16px",
                          borderBottom: "1px solid #f3f4f6",
                        }}
                      >
                        <p
                          style={{
                            margin: "0 0 6px 0",
                            fontSize: 15,
                            fontWeight: 800,
                            color: "#111827",
                            lineHeight: 1.5,
                          }}
                        >
                          {item.title}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 13,
                            color: "#6b7280",
                            lineHeight: 1.5,
                          }}
                        >
                          #{item.id} · {getCategoryLabel(item.category)} ·{" "}
                          {getDifficultyLabel(item.difficulty)} ·{" "}
                          {item.is_sent ? "발송 완료" : "발송 대기"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p
              style={{
                margin: 0,
                color: "#6b7280",
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              관리자 비밀번호를 입력한 뒤 상태 새로고침을 누르면 구독자 수와
              발송 대기 뉴스를 확인할 수 있습니다.
            </p>
          )}
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          <ActionCard
            title="1. AI 뉴스 자동 수집"
            description="Hacker News에서 AI 관련 최신 글을 가져와 발송 대기 뉴스로 저장합니다."
            buttonText={isFetchingNews ? "뉴스 수집 중..." : "AI 뉴스 자동 수집"}
            disabled={isFetchingNews}
            onClick={handleFetchNews}
            backgroundColor="#ecfdf5"
            borderColor="#10b981"
            titleColor="#065f46"
            textColor="#047857"
            buttonColor="#10b981"
          />

          <ActionCard
            title="2. 구독자별 발송"
            description="is_sent=false 상태의 뉴스만 구독자 관심 분야에 맞춰 이메일로 발송합니다."
            buttonText={isSending ? "발송 중..." : "모순책장 브리프 발송"}
            disabled={isSending}
            onClick={handleSendNewsletter}
            backgroundColor="#eff6ff"
            borderColor="#2563eb"
            titleColor="#1e3a8a"
            textColor="#1d4ed8"
            buttonColor="#2563eb"
          />
        </section>

        <form
          onSubmit={handleAddNews}
          style={{
            backgroundColor: "white",
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 12px 36px rgba(15,23,42,0.08)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 4 }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: "#6b7280",
                margin: "0 0 8px 0",
              }}
            >
              Manual Input
            </p>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: "#111827",
                letterSpacing: "-0.03em",
                margin: "0 0 8px 0",
              }}
            >
              뉴스 직접 등록
            </h2>
            <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
              자동 수집으로 부족한 뉴스나 직접 고른 글을 추가할 수 있습니다.
            </p>
          </div>

          <div>
            <label style={labelStyle}>뉴스 제목</label>
            <input
              type="text"
              placeholder="예: 의료 AI, 병원 워크플로우로 확장"
              value={newsTitle}
              onChange={(e) => setNewsTitle(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>뉴스 요약</label>
            <textarea
              placeholder="뉴스 내용을 간단히 요약하세요."
              value={newsSummary}
              onChange={(e) => setNewsSummary(e.target.value)}
              required
              rows={5}
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />
          </div>

          <div>
            <label style={labelStyle}>원문 URL</label>
            <input
              type="url"
              placeholder="https://example.com"
              value={newsUrl}
              onChange={(e) => setNewsUrl(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>뉴스 카테고리</label>
            <select
              value={newsCategory}
              onChange={(e) => setNewsCategory(e.target.value)}
              required
              style={inputStyle}
            >
              <option value="">카테고리 선택</option>
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
            <label style={labelStyle}>뉴스 난이도</label>
            <select
              value={newsDifficulty}
              onChange={(e) => setNewsDifficulty(e.target.value)}
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
            disabled={isNewsLoading}
            style={{
              width: "100%",
              backgroundColor: isNewsLoading ? "#9ca3af" : "#111827",
              color: "white",
              border: "none",
              borderRadius: 14,
              padding: "15px 18px",
              fontSize: 16,
              fontWeight: 900,
              cursor: isNewsLoading ? "not-allowed" : "pointer",
              marginTop: 4,
            }}
          >
            {isNewsLoading ? "뉴스 저장 중..." : "뉴스 직접 등록하기"}
          </button>
        </form>

        {message && (
          <section
            style={{
              backgroundColor: "white",
              borderRadius: 18,
              padding: 18,
              boxShadow: "0 12px 36px rgba(15,23,42,0.08)",
            }}
          >
            <p
              style={{
                textAlign: "center",
                color: "#111827",
                fontWeight: 800,
                whiteSpace: "pre-wrap",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {message}
            </p>
          </section>
        )}

        {debugResult && (
          <section
            style={{
              backgroundColor: "#111827",
              borderRadius: 18,
              padding: 18,
              boxShadow: "0 12px 36px rgba(15,23,42,0.16)",
            }}
          >
            <h3
              style={{
                color: "white",
                fontSize: 16,
                fontWeight: 800,
                margin: "0 0 12px 0",
              }}
            >
              API 응답 상세
            </h3>
            <pre
              style={{
                color: "#d1d5db",
                fontSize: 13,
                whiteSpace: "pre-wrap",
                overflowX: "auto",
                maxHeight: 360,
                margin: 0,
              }}
            >
              {debugResult}
            </pre>
          </section>
        )}
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div
      style={{
        backgroundColor: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: 16,
      }}
    >
      <p
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: "#6b7280",
          margin: "0 0 8px 0",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: 30,
          fontWeight: 900,
          color: "#111827",
          margin: "0 0 4px 0",
          letterSpacing: "-0.03em",
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontSize: 13,
          color: "#6b7280",
          margin: 0,
        }}
      >
        {description}
      </p>
    </div>
  );
}

function ActionCard({
  title,
  description,
  buttonText,
  disabled,
  onClick,
  backgroundColor,
  borderColor,
  titleColor,
  textColor,
  buttonColor,
}: {
  title: string;
  description: string;
  buttonText: string;
  disabled: boolean;
  onClick: () => void;
  backgroundColor: string;
  borderColor: string;
  titleColor: string;
  textColor: string;
  buttonColor: string;
}) {
  return (
    <section
      style={{
        backgroundColor,
        border: `3px solid ${borderColor}`,
        borderRadius: 22,
        padding: 22,
        boxShadow: "0 12px 36px rgba(15,23,42,0.08)",
      }}
    >
      <h2
        style={{
          fontSize: 23,
          fontWeight: 900,
          color: titleColor,
          textAlign: "center",
          margin: "0 0 8px 0",
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h2>

      <p
        style={{
          fontSize: 14,
          color: textColor,
          textAlign: "center",
          lineHeight: 1.6,
          margin: "0 0 18px 0",
        }}
      >
        {description}
      </p>

      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        style={{
          width: "100%",
          backgroundColor: disabled ? "#9ca3af" : buttonColor,
          color: "white",
          border: "none",
          borderRadius: 14,
          padding: "15px 18px",
          fontSize: 16,
          fontWeight: 900,
          cursor: disabled ? "not-allowed" : "pointer",
          display: "block",
        }}
      >
        {buttonText}
      </button>
    </section>
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