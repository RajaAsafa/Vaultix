import * as Clipboard from 'expo-clipboard';

let activeClearTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Copies sensitive text to the system clipboard and schedules an automatic clear.
 */
export async function copyToClipboardWithAutoClear(
  text: string,
  timeoutSeconds: number = 30
): Promise<void> {
  // Clear any existing timer
  if (activeClearTimer) {
    clearTimeout(activeClearTimer);
    activeClearTimer = null;
  }

  await Clipboard.setStringAsync(text);

  if (timeoutSeconds > 0) {
    activeClearTimer = setTimeout(async () => {
      try {
        const currentClipboard = await Clipboard.getStringAsync();
        // Only clear if the clipboard still contains the copied sensitive text
        if (currentClipboard === text) {
          await Clipboard.setStringAsync('');
        }
      } catch {
        // Silently fail if clipboard access is revoked
      } finally {
        activeClearTimer = null;
      }
    }, timeoutSeconds * 1000);
  }
}

/**
 * Immediately clears the clipboard.
 */
export async function clearClipboardNow(): Promise<void> {
  if (activeClearTimer) {
    clearTimeout(activeClearTimer);
    activeClearTimer = null;
  }
  await Clipboard.setStringAsync('');
}
