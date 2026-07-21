import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyFeedbackToken } from "@/lib/linkTokens";

export const dynamic = "force-dynamic";

// /feedback 페이지(App Router 클라이언트 컴포넌트)가 그룹 선택/토글과 메모를
// 페이지 이동 없이 저장하기 위해 쓰는 전용 엔드포인트입니다.
// 기존 /api/feedback(GET 브릿지 → POST) 은 이미 발송된 메일의 5버튼 링크를 위한
// 레거시 경로로 그대로 유지하고, 이 라우트와는 분리했습니다.
//
// 이 라우트는 실제 저장(POST)이 항상 브라우저에서 실행된 JS onClick으로만
// 발생하고, GET은 상태 조회만 수행해 부작용이 없습니다. 따라서 메일
// 스캐너/프리페처가 링크를 미리 열어도(=GET만 발생) 데이터가 바뀌지 않아,
// 레거시 라우트가 썼던 "GET 브릿지 페이지로 자동 POST를 유도" 기법이
// 여기서는 필요하지 않습니다.

type SatisfactionType = "useful" | "deeper" | "not_relevant";
type ExecutionType = "action_done" | "action_not_done";

const SATISFACTION_TYPES: SatisfactionType[] = ["useful", "deeper", "not_relevant"];
const EXECUTION_TYPES: ExecutionType[] = ["action_done", "action_not_done"];

function isSatisfactionType(value: string): value is SatisfactionType {
  return (SATISFACTION_TYPES as string[]).includes(value);
}

function isExecutionType(value: string): value is ExecutionType {
  return (EXECUTION_TYPES as string[]).includes(value);
}

type FeedbackState = {
  satisfaction: SatisfactionType | null;
  execution: ExecutionType | null;
  note: string | null;
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

function normalizeText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeEmail(value: unknown) {
  return normalizeText(value).toLowerCase();
}

function parseNumberId(value: unknown) {
  if (value === null || value === undefined || value === "") return null;

  const numeric = Number(value);

  if (!numeric || Number.isNaN(numeric)) return null;

  return numeric;
}

async function fetchState({
  supabase,
  subscriberId,
  newsletterItemId,
}: {
  supabase: ReturnType<typeof getSupabaseAdminClient>;
  subscriberId: string;
  newsletterItemId: number;
}): Promise<FeedbackState> {
  const { data, error } = await supabase
    .from("feedbacks")
    .select("feedback_type, free_text, created_at")
    .eq("subscriber_id", subscriberId)
    .eq("newsletter_item_id", newsletterItemId)
    .in("feedback_type", [...SATISFACTION_TYPES, ...EXECUTION_TYPES, "note"])
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = data ?? [];

  const satisfactionRow = rows.find((row) =>
    isSatisfactionType(row.feedback_type ?? "")
  );
  const executionRow = rows.find((row) => isExecutionType(row.feedback_type ?? ""));
  const noteRow = rows.find((row) => row.feedback_type === "note");

  return {
    satisfaction: (satisfactionRow?.feedback_type as SatisfactionType) ?? null,
    execution: (executionRow?.feedback_type as ExecutionType) ?? null,
    note: noteRow?.free_text ?? null,
  };
}

function getAuthParamsFromSearchParams(searchParams: URLSearchParams) {
  const subscriberId = normalizeText(searchParams.get("subscriber_id")) || null;
  const newsletterItemId = parseNumberId(searchParams.get("newsletter_item_id"));
  const token = normalizeText(searchParams.get("token")) || null;

  return { subscriberId, newsletterItemId, token };
}

export async function GET(request: NextRequest) {
  try {
    const { subscriberId, newsletterItemId, token } = getAuthParamsFromSearchParams(
      request.nextUrl.searchParams
    );

    if (!subscriberId || !newsletterItemId) {
      return NextResponse.json(
        { ok: false, message: "subscriber_id와 newsletter_item_id가 필요합니다." },
        { status: 400 }
      );
    }

    if (!verifyFeedbackToken({ subscriberId, itemId: newsletterItemId }, token)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "유효하지 않거나 만료된 피드백 링크입니다. 받으신 최신 메일의 버튼을 다시 눌러주세요.",
        },
        { status: 401 }
      );
    }

    const supabase = getSupabaseAdminClient();
    const state = await fetchState({ supabase, subscriberId, newsletterItemId });

    return NextResponse.json({ ok: true, ...state });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";

    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

type PostBody = {
  subscriber_id?: string;
  subscriber_email?: string | null;
  newsletter_item_id?: number | string;
  token?: string;
  action?: "select" | "clear" | "note";
  type?: string;
  free_text?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as PostBody;

    const subscriberId = normalizeText(body.subscriber_id) || null;
    const subscriberEmail = normalizeEmail(body.subscriber_email) || null;
    const newsletterItemId = parseNumberId(body.newsletter_item_id);
    const token = normalizeText(body.token) || null;
    const action = body.action;

    if (!subscriberId || !newsletterItemId) {
      return NextResponse.json(
        { ok: false, message: "subscriber_id와 newsletter_item_id가 필요합니다." },
        { status: 400 }
      );
    }

    if (!verifyFeedbackToken({ subscriberId, itemId: newsletterItemId }, token)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "유효하지 않거나 만료된 피드백 링크입니다. 받으신 최신 메일의 버튼을 다시 눌러주세요.",
        },
        { status: 401 }
      );
    }

    const supabase = getSupabaseAdminClient();

    if (action === "select" || action === "clear") {
      const type = normalizeText(body.type);

      const groupTypes: string[] = isSatisfactionType(type)
        ? SATISFACTION_TYPES
        : isExecutionType(type)
        ? EXECUTION_TYPES
        : [];

      if (groupTypes.length === 0) {
        return NextResponse.json(
          { ok: false, message: "올바르지 않은 type입니다." },
          { status: 400 }
        );
      }

      // 같은 그룹(만족도 또는 실행 여부) 안에서는 항상 최대 1개만 남도록,
      // 새로 선택하기 전에 그룹 내 기존 행을 먼저 지웁니다.
      // action이 "clear"면 지우기만 하고 다시 넣지 않아 토글 해제가 됩니다.
      const { error: deleteError } = await supabase
        .from("feedbacks")
        .delete()
        .eq("subscriber_id", subscriberId)
        .eq("newsletter_item_id", newsletterItemId)
        .in("feedback_type", groupTypes);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      if (action === "select") {
        const actionDone =
          type === "action_done" ? true : type === "action_not_done" ? false : null;

        const { error: insertError } = await supabase.from("feedbacks").insert({
          subscriber_id: subscriberId,
          subscriber_email: subscriberEmail,
          newsletter_item_id: newsletterItemId,
          feedback_type: type,
          action_done: actionDone,
        });

        if (insertError) {
          throw new Error(insertError.message);
        }
      }

      const state = await fetchState({ supabase, subscriberId, newsletterItemId });
      return NextResponse.json({ ok: true, ...state });
    }

    if (action === "note") {
      const freeText = normalizeText(body.free_text);

      const { data: existing, error: findError } = await supabase
        .from("feedbacks")
        .select("id")
        .eq("subscriber_id", subscriberId)
        .eq("newsletter_item_id", newsletterItemId)
        .eq("feedback_type", "note")
        .maybeSingle();

      if (findError) {
        throw new Error(findError.message);
      }

      if (!freeText) {
        if (existing?.id) {
          const { error: deleteNoteError } = await supabase
            .from("feedbacks")
            .delete()
            .eq("id", existing.id);

          if (deleteNoteError) {
            throw new Error(deleteNoteError.message);
          }
        }
      } else if (existing?.id) {
        const { error: updateError } = await supabase
          .from("feedbacks")
          .update({ free_text: freeText })
          .eq("id", existing.id);

        if (updateError) {
          throw new Error(updateError.message);
        }
      } else {
        const { error: insertError } = await supabase.from("feedbacks").insert({
          subscriber_id: subscriberId,
          subscriber_email: subscriberEmail,
          newsletter_item_id: newsletterItemId,
          feedback_type: "note",
          free_text: freeText,
        });

        if (insertError) {
          throw new Error(insertError.message);
        }
      }

      const state = await fetchState({ supabase, subscriberId, newsletterItemId });
      return NextResponse.json({ ok: true, ...state });
    }

    return NextResponse.json(
      { ok: false, message: "올바르지 않은 action입니다." },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";

    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}
