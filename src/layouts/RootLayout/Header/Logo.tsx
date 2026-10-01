import Link from "next/link"
import { CONFIG } from "site.config"
import styled from "@emotion/styled"

const Logo = () => {
  return (
    <StyledWrapper href="/" aria-label={CONFIG.blog.title}>
      {CONFIG.blog.title}
    </StyledWrapper>
  )
}

export default Logo

const StyledWrapper = styled(Link)`
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  white-space: nowrap;
  @media (max-width: 640px) {
    font-size: 0.8rem;
  }
`
