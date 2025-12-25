
type ToastType = 'success' | 'error' | 'info';

type ToastEvent = {
  message: string;
  type?: ToastType;
};

type ToastListener = (event: ToastEvent) => void;

const listeners: Set<ToastListener> = new Set();

export const showToast = (message: string, type: ToastType = 'success') => {
  listeners.forEach(listener => listener({ message, type }));
};

export const subscribeToToasts = (listener: ToastListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
