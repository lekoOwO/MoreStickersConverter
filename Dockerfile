FROM node:alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app
COPY package.json pnpm-lock.yaml tsconfig.json /app/

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
COPY src /app/src
RUN pnpm run build && ls -laR /app/build

FROM node:alpine
WORKDIR /app
COPY --from=build /app/build /app
COPY --from=prod-deps /app/node_modules /app/node_modules
CMD [ "node", "src/index.js" ]