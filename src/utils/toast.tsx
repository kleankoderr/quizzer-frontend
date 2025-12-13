import toast, {
  type ToastOptions,
  type Toast as ToastType,
} from 'react-hot-toast';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import type { JSX, ReactNode } from 'react';

// Extended toast options with description
interface ExtendedToastOptions extends ToastOptions {
  description?: ReactNode;
}

// Toast variant types
type ToastVariant = 'success' | 'error' | 'loading' | 'info' | 'warning';

// Custom Toast Component Props
interface CustomToastProps {
  t: ToastType;
  variant: ToastVariant;
  message: ReactNode;
  description?: ReactNode;
}

// Variant configuration
const VARIANT_CONFIG = {
  success: {
    icon: CheckCircle,
    // Using primary blue colors for success as requested
    iconColor: 'text-primary-600 dark:text-primary-400',
    borderColor: 'border-primary-200 dark:border-primary-800',
    bgColor: 'bg-primary-50 dark:bg-primary-950/30',
    iconBgColor: 'bg-primary-100 dark:bg-primary-900/50',
  },
  error: {
    icon: XCircle,
    iconColor: 'text-red-600 dark:text-red-400',
    borderColor: 'border-red-200 dark:border-red-800',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    iconBgColor: 'bg-red-100 dark:bg-red-900/50',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-200 dark:border-amber-800',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    iconBgColor: 'bg-amber-100 dark:bg-amber-900/50',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-800',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    iconBgColor: 'bg-blue-100 dark:bg-blue-900/50',
  },
  loading: {
    icon: null,
    iconColor: 'text-primary-600 dark:text-primary-400',
    borderColor: 'border-gray-200 dark:border-gray-700',
    bgColor: 'bg-white dark:bg-gray-800',
    iconBgColor: 'bg-gray-100 dark:bg-gray-800',
  },
} as const;

// Custom Toast Component
const CustomToast = ({
  t,
  variant,
  message,
  description,
}: CustomToastProps) => {
  const config = VARIANT_CONFIG[variant];
  const IconComponent = config.icon;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`
        ${t.visible ? 'animate-enter' : 'animate-leave'}
        max-w-md w-auto shadow-xl rounded-xl pointer-events-auto
        border ${config.borderColor} ${config.bgColor}
        backdrop-blur-md bg-opacity-95 dark:bg-opacity-90
        transition-all duration-300 ease-in-out
        hover:scale-[1.02]
        group
      `}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Icon */}
        <div
          className={`
            flex-shrink-0 rounded-full p-1.5
            ${config.iconBgColor}
          `}
        >
          {variant === 'loading' ? (
            <div
              className={`
                w-4 h-4 rounded-full border-2 border-t-transparent
                animate-spin ${config.iconColor}
              `}
              style={{
                borderColor: 'currentColor',
                borderTopColor: 'transparent',
              }}
            />
          ) : (
            IconComponent && (
              <IconComponent className={`w-4 h-4 ${config.iconColor}`} />
            )
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {message}
          </p>
          {description && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Dismiss Button */}
        <button
          onClick={() => toast.dismiss(t.id)}
          className={`
            flex-shrink-0 rounded-md p-1.5 ml-2
            text-gray-500 dark:text-gray-400
            hover:text-gray-700 dark:hover:text-gray-200
            hover:bg-gray-100 dark:hover:bg-gray-700/50
            transition-all duration-200 hover:scale-110
          `}
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Toast API
const Toast = {
  /**
   * Show a success toast notification
   */
  success: (message: ReactNode, options?: ExtendedToastOptions) => {
    return toast.custom(
      (t) => (
        <CustomToast
          t={t}
          variant="success"
          message={message}
          description={options?.description}
        />
      ),
      { duration: 3000, ...options }
    );
  },

  /**
   * Show an error toast notification
   */
  error: (message: ReactNode, options?: ExtendedToastOptions) => {
    return toast.custom(
      (t) => (
        <CustomToast
          t={t}
          variant="error"
          message={message}
          description={options?.description}
        />
      ),
      { duration: 5000, ...options }
    );
  },

  /**
   * Show a warning toast notification
   */
  warning: (message: ReactNode, options?: ExtendedToastOptions) => {
    return toast.custom(
      (t) => (
        <CustomToast
          t={t}
          variant="warning"
          message={message}
          description={options?.description}
        />
      ),
      { duration: 3000, ...options }
    );
  },

  /**
   * Show an info toast notification
   */
  info: (message: ReactNode, options?: ExtendedToastOptions) => {
    return toast.custom(
      (t) => (
        <CustomToast
          t={t}
          variant="info"
          message={message}
          description={options?.description}
        />
      ),
      { duration: 3000, ...options }
    );
  },

  /**
   * Show a loading toast notification
   */
  loading: (message: ReactNode, options?: ExtendedToastOptions) => {
    return toast.custom(
      (t) => (
        <CustomToast
          t={t}
          variant="loading"
          message={message}
          description={options?.description}
        />
      ),
      { duration: Infinity, ...options }
    );
  },

  /**
   * Show a loading toast and update it with success/error
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: ReactNode;
      success: ReactNode | ((data: T) => ReactNode);
      error: ReactNode | ((error: Error) => ReactNode);
    },
    options?: ExtendedToastOptions
  ) => {
    const toastId = Toast.loading(messages.loading, options);

    promise
      .then((data) => {
        toast.dismiss(toastId);
        const successMessage =
          typeof messages.success === 'function'
            ? messages.success(data)
            : messages.success;
        Toast.success(successMessage, options);
      })
      .catch((error) => {
        toast.dismiss(toastId);
        const errorMessage =
          typeof messages.error === 'function'
            ? messages.error(error)
            : messages.error;
        Toast.error(errorMessage, options);
      });

    return toastId;
  },

  /**
   * Dismiss a specific toast or all toasts
   */
  dismiss: (toastId?: string) => toast.dismiss(toastId),

  /**
   * Custom toast with your own renderer
   */
  custom: (renderer: (t: ToastType) => JSX.Element, options?: ToastOptions) =>
    toast.custom(renderer, options),

  /**
   * Access to the underlying react-hot-toast instance
   */
  raw: toast,
};

export { Toast };
export type { ExtendedToastOptions, ToastVariant, CustomToastProps };
