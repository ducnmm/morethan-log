import { Block } from "notion-types"

/**
 * Map Notion image URLs for next/image.
 *
 * Durable public https URLs (Unsplash, OG images, etc.) are returned as-is.
 * Wrapping them through www.notion.so/image causes a 302 to
 * img.notionusercontent.com that next/image's optimizer rejects
 * ("upstream response is invalid" → 403).
 *
 * Notion-hosted attachments still go through the Notion image proxy.
 */
export const customMapImageUrl = (
  url: string,
  block: Block
): string | null => {
  if (!url) {
    return null
  }

  if (url.startsWith("data:")) {
    return url
  }

  // more recent versions of notion don't proxy unsplash images
  if (url.startsWith("https://images.unsplash.com")) {
    return url
  }

  try {
    const u = new URL(url)

    // Prefer durable public URLs over the Notion image proxy.
    // Notion S3 / notionusercontent hosts still need proxying or signed URLs.
    const host = u.hostname
    const isNotionHost =
      host === "www.notion.so" ||
      host === "notion.so" ||
      host.endsWith(".notion.so") ||
      host.endsWith(".amazonaws.com") ||
      host.endsWith(".notionusercontent.com") ||
      host === "secure.notion-static.com"

    if (
      (u.protocol === "https:" || u.protocol === "http:") &&
      !isNotionHost
    ) {
      return url
    }

    if (
      u.pathname.startsWith("/secure.notion-static.com") &&
      u.hostname.endsWith(".amazonaws.com")
    ) {
      if (
        u.searchParams.has("X-Amz-Credential") &&
        u.searchParams.has("X-Amz-Signature") &&
        u.searchParams.has("X-Amz-Algorithm")
      ) {
        // if the URL is already signed, then use it as-is
        url = u.origin + u.pathname
      }
    }
  } catch {
    // ignore invalid urls
  }

  if (url.startsWith("/images")) {
    url = `https://www.notion.so${url}`
  }

  url = `https://www.notion.so${
    url.startsWith("/image") ? url : `/image/${encodeURIComponent(url)}`
  }`

  const notionImageUrlV2 = new URL(url)
  let table = block.parent_table === "space" ? "block" : block.parent_table
  if (table === "collection" || table === "team") {
    table = "block"
  }
  notionImageUrlV2.searchParams.set("table", table)
  notionImageUrlV2.searchParams.set("id", block.id)
  notionImageUrlV2.searchParams.set("cache", "v2")

  url = notionImageUrlV2.toString()

  return url
}
