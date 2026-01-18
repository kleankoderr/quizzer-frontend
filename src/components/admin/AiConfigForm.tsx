import React, { useState } from 'react';
import {
  HelpCircle,
  Globe,
  Cpu,
  Zap,
  Plus,
  Trash2,
  Code,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Edit2,
} from 'lucide-react';
import { Modal } from '../Modal';

type AIProvider = 'gemini' | 'groq' | 'openai';
type ModelComplexity = 'simple' | 'medium' | 'complex';

interface AIModelSettings {
  modelName: string;
  temperature: number;
  maxTokens?: number;
}

interface AIProviderConfig {
  defaultModel: string;
  models: Record<string, AIModelSettings>;
}

interface AIModelStrategy {
  providers: Record<AIProvider, AIProviderConfig>;
  routing: {
    defaultProvider: AIProvider;
    taskRouting?: Record<string, AIProvider>;
    complexityRouting?: Partial<Record<ModelComplexity, AIProvider>>;
    multimodalProvider?: AIProvider;
  };
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

interface AddModelForm {
  modelKey: string;
  modelName: string;
  temperature: number;
  maxTokens: string;
}

export const AiConfigForm: React.FC<AiConfigFormProps> = ({
  config,
  options,
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState<'providers' | 'routing' | 'json'>(
    'providers'
  );
  const [expandedProviders, setExpandedProviders] = useState<Set<AIProvider>>(
    new Set(Object.keys(config.providers || {}) as AIProvider[])
  );
  const [jsonInput, setJsonInput] = useState(JSON.stringify(config, null, 2));
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(
    null
  );
  const [addModelForm, setAddModelForm] = useState<AddModelForm>({
    modelKey: '',
    modelName: '',
    temperature: 0.7,
    maxTokens: '',
  });

  // Sync JSON input when config changes externally
  React.useEffect(() => {
    setJsonInput(JSON.stringify(config, null, 2));
  }, [config]);

  const toggleProvider = (provider: AIProvider) => {
    const newExpanded = new Set(expandedProviders);
    if (newExpanded.has(provider)) {
      newExpanded.delete(provider);
    } else {
      newExpanded.add(provider);
    }
    setExpandedProviders(newExpanded);
  };

  const updateProviderDefaultModel = (
    provider: AIProvider,
    defaultModel: string
  ) => {
    onChange({
      ...config,
      providers: {
        ...config.providers,
        [provider]: {
          ...config.providers[provider],
          defaultModel,
        },
      },
    });
  };

  const openAddModelModal = (provider: AIProvider) => {
    setSelectedProvider(provider);
    setAddModelForm({
      modelKey: '',
      modelName: '',
      temperature: 0.7,
      maxTokens: '',
    });
    setShowAddModal(true);
  };

  const handleAddModel = () => {
    if (!selectedProvider || !addModelForm.modelKey || !addModelForm.modelName)
      return;

    const newModel: AIModelSettings = {
      modelName: addModelForm.modelName,
      temperature: addModelForm.temperature,
      maxTokens: addModelForm.maxTokens
        ? Number.parseInt(addModelForm.maxTokens, 10)
        : undefined,
    };

    onChange({
      ...config,
      providers: {
        ...config.providers,
        [selectedProvider]: {
          ...config.providers[selectedProvider],
          models: {
            ...config.providers[selectedProvider].models,
            [addModelForm.modelKey]: newModel,
          },
        },
      },
    });

    setShowAddModal(false);
    setSelectedProvider(null);
  };

  const updateModel = (
    provider: AIProvider,
    modelKey: string,
    settings: Partial<AIModelSettings> | null
  ) => {
    const providerConfig = config.providers[provider];
    const newModels = { ...providerConfig.models };

    if (settings === null) {
      delete newModels[modelKey];
    } else {
      newModels[modelKey] = {
        ...newModels[modelKey],
        ...settings,
      } as AIModelSettings;
    }

    onChange({
      ...config,
      providers: {
        ...config.providers,
        [provider]: {
          ...providerConfig,
          models: newModels,
        },
      },
    });
  };

  const renameModelKey = (
    provider: AIProvider,
    oldKey: string,
    newKey: string
  ) => {
    if (newKey === oldKey || !newKey) return;

    const providerConfig = config.providers[provider];
    const newModels = { ...providerConfig.models };
    newModels[newKey] = newModels[oldKey];
    delete newModels[oldKey];

    // Update default model if it was renamed
    const newDefaultModel =
      providerConfig.defaultModel === oldKey
        ? newKey
        : providerConfig.defaultModel;

    onChange({
      ...config,
      providers: {
        ...config.providers,
        [provider]: {
          ...providerConfig,
          defaultModel: newDefaultModel,
          models: newModels,
        },
      },
    });
  };

  const updateRouting = (routing: Partial<AIModelStrategy['routing']>) => {
    onChange({
      ...config,
      routing: { ...config.routing, ...routing },
    });
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

  return (
    <>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary-500" />
            AI Provider Configuration
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage AI providers, models, and routing strategies
          </p>
        </div>

        <div className="flex border-b border-gray-100 bg-gray-50/50 px-6 dark:border-gray-800 dark:bg-gray-800/50">
          {[
            { id: 'routing', label: 'Routing', icon: Globe },
            { id: 'providers', label: 'Providers & Models', icon: Zap },
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
          {activeTab === 'providers' && (
            <div className="space-y-4">
              {options.providers.map((providerOption) => {
                const provider = providerOption.value as AIProvider;
                const providerConfig = config.providers[provider];
                const isExpanded = expandedProviders.has(provider);
                const modelKeys = Object.keys(providerConfig?.models || {});

                return (
                  <div
                    key={provider}
                    className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50/50 shadow-sm hover:shadow-md transition-shadow dark:border-gray-700 dark:from-gray-800 dark:to-gray-800/50"
                  >
                    <button
                      type="button"
                      onClick={() => toggleProvider(provider)}
                      className="flex w-full items-center justify-between p-5 text-left hover:bg-gray-50/50 dark:hover:bg-gray-700/30 rounded-t-xl transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-primary-500" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            {providerOption.label}
                            {config.routing.defaultProvider === provider && (
                              <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                                Default Provider
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {modelKeys.length} model
                            {modelKeys.length === 1 ? '' : 's'} • Default:{' '}
                            {providerConfig?.defaultModel || 'None'}
                          </p>
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-white/50 p-5 dark:border-gray-700 dark:bg-gray-900/30 rounded-b-xl">
                        <div className="mb-5">
                          <label
                            htmlFor={`default-${provider}`}
                            className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            Default Model for {providerOption.label}
                          </label>
                          <select
                            id={`default-${provider}`}
                            value={providerConfig?.defaultModel || ''}
                            onChange={(e) =>
                              updateProviderDefaultModel(
                                provider,
                                e.target.value
                              )
                            }
                            className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          >
                            <option value="">Select default model...</option>
                            {modelKeys.map((key) => (
                              <option key={key} value={key}>
                                {key}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="mb-4 flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary-500" />
                            Models
                          </h4>
                          <button
                            type="button"
                            onClick={() => openAddModelModal(provider)}
                            className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors shadow-sm hover:shadow-md"
                          >
                            <Plus className="h-4 w-4" />
                            Add Model
                          </button>
                        </div>

                        {modelKeys.length > 0 ? (
                          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {modelKeys.map((modelKey) => {
                              const model = providerConfig.models[modelKey];
                              const isDefault =
                                providerConfig.defaultModel === modelKey;

                              return (
                                <div
                                  key={modelKey}
                                  className={`group relative rounded-lg border-2 p-5 transition-all hover:shadow-lg ${
                                    isDefault
                                      ? 'border-primary-300 bg-gradient-to-br from-primary-50 to-white shadow-md dark:border-primary-600/50 dark:from-primary-900/20 dark:to-gray-800'
                                      : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
                                  }`}
                                >
                                  {/* Header with badges */}
                                  <div className="mb-4 flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <input
                                        type="text"
                                        value={modelKey}
                                        onChange={(e) =>
                                          renameModelKey(
                                            provider,
                                            modelKey,
                                            e.target.value
                                          )
                                        }
                                        className={`text-lg font-bold w-full bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 rounded px-0 ${
                                          isDefault
                                            ? 'text-primary-900 dark:text-primary-100'
                                            : 'text-gray-900 dark:text-white'
                                        }`}
                                        placeholder="Model key"
                                      />
                                    </div>
                                    <div className="flex items-center gap-2 ml-2">
                                      {isDefault && (
                                        <span className="rounded-full bg-primary-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                                          DEFAULT
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        title={
                                          isDefault
                                            ? 'Cannot delete default model'
                                            : 'Delete model'
                                        }
                                        onClick={() =>
                                          updateModel(provider, modelKey, null)
                                        }
                                        disabled={isDefault}
                                        className={`rounded-lg p-2 transition-all ${
                                          isDefault
                                            ? 'cursor-not-allowed text-gray-300 dark:text-gray-600'
                                            : 'text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400'
                                        }`}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Model details */}
                                  <div className="space-y-4">
                                    <div>
                                      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                        <Edit2 className="h-3 w-3" />
                                        Model Name
                                      </label>
                                      <input
                                        type="text"
                                        value={model.modelName}
                                        onChange={(e) =>
                                          updateModel(provider, modelKey, {
                                            modelName: e.target.value,
                                          })
                                        }
                                        className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-200 dark:focus:bg-gray-700"
                                        placeholder="e.g., gpt-4"
                                      />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                          Temperature
                                        </label>
                                        <input
                                          type="number"
                                          step="0.1"
                                          min="0"
                                          max="2"
                                          value={model.temperature ?? 0.7}
                                          onChange={(e) =>
                                            updateModel(provider, modelKey, {
                                              temperature: Number.parseFloat(
                                                e.target.value
                                              ),
                                            })
                                          }
                                          className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-200 dark:focus:bg-gray-700"
                                        />
                                      </div>
                                      <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                          Max Tokens
                                        </label>
                                        <input
                                          type="number"
                                          value={model.maxTokens ?? ''}
                                          onChange={(e) =>
                                            updateModel(provider, modelKey, {
                                              maxTokens:
                                                Number.parseInt(
                                                  e.target.value,
                                                  10
                                                ) || undefined,
                                            })
                                          }
                                          placeholder="Auto"
                                          className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-200 dark:focus:bg-gray-700"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-12 text-center">
                            <Sparkles className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                              No models configured for this provider
                            </p>
                            <button
                              type="button"
                              onClick={() => openAddModelModal(provider)}
                              className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                            >
                              <Plus className="h-4 w-4" />
                              Add your first model
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'routing' && (
            <div className="space-y-8">
              <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm dark:border-gray-700 dark:from-gray-800 dark:to-gray-800/50">
                <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                  Global Configuration
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="default-provider"
                      className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Default Provider
                      <HelpCircle className="h-3 w-3 text-gray-400" />
                    </label>
                    <select
                      id="default-provider"
                      value={config.routing?.defaultProvider || ''}
                      onChange={(e) =>
                        updateRouting({
                          defaultProvider: e.target.value as AIProvider,
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">Select provider...</option>
                      {options.providers.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="multimodal-provider"
                      className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Multimodal Provider
                      <HelpCircle className="h-3 w-3 text-gray-400" />
                    </label>
                    <select
                      id="multimodal-provider"
                      value={config.routing?.multimodalProvider || ''}
                      onChange={(e) =>
                        updateRouting({
                          multimodalProvider: e.target.value as AIProvider,
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">Use default...</option>
                      {options.providers.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Provider used for file-based requests
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                    Task Routing
                  </h3>
                  <div className="space-y-3">
                    {options.tasks.map((task) => (
                      <div
                        key={task.value}
                        className="flex items-center justify-between gap-4"
                      >
                        <label
                          htmlFor={`task-${task.value}`}
                          className="text-sm text-gray-600 dark:text-gray-400"
                        >
                          {task.label}
                        </label>
                        <select
                          id={`task-${task.value}`}
                          value={
                            config.routing?.taskRouting?.[task.value] || ''
                          }
                          onChange={(e) => {
                            const taskRouting = {
                              ...config.routing?.taskRouting,
                            };
                            if (e.target.value) {
                              taskRouting[task.value] = e.target
                                .value as AIProvider;
                            } else {
                              delete taskRouting[task.value];
                            }
                            updateRouting({ taskRouting });
                          }}
                          className="w-48 rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        >
                          <option value="">Default</option>
                          {options.providers.map((p) => (
                            <option key={p.value} value={p.value}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                  <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                    Complexity Routing
                  </h3>
                  <div className="space-y-3">
                    {options.complexities.map((level) => (
                      <div
                        key={level.value}
                        className="flex items-center justify-between gap-4"
                      >
                        <label
                          htmlFor={`complexity-${level.value}`}
                          className="text-sm text-gray-600 dark:text-gray-400"
                        >
                          {level.label}
                        </label>
                        <select
                          id={`complexity-${level.value}`}
                          value={
                            config.routing?.complexityRouting?.[
                              level.value as ModelComplexity
                            ] || ''
                          }
                          onChange={(e) => {
                            const complexityRouting = {
                              ...config.routing?.complexityRouting,
                            };
                            if (e.target.value) {
                              complexityRouting[
                                level.value as ModelComplexity
                              ] = e.target.value as AIProvider;
                            } else {
                              delete complexityRouting[
                                level.value as ModelComplexity
                              ];
                            }
                            updateRouting({ complexityRouting });
                          }}
                          className="w-48 rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        >
                          <option value="">Default</option>
                          {options.providers.map((p) => (
                            <option key={p.value} value={p.value}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Directly edit the underlying configuration JSON
                </span>
                {(() => {
                  try {
                    JSON.parse(jsonInput);
                    return (
                      <span className="text-[10px] text-green-500 font-bold uppercase">
                        Valid JSON
                      </span>
                    );
                  } catch (_error) {
                    return (
                      <span className="text-[10px] text-red-500 font-bold uppercase">
                        Invalid JSON
                      </span>
                    );
                  }
                })()}
              </div>
              <textarea
                aria-label="AI Configuration JSON Editor"
                value={jsonInput}
                onChange={(e) => handleJsonChange(e.target.value)}
                className="h-96 w-full rounded-lg border border-gray-300 bg-gray-50 p-4 font-mono text-xs focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                spellCheck={false}
              />
            </div>
          )}
        </div>
      </div>

      {/* Add Model Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={`Add Model to ${selectedProvider ? options.providers.find((p) => p.value === selectedProvider)?.label : ''}`}
        footer={
          <>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddModel}
              disabled={!addModelForm.modelKey || !addModelForm.modelName}
              className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Model
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="new-model-key"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Model Key *
            </label>
            <input
              id="new-model-key"
              type="text"
              value={addModelForm.modelKey}
              onChange={(e) =>
                setAddModelForm({ ...addModelForm, modelKey: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="e.g., fast, pro, turbo"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              A unique identifier for this model
            </p>
          </div>

          <div>
            <label
              htmlFor="new-model-name"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Model Name *
            </label>
            <input
              id="new-model-name"
              type="text"
              value={addModelForm.modelName}
              onChange={(e) =>
                setAddModelForm({ ...addModelForm, modelName: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              placeholder="e.g., gpt-4, gemini-2.5-flash"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              The actual model name from the provider
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="new-model-temperature"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Temperature
              </label>
              <input
                id="new-model-temperature"
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={addModelForm.temperature}
                onChange={(e) =>
                  setAddModelForm({
                    ...addModelForm,
                    temperature: Number.parseFloat(e.target.value),
                  })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label
                htmlFor="new-model-tokens"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Max Tokens
              </label>
              <input
                id="new-model-tokens"
                type="number"
                value={addModelForm.maxTokens}
                onChange={(e) =>
                  setAddModelForm({
                    ...addModelForm,
                    maxTokens: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="Auto"
              />
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};
