import { ImageResponse } from "next/og";

export const alt = "Mosun Brief — 아직 AI로 무언가를 만들지 못한 당신에게";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const LINE_1 = "알고는 있지만,";
const LINE_2 = "아직 만들지는 못했다.";
const SUB = "이번 주 당신을 위한 개인 맞춤 AI 브리핑";
const FOOTER = "Mosun Brief — brief.mosunbrief.kr";

async function loadGoogleFont(family: string, text: string) {
  const url = `https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(
    text
  )}`;
  const css = await (await fetch(url)).text();
  const resource = css.match(
    /src: url\((.+?)\) format\('(opentype|truetype)'\)/
  );

  if (!resource) {
    throw new Error("Failed to load font for og image");
  }

  const response = await fetch(resource[1]);
  return response.arrayBuffer();
}

export default async function OgImage() {
  const text = LINE_1 + LINE_2 + SUB + FOOTER;
  const fontData = await loadGoogleFont("Noto+Serif+KR:wght@700", text);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 88px",
          backgroundColor: "#faf9f5",
          color: "#1f1e1d",
          fontFamily: "NotoSerifKR",
        }}
      >
        <svg width={280} height={56} viewBox="0 0 240 48">
          <polyline
            points="2,30 70,30 84,30 94,8 106,44 116,30 152,30 238,30"
            fill="none"
            stroke="#c6613f"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 36,
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.35,
            letterSpacing: "-0.02em",
          }}
        >
          <span>{LINE_1}</span>
          <span>{LINE_2}</span>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 36,
            fontSize: 30,
            color: "#6f6a5f",
          }}
        >
          {SUB}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 40,
            fontSize: 26,
            color: "#a34e31",
          }}
        >
          {FOOTER}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "NotoSerifKR",
          data: fontData,
          weight: 700,
          style: "normal",
        },
      ],
    }
  );
}
