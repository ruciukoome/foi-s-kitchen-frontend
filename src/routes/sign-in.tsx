import { createFileRoute } from "@tanstack/react-router";

import { AuthPanel } from "@/components/AuthPanel";
import { PageHeadingRow } from "@/components/PageHeadingRow";

export const Route = createFileRoute("/sign-in")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign In — Foi's Kitchen Nairobi" },
      {
        name: "description",
        content:
          "Sign in to your Foi's Kitchen account to save your delivery details and track your orders.",
      },
      { property: "og:title", content: "Sign In — Foi's Kitchen" },
      { property: "og:description", content: "Save your details and track your orders." },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  return (
    <section className="container-page max-w-md pb-16 md:pb-24">
      <PageHeadingRow title="Sign in" note="Save your details and track your orders." />
      <AuthPanel mode="sign-in" />
    </section>
  );
}
