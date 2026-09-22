import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHero } from "@/components/PageHero";
import { SectionReveal } from "@/components/SectionReveal";
import { CategoryTabs } from "@/components/CategoryTabs";
import { GalleryGrid } from "@/components/GalleryGrid";
import { TestimonialCard } from "@/components/TestimonialCard";
import { PrimaryLink } from "@/components/CtaButtons";
import { SkeletonGrid } from "@/components/CmsState";
import { ReviewSubmitForm } from "@/components/ReviewSubmitForm";
import { galleryFilters, galleryItemsQuery, testimonialsQuery, type GalleryFilter } from "@/lib/cms";
import { breadcrumbSchema, jsonLd, pageSeo, reviewSchema } from "@/lib/seo";


export const Route = createFileRoute("/gallery")({
  loader: async ({ context }) => {
    try {
      const reviews = await context.queryClient.ensureQueryData(testimonialsQuery);
      return { reviews: reviews.map((r) => ({ name: r.name, quote: r.quote, rating: r.rating, role: r.role })) };
    } catch {
      return { reviews: [] };
    }
  },
  head: ({ loaderData }) => {
    const seo = pageSeo({
      title: "Gallery & Reviews | Foi's Kitchen Nairobi",
      description:
        "Photos from Nairobi weddings, corporate lunches and our kitchen, plus reviews from clients of Foi's Kitchen.",
      path: "/gallery",
      image: "gallery",
    });
    const reviews = reviewSchema(loaderData?.reviews ?? []);
    return {
      ...seo,
      scripts: [
        ...(reviews ? [jsonLd(reviews)] : []),
        jsonLd(
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Gallery & Reviews", path: "/gallery" },
          ]),
        ),
      ],
    };
  },
  component: GalleryPage,
});

function GalleryPage() {
  const [filter, setFilter] = useState<GalleryFilter>("All");
  const gallery = useQuery(galleryItemsQuery);
  const reviews = useQuery(testimonialsQuery);

  const items = useMemo(
    () =>
      filter === "All"
        ? (gallery.data ?? [])
        : (gallery.data ?? []).filter((g) => g.category === filter),
    [gallery.data, filter],
  );

  return (
    <>
      <PageHero
        eyebrow="Gallery & reviews"
        title="Plates we're proud of, and people who came back."
        intro="Real events, real food, real reviews."
      >
        <PrimaryLink to="/quote">Request a quotation</PrimaryLink>
      </PageHero>

      <section className="section-y">
        <div className="container-page">
          <CategoryTabs options={galleryFilters} value={filter} onChange={setFilter} label="Gallery filters" />
          <div key={filter} className="mt-8">
            {gallery.isLoading ? <SkeletonGrid count={6} /> : <GalleryGrid items={items} />}
          </div>
        </div>
      </section>

      <section className="section-y bg-card">
        <div className="container-page">
          <SectionReveal>
            <p className="label-caps text-primary">Reviews</p>
            <h2 className="mt-2 font-display text-[1.75rem] font-semibold md:text-[2rem]">What clients say</h2>
          </SectionReveal>

          <div className="mt-6">
            <ReviewSubmitForm />
          </div>


          <div className="mt-8">
            {reviews.isLoading ? (
              <SkeletonGrid count={4} className="lg:grid-cols-4" />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {reviews.data?.map((t, i) => (
                  <SectionReveal key={t.id} delay={i * 60}>
                    <TestimonialCard testimonial={t} />
                  </SectionReveal>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
