#!/usr/bin/env bash
set -euo pipefail
issue="${1:?Core release issue}"; run_id="${2:?Core release run}"
token="${CORE_RELEASE_GH_TOKEN:?PINO_CORE_RELEASE_READ_TOKEN unavailable}"
repo=vmtct/pino-core
run="$(GH_TOKEN="$token" gh api "/repos/${repo}/actions/runs/${run_id}")"
sha="$(jq -r '.head_sha // empty' <<<"$run")"
[[ "$sha" =~ ^[0-9a-f]{40}$ ]] || { echo "Core release run lacks exact source SHA" >&2; exit 1; }
jq -e --arg sha "$sha" --arg issue "$issue" '.repository.full_name=="vmtct/pino-core" and .head_sha==$sha and .event=="issues" and .run_attempt==1 and .status=="completed" and .conclusion=="success" and .actor.login=="vmtct" and .triggering_actor.login=="vmtct" and .path==".github/workflows/core-production-release.yml" and .display_title==("Core production release #"+$issue+" @ "+$sha)' <<<"$run" >/dev/null
issue_json="$(GH_TOKEN="$token" gh api "/repos/${repo}/issues/${issue}")"
jq -e '.state=="open" and .user.login=="vmtct" and .title=="[GPT] Core production release"' <<<"$issue_json" >/dev/null
comments="$(GH_TOKEN="$token" gh api --paginate --slurp "/repos/${repo}/issues/${issue}/comments?per_page=100")"
terminal="$(jq -c --arg run "$run_id" '[.[][] | select(.user.login=="github-actions[bot]" and ((.body // "")|startswith("CORE_PRODUCTION_RELEASE: **PASS**")) and ((.body // "")|contains("Workflow run: " + $run)))] | sort_by(.created_at) | last // empty' <<<"$comments")"
[ -n "$terminal" ] || { echo "Core release run lacks exact terminal PASS receipt" >&2; exit 1; }
body="$(jq -r '.body | gsub("\\\\n"; "\n")' <<<"$terminal")"
source="$(sed -nE 's/^- Core source:[[:space:]]*([0-9a-f]{40})[[:space:]]*$/\1/p' <<<"$body")"
version="$(sed -nE 's/^- Worker version:[[:space:]]*([0-9a-f-]{36})[[:space:]]*$/\1/p' <<<"$body")"
deployment="$(sed -nE 's/^- Deployment ID:[[:space:]]*([0-9a-f-]{36})[[:space:]]*$/\1/p' <<<"$body")"
auth_hash="$(sed -nE 's/^- Authorization body hash:[[:space:]]*([0-9a-f]{64})[[:space:]]*$/\1/p' <<<"$body")"
[ "$source" = "$sha" ] && [ -n "$version" ] && [ -n "$deployment" ] && [[ "$auth_hash" =~ ^[0-9a-f]{64}$ ]] || { echo "Core release PASS receipt is incomplete" >&2; exit 1; }
live_body="$(jq -r '.body // ""' <<<"$issue_json")"
[ "$(printf '%s' "$live_body" | sha256sum | cut -d' ' -f1)" = "$auth_hash" ] || { echo "Core release authorization body changed after PASS" >&2; exit 1; }
runs="$(GH_TOKEN="$token" gh api --paginate --slurp "/repos/${repo}/actions/workflows/core-production-release.yml/runs?event=issues&per_page=100")"
latest="$(jq -r --arg sha "$sha" '[.[]?.workflow_runs[]? | select(.head_sha==$sha and .event=="issues" and .actor.login=="vmtct" and .conclusion!="skipped" and ((.display_title // "")|startswith("Core production release #")) and ((.display_title // "")|endswith(" @ "+$sha)))] | sort_by(.updated_at // .run_started_at // .created_at // "") | last | .id // empty' <<<"$runs")"
[ "$latest" = "$run_id" ] || { echo "Selected Core release is superseded by a newer same-SHA canonical attempt" >&2; exit 1; }
jq -nc --arg sha "$sha" --arg version "$version" --arg deployment "$deployment" --arg issue "$issue" --arg run "$run_id" '{sha:$sha,version:$version,deployment:$deployment,issue:$issue,run:$run}'
