import { createFileRoute } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { PageHero } from "@/components/PageHero";
import { SectionReveal } from "@/components/SectionReveal";
import { ContactForm } from "@/components/ContactForm";
import { WhatsAppLink } from "@/components/CtaButtons";
import { site } from "@/lib/site";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Foi's Kitchen — Nairobi" },
      {
        name: "description",
        content:
          "Call, email or WhatsApp Foi's Kitchen in Nairobi. Business hours, location and a direct contact form.",
      },
      { property: "og:title", content: "Contact Foi's Kitchen — Nairobi" },
      {
        property: "og:description",
        content: "Reach the kitchen directly — phone, email, WhatsApp or the contact form.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Talk to the kitchen directly."
        intro="No call centre, no ticket number. Message us and someone who cooks your food replies."
      >
        <WhatsAppLink message={`Hi ${site.name}! I have a question.`}>WhatsApp us</WhatsAppLink>
      </PageHero>

      <section className="section-y">
        <div className="container-page grid gap-10 md:grid-cols-2">
          <SectionReveal className="flex flex-col gap-6">
            <ul className="flex flex-col gap-4">
              <li className="flex items-start gap-3">
                <Phone className="mt-1 h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
                <span>
                  <span className="label-caps block text-xs text-muted-foreground">Phone</span>
                  <a href={`tel:${site.phoneTel}`} className="hover:text-primary">{site.phoneDisplay}</a>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-1 h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
                <span>
                  <span className="label-caps block text-xs text-muted-foreground">Email</span>
                  <a href={`mailto:${site.email}`} className="hover:text-primary">{site.email}</a>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
                <span>
                  <span className="label-caps block text-xs text-muted-foreground">Kitchen</span>
                  {site.address}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="mt-1 h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} aria-hidden="true" />
                <span>
                  <span className="label-caps block text-xs text-muted-foreground">Hours</span>
                  {site.hours.map((h) => (
                    <span key={h.day} className="block text-sm">
                      {h.day} · {h.time}
                    </span>
                  ))}
                </span>
              </li>
            </ul>

            <iframe
              title="Foi's Kitchen location"
              src={site.mapEmbed}
              loading="lazy"
              className="h-64 w-full rounded-2xl border border-border"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </SectionReveal>

          <SectionReveal delay={80} className="rounded-2xl bg-card p-6 shadow-card md:p-8">
            <h2 className="font-display text-xl font-semibold">Send us a message</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              It goes straight to our WhatsApp so nothing gets lost.
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </SectionReveal>
        </div>
      </section>
    </>
  );
}
