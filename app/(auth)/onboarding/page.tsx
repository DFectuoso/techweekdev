import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserNewsletterStatus } from "@/lib/queries/users";
import { OnboardingForm } from "@/components/auth/onboarding-form";

export const metadata = { title: "Welcome — TechWeek" };

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const isSubscribed = await getUserNewsletterStatus(session.user.id);

  if (isSubscribed) {
    redirect("/calendar");
  }

  return <OnboardingForm />;
}
