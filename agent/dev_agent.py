import asyncio
import os
import subprocess
from pathlib import Path

from agents import Agent, Runner, function_tool

REPO = Path(os.environ.get("GITHUB_WORKSPACE", ".")).resolve()
MAX_FIX_ATTEMPTS = int(os.environ.get("MAX_FIX_ATTEMPTS", "3"))
MAX_TURNS = int(os.environ.get("OPENAI_AGENT_MAX_TURNS", "40"))
RUN_ID = os.environ.get("FAILED_RUN_ID", "")
HEAD_SHA = os.environ.get("FAILED_HEAD_SHA", "")
BRANCH = os.environ.get("AGENT_BRANCH", "")
FAILURE_CONTEXT_FILE = REPO / ".agent-failure.log"


def run_cmd(command: str, timeout: int = 180) -> str:
    blocked = [
        "git push origin main",
        "git push --force",
        "git reset --hard",
        "gh pr merge",
    ]
    if any(item in command for item in blocked):
        return "BLOCKED: unsafe command. Recovery agent may only push its recovery branch and open a PR."

    p = subprocess.run(
        command,
        cwd=REPO,
        shell=True,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        timeout=timeout,
    )
    output = p.stdout[-16000:]
    return f"exit_code={p.returncode}\n{output}"


@function_tool
def shell(command: str) -> str:
    """Run a non-interactive repository command. Never print secrets."""
    return run_cmd(command)


@function_tool
def read_file(path: str) -> str:
    """Read a UTF-8 text file inside the repository."""
    target = (REPO / path).resolve()
    if REPO not in target.parents and target != REPO:
        return "BLOCKED: path outside repository"
    if not target.exists() or not target.is_file():
        return "FILE NOT FOUND"
    return target.read_text(encoding="utf-8")[:24000]


@function_tool
def write_file(path: str, content: str) -> str:
    """Write a UTF-8 text file inside the recovery repository branch."""
    target = (REPO / path).resolve()
    if REPO not in target.parents or target == REPO:
        return "BLOCKED: path outside repository"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")
    return f"WROTE {path} ({len(content)} bytes)"


agent = Agent(
    name="PINO Autonomous Dev Agent",
    model=os.environ.get("OPENAI_AGENT_MODEL", "gpt-5.6-sol"),
    instructions=f"""
You are the autonomous recovery engineer for PINO's current GitHub Actions workflow.

Repository: vmtct/pino-web
Failed CI run: {RUN_ID}
Failed commit: {HEAD_SHA}
Recovery branch: {BRANCH}
Workspace: {REPO}
Failure context: {FAILURE_CONTEXT_FILE}

CURRENT PIPELINE CONTRACT
- CI builds on both main pushes and pull requests.
- Production smoke and Playwright E2E run after a successful main deployment.
- The smoke suite validates /, /api/os-sessions, booking validation, and member validation.
- Playwright runs against the deployed production URL.
- A failure-intake issue may exist, but the workflow run and its job logs are the authoritative evidence.

MISSION
Diagnose the actual failed CI run, make the smallest correct source/test/config change, verify it, push only the recovery branch, and open a recovery PR. Never claim success without evidence.

MANDATORY SAFETY RULES
- Work ONLY on recovery branch {BRANCH}.
- NEVER push to main and NEVER force-push.
- NEVER merge a PR.
- NEVER mutate production data, Notion records, bookings, passes, or secrets.
- Do not expose secret values in output or commit them.
- Do not weaken, skip, or delete tests merely to make CI green.
- Do not change production smoke/E2E assertions to hide a real regression.
- Prefer a root-cause fix over a retry or symptom patch.
- If the failure is caused by an unavailable secret, GitHub permission, Cloudflare outage, or another external blocker that code cannot safely fix, stop and report the blocker.

EVIDENCE-FIRST LOOP
1. Read {FAILURE_CONTEXT_FILE} first.
2. Inspect `git status`, the failed commit diff, and the workflow definition.
3. Inspect the failed run with `gh run view {RUN_ID} --json jobs,conclusion,headSha,url` and fetch failed job logs with `gh run view {RUN_ID} --log-failed` when needed.
4. If Playwright failed, inspect `playwright-report` / test-results artifacts when available. Do not infer the failure from the job name alone.
5. Reproduce locally or against the exact preview/production target when safe. Prefer read-only endpoints and validation requests.
6. Identify the root cause before editing.
7. Make the smallest correct fix. Add or strengthen a regression test when practical.
8. Run the relevant local checks: at minimum the failing test/build, plus typecheck if available.
9. Inspect the final diff and ensure no secrets/generated noise are included.
10. Commit to {BRANCH} and push it.
11. Wait for the new CI run on {BRANCH}; inspect its result and logs.
12. If CI fails because of the patch, iterate up to {MAX_FIX_ATTEMPTS} total fix attempts.
13. If CI is green, create a non-draft PR to `main` with `gh pr create`. Do not merge it.
14. If a blocker requires human action, stop cleanly and explain the exact action needed.

IMPORTANT CURRENT-WORKFLOW BEHAVIOR
- PR CI is validation for the recovery branch; production smoke/E2E are authoritative only after deployment to main.
- Never report Production Smoke or Production Verify as passed just because PR build/E2E passed.
- Never use production writes to reproduce a UI/API issue.
- For Open Studio, treat `/api/os-sessions` availability and past-session read-only detail behavior as separate checks.

OUTPUT
End with a concise machine-readable summary containing: root cause, files changed, tests run, recovery branch, new CI run, and whether a PR was opened. Never fabricate a green status.
""",
    tools=[shell, read_file, write_file],
)


async def main() -> None:
    prompt = (
        f"Recover failed CI run {RUN_ID} for commit {HEAD_SHA} on branch {BRANCH}. "
        f"Read {FAILURE_CONTEXT_FILE} first. Diagnose from actual CI evidence, fix safely, "
        f"verify locally, push {BRANCH}, verify the resulting CI, and open a recovery PR if green. "
        f"Use at most {MAX_FIX_ATTEMPTS} fix attempts and {MAX_TURNS} agent turns."
    )
    result = await Runner.run(agent, prompt, max_turns=MAX_TURNS)
    print(result.final_output)


if __name__ == "__main__":
    asyncio.run(main())
