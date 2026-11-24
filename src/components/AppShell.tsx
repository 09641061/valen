"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "248px",
          "--sidebar-width-icon": "72px",
        } as React.CSSProperties
      }
    >
      <AppSidebar />
      <SidebarInset className="min-h-svh bg-background">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4 md:hidden">
          <SidebarTrigger
            aria-label="Open navigation"
            title="Open navigation"
            className="size-11 text-muted-foreground"
          />
          <Image src="/kodu-head.svg" alt="" width={24} height={24} />
          <span className="text-base font-semibold tracking-[-0.03em] text-foreground">
            takodu
          </span>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
