import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type Subscriber = {
  id: string;
  email: string;
  ai_emotion: string | null;
  ai_intent: string | null;
  blocker: string | null;
  action_time: string | null;
  persona_type: string | null;
  created_at: string;
};

type Feedback = {
  id: number;
  subscriber_email: string | null;
  feedback_type: string | null;
  action_done: boolean | null;
  free_text: string | null;
  created_at: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminSecret = process.env.ADMIN_SECRET;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.");
}

if (!supabaseServiceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.");
}

if (!adminSecret) {
  throw new Error("ADMIN_SECRET이 설정되지 않았습니다.");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

function getPersonaCounts(subscribers: Subscriber[]) {
  const counts: Record<string, number> = {};

  for (const subscriber of subscribers) {
    const persona = subscriber.persona_type || "Unknown";
    counts[persona] = (counts[persona] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([persona, count]) => ({
      persona,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

function getFeedbackCounts(feedbacks: Feedback[]) {
  const counts: Record<string, number> = {};

  for (const feedback of feedbacks) {
    const type = feedback.feedback_type || "unknown";
    counts[type] = (counts[type] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([type, count]) => ({
      type,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function GET(request: NextRequest) {
  try {
    const secretFromQuery = request.nextUrl.searchParams.get("secret");
    const secretFromHeader = request.headers.get("x-admin-secret");
    const secret = secretFromHeader || secretFromQuery;

    if (secret !== adminSecret) {
      return NextResponse.json(
        {
          error: "관리자 인증에 실패했습니다.",
        },
        { status: 401 }
      );
    }

    const { data: subscribers, error: subscribersError } = await supabaseAdmin
      .from("subscribers")
      .select(
        "id, email, ai_emotion, ai_intent, blocker, action_time, persona_type, created_at"
      )
      .order("created_at", { ascending: false });

    if (subscribersError) {
      return NextResponse.json(
        {
          error: "구독자 조회 실패",
          detail: subscribersError.message,
        },
        { status: 500 }
      );
    }

    const { data: feedbacks, error: feedbacksError } = await supabaseAdmin
      .from("feedbacks")
      .select(
        "id, subscriber_email, feedback_type, action_done, free_text, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (feedbacksError) {
      return NextResponse.json(
        {
          error: "피드백 조회 실패",
          detail: feedbacksError.message,
        },
        { status: 500 }
      );
    }

    const safeSubscribers = (subscribers || []) as Subscriber[];
    const safeFeedbacks = (feedbacks || []) as Feedback[];

    return NextResponse.json({
      totalSubscribers: safeSubscribers.length,
      totalFeedbacks: safeFeedbacks.length,
      personaCounts: getPersonaCounts(safeSubscribers),
      feedbackCounts: getFeedbackCounts(safeFeedbacks),
      recentSubscribers: safeSubscribers.slice(0, 10),
      recentFeedbacks: safeFeedbacks.slice(0, 10),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "관리자 통계 조회 중 서버 오류",
        detail: message,
      },
      { status: 500 }
    );
  }
}