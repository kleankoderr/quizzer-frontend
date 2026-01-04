import React from 'react';
import { HelpCircle } from 'lucide-react';

interface AiProviderConfig {
  files?: 'gemini' | 'groq';
  content?: 'gemini' | 'groq';
  [key: string]: string | undefined;
}

interface AiConfigFormProps {
  config: AiProviderConfig;
  onChange: (config: AiProviderConfig) => void;
}

const PROVIDER_OPTIONS = [
  { value: 'gemini', label: 'Gemini (Best for Files)' },
  { value: 'groq', label: 'Groq (Fastest for Text)' },
];

const TASK_OPTIONS = [
  { value: 'quiz', label: 'Quiz Generation' },
  { value: 'flashcards', label: 'Flashcards' },
  { value: 'learningGuide', label: 'Learning Guide' },
  { value: 'explanation', label: 'Explanation' },
  { value: 'example', label: 'Examples' },
  { value: 'recommendations', label: 'Recommendations' },
  { value: 'summary', label: 'Summary' },
];

export const AiConfigForm: React.FC<AiConfigFormProps> = ({
  config,
  onChange,
}) => {
  const handleChange = (key: string, value: string) => {
    const newConfig = { ...config, [key]: value };
    if (value === '') {
      delete newConfig[key];
    }
    onChange(newConfig);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        AI Service Configuration
      </h2>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        Configure which AI provider handles specific tasks. The system
        automatically prioritizes file-based tasks to Gemini if not overridden.
      </p>

      <div className="space-y-6">
        {/* Global Defaults */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Default for Files
              <span className="ml-2 inline-flex items-center text-xs text-gray-400">
                <HelpCircle className="h-3 w-3" />
                <span className="ml-1">Used when files are attached</span>
              </span>
            </label>
            <select
              value={config.files || 'gemini'}
              onChange={(e) => handleChange('files', e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {PROVIDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Default for Content
              <span className="ml-2 inline-flex items-center text-xs text-gray-400">
                <HelpCircle className="h-3 w-3" />
                <span className="ml-1">Used for text-only inputs</span>
              </span>
            </label>
            <select
              value={config.content || 'groq'}
              onChange={(e) => handleChange('content', e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {PROVIDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800"></div>

        {/* Task Overrides */}
        <div>
          <h3 className="mb-4 text-sm font-medium text-gray-900 dark:text-white">
            Task-Specific Overrides
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {TASK_OPTIONS.map((task) => (
              <div key={task.value}>
                <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  {task.label}
                </label>
                <select
                  value={config[task.value] || ''}
                  onChange={(e) => handleChange(task.value, e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Default (Dynamic)</option>
                  <option value="gemini">Gemini</option>
                  <option value="groq">Groq</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
