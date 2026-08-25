# Piner F0 staging security baseline

This branch is staging-only and does not authorize a merge to `main` or any production deployment.

Baseline intent (2026-08-26):
- keep the Piner F0 consumer on the Next.js 15.5 Maintenance LTS line;
- move off the vulnerable/outdated `next@15.5.6` / `react@19.1.1` baseline before any longer-lived browser staging ingress;
- retain the closed `pino-web-piner-staging` perimeter unless an explicit staging browser-test gate opens it;
- re-audit the announced Next.js August 26 security release once it is actually published; this file does not assume that future patch is available.

Production authorization: false.
