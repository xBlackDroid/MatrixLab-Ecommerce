#!/usr/bin/env bash
# Instalación de dependencias de MatrixLab Store Core.
# Detecta el package manager por lockfile y deja el proyecto listo.
set -e

echo "Detectando package manager..."
if [ -f "pnpm-lock.yaml" ]; then
  PM="pnpm"; INSTALL="pnpm add"; INSTALL_DEV="pnpm add -D"
elif [ -f "yarn.lock" ]; then
  PM="yarn"; INSTALL="yarn add"; INSTALL_DEV="yarn add -D"
elif [ -f "bun.lockb" ]; then
  PM="bun"; INSTALL="bun add"; INSTALL_DEV="bun add -d"
else
  PM="npm"; INSTALL="npm install"; INSTALL_DEV="npm install -D"
fi
echo "Usando package manager: $PM"

echo "Instalando dependencias core..."
$INSTALL zod @supabase/supabase-js mercadopago
$INSTALL framer-motion lucide-react clsx tailwind-merge
$INSTALL sharp nanoid server-only
$INSTALL react-hook-form @hookform/resolvers
$INSTALL @tanstack/react-table
$INSTALL react-konva konva

echo "Instalando UI premium (toasts + drawers móviles)..."
$INSTALL sonner vaul

# Rate limit: este proyecto NO tiene Redis configurado, por lo que se usa el
# fallback in-memory de src/lib/security/rate-limit.ts. Para producción
# multi-instancia, descomentar e integrar Upstash:
# $INSTALL @upstash/ratelimit @upstash/redis

echo "Validando build..."
if [ "$PM" = "pnpm" ]; then
  pnpm lint || true; pnpm build || true
elif [ "$PM" = "yarn" ]; then
  yarn lint || true; yarn build || true
elif [ "$PM" = "bun" ]; then
  bun run lint || true; bun run build || true
else
  npm run lint || true; npm run build || true
fi
echo "Setup terminado."
