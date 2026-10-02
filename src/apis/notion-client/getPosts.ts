import { CONFIG } from "site.config"
import { idToUuid } from "notion-utils"

import getAllPageIds from "src/libs/utils/notion/getAllPageIds"
import getPageProperties from "src/libs/utils/notion/getPageProperties"
import { TPosts } from "src/types"
import { getPublicPage } from "./publicPage"

/**
 * @param {{ includePages: boolean }} - false: posts only / true: include pages
 */

// TODO: react query를 사용해서 처음 불러온 뒤로는 해당데이터만 사용하도록 수정
export const getPosts = async () => {
  try {
    let id = CONFIG.notionConfig.pageId as string
    const response = await getPublicPage(id)
    id = idToUuid(id)
    const collectionValue = Object.values(response.collection)[0]?.value as any
    const collection = collectionValue?.value ?? collectionValue
    const block = response.block
    const schema = collection?.schema

    const blockValue = (block[id].value as any)?.value ?? block[id].value
    const rawMetadata = blockValue

    // Check Type
    if (
      rawMetadata?.type !== "collection_view_page" &&
      rawMetadata?.type !== "collection_view"
    ) {
      return []
    } else {
      // Construct Data
      const pageIds = getAllPageIds(response)
      const data = []
      for (let i = 0; i < pageIds.length; i++) {
        const id = pageIds[i]
        const properties = (await getPageProperties(id, block, schema)) || null
        // Add fullwidth, createdtime to properties
        const pageBlockValue = (block[id].value as any)?.value ?? block[id].value
        properties.createdTime = new Date(
          pageBlockValue?.created_time
        ).toString()
        properties.fullWidth =
          (pageBlockValue?.format as any)?.page_full_width ?? false

        // Prefer explicit thumbnail file property; else page cover (Unsplash/OG URLs).
        if (!properties.thumbnail) {
          const cover = (pageBlockValue?.format as any)?.page_cover as
            | string
            | undefined
          if (cover) {
            properties.thumbnail = cover.startsWith("/")
              ? `https://www.notion.so${cover}`
              : cover
          }
        }

        data.push(properties)
      }

      // Sort by date
      data.sort((a: any, b: any) => {
        const dateA: any = new Date(a?.date?.start_date || a.createdTime)
        const dateB: any = new Date(b?.date?.start_date || b.createdTime)
        return dateB - dateA
      })

      const posts = data as TPosts
      return posts
    }
  } catch (err) {
    console.error("[getPosts] Notion fetch failed", err)
    return [] as TPosts
  }
}
