import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Members",
};

export default function OrganizationMembersPage() {
  return (
    <section>
      <h2 className="text-xl font-semibold tracking-[-0.02em] text-foreground">
        Members
      </h2>
    </section>
  );
}
