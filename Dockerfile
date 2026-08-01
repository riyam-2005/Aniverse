# syntax=docker/dockerfile:1

# ---- deps -----------------------------------------------------------------
# Installs dependencies in their own layer so `docker build` skips this
# entirely on rebuilds where only application code changed, not package.json.
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder ----------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Same Postgres-flavored build the deploy docs already use for Vercel
# (npm run build:postgres) — generates prisma/schema.postgres.prisma from
# schema.prisma and builds against it, since a self-hosted Docker deploy
# needs a real Postgres, not the SQLite dev default. DATABASE_URL only
# needs to be *present* at build time (Next statically analyzes route
# types), not a live connection — the real one is supplied at container
# run time via docker-compose/your host's env config.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV NEXTAUTH_SECRET="build-time-placeholder-not-used-at-runtime-00000000"
ENV NEXTAUTH_URL="http://localhost:3000"
RUN npm run build:postgres

# ---- runner -----------------------------------------------------------------
# Distinct from builder: only next.config's traced standalone output gets
# copied in, so node_modules (deps + devDeps + the whole build toolchain)
# never end up in the final image.
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# The Postgres-flavored Prisma client (generated during the build:postgres
# step above) — standalone output's own dependency tracer doesn't reliably
# pick up Prisma's dynamically-loaded query engine binary, so it's copied
# explicitly rather than trusted to tracing.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma/schema.postgres.prisma ./prisma/schema.prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
