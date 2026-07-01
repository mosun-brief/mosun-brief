import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type CategoryGroupKey =
  | "ai_emotion"
  | "ai_intent"
  | "blocker"
  | "action_time";

type NewsletterItemRequestBody = {
  admin_secret?: string;

  title?: string;
  category?: string;
  difficulty?: string;

  summary?: string;
  url?: string;
  source_url?: string;
  main_summary?: string;
  balance_summary?: string;
  action_hint?: string;

  source_type?: string;
  stance?: string;

  target_persona?: string;
  target_user_state?: string;
  target_ai_emotion?: string;
  target_ai_intent?: string;
  target_blocker?: string;
  target_action_time?: string;

  category_targets?: {
    group_key: CategoryGroupKey;
    option_value: string;
  }[];

  is_active?: boolean;
};

type PatchNewsletterItemBody = {
  admin_secret?: string;
  id?: number;
  is_active?: boolean;
  is_sent?: boolean;
};

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

function getAdminSecretFromRequest(
  request: NextRequest,
  body?: { admin_secret?: string }
) {
  const headerSecret = request.headers.get("x-admin-secret");

  if (headerSecret) {
    return headerSecret.trim();
  }

  if (body?.admin_secret) {
    return String(body.admin_secret).trim();
  }

  const querySecret = request.nextUrl.searchParams.get("admin_secret");

  if (querySecret) {
    return querySecret.trim();
  }

  return "";
}

function verifyAdminSecret(
  request: NextRequest,
  body?: { admin_secret?: string }
) {
  const serverSecret = process.env.ADMIN_SECRET;

  if (!serverSecret) {
    return {
      ok: false,
      message: "서버에 ADMIN_SECRET이 설정되어 있지 않습니다.",
    };
  }

  const requestSecret = getAdminSecretFromRequest(request, body);

  if (!requestSecret) {
    return {
      ok: false,
      message: "ADMIN_SECRET이 필요합니다.",
    };
  }

  if (requestSecret !== serverSecret) {
    return {
      ok: false,
      message: "ADMIN_SECRET이 올바르지 않습니다.",
    };
  }

  return {
    ok: true,
    message: "ok",
  };
}

async function readBody<T>(request: NextRequest): Promise<T> {
  try {
    const body = await request.json();
    return body || {};
  } catch {
    return {} as T;
  }
}

function normalizeText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function nullableText(value: unknown) {
  const normalized = normalizeText(value);
  return normalized ? normalized : null;
}

function isCategoryGroupKey(value: unknown): value is CategoryGroupKey {
  return (
    value === "ai_emotion" ||
    value === "ai_intent" ||
    value === "blocker" ||
    value === "action_time"
  );
}

function normalizeCategoryTargets(
  targets: NewsletterItemRequestBody["category_targets"]
) {
  if (!Array.isArray(targets)) return [];

  const deduped = new Map<
    string,
    {
      group_key: CategoryGroupKey;
      option_value: string;
    }
  >();

  for (const target of targets) {
    if (!target) continue;
    if (!isCategoryGroupKey(target.group_key)) continue;

    const value = normalizeText(target.option_value);
    if (!value) continue;

    const key = `${target.group_key}:${value}`;

    deduped.set(key, {
      group_key: target.group_key,
      option_value: value,
    });
  }

  return Array.from(deduped.values());
}

