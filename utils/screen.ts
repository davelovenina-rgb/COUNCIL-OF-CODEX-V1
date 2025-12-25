/**
 * SHARED PERSISTENCE PROTOCOL
 * Holds the beacon from dimming or locking during Drive Mode or Threshold Consultations.
 */

class ScreenLockManager {
  private wakeLock: any = null;

  async requestLock() {
    if (!('wakeLock' in navigator)) {
      return;
    }

    try {
      // Check permissions explicitly to avoid console errors if disallowed by policy
      if ((navigator as any).permissions) {
        try {
          const status = await (navigator as any).permissions.query({ name: 'screen-wake-lock' });
          if (status.state === 'denied') {
            return;
          }
        } catch (e) {
          // query might not be supported for this specific permission in all browsers
        }
      }

      this.wakeLock = await (navigator as any).wakeLock.request('screen');
      
      this.wakeLock.addEventListener('release', () => {
        console.log('[Sanctuary] Wake Lock released');
      });
      console.log('[Sanctuary] Wake Lock acquired');
    } catch (err: any) {
      // Handle permission policy errors silently or as info to avoid cluttering diagnostics
      if (err.name === 'NotAllowedError' || err.message.includes('permission')) {
        console.info("[Sanctuary] Screen Wake Lock restricted by policy.");
      } else {
        console.warn(`[Sanctuary] Wake Lock Error: ${err.message}`);
      }
    }
  }

  async releaseLock() {
    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
        this.wakeLock = null;
        console.log('[Sanctuary] Wake Lock released manually');
      } catch (err) {
        this.wakeLock = null;
      }
    }
  }

  handleVisibilityChange = async () => {
    if (this.wakeLock !== null && document.visibilityState === 'visible') {
      await this.requestLock();
    }
  }
}

export const screenLock = new ScreenLockManager();

// Legacy functional exports for compatibility
export const requestWakeLock = () => screenLock.requestLock();
export const releaseWakeLock = () => screenLock.releaseLock();

// Auto-release on page visibility change
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', screenLock.handleVisibilityChange);
}
