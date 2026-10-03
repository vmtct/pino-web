#!/usr/bin/env bash
set -euo pipefail
body=$'WEB_SHA: 032145690463b1b3d71b0ce24060523936758f2b\nCONFIRM: RELEASE_PRODUCTION\nCORE_RELEASE_ISSUE: 1526\nCORE_RELEASE_RUN_ID: 37136645496\n'
expected="$(printf '%s' "$body" | sha256sum | cut -d' ' -f1)"
json="$(jq -nc --arg body "$body" '{state:"open",user:{login:"vmtct"},title:"[GPT] Web production release",body:$body}')"
dir="$(mktemp -d)"; trap 'rm -rf "$dir"' EXIT
cat > "$dir/gh" <<GH
#!/usr/bin/env bash
printf '%s' '$json'
GH
chmod +x "$dir/gh"
PATH="$dir:$PATH" bash scripts/assert-live-issue-authority.sh vmtct/pino-web 126 '[GPT] Web production release' "$expected"
echo AUTHORITY_BODY_TRAILING_NEWLINE_REGRESSION_PASS
