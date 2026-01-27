import React from 'react';
import { AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InputErrorProps {
  message?: string | null;
  className?: string;
}

export const InputError: React.FC<InputErrorProps> = ({
  message,
  className = '',
}) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`flex items-center gap-1.5 mt-2 text-sm text-red-600 dark:text-red-400 font-medium ${className}`}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
