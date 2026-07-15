import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  timingSafeEqualStr,
  getClientIp,
  isRateLimited,
  recordFailure,
  recordSuccess,
} from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

type DeliveryLogActionBody = {
  admin_secret?: string;
  action?: "clear_all" | "clear_by_email" | "clear_by_item";
  confirm_text?: string;
  subscriber_email?: string;
  newsletter_item_id?: number | string;
};

type DeliveryLogRow = {
  id: number;
  subscriber_id: string | null;
  subscriber_email: string | null;
  newsletter_item_id: number | null;
  status: string | null;
  error_message: string | null;
  created_at: string | null;
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
  // 시크릿은 헤더 또는 본문에서만 받습니다. 쿼리스트링은 받지 않습니다.
  const headerSecret = request.headers.get("x-admin-secret");

  if (headerSecret) {
    return headerSecret.trim();
  }

  if (body?.admin_secret) {
    return String(body.admin_secret).trim();
  }

  return "";
}

function verifyAdminSecret(
  request: NextRequest,
  body?: { admin_secret?: string }
) {
  const ip = getClientIp(request);

  if (isRateLimited(ip)) {
    return {
      ok: false,
      message: "너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.",
    };
  }

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

  if (!timingSafeEqualStr(requestSecret, serverSecret)) {
    recordFailure(ip);
    return {
      ok: false,
      message: "ADMIN_SECRET이 올바르지 않습니다.",
    };
  }

  recordSuccess(ip);
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

function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
}

function normalizeNumber(value: unknown) {
  const numberValue = Number(value);

  if (!numberValue || Number.isNaN(numberValue)) {
    return null;
  }

  return numberValue;
}

function countByStatus(logs: DeliveryLogRow[]) {
  const counts: Record<string, number> = {};

  for (const log of logs) {
    const key = log.status || "unknown";
    counts[key] = (counts[key] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([value, count]) => ({
      value,
      count,
    }))
    .sort((a, b) => b.count - a.count);
}

function countByEmail(logs: DeliveryLogRow[]) {
  const counts: Record<string, number> = {};

  for (const log of logs) {
    const key = log.subscriber_email || "unknown";
    counts[key] = (counts[key] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([value, count]) => ({
      value,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);
}

function countByItem(logs: DeliveryLogRow[]) {
  const counts: Record<string, number> = {};

  for (const log of logs) {
    const key =
      typeof log.newsletter_item_id === "number"
        ? String(log.newsletter_item_id)
        : "unknown";

    counts[key] = (counts[key] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([value, count]) => ({
      value,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);
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

    const { data: logs, error } = await supabase
      .from("newsletter_delivery_logs")
      .select(
        `
        id,
        subscriber_id,
        subscriber_email,
        newsletter_item_id,
        status,
        error_message,
        created_at
      `
      )
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          message: error.message,
        },
        { status: 500 }
      );
    }

    const typedLogs = (logs || []) as DeliveryLogRow[];

    return NextResponse.json({
      ok: true,
      message: "발송 로그를 불러왔습니다.",
      total: typedLogs.length,
      statusCounts: countByStatus(typedLogs),
      emailCounts: countByEmail(typedLogs),
      itemCounts: countByItem(typedLogs),
      logs: typedLogs,
      note: "최근 500개 로그 기준입니다.",
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
    const body = await readBody<DeliveryLogActionBody>(request);
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

    const action = body.action;
    const confirmText = String(body.confirm_text || "").trim();

    const supabase = getSupabaseAdminClient();

    if (action === "clear_all") {
      if (confirmText !== "RESET_DELIVERY_LOGS") {
        return NextResponse.json(
          {
            ok: false,
            message:
              "전체 발송 이력 초기화는 confirm_text에 RESET_DELIVERY_LOGS를 입력해야 합니다.",
          },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("newsletter_delivery_logs")
        .delete()
        .not("id", "is", null)
        .select("id");

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
        message: `전체 발송 이력을 초기화했습니다. 삭제된 로그: ${
          data?.length || 0
        }개`,
        deletedCount: data?.length || 0,
      });
    }

    if (action === "clear_by_email") {
      const email = normalizeEmail(body.subscriber_email);

      if (!email) {
        return NextResponse.json(
          {
            ok: false,
            message: "subscriber_email이 필요합니다.",
          },
          { status: 400 }
        );
      }

      if (confirmText !== email) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "특정 이메일 발송 이력 초기화는 confirm_text에 해당 이메일을 그대로 입력해야 합니다.",
          },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("newsletter_delivery_logs")
        .delete()
        .eq("subscriber_email", email)
        .select("id");

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
        message: `${email}의 발송 이력을 초기화했습니다. 삭제된 로그: ${
          data?.length || 0
        }개`,
        deletedCount: data?.length || 0,
      });
    }

    if (action === "clear_by_item") {
      const itemId = normalizeNumber(body.newsletter_item_id);

      if (!itemId) {
        return NextResponse.json(
          {
            ok: false,
            message: "newsletter_item_id가 필요합니다.",
          },
          { status: 400 }
        );
      }

      if (confirmText !== String(itemId)) {
        return NextResponse.json(
          {
            ok: false,
            message:
              "특정 자료 발송 이력 초기화는 confirm_text에 해당 자료 ID를 그대로 입력해야 합니다.",
          },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("newsletter_delivery_logs")
        .delete()
        .eq("newsletter_item_id", itemId)
        .select("id");

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
        message: `자료 #${itemId}의 발송 이력을 초기화했습니다. 삭제된 로그: ${
          data?.length || 0
        }개`,
        deletedCount: data?.length || 0,
      });
    }

    return NextResponse.json(
      {
        ok: false,
        message: "지원하지 않는 action입니다.",
      },
      { status: 400 }
    );
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