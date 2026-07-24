# syntax=docker/dockerfile:1

# Build stage
FROM oven/bun:latest AS build
WORKDIR /app

# Install dependencies
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build the app (adapter-node produces a self-contained server in build/)
COPY . .
ENV ADAPTER=node
RUN bun run build

# Runtime stage
FROM oven/bun:latest
WORKDIR /app
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

ENV ORIGIN=http://localhost:3000
ENV PORT=3000
EXPOSE 3000
CMD ["bun", "run", "./build/index.js"]