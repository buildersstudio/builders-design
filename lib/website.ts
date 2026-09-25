/** Website builder: a venture's full website, multi-page and multi-language, kept as dated versions. */

export type Lang = { code: string; label: string };

export type SiteVersion = {
  /** folder name under website/versions/, dated so it sorts: 2026-09-26-v2 */
  id: string;
  title: string;
  created: string;
  /** one or two sentences: what changed and why */
  note?: string;
  status?: "live" | "draft" | "archive";
  /** "imported" for a snapshot of a site the venture already had */
  source?: "built" | "imported";
};

/** website/site.json */
export type SiteFile = {
  name: string;
  domain?: string;
  languages: Lang[];
  defaultLang: string;
  /** the version shown by default */
  current: string;
  versions: SiteVersion[];
};

export type SitePage = {
  id: string;
  /** the public URL path in the default language, e.g. "/solutions/release-gate/" */
  path: string;
  title: string;
  description?: string;
  /** "page" for core pages, "cms" for pages that belong to a collection */
  type: "page" | "cms";
  collection?: string;
  parent?: string;
  /** shown in the main navigation */
  nav?: boolean;
  /** file per language, relative to the version folder, e.g. { "en": "en/solutions/release-gate/index.html" } */
  langs: Record<string, string>;
};

export type SiteCollection = { key: string; label: string; path?: string; description?: string };

/** website/versions/<id>/sitemap.json */
export type SiteMap = { pages: SitePage[]; collections?: SiteCollection[] };
