import React from 'react';
import { HelpCircle, Globe, Cpu, Zap, Plus, Trash2, Code } from 'lucide-react';

interface AIModelSettings {
  provider: 'gemini' | 'groq' | 'openai';
  modelName: string;
  temperature?: number;
  maxTokens?: number;
}

interface AIModelStrategy {
  routing: {
    defaultModel: string;
    taskOverrides?: Record<string, string>;
    complexityOverrides?: Record<string, string>;
  };
  models: Record<string, AIModelSettings>;
}

interface Option {
  value: string;
  label: string;
}

interface AiConfigFormProps {
  config: AIModelStrategy;
  options: {
    providers: Option[];
    tasks: Option[];
    complexities: Option[];
  };
  onChange: (config: AIModelStrategy) => void;
}

export const AiConfigForm: React.FC<AiConfigFormProps> = ({
  config,
  options,
  onChange,
}) => {
  const [activeTab, setActiveTab] = React.useState<'routing' | 'models' | 'json'>('routing');
  const [jsonInput, setJsonInput] = React.useState(JSON.stringify(config, null, 2));

  // Sync JSON input when config changes externally
  React.useEffect(() => {
    setJsonInput(JSON.stringify(config, null, 2));
  }, [config]);

  const updateRouting = (routing: Partial<AIModelStrategy['routing']>) => {
    onChange({
      ...config,
      routing: { ...config.routing, ...routing },
    });
  };

  const updateModel = (alias: string, settings: Partial<AIModelSettings> | null) => {
    const newModels = { ...config.models };
    if (settings === null) {
      delete newModels[alias];
    } else {
      newModels[alias] = { ...newModels[alias], ...settings } as AIModelSettings;
    }
    onChange({ ...config, models: newModels });
  };

  const addModel = () => {
    const alias = `new-model-${Object.keys(config.models || {}).length + 1}`;
    const defaultProvider = (options.providers[0]?.value as any) || 'gemini';
    updateModel(alias, { provider: defaultProvider, modelName: 'model-name', temperature: 0.7 });
  };

  const handleJsonChange = (val: string) => {
    setJsonInput(val);
    try {
      const parsed = JSON.parse(val);
      onChange(parsed);
    } catch (error) {
      // Invalid JSON, don't update parent state
      console.debug('Invalid JSON in AI Config Editor', error);
    }
  };

  const modelAliases = Object.keys(config.models || {});

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Cpu className="h-5 w-5 text-primary-500" />
          AI Strategy & Model Configuration
        </h2>
      </div>

      <div className="flex border-b border-gray-100 bg-gray-50/50 px-6 dark:border-gray-800 dark:bg-gray-800/50">
        {[
          { id: 'routing', label: 'Routing', icon: Globe },
          { id: 'models', label: 'Models', icon: Zap },
          { id: 'json', label: 'Advanced JSON', icon: Code },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeTab === 'routing' && (
          <div className="space-y-8">
            {/* Global Default */}
            <div>
              <label htmlFor="global-default-model" className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                Global Default Model
                <HelpCircle className="h-3 w-3 text-gray-400" />
              </label>
              <select
                id="global-default-model"
                value={config.routing?.defaultModel || ''}
                onChange={(e) => updateRouting({ defaultModel: e.target.value })}
                className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select a model...</option>
                {modelAliases.map((alias) => (
                  <option key={alias} value={alias}>
                    {alias}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {/* Task Overrides */}
              <div>
                <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                  Task Overrides
                </h3>
                <div className="space-y-4">
                  {options.tasks.map((task: Option) => (
                    <div key={task.value} className="flex items-center justify-between gap-4">
                      <label htmlFor={`task-${task.value}`} className="text-sm text-gray-600 dark:text-gray-400">{task.label}</label>
                      <select
                        id={`task-${task.value}`}
                        value={config.routing?.taskOverrides?.[task.value] || ''}
                        onChange={(e) => {
                          const overrides: Record<string, string> = { ...config.routing?.taskOverrides, [task.value]: e.target.value };
                          if (!e.target.value) delete overrides[task.value];
                          updateRouting({ taskOverrides: overrides });
                        }}
                        className="w-48 rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="">Default</option>
                        {modelAliases.map((alias) => (
                          <option key={alias} value={alias}>{alias}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Complexity Overrides */}
              <div>
                <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                  Complexity Mapping
                </h3>
                <div className="space-y-4">
                  {options.complexities.map((level: Option) => (
                    <div key={level.value} className="flex items-center justify-between gap-4">
                      <label htmlFor={`complexity-${level.value}`} className="text-sm text-gray-600 dark:text-gray-400">{level.label}</label>
                      <select
                        id={`complexity-${level.value}`}
                        value={config.routing?.complexityOverrides?.[level.value] || ''}
                        onChange={(e) => {
                          const overrides: Record<string, string> = { ...config.routing?.complexityOverrides, [level.value]: e.target.value };
                          if (!e.target.value) delete overrides[level.value];
                          updateRouting({ complexityOverrides: overrides });
                        }}
                        className="w-48 rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      >
                        <option value="">Default</option>
                        {modelAliases.map((alias) => (
                          <option key={alias} value={alias}>{alias}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'models' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                Model Definitions
              </h3>
              <button
                type="button"
                onClick={addModel}
                className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                <Plus className="h-3 w-3" /> Add Model
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {modelAliases.map((alias) => (
                <div key={alias} className="relative rounded-lg border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
                  <button
                    type="button"
                    title="Delete model"
                    onClick={() => updateModel(alias, null)}
                    className="absolute right-2 top-2 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label htmlFor={`alias-${alias}`} className="mb-1 block text-[10px] font-bold uppercase text-gray-400">Alias</label>
                      <input
                        id={`alias-${alias}`}
                        type="text"
                        value={alias}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val || val === alias) return;
                          const newModels = { ...config.models };
                          newModels[val] = newModels[alias];
                          delete newModels[alias];
                          onChange({ ...config, models: newModels });
                        }}
                        className="w-full bg-transparent font-medium text-gray-900 focus:outline-none dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor={`provider-${alias}`} className="mb-1 block text-[10px] font-bold uppercase text-gray-400">Provider</label>
                      <select
                        id={`provider-${alias}`}
                        value={config.models[alias]?.provider}
                        onChange={(e) => updateModel(alias, { provider: e.target.value as any })}
                        className="w-full rounded bg-white px-2 py-1 text-xs dark:bg-gray-800"
                      >
                        {options.providers.map((p: Option) => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>

                    </div>
                    <div>
                      <label htmlFor={`modelName-${alias}`} className="mb-1 block text-[10px] font-bold uppercase text-gray-400">Model Name</label>
                      <input
                        id={`modelName-${alias}`}
                        type="text"
                        value={config.models[alias]?.modelName}
                        onChange={(e) => updateModel(alias, { modelName: e.target.value })}
                        className="w-full rounded bg-white px-2 py-1 text-xs dark:bg-gray-800"
                      />
                    </div>
                    <div>
                      <label htmlFor={`temperature-${alias}`} className="mb-1 block text-[10px] font-bold uppercase text-gray-400">Temp</label>
                      <input
                        id={`temperature-${alias}`}
                        type="number"
                        step="0.1"
                        min="0"
                        max="2"
                        value={config.models[alias]?.temperature ?? 0.7}
                        onChange={(e) => updateModel(alias, { temperature: Number.parseFloat(e.target.value) })}
                        className="w-full rounded bg-white px-2 py-1 text-xs dark:bg-gray-800"
                      />
                    </div>
                    <div>
                      <label htmlFor={`maxTokens-${alias}`} className="mb-1 block text-[10px] font-bold uppercase text-gray-400">Max Tokens</label>
                      <input
                        id={`maxTokens-${alias}`}
                        type="number"
                        value={config.models[alias]?.maxTokens ?? ''}
                        onChange={(e) => updateModel(alias, { maxTokens: Number.parseInt(e.target.value) || undefined })}
                        placeholder="Default"
                        className="w-full rounded bg-white px-2 py-1 text-xs dark:bg-gray-800"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'json' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Directly edit the underlying strategy JSON
              </span>
              {(() => {
                try {
                  JSON.parse(jsonInput);
                  return <span className="text-[10px] text-green-500 font-bold uppercase">Valid JSON</span>;
                } catch (_error) {
                  return <span className="text-[10px] text-red-500 font-bold uppercase">Invalid JSON</span>;
                }
              })()}
            </div>
            <textarea
              aria-label="AI Strategy JSON Editor"
              value={jsonInput}
              onChange={(e) => handleJsonChange(e.target.value)}
              className="h-96 w-full rounded-lg border border-gray-300 bg-gray-50 p-4 font-mono text-xs focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
              spellCheck={false}
            />
          </div>
        )}
      </div>
    </div>
  );
};