export async function GET(request: NextRequest) {
  try {
    const auth = verifyAdminSecret(request);

    if (!auth.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: auth.message,
        },
        { status: 401 }
      );
    }

    const supabase = getSupabaseAdminClient();

    const { data: items, error: itemsError } = await supabase
      .from("newsletter_items")
      .select(
        `
        id,
        title,
        category,
        difficulty,
        summary,
        url,
        source_type,
        stance,
        target_persona,
        source_url,
        main_summary,
        balance_summary,
        action_hint,
        target_user_state,
        target_ai_emotion,
        target_ai_intent,
        target_blocker,
        target_action_time,
        is_active,
        is_sent,
        created_at
      `
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (itemsError) {
      return NextResponse.json(
        {
          ok: false,
          message: itemsError.message,
        },
        { status: 500 }
      );
    }

    const itemIds = (items || []).map((item) => item.id);

    let targetsByItemId: Record<
      number,
      {
        group_key: CategoryGroupKey;
        option_value: string;
      }[]
    > = {};

    if (itemIds.length > 0) {
      const { data: targets, error: targetsError } = await supabase
        .from("newsletter_item_category_targets")
        .select("newsletter_item_id, group_key, option_value")
        .in("newsletter_item_id", itemIds);

      if (targetsError) {
        return NextResponse.json(
          {
            ok: false,
            message: targetsError.message,
          },
          { status: 500 }
        );
      }

      targetsByItemId = (targets || []).reduce(
        (
          acc: Record<
            number,
            {
              group_key: CategoryGroupKey;
              option_value: string;
            }[]
          >,
          target
        ) => {
          if (!isCategoryGroupKey(target.group_key)) return acc;

          if (!acc[target.newsletter_item_id]) {
            acc[target.newsletter_item_id] = [];
          }

          acc[target.newsletter_item_id].push({
            group_key: target.group_key,
            option_value: target.option_value,
          });

          return acc;
        },
        {}
      );
    }

    return NextResponse.json({
      ok: true,
      message: "뉴스 자료를 불러왔습니다.",
      items: (items || []).map((item) => ({
        ...item,
        category_targets: targetsByItemId[item.id] || [],
      })),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await readBody<NewsletterItemRequestBody>(request);
    const auth = verifyAdminSecret(request, body);

    if (!auth.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: auth.message,
        },
        { status: 401 }
      );
    }

    const title = normalizeText(body.title);
    const mainSummary = normalizeText(body.main_summary || body.summary);
    const actionHint = normalizeText(body.action_hint);

    if (!title) {
      return NextResponse.json(
        {
          ok: false,
          message: "제목을 입력해주세요.",
        },
        { status: 400 }
      );
    }

    if (!mainSummary) {
      return NextResponse.json(
        {
          ok: false,
          message: "핵심 요약을 입력해주세요.",
        },
        { status: 400 }
      );
    }

    if (!actionHint) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Action hint를 입력해주세요. B단계부터는 메일의 '작은 실행' 영역에 반드시 필요합니다.",
        },
        { status: 400 }
      );
    }

    const categoryTargets = normalizeCategoryTargets(body.category_targets);

    const targetAiEmotion =
      nullableText(body.target_ai_emotion) ||
      categoryTargets.find((target) => target.group_key === "ai_emotion")
        ?.option_value ||
      null;

    const targetAiIntent =
      nullableText(body.target_ai_intent) ||
      categoryTargets.find((target) => target.group_key === "ai_intent")
        ?.option_value ||
      null;

    const targetBlocker =
      nullableText(body.target_blocker) ||
      categoryTargets.find((target) => target.group_key === "blocker")
        ?.option_value ||
      null;

    const targetActionTime =
      nullableText(body.target_action_time) ||
      categoryTargets.find((target) => target.group_key === "action_time")
        ?.option_value ||
      null;

    const sourceUrl = nullableText(body.source_url || body.url);

    const insertPayload = {
      title,
      category: nullableText(body.category) || "general_ai",
      difficulty: nullableText(body.difficulty) || "normal",

      summary: mainSummary,
      main_summary: mainSummary,

      url: sourceUrl,
      source_url: sourceUrl,

      source_type: nullableText(body.source_type) || "main",
      stance: nullableText(body.stance) || "neutral",

      target_persona: nullableText(body.target_persona),
      target_user_state: nullableText(body.target_user_state),

      balance_summary: nullableText(body.balance_summary),
      action_hint: actionHint,

      target_ai_emotion: targetAiEmotion,
      target_ai_intent: targetAiIntent,
      target_blocker: targetBlocker,
      target_action_time: targetActionTime,

      is_active:
        typeof body.is_active === "boolean" ? body.is_active : true,
      is_sent: false,
    };

    const supabase = getSupabaseAdminClient();

    const { data: item, error: insertError } = await supabase
      .from("newsletter_items")
      .insert(insertPayload)
      .select(
        `
        id,
        title,
        category,
        difficulty,
        summary,
        url,
        source_type,
        stance,
        target_persona,
        source_url,
        main_summary,
        balance_summary,
        action_hint,
        target_user_state,
        target_ai_emotion,
        target_ai_intent,
        target_blocker,
        target_action_time,
        is_active,
        is_sent,
        created_at
      `
      )
      .single();

    if (insertError) {
      return NextResponse.json(
        {
          ok: false,
          message: insertError.message,
        },
        { status: 500 }
      );
    }

    if (!item?.id) {
      return NextResponse.json(
        {
          ok: false,
          message: "뉴스 자료 ID를 가져오지 못했습니다.",
        },
        { status: 500 }
      );
    }

    const targetRows = categoryTargets.map((target) => ({
      newsletter_item_id: item.id,
      group_key: target.group_key,
      option_value: target.option_value,
    }));

    if (targetRows.length > 0) {
      const { error: targetError } = await supabase
        .from("newsletter_item_category_targets")
        .insert(targetRows);

      if (targetError) {
        return NextResponse.json(
          {
            ok: false,
            message: `뉴스 자료는 저장됐지만 타깃 저장 중 오류가 발생했습니다: ${targetError.message}`,
            item,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      ok: true,
      message: "뉴스 자료가 등록되었습니다.",
      item: {
        ...item,
        category_targets: categoryTargets,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await readBody<PatchNewsletterItemBody>(request);
    const auth = verifyAdminSecret(request, body);

    if (!auth.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: auth.message,
        },
        { status: 401 }
      );
    }

    const id = Number(body.id);

    if (!id || Number.isNaN(id)) {
      return NextResponse.json(
        {
          ok: false,
          message: "수정할 뉴스 자료 ID가 필요합니다.",
        },
        { status: 400 }
      );
    }

    const updatePayload: {
      is_active?: boolean;
      is_sent?: boolean;
    } = {};

    if (typeof body.is_active === "boolean") {
      updatePayload.is_active = body.is_active;
    }

    if (typeof body.is_sent === "boolean") {
      updatePayload.is_sent = body.is_sent;
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "수정할 값이 없습니다.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    const { data: item, error } = await supabase
      .from("newsletter_items")
      .update(updatePayload)
      .eq("id", id)
      .select(
        `
        id,
        title,
        category,
        difficulty,
        is_active,
        is_sent,
        created_at
      `
      )
      .single();

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message:
        typeof updatePayload.is_active === "boolean"
          ? updatePayload.is_active
            ? "뉴스 자료를 활성화했습니다."
            : "뉴스 자료를 비활성화했습니다."
          : "뉴스 자료를 수정했습니다.",
      item,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      { status: 500 }
    );
  }
}