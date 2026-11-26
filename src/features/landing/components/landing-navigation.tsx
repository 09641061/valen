import Image from "next/image";
import { ArrowRight, Menu } from "lucide-react";
import { buttonVariants, Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import koduHead from "../assets/kodu-head.webp";
import styles from "./landing-page.module.css";

const sections = [
  { href: "#product", label: "The product" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#faq", label: "FAQ" },
];

const contact = { href: "#contact", label: "Let’s talk about your business" };

export function LandingLogo() {
  return (
    <a className={styles.logo} href="#top" aria-label="Takodu home">
      <Image src={koduHead} alt="" width={34} height={31} unoptimized />
      takodu
    </a>
  );
}

export function TalkLink() {
  return (
    <a className={buttonVariants({ size: "lg", className: styles.cta })} href={contact.href}>
      {contact.label}
      <ArrowRight aria-hidden="true" />
    </a>
  );
}

export function LandingHeader() {
  return (
    <header className={styles.header}>
      <LandingLogo />
      <nav aria-label="Site navigation" className={styles.desktopNav}>
        {sections.map(({ href, label }) => (
          <a href={href} key={href}>{label}</a>
        ))}
        <TalkLink />
      </nav>
      <div className={styles.mobileNav}>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger
            aria-label="Open site navigation"
            render={<Button size="icon-lg" variant="outline" />}
          >
            <Menu aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {[...sections, contact].map(({ href, label }) => (
              <DropdownMenuItem key={href} className="min-h-11 px-3" render={<a href={href} />}>
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
