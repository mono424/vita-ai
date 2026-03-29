# Build context: repo root
# docker build -f apps/app/Dockerfile -t vita-app .

FROM node:22-alpine AS build

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/app/package.json apps/app/

RUN pnpm install --frozen-lockfile

COPY apps/app/ apps/app/

RUN pnpm --filter @cv.khadim.io/app build

FROM nginx:alpine

COPY apps/app/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
