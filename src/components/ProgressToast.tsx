import React, { useEffect } from "react";
import { Loader2, CheckCircle, XCircle, X } from "lucide-react";
import { toast } from "react-hot-toast";

interface ProgressToastProps {
  t: any; // Toast object from react-hot-toast
  title: string;
  message: string;
  progress: number;
  status: "processing" | "success" | "error";
}

export const ProgressToast: React.FC<ProgressToastProps> = ({
  t,
  title,
  message,
  progress,
  status,
}) => {
  useEffect(() => {
    if (status === "success" || status === "error" || progress === 100) {
      const timer = setTimeout(() => {
        toast.dismiss(t.id);
      }, 3000); // Close after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [status, progress, t.id]);

  return (
    <div
      className={`${
        t.visible ? "animate-enter" : "animate-leave"
      } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 dark:ring-white dark:ring-opacity-10 overflow-hidden relative`}
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            {status === "processing" && (
              <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
            )}
            {status === "success" && (
              <CheckCircle className="h-10 w-10 text-green-500" />
            )}
            {status === "error" && (
              <XCircle className="h-10 w-10 text-red-500" />
            )}
          </div>
          <div className="ml-3 flex-1 pr-6">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {title}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {message}
            </p>
            {status === "processing" && (
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <button
        onClick={() => toast.dismiss(t.id)}
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
