import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type HnHit = {
  title?: string;
  story_title?: string;
  url?: string;
  story_url?: string;
  author?: string;
  created_at?: string;
  objectID?: string;
};

type HnResponse = {
  hits?: HnHit[];
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

function categorizeNews(title: string) {
  const lower = title.toLowerCase();

  if (
    lower.includes("health") ||
    lower.includes("medical") ||
    lower.includes("medicine") ||
    lower.includes("hospital") ||
    lower.includes("doctor") ||
    lower.includes("clinical")
  ) {
    return "healthcare_ai";
  }

  if (
    lower.includes("robot") ||
    lower.includes("robotics") ||
    lower.includes("humanoid") ||
    lower.includes("physical ai")
  ) {
    return "robotics";
  }

  if (
    lower.includes("stock") ||
    lower.includes("market") ||
    lower.includes("investment") ||
    lower.includes("nvidia") ||
    lower.includes("semiconductor") ||
    lower.includes("chip")
  ) {
    return "investment";
  }

  if (
    lower.includes("paper") ||
    lower.includes("research") ||
    lower.includes("benchmark") ||
    lower.includes("model") ||
    lower.includes("llm")
  ) {
    return "research";
  }

  if (
    lower.includes("startup") ||
    lower.includes("funding") ||
    lower.includes("business")
  ) {
    return "startup";
  }

  if (
    lower.includes("agent") ||
    lower.includes("automation") ||
    lower.includes("productivity") ||
    lower.includes("workflow") ||
    lower.includes("tool")
  ) {
    return "productivity";
  }

  return "general_ai";
}

function makeSummary(title: string, url: string | null) {
  if (url) {
    return `AI 관련 최신 글입니다. "${title}" 이슈가 실제 제품, 연구, 산업 변화 중 어디에 연결되는지 확인해볼 만합니다.`;
  }

  return `AI 관련 최신 글입니다. 원문 링크가 없는 항목이므로 제목 중심으로 흐름을 확인하세요.`;
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

    const response = await fetch(
      "https://hn.algolia.com/api/v1/search_by_date?query=AI&tags=story&hitsPerPage=10",
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "외부 뉴스 데이터를 불러오지 못했습니다.",
          detail: `status: ${response.status}`,
        },
        { status: 500 }
      );
    }

    const data = (await response.json()) as HnResponse;
    const hits = data.hits || [];

    if (hits.length === 0) {
      return NextResponse.json({
        message: "수집된 뉴스가 없습니다.",
        inserted: 0,
        skipped: 0,
      });
    }

    let inserted = 0;
    let skipped = 0;

    const insertedItems = [];

    for (const hit of hits) {
      const title = hit.title || hit.story_title;
      const url = hit.url || hit.story_url || null;

      if (!title) {
        skipped++;
        continue;
      }

      const { data: existingItem, error: existingError } = await supabaseAdmin
        .from("newsletter_items")
        .select("id")
        .eq("title", title)
        .maybeSingle();

      if (existingError) {
        skipped++;
        continue;
      }

      if (existingItem) {
        skipped++;
        continue;
      }

      const category = categorizeNews(title);
      const summary = makeSummary(title, url);

      const { data: insertedItem, error: insertError } = await supabaseAdmin
        .from("newsletter_items")
        .insert([
          {
            title,
            summary,
            url,
            category,
            difficulty: "normal",
            is_sent: false,
          },
        ])
        .select("id, title, category, difficulty, is_sent")
        .single();

      if (insertError) {
        skipped++;
        continue;
      }

      inserted++;
      insertedItems.push(insertedItem);
    }

    return NextResponse.json({
      message: `뉴스 자동 수집 완료: ${inserted}개 등록, ${skipped}개 제외`,
      inserted,
      skipped,
      items: insertedItems,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류";

    return NextResponse.json(
      {
        error: "뉴스 자동 수집 중 서버 오류가 발생했습니다.",
        detail: errorMessage,
      },
      { status: 500 }
    );
  }
}