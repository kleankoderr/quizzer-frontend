import React from 'react';
import type { TooltipRenderProps } from 'react-joyride';
import { motion } from 'framer-motion';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

export const TourTooltip: React.FC<TooltipRenderProps> = ({
  index,
  isLastStep,
  size,
  step,
  backProps,
  primaryProps,
  skipProps,
  tooltipProps,
}) => {
  return (
    <motion.div
      {...tooltipProps}
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      className="max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-6 relative overflow-hidden group"
    >
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gray-100 dark:bg-gray-800">
        <motion.div
          className="h-full bg-primary-600"
          initial={{ width: 0 }}
          animate={{ width: `${((index + 1) / size) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <button
        {...skipProps}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <X size={18} />
      </button>

      <div className="pt-2">
        {step.title && (
          <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
            {step.title}
          </h4>
        )}
        <div className="text-gray-600 dark:text-gray-400 leading-relaxed text-[15px]">
          {step.content}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md">
          {index + 1} of {size}
        </span>

        <div className="flex items-center gap-3">
          {index > 0 && (
            <button
              {...backProps}
              className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1"
            >
              <ChevronLeft size={16} />
              Back
            </button>
          )}

          <button
            {...primaryProps}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-primary-600/20 hover:shadow-primary-600/30 transition-all flex items-center gap-2 transform active:scale-95"
          >
            {isLastStep ? 'End' : 'Next'}
            {!isLastStep && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
