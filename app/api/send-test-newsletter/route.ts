import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

type Subscriber = {
  id: string;
  email: string;
  ai_emotion: string | null;
  ai_intent: string | null;
  blocker: string | null;
  action_time: string | null;
  persona_type: string | null;
};

type NewsletterItem = {
  id: number;
  title: string;
  summary: string;
  url: string | null;
  category: string | null;
  difficulty: string | null;
  source_type: string | null;
  stance: string | null;
  target_persona: string | null;
  action_hint: string | null;
  is_sent: boolean | null;
  created_at: string;
};

type Feedback = {
  id: number;
  subscriber_id: string | null;
  subscriber_email: string | null;
  newsletter_item_id: number | null;
  feedback_type: string | null;
  action_done: boolean | null;
  free_text: string | null;
  created_at: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const adminSecret = process.env.ADMIN_SECRET;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const resendFromEmail =
  process.env.RESEND_FROM_EMAIL || "AI-FU 브리프 <onboarding@resend.dev>";

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.");
}

if (!supabaseServiceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.");
}

if (!resendApiKey) {
  throw new Error("RESEND_API_KEY가 설정되지 않았습니다.");
}

if (!adminSecret) {
  throw new Error("ADMIN_SECRET이 설정되지 않았습니다.");
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
const resend = new Resend(resendApiKey);

function getEmotionLabel(value: string | null) {
  switch (value) {
    case "curious":
      return "호기심";
    case "expectation":
      return "기대감";
    case "anxious":
      return "불안";
    case "fatigue":
      return "정보 피로감";
    case "skeptical":
      return "회의감";
    case "unknown":
      return "막연함";
    default:
      return "막연함";
  }
}

function getIntentLabel(value: string | null) {
  switch (value) {
    case "work_efficiency":
      return "업무 효율";
    case "service_building":
      return "서비스 만들기";
    case "study":
      return "공부와 자기계발";
    case "creation":
      return "글쓰기와 창작";
    case "money":
      return "돈 벌기와 사업 기회";
    case "avoid":
      return "최소한의 이해";
    case "not_sure":
      return "방향 찾기";
    default:
      return "방향 찾기";
  }
}

function getBlockerLabel(value: string | null) {
  switch (value) {
    case "too_much_information":
      return "정보가 너무 많아 정리가 안 되는 상태";
    case "dont_know_start":
      return "뭘 해야 할지 모르는 상태";
    case "too_technical":
      return "기술적인 내용이 어렵게 느껴지는 상태";
    case "no_time":
      return "시간이 부족한 상태";
    case "fear":
      return "뒤처질까 봐 불안한 상태";
    case "no_need":
      return "아직 필요성을 확실히 느끼지 못한 상태";
    default:
      return "방향이 아직 선명하지 않은 상태";
  }
}

function getActionTimeLabel(value: string | null) {
  switch (value) {
    case "10min":
      return "10분";
    case "30min":
      return "30분";
    case "2hours":
      return "2시간";
    case "weekend":
      return "주말 반나절";
    default:
      return "30분";
  }
}

function getFeedbackLabel(value: string | null) {
  switch (value) {
    case "done":
      return "지난 Action을 해봤다";
    case "hard":
      return "지난 Action이 어렵다";
    case "not_interested":
      return "지난 브리프가 관심 없다";
    case "deeper":
      return "더 깊게 알고 싶다";
    case "less_anxious":
      return "불안이 줄었다";
    case "different":
      return "다른 방향이 필요하다";
    default:
      return "아직 피드백 없음";
  }
}

function getPersonaIntro(subscriber: Subscriber) {
  const persona = subscriber.persona_type || "Explorer";

  switch (persona) {
    case "Builder-Anxious":
      return "당신은 AI로 무언가를 만들고 싶지만, 정보가 너무 많고 실패할까 봐 쉽게 멈추는 상태에 가깝습니다.";
    case "Builder":
      return "당신은 AI를 단순히 읽는 것보다, 직접 무언가를 만들어보는 쪽에 더 가까운 상태입니다.";
    case "Adopter":
      return "당신은 AI를 일상 업무나 반복 작업에 실제로 적용하고 싶은 상태에 가깝습니다.";
    case "Anxious":
      return "당신은 AI에 관심은 있지만, 변화 속도와 정보량 때문에 불안이 앞서는 상태에 가깝습니다.";
    case "Skeptic":
      return "당신은 AI에 대한 과장된 기대를 경계하면서, 실제 쓸모를 확인하고 싶은 상태에 가깝습니다.";
    case "Avoider":
      return "당신은 AI를 적극적으로 쓰고 싶다기보다, 최소한 무엇이 바뀌는지는 알고 싶은 상태에 가깝습니다.";
    case "Explorer":
    default:
      return "당신은 AI에 관심은 있지만, 아직 나에게 어떤 의미인지 탐색하는 상태에 가깝습니다.";
  }
}

function getBaseWeeklyAction(subscriber: Subscriber) {
  const actionTime = subscriber.action_time;
  const intent = subscriber.ai_intent;
  const blocker = subscriber.blocker;

  if (intent === "service_building") {
    if (actionTime === "10min") {
      return "만들고 싶은 서비스 아이디어를 딱 한 문장으로 적어보세요. 예: ‘AI 뉴스를 내 상황에 맞게 행동 계획으로 바꿔주는 서비스.’";
    }

    if (actionTime === "30min") {
      return "서비스 아이디어를 사용자, 문제, 해결 방식, 첫 화면 구성 4줄로 정리해보세요.";
    }

    return "GPT에게 ‘내 아이디어를 랜딩페이지 구조로 바꿔줘’라고 요청하고, 제목·설명·가입폼까지 초안을 만들어보세요.";
  }

  if (intent === "work_efficiency") {
    if (actionTime === "10min") {
      return "이번 주 반복해서 한 업무 1개만 적어보세요.";
    }

    if (actionTime === "30min") {
      return "반복 업무 하나를 골라, GPT에게 시킬 수 있는 입력값과 원하는 출력값을 적어보세요.";
    }

    return "자주 쓰는 이메일, 보고서, 정리 업무 중 하나를 골라 실제 GPT 프롬프트로 바꿔보세요.";
  }

  if (blocker === "too_much_information") {
    return "AI 뉴스 10개를 더 읽지 말고, 이번 주에는 ‘나와 관련 있는 변화 1개’만 골라서 왜 중요한지 3줄로 정리해보세요.";
  }

  if (blocker === "fear") {
    return "내 일이 AI로 완전히 대체될지 묻기보다, ‘내 업무 중 AI가 도와줄 수 있는 작은 작업 3개’를 적어보세요.";
  }

  return "이번 주에는 AI 관련 글 하나를 읽고, ‘그래서 나는 무엇을 해볼 수 있지?’라는 질문에 한 문장으로 답해보세요.";
}

function getTinyAction(subscriber: Subscriber) {
  if (subscriber.ai_intent === "service_building") {
    return "서비스를 만들려고 하지 말고, 오늘은 ‘누구의 어떤 문제를 해결하고 싶은지’ 한 문장만 적어보세요.";
  }

  if (subscriber.ai_intent === "work_efficiency") {
    return "업무 자동화를 만들려고 하지 말고, 오늘은 반복 업무 이름 하나만 적어보세요.";
  }

  return "AI 글을 읽지 말고, 오늘은 ‘AI 때문에 내가 궁금하거나 불안한 질문 1개’만 적어보세요.";
}

function getNextStepAction(subscriber: Subscriber) {
  if (subscriber.ai_intent === "service_building") {
    return "지난 아이디어를 바탕으로, 이번에는 첫 화면에 들어갈 문장 3개만 만들어보세요. 제목, 설명, 이메일 입력 문구면 충분합니다.";
  }

  if (subscriber.ai_intent === "work_efficiency") {
    return "지난번에 고른 반복 업무 하나를 GPT에게 설명하고, ‘이 업무를 줄이기 위한 프롬프트 초안’을 만들어달라고 해보세요.";
  }

  return "지난번에 정리한 생각을 바탕으로, 이번에는 실제로 GPT에게 질문 하나를 던져보고 답변을 저장해보세요.";
}

function getDeeperAction(subscriber: Subscriber) {
  if (subscriber.ai_intent === "service_building") {
    return "내 아이디어와 비슷한 서비스 3개를 찾아보고, 각각의 장점·부족한 점·내가 다르게 할 점을 표로 정리해보세요.";
  }

  if (subscriber.ai_intent === "work_efficiency") {
    return "내 업무 중 AI가 도울 수 있는 부분과 사람이 판단해야 하는 부분을 나눠서 표로 정리해보세요.";
  }

  return "이번 주 AI 자료 하나를 읽고, 찬성 근거 2개와 반대 근거 2개를 함께 정리해보세요.";
}

function getFeedbackAwareAction(
  subscriber: Subscriber,
  latestFeedback: Feedback | null
) {
  const baseAction = getBaseWeeklyAction(subscriber);
  const feedbackType = latestFeedback?.feedback_type || null;

  switch (feedbackType) {
    case "hard":
      return {
        action: `지난번 Action이 어렵게 느껴졌다면, 이번 주에는 더 작게 시작합니다. ${getTinyAction(
          subscriber
        )}`,
        adjustment:
          "지난 피드백에서 ‘어렵다’를 선택했기 때문에, 이번 Action은 더 작고 부담이 적은 형태로 조정했습니다.",
      };

    case "done":
      return {
        action: `지난번 Action을 해봤다면, 이번에는 한 단계만 더 나아갑니다. ${getNextStepAction(
          subscriber
        )}`,
        adjustment:
          "지난 피드백에서 ‘해봤다’를 선택했기 때문에, 이번 Action은 다음 단계로 이어지도록 조정했습니다.",
      };

    case "deeper":
      return {
        action: `이번에는 조금 더 깊게 들어갑니다. ${getDeeperAction(
          subscriber
        )}`,
        adjustment:
          "지난 피드백에서 ‘더 깊게 알고 싶다’를 선택했기 때문에, 이번 Action은 조금 더 분석적인 방향으로 조정했습니다.",
      };

    case "not_interested":
      return {
        action:
          "지난 주제에 흥미가 낮았다면, 이번 주에는 자료를 읽기보다 ‘내가 AI를 굳이 써야 하는 상황이 있는가?’를 3분만 생각해보세요. 떠오르지 않으면 ‘아직 필요 없음’도 유효한 결론입니다.",
        adjustment:
          "지난 피드백에서 ‘관심 없다’를 선택했기 때문에, 억지 실행보다 방향 재탐색 중심으로 조정했습니다.",
      };

    case "different":
      return {
        action:
          "이번 주에는 다른 방향으로 전환합니다. AI 도구를 써보는 대신, 내 일상이나 업무에서 ‘반복되지만 귀찮은 일’ 3개만 적어보세요. 다음 브리프는 그중 하나를 줄이는 방식으로 이어갑니다.",
        adjustment:
          "지난 피드백에서 ‘다른 방향이 필요하다’를 선택했기 때문에, 주제를 전환하는 방식으로 조정했습니다.",
      };

    case "less_anxious":
      return {
        action:
          "불안이 조금 줄었다면, 이제 아주 작은 실험을 하나 해볼 수 있습니다. AI에게 최근 고민 하나를 설명하고, ‘내가 오늘 할 수 있는 가장 작은 행동 하나만 골라줘’라고 물어보세요.",
        adjustment:
          "지난 피드백에서 ‘불안이 줄었다’를 선택했기 때문에, 이해 중심에서 작은 실행 중심으로 조정했습니다.",
      };

    default:
      return {
        action: baseAction,
        adjustment:
          "아직 이전 피드백이 충분하지 않아, 가입 시 선택한 상태를 기준으로 Action을 제안했습니다.",
      };
  }
}

function getPromptForUser(
  subscriber: Subscriber,
  latestFeedback: Feedback | null
) {
  const intent = getIntentLabel(subscriber.ai_intent);
  const blocker = getBlockerLabel(subscriber.blocker);
  const actionTime = getActionTimeLabel(subscriber.action_time);
  const feedbackLabel = getFeedbackLabel(latestFeedback?.feedback_type || null);

  return `나는 AI를 ${intent} 목적으로 활용하고 싶지만, 현재 ${blocker}에 가깝다. 이번 주에 ${actionTime} 안에 할 수 있는 아주 작은 실행 계획을 3단계로 만들어줘. 지난 브리프에 대한 내 반응은 "${feedbackLabel}"였다. 이 반응을 반영해서 너무 거창하지 않고 바로 시작할 수 있는 행동으로 제안해줘.`;
}

function pickItemsForSubscriber(
  items: NewsletterItem[],
  subscriber: Subscriber,
  latestFeedback: Feedback | null
) {
  const persona = subscriber.persona_type;
  const feedbackType = latestFeedback?.feedback_type || null;

  const matched = items.filter((item) => {
    if (!item.target_persona) return true;
    if (!persona) return true;

    return item.target_persona === persona || persona.includes(item.target_persona);
  });

  const preferredItems =
    feedbackType === "deeper"
      ? matched.filter(
          (item) => item.difficulty === "normal" || item.difficulty === "expert"
        )
      : feedbackType === "hard"
      ? matched.filter(
          (item) => item.difficulty === "easy" || item.difficulty === "normal"
        )
      : matched;

  const pool = preferredItems.length > 0 ? preferredItems : matched;

  const main =
    pool.find((item) => item.source_type === "main") ||
    items.find((item) => item.source_type === "main") ||
    items[0];

  const counter =
    pool.find((item) => item.source_type === "counter") ||
    items.find((item) => item.source_type === "counter") ||
    items.find((item) => item.id !== main?.id);

  return {
    main,
    counter,
  };
}

function generateAIFUNewsletter(
  subscriber: Subscriber,
  latestFeedback: Feedback | null,
  mainItem?: NewsletterItem,
  counterItem?: NewsletterItem,
  isTest = false
) {
  const emotion = getEmotionLabel(subscriber.ai_emotion);
  const intent = getIntentLabel(subscriber.ai_intent);
  const blocker = getBlockerLabel(subscriber.blocker);
  const actionTime = getActionTimeLabel(subscriber.action_time);
  const persona = subscriber.persona_type || "Explorer";
  const latestFeedbackLabel = getFeedbackLabel(
    latestFeedback?.feedback_type || null
  );

  const personaIntro = getPersonaIntro(subscriber);
  const feedbackAwareAction = getFeedbackAwareAction(
    subscriber,
    latestFeedback
  );
  const weeklyAction = feedbackAwareAction.action;
  const feedbackAdjustment = feedbackAwareAction.adjustment;
  const userPrompt = getPromptForUser(subscriber, latestFeedback);

  const subjectPrefix = isTest ? "[TEST] " : "";
  const subject = `${subjectPrefix}[AI-FU] 이번 주 ${persona} 브리프`;

  const feedbackBaseUrl = `${siteUrl}/api/feedback?subscriber_id=${
    subscriber.id
  }&email=${encodeURIComponent(subscriber.email)}&newsletter_item_id=${
    mainItem?.id || ""
  }`;

  const testNoticeHtml = isTest
    ? `
      <div style="background:#fef3c7; border:1px solid #f59e0b; border-radius:18px; padding:18px; margin-bottom:18px;">
        <div style="font-size:13px; font-weight:900; color:#92400e; margin-bottom:6px;">
          테스트 발송
        </div>
        <p style="font-size:14px; line-height:1.7; color:#78350f; margin:0;">
          이 메일은 전체 구독자에게 발송된 것이 아니라, 관리자 확인을 위한 테스트 브리프입니다.
          실제 기준 구독자: ${subscriber.email}
        </p>
      </div>
    `
    : "";

  const mainSourceHtml = mainItem
    ? `
      <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:18px; padding:22px; margin-bottom:18px;">
        <div style="font-size:13px; font-weight:800; color:#2563eb; margin-bottom:8px;">
          메인 자료
        </div>
        <h2 style="font-size:20px; line-height:1.4; margin:0 0 12px 0; color:#111827;">
          ${mainItem.title}
        </h2>
        <p style="font-size:15px; line-height:1.7; color:#374151; margin:0 0 14px 0;">
          ${mainItem.summary}
        </p>
        ${
          mainItem.url
            ? `<a href="${mainItem.url}" target="_blank" style="display:inline-block; color:#2563eb; font-size:14px; font-weight:700; text-decoration:none;">원문 읽기 →</a>`
            : ""
        }
      </div>
    `
    : "";

  const counterSourceHtml = counterItem
    ? `
      <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:18px; padding:22px; margin-bottom:18px;">
        <div style="font-size:13px; font-weight:800; color:#7c3aed; margin-bottom:8px;">
          균형 자료
        </div>
        <h2 style="font-size:20px; line-height:1.4; margin:0 0 12px 0; color:#111827;">
          ${counterItem.title}
        </h2>
        <p style="font-size:15px; line-height:1.7; color:#374151; margin:0 0 14px 0;">
          ${counterItem.summary}
        </p>
        ${
          counterItem.url
            ? `<a href="${counterItem.url}" target="_blank" style="display:inline-block; color:#2563eb; font-size:14px; font-weight:700; text-decoration:none;">원문 읽기 →</a>`
            : ""
        }
      </div>
    `
    : "";

  const feedbackHtml = `
    <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:18px; padding:22px; margin-bottom:18px;">
      <div style="font-size:13px; font-weight:800; color:#111827; margin-bottom:12px;">
        이번 브리프는 어땠나요?
      </div>

      <div style="display:flex; flex-wrap:wrap; gap:8px;">
        <a href="${feedbackBaseUrl}&type=done" style="background:#ecfdf5; color:#047857; border:1px solid #a7f3d0; border-radius:999px; padding:10px 14px; font-size:14px; font-weight:800; text-decoration:none;">해봤다</a>
        <a href="${feedbackBaseUrl}&type=hard" style="background:#fef3c7; color:#92400e; border:1px solid #fcd34d; border-radius:999px; padding:10px 14px; font-size:14px; font-weight:800; text-decoration:none;">어렵다</a>
        <a href="${feedbackBaseUrl}&type=not_interested" style="background:#f3f4f6; color:#374151; border:1px solid #d1d5db; border-radius:999px; padding:10px 14px; font-size:14px; font-weight:800; text-decoration:none;">관심 없다</a>
        <a href="${feedbackBaseUrl}&type=deeper" style="background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; border-radius:999px; padding:10px 14px; font-size:14px; font-weight:800; text-decoration:none;">더 깊게 알고 싶다</a>
        <a href="${feedbackBaseUrl}&type=less_anxious" style="background:#f0fdf4; color:#166534; border:1px solid #bbf7d0; border-radius:999px; padding:10px 14px; font-size:14px; font-weight:800; text-decoration:none;">불안이 줄었다</a>
        <a href="${feedbackBaseUrl}&type=different" style="background:#fdf2f8; color:#be185d; border:1px solid #fbcfe8; border-radius:999px; padding:10px 14px; font-size:14px; font-weight:800; text-decoration:none;">다른 방향이 필요하다</a>
      </div>
    </div>
  `;

  const html = `
    <div style="background:#f3f4f6; padding:28px 12px; font-family:Arial, sans-serif;">
      <div style="max-width:680px; margin:0 auto;">
        ${testNoticeHtml}

        <div style="background:#111827; color:#ffffff; border-radius:24px; padding:30px; margin-bottom:20px;">
          <div style="font-size:14px; font-weight:800; color:#93c5fd; margin-bottom:10px;">
            AI-FU
          </div>
          <h1 style="font-size:28px; line-height:1.35; margin:0 0 14px 0;">
            AI 시대, 이번 주 당신의 다음 행동
          </h1>
          <p style="font-size:15px; line-height:1.7; color:#d1d5db; margin:0;">
            AI-FU는 쏟아지는 AI 정보 속에서 멈추지 않도록, 당신의 상태와 지난 반응에 맞춰 자료와 작은 실행 계획을 함께 보냅니다.
          </p>
        </div>

        <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:18px; padding:22px; margin-bottom:18px;">
          <div style="font-size:13px; font-weight:800; color:#6b7280; margin-bottom:10px;">
            지금 당신의 상태
          </div>
          <p style="font-size:16px; line-height:1.8; color:#111827; margin:0 0 12px 0;">
            ${personaIntro}
          </p>
          <ul style="font-size:14px; line-height:1.8; color:#374151; margin:0; padding-left:20px;">
            <li>현재 감정: ${emotion}</li>
            <li>AI로 하고 싶은 것: ${intent}</li>
            <li>막히는 지점: ${blocker}</li>
            <li>이번 주 가능한 행동 시간: ${actionTime}</li>
            <li>지난 피드백: ${latestFeedbackLabel}</li>
          </ul>
        </div>

        <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:18px; padding:22px; margin-bottom:18px;">
          <div style="font-size:13px; font-weight:800; color:#334155; margin-bottom:8px;">
            지난 반응 반영
          </div>
          <p style="font-size:15px; line-height:1.8; color:#334155; margin:0;">
            ${feedbackAdjustment}
          </p>
        </div>

        <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:18px; padding:22px; margin-bottom:18px;">
          <div style="font-size:13px; font-weight:800; color:#1d4ed8; margin-bottom:8px;">
            이번 주 핵심 질문
          </div>
          <p style="font-size:17px; line-height:1.7; color:#111827; font-weight:800; margin:0;">
            AI 정보를 더 많이 읽는 대신, 지난 반응을 바탕으로 더 잘 맞는 작은 행동을 고를 수 있을까?
          </p>
        </div>

        ${mainSourceHtml}
        ${counterSourceHtml}

        <div style="background:#ffffff; border:1px solid #e5e7eb; border-radius:18px; padding:22px; margin-bottom:18px;">
          <div style="font-size:13px; font-weight:800; color:#059669; margin-bottom:8px;">
            AI-FU 해석
          </div>
          <p style="font-size:15px; line-height:1.8; color:#374151; margin:0;">
            지금 중요한 것은 AI를 무조건 따라잡는 것이 아니라, 당신의 상황과 반응에 맞는 속도를 찾는 것입니다.
            정보 과잉 상태에서는 더 많은 뉴스를 읽는 것보다, 작은 행동 하나와 그에 대한 피드백이 더 좋은 판단 근거를 만들어줍니다.
          </p>
        </div>

        <div style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:18px; padding:22px; margin-bottom:18px;">
          <div style="font-size:13px; font-weight:800; color:#047857; margin-bottom:8px;">
            이번 주 Action
          </div>
          <p style="font-size:16px; line-height:1.8; color:#064e3b; font-weight:800; margin:0;">
            ${weeklyAction}
          </p>
        </div>

        <div style="background:#111827; color:#ffffff; border-radius:18px; padding:22px; margin-bottom:18px;">
          <div style="font-size:13px; font-weight:800; color:#93c5fd; margin-bottom:8px;">
            GPT에 바로 붙여넣을 프롬프트
          </div>
          <p style="font-size:15px; line-height:1.8; color:#e5e7eb; margin:0;">
            ${userPrompt}
          </p>
        </div>

        ${feedbackHtml}

        <p style="font-size:12px; line-height:1.6; color:#6b7280; text-align:center; margin:20px 0 0 0;">
          이 메일은 AI-FU MVP 테스트 브리프입니다.
        </p>
      </div>
    </div>
  `;

  const text = `
${isTest ? "[테스트 발송]\n" : ""}AI-FU 브리프

지금 당신의 상태:
${personaIntro}

현재 감정: ${emotion}
AI로 하고 싶은 것: ${intent}
막히는 지점: ${blocker}
이번 주 가능한 행동 시간: ${actionTime}
지난 피드백: ${latestFeedbackLabel}

지난 반응 반영:
${feedbackAdjustment}

이번 주 Action:
${weeklyAction}

GPT에 바로 붙여넣을 프롬프트:
${userPrompt}
  `;

  return {
    subject,
    html,
    text,
  };
}

function getLatestFeedbackMap(feedbacks: Feedback[]) {
  const map = new Map<string, Feedback>();

  for (const feedback of feedbacks) {
    if (feedback.subscriber_id && !map.has(feedback.subscriber_id)) {
      map.set(feedback.subscriber_id, feedback);
    }

    if (feedback.subscriber_email && !map.has(feedback.subscriber_email)) {
      map.set(feedback.subscriber_email, feedback);
    }
  }

  return map;
}

function getLatestFeedbackForSubscriber(
  subscriber: Subscriber,
  feedbackMap: Map<string, Feedback>
) {
  return feedbackMap.get(subscriber.id) || feedbackMap.get(subscriber.email) || null;
}

export async function POST(request: NextRequest) {
  try {
    const secretFromHeader = request.headers.get("x-admin-secret");
    const secretFromQuery = request.nextUrl.searchParams.get("secret");
    const secret = secretFromHeader || secretFromQuery;

    if (secret !== adminSecret) {
      return NextResponse.json(
        { error: "관리자 인증에 실패했습니다." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const testEmail = body.testEmail || request.nextUrl.searchParams.get("testEmail");

    if (!testEmail) {
      return NextResponse.json(
        {
          error: "테스트 수신 이메일이 필요합니다.",
          required: "testEmail",
        },
        { status: 400 }
      );
    }

    const { data: subscribers, error: subscribersError } = await supabaseAdmin
      .from("subscribers")
      .select(
        "id, email, ai_emotion, ai_intent, blocker, action_time, persona_type"
      )
      // 실험 일지(/lab) 구독자는 브리핑 미리보기 기준에서 제외합니다.
      .neq("signup_source", "lab")
      .order("created_at", { ascending: false })
      .limit(1);

    if (subscribersError) {
      return NextResponse.json(
        {
          error: "구독자 조회 실패",
          detail: subscribersError.message,
        },
        { status: 500 }
      );
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json(
        {
          error: "테스트 기준으로 사용할 구독자가 없습니다.",
        },
        { status: 400 }
      );
    }

    const subscriber = subscribers[0] as Subscriber;

    const { data: items, error: itemsError } = await supabaseAdmin
      .from("newsletter_items")
      .select(
        "id, title, summary, url, category, difficulty, source_type, stance, target_persona, action_hint, is_sent, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (itemsError) {
      return NextResponse.json(
        {
          error: "뉴스레터 자료 조회 실패",
          detail: itemsError.message,
        },
        { status: 500 }
      );
    }

    const { data: feedbacks, error: feedbacksError } = await supabaseAdmin
      .from("feedbacks")
      .select(
        "id, subscriber_id, subscriber_email, newsletter_item_id, feedback_type, action_done, free_text, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(500);

    if (feedbacksError) {
      return NextResponse.json(
        {
          error: "피드백 조회 실패",
          detail: feedbacksError.message,
        },
        { status: 500 }
      );
    }

    const latestFeedbackMap = getLatestFeedbackMap((feedbacks || []) as Feedback[]);
    const latestFeedback = getLatestFeedbackForSubscriber(
      subscriber,
      latestFeedbackMap
    );

    const newsletterItems = (items || []) as NewsletterItem[];

    const { main, counter } = pickItemsForSubscriber(
      newsletterItems,
      subscriber,
      latestFeedback
    );

    const newsletter = generateAIFUNewsletter(
      subscriber,
      latestFeedback,
      main,
      counter,
      true
    );

    const sendResult = await resend.emails.send({
      from: resendFromEmail,
      to: testEmail,
      subject: newsletter.subject,
      html: newsletter.html,
      text: newsletter.text,
    });

    if (sendResult.error) {
      return NextResponse.json(
        {
          error: "테스트 브리프 발송 실패",
          detail: sendResult.error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `테스트 브리프를 ${testEmail}로 발송했습니다.`,
      testEmail,
      basedOnSubscriber: subscriber.email,
      persona_type: subscriber.persona_type,
      latest_feedback: latestFeedback?.feedback_type || null,
      main_item: main?.title || null,
      counter_item: counter?.title || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      {
        error: "테스트 브리프 발송 중 서버 오류",
        detail: message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}