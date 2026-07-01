import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type CategoryGroupKey =
  | "ai_emotion"
  | "ai_intent"
  | "blocker"
  | "action_time";

type SubscribeRequestBody = {
  email?: string;
  job_role?: string | null;
  difficulty?: string | null;
  ai_emotion?: string;
  ai_intent?: string;
  blocker?: string;
  action_time?: string;
};

const VALID_AI_EMOTIONS = [
  "curious",
  "excited",
  "anxious",
  "fatigue",
  "skeptical",
  "unsure",
];

const VALID_AI_INTENTS = [
  "not_sure",
  "work_efficiency",
  "service_building",
  "learning",
  "creative_writing",
  "business_opportunity",
  "avoid_but_need",
];

const VALID_BLOCKERS = [
  "too_much_info",
  "no_clear_start",
  "too_technical",
  "no_time",
  "fear_of_falling_behind",
  "low_need",
];

const VALID_ACTION_TIMES = [
  "10min",
  "30min",
  "2hours",
  "half_day_weekend",
];

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

function normalizeText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getPersonaType({
  aiEmotion,
  aiIntent,
}: {
  aiEmotion: string;
  aiIntent: string;
}) {
  if (aiIntent === "service_building" && aiEmotion === "anxious") {
    return "Builder-Anxious";
  }

  if (aiIntent === "service_building") return "Builder";
  if (aiIntent === "work_efficiency") return "Adopter";
  if (aiEmotion === "anxious") return "Anxious";
  if (aiEmotion === "skeptical") return "Skeptic";
  if (aiEmotion === "fatigue") return "Avoider";
  if (aiEmotion === "curious") return "Explorer";
  if (aiEmotion === "excited") return "Optimist";
  if (aiEmotion === "unsure") return "Unclear";

  return "AI-FU Subscriber";
}

function isValidSelection(value: string, validValues: string[]) {
  return validValues.includes(value);
}

async function readBody(request: Request): Promise<SubscribeRequestBody> {
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

    const email = normalizeText(body.email).toLowerCase();
    const jobRole = normalizeText(body.job_role);
    const difficulty = normalizeText(body.difficulty) || "easy";

    const aiEmotion = normalizeText(body.ai_emotion) || "curious";
    const aiIntent = normalizeText(body.ai_intent) || "not_sure";
    const blocker = normalizeText(body.blocker) || "too_much_info";
    const actionTime = normalizeText(body.action_time) || "30min";

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        {
          ok: false,
          message: "올바른 이메일을 입력해주세요.",
        },
        { status: 400 }
      );
    }

    if (!isValidSelection(aiEmotion, VALID_AI_EMOTIONS)) {
      return NextResponse.json(
        {
          ok: false,
          message: "AI 감정 선택값이 올바르지 않습니다.",
        },
        { status: 400 }
      );
    }

    if (!isValidSelection(aiIntent, VALID_AI_INTENTS)) {
      return NextResponse.json(
        {
          ok: false,
          message: "AI 의도 선택값이 올바르지 않습니다.",
        },
        { status: 400 }
      );
    }

    if (!isValidSelection(blocker, VALID_BLOCKERS)) {
      return NextResponse.json(
        {
          ok: false,
          message: "막힘 선택값이 올바르지 않습니다.",
        },
        { status: 400 }
      );
    }

    if (!isValidSelection(actionTime, VALID_ACTION_TIMES)) {
      return NextResponse.json(
        {
          ok: false,
          message: "행동 시간 선택값이 올바르지 않습니다.",
        },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    const personaType = getPersonaType({
      aiEmotion,
      aiIntent,
    });

    const subscriberPayload = {
      email,
      job_role: jobRole || null,
      interest_area: aiIntent,
      purpose: blocker,
      difficulty,
      ai_emotion: aiEmotion,
      ai_intent: aiIntent,
      blocker,
      action_time: actionTime,
      persona_type: personaType,
    };

    const { data: subscriber, error: subscriberError } = await supabase
      .from("subscribers")
      .upsert(subscriberPayload, {
        onConflict: "email",
      })
      .select("id, email")
      .single();

    if (subscriberError) {
      return NextResponse.json(
        {
          ok: false,
          message: `구독 저장 중 오류가 발생했습니다: ${subscriberError.message}`,
        },
        { status: 500 }
      );
    }

    if (!subscriber?.id) {
      return NextResponse.json(
        {
          ok: false,
          message: "구독자 ID를 가져오지 못했습니다.",
        },
        { status: 500 }
      );
    }

    const answerRows: {
      subscriber_id: string;
      group_key: CategoryGroupKey;
      option_value: string;
    }[] = [
      {
        subscriber_id: subscriber.id,
        group_key: "ai_emotion",
        option_value: aiEmotion,
      },
      {
        subscriber_id: subscriber.id,
        group_key: "ai_intent",
        option_value: aiIntent,
      },
      {
        subscriber_id: subscriber.id,
        group_key: "blocker",
        option_value: blocker,
      },
      {
        subscriber_id: subscriber.id,
        group_key: "action_time",
        option_value: actionTime,
      },
    ];

    const { error: answerError } = await supabase
      .from("subscriber_category_answers")
      .upsert(answerRows, {
        onConflict: "subscriber_id,group_key",
      });

    if (answerError) {
      return NextResponse.json(
        {
          ok: false,
          message: `구독자는 저장됐지만 진단 응답 저장 중 오류가 발생했습니다: ${answerError.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message:
        "구독 정보가 저장되었습니다. 같은 이메일로 다시 신청한 경우 기존 정보가 업데이트됩니다.",
      subscriber: {
        id: subscriber.id,
        email: subscriber.email,
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