FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json yarn.lock ./
RUN corepack enable && corepack prepare yarn@1.22.22 --activate \
  && yarn install --frozen-lockfile

COPY . .

ARG NOTION_PAGE_ID
ENV NOTION_PAGE_ID=${NOTION_PAGE_ID}
ENV NEXT_TELEMETRY_DISABLED=1

RUN yarn build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "yarn start --hostname 0.0.0.0 --port ${PORT:-3000}"]
