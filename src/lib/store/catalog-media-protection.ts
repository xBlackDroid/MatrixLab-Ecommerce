/** A browser-navigation deterrent, not authentication or private storage. */
export function isCatalogImageUrl(value: string): boolean {
  try {
    let url = new URL(value);
    if (url.pathname === "/_next/image") {
      const image = url.searchParams.get("url");
      if (!image) return false;
      const source = new URL(image, url.origin);
      if (source.origin !== url.origin) return false;
      url = source;
    }

    const pathname = decodeURIComponent(url.pathname).toLowerCase();
    return pathname.startsWith("/images/") &&
      !pathname.startsWith("/images/categories/") &&
      /\.(?:png|jpe?g|webp|avif|gif)$/.test(pathname);
  } catch {
    return false;
  }
}

export function isCatalogImageNavigation(url: string, headers: Headers): boolean {
  const destination = headers.get("sec-fetch-dest");
  const navigation = headers.get("sec-fetch-mode") === "navigate" ||
    destination === "document" || destination === "iframe" || destination === "frame";
  return navigation && isCatalogImageUrl(url);
}
