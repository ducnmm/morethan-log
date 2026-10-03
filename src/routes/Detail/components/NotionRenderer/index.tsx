import dynamic from "next/dynamic"
import Image from "next/image"
import Link from "next/link"
import { ExtendedRecordMap } from "notion-types"
import useScheme from "src/hooks/useScheme"

// core styles shared by all of react-notion-x (required)
import "react-notion-x/src/styles.css"

// used for code syntax highlighting (optional)
import "prismjs/themes/prism-tomorrow.css"

// used for rendering equations (optional)

import "katex/dist/katex.min.css"
import { FC } from "react"
import styled from "@emotion/styled"
import { customMapImageUrl } from "src/libs/utils/notion/customMapImageUrl"

const _NotionRenderer = dynamic(
  () => import("react-notion-x").then((m) => m.NotionRenderer),
  { ssr: false }
)

const Code = dynamic(() =>
  import("react-notion-x/build/third-party/code").then(async (m) => m.Code)
)

const Collection = dynamic(() =>
  import("react-notion-x/build/third-party/collection").then(
    (m) => m.Collection
  )
)
const Equation = dynamic(() =>
  import("react-notion-x/build/third-party/equation").then((m) => m.Equation)
)
const Pdf = dynamic(
  () => import("react-notion-x/build/third-party/pdf").then((m) => m.Pdf),
  {
    ssr: false,
  }
)
const Modal = dynamic(
  () => import("react-notion-x/build/third-party/modal").then((m) => m.Modal),
  {
    ssr: false,
  }
)

const mapPageUrl = (id: string) => {
  return "https://www.notion.so/" + id.replace(/-/g, "")
}

const mapImageUrl = (url: string, block: any) => {
  try {
    return customMapImageUrl(url, block)
  } catch {
    return url
  }
}

type Props = {
  recordMap: ExtendedRecordMap
}

const NotionRenderer: FC<Props> = ({ recordMap }) => {
  const [scheme] = useScheme()
  return (
    <StyledWrapper>
      <_NotionRenderer
        darkMode={scheme === "dark"}
        recordMap={recordMap}
        components={{
          Code,
          Collection,
          Equation,
          Modal,
          Pdf,
          nextImage: Image,
          nextLink: Link,
        }}
        mapPageUrl={mapPageUrl}
        mapImageUrl={mapImageUrl}
      />
    </StyledWrapper>
  )
}

export default NotionRenderer

const StyledWrapper = styled.div`
  .notion-collection-page-properties {
    display: none !important;
  }
  .notion-page {
    padding: 0;
    width: 100% !important;
  }
  .notion-list {
    width: 100%;
  }
  .notion-text {
    padding: 0.25rem 0;
  }
  .notion-h-title {
    width: 100%;
  }
  .notion-callout {
    margin: 0.85rem 0;
    border-radius: 0.75rem;
  }
  .notion-quote {
    margin: 1.25rem 0;
    font-size: 1.05rem;
    border-left-width: 3px;
  }
  .notion-column-list {
    display: flex !important;
    flex-direction: row !important;
    flex-wrap: wrap !important;
    align-items: stretch;
    gap: 0.85rem;
    margin: 1rem 0;
    width: 100% !important;
  }
  .notion-column {
    /* Override Notion inline percentage widths that collapse in this layout */
    width: auto !important;
    flex: 1 1 260px !important;
    min-width: min(100%, 260px) !important;
    max-width: 100% !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }
  .notion-column .notion-callout {
    height: 100%;
    word-break: normal;
    overflow-wrap: anywhere;
  }
  @media (max-width: 720px) {
    .notion-column {
      flex: 1 1 100% !important;
      min-width: 100% !important;
    }
  }
  .notion-hr {
    margin: 1.75rem 0;
  }
  .notion-bookmark {
    margin: 0.75rem 0;
    border-radius: 0.75rem;
    overflow: hidden;
  }
  .notion-simple-table {
    width: 100%;
    margin: 0.75rem 0;
  }
  .notion-code {
    border-radius: 0.35rem;
  }
  .notion-toggle {
    margin: 0.4rem 0;
  }
`
