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
# The API is mocked in the browser by default, so the image runs with no
# backend. To use a real API: --build-arg VITE_ENABLE_MOCKS=false
#                            --build-arg VITE_API_BASE_URL=https://…
ARG VITE_ENABLE_MOCKS=true
ARG VITE_API_BASE_URL=/api
ENV VITE_ENABLE_MOCKS=$VITE_ENABLE_MOCKS \
    VITE_API_BASE_URL=$VITE_API_BASE_URL
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
