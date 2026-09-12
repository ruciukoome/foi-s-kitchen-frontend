import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { pageSectionsQuery, sectionContent, type BusinessInfo } from "@/lib/cms";
import { site } from "@/lib/site";

const defaults: BusinessInfo = {
  phoneDisplay: site.phoneDisplay,
  phoneTel: site.phoneTel,
  whatsapp: site.whatsapp,
  email: site.email,
  address: site.address,
  hours: site.hours,
  mapEmbed: site.mapEmbed,
};

const SiteInfoContext = createContext<BusinessInfo>(defaults);

/**
 * Loads the editable business details (phone, email, address, hours, map)
 * and keeps the shared `site` object in sync so every existing consumer —
 * including waLink() — uses the values Foi set in the admin CMS.
 */
export function SiteInfoProvider({ children }: { children: ReactNode }) {
  const { data } = useQuery({ ...pageSectionsQuery("global"), staleTime: 5 * 60 * 1000 });
  const [, setVersion] = useState(0);

  const info = useMemo<BusinessInfo>(
    () => ({ ...defaults, ...sectionContent<Partial<BusinessInfo>>(data, "business-info", {}) }),
    [data],
  );

  useEffect(() => {
    Object.assign(site, info);
    setVersion((v) => v + 1);
  }, [info]);

  return <SiteInfoContext.Provider value={info}>{children}</SiteInfoContext.Provider>;
}

/** Editable business details. */
export function useSite(): BusinessInfo {
  return useContext(SiteInfoContext);
}
