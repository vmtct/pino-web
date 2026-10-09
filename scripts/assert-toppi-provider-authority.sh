#!/usr/bin/env bash
set -euo pipefail
sha="${1:?Toppi SHA required}"
run_id="${2:?Toppi deploy run ID required}"
attempt="${3:?Toppi deploy run attempt required}"
repo="vmtct/toppi"
token="${TOPPI_RELEASE_GH_TOKEN:-}"
[[ "$sha" =~ ^[0-9a-f]{40}$ ]] || { echo "Invalid Toppi SHA" >&2; exit 1; }
[[ "$run_id" =~ ^[1-9][0-9]*$ ]] || { echo "Invalid Toppi run ID" >&2; exit 1; }
[[ "$attempt" =~ ^[1-9][0-9]*$ ]] || { echo "Invalid Toppi run attempt" >&2; exit 1; }
[ -n "$token" ] || { echo "PINO_TOPPI_RELEASE_READ_TOKEN unavailable" >&2; exit 1; }
api() { GH_TOKEN="$token" gh api "$@"; }
main_sha="$(api "/repos/${repo}/git/ref/heads/main" --jq '.object.sha')"
[ "$main_sha" = "$sha" ] || { echo "Toppi source is not exact current main" >&2; exit 1; }
run="$(api "/repos/${repo}/actions/runs/${run_id}")"
jq -e --arg sha "$sha" --argjson attempt "$attempt" '.head_sha==$sha and .head_branch=="main" and .event=="push" and .status=="completed" and .conclusion=="success" and .run_attempt==$attempt and .path==".github/workflows/deploy.yml"' <<<"$run" >/dev/null
jobs="$(api "/repos/${repo}/actions/runs/${run_id}/jobs?per_page=100")"
jq -e '[.jobs[] | select(.name=="deploy" and .conclusion=="success") | .steps[]? | select(.name=="Deploy toppi-web" and .conclusion=="success")] | length==1' <<<"$jobs" >/dev/null
jq -e '[.jobs[] | select(.name=="deploy" and .conclusion=="success") | .steps[]? | select(.name=="Production smoke test" and .conclusion=="success")] | length==1' <<<"$jobs" >/dev/null
serving="$(curl -fsS --retry 3 --retry-delay 2 --retry-all-errors https://toppi.pinohouse.art/build-info.json)"
jq -e --arg sha "$sha" '.commit==$sha' <<<"$serving" >/dev/null
jq -nc --arg sha "$sha" --arg run "$run_id" --arg attempt "$attempt" '{sha:$sha,deploy_run_id:$run,deploy_run_attempt:$attempt}'
