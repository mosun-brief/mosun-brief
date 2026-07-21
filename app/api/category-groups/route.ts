import { NextResponse } from "next/server";
import { CATEGORY_GROUPS } from "@/lib/categoryQuestions";

export const dynamic = "force-dynamic";

// 관리자 아이템 타겟팅 화면(app/admin/newsletter-items/page.tsx)이 읽는 라우트.
// 예전에는 이 라우트가 아예 없어서 항상 404였고, 그래서 화면은 늘 자체
// 하드코딩 FALLBACK 목록(레거시 별칭 포함)만 보여줬습니다. lib/categoryQuestions.ts
// 하나만 참조해, 구독자가 실제로 답할 수 있는 값과 100% 같은 목록을 돌려줍니다.
export async function GET() {
  const groups = CATEGORY_GROUPS.map((group, index) => ({
    group_key: group.key,
    label: group.label,
    description: group.question,
    sort_order: index + 1,
    is_active: true,
  }));

  return NextResponse.json({ ok: true, groups });
}
