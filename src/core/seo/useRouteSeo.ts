import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SITE_URL, seoForPath } from "./siteSeo";

const setMeta = (selector: string, attribute: string, value: string): void => {
  const element = document.head.querySelector(selector);
  if (element) element.setAttribute(attribute, value);
};

/**
 * Keeps the document title, description and canonical/OG URL in sync with the route.
 * Crawlers that run JS pick these up; the static tags in index.html cover the rest.
 */
export function useRouteSeo(): void {
  const { pathname } = useLocation();

  useEffect(() => {
    const { title, description } = seoForPath(pathname);
    const url = `${SITE_URL}${pathname === "/" ? "" : pathname}`;

    document.title = title;
    setMeta('meta[name="description"]', "content", description);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[property="og:url"]', "content", url);
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[name="twitter:description"]', "content", description);
    setMeta('link[rel="canonical"]', "href", url);
  }, [pathname]);
}
