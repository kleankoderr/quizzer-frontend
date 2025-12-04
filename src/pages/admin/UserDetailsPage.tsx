import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Shield,
  Activity,
  BookOpen,
  Layers,
  Trophy,
  Target,
  TrendingUp,
  Clock,
  Award,
  Trash2,
  FileText,
} from "lucide-react";
import { adminService } from "../../services/adminService";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { Modal } from "../../components/Modal";
import { CardSkeleton } from "../../components/skeletons/CardSkeleton";
import { StatCardSkeleton } from "../../components/skeletons/StatCardSkeleton";
import { TableSkeleton } from "../../components/skeletons/TableSkeleton";

type ContentType = "all" | "quiz" | "flashcard" | "content";

export default function UserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [contentType, setContentType] = useState<ContentType>("all");
  const [page, setPage] = useState(1);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    confirmColor?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const { data: user, isLoading } = useQuery({
    queryKey: ["userDetails", id],
    queryFn: () => adminService.getUserDetails(id!),
    enabled: !!id,
  });

  const { data: userContent, isLoading: contentLoading } = useQuery({
    queryKey: ["userContent", id, contentType, page],
    queryFn: () =>
      adminService.getUserContent(id!, { type: contentType, page, limit: 10 }),
    enabled: !!id,
  });

  const deleteUserMutation = useMutation({
    mutationFn: adminService.deleteUser,
    onSuccess: () => {
      toast.success("User deleted successfully");
      navigate("/admin/users");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete user");
      closeModal();
    },
  });

  const deleteQuizMutation = useMutation({
    mutationFn: adminService.deleteQuiz,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["userContent"] });
      await queryClient.invalidateQueries({ queryKey: ["userDetails"] });
      toast.success("Quiz deleted successfully");
      closeModal();
    },
    onError: () => {
      toast.error("Failed to delete quiz");
      closeModal();
    },
  });

  const deleteFlashcardMutation = useMutation({
    mutationFn: adminService.deleteFlashcard,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["userContent"] });
      await queryClient.invalidateQueries({ queryKey: ["userDetails"] });
      toast.success("Flashcard set deleted successfully");
      closeModal();
    },
    onError: () => {
      toast.error("Failed to delete flashcard set");
      closeModal();
    },
  });

  const deleteContentMutation = useMutation({
    mutationFn: adminService.deleteContent,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["userContent"] });
      await queryClient.invalidateQueries({ queryKey: ["userDetails"] });
      toast.success("Content deleted successfully");
      closeModal();
    },
    onError: () => {
      toast.error("Failed to delete content");
      closeModal();
    },
  });

  const closeModal = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const handleDeleteUser = () => {
    setModalConfig({
      isOpen: true,
      title: "Delete User",
      message: `Are you sure you want to delete ${user?.name}? This will delete all their content and cannot be undone.`,
      confirmText: "Delete User",
      confirmColor: "bg-red-600 hover:bg-red-700",
      onConfirm: () => deleteUserMutation.mutate(id!),
    });
  };

  const handleDeleteContent = (itemId: string, type: string, title: string) => {
    const typeLabels: Record<string, string> = {
      quiz: "quiz",
      flashcard: "flashcard set",
      content: "study material",
    };

    setModalConfig({
      isOpen: true,
      title: `Delete ${typeLabels[type]}`,
      message: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      confirmText: "Delete",
      confirmColor: "bg-red-600 hover:bg-red-700",
      onConfirm: () => {
        if (type === "quiz") deleteQuizMutation.mutate(itemId);
        else if (type === "flashcard") deleteFlashcardMutation.mutate(itemId);
        else if (type === "content") deleteContentMutation.mutate(itemId);
      },
    });
  };

  const contentTabs = [
    { id: "all" as ContentType, label: "All", icon: FileText },
    { id: "quiz" as ContentType, label: "Quizzes", icon: BookOpen },
    { id: "flashcard" as ContentType, label: "Flashcards", icon: Layers },
    { id: "content" as ContentType, label: "Study Materials", icon: FileText },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/users")}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            User Details
          </h1>
        </div>
        <CardSkeleton count={1} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCardSkeleton count={4} />
        </div>
        <CardSkeleton count={1} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header with Delete Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/admin/users")}
            className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            User Details
          </h1>
        </div>
        {user.role !== "SUPER_ADMIN" && (
          <button
            onClick={handleDeleteUser}
            disabled={deleteUserMutation.isPending}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleteUserMutation.isPending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete User
              </>
            )}
          </button>
        )}
      </div>

      {/* User Profile Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-20 w-20 rounded-full"
              />
            ) : (
              <span className="text-3xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user.name}
            </h2>
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4" />
                <span>
                  Joined {format(new Date(user.createdAt), "MMMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    user.role === "SUPER_ADMIN"
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                      : user.role === "ADMIN"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {user.role.replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    user.isActive
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {user.isActive ? "Active" : "Suspended"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        {(user.schoolName || user.grade) && (
          <div className="mt-6 grid gap-4 border-t border-gray-200 pt-6 dark:border-gray-700 sm:grid-cols-2">
            {user.schoolName && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  School
                </p>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {user.schoolName}
                </p>
              </div>
            )}
            {user.grade && (
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Grade
                </p>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {user.grade}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Activity Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
              <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Quizzes
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {user._count?.quizzes || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
              <Layers className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Flashcards
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {user._count?.flashcardSets || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-orange-100 p-3 dark:bg-orange-900/30">
              <Target className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Attempts
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {user._count?.attempts || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900/30">
              <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Study Materials
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {user._count?.contents || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User Content Section */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 p-6 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            User Content
          </h3>
        </div>

        {/* Content Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8 px-6">
            {contentTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setContentType(tab.id);
                    setPage(1);
                  }}
                  className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                    contentType === tab.id
                      ? "border-primary-500 text-primary-600 dark:text-primary-400"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <tr>
                <th className="px-6 py-4 font-medium">Title</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Topic</th>
                <th className="px-6 py-4 font-medium">Created</th>
                <th className="px-6 py-4 font-medium">Attempts</th>
                <th className="px-6 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {contentLoading ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <TableSkeleton rows={10} columns={6} />
                  </td>
                </tr>
              ) : userContent?.data?.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No content found
                  </td>
                </tr>
              ) : (
                userContent?.data?.map((item: any) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {item.title}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {item.topic || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {format(new Date(item.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {item._count?.attempts || 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() =>
                          handleDeleteContent(item.id, item.type, item.title)
                        }
                        className="p-1.5 rounded-lg text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {userContent?.meta && userContent.meta.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200 px-4 sm:px-6 py-4 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left">
              Showing <span className="font-medium">{(page - 1) * 10 + 1}</span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(page * 10, userContent.meta.total)}
              </span>{" "}
              of <span className="font-medium">{userContent.meta.total}</span>{" "}
              results
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-300 px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-700 dark:text-white"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setPage((p) => Math.min(userContent.meta.totalPages, p + 1))
                }
                disabled={page === userContent.meta.totalPages}
                className="rounded-lg border border-gray-300 px-3 py-1 text-sm disabled:opacity-50 dark:border-gray-700 dark:text-white"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Streak Information */}
      {user.streak && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Streak & Progress
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-100 p-3 dark:bg-yellow-900/30">
                <Trophy className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Current Streak
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {user.streak.currentStreak} days
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-3 dark:bg-red-900/30">
                <Award className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Longest Streak
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {user.streak.longestStreak} days
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-100 p-3 dark:bg-indigo-900/30">
                <TrendingUp className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total XP
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {user.streak.totalXP} XP
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Clock className="h-4 w-4" />
            <span>
              Last activity:{" "}
              {format(new Date(user.streak.lastActivityDate), "MMMM d, yyyy")}
            </span>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {user.recentActivity && user.recentActivity.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h3>
          <div className="space-y-3">
            {user.recentActivity.map((activity: any) => (
              <div
                key={activity.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
                    {activity.type === "quiz" ? (
                      <BookOpen className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <Layers className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {activity.quiz?.title ||
                        activity.flashcardSet?.title ||
                        "Unknown"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {activity.type === "quiz" ? "Quiz" : "Flashcard"} •{" "}
                      {format(new Date(activity.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                {activity.score !== null && activity.totalQuestions && (
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {activity.score}/{activity.totalQuestions}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {Math.round(
                        (activity.score / activity.totalQuestions) * 100,
                      )}
                      %
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        title={modalConfig.title}
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={closeModal}
              disabled={
                deleteUserMutation.isPending ||
                deleteQuizMutation.isPending ||
                deleteFlashcardMutation.isPending ||
                deleteContentMutation.isPending
              }
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={modalConfig.onConfirm}
              disabled={
                deleteUserMutation.isPending ||
                deleteQuizMutation.isPending ||
                deleteFlashcardMutation.isPending ||
                deleteContentMutation.isPending
              }
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${modalConfig.confirmColor || "bg-primary-600 hover:bg-primary-700"}`}
            >
              {deleteUserMutation.isPending ||
              deleteQuizMutation.isPending ||
              deleteFlashcardMutation.isPending ||
              deleteContentMutation.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Deleting...
                </>
              ) : (
                modalConfig.confirmText || "Confirm"
              )}
            </button>
          </div>
        }
      >
        <p>{modalConfig.message}</p>
      </Modal>
    </div>
  );
}
