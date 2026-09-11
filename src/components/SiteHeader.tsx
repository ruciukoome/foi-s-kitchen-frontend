import { useEffect, useId, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Menu, ShoppingBag, User, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { initials, useAuth } from "@/lib/auth";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

const mainLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
] as const;

const orderLinks = [
  { to: "/order", label: "Order Online" },
  { to: "/quote", label: "Request a Quotation" },
] as const;

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { count, bump } = useCart();
  const { user, profile, signOut } = useAuth();
  const [bumping, setBumping] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (bump === 0) return;
    setBumping(true);
    const t = window.setTimeout(() => setBumping(false), 320);
    return () => window.clearTimeout(t);
  }, [bump]);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card text-foreground">
      <div className="container-page grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3 lg:flex lg:justify-between">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <img src={logo} alt={`${site.name} logo`} className="h-9 w-auto shrink-0" />
          <span className="truncate font-display text-lg font-bold">{site.name}</span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Main">
          {mainLinks.map((l) => (
            <NavItem key={l.to} to={l.to} label={l.label} />
          ))}

          <NavItem to="/services" label="Services" />
          <NavItem to="/menu" label="Menu" />

          <Dropdown label="Order Now" links={orderLinks} variant="button" />

          <NavItem to="/gallery" label="Gallery & Reviews" />
          <NavItem to="/contact" label="Contact" />

          <Link
            to="/order"
            aria-label={`Your order (${count} items)`}
            className={cn(
              "relative grid h-11 w-11 place-items-center rounded-full transition-transform duration-200 ease-out hover:bg-background/10",
              bumping && "scale-110",
            )}
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            {count > 0 && (
              <span className="absolute top-1 right-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>

          <AccountMenu />
        </nav>

        {/* Mobile trigger */}
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors duration-200 ease-out hover:bg-background/10 lg:hidden"
        >
          {mobileOpen ? (
            <X className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Menu className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="animate-fade-up border-t border-border bg-card text-foreground lg:hidden">
          <nav className="container-page flex flex-col py-3" aria-label="Mobile">
            <MobileLink to="/" label="Home" />
            <MobileLink to="/about" label="About" />
            <MobileLink to="/services" label="Services" />
            <MobileLink to="/menu" label="Menu" />
            <MobileLink to="/gallery" label="Gallery & Reviews" />
            <MobileLink to="/contact" label="Contact" />
            <MobileLink to="/order" label="Order Online" />
            <MobileLink to="/quote" label="Request a Quotation" />

            <span className="my-2 h-px bg-gold/40" />

            {user ? (
              <>
                <MobileLink to="/account" label="My Account" />
                <MobileLink to="/account/orders" label="My Orders" />
                {profile?.is_admin && <MobileLink to="/admin/orders" label="Manage Orders" />}
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="flex min-h-[48px] items-center font-display text-base font-semibold text-left transition-colors duration-200 ease-out hover:text-primary"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <MobileLink to="/sign-in" label="Sign In" />
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to={to as any}
      activeProps={{ className: "text-primary" }}
      activeOptions={{ exact: to === "/" }}
      className="font-display text-sm font-semibold transition-colors duration-200 ease-out hover:text-primary"
    >
      {label}
    </Link>
  );
}

/**
 * Click/tap-only dropdown. No hover handlers — opens on click, closes on
 * outside pointer-down, Escape (focus returns to the trigger), or navigation.
 */
function Dropdown({
  label,
  links,
  variant = "text",
}: {
  label: string;
  links: readonly { to: string; label: string }[];
  variant?: "text" | "button";
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={panelId}
        className={cn(
          "flex min-h-[44px] items-center gap-1 font-display text-sm font-semibold transition-all duration-200 ease-out",
          variant === "button"
            ? "rounded-full bg-primary px-5 tracking-[0.5px] text-primary-foreground uppercase hover:scale-[1.02] hover:bg-primary-deep active:scale-[0.97]"
            : "hover:text-primary",
        )}
      >
        {label}
        <ChevronDown
          className={cn("h-4 w-4 transition-transform duration-200 ease-out", open && "rotate-180")}
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          id={panelId}
          role="menu"
          className="animate-fade-up absolute top-full left-0 w-64 rounded-xl border border-border bg-card p-2 text-card-foreground shadow-lift"
        >
          {links.map((l) => (
            <Link
              key={l.to}
              role="menuitem"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              to={l.to as any}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-3 text-sm transition-colors duration-200 ease-out hover:bg-secondary hover:text-primary"
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MobileLink({
  to,
  label,
  indent = false,
}: {
  to: string;
  label: string;
  indent?: boolean;
}) {
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to={to as any}
      activeProps={{ className: "text-primary" }}
      activeOptions={{ exact: to === "/" }}
      className={cn(
        "flex min-h-[48px] items-center font-display text-base font-semibold transition-colors duration-200 ease-out hover:text-primary",
        indent && "pl-4 text-sm font-normal opacity-90",
      )}
    >
      {label}
    </Link>
  );
}

/** Account icon: links to sign-in when signed out, click-only menu when signed in. */
function AccountMenu() {
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!user) {
    return (
      <Link
        to="/sign-in"
        aria-label="Sign in"
        className="grid h-11 w-11 place-items-center rounded-full transition-colors duration-200 ease-out hover:bg-background/10 hover:text-primary"
      >
        <User className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
      </Link>
    );
  }

  const label = initials(profile?.full_name ?? user.email);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={panelId}
        aria-label="Account menu"
        className="grid h-11 w-11 place-items-center rounded-full border border-gold/50 font-display text-sm font-semibold transition-colors duration-200 ease-out hover:border-primary hover:text-primary"
      >
        {label}
      </button>

      {open && (
        <div
          id={panelId}
          role="menu"
          className="animate-fade-up absolute top-full right-0 w-56 rounded-xl border border-border bg-card p-2 text-card-foreground shadow-lift"
        >
          <Link
            role="menuitem"
            to="/account"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-3 text-sm transition-colors duration-200 ease-out hover:bg-secondary hover:text-primary"
          >
            My Account
          </Link>
          <Link
            role="menuitem"
            to="/account/orders"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-3 text-sm transition-colors duration-200 ease-out hover:bg-secondary hover:text-primary"
          >
            My Orders
          </Link>
          {profile?.is_admin && (
            <Link
              role="menuitem"
              to="/admin/orders"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-3 text-sm transition-colors duration-200 ease-out hover:bg-secondary hover:text-primary"
            >
              Manage Orders
            </Link>
          )}
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
            className="block w-full rounded-lg px-3 py-3 text-left text-sm transition-colors duration-200 ease-out hover:bg-secondary hover:text-primary"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
