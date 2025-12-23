export const ONBOARDING_STATES = [
  "step0_pending",
  "step0_approved",
  "step0_rejected",
  "step1_pending",
  "step1_submitted",
  "step1_need_fix",
  "step1_approved",
  "step2_done",
  "step3_proposed",
  "step3_approved",
  "step4_submitted",
  "step4_complete",
  "step5_submitted",
  "step5_complete",
] as const;

export type OnboardingState = (typeof ONBOARDING_STATES)[number];

export function statusToLabel(status: OnboardingState) {
  const map: Record<OnboardingState, string> = {
    step0_pending: "STEP0 · 제휴 요청 접수",
    step0_approved: "STEP0 · 제휴 요청 승인",
    step0_rejected: "STEP0 · 제휴 요청 반려",
    step1_pending: "STEP2 · 구장 정보 입력 대기",
    step1_submitted: "STEP2 · 구장 정보 검토중",
    step1_need_fix: "STEP2 · 보완 요청",
    step1_approved: "STEP2 · 구장 정보 승인",
    step2_done: "STEP1 · 전화/정산 안내 완료",
    step3_proposed: "STEP1 · 정산안 확인중",
    step3_approved: "STEP1 · 정산안 승인",
    step4_submitted: "STEP3 · 서류 제출 완료",
    step4_complete: "STEP3 · 서류 검토 완료",
    step5_submitted: "STEP4 · 세팅 시간 제출",
    step5_complete: "STEP5 · 온보딩 완료",
  };
  return map[status] ?? status;
}

export function statusToPath(id: string, status: OnboardingState) {
  const base = `/onboarding/${id}`;
  const map: Record<OnboardingState, string> = {
    // STEP0 대기/승인은 대기 안내 페이지로
    step0_pending: `${base}/wait`,
    step0_approved: `${base}/wait`,
    step0_rejected: `${base}/wait`,
    // STEP1(정산 협의)
    step2_done: `${base}/step1`, // 전화 안내 완료 후 정산 확인
    step3_proposed: `${base}/step1`,
    step3_approved: `${base}/step2`, // 정산 승인 후 구장 상세로 이동
    // STEP2(구장 상세)
    step1_pending: `${base}/step2`,
    step1_submitted: `${base}/step2`,
    step1_need_fix: `${base}/step2`,
    step1_approved: `${base}/step5`, // 담당자 승인 후 세팅 완료 안내로 이동
    // STEP3(서류)
    step4_submitted: `${base}/step3`,
    step4_complete: `${base}/step4`,
    // STEP4(세팅 가능 시간)
    step5_submitted: `${base}/step5`,
    // STEP5 완료
    step5_complete: `${base}/step5`,
  };
  return map[status] ?? `${base}/step1`;
}

export function normalizePhone(input: string) {
  return (input || "").replace(/\D/g, "");
}

export function isValidPhone(input: string) {
  const d = normalizePhone(input);
  return d.length >= 10 && d.length <= 11;
}
