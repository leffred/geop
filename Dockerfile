# Étape 1 : Dépendances
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

# Étape 2 : Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# On définit des variables vides pour le build, GCR les injectera au runtime
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Étape 3 : Runner
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Création d'un utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copie des fichiers nécessaires du mode standalone
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8080
CMD ["node", "server.js"]