import { useQuery, useQueryClient } from "@tanstack/react-query"
import { deleteCookie, getCookie, setCookie } from "cookies-next"
import { useEffect } from "react"
import { CONFIG } from "site.config"
import { queryKey } from "src/constants/queryKey"
import { SchemeType } from "src/types"

type SetScheme = (scheme: SchemeType) => void

const getSystemScheme = (): SchemeType =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"

const useScheme = (): [SchemeType, SetScheme] => {
  const queryClient = useQueryClient()
  const followsSystemTheme = CONFIG.blog.scheme === "system"

  const { data } = useQuery({
    queryKey: queryKey.scheme(),
    enabled: false,
    initialData: followsSystemTheme
      ? "dark"
      : (CONFIG.blog.scheme as SchemeType),
  })

  const setScheme = (scheme: SchemeType) => {
    setCookie("scheme", scheme)

    queryClient.setQueryData(queryKey.scheme(), scheme)
  }

  useEffect(() => {
    if (!window) return

    if (followsSystemTheme) {
      // Drop any leftover manual override so OS preference wins.
      deleteCookie("scheme")
      const media = window.matchMedia("(prefers-color-scheme: dark)")
      const applySystemScheme = () => {
        queryClient.setQueryData(queryKey.scheme(), getSystemScheme())
      }
      applySystemScheme()
      media.addEventListener("change", applySystemScheme)
      return () => media.removeEventListener("change", applySystemScheme)
    }

    const cachedScheme = getCookie("scheme") as SchemeType
    setScheme(cachedScheme || data)
  }, [])

  return [data, setScheme]
}

export default useScheme
