import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invitations",
};

export default function OrganizationInvitationsPage() {
  return (
    <section>
      <h2 className="text-xl font-semibold tracking-[-0.02em] text-foreground">
        Invitations
      </h2>
    </section>
  );
}
