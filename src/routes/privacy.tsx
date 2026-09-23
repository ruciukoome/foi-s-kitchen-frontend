import { createFileRoute } from "@tanstack/react-router";

import { PageHero } from "@/components/PageHero";
import { SectionReveal } from "@/components/SectionReveal";
import { DataRequestForm } from "@/components/DataRequestForm";
import { site } from "@/lib/site";
import { breadcrumbSchema, jsonLd, pageSeo } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    ...pageSeo({
      title: "Privacy Policy | Foi's Kitchen Nairobi",
      description:
        "How Foi's Kitchen collects, uses and protects your details when you order, request a quote or join our list — and how to see or delete your data.",
      path: "/privacy",
    }),
    scripts: [
      jsonLd(
        breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Privacy Policy", path: "/privacy" },
        ]),
      ),
    ],
  }),
  component: PrivacyPage,
});

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <SectionReveal className="flex flex-col gap-3">
      <h2 className="font-display text-xl font-bold md:text-2xl">{title}</h2>
      <div className="flex flex-col gap-3 text-[15px] text-muted-foreground md:text-base">
        {children}
      </div>
    </SectionReveal>
  );
}

function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Privacy"
        title="Your details, handled like we'd want ours handled."
        intro="Plain language, no small print. Here's exactly what we collect, why, who sees it, and how to have it removed."
      />

      <section className="section-y">
        <div className="container-page flex max-w-3xl flex-col gap-10">
          <Block title="What we collect">
            <ul className="list-disc space-y-1 pl-5">
              <li>Your name, phone number and email address.</li>
              <li>Delivery or event address, and any notes you give us about the order.</li>
              <li>Your order and quotation history.</li>
              <li>
                Payment confirmation details — the M-Pesa confirmation message or reference. We
                never see or store your PIN or card numbers.
              </li>
              <li>Whether you've agreed to receive our specials and menu updates.</li>
              <li>An unfinished cart, if you added food and didn't check out.</li>
            </ul>
          </Block>

          <Block title="Where it comes from">
            <p>
              Only from you: creating an account, the quotation form, the contact form, the
              newsletter box in the footer, and the food you add to your cart while browsing. We
              don't buy lists or scrape details from anywhere else.
            </p>
          </Block>

          <Block title="Why we collect it, and on what basis">
            <p>
              <strong className="text-foreground">To cook and deliver.</strong> Your name, phone,
              address and order details are needed to fulfil the order or quotation you asked for.
              Without them we simply can't get food to you.
            </p>
            <p>
              <strong className="text-foreground">With your consent.</strong> Marketing emails and
              messages, and any follow-up about an unfinished cart, only happen if you've ticked the
              box. You can untick it at any time and we stop.
            </p>
            <p>
              <strong className="text-foreground">Because we have to.</strong> We keep basic sales
              records for tax and accounting.
            </p>
          </Block>

          <Block title="Who we share it with">
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Our website and database provider, which stores your account and orders securely on
                our behalf and may not use the data for anything else.
              </li>
              <li>Safaricom (M-Pesa), when you pay — so the payment can be confirmed.</li>
              <li>
                WhatsApp, when you place an order or message us there — your message and phone
                number pass through their service.
              </li>
              <li>Our delivery rider, who gets only the name, phone and address for your drop-off.</li>
            </ul>
            <p className="text-foreground">
              We never sell your data, and we never pass it to advertisers.
            </p>
          </Block>

          <Block title="How long we keep it">
            <ul className="list-disc space-y-1 pl-5">
              <li>Order and quotation records: 7 years, as required for tax records.</li>
              <li>Your account details: until you ask us to delete the account.</li>
              <li>Unfinished carts: 90 days, then removed.</li>
              <li>Newsletter details: until you unsubscribe.</li>
            </ul>
          </Block>

          <Block title="Cookies and tracking">
            <p>
              We use a small number of essential cookies and browser storage so your cart survives a
              page refresh and so you stay signed in. Those are required for the site to work.
            </p>
            <p>
              We currently run no analytics, no advertising pixels and no third-party trackers. If
              that ever changes, the cookie notice will ask first and nothing optional will load
              unless you accept. You can change your mind by clearing your browser storage for this
              site.
            </p>
          </Block>

          <Block title="Your rights">
            <p>You can ask us at any time to:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Send you a copy of the data we hold about you.</li>
              <li>Correct anything that's wrong.</li>
              <li>Delete your account and personal data (except records we must keep for tax).</li>
              <li>Stop sending you marketing — no reason needed.</li>
            </ul>
            <p>
              Email{" "}
              <a href={`mailto:${site.email}`} className="font-semibold text-primary hover:underline">
                {site.email}
              </a>{" "}
              or call{" "}
              <a href={`tel:${site.phoneTel}`} className="font-semibold text-primary hover:underline">
                {site.phoneDisplay}
              </a>
              . We reply within 7 days and complete requests within 30 days. If you're signed in,
              you can also edit your name, phone, address and marketing preference yourself from My
              Account.
            </p>
          </Block>

          <SectionReveal className="rounded-3xl border border-gold/40 bg-card p-6 shadow-card md:p-8">
            <h2 className="font-display text-xl font-bold md:text-2xl">Request your data</h2>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Fill this in and we'll open your email or WhatsApp with the request ready to send.
            </p>
            <div className="mt-6">
              <DataRequestForm />
            </div>
          </SectionReveal>

          <Block title="Who to contact">
            <p>
              {site.name}, {site.address}. Email {site.email}, phone {site.phoneDisplay}. If you're
              not happy with how we've handled a request, you can complain to the Office of the Data
              Protection Commissioner, Kenya.
            </p>
          </Block>
        </div>
      </section>
    </>
  );
}
