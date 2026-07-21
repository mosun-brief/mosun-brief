import { NextResponse } from "next/server";
import { CATEGORY_GROUPS } from "@/lib/categoryQuestions";

export const dynamic = "force-dynamic";

// app/api/category-groups/route.ts와 같은 목적 — 관리자 아이템 타겟팅 화면이
// 참조하는 옵션 목록. lib/categoryQuestions.ts 하나만 참조하므로 레거시 별칭
// (writing_creation 등)이 다시 섞여 들어올 수 없습니다. label/description은
// 관리자 관점 문구(adminLabel/adminDescription)를 돌려줍니다.
export async function GET() {
  const options = CATEGORY_GROUPS.flatMap((group) =>
    group.options.map((option, index) => ({
      group_key: group.key,
      option_value: option.value,
      label: option.adminLabel,
      description: option.adminDescription,
      sort_order: index + 1,
      is_active: true,
    }))
  );

  return NextResponse.json({ ok: true, options });
}
