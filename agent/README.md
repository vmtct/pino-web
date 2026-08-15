# PINO Autonomous Dev Agent

This agent is invoked by `.github/workflows/autonomous-recovery.yml` when the main CI workflow fails.

## Contract

- The agent starts from the failed commit on an isolated `agent/recovery-*` branch.
- It reads the real GitHub Actions failure with `gh run view --log-failed`.
- It may edit source/tests/config, run local verification, commit, push, and inspect the resulting CI run.
- It is limited to three fix attempts per recovery run.
- It never pushes to `main`, force-pushes, or mutates production customer data.
- On success, the workflow opens a draft PR for human review.

The recovery agent must also follow the repository-level `AGENTS.md`. When repairing an integration with a Core-owned domain, it must respect `pino-core` architecture and accepted ADRs rather than inferring domain ownership from failing web code alone.

## Required secret

Add a repository Actions secret named `OPENAI_API_KEY` before enabling autonomous recovery. The secret is never printed or included in prompts.

## Why this is a separate agent

The ChatGPT conversation remains the human control plane. This workflow is the execution plane that can wake independently from a CI failure. It uses the OpenAI Agents SDK's tool loop and the checked-out repository as its workspace.

This recovery workflow is an execution mechanism, not a separate source of architectural truth.
