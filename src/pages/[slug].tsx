import Detail from "src/routes/Detail"
import { filterPosts } from "src/libs/utils/notion"
import { CONFIG } from "site.config"
import { NextPageWithLayout } from "../types"
import CustomError from "src/routes/Error"
import { getRecordMap, getPosts } from "src/apis"
import MetaConfig from "src/components/MetaConfig"
import { GetStaticProps } from "next"
import { queryClient } from "src/libs/react-query"
import { queryKey } from "src/constants/queryKey"
import { dehydrate } from "@tanstack/react-query"
import usePostQuery from "src/hooks/usePostQuery"
import { FilterPostsOptions } from "src/libs/utils/notion/filterPosts"

const filter: FilterPostsOptions = {
  acceptStatus: ["Public", "PublicOnDetail"],
  acceptType: ["Paper", "Post", "Page"],
}

export const getStaticPaths = async () => {
  try {
    const posts = await getPosts()
    const filteredPost = filterPosts(posts, filter)

    return {
      paths: filteredPost.map((row) => `/${row.slug}`),
      fallback: "blocking",
    }
  } catch (err) {
    console.error("[getStaticPaths] Notion fetch failed; building with no pre-rendered slugs", err)
    return {
      paths: [],
      fallback: "blocking",
    }
  }
}

export const getStaticProps: GetStaticProps = async (context) => {
  const slug = context.params?.slug

  try {
    const posts = await getPosts()
    const feedPosts = filterPosts(posts)
    await queryClient.prefetchQuery(queryKey.posts(), () => feedPosts)

    const detailPosts = filterPosts(posts, filter)
    const postDetail = detailPosts.find((t: any) => t.slug === slug)

    if (!postDetail?.id) {
      return {
        notFound: true,
        revalidate: CONFIG.revalidateTime,
      }
    }

    let recordMap: Awaited<ReturnType<typeof getRecordMap>>
    try {
      recordMap = await getRecordMap(postDetail.id)
    } catch (err) {
      console.error(
        `[getStaticProps] Notion getPage failed for slug=${slug} id=${postDetail.id}; skipping`,
        err
      )
      return {
        notFound: true,
        revalidate: CONFIG.revalidateTime,
      }
    }

    await queryClient.prefetchQuery(queryKey.post(`${slug}`), () => ({
      ...postDetail,
      recordMap,
    }))

    return {
      props: {
        dehydratedState: dehydrate(queryClient),
      },
      revalidate: CONFIG.revalidateTime,
    }
  } catch (err) {
    console.error(`[getStaticProps] Notion error for slug=${slug}; skipping`, err)
    return {
      notFound: true,
      revalidate: CONFIG.revalidateTime,
    }
  }
}

const DetailPage: NextPageWithLayout = () => {
  const post = usePostQuery()

  if (!post) return <CustomError />

  const image =
    post.thumbnail ??
    CONFIG.ogImageGenerateURL ??
    `${CONFIG.ogImageGenerateURL}/${encodeURIComponent(post.title)}.png`

  const date = post.date?.start_date || post.createdTime || ""

  const meta = {
    title: post.title,
    date: new Date(date).toISOString(),
    image: image,
    description: post.summary || "",
    type: post.type[0],
    url: `${CONFIG.link}/${post.slug}`,
  }

  return (
    <>
      <MetaConfig {...meta} />
      <Detail />
    </>
  )
}

DetailPage.getLayout = (page) => {
  return <>{page}</>
}

export default DetailPage
