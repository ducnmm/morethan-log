import { NotionAPI } from "notion-client"
import { ExtendedRecordMap } from "notion-types"
import { idToUuid } from "notion-utils"

const gotOptions = {
  headers: {
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  },
}

/** Notion now often returns { spaceId, value: block } or { role, value }. */
function unwrapEntry(entry: any) {
  if (!entry) return entry
  if (entry.value?.value && (entry.value.role || entry.value.value?.type)) {
    return { role: entry.value.role || "reader", value: entry.value.value }
  }
  if (entry.spaceId && entry.value?.type) {
    return { role: "reader", value: entry.value }
  }
  if (entry.value?.type && !entry.role) {
    return { role: "reader", value: entry.value }
  }
  return entry
}

export function normalizeRecordMap(recordMap: ExtendedRecordMap) {
  for (const table of [
    "block",
    "collection",
    "collection_view",
    "notion_user",
  ] as const) {
    const bucket = (recordMap as any)[table]
    if (!bucket) continue
    for (const id of Object.keys(bucket)) {
      bucket[id] = unwrapEntry(bucket[id])
    }
  }
  return recordMap
}

async function fetchMissingContentBlocks(
  api: NotionAPI,
  recordMap: ExtendedRecordMap,
  pageId: string
) {
  const id = idToUuid(pageId)
  const page = (recordMap.block?.[id] as any)?.value
  const content: string[] = page?.content || []
  if (!content.length) return

  let missing = content.filter((cid) => !recordMap.block?.[cid])
  while (missing.length) {
    const batch = missing.slice(0, 50)
    const res = await (api as any).getBlocks(batch, gotOptions)
    const incoming = res?.recordMap?.block || {}
    for (const [cid, entry] of Object.entries(incoming)) {
      recordMap.block[cid] = unwrapEntry(entry) as any
    }
    const still = content.filter((cid) => !recordMap.block?.[cid])
    if (still.length === missing.length) break
    missing = still
  }
}

export async function getPublicPage(pageId: string) {
  const api = new NotionAPI()
  // Prefer raw + manual missing-block fetch: getPage can drop page.content
  // under Notion's newer { spaceId, value } block envelope.
  const raw = await (api as any).getPageRaw(pageId, {
    gotOptions,
    chunkLimit: 100,
  })
  let recordMap = normalizeRecordMap(raw.recordMap as ExtendedRecordMap)
  recordMap.collection = recordMap.collection ?? ({} as any)
  recordMap.collection_view = recordMap.collection_view ?? ({} as any)
  recordMap.notion_user = recordMap.notion_user ?? ({} as any)
  recordMap.collection_query = recordMap.collection_query ?? ({} as any)
  recordMap.signed_urls = recordMap.signed_urls ?? ({} as any)

  await fetchMissingContentBlocks(api, recordMap, pageId)

  // Also pull nested missing blocks one more pass (bullets under toggles, etc.)
  const id = idToUuid(pageId)
  const blockEntry = recordMap.block?.[id]?.value as any
  const blockValue = blockEntry?.value ?? blockEntry
  const collectionId =
    blockValue?.collection_id || blockValue?.format?.collection_pointer?.id
  const viewId = blockValue?.view_ids?.[0]

  if (collectionId && viewId) {
    const viewEntry = (recordMap.collection_view as any)?.[viewId]?.value
    const viewValue = viewEntry?.value ?? viewEntry
    const data = await (api as any).getCollectionData(
      collectionId,
      viewId,
      viewValue,
      { gotOptions }
    )
    recordMap.block = {
      ...recordMap.block,
      ...Object.fromEntries(
        Object.entries(data.recordMap?.block || {}).map(([k, v]) => [
          k,
          unwrapEntry(v),
        ])
      ),
    }
    recordMap.collection = {
      ...recordMap.collection,
      ...(data.recordMap?.collection || {}),
    }
    recordMap.collection_view = {
      ...recordMap.collection_view,
      ...(data.recordMap?.collection_view || {}),
    }
    recordMap.collection_query = recordMap.collection_query || ({} as any)
    recordMap.collection_query[collectionId] = {
      ...(recordMap.collection_query[collectionId] || {}),
      [viewId]: data.result?.reducerResults,
    }
  }

  return normalizeRecordMap(recordMap)
}
