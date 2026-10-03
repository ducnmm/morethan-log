import React from "react"
import PostHeader from "./PostHeader"
import Footer from "./PostFooter"
import CommentBox from "./CommentBox"
import Category from "src/components/Category"
import styled from "@emotion/styled"
import NotionRenderer from "../components/NotionRenderer"
import usePostQuery from "src/hooks/usePostQuery"

type Props = {}

const PostDetail: React.FC<Props> = () => {
  const data = usePostQuery()

  if (!data) return null

  const category = (data.category && data.category?.[0]) || undefined
  const isAbout = data.slug === "about"

  return (
    <StyledWrapper data-about={isAbout}>
      <article>
        {!isAbout && category && (
          <div css={{ marginBottom: "0.5rem" }}>
            <Category readOnly={data.status?.[0] === "PublicOnDetail"}>
              {category}
            </Category>
          </div>
        )}
        {data.type[0] === "Post" && <PostHeader data={data} compact={isAbout} />}
        <div className="notion-body">
          <NotionRenderer recordMap={data.recordMap} />
        </div>
        {data.type[0] === "Post" && !isAbout && (
          <>
            <Footer />
            <CommentBox data={data} />
          </>
        )}
      </article>
    </StyledWrapper>
  )
}

export default PostDetail

const StyledWrapper = styled.div`
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  padding-top: 3rem;
  padding-bottom: 3rem;
  border-radius: 1.5rem;
  max-width: 56rem;
  background-color: ${({ theme }) =>
    theme.scheme === "light" ? "white" : theme.colors.gray4};
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  margin: 0 auto;
  > article {
    margin: 0 auto;
    max-width: 42rem;
  }

  /* About-only: wider card + column/callout polish. Other posts keep default. */
  &[data-about="true"] {
    max-width: 100%;
    padding-left: 1.25rem;
    padding-right: 1.25rem;
    @media (min-width: 900px) {
      padding-left: 2.5rem;
      padding-right: 2.5rem;
    }
    > article {
      max-width: none;
      width: 100%;
    }
    .notion-body {
      font-size: 1.05rem;
      line-height: 1.75;
      .notion-page {
        width: 100% !important;
      }
      .notion-h2 {
        margin-top: 2.75rem;
        margin-bottom: 1rem;
        font-size: 1.35rem;
        letter-spacing: 0.02em;
      }
      .notion-h3 {
        margin-top: 1.75rem;
        margin-bottom: 0.5rem;
        font-size: 1.15rem;
      }
      .notion-list {
        margin-top: 0.35rem;
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
      .notion-toggle {
        margin: 0.4rem 0;
      }
      @media (max-width: 720px) {
        .notion-column {
          flex: 1 1 100% !important;
          min-width: 100% !important;
        }
      }
    }
  }

  @media (max-width: 768px) {
    padding-left: 1rem;
    padding-right: 1rem;
  }
`
