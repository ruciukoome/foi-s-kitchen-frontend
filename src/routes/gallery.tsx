import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHero } from "@/components/PageHero";
import { SectionReveal } from "@/components/SectionReveal";
import { CategoryTabs } from "@/components/CategoryTabs";
import { GalleryGrid } from "@/components/GalleryGrid";
import { TestimonialCard } from "@/components/TestimonialCard";
import { PrimaryLink } from "@/components/CtaButtons";
import { galleryFilters, galleryItems, type GalleryFilter } from "@/data/gallery";
import { testimonials } from "@/data/testimonials";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery & Reviews — Foi's Kitchen Nairobi" },
      {
        name: "description",
        content:
          "Photos from weddings, corporate lunches and our kitchen, plus reviews from Nairobi clients of Foi's Kitchen.",
      },
      { property: "og:title", content: "Gallery & Reviews — Foi's Kitchen" },
      {
        property: "og:description",
        content: "See the food and events, and read what clients say.",
      },
    ],
  }),
  component: GalleryPage,
});

function GalleryPage() {
  const [filter, setFilter] = useState<GalleryFilter>("All");

  const items = useMemo(
    () => (filter === "All" ? galleryItems : galleryItems.filter((g) => g.filter === filter)),
    [filter],
  );

  return (
    <>
      <PageHero
        eyebrow="Gallery & reviews"
        title="Plates we're proud of, and people who came back."
        intro="Real events, real food, real reviews. [PLACEHOLDER] Photography to be replaced with your own."
      >
        <PrimaryLink to="/quote">Request a quotation</PrimaryLink>
      </PageHero>

      <section className="section-y">
        <div className="container-page">
          <CategoryTabs options={galleryFilters} value={filter} onChange={setFilter} label="Gallery filters" />
          <div key={filter} className="mt-8">
            <GalleryGrid items={items} />
          </div>
        </div>
      </section>

      <section className="section-y bg-card">
        <div className="container-page">
          <SectionReveal>
            <p className="label-caps text-primary">Reviews</p>
            <h2 className="mt-2 font-display text-[1.75rem] font-semibold md:text-[2rem]">What clients say</h2>
          </SectionReveal>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {testimonials.map((t, i) => (
              <SectionReveal key={t.id} delay={i * 60}>
                <TestimonialCard testimonial={t} />
              </SectionReveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
