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
  padding-left: 2rem;
  padding-right: 2rem;
  padding-top: 3rem;
  padding-bottom: 3rem;
  border-radius: 1.5rem;
  width: 100%;
  max-width: 100%;
  background-color: ${({ theme }) =>
    theme.scheme === "light" ? "white" : theme.colors.gray4};
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  margin: 0 auto;

  > article {
    margin: 0 auto;
    max-width: 72rem;
    width: 100%;
  }

  &[data-about="true"] {
    padding-left: 1.25rem;
    padding-right: 1.25rem;
    @media (min-width: 900px) {
      padding-left: 2.5rem;
      padding-right: 2.5rem;
    }
    > article {
      max-width: none;
    }
    .notion-body {
      font-size: 1.05rem;
      line-height: 1.75;
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
    }
  }

  @media (max-width: 768px) {
    padding-left: 1rem;
    padding-right: 1rem;
  }
`
