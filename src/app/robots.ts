import type { MetadataRoute } from "next";

/** Voluntary crawler controls; these do not restrict direct downloads. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/distribuidores/", "/preview/"] },
      { userAgent: ["GPTBot", "ClaudeBot", "CCBot", "Google-Extended", "Bytespider", "Meta-ExternalAgent"], disallow: "/" },
    ],
  };
}
