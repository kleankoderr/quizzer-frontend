import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Brain, Sparkles, Code, Save } from "lucide-react";
import { adminService } from "../../services/adminService";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";

const DEFAULT_PROMPTS = {
  quiz: `Generate a quiz with multiple-choice questions based on the following content. Each question should have 4 options with only one correct answer.`,
  flashcard: `Generate flashcards from the following content. Each flashcard should have a clear question on the front and a concise answer on the back.`,
  content: `Generate comprehensive study material on the following topic. Include key concepts, explanations, and examples.`,
};

export const AiAnalytics = () => {
  const queryClient = useQueryClient();
  const [prompts, setPrompts] = useState(DEFAULT_PROMPTS);
  const [activeTab, setActiveTab] = useState<"stats" | "prompts">("stats");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["aiAnalytics"],
    queryFn: adminService.getAiAnalytics,
  });

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["platformSettings"],
    queryFn: adminService.getSettings,
  });

  useEffect(() => {
    if (settings?.aiPrompts) {
      setPrompts({ ...DEFAULT_PROMPTS, ...settings.aiPrompts });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => adminService.updateSettings(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["platformSettings"] });
      toast.success("AI prompts updated successfully");
    },
    onError: () => {
      toast.error("Failed to update AI prompts");
    },
  });

  const handleSavePrompts = () => {
    updateMutation.mutate({
      ...settings,
      aiPrompts: prompts,
    });
  };

  if (statsLoading || settingsLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Generations",
      value: stats?.totalGenerations || 0,
      icon: Brain,
      color: "bg-purple-500",
    },
    {
      title: "Failed Generations",
      value: stats?.failedGenerations || 0,
      icon: Sparkles,
      color: "bg-red-500",
    },
    {
      title: "Success Rate",
      value: `${stats?.successRate?.toFixed(1) || 0}%`,
      icon: Sparkles,
      color: "bg-green-500",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Generation Management
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("stats")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "stats"
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            Statistics
          </button>
          <button
            onClick={() => setActiveTab("prompts")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "prompts"
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            Prompts
          </button>
        </div>
      </div>

      {activeTab === "stats" ? (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {statCards.map((stat, index) => (
              <div
                key={index}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {stat.title}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`rounded-lg p-3 ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Generation Breakdown by Type
            </h2>
            <div className="space-y-3">
              {stats?.breakdown?.map((item: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                      <Code className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.type}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Generations
                      </p>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Prompt Configuration
            </h2>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Customize the prompts used for content generation. These prompts
              will be used when generating quizzes, flashcards, and study
              content.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quiz Generation Prompt
                </label>
                <textarea
                  value={prompts.quiz}
                  onChange={(e) =>
                    setPrompts({ ...prompts, quiz: e.target.value })
                  }
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="Enter quiz generation prompt..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Flashcard Generation Prompt
                </label>
                <textarea
                  value={prompts.flashcard}
                  onChange={(e) =>
                    setPrompts({ ...prompts, flashcard: e.target.value })
                  }
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="Enter flashcard generation prompt..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content Generation Prompt
                </label>
                <textarea
                  value={prompts.content}
                  onChange={(e) =>
                    setPrompts({ ...prompts, content: e.target.value })
                  }
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  placeholder="Enter content generation prompt..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSavePrompts}
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {updateMutation.isPending ? "Saving..." : "Save Prompts"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
