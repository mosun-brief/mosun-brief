import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const adminSecret = process.env.ADMIN_SECRET || "";

const MIN_FEEDBACK_COUNT = 50;

const ALLOWED_STATUS = ["pending", "reviewing", "done", "rejected"];

const FEEDBACK_TABLE_CANDIDATES = [
  { table: "newsletter_feedback", emailColumn: "subscriber_email" },
  { table: "newsletter_feedbacks", emailColumn: "subscriber_email" },
  { table: "feedback", emailColumn: "subscriber_email" },
  { table: "feedbacks", emailColumn: "subscriber_email" },
  { table: "newsletter_feedback", emailColumn: "email" },
  { table: "newsletter_feedbacks", emailColumn: "email" },
  { table: "feedback", emailColumn: "email" },
  { table: "feedbacks", emailColumn: "email" },
];

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Supabase 환경변수가 없습니다. NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY를 확인해주세요."
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function verifyAdminRequest(request: NextRequest) {
  const headerSecret = request.headers.get("x-admin-secret") || "";
  const querySecret = request.nextUrl.searchParams.get("admin_secret") || "";
  const providedSecret = headerSecret || querySecret;

  return Boolean(adminSecret && providedSecret && providedSecret === adminSecret);
}

async function getFeedbackCountForEmail(
  supabase: SupabaseClient,
  email: string
): Promise<{
  count: number;
  sourceTable: string;
  sourceColumn: string;
}> {
  const errors: string[] = [];

  for (const candidate of FEEDBACK_TABLE_CANDIDATES) {
    const { count, error } = await supabase
      .from(candidate.table)
      .select("*", { count: "exact", head: true })
      .ilike(candidate.emailColumn, email);

    if (!error) {
      return {
        count: count ?? 0,
        sourceTable: candidate.table,
        sourceColumn: candidate.emailColumn,
      };
    }

    errors.push(`${candidate.table}.${candidate.emailColumn}: ${error.message}`);
  }

  throw new Error(
    `피드백 테이블을 찾지 못했습니다. 확인한 후보: ${errors.join(" / ")}`
  );
}

export async function GET(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return jsonResponse(
      {
        ok: false,
        message: "관리자 권한이 없습니다. ADMIN_SECRET을 확인해주세요.",
      },
      401
    );
  }

  let supabase: SupabaseClient;

  try {
    supabase = getSupabaseAdmin();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return jsonResponse(
      {
        ok: false,
        message: errorMessage,
      },
      500
    );
  }

  const { data, error } = await supabase
    .from("build_consultation_requests")
    .select(
      "id, email, name, want_to_build, blocked_point, ai_experience, help_type, feedback_count_at_request, status, admin_note, created_at, updated_at"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return jsonResponse(
      {
        ok: false,
        message: `상담 신청 목록을 불러오지 못했습니다: ${error.message}`,
      },
      500
    );
  }

  return jsonResponse({
    ok: true,
    message: "Personal AI Build 상담 신청 목록을 불러왔습니다.",
    requests: data || [],
  });
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      {
        ok: false,
        message: "요청 본문을 읽지 못했습니다.",
      },
      400
    );
  }

  const payload = body as {
    email?: unknown;
    name?: unknown;
    want_to_build?: unknown;
    blocked_point?: unknown;
    ai_experience?: unknown;
    help_type?: unknown;
  };

  const email = normalizeEmail(String(payload.email || ""));
  const name = normalizeText(payload.name) || null;
  const wantToBuild = normalizeText(payload.want_to_build);
  const blockedPoint = normalizeText(payload.blocked_point);
  const aiExperience = normalizeText(payload.ai_experience) || null;
  const helpType = normalizeText(payload.help_type) || null;

  if (!isValidEmail(email)) {
    return jsonResponse(
      {
        ok: false,
        message: "올바른 이메일을 입력해주세요.",
      },
      400
    );
  }

  if (!wantToBuild) {
    return jsonResponse(
      {
        ok: false,
        message: "무엇을 만들고 싶은지 입력해주세요.",
      },
      400
    );
  }

  if (!blockedPoint) {
    return jsonResponse(
      {
        ok: false,
        message: "현재 어디서 막혀 있는지 입력해주세요.",
      },
      400
    );
  }

  let supabase: SupabaseClient;

  try {
    supabase = getSupabaseAdmin();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return jsonResponse(
      {
        ok: false,
        message: errorMessage,
      },
      500
    );
  }

  try {
    const feedbackResult = await getFeedbackCountForEmail(supabase, email);
    const feedbackCount = feedbackResult.count;

    if (feedbackCount < MIN_FEEDBACK_COUNT) {
      return jsonResponse(
        {
          ok: false,
          code: "NOT_ENOUGH_FEEDBACK",
          message: `아직 신청할 수 없습니다. 현재 피드백은 ${feedbackCount}개입니다. 피드백 ${MIN_FEEDBACK_COUNT}개 이상부터 Personal AI Build 상담을 신청할 수 있습니다.`,
          feedback_count: feedbackCount,
          required_feedback_count: MIN_FEEDBACK_COUNT,
        },
        403
      );
    }

    const { data, error } = await supabase
      .from("build_consultation_requests")
      .insert({
        email,
        name,
        want_to_build: wantToBuild,
        blocked_point: blockedPoint,
        ai_experience: aiExperience,
        help_type: helpType,
        feedback_count_at_request: feedbackCount,
        status: "pending",
      })
      .select(
        "id, email, name, want_to_build, blocked_point, ai_experience, help_type, feedback_count_at_request, status, created_at"
      )
      .single();

    if (error) {
      return jsonResponse(
        {
          ok: false,
          message: `상담 신청 저장 중 오류가 발생했습니다: ${error.message}`,
        },
        500
      );
    }

    return jsonResponse({
      ok: true,
      message:
        "Personal AI Build 상담 신청이 완료되었습니다. 입력한 내용을 확인한 뒤 연락드릴 수 있습니다.",
      request: data,
      feedback_count: feedbackCount,
      required_feedback_count: MIN_FEEDBACK_COUNT,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return jsonResponse(
      {
        ok: false,
        message: `상담 신청 처리 중 오류가 발생했습니다: ${errorMessage}`,
      },
      500
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return jsonResponse(
      {
        ok: false,
        message: "관리자 권한이 없습니다. ADMIN_SECRET을 확인해주세요.",
      },
      401
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      {
        ok: false,
        message: "요청 본문을 읽지 못했습니다.",
      },
      400
    );
  }

  const payload = body as {
    id?: unknown;
    status?: unknown;
    admin_note?: unknown;
  };

  const id = normalizeText(payload.id);
  const status = normalizeText(payload.status);
  const adminNote =
    typeof payload.admin_note === "string" ? payload.admin_note.trim() : "";

  if (!id) {
    return jsonResponse(
      {
        ok: false,
        message: "상담 신청 ID가 없습니다.",
      },
      400
    );
  }

  if (!ALLOWED_STATUS.includes(status)) {
    return jsonResponse(
      {
        ok: false,
        message:
          "상태값이 올바르지 않습니다. pending, reviewing, done, rejected 중 하나여야 합니다.",
      },
      400
    );
  }

  let supabase: SupabaseClient;

  try {
    supabase = getSupabaseAdmin();
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return jsonResponse(
      {
        ok: false,
        message: errorMessage,
      },
      500
    );
  }

  const { data, error } = await supabase
    .from("build_consultation_requests")
    .update({
      status,
      admin_note: adminNote || null,
    })
    .eq("id", id)
    .select(
      "id, email, name, want_to_build, blocked_point, ai_experience, help_type, feedback_count_at_request, status, admin_note, created_at, updated_at"
    )
    .single();

  if (error) {
    return jsonResponse(
      {
        ok: false,
        message: `상담 신청 상태 변경 중 오류가 발생했습니다: ${error.message}`,
      },
      500
    );
  }

  return jsonResponse({
    ok: true,
    message: "상담 신청 상태가 저장되었습니다.",
    request: data,
  });
}