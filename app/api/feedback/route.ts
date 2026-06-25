import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.");
}

if (!supabaseAnonKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function getFeedbackLabel(type: string | null) {
  switch (type) {
    case "done":
      return "해봤다";
    case "hard":
      return "어렵다";
    case "not_interested":
      return "관심 없다";
    case "deeper":
      return "더 깊게 알고 싶다";
    case "less_anxious":
      return "불안이 줄었다";
    case "different":
      return "다른 방향이 필요하다";
    default:
      return "피드백";
  }
}

function getPageHtml({
  title,
  message,
  detail,
  success,
}: {
  title: string;
  message: string;
  detail?: string;
  success: boolean;
}) {
  const accentColor = success ? "#2563eb" : "#dc2626";
  const badgeBg = success ? "#eff6ff" : "#fef2f2";
  const badgeText = success ? "#1d4ed8" : "#991b1b";

  return `
    <!doctype html>
    <html lang="ko">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${title}</title>
      </head>
      <body style="margin:0; font-family: Arial, sans-serif; background:#f3f4f6; color:#111827;">
        <main style="min-height:100vh; display:flex; align-items:center; justify-content:center; padding:32px 16px;">
          <section style="max-width:560px; width:100%; background:white; border-radius:24px; padding:34px 28px; box-shadow:0 24px 80px rgba(0,0,0,0.10);">
            <div style="display:inline-block; background:${badgeBg}; color:${badgeText}; font-size:13px; font-weight:900; padding:8px 12px; border-radius:999px; margin-bottom:18px;">
              AI-FU
            </div>

            <h1 style="font-size:30px; line-height:1.3; letter-spacing:-0.03em; margin:0 0 14px 0; color:#111827;">
              ${title}
            </h1>

            <p style="font-size:16px; line-height:1.75; color:#374151; margin:0 0 18px 0;">
              ${message}
            </p>

            ${
              detail
                ? `
                  <div style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:16px; padding:16px; margin-top:18px;">
                    <p style="font-size:14px; line-height:1.7; color:#4b5563; margin:0;">
                      ${detail}
                    </p>
                  </div>
                `
                : ""
            }

            <div style="height:1px; background:#e5e7eb; margin:26px 0;"></div>

            <p style="font-size:14px; line-height:1.7; color:#6b7280; margin:0;">
              다음 AI-FU 브리프에서는 이 반응을 바탕으로 더 잘 맞는 자료와 Action을 제안할게요.
            </p>

            <div style="margin-top:24px;">
              <a href="/" style="display:inline-block; background:${accentColor}; color:white; font-size:15px; font-weight:900; text-decoration:none; padding:12px 16px; border-radius:12px;">
                AI-FU 홈으로 가기
              </a>
            </div>
          </section>
        </main>
      </body>
    </html>
  `;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const subscriberId = searchParams.get("subscriber_id");
    const email = searchParams.get("email");
    const newsletterItemId = searchParams.get("newsletter_item_id");
    const feedbackType = searchParams.get("type");

    if (!email || !feedbackType) {
      return new NextResponse(
        getPageHtml({
          title: "피드백 저장 실패",
          message: "필수 정보가 부족해서 피드백을 저장하지 못했습니다.",
          detail: "이메일 또는 피드백 유형이 누락되었습니다.",
          success: false,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
          },
        }
      );
    }

    const { error } = await supabase.from("feedbacks").insert({
      subscriber_id: subscriberId || null,
      subscriber_email: email,
      newsletter_item_id: newsletterItemId ? Number(newsletterItemId) : null,
      feedback_type: feedbackType,
      action_done: feedbackType === "done",
      free_text: null,
    });

    if (error) {
      return new NextResponse(
        getPageHtml({
          title: "피드백 저장 실패",
          message: "Supabase에 피드백을 저장하는 중 문제가 발생했습니다.",
          detail: error.message,
          success: false,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
          },
        }
      );
    }

    const label = getFeedbackLabel(feedbackType);

    return new NextResponse(
      getPageHtml({
        title: "피드백이 저장되었습니다",
        message: `선택한 피드백은 “${label}”입니다.`,
        detail:
          "이 반응은 다음 브리프에서 자료 난이도, Action 크기, 설명 방식 조정에 활용됩니다.",
        success: true,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return new NextResponse(
      getPageHtml({
        title: "피드백 저장 실패",
        message: "예상하지 못한 서버 오류가 발생했습니다.",
        detail: message,
        success: false,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const subscriberId = body.subscriber_id || null;
    const email = body.email || null;
    const newsletterItemId = body.newsletter_item_id || null;
    const feedbackType = body.type || body.feedback_type || null;
    const freeText = body.free_text || null;

    if (!email || !feedbackType) {
      return NextResponse.json(
        {
          error: "필수 정보가 부족합니다.",
          required: ["email", "type"],
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("feedbacks")
      .insert({
        subscriber_id: subscriberId,
        subscriber_email: email,
        newsletter_item_id: newsletterItemId ? Number(newsletterItemId) : null,
        feedback_type: feedbackType,
        action_done: feedbackType === "done",
        free_text: freeText,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: "피드백 저장 실패",
          detail: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "피드백이 저장되었습니다.",
      feedback: data,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "피드백 저장 중 서버 오류",
        detail: message,
      },
      { status: 500 }
    );
  }
}