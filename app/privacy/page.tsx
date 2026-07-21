import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS_INFO, displayOr } from "@/lib/businessInfo";

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
                  <li>직업 또는 상황 (선택 입력)</li>
                  <li>AI에 대한 현재 감정 또는 상태</li>
                  <li>AI로 하고 싶은 일 또는 관심 목적</li>
                  <li>현재 AI 활용에서 막히는 지점</li>
                  <li>이번 주 실행 가능한 시간</li>
                  <li>이메일 브리핑에 대한 피드백 응답</li>
                  <li>상담 신청 시: 이름(선택), 상담 요청 내용</li>
                  <li>
                    유료 서비스 이용 시: 결제 일시, 결제 금액, 구매 내역 등
                    결제 기록 (카드번호 등 결제수단 정보는 전자결제대행사인
                    토스페이먼츠가 직접 처리하며, Mosun Brief는 이를
                    수집·보관하지 않습니다)
                  </li>
                  <li>
                    서비스 이용 과정에서 자동 생성: 접속 기록, 발송·열람 관련
                    로그
                  </li>
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
                  <li>유료 서비스의 계약 이행, 대금 결제·정산 및 환불 처리</li>
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
                  다만, 관계 법령에 따라 아래 정보는 명시된 기간 동안
                  보관합니다.
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래
                    등에서의 소비자보호에 관한 법률)
                  </li>
                  <li>
                    대금 결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래
                    등에서의 소비자보호에 관한 법률)
                  </li>
                  <li>
                    소비자의 불만 또는 분쟁 처리에 관한 기록: 3년 (전자상거래
                    등에서의 소비자보호에 관한 법률)
                  </li>
                  <li>
                    표시·광고에 관한 기록: 6개월 (전자상거래 등에서의
                    소비자보호에 관한 법률)
                  </li>
                  <li>서비스 접속에 관한 기록: 3개월 (통신비밀보호법)</li>
                </ul>
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
                  서비스 운영을 위해 아래 업체에 개인정보 처리 업무를
                  위탁합니다.
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>Resend (미국): 이메일 브리핑 발송</li>
                  <li>Supabase, Inc. (미국): 데이터베이스 운영 및 데이터 보관</li>
                  <li>Vercel Inc. (미국): 웹사이트 호스팅 및 배포</li>
                  <li>
                    토스페이먼츠 주식회사: 유료 서비스 결제 처리 및 결제 도용
                    방지
                  </li>
                </ul>
                <p>
                  위탁 계약 시 개인정보가 안전하게 처리될 수 있도록 필요한
                  보호 조치를 확인하며, 수탁 업체가 변경되는 경우 본 방침을
                  통해 공개합니다.
                </p>
                <p className="font-medium text-[#3d352d]">
                  개인정보의 국외 이전 안내
                </p>
                <p>
                  위 수탁 업체 중 Resend, Supabase, Vercel은 미국에 소재한
                  업체로, 개인정보 처리 과정에서 수집 항목(이메일 주소, 구독
                  설정 정보, 접속 기록 등)이 서비스 이용 기간 동안 해당 업체의
                  국외(미국) 서버에 네트워크를 통해 전송·보관됩니다. 이전을
                  원하지 않는 경우 구독 취소 및 삭제를 요청할 수 있으나, 이
                  경우 서비스 이용이 어려울 수 있습니다.
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
                9. 개인정보 보호책임자 및 문의
              </h2>
              <div className="mt-4 space-y-3 text-[15px] leading-8 text-[#5f554a]">
                <p>
                  개인정보 처리에 관한 업무를 총괄하고 관련 문의·불만·피해구제
                  요청을 처리하기 위해 아래와 같이 개인정보 보호책임자를
                  지정하고 있습니다. 개인정보와 관련한 문의, 구독 취소, 삭제
                  요청은 아래 연락처로 요청할 수 있습니다.
                </p>
                <div className="rounded-2xl border border-[#eadfce] bg-[#fff6e8] p-4">
                  <p>서비스명: {BUSINESS_INFO.serviceName}</p>
                  <p>
                    개인정보 보호책임자:{" "}
                    {displayOr(BUSINESS_INFO.privacyOfficer.name, "(대표자, 사업자등록 후 기재 예정)")}
                  </p>
                  <p>문의: {BUSINESS_INFO.privacyOfficer.contact}</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                10. 권익침해에 대한 구제 방법
              </h2>
              <div className="mt-4 space-y-3 text-[15px] leading-8 text-[#5f554a]">
                <p>
                  개인정보 침해에 대한 신고나 상담이 필요한 경우 아래 기관에
                  문의할 수 있습니다.
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>개인정보분쟁조정위원회: 1833-6972 (www.kopico.go.kr)</li>
                  <li>개인정보침해신고센터: 118 (privacy.kisa.or.kr)</li>
                  <li>대검찰청: 1301 (www.spo.go.kr)</li>
                  <li>경찰청: 182 (ecrm.police.go.kr)</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                11. 개인정보처리방침 변경
              </h2>
              <div className="mt-4 space-y-3 text-[15px] leading-8 text-[#5f554a]">
                <p>
                  본 개인정보처리방침은 서비스 변경 또는 관련 법령 변경에 따라
                  수정될 수 있습니다. 변경 사항은 본 페이지를 통해 안내합니다.
                </p>
                <p className="text-sm text-[#7a6d5f]">
                  시행일: 2026년 7월 8일 · 개정일: 2026년 7월 21일 (유료 서비스
                  결제 관련 처리, 법정 보존기간, 처리 위탁 업체, 국외 이전,
                  보호책임자 및 권익침해 구제 안내 추가)
                </p>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}