import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { pageSectionsQuery, sectionContent, type BusinessInfo } from "@/lib/cms";
import { site } from "@/lib/site";

const fallback: BusinessInfo = {
  phoneDisplay: site.phoneDisplay,
  phoneTel: site.phoneTel,
  whatsapp: site.whatsapp,
  email: site.email,
  address: site.address,
  hours: site.hours,
  mapEmbed: site.mapEmbed,
};

type SiteInfoValue = BusinessInfo & {
  name: string;
  tagline: string;
  waLink: (message: string) => string;
};

const SiteInfoContext = createContext<SiteInfoValue | null>(null);

export function SiteInfoProvider({ children }: { children: ReactNode }) {
  const { data } = useQuery({ ...pageSectionsQuery("global"), staleTime: 5 * 60 * 1000 });

  const value = useMemo<SiteInfoValue>(() => {
    const info = { ...fallback, ...sectionContent<Partial<BusinessInfo>>(data, "business-info", {}) };
    return {
      ...(info as BusinessInfo),
      name: site.name,
      tagline: site.tagline,
      waLink: (message: string) =>
        `https://wa.me/${info.whatsapp}?text=${encodeURIComponent(message)}`,
    };
  }, [data]);

  return <SiteInfoContext.Provider value={value}>{children}</SiteInfoContext.Provider>;
}

/** Business details (phone, email, address, hours, map) — editable in the admin CMS. */
export function useSite(): SiteInfoValue {
  return (
    useContext(SiteInfoContext) ?? {
      ...fallback,
      name: site.name,
      tagline: site.tagline,
      waLink: (message: string) =>
        `https://wa.me/${fallback.whatsapp}?text=${encodeURIComponent(message)}`,
    }
  );
}
