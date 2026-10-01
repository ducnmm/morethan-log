import { getPublicPage } from "./publicPage"

export const getRecordMap = async (pageId: string) => {
  return getPublicPage(pageId)
}
