import { NotionAPI } from "notion-client"
import { ExtendedRecordMap } from "notion-types"
import { idToUuid } from "notion-utils"

const gotOptions = {
  headers: {
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  },
}

/** Peel Notion's {spaceId,value} / {role,value} envelopes until a real block. */
function unwrapEntry(entry: any) {
  if (!entry) return entry
  let cur: any = entry
  for (let i = 0; i < 5; i++) {
    if (cur?.type && cur?.id) {
      return { role: "reader", value: cur }
    }
    if (cur?.value?.type && cur?.value?.id) {
      return { role: cur.role || "reader", value: cur.value }
    }
    if (cur?.spaceId && cur?.value) {
      cur = cur.value
      continue
    }
    if (cur?.role && cur?.value) {
      cur = cur.value
      continue
    }
    if (cur?.value && typeof cur.value === "object") {
      cur = cur.value
      continue
    }
    break
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

async function mergeBlocks(
  api: NotionAPI,
  recordMap: ExtendedRecordMap,
  ids: string[]
) {
  if (!ids.length) return
  try {
    const res = await (api as any).getBlocks(ids, gotOptions)
    for (const [cid, entry] of Object.entries(res?.recordMap?.block || {})) {
      recordMap.block[cid] = unwrapEntry(entry) as any
    }
  } catch (err) {
    console.warn("[notion] getBlocks batch failed", ids.length, err)
    for (const cid of ids) {
      try {
        const res = await (api as any).getBlocks([cid], gotOptions)
        for (const [k, entry] of Object.entries(res?.recordMap?.block || {})) {
          recordMap.block[k] = unwrapEntry(entry) as any
        }
      } catch (e) {
        console.warn("[notion] getBlocks single failed", cid, e)
      }
    }
  }
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

  for (let round = 0; round < 4; round++) {
    const missing = content.filter((cid) => !recordMap.block?.[cid])
    if (!missing.length) return
    await mergeBlocks(api, recordMap, missing.slice(0, 50))
    const still = content.filter((cid) => !recordMap.block?.[cid]).length
    if (still === missing.length) break
  }
}

export async function getPublicPage(pageId: string) {
  const api = new NotionAPI()
  const raw = await (api as any).getPageRaw(pageId, {
    gotOptions,
    chunkLimit: 100,
  })
  const recordMap = normalizeRecordMap(raw.recordMap as ExtendedRecordMap)
  recordMap.collection = recordMap.collection ?? ({} as any)
  recordMap.collection_view = recordMap.collection_view ?? ({} as any)
  recordMap.notion_user = recordMap.notion_user ?? ({} as any)
  recordMap.collection_query = recordMap.collection_query ?? ({} as any)
  recordMap.signed_urls = recordMap.signed_urls ?? ({} as any)

  await fetchMissingContentBlocks(api, recordMap, pageId)

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
    for (const [k, v] of Object.entries(data.recordMap?.block || {})) {
      recordMap.block[k] = unwrapEntry(v) as any
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
