export async function withFailSafeClaimCleanup<T>(
  claimId: string,
  work: (markCancellationConfirmed: () => void) => Promise<T>,
  cleanup: (claimId: string) => Promise<void>,
): Promise<T> {
  let cancellationConfirmed = false;
  try {
    return await work(() => {
      cancellationConfirmed = true;
    });
  } finally {
    if (!cancellationConfirmed) await cleanup(claimId);
  }
}
