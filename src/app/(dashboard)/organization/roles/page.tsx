import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Roles and permissions",
};

export default function OrganizationRolesPage() {
  return (
    <section>
      <h2 className="text-xl font-semibold tracking-[-0.02em] text-foreground">
        Roles and permissions
      </h2>
    </section>
  );
}
