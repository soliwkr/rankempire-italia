#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
# Solo ramo di anteprima: NON usare main o production.
# Richiede Wrangler autenticato al corretto account Cloudflare.
npx wrangler pages deploy site \
  --project-name=ristrutturazioni-formia \
  --branch=rf-editorial-v02
