import { motion } from 'framer-motion';

interface LoadingScreenProps {
  message?: string;
  subMessage?: string;
}

export const LoadingScreen = ({
  message = 'Loading...',
  subMessage = 'Please wait while we prepare your experience',
}: LoadingScreenProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <img
          src="/quiz-emoji.svg"
          alt="Quizzer Logo"
          className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-6 shadow-xl rounded-2xl"
        />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {message}
        </h2>
        <p className="text-gray-500 dark:text-gray-400">{subMessage}</p>
      </motion.div>
    </div>
  );
};
