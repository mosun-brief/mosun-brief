import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS_INFO, displayOr } from "@/lib/businessInfo";

export const metadata: Metadata = {
  title: "이용약관 | Mosun Brief",
  description:
    "Mosun Brief 서비스 이용약관 — 서비스 내용, 유료 서비스 결제, 청약철회 및 환불 규정에 관한 안내입니다.",
};

// 전자상거래법·콘텐츠산업진흥법·소비자분쟁해결기준을 기준으로 작성한
// 디지털 콘텐츠/구독형 서비스 약관. 유료 결제(토스페이먼츠) 도입을
// 전제로 결제·청약철회·환불 조항을 포함한다. 환불 규정은 토스페이먼츠
// 가맹 심사에서 별도 확인하는 항목이라 #refund 앵커로 직접 연결된다.
export default function TermsPage() {
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
            TERMS OF SERVICE
          </p>

          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#231f1a] sm:text-4xl">
            이용약관
          </h1>

          <p className="mt-5 text-base leading-8 text-[#5f554a]">
            본 약관은 {BUSINESS_INFO.serviceName}(이하 &ldquo;서비스&rdquo;)의
            이용 조건과 절차, 이용자와 운영자의 권리·의무 및 책임사항을 정하는
            것을 목적으로 합니다.
          </p>

          <div className="mt-10 space-y-10 text-[#3d352d]">
            <section>
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                제1조 (정의)
              </h2>
              <div className="mt-4 space-y-3 text-[15px] leading-8 text-[#5f554a]">
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    &ldquo;서비스&rdquo;란 운영자가 제공하는 AI 관련 이메일
                    브리핑, 디지털 콘텐츠, 상담 및 이에 부수하는 제반 서비스를
                    말합니다.
                  </li>
                  <li>
                    &ldquo;이용자&rdquo;란 본 약관에 따라 서비스를 이용하는
                    사람을 말합니다.
                  </li>
                  <li>
                    &ldquo;유료 서비스&rdquo;란 이용자가 대금을 지급하고
                    이용하는 디지털 콘텐츠, 코스, 구독형 서비스 등을 말합니다.
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                제2조 (약관의 효력 및 변경)
              </h2>
              <div className="mt-4 space-y-3 text-[15px] leading-8 text-[#5f554a]">
                <p>
                  본 약관은 서비스 화면에 게시함으로써 효력이 발생합니다.
                  운영자는 관계 법령을 위배하지 않는 범위에서 약관을 변경할 수
                  있으며, 변경 시 적용일자와 변경 사유를 명시하여 적용일 7일
                  전부터(이용자에게 불리한 변경은 30일 전부터) 서비스 화면에
                  공지합니다.
                </p>
                <p>
                  변경된 약관에 동의하지 않는 이용자는 서비스 이용을 중단하고
                  구독을 취소할 수 있습니다.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                제3조 (서비스의 내용)
              </h2>
              <div className="mt-4 space-y-3 text-[15px] leading-8 text-[#5f554a]">
                <ul className="list-disc space-y-2 pl-5">
                  <li>맞춤형 AI 브리핑 이메일 발송 (무료)</li>
                  <li>디지털 콘텐츠 및 코스 판매 (유료)</li>
                  <li>개인 AI 활용 상담 (조건부 제공)</li>
                </ul>
                <p>
                  각 유료 서비스의 구체적 내용, 가격, 제공 기간은 해당 서비스의
                  구매 화면에 표시하며, 표시된 내용은 계약의 내용이 됩니다.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                제4조 (구독 신청 및 해지)
              </h2>
              <div className="mt-4 space-y-3 text-[15px] leading-8 text-[#5f554a]">
                <p>
                  무료 브리핑 구독은 이메일 주소 제출로 신청되며, 이용자는
                  언제든지 이메일 하단의 구독 취소 링크 또는{" "}
                  <Link href="/unsubscribe" className="underline underline-offset-4">
                    구독 취소 페이지
                  </Link>
                  를 통해 해지할 수 있습니다.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                제5조 (유료 서비스의 결제)
              </h2>
              <div className="mt-4 space-y-3 text-[15px] leading-8 text-[#5f554a]">
                <p>
                  유료 서비스의 대금 결제는 전자결제대행사(토스페이먼츠)를 통해
                  처리되며, 이용 가능한 결제 수단은 결제 화면에 표시됩니다.
                  운영자는 카드번호 등 결제수단 정보를 직접 수집·보관하지
                  않습니다.
                </p>
                <p>
                  미성년자가 법정대리인의 동의 없이 결제한 경우, 미성년자 또는
                  법정대리인은 관계 법령에 따라 계약을 취소할 수 있습니다.
                </p>
              </div>
            </section>

            <section id="refund">
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                제6조 (청약철회 및 환불)
              </h2>
              <div className="mt-4 space-y-3 text-[15px] leading-8 text-[#5f554a]">
                <p>
                  이용자는 「전자상거래 등에서의 소비자보호에 관한 법률」에
                  따라 유료 서비스 구매일(또는 이용 가능일)로부터 7일 이내에
                  청약철회를 할 수 있으며, 이 경우 운영자는 청약철회 접수일로부터
                  3영업일 이내에 결제 수단으로 대금을 환급합니다.
                </p>
                <p>
                  다만 같은 법 제17조 제2항에 따라, 아래의 경우에는 청약철회가
                  제한됩니다.
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    디지털 콘텐츠의 제공이 이미 개시된 경우 (다만 분할 제공
                    콘텐츠는 제공이 개시되지 않은 부분에 대해 철회 가능)
                  </li>
                  <li>
                    구매 즉시 열람·다운로드가 완료되는 콘텐츠로서, 청약철회가
                    제한됨을 구매 화면에 표시하고 이용자가 동의한 경우
                  </li>
                </ul>
                <p>
                  청약철회가 제한되는 콘텐츠는 결제 전에 그 사실을 구매 화면에
                  명시하고 이용자의 동의를 받습니다.
                </p>
                <p>
                  기간제·구독형 유료 서비스를 이용 중 해지하는 경우, 이미 제공된
                  기간(또는 회차)에 해당하는 금액과 소비자분쟁해결기준에 따른
                  공제액을 제외한 잔액을 환불합니다.
                </p>
                <p>
                  콘텐츠가 표시·광고 내용과 다르거나 정상적으로 제공되지 않은
                  경우, 이용자는 제공일로부터 3개월 이내 또는 그 사실을 안
                  날로부터 30일 이내에 청약철회를 할 수 있으며 이 경우 전액
                  환불합니다.
                </p>
                <p>
                  환불 요청은{" "}
                  <span className="font-medium">{BUSINESS_INFO.email}</span>로
                  접수할 수 있습니다.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                제7조 (지식재산권)
              </h2>
              <div className="mt-4 space-y-3 text-[15px] leading-8 text-[#5f554a]">
                <p>
                  서비스가 제공하는 브리핑·콘텐츠에 대한 저작권은 운영자 또는
                  해당 저작권자에게 있으며, 이용자는 사적 이용 범위를 넘어 이를
                  복제·배포·전송·판매할 수 없습니다.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                제8조 (운영자와 이용자의 의무)
              </h2>
              <div className="mt-4 space-y-3 text-[15px] leading-8 text-[#5f554a]">
                <p>
                  운영자는 관계 법령과 본 약관을 준수하며, 안정적인 서비스
                  제공을 위해 노력합니다. 이용자의 개인정보는{" "}
                  <Link href="/privacy" className="underline underline-offset-4">
                    개인정보처리방침
                  </Link>
                  에 따라 보호됩니다.
                </p>
                <p>
                  이용자는 타인의 정보 도용, 서비스 운영 방해, 관계 법령 위반
                  행위를 해서는 안 됩니다.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                제9조 (면책)
              </h2>
              <div className="mt-4 space-y-3 text-[15px] leading-8 text-[#5f554a]">
                <p>
                  운영자는 천재지변, 통신 장애 등 불가항력으로 서비스를 제공할
                  수 없는 경우 책임이 면제됩니다. 브리핑이 제공하는 정보는 참고
                  자료이며, 이를 근거로 한 이용자의 판단과 그 결과에 대해
                  운영자는 고의 또는 중대한 과실이 없는 한 책임을 지지
                  않습니다.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                제10조 (분쟁 해결 및 관할)
              </h2>
              <div className="mt-4 space-y-3 text-[15px] leading-8 text-[#5f554a]">
                <p>
                  서비스 이용과 관련하여 분쟁이 발생한 경우, 운영자와 이용자는
                  성실히 협의하며, 협의가 이루어지지 않는 경우
                  소비자분쟁해결기준(공정거래위원회 고시) 및 관계 법령에
                  따릅니다. 이용자는 한국소비자원, 전자거래분쟁조정위원회 등에
                  조정을 신청할 수 있습니다.
                </p>
                <p>
                  소송이 제기되는 경우 관할 법원은 민사소송법에 따라 정합니다.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                사업자 정보
              </h2>
              <div className="mt-4 space-y-3 text-[15px] leading-8 text-[#5f554a]">
                <div className="rounded-2xl border border-[#eadfce] bg-[#fff6e8] p-4">
                  <p>서비스명: {BUSINESS_INFO.serviceName}</p>
                  <p>상호: {displayOr(BUSINESS_INFO.legalName)}</p>
                  <p>대표자: {displayOr(BUSINESS_INFO.representative)}</p>
                  <p>
                    사업자등록번호:{" "}
                    {displayOr(BUSINESS_INFO.businessRegistrationNumber)}
                  </p>
                  <p>
                    통신판매업 신고번호:{" "}
                    {displayOr(
                      BUSINESS_INFO.mailOrderSalesNumber,
                      "(통신판매업 신고 후 기재 예정)"
                    )}
                  </p>
                  <p>주소: {displayOr(BUSINESS_INFO.address)}</p>
                  <p>
                    전화: {displayOr(BUSINESS_INFO.phone)} · 이메일:{" "}
                    {BUSINESS_INFO.email}
                  </p>
                  <p>호스팅서비스 제공자: {BUSINESS_INFO.hostingProvider}</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold tracking-[-0.02em]">
                부칙
              </h2>
              <div className="mt-4 space-y-3 text-[15px] leading-8 text-[#5f554a]">
                <p className="text-sm text-[#7a6d5f]">
                  본 약관은 2026년 7월 21일부터 시행합니다.
                </p>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
