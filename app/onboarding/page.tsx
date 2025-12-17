import { redirect } from "next/navigation";

export default function OnboardingHome() {
  redirect("/onboarding/step0/new");
}
