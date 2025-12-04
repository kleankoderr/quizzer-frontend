import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
}

export const LoadingScreen = ({ 
  message = "Loading...", 
  subMessage = "Please wait while we prepare your experience" 
}: LoadingScreenProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-primary-500/20 mx-auto mb-6">
          <Sparkles className="w-10 h-10 text-white animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {message}
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          {subMessage}
        </p>
      </motion.div>
    </div>
  );
};
