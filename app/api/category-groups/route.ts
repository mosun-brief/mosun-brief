import { NextResponse } from "next/server";
import { ADMIN_GROUP_TITLES, CATEGORY_GROUPS } from "@/lib/categoryQuestions";

export const dynamic = "force-dynamic";

// 관리자 아이템 타겟팅 화면(app/admin/newsletter-items/page.tsx)이 읽는 라우트.
// 예전에는 이 라우트가 아예 없어서 항상 404였고, 그래서 화면은 늘 자체
// 하드코딩 FALLBACK 목록(레거시 별칭 포함)만 보여줬습니다. lib/categoryQuestions.ts
// 하나만 참조해, value는 구독자가 실제로 답할 수 있는 값과 100% 같은 목록을
// 돌려줍니다. label은 구독자용 group.label이 아니라 ADMIN_GROUP_TITLES를
// 씁니다 — admin/newsletter-items/page.tsx의 FALLBACK_GROUPS와 반드시
// 같은 텍스트여야, 이 fetch가 성공했을 때와 실패해서 fallback을 쓸 때
// 화면에 보이는 축 제목이 달라지지 않습니다.
export async function GET() {
  const groups = CATEGORY_GROUPS.map((group, index) => ({
    group_key: group.key,
    label: ADMIN_GROUP_TITLES[group.key],
    description: null,
    sort_order: index + 1,
    is_active: true,
  }));

  return NextResponse.json({ ok: true, groups });
}
