import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보처리방침 | Mosun Brief",
  description:
    "Mosun Brief의 개인정보 수집, 이용, 보관, 파기 및 이용자 권리에 관한 안내입니다.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f7f1e8] text-[#231f1a]">
      <section className="mx-auto flex w-full max-w-3xl flex-col px-5 py-14 sm:px-6 sm:py-20">
        <Link
          href="/"
          className="mb-8 text-sm font-medium text-[#7a5b3a] underline-offset-4 hover:underline"
        >
          ← Mosun Brief로 돌아가기
        </Link>

        <div className="rounded-[28px] border border-[#dfd0bd] bg-[#fffaf3]/90 p-6 shadow-sm sm:p-10">
          <p className="mb-3 text-sm font-semibold tracking-[0.18em] text-[#9a744c]">
            PRIVACY POLICY
          </p>

          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#231f1a] sm:text-4xl">
            개인정보처리방침
          </h1>

          <p className="mt-5 text-base leading-8 text-[#5f554a]">
            Mosun Brief는 이용자의 개인정보를 중요하게 생각합니다. 본
            개인정보처리방침은 서비스 이용 과정에서 수집되는 개인정보가 어떤
            목적으로 이용되고, 어떻게 보관·파기되는지 안내하기 위한 문서입니다.
          </p>

          <div className="mt-10 space-y-10 text-[#3d352d]">
            <section>
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                1. 수집하는 개인정보 항목
              </h2>
              <div className="mt-4 space-y-3 text-[15px] leading-8 text-[#5f554a]">
                <p>
                  Mosun Brief는 구독 신청 및 맞춤형 브리핑 제공을 위해 아래
                  정보를 수집할 수 있습니다.
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>이메일 주소</li>
                  <li>AI에 대한 현재 감정 또는 상태</li>
                  <li>AI로 하고 싶은 일 또는 관심 목적</li>
                  <li>현재 AI 활용에서 막히는 지점</li>
                  <li>이번 주 실행 가능한 시간</li>
                  <li>이메일 브리핑에 대한 피드백 응답</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                2. 개인정보의 수집 및 이용 목적
              </h2>
              <div className="mt-4 space-y-3 text-[15px] leading-8 text-[#5f554a]">
                <p>수집한 개인정보는 다음 목적을 위해 이용됩니다.</p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>AI 관련 맞춤형 이메일 브리핑 발송</li>
                  <li>구독자 상태에 맞는 자료 추천 및 큐레이션</li>
                  <li>브리핑 품질 개선을 위한 피드백 분석</li>
                  <li>구독 신청, 구독 취소, 문의 응대 등 서비스 운영</li>
                  <li>서비스 남용 방지 및 기본적인 운영 안정성 확보</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                3. 개인정보의 보유 및 이용 기간
              </h2>
              <div className="mt-4 space-y-3 text-[15px] leading-8 text-[#5f554a]">
                <p>
                  개인정보는 구독 유지 기간 동안 보관하며, 이용자가 구독 취소
                  또는 삭제를 요청하는 경우 지체 없이 삭제합니다.
                </p>
                <p>
                  다만, 서비스 운영 기록 확인, 분쟁 대응, 관계 법령상 보관이
                  필요한 경우에는 필요한 범위 내에서 일정 기간 보관될 수
                  있습니다.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                4. 개인정보의 제3자 제공
              </h2>
              <div className="mt-4 space-y-3 text-[15px] leading-8 text-[#5f554a]">
                <p>
                  Mosun Brief는 이용자의 개인정보를 원칙적으로 외부에 판매하거나
                  제공하지 않습니다.
                </p>
                <p>
                  단, 법령에 따라 요구되는 경우 또는 이용자의 명시적 동의가 있는
                  경우에는 필요한 범위 내에서 제공될 수 있습니다.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                5. 개인정보 처리 위탁
              </h2>
              <div className="mt-4 space-y-3 text-[15px] leading-8 text-[#5f554a]">
                <p>
                  서비스 운영을 위해 이메일 발송, 데이터 저장, 웹사이트 배포 등
                  일부 업무를 외부 서비스에 위탁할 수 있습니다.
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>이메일 발송 서비스</li>
                  <li>데이터베이스 및 인증 관련 서비스</li>
                  <li>웹사이트 호스팅 및 배포 서비스</li>
                </ul>
                <p>
                  위탁이 발생하는 경우 개인정보가 안전하게 처리될 수 있도록
                  필요한 보호 조치를 확인합니다.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                6. 개인정보의 파기
              </h2>
              <div className="mt-4 space-y-3 text-[15px] leading-8 text-[#5f554a]">
                <p>
                  개인정보의 처리 목적이 달성되거나 이용자가 삭제를 요청한
                  경우, 해당 정보를 복구하기 어려운 방식으로 삭제합니다.
                </p>
                <p>
                  전자적 파일 형태의 정보는 기술적으로 복구하기 어렵도록
                  삭제하며, 별도 문서 형태로 보관된 정보가 있는 경우 분쇄 또는
                  이에 준하는 방식으로 파기합니다.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                7. 이용자의 권리
              </h2>
              <div className="mt-4 space-y-3 text-[15px] leading-8 text-[#5f554a]">
                <p>
                  이용자는 언제든지 본인의 개인정보에 대해 열람, 정정, 삭제,
                  처리정지를 요청할 수 있습니다.
                </p>
                <p>
                  또한 이메일 하단의 구독 취소 링크를 통해 브리핑 수신을 중단할
                  수 있습니다.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                8. 개인정보의 안전성 확보 조치
              </h2>
              <div className="mt-4 space-y-3 text-[15px] leading-8 text-[#5f554a]">
                <p>
                  Mosun Brief는 개인정보가 분실, 도난, 유출, 변조 또는 훼손되지
                  않도록 필요한 범위에서 관리적·기술적 보호 조치를 취합니다.
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>개인정보 접근 권한 제한</li>
                  <li>관리자 접근 정보의 보호</li>
                  <li>불필요한 개인정보 수집 최소화</li>
                  <li>구독 취소 및 삭제 요청에 대한 처리</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                9. 문의 및 개인정보 보호 담당
              </h2>
              <div className="mt-4 space-y-3 text-[15px] leading-8 text-[#5f554a]">
                <p>
                  개인정보와 관련한 문의, 구독 취소, 삭제 요청은 아래 연락처로
                  요청할 수 있습니다.
                </p>
                <div className="rounded-2xl border border-[#eadfce] bg-[#fff6e8] p-4">
                  <p>서비스명: Mosun Brief</p>
                  <p>문의: dmahoyeon@naver.com</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                10. 개인정보처리방침 변경
              </h2>
              <div className="mt-4 space-y-3 text-[15px] leading-8 text-[#5f554a]">
                <p>
                  본 개인정보처리방침은 서비스 변경 또는 관련 법령 변경에 따라
                  수정될 수 있습니다. 변경 사항은 본 페이지를 통해 안내합니다.
                </p>
                <p className="text-sm text-[#7a6d5f]">
                  시행일: 2026년 7월 8일
                </p>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}