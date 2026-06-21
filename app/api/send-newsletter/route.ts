import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

type Subscriber = {
  id: string | null;
  email: string;
  job_role: string | null;
  interest_area: string | null;
  purpose: string | null;
  difficulty: string | null;
};

type NewsletterItem = {
  id: number;
  title: string;
  summary: string;
  url: string | null;
  category: string;
  difficulty: string | null;
  is_sent: boolean;
  created_at: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const adminSecret = process.env.ADMIN_SECRET;
const resendFromEmail =
  process.env.RESEND_FROM_EMAIL || "모순책장 브리프 <onboarding@resend.dev>";

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.");
}

if (!supabaseServiceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.");
}

if (!resendApiKey) {
  throw new Error("RESEND_API_KEY가 설정되지 않았습니다.");
}

if (!adminSecret) {
  throw new Error("ADMIN_SECRET이 설정되지 않았습니다.");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
const resend = new Resend(resendApiKey);

function getInterestLabel(interestArea: string | null) {
  switch (interestArea) {
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
    case "general_ai":
      return "전반적인 AI 뉴스";
    default:
      return "AI";
  }
}

function getPurposeLabel(purpose: string | null) {
  switch (purpose) {
    case "trend_following":
      return "최신 트렌드 파악";
    case "work_application":
      return "업무 활용";
    case "investment_decision":
      return "투자 판단";
    case "study":
      return "공부 / 자기계발";
    case "business_idea":
      return "사업 아이디어 발굴";
    case "research_reference":
      return "연구 참고";
    default:
      return "AI 이해";
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

function getCategoryLabel(category: string) {
  switch (category) {
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
    case "general_ai":
      return "전반적인 AI 뉴스";
    default:
      return category;
  }
}

function getCategoryBadgeColor(category: string) {
  switch (category) {
    case "healthcare_ai":
      return "#dcfce7";
    case "robotics":
      return "#fef3c7";
    case "investment":
      return "#fee2e2";
    case "productivity":
      return "#dbeafe";
    case "research":
      return "#ede9fe";
    case "education":
      return "#e0f2fe";
    case "startup":
      return "#fae8ff";
    case "general_ai":
      return "#f3f4f6";
    default:
      return "#f3f4f6";
  }
}

function isNewsMatchedToSubscriber(
  subscriber: Subscriber,
  item: NewsletterItem
) {
  const subscriberInterest = subscriber.interest_area;
  const newsCategory = item.category;

  if (!subscriberInterest) return true;
  if (subscriberInterest === "general_ai") return true;
  if (newsCategory === "general_ai") return true;

  return subscriberInterest === newsCategory;
}

function getActionPoint(subscriber: Subscriber) {
  if (subscriber.purpose === "investment_decision") {
    return "이 뉴스가 실제 매출, 비용 절감, 진입장벽, 시장 점유율 변화로 이어지는지 확인해보세요.";
  }

  if (subscriber.purpose === "work_application") {
    return "내 업무에서 반복되는 검색, 정리, 문서화, 의사결정 보조 작업 중 하나를 AI로 대체할 수 있는지 떠올려보세요.";
  }

  if (subscriber.purpose === "business_idea") {
    return "이 기술이 특정 직업군의 불편함을 해결하는 유료 서비스로 바뀔 수 있는지 생각해보세요.";
  }

  if (subscriber.purpose === "research_reference") {
    return "주장보다 데이터셋, 평가 지표, 비교 대상, 한계점을 먼저 확인해보세요.";
  }

  if (subscriber.purpose === "study") {
    return "낯선 기술 용어보다 이 기술이 해결하려는 문제와 기존 방식의 한계를 먼저 이해해보세요.";
  }

  return "AI 뉴스는 기술 자체보다 ‘어디에 실제로 쓰이고, 누구의 비용을 줄이는가’를 중심으로 읽으면 좋습니다.";
}

function generateNewsletter(
  subscriber: Subscriber,
  matchedNews: NewsletterItem[]
) {
  const interest = getInterestLabel(subscriber.interest_area);
  const purpose = getPurposeLabel(subscriber.purpose);
  const difficulty = getDifficultyLabel(subscriber.difficulty);
  const actionPoint = getActionPoint(subscriber);

  const subject = `[모순책장 브리프] 오늘의 ${interest} 흐름`;

  const newsHtml = matchedNews
    .map((item, index) => {
      const categoryLabel = getCategoryLabel(item.category);
      const itemDifficulty = getDifficultyLabel(item.difficulty);
      const badgeColor = getCategoryBadgeColor(item.category);

      return `
        <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:18px; padding:22px; margin-bottom:18px;">
          <div style="margin-bottom:12px;">
            <span style="display:inline-block; background:${badgeColor}; color:#111827; font-size:12px; font-weight:700; padding:5px 10px; border-radius:999px;">
              ${categoryLabel}
            </span>
            <span style="display:inline-block; color:#6b7280; font-size:12px; margin-left:8px;">
              ${itemDifficulty}
            </span>
          </div>

          <h2 style="font-size:20px; line-height:1.4; margin:0 0 12px 0; color:#111827;">
            ${index + 1}. ${item.title}
          </h2>

          <p style="font-size:15px; line-height:1.7; color:#374151; margin:0 0 14px 0;">
            ${item.summary}
          </p>

          ${
            item.url
              ? `
                <a href="${item.url}" target="_blank" style="display:inline-block; color:#2563eb; font-size:14px; font-weight:700; text-decoration:none;">
                  원문 읽기 →
                </a>
              `
              : ""
          }
        </div>
      `;
    })
    .join("");

  const html = `
    <div style="margin:0; padding:0; background:#f3f4f6;">
      <div style="font-family:Arial, sans-serif; line-height:1.7; color:#111827; max-width:720px; margin:0 auto; padding:28px 14px;">
        <div style="background:#111827; color:white; border-radius:24px 24px 0 0; padding:30px 24px;">
          <p style="display:inline-block; margin:0 0 14px 0; color:#93c5fd; background:rgba(37,99,235,0.18); border:1px solid rgba(147,197,253,0.35); border-radius:999px; padding:6px 12px; font-size:13px; font-weight:700;">
            모순책장 브리프
          </p>

          <h1 style="font-size:30px; line-height:1.25; margin:0 0 12px 0; letter-spacing:-0.03em;">
            AI와 인간,<br />
            기술과 사회의 모순을 읽다
          </h1>

          <p style="font-size:15px; line-height:1.7; color:#d1d5db; margin:0;">
            오늘은 <strong style="color:white;">${interest}</strong> 분야를 중심으로,
            구독 목적에 맞춰 읽어볼 만한 AI 흐름을 정리했습니다.
          </p>
        </div>

        <div style="background:#ffffff; padding:24px; border-left:1px solid #e5e7eb; border-right:1px solid #e5e7eb;">
          <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:16px; padding:16px; margin-bottom:22px;">
            <p style="font-size:14px; line-height:1.8; margin:0; color:#374151;">
              관심 분야: <strong style="color:#111827;">${interest}</strong><br />
              구독 목적: <strong style="color:#111827;">${purpose}</strong><br />
              읽기 난이도: <strong style="color:#111827;">${difficulty}</strong>
            </p>
          </div>

          ${newsHtml}

          <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:18px; padding:20px; margin-top:26px;">
            <p style="font-size:13px; font-weight:800; color:#2563eb; margin:0 0 8px 0;">
              오늘의 읽는 관점
            </p>
            <p style="font-size:15px; line-height:1.7; color:#1e3a8a; margin:0;">
              ${actionPoint}
            </p>
          </div>
        </div>

        <div style="background:#ffffff; border:1px solid #e5e7eb; border-top:none; border-radius:0 0 24px 24px; padding:22px 24px;">
          <p style="font-size:13px; color:#6b7280; line-height:1.7; margin:0 0 10px 0;">
            이 메일은 모순책장 브리프가 사용자의 관심 분야, 목적, 난이도와 오늘 등록된 AI 뉴스 데이터를 기준으로 발송했습니다.
          </p>

          <p style="font-size:12px; color:#9ca3af; line-height:1.7; margin:0;">
            현재는 MVP 테스트 버전입니다. 추후 구독 관리와 수신 거부 기능이 추가될 예정입니다.
          </p>
        </div>
      </div>
    </div>
  `;

  return { subject, html };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "알 수 없는 오류가 발생했습니다.";
}

async function saveDeliveryLogs(
  subscriber: Subscriber,
  matchedNews: NewsletterItem[],
  status: "sent" | "failed",
  errorMessage: string | null
) {
  const logRows = matchedNews.map((item) => ({
    subscriber_id: subscriber.id,
    subscriber_email: subscriber.email,
    newsletter_item_id: item.id,
    status,
    error_message: errorMessage,
  }));

  const { error } = await supabaseAdmin
    .from("newsletter_delivery_logs")
    .insert(logRows);

  if (error) {
    console.error("newsletter_delivery_logs 저장 실패:", error.message);
  }
}

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-admin-secret");

    if (!secret || secret !== adminSecret) {
      return NextResponse.json(
        { error: "권한이 없습니다. ADMIN_SECRET을 확인하세요." },
        { status: 401 }
      );
    }

    const { data: subscribers, error: subscriberError } = await supabaseAdmin
      .from("subscribers")
      .select("id, email, job_role, interest_area, purpose, difficulty");

    if (subscriberError) {
      return NextResponse.json(
        {
          error: "구독자 목록을 불러오지 못했습니다.",
          detail: subscriberError.message,
        },
        { status: 500 }
      );
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({
        message: "발송할 구독자가 없습니다.",
        sent: 0,
        failed: 0,
        skipped: 0,
      });
    }

    const { data: newsletterItems, error: newsletterError } =
      await supabaseAdmin
        .from("newsletter_items")
        .select(
          "id, title, summary, url, category, difficulty, is_sent, created_at"
        )
        .eq("is_sent", false)
        .order("created_at", { ascending: false });

    if (newsletterError) {
      return NextResponse.json(
        {
          error: "뉴스 목록을 불러오지 못했습니다.",
          detail: newsletterError.message,
        },
        { status: 500 }
      );
    }

    if (!newsletterItems || newsletterItems.length === 0) {
      return NextResponse.json({
        message:
          "발송할 뉴스가 없습니다. newsletter_items 테이블에 is_sent=false 뉴스가 있는지 확인하세요.",
        sent: 0,
        failed: 0,
        skipped: 0,
      });
    }

    const results: {
      email: string;
      status: "sent" | "failed" | "skipped";
      matchedNewsCount?: number;
      reason?: string;
      subscriberInterest?: string | null;
      matchedCategories?: string[];
    }[] = [];

    const sentNewsletterItemIds = new Set<number>();

    for (const subscriber of subscribers as Subscriber[]) {
      if (!subscriber.email) {
        results.push({
          email: "unknown",
          status: "skipped",
          reason: "이메일 주소가 없습니다.",
        });
        continue;
      }

      const matchedNews = (newsletterItems as NewsletterItem[]).filter((item) =>
        isNewsMatchedToSubscriber(subscriber, item)
      );

      if (matchedNews.length === 0) {
        results.push({
          email: subscriber.email,
          status: "skipped",
          reason:
            "관심 분야와 일치하는 뉴스가 없습니다. 뉴스 category와 구독자 interest_area를 확인하세요.",
          subscriberInterest: subscriber.interest_area,
        });
        continue;
      }

      const { subject, html } = generateNewsletter(subscriber, matchedNews);

      try {
        const sendResult = await resend.emails.send({
          from: resendFromEmail,
          to: subscriber.email,
          subject,
          html,
        });

        if (sendResult.error) {
          throw new Error(getErrorMessage(sendResult.error));
        }

        await saveDeliveryLogs(subscriber, matchedNews, "sent", null);

        matchedNews.forEach((item) => {
          sentNewsletterItemIds.add(item.id);
        });

        results.push({
          email: subscriber.email,
          status: "sent",
          matchedNewsCount: matchedNews.length,
          subscriberInterest: subscriber.interest_area,
          matchedCategories: matchedNews.map((item) => item.category),
        });
      } catch (sendError) {
        const errorMessage = getErrorMessage(sendError);

        await saveDeliveryLogs(
          subscriber,
          matchedNews,
          "failed",
          errorMessage
        );

        results.push({
          email: subscriber.email,
          status: "failed",
          matchedNewsCount: matchedNews.length,
          reason: errorMessage,
          subscriberInterest: subscriber.interest_area,
          matchedCategories: matchedNews.map((item) => item.category),
        });
      }
    }

    if (sentNewsletterItemIds.size > 0) {
      const ids = Array.from(sentNewsletterItemIds);

      const { error: updateError } = await supabaseAdmin
        .from("newsletter_items")
        .update({ is_sent: true })
        .in("id", ids);

      if (updateError) {
        return NextResponse.json(
          {
            error:
              "일부 이메일은 발송되었지만 newsletter_items의 is_sent 업데이트에 실패했습니다.",
            detail: updateError.message,
            results,
          },
          { status: 500 }
        );
      }
    }

    const sentCount = results.filter((result) => result.status === "sent")
      .length;
    const failedCount = results.filter((result) => result.status === "failed")
      .length;
    const skippedCount = results.filter((result) => result.status === "skipped")
      .length;

    return NextResponse.json({
      message: `뉴스레터 발송 완료: ${sentCount}명 발송, ${failedCount}명 실패, ${skippedCount}명 제외`,
      sent: sentCount,
      failed: failedCount,
      skipped: skippedCount,
      available_news_count: newsletterItems.length,
      used_newsletter_items: Array.from(sentNewsletterItemIds),
      from: resendFromEmail,
      results,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "서버 오류가 발생했습니다.",
        detail: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}