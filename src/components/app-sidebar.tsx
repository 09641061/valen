"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

type NavigationLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const primaryLinks: NavigationLink[] = [
  { href: "/conversations", label: "Conversaciones", icon: MessageCircle },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/customers", label: "Clientes", icon: UsersRound },
  { href: "/catalog", label: "Catálogo", icon: Tags },
];

const organizationLink: NavigationLink = {
  href: "/organization",
  label: "Organización",
  icon: Building2,
};

function SidebarLink({
  href,
  label,
  icon: Icon,
  isActive,
  onNavigate,
}: NavigationLink & { isActive: boolean; onNavigate: () => void }) {
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

export function AppSidebar() {
  const pathname = usePathname();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const onNavigate = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border">
      <SidebarHeader className="flex-row items-center gap-2 px-3.5 pb-5 pt-5">
        <Image
          src="/kodu-head.svg"
          alt=""
          width={30}
          height={30}
          priority
          className="size-[30px] shrink-0 group-data-[collapsible=icon]:hidden"
        />
        <span className="truncate text-[18px] font-semibold tracking-[-0.04em] text-foreground group-data-[collapsible=icon]:sr-only">
          takodu
        </span>
        <SidebarTrigger
          aria-label={
            isMobile
              ? "Cerrar navegación"
              : state === "expanded"
                ? "Contraer navegación"
                : "Expandir navegación"
          }
          title={
            isMobile
              ? "Cerrar navegación"
              : state === "expanded"
                ? "Contraer navegación"
                : "Expandir navegación"
          }
          className="ml-auto size-11 shrink-0 text-muted-foreground"
        />
      </SidebarHeader>

      <SidebarContent className="px-3.5 pb-4">
        <nav aria-label="Navegación principal" className="flex min-h-full flex-col">
          <SidebarGroup className="gap-1 p-0">
            <SidebarGroupLabel className="h-8 px-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
              CRM
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {primaryLinks.map((link) => (
                  <SidebarLink
                    key={link.href}
                    {...link}
                    isActive={pathname === link.href}
                    onNavigate={onNavigate}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="mt-3 border-t border-sidebar-border px-0 pb-0 pt-4">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarLink
                  {...organizationLink}
                  isActive={pathname === organizationLink.href}
                  onNavigate={onNavigate}
                />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </nav>
      </SidebarContent>

      <SidebarFooter className="px-3.5 pb-4 pt-0">
        <div className="flex items-center gap-2.5 border-t border-sidebar-border px-1 pt-3 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:px-0">
          <span className="grid size-[30px] shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
            TK
          </span>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-xs font-semibold text-foreground">Takodu</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">Panel de negocio</p>
          </div>
          <Link
            href="/organization"
            aria-label="Abrir Organización"
            title="Abrir Organización"
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
