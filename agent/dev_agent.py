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


def run_cmd(command: str, timeout: int = 120) -> str:
    p = subprocess.run(
        command,
        cwd=REPO,
        shell=True,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        timeout=timeout,
    )
    output = p.stdout[-12000:]
    return f"exit_code={p.returncode}\n{output}"


@function_tool
def shell(command: str) -> str:
    """Run a non-interactive shell command in the checked-out repository. Never print secrets."""
    blocked = ["git push origin main", "git push --force", "git reset --hard"]
    if any(x in command for x in blocked):
        return "BLOCKED: unsafe git command. Use the agent recovery branch only."
    return run_cmd(command)


@function_tool
def read_file(path: str) -> str:
    """Read a UTF-8 text file inside the repository."""
    target = (REPO / path).resolve()
    if REPO not in target.parents and target != REPO:
        return "BLOCKED: path outside repository"
    if not target.exists() or not target.is_file():
        return "FILE NOT FOUND"
    return target.read_text(encoding="utf-8")[:16000]


agent = Agent(
    name="PINO Autonomous Dev Agent",
    model=os.environ.get("OPENAI_AGENT_MODEL", "gpt-5.6-sol"),
    instructions=f"""
You are the autonomous recovery engineer for the PINO web app.

A GitHub Actions production/CI workflow failed.
Repository: vmtct/pino-web
Failed run: {RUN_ID}
Failed head SHA: {HEAD_SHA}
Recovery branch: {BRANCH}
Workspace: {REPO}
Failure context file: {FAILURE_CONTEXT_FILE}

Your job is to diagnose and repair the failure, then leave a clean recovery branch with a commit that passes CI.

MANDATORY SAFETY RULES:
- Work ONLY on the recovery branch {BRANCH}.
- NEVER push to main.
- NEVER force push.
- NEVER modify real customer data, Notion records, production bookings, passes, or secrets.
- Do not expose secret values in output.
- Prefer the smallest correct code change.
- Inspect the actual failure before changing code; do not guess.
- Run the relevant tests/build locally after changes.
- Commit only source/test/config changes needed for the fix.
- If the failure is infrastructure-only or cannot be safely fixed from code, stop and explain why.

RECOVERY LOOP:
1. FIRST read `{FAILURE_CONTEXT_FILE}` if it exists. It is a compact capture of the failed CI output. Use it as primary failure evidence.
2. Inspect repository status/diff and use `gh run view {RUN_ID} --log-failed` only when additional context is needed.
3. Identify the root cause and affected files.
4. Make the smallest correct fix.
5. Run relevant local checks (at minimum the failing test/build when practical).
6. Commit the fix to {BRANCH} and push it.
7. Use `gh run list --branch {BRANCH}` and `gh run view` to inspect the new CI run.
8. If the new CI fails, inspect its logs and make another fix.
9. Repeat for at most {MAX_FIX_ATTEMPTS} total fix attempts.
10. Finish only when CI is green or when a clear blocker requires human intervention. Do not create a fake success.

Be decisive. Start with the captured failure, then inspect only files relevant to that failure. Avoid broad repository dumps and redundant exploration. Report the exact final state.
""",
    tools=[shell, read_file],
)


async def main() -> None:
    prompt = (
        f"CI run {RUN_ID} failed for commit {HEAD_SHA}. "
        f"Recover it on branch {BRANCH}. Read {FAILURE_CONTEXT_FILE} first, "
        "diagnose the real root cause, make the smallest safe fix, verify it, "
        "push the recovery branch, and verify CI. "
        f"Use at most {MAX_FIX_ATTEMPTS} fix attempts and {MAX_TURNS} agent turns."
    )
    result = await Runner.run(agent, prompt, max_turns=MAX_TURNS)
    print(result.final_output)


if __name__ == "__main__":
    asyncio.run(main())
