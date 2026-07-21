// 사업자·법정 표시 정보의 단일 소스.
// 푸터(전자상거래법 제10조 신원정보 표시), 이용약관, 개인정보처리방침이
// 전부 이 파일만 참조하므로, 등록이 끝나면 여기 한 곳만 채우면 된다.
//
// ── 등록 후 채워야 하는 순서 ──
// 1) 홈택스에서 사업자등록 → businessRegistrationNumber, legalName(상호),
//    representative(대표자), address(사업장 소재지)를 등록증 그대로 기재
// 2) 토스페이먼츠 가맹 계약 → 계약 완료 후 "구매안전서비스 이용확인증" 발급
// 3) 정부24에서 통신판매업 신고(위 확인증 첨부) → mailOrderSalesNumber 기재
//    (예: "제2026-전북전주-0000호")
// 4) 값을 채운 뒤 커밋·배포하면 사이트 전체에 자동 반영된다.
//
// 아직 등록 전인 값은 null로 두면 화면에 "(사업자등록 후 기재 예정)"으로
// 표시된다 — 심사 제출 전에는 반드시 실제 값으로 교체할 것.

export const BUSINESS_INFO = {
  /** 서비스명(브랜드) */
  serviceName: "Mosun Brief",
  /** 사업자등록증상 상호 — 등록 후 기재 */
  legalName: null as string | null,
  /** 대표자 성명 — 등록 후 기재 */
  representative: null as string | null,
  /** 사업자등록번호 (000-00-00000) — 등록 후 기재 */
  businessRegistrationNumber: null as string | null,
  /** 통신판매업 신고번호 — 신고 후 기재 */
  mailOrderSalesNumber: null as string | null,
  /** 사업장 소재지 — 등록 후 기재 */
  address: null as string | null,
  /** 대표 전화 — 통신판매업 신고 시 필수, 등록 후 기재 */
  phone: null as string | null,
  /** 대표 이메일 (문의·개인정보 관련 요청 접수) */
  email: "dmahoyeon@naver.com",
  /** 호스팅서비스 제공자 (전자상거래법 제10조 표시 항목) */
  hostingProvider: "Vercel Inc.",
  /** 개인정보 보호책임자 — 대표자와 동일하게 두는 소규모 사업자 관행 */
  privacyOfficer: {
    name: null as string | null,
    contact: "dmahoyeon@naver.com",
  },
} as const;

/** null인 항목을 자리표시 문구로 바꿔 출력할 때 사용 */
export function displayOr(value: string | null, placeholder = "(사업자등록 후 기재 예정)") {
  return value ?? placeholder;
}
