"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "cn";

const tabs = [
  { href: "/organization", label: "Business profile" },
  { href: "/organization/members", label: "Members" },
  { href: "/organization/roles", label: "Roles and permissions" },
  { href: "/organization/invitations", label: "Invitations" },
] as const;

export function OrganizationTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Organization sections"
      className="flex gap-1 overflow-x-auto border-b border-border"
    >
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative shrink-0 px-3.5 py-2.5 text-sm transition-colors",
              isActive
                ? "font-semibold text-foreground"
                : "font-medium text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {isActive ? (
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary"
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
