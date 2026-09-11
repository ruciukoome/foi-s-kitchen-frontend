import { createFileRoute } from "@tanstack/react-router";

import { AuthPanel } from "@/components/AuthPanel";
import { PageHeadingRow } from "@/components/PageHeadingRow";

export const Route = createFileRoute("/sign-up")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Create an Account — Foi's Kitchen Nairobi" },
      {
        name: "description",
        content:
          "Create a Foi's Kitchen account to save your name, phone and delivery address and follow your orders.",
      },
      { property: "og:title", content: "Create an Account — Foi's Kitchen" },
      { property: "og:description", content: "Faster checkout and order tracking." },
    ],
  }),
  component: SignUpPage,
});

function SignUpPage() {
  return (
    <section className="container-page max-w-md pb-16 md:pb-24">
      <PageHeadingRow title="Create account" note="Faster checkout, and every order in one place." />
      <AuthPanel mode="sign-up" />
    </section>
  );
}
