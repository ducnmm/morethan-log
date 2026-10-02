/** Display labels for Notion tags; filter/query still use the raw tag string. */
const TAG_LABELS: Record<string, string> = {
  sui: "Sui",
  postgres: "Postgres",
  rust: "Rust",
  typescript: "TypeScript",
  agents: "Agents",
  move: "Move",
  walrus: "Walrus",
  search: "Search",
  golang: "Golang",
  airflow: "Airflow",
  pinned: "Pinned",
  nextjs: "Next.js",
  graphql: "GraphQL",
  redis: "Redis",
  seal: "SEAL",
  memwal: "MemWal",
  rememe: "Rememe",
  nautilus: "Nautilus",
  tee: "TEE",
}

export function formatTagLabel(tag: string): string {
  const raw = (tag || "").trim()
  if (!raw) return raw
  const mapped = TAG_LABELS[raw.toLowerCase()]
  if (mapped) return mapped
  // Title Case words separated by space, hyphen, or underscore
  return raw
    .split(/([\s_-]+)/)
    .map((part) => {
      if (/^[\s_-]+$/.test(part)) return part
      return part.charAt(0).toUpperCase() + part.slice(1)
    })
    .join("")
}
