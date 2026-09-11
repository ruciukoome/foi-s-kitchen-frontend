/** Compact Lora-italic page heading row used across the site. */
export function PageHeadingRow({ title, note }: { title: string; note: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-1 gap-y-1 px-0.5 pt-[26px] pb-[14px]">
      <h1 className="font-serif-eyebrow">{title}</h1>
      <span className="font-serif-eyebrow-sub text-primary" aria-hidden="true">
        〜
      </span>
      <p className="font-serif-eyebrow-sub">{note}</p>
    </div>
  );
}
