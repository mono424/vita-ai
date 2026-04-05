FROM node:22-slim AS build

WORKDIR /app

COPY package.json ./
RUN npm install

COPY tsconfig.json ./
COPY src/ src/

RUN npx tsc

FROM node:22-slim

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY --from=build /app/dist/ dist/

EXPOSE 8767

CMD ["node", "dist/index.js"]
