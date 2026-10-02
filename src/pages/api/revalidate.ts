import { NextApiRequest, NextApiResponse } from "next"
import { getPosts } from "../../apis"
import { filterPosts } from "src/libs/utils/notion"

// for all path revalidate, https://<your-site.com>/api/revalidate?secret=<token>
// for specific path revalidate, https://<your-site.com>/api/revalidate?secret=<token>&path=<path>
// example, https://<your-site.com>/api/revalidate?secret=YOUR_KEY&path=/about
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { secret, path } = req.query
  if (secret !== process.env.TOKEN_FOR_REVALIDATE) {
    return res.status(401).json({ message: "Invalid token" })
  }

  try {
    if (path && typeof path === "string") {
      await res.revalidate(path.startsWith("/") ? path : `/${path}`)
    } else {
      const posts = await getPosts()
      const detailPosts = filterPosts(posts, {
        acceptStatus: ["Public", "PublicOnDetail"],
        acceptType: ["Paper", "Post", "Page"],
      })
      // Sequential revalidation avoids Notion 429 storms (each path may refetch recordMap).
      await res.revalidate("/")
      for (const row of detailPosts) {
        if (!row.slug) continue
        await res.revalidate(`/${row.slug}`)
      }
    }

    res.json({ revalidated: true })
  } catch (err) {
    console.error("[revalidate]", err)
    return res.status(500).send("Error revalidating")
  }
}
