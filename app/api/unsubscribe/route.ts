import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyUnsubscribeToken } from "@/lib/linkTokens";

export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.");
}

if (!supabaseServiceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const token = typeof body.token === "string" ? body.token.trim() : "";

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "올바른 이메일 주소를 입력해주세요." },
        { status: 400 }
      );
    }

    // 본인 확인: 이메일에 담아 보낸 서명 토큰이 있어야만 구독 취소가 진행됩니다.
    // 이렇게 하면 제3자가 임의 이메일을 넣어 남의 구독을 취소하는 것(IDOR)을 막습니다.
    if (!verifyUnsubscribeToken(email, token)) {
      return NextResponse.json(
        {
          error:
            "유효한 구독 취소 링크가 필요합니다. 받으신 이메일 하단의 '구독 취소' 링크를 눌러 진행해주세요.",
        },
        { status: 401 }
      );
    }

    // 하드 삭제 대신 소프트 삭제(복구 가능). 이력·피드백 연결이 보존됩니다.
    const { error: updateError } = await supabaseAdmin
      .from("subscribers")
      .update({ is_active: false, unsubscribed_at: new Date().toISOString() })
      .eq("email", email);

    if (updateError) {
      // 내부 오류 상세는 클라이언트에 노출하지 않고 서버 로그로만 남깁니다.
      console.error("[unsubscribe] update failed:", updateError.message);

      return NextResponse.json(
        { error: "구독 취소 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
        { status: 500 }
      );
    }

    // 존재 여부와 무관하게 동일한 응답을 반환해 이메일 존재 여부 노출(enumeration)을 막습니다.
    return NextResponse.json({
      message: "구독 취소가 완료되었습니다.",
    });
  } catch (error) {
    console.error(
      "[unsubscribe] unexpected error:",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      { error: "구독 취소 요청 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
