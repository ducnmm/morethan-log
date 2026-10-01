import { NotionAPI } from "notion-client"
import { ExtendedRecordMap } from "notion-types"
import { idToUuid } from "notion-utils"

const gotOptions = {
  headers: {
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  },
}

function unwrapEntry(entry: any) {
  if (entry?.value?.value && entry?.value?.role) {
    return { role: entry.value.role, value: entry.value.value }
  }
  return entry
}

export function normalizeRecordMap(recordMap: ExtendedRecordMap) {
  for (const table of ["block", "collection", "collection_view", "notion_user"] as const) {
    const bucket = (recordMap as any)[table]
    if (!bucket) continue
    for (const id of Object.keys(bucket)) {
      bucket[id] = unwrapEntry(bucket[id])
    }
  }
  return recordMap
}

export async function getPublicPage(pageId: string) {
  const api = new NotionAPI()
  const recordMap = await api.getPage(pageId, {
    gotOptions,
    fetchCollections: false,
  })
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
    recordMap.block = { ...recordMap.block, ...(data.recordMap?.block || {}) }
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
