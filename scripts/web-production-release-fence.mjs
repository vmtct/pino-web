#!/usr/bin/env node
export function decideProductionRollback(input = {}) {
  const text = (value) => typeof value === "string" ? value.trim() : "";
  const oldDeploymentId = text(input.oldDeploymentId);
  const oldVersion = text(input.oldVersion);
  const candidateDeploymentId = text(input.candidateDeploymentId);
  const candidateVersion = text(input.candidateVersion);
  const candidateMarker = text(input.candidateMarker);
  const currentDeploymentId = text(input.currentDeploymentId);
  const currentVersion = text(input.currentVersion);
  const currentMarker = text(input.currentMarker);
  const previousDeploymentId = text(input.previousDeploymentId);
  if (![oldDeploymentId, oldVersion, candidateVersion, candidateMarker, currentDeploymentId, currentVersion].every(Boolean)) return "REFUSE";
  if (currentVersion === candidateVersion) {
    if (candidateDeploymentId) return currentDeploymentId === candidateDeploymentId ? "RESTORE" : "REFUSE";
    return currentDeploymentId !== oldDeploymentId && previousDeploymentId === oldDeploymentId && currentMarker === candidateMarker ? "RESTORE" : "REFUSE";
  }
  if (currentVersion === oldVersion) return currentDeploymentId === oldDeploymentId ? "NOOP" : "REFUSE";
  return "REFUSE";
}
if (import.meta.url === `file://${process.argv[1]}`) {
  let input;
  try { input = JSON.parse(process.argv[2] ?? "{}"); } catch { process.exitCode = 2; }
  if (input) process.stdout.write(`${decideProductionRollback(input)}\n`);
}
