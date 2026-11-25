"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { KoduHeadIcon } from "@/components/ui/icons/kodu-head-icon";
import {
  Building2,
  CalendarDays,
  MessageCircle,
  Settings,
  Tags,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  PERMISSIONS,
  canAccessOrganizationTab,
  getFullName,
  getInitials,
  hasPermission,
} from "@/features/iam/permissions";
import type { ActorDto } from "@/features/iam/schemas";

type NavigationLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: string;
};

const primaryLinks: NavigationLink[] = [
  {
    href: "/conversations",
    label: "Conversations",
    icon: MessageCircle,
    permission: PERMISSIONS.CRM_MANAGE,
  },
  {
    href: "/calendar",
    label: "Calendar",
    icon: CalendarDays,
    permission: PERMISSIONS.CALENDAR_MANAGE,
  },
  {
    href: "/customers",
    label: "Customers",
    icon: UsersRound,
    permission: PERMISSIONS.CRM_MANAGE,
  },
  {
    href: "/catalog",
    label: "Catalog",
    icon: Tags,
    permission: PERMISSIONS.CATALOG_MANAGE,
  },
];

function SidebarLink({
  href,
  label,
  icon: Icon,
  isActive,
  onNavigate,
}: Omit<NavigationLink, "permission"> & {
  isActive: boolean;
  onNavigate: () => void;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={
          <Link
            href={href}
            aria-current={isActive ? "page" : undefined}
            onClick={onNavigate}
          />
        }
        isActive={isActive}
        tooltip={label}
        className="h-11 gap-3 rounded-lg px-3 font-medium"
      >
        <Icon aria-hidden="true" className="size-[18px]" />
        <span>{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar({ user }: { user: ActorDto }) {
  const pathname = usePathname();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const onNavigate = () => {
    if (isMobile) setOpenMobile(false);
  };

  const visiblePrimaryLinks = primaryLinks.filter((link) =>
    hasPermission(user, link.permission),
  );
  const showOrganization = canAccessOrganizationTab(user);
  const initials = getInitials(user.first_name, user.last_name, user.email);
  const fullName = getFullName(user);

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="flex-row items-center gap-2 px-3.5 pb-5 pt-5">
        <KoduHeadIcon className="size-[30px] group-data-[collapsible=icon]:hidden" />
        <span className="truncate text-[18px] font-semibold tracking-[-0.04em] text-foreground group-data-[collapsible=icon]:sr-only">
          takodu
        </span>
        <SidebarTrigger
          aria-label={
            isMobile
              ? "Close navigation"
              : state === "expanded"
                ? "Collapse navigation"
                : "Expand navigation"
          }
          title={
            isMobile
              ? "Close navigation"
              : state === "expanded"
                ? "Collapse navigation"
                : "Expand navigation"
          }
          className="ml-auto size-11 shrink-0 text-muted-foreground"
        />
      </SidebarHeader>

      <SidebarContent className="px-3.5 pb-4">
        <nav aria-label="Main navigation" className="flex min-h-full flex-col">
          {visiblePrimaryLinks.length > 0 ? (
            <SidebarGroup className="gap-1 p-0">
              <SidebarGroupLabel className="h-8 px-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
                CRM
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  {visiblePrimaryLinks.map((link) => (
                    <SidebarLink
                      key={link.href}
                      href={link.href}
                      label={link.label}
                      icon={link.icon}
                      isActive={pathname === link.href}
                      onNavigate={onNavigate}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ) : null}

          {showOrganization ? (
            <SidebarGroup className="mt-3 border-t border-sidebar-border px-0 pb-0 pt-4">
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarLink
                    href="/organization"
                    label="Organization"
                    icon={Building2}
                    isActive={
                      pathname === "/organization" ||
                      pathname.startsWith("/organization/")
                    }
                    onNavigate={onNavigate}
                  />
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ) : null}
        </nav>
      </SidebarContent>

      <SidebarFooter className="px-3.5 pb-4 pt-0">
        <div className="flex items-center gap-2.5 border-t border-sidebar-border px-1 pt-3 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:px-0">
          <span className="grid size-[30px] shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
            {initials}
          </span>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-xs font-semibold text-foreground">
              {fullName}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
          <Link
            href="/settings"
            aria-label="Account settings"
            title="Account settings"
            onClick={onNavigate}
            className="grid size-10 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring group-data-[collapsible=icon]:size-11"
          >
            <Settings aria-hidden="true" className="size-[18px]" />
          </Link>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
