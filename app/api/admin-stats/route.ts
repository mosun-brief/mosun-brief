import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-admin-secret");

    if (!secret || secret !== adminSecret) {
      return NextResponse.json(
        { error: "권한이 없습니다. ADMIN_SECRET을 확인하세요." },
        { status: 401 }
      );
    }

    const { count: subscriberCount, error: subscriberError } =
      await supabaseAdmin
        .from("subscribers")
        .select("*", { count: "exact", head: true });

    if (subscriberError) {
      return NextResponse.json(
        {
          error: "구독자 수를 불러오지 못했습니다.",
          detail: subscriberError.message,
        },
        { status: 500 }
      );
    }

    const { count: pendingNewsCount, error: pendingNewsError } =
      await supabaseAdmin
        .from("newsletter_items")
        .select("*", { count: "exact", head: true })
        .eq("is_sent", false);

    if (pendingNewsError) {
      return NextResponse.json(
        {
          error: "발송 대기 뉴스 수를 불러오지 못했습니다.",
          detail: pendingNewsError.message,
        },
        { status: 500 }
      );
    }

    const { data: recentNews, error: recentNewsError } = await supabaseAdmin
      .from("newsletter_items")
      .select("id, title, category, difficulty, is_sent, created_at")
      .order("created_at", { ascending: false })
      .limit(8);

    if (recentNewsError) {
      return NextResponse.json(
        {
          error: "최근 뉴스를 불러오지 못했습니다.",
          detail: recentNewsError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subscriberCount: subscriberCount || 0,
      pendingNewsCount: pendingNewsCount || 0,
      recentNews: recentNews || [],
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류";

    return NextResponse.json(
      {
        error: "관리자 상태 조회 중 서버 오류가 발생했습니다.",
        detail: errorMessage,
      },
      { status: 500 }
    );
  }
}