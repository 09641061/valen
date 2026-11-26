import type { Metadata } from "next";
import { LandingPage } from "@/features/landing/components/landing-page";

export const metadata: Metadata = {
  title: "Appointment scheduling for service businesses · Takodu",
  description:
    "Keep appointments, services, and client details together with Takodu.",
};

export default function HomePage() {
  return <LandingPage />;
}
