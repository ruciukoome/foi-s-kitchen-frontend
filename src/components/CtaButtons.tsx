import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { site, waLink } from "@/lib/site";

const base =
  "label-caps inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-6 transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.97]";

export function PrimaryLink({
  to,
  children,
  className,
}: {
  to: "/order" | "/quote" | "/menu" | "/contact";
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link to={to} className={cn(base, "bg-primary text-primary-foreground hover:bg-primary-deep", className)}>
      {children}
    </Link>
  );
}

export function OutlineLink({
  to,
  children,
  className,
}: {
  to:
    | "/menu"
    | "/quote"
    | "/order"
    | "/about"
    | "/gallery"
    | "/contact";
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={cn(base, "border border-foreground/20 text-foreground hover:border-primary hover:text-primary", className)}
    >
      {children}
    </Link>
  );
}

export function WhatsAppLink({ message, children }: { message: string; children: ReactNode }) {
  return (
    <a
      href={waLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(base, "bg-whatsapp text-whatsapp-foreground")}
    >
      {children}
    </a>
  );
}

export const defaultWaMessage = `Hi ${site.name}! I'd like to know more.`;
