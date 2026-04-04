FROM node:22-slim AS build

WORKDIR /app

COPY packages/agent-service/package.json ./
RUN npm install

COPY packages/agent-service/tsconfig.json ./
COPY packages/agent-service/src/ src/

RUN npx tsc

FROM node:22-slim

WORKDIR /app

COPY packages/agent-service/package.json ./
RUN npm install --omit=dev

COPY --from=build /app/dist/ dist/

EXPOSE 8767

CMD ["node", "dist/index.js"]
