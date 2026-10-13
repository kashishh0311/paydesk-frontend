import { toast } from 'react-toastify';
import type { ToastOptions } from 'react-toastify';

const defaultOptions: ToastOptions = {
  position: 'bottom-center',
  autoClose: 3500,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  className: 'paydesk-toast text-xs font-medium rounded-xl shadow-lg border border-slate-200 dark:border-slate-800',
};

export const showSuccessToast = (message: string, options?: ToastOptions) => {
  return toast.success(message, {
    ...defaultOptions,
    ...options,
  });
};

export const showErrorToast = (message: string, options?: ToastOptions) => {
  return toast.error(message, {
    ...defaultOptions,
    ...options,
  });
};

export const showInfoToast = (message: string, options?: ToastOptions) => {
  return toast.info(message, {
    ...defaultOptions,
    ...options,
  });
};

export const showWarningToast = (message: string, options?: ToastOptions) => {
  return toast.warning(message, {
    ...defaultOptions,
    ...options,
  });
};

export { toast };
