# Base stage - shared base image for all stages
# Security: Uses built-in node user (UID 1000) from node:alpine
FROM node:24-alpine@sha256:77f3c4d1f33c17dfa4af4b0add57d86957187873e313c2c37f52831d117645c8 AS base

# Switch to built-in node user (superfluous but satisfies scanners that don't recognize inherited users)
USER node

FROM base AS builder

# Switch to root for package and dependency installation
USER root

WORKDIR /app

# Install dependencies needed for node-gyp and build
RUN apk update && apk add --no-cache python3 make g++ git

# Install turbo globally
RUN npm install -g turbo@^2

# Switch to built-in node user
USER node

# Copy entire monorepo
# NOFLUID Turbo prune requires full monorepo context; .dockerignore excludes sensitive files
COPY --chown=node:node . .

# Generate a partial monorepo with a pruned lockfile for a target workspace.
RUN turbo prune whitelabel-web-app --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer

# Switch to root for package installation
USER root

# Install dependencies needed for native modules
RUN apk update && apk add --no-cache libc6-compat

# Enable pnpm
RUN corepack enable

WORKDIR /app

# Switch to built-in node user
USER node

# First install the dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
RUN pnpm install --frozen-lockfile

# Build the project
COPY --from=builder /app/out/full/ .
# These required files get stripped off.
COPY --from=builder /app/packages/tsconfig /app/packages/tsconfig

RUN pnpm turbo run build

FROM base AS whitelabel-web-app
WORKDIR /app

# Copy the built Next.js application
COPY --from=installer --chown=node:node /app/apps/whitelabel-web-app/.next/standalone ./
COPY --from=installer --chown=node:node /app/apps/whitelabel-web-app/.next/static ./apps/whitelabel-web-app/.next/static
COPY --from=installer --chown=node:node /app/apps/whitelabel-web-app/public ./apps/whitelabel-web-app/public

# Switch to built-in node user
USER node

# Set NODE_ENV for production
ENV NODE_ENV production

CMD ["node", "apps/whitelabel-web-app/server.js"]