import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type SubscribeLabRequestBody = {
  email?: string;
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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function readBody(request: Request): Promise<SubscribeLabRequestBody> {
  try {
    const body = await request.json();
    return body || {};
  } catch {
    return {};
  }
}

export async function POST(request: Request) {
  try {
    const body = await readBody(request);

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        {
          ok: false,
          message: "올바른 이메일을 입력해주세요.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // 이미 등록된 이메일(브리핑 구독자 포함)은 진단 정보와 출처를 건드리지 않고
    // 활성 상태만 복구합니다.
    const { data: existing, error: findError } = await supabase
      .from("subscribers")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (findError) {
      return NextResponse.json(
        {
          ok: false,
          message: `구독자 확인 중 오류가 발생했습니다: ${findError.message}`,
        },
        { status: 500 }
      );
    }

    if (existing?.id) {
      const { error: updateError } = await supabase
        .from("subscribers")
        .update({ is_active: true, unsubscribed_at: null })
        .eq("id", existing.id);

      if (updateError) {
        return NextResponse.json(
          {
            ok: false,
            message: `구독 복구 중 오류가 발생했습니다: ${updateError.message}`,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        message: "이미 등록된 이메일입니다. 구독이 활성 상태로 유지됩니다.",
      });
    }

    const { error: insertError } = await supabase.from("subscribers").insert({
      email,
      signup_source: "lab",
      persona_type: "Lab-Follower",
      job_role: null,
      interest_area: "not_sure",
      purpose: "too_much_info",
      difficulty: "easy",
      ai_emotion: "curious",
      ai_intent: "not_sure",
      blocker: "too_much_info",
      action_time: "30min",
      is_active: true,
      unsubscribed_at: null,
    });

    if (insertError) {
      const message = insertError.message.includes("signup_source")
        ? "subscribers 테이블에 signup_source 컬럼이 없습니다. Supabase SQL Editor에서 마이그레이션을 먼저 실행해주세요."
        : `구독 저장 중 오류가 발생했습니다: ${insertError.message}`;

      return NextResponse.json({ ok: false, message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: "구독이 완료되었습니다. 새 실험 일지가 나오면 이메일로 보내드릴게요.",
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
