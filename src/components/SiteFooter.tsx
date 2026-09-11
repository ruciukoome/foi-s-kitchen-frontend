import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import { site, waLink } from "@/lib/site";
import logo from "@/assets/logo.png";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-foreground text-background">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <img src={logo} alt={`${site.name} logo`} className="h-9 w-auto shrink-0" />
            <p className="font-display text-xl font-bold">{site.name}</p>
          </div>
          <p className="mt-3 max-w-xs text-sm opacity-80">{site.tagline}</p>
        </div>

        <nav className="text-sm" aria-label="Footer">
          <p className="label-caps mb-3 text-primary">Explore</p>
          <ul className="space-y-2 opacity-90">
            <li><Link to="/" className="hover:text-primary">Home</Link></li>
            <li><Link to="/about" className="hover:text-primary">About</Link></li>
            <li><Link to="/menu" className="hover:text-primary">Menu</Link></li>
            <li><Link to="/gallery" className="hover:text-primary">Gallery &amp; Reviews</Link></li>
            <li><Link to="/contact" className="hover:text-primary">Contact</Link></li>
          </ul>
        </nav>

        <nav className="text-sm" aria-label="Services">
          <p className="label-caps mb-3 text-primary">Services</p>
          <ul className="space-y-2 opacity-90">
            <li><Link to="/services" search={{ category: "corporate" }} className="hover:text-primary">Corporate Catering</Link></li>
            <li><Link to="/services" search={{ category: "weddings" }} className="hover:text-primary">Weddings &amp; Private Events</Link></li>
            <li><Link to="/services" search={{ category: "meal-prep" }} className="hover:text-primary">Meal Prep Plans</Link></li>
            <li><Link to="/order" className="hover:text-primary">Order Online</Link></li>
            <li><Link to="/quote" className="hover:text-primary">Request a Quotation</Link></li>
          </ul>
        </nav>

        <div className="text-sm">
          <p className="label-caps mb-3 text-primary">Reach us</p>
          <ul className="space-y-3 opacity-90">
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <a href={`tel:${site.phoneTel}`} className="hover:text-primary">{site.phoneDisplay}</a>
            </li>
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <a href={`mailto:${site.email}`} className="hover:text-primary">{site.email}</a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span>{site.address}</span>
            </li>
          </ul>
          <a
            href={waLink(`Hi ${site.name}! I have a question.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="label-caps mt-5 inline-flex min-h-[44px] items-center rounded-full bg-whatsapp px-5 text-whatsapp-foreground transition-transform duration-200 ease-out hover:scale-[1.02] active:scale-[0.97]"
          >
            WhatsApp us
          </a>
        </div>
      </div>

      <div className="border-t border-background/15">
        <p className="container-page py-5 text-xs opacity-70">
          © {new Date().getFullYear()} {site.name}. Nairobi, Kenya.
        </p>
      </div>
    </footer>
  );
}
