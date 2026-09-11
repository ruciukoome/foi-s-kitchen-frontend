import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Menu, ShoppingBag, User, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { initials, useAuth, useProfile } from "@/lib/auth";
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
          <img
            src={logo}
            alt={`${site.name} logo`}
            className="h-9 w-auto shrink-0"
          />
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
          {mobileOpen ? <Menu className="hidden" /> : null}
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
            <MobileLink to="/quote" label="Request a Quotation" />
            <MobileAccountLinks />
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

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          "flex min-h-[44px] items-center gap-1 font-display text-sm font-semibold transition-all duration-200 ease-out",
          variant === "button"
            ? "rounded-full bg-primary px-5 text-primary-foreground uppercase tracking-[0.5px] hover:bg-primary-deep hover:scale-[1.02] active:scale-[0.97]"
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
        <div className="animate-fade-up absolute top-full left-0 w-64 rounded-xl border border-border bg-card p-2 text-card-foreground shadow-lift">
          {links.map((l) => (
            <Link
              key={l.to}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              to={l.to as any}
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

function useSignOut() {
  const navigate = useNavigate();
  return async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };
}

function AccountMenu() {
  const { user, loading } = useAuth();
  const { profile } = useProfile(user?.id);
  const [open, setOpen] = useState(false);
  const signOut = useSignOut();

  if (loading) return <span className="h-11 w-11" aria-hidden="true" />;

  if (!user) {
    return (
      <Link
        to="/sign-in"
        aria-label="Sign in"
        className="grid h-11 w-11 place-items-center rounded-full transition-colors duration-200 ease-out hover:text-primary"
      >
        <User className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
      </Link>
    );
  }

  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Account menu"
        className="grid h-11 w-11 place-items-center rounded-full border border-border font-display text-sm font-semibold transition-colors duration-200 ease-out hover:border-primary hover:text-primary"
      >
        {initials(profile?.full_name, user.email)}
      </button>

      {open && (
        <div className="animate-fade-up absolute top-full right-0 w-52 rounded-xl border border-border bg-card p-2 text-card-foreground shadow-lift">
          <Link to="/account" className="block rounded-lg px-3 py-3 text-sm transition-colors hover:bg-secondary hover:text-primary">
            My Account
          </Link>
          <Link to="/account/orders" className="block rounded-lg px-3 py-3 text-sm transition-colors hover:bg-secondary hover:text-primary">
            My Orders
          </Link>
          {profile?.is_admin && (
            <Link to="/admin/orders" className="block rounded-lg px-3 py-3 text-sm transition-colors hover:bg-secondary hover:text-primary">
              All Orders
            </Link>
          )}
          <button
            type="button"
            onClick={signOut}
            className="block w-full rounded-lg px-3 py-3 text-left text-sm transition-colors hover:bg-secondary hover:text-primary"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

function MobileAccountLinks() {
  const { user, loading } = useAuth();
  const { profile } = useProfile(user?.id);
  const signOut = useSignOut();

  if (loading) return null;

  if (!user) {
    return (
      <>
        <span className="my-2 h-px bg-gold" aria-hidden="true" />
        <MobileLink to="/sign-in" label="Sign in" />
      </>
    );
  }

  return (
    <>
      <span className="my-2 h-px bg-gold" aria-hidden="true" />
      <MobileLink to="/account" label="My Account" />
      <MobileLink to="/account/orders" label="My Orders" />
      {profile?.is_admin && <MobileLink to="/admin/orders" label="All Orders" />}
      <button
        type="button"
        onClick={signOut}
        className="flex min-h-[48px] items-center font-display text-base font-semibold transition-colors duration-200 ease-out hover:text-primary"
      >
        Sign Out
      </button>
    </>
  );
}
