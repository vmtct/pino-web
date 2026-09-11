#!/usr/bin/env bash
set -euo pipefail
repo="${GITHUB_REPOSITORY:-vmtct/pino-web}"
[ "$repo" = "vmtct/pino-web" ] || { echo "Unexpected repository: $repo" >&2; exit 1; }
runs="$(gh api --paginate --slurp "/repos/${repo}/actions/workflows/production-release.yml/runs?event=issues&status=completed&per_page=100")"
while IFS=$'\t' read -r run_id conclusion display; do
  [ -n "$run_id" ] || continue
  [ "$conclusion" != "success" ] || continue
  issue="$(sed -nE 's/^Web production release #([1-9][0-9]*) @ [0-9a-f]{40}$/\1/p' <<<"$display")"
  [ -n "$issue" ] || continue
  comments="$(gh api --paginate --slurp "/repos/${repo}/issues/${issue}/comments?per_page=100")"
  marker="$(jq -c --arg run "$run_id" '[.[][] | select(.user.login=="github-actions[bot]" and ((.body // "")|startswith("PINO_WEB_PRODUCTION_RELEASE: **RECOVERY_ARMED**")) and ((.body // "")|contains("Workflow run: " + $run)))] | last // empty' <<<"$comments")"
  [ -n "$marker" ] || continue
  resolved="$(jq -r --arg run "$run_id" '[.[][] | select(.user.login=="github-actions[bot]") | (.body // "") | select(contains("Workflow run: " + $run)) | select(startswith("WEB_PRODUCTION_RELEASE: **WATCHDOG_RECOVERED**") or startswith("WEB_PRODUCTION_RELEASE: **WATCHDOG_RECOVERY_CONFIRMED**") or (startswith("WEB_PRODUCTION_RELEASE: **FAIL_SAFE**") and (contains("version was restored") or contains("baseline remained active"))))] | length' <<<"$comments")"
  [ "$resolved" -gt 0 ] || { echo "Unresolved Web release recovery blocks production mutation: run ${run_id} issue #${issue}" >&2; exit 1; }
done < <(jq -r '.[]?.workflow_runs[]? | select((.display_title // "") | startswith("Web production release #")) | [.id, (.conclusion // ""), (.display_title // "")] | @tsv' <<<"$runs")
