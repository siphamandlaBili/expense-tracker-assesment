# syntax=docker/dockerfile:1

# ---- Dependencies ---------------------------------------------------------
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# HUSKY=0: no git hooks inside the image.
RUN --mount=type=cache,target=/root/.npm HUSKY=0 npm ci

# ---- Test: lint, typecheck, unit tests (docker build --target test .) -----
FROM deps AS test
COPY . .
RUN npm run lint && npm run typecheck && npm run test:run

# ---- Build ----------------------------------------------------------------
FROM deps AS build
# The app calls the hosted API (src/api/config.ts). To use another one:
#   --build-arg VITE_API_BASE_URL=https://…/api
# and add its origin to connect-src in docker/security-headers.inc.
ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
COPY . .
RUN npm run build

# ---- Runtime: static files on nginx, as a non-root user -------------------
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/security-headers.inc /etc/nginx/conf.d/security-headers.inc
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO /dev/null http://127.0.0.1:8080/healthz || exit 1
