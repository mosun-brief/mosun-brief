import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.");
}

if (!supabaseServiceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: "이메일을 입력해주세요." },
        { status: 400 }
      );
    }

    const { data: existingSubscribers, error: findError } = await supabaseAdmin
      .from("subscribers")
      .select("id, email")
      .eq("email", email);

    if (findError) {
      return NextResponse.json(
        {
          error: "구독 정보를 확인하는 중 오류가 발생했습니다.",
          detail: findError.message,
        },
        { status: 500 }
      );
    }

    if (!existingSubscribers || existingSubscribers.length === 0) {
      return NextResponse.json({
        message: "이미 구독 해지되었거나 등록되지 않은 이메일입니다.",
        removed: 0,
      });
    }

    const { error: deleteError } = await supabaseAdmin
      .from("subscribers")
      .delete()
      .eq("email", email);

    if (deleteError) {
      return NextResponse.json(
        {
          error: "구독 해지 중 오류가 발생했습니다.",
          detail: deleteError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "구독 해지가 완료되었습니다.",
      removed: existingSubscribers.length,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류";

    return NextResponse.json(
      {
        error: "구독 해지 요청 중 서버 오류가 발생했습니다.",
        detail: errorMessage,
      },
      { status: 500 }
    );
  }
}