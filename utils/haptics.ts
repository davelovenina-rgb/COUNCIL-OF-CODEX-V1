
export const triggerHaptic = (pattern: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    switch (pattern) {
      case 'light':
        navigator.vibrate(10); // Subtle tick
        break;
      case 'medium':
        navigator.vibrate(25); // Definite click
        break;
      case 'heavy':
        navigator.vibrate(50); // Notification style
        break;
      case 'success':
        navigator.vibrate([10, 50, 20]); // Da-da
        break;
      case 'error':
        navigator.vibrate([50, 50, 50]); // Buzz-buzz-buzz
        break;
    }
  }
};
