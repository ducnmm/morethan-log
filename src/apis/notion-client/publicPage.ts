import { NotionAPI } from "notion-client"
import { ExtendedRecordMap } from "notion-types"
import { idToUuid, parsePageId } from "notion-utils"

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

function mergeRecordMap(target: any, incoming: any) {
  if (!incoming) return
  for (const table of [
    "block",
    "collection",
    "collection_view",
    "notion_user",
  ]) {
    if (!incoming[table]) continue
    target[table] = { ...(target[table] || {}), ...incoming[table] }
  }
}

/**
 * notion-client's getPageRaw only loads the first chunk (empty cursor).
 * Long pages (About) need follow-up loadPageChunk calls with the returned cursor.
 */
async function loadAllPageChunks(api: NotionAPI, pageId: string) {
  const id = parsePageId(pageId)
  if (!id) throw new Error(`invalid notion pageId "${pageId}"`)

  let cursor: any = { stack: [] }
  let chunkNumber = 0
  const recordMap: any = {
    block: {},
    collection: {},
    collection_view: {},
    notion_user: {},
    collection_query: {},
    signed_urls: {},
  }

  for (let i = 0; i < 10; i++) {
    const res = await (api as any).fetch({
      endpoint: "loadPageChunk",
      body: {
        pageId: id,
        limit: 100,
        chunkNumber,
        cursor,
        verticalColumns: false,
      },
      gotOptions,
    })
    mergeRecordMap(recordMap, res?.recordMap)
    const stack = res?.cursor?.stack
    if (!stack || !stack.length) break
    cursor = res.cursor
    chunkNumber += 1
  }

  return recordMap as ExtendedRecordMap
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
    try {
      const res = await (api as any).getBlocks(missing.slice(0, 50), gotOptions)
      for (const [cid, entry] of Object.entries(res?.recordMap?.block || {})) {
        recordMap.block[cid] = unwrapEntry(entry) as any
      }
    } catch (err) {
      console.warn("[notion] getBlocks failed", err)
      break
    }
    const still = content.filter((cid) => !recordMap.block?.[cid]).length
    if (still === missing.length) break
  }
}

export async function getPublicPage(pageId: string) {
  const api = new NotionAPI()
  let recordMap = normalizeRecordMap(await loadAllPageChunks(api, pageId))
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
