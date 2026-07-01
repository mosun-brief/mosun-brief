type NullableString = string | null | undefined;

export type NewsletterItem = {
  id?: string;
  title?: NullableString;
  url?: NullableString;
  source?: NullableString;
  category?: NullableString;
  summary?: NullableString;
  why_it_matters?: NullableString;
  action_item?: NullableString;
  difficulty?: NullableString;
  estimated_time?: NullableString;
};

export type SubscriberProfile = {
  email: string;
  job_role?: NullableString;

  ai_emotion?: NullableString;
  ai_goal?: NullableString;
  ai_blocker?: NullableString;
  available_time?: NullableString;

  interest_area?: NullableString;
  purpose?: NullableString;
  level?: NullableString;
};

export type PersonalizedBriefEmailInput = {
  subscriber: SubscriberProfile;
  items: NewsletterItem[];
};

export type BuiltEmail = {
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: NullableString): string {
  if (!value) return "";

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalize(value: NullableString): string {
  return String(value ?? "").trim();
}

function pickFirstValid(...values: NullableString[]): string {
  for (const value of values) {
    const normalized = normalize(value);
    if (normalized.length > 0) return normalized;
  }

  return "";
}

function getEmotionMessage(aiEmotion: NullableString): string {
  const emotion = normalize(aiEmotion);

  if (emotion.includes("불안")) {
    return "AI를 무작정 따라가기보다, 불안을 줄일 수 있는 작은 확인부터 시작하는 구성이야.";
  }

  if (emotion.includes("피곤") || emotion.includes("정보가 너무 많")) {
    return "오늘은 더 많은 정보를 넣기보다, 지금 당장 판단에 도움이 되는 것만 추렸어.";
  }

  if (emotion.includes("회의")) {
    return "AI를 과장해서 보지 않고, 실제로 쓸 만한지 검증할 수 있는 관점으로 골랐어.";
  }

  if (emotion.includes("기대")) {
    return "기대감을 실제 실행으로 바꿀 수 있도록, 활용 가능성이 보이는 자료를 중심으로 골랐어.";
  }

  if (emotion.includes("호기심")) {
    return "가볍게 탐색하되, 읽고 끝나지 않도록 작은 행동까지 이어지게 구성했어.";
  }

  if (emotion.includes("잘 모르")) {
    return "AI를 잘 모르는 상태에서도 흐름을 잡을 수 있도록, 너무 기술적인 내용은 줄였어.";
  }

  return "오늘은 AI 관련 정보 중에서 지금 바로 이해하고 판단할 수 있는 내용만 추렸어.";
}

function getGoalMessage(aiGoal: NullableString): string {
  const goal = normalize(aiGoal);

  if (goal.includes("업무")) {
    return "업무 효율을 높이는 관점에서, 반복 작업을 줄이거나 의사결정을 빠르게 만드는 힌트를 중심으로 보면 좋아.";
  }

  if (goal.includes("서비스") || goal.includes("사이트")) {
    return "서비스나 사이트를 만들고 싶다면, 오늘 자료를 ‘내가 만들 기능 하나’로 바꿔보는 게 핵심이야.";
  }

  if (goal.includes("공부") || goal.includes("자기계발")) {
    return "공부나 자기계발 목적이라면, 오늘은 개념을 많이 외우기보다 사용 장면 하나를 이해하는 데 집중하면 좋아.";
  }

  if (goal.includes("글쓰기") || goal.includes("창작")) {
    return "글쓰기와 창작 관점에서는, AI를 결과물 생산기가 아니라 초안·구성·수정 파트너로 보는 게 좋아.";
  }

  if (goal.includes("사업") || goal.includes("돈")) {
    return "사업 기회 관점에서는, 기술 자체보다 사람들이 실제로 돈을 내고 싶어 하는 불편함을 찾는 게 중요해.";
  }

  if (goal.includes("피하고")) {
    return "AI를 적극적으로 쓰고 싶지 않더라도, 피할 수 없는 변화와 꼭 알아야 할 기준선만 잡으면 충분해.";
  }

  if (goal.includes("아직 모름")) {
    return "아직 목표가 분명하지 않다면, 오늘은 ‘내가 끌리는 방향’과 ‘불편한 방향’을 구분하는 것만 해도 충분해.";
  }

  return "오늘 자료는 읽고 끝내기보다, 내 상황에 맞는 작은 다음 행동으로 연결하는 데 초점을 맞췄어.";
}

function getBlockerMessage(aiBlocker: NullableString): string {
  const blocker = normalize(aiBlocker);

  if (blocker.includes("정보가 너무 많")) {
    return "오늘은 자료를 많이 모으는 대신, 하나만 골라서 끝까지 보는 걸 추천해.";
  }

  if (blocker.includes("뭘 해야")) {
    return "해야 할 일을 크게 잡지 말고, 오늘 메일 맨 아래의 작은 실행 과제 하나만 해보면 돼.";
  }

  if (blocker.includes("기술")) {
    return "기술적인 세부 구현보다, 이게 어떤 문제를 해결하는지 먼저 보는 방식으로 읽으면 좋아.";
  }

  if (blocker.includes("시간")) {
    return "시간이 부족한 상태를 전제로, 짧게 읽고 바로 판단할 수 있게 정리했어.";
  }

  if (blocker.includes("뒤처질")) {
    return "뒤처진다는 감각을 줄이려면, 모든 뉴스를 따라가기보다 반복해서 등장하는 흐름만 잡는 게 좋아.";
  }

  if (blocker.includes("필요성")) {
    return "아직 필요성을 못 느낀다면, 오늘은 ‘이게 내 일상이나 일에 실제로 영향을 주는가?’만 판단해도 충분해.";
  }

  return "막히는 지점을 줄이기 위해, 오늘은 이해 → 판단 → 작은 행동 순서로 구성했어.";
}

function getActionByAvailableTime(availableTime: NullableString): string {
  const time = normalize(availableTime);

  if (time.includes("10분")) {
    return "10분만 쓸 수 있다면, 아래 자료 중 하나의 제목과 요약만 읽고 ‘나에게 관련 있음/없음’을 표시해봐.";
  }

  if (time.includes("30분")) {
    return "30분이 있다면, 가장 끌리는 자료 하나를 열어보고 내 상황에 적용할 아이디어를 한 줄로 적어봐.";
  }

  if (time.includes("2시간")) {
    return "2시간이 있다면, 자료 하나를 고른 뒤 작은 실험까지 해봐. 예를 들면 프롬프트 하나 만들기, 자동화 아이디어 적기, 간단한 화면 구조 그리기 정도면 충분해.";
  }

  if (time.includes("주말")) {
    return "주말 반나절이 가능하다면, 오늘 자료 중 하나를 바탕으로 작은 결과물을 만들어봐. 예를 들면 랜딩페이지 초안, 업무 자동화 흐름도, 블로그 글 초안, 서비스 아이디어 1장 정리 같은 것이 좋아.";
  }

  return "오늘은 너무 크게 시작하지 말고, 가장 끌리는 자료 하나를 고르고 한 줄 메모만 남겨봐.";
}

function getSubject(subscriber: SubscriberProfile, items: NewsletterItem[]): string {
  const mainItemTitle = normalize(items[0]?.title);

  if (mainItemTitle) {
    return `AI-FU 오늘의 실행 브리프: ${mainItemTitle}`;
  }

  const goal = normalize(subscriber.ai_goal);

  if (goal) {
    return `AI-FU 오늘의 실행 브리프: ${goal}을 위한 작은 시작`;
  }

  return "AI-FU 오늘의 실행 브리프";
}

function buildItemHtml(item: NewsletterItem, index: number): string {
  const title = escapeHtml(pickFirstValid(item.title, "제목 없음"));
  const url = normalize(item.url);
  const source = escapeHtml(item.source);
  const category = escapeHtml(item.category);
  const summary = escapeHtml(item.summary);
  const whyItMatters = escapeHtml(item.why_it_matters);
  const actionItem = escapeHtml(item.action_item);
  const difficulty = escapeHtml(item.difficulty);
  const estimatedTime = escapeHtml(item.estimated_time);

  const metaParts = [source, category, difficulty, estimatedTime].filter(Boolean);
  const meta = metaParts.length > 0 ? metaParts.join(" · ") : "";

  const titleHtml = url
    ? `<a href="${escapeHtml(url)}" style="color:#111827;text-decoration:none;">${title}</a>`
    : title;

  return `
    <div style="border:1px solid #e5e7eb;border-radius:16px;padding:18px;margin:16px 0;background:#ffffff;">
      <div style="font-size:13px;color:#6b7280;margin-bottom:8px;">${index + 1}. ${meta}</div>
      <h2 style="font-size:19px;line-height:1.4;margin:0 0 10px 0;color:#111827;">${titleHtml}</h2>

      ${
        summary
          ? `<p style="font-size:15px;line-height:1.7;margin:0 0 12px 0;color:#374151;">${summary}</p>`
          : ""
      }

      ${
        whyItMatters
          ? `
            <div style="background:#f9fafb;border-radius:12px;padding:12px;margin-top:12px;">
              <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:4px;">왜 중요할까?</div>
              <div style="font-size:14px;line-height:1.7;color:#4b5563;">${whyItMatters}</div>
            </div>
          `
          : ""
      }

      ${
        actionItem
          ? `
            <div style="background:#eef2ff;border-radius:12px;padding:12px;margin-top:12px;">
              <div style="font-size:13px;font-weight:700;color:#3730a3;margin-bottom:4px;">작은 실행</div>
              <div style="font-size:14px;line-height:1.7;color:#3730a3;">${actionItem}</div>
            </div>
          `
          : ""
      }

      ${
        url
          ? `
            <div style="margin-top:14px;">
              <a href="${escapeHtml(url)}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;border-radius:10px;padding:10px 14px;font-size:14px;font-weight:700;">
                원문 보기
              </a>
            </div>
          `
          : ""
      }
    </div>
  `;
}

function buildItemText(item: NewsletterItem, index: number): string {
  const title = pickFirstValid(item.title, "제목 없음");
  const url = normalize(item.url);
  const source = normalize(item.source);
  const category = normalize(item.category);
  const summary = normalize(item.summary);
  const whyItMatters = normalize(item.why_it_matters);
  const actionItem = normalize(item.action_item);

  const lines = [
    `${index + 1}. ${title}`,
    source || category ? `출처/분류: ${[source, category].filter(Boolean).join(" · ")}` : "",
    summary ? `요약: ${summary}` : "",
    whyItMatters ? `왜 중요할까?: ${whyItMatters}` : "",
    actionItem ? `작은 실행: ${actionItem}` : "",
    url ? `원문: ${url}` : "",
  ];

  return lines.filter(Boolean).join("\n");
}

export function buildPersonalizedBriefEmail(input: PersonalizedBriefEmailInput): BuiltEmail {
  const { subscriber } = input;
  const items = input.items ?? [];

  const subject = getSubject(subscriber, items);

  const jobRole = normalize(subscriber.job_role);
  const aiEmotion = normalize(subscriber.ai_emotion);
  const aiGoal = normalize(subscriber.ai_goal);
  const aiBlocker = normalize(subscriber.ai_blocker);
  const availableTime = normalize(subscriber.available_time);

  const emotionMessage = getEmotionMessage(aiEmotion);
  const goalMessage = getGoalMessage(aiGoal);
  const blockerMessage = getBlockerMessage(aiBlocker);
  const actionByTime = getActionByAvailableTime(availableTime);

  const profileTags = [
    jobRole ? `직업/역할: ${jobRole}` : "",
    aiEmotion ? `AI 감정: ${aiEmotion}` : "",
    aiGoal ? `목표: ${aiGoal}` : "",
    aiBlocker ? `막히는 점: ${aiBlocker}` : "",
    availableTime ? `이번 주 가능 시간: ${availableTime}` : "",
  ].filter(Boolean);

  const itemHtml =
    items.length > 0
      ? items.map((item, index) => buildItemHtml(item, index)).join("")
      : `
        <div style="border:1px solid #e5e7eb;border-radius:16px;padding:18px;margin:16px 0;background:#ffffff;">
          <h2 style="font-size:18px;line-height:1.4;margin:0 0 10px 0;color:#111827;">오늘 발송할 브리프가 아직 준비되지 않았어요.</h2>
          <p style="font-size:15px;line-height:1.7;margin:0;color:#374151;">
            관리자 페이지에서 newsletter item을 등록하면, 다음 발송부터 이 영역에 개인화된 자료가 들어갑니다.
          </p>
        </div>
      `;

  const itemText =
    items.length > 0
      ? items.map((item, index) => buildItemText(item, index)).join("\n\n")
      : "오늘 발송할 브리프가 아직 준비되지 않았습니다.";

  const html = `
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans KR',Arial,sans-serif;">
    <div style="max-width:680px;margin:0 auto;padding:28px 16px;">
      <div style="background:#ffffff;border-radius:20px;padding:28px;border:1px solid #e5e7eb;">
        <div style="font-size:13px;font-weight:800;letter-spacing:0.08em;color:#4f46e5;margin-bottom:10px;">
          AI-FU PERSONAL BRIEF
        </div>

        <h1 style="font-size:26px;line-height:1.35;margin:0 0 12px 0;color:#111827;">
          오늘은 AI 정보를 더 쌓기보다,<br />
          하나의 행동으로 바꿔보는 날이에요.
        </h1>

        <p style="font-size:15px;line-height:1.8;margin:0;color:#4b5563;">
          ${escapeHtml(emotionMessage)}
          ${escapeHtml(goalMessage)}
          ${escapeHtml(blockerMessage)}
        </p>

        ${
          profileTags.length > 0
            ? `
              <div style="margin-top:18px;padding:14px;border-radius:14px;background:#f9fafb;border:1px solid #e5e7eb;">
                <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:8px;">오늘 브리프가 맞춰진 기준</div>
                <div style="font-size:13px;line-height:1.8;color:#4b5563;">
                  ${profileTags.map((tag) => `<div>• ${escapeHtml(tag)}</div>`).join("")}
                </div>
              </div>
            `
            : ""
        }
      </div>

      ${itemHtml}

      <div style="background:#111827;border-radius:20px;padding:22px;margin-top:18px;">
        <div style="font-size:13px;font-weight:800;color:#a5b4fc;margin-bottom:8px;">
          이번 주 작은 실행
        </div>
        <div style="font-size:16px;line-height:1.75;color:#ffffff;">
          ${escapeHtml(actionByTime)}
        </div>
      </div>

      <div style="font-size:12px;line-height:1.7;color:#6b7280;text-align:center;margin-top:22px;">
        이 메일은 AI-FU 구독 설정과 피드백을 바탕으로 발송되었습니다.<br />
        읽고 끝나는 AI 뉴스가 아니라, 내 상황에 맞는 작은 실행을 돕기 위한 브리프입니다.
      </div>
    </div>
  </body>
</html>
  `.trim();

  const text = [
    "AI-FU PERSONAL BRIEF",
    "",
    "오늘은 AI 정보를 더 쌓기보다, 하나의 행동으로 바꿔보는 날이에요.",
    "",
    emotionMessage,
    goalMessage,
    blockerMessage,
    "",
    profileTags.length > 0 ? "오늘 브리프가 맞춰진 기준" : "",
    ...profileTags.map((tag) => `- ${tag}`),
    "",
    "오늘의 자료",
    "",
    itemText,
    "",
    "이번 주 작은 실행",
    actionByTime,
    "",
    "이 메일은 AI-FU 구독 설정과 피드백을 바탕으로 발송되었습니다.",
  ]
    .filter((line) => line !== "")
    .join("\n");

  return {
    subject,
    html,
    text,
  };
}