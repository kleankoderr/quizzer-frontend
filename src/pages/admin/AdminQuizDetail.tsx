import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Globe, LayoutList, Plus, Save, School, Settings, Trash2 } from 'lucide-react';
import { LoadingScreen } from '../../components/LoadingScreen';
import { useAdminQuizDetail } from '../../hooks/useAdminQuizDetail';
import { QuestionEditor } from './components/QuestionEditor';
import { DeleteModal } from '../../components/DeleteModal';
import { Modal } from '../../components/Modal';
import { Select } from '../../components/ui/Select';

export const AdminQuizDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'questions' | 'config'>(
    'questions'
  );

  const { state, actions } = useAdminQuizDetail(id);

  // Modal States
  const [deleteConfig, setDeleteConfig] = useState<{
    isOpen: boolean;
    index?: number;
    bulk?: boolean;
  }>({ isOpen: false });
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  if (state.isLoading) return <LoadingScreen message="Loading quiz details..." />;
  if (state.error || !state.adminQuiz)
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Quiz not found
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm">
          This quiz might have been deleted or the ID is incorrect.
        </p>
        <button
          onClick={() => navigate('/admin/quizzes')}
          className="flex items-center gap-2 px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to List
        </button>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/quizzes')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-all truncate">
              {state.title || state.adminQuiz.quiz.title}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                state.isActive 
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30'
              }`}>
                {state.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30">
                {state.scope}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowSaveConfirm(true)}
          disabled={state.isSaving}
          className="flex items-center justify-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-all font-bold text-sm shadow-sm"
        >
          {state.isSaving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {state.isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('questions')}
          className={`px-6 py-3 font-semibold text-sm transition-colors relative ${
            activeTab === 'questions'
              ? 'text-primary-600'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <LayoutList className="w-4 h-4" />
            Questions ({state.questions.length})
          </div>
          {activeTab === 'questions' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`px-6 py-3 font-semibold text-sm transition-colors relative ${
            activeTab === 'config'
              ? 'text-primary-600'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Config
          </div>
          {activeTab === 'config' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-t-full" />
          )}
        </button>
      </div>

      {activeTab === 'questions' ? (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  id="select-all"
                  type="checkbox"
                  checked={state.selectedQuestions.length === state.questions.length && state.questions.length > 0}
                  onChange={(e) => e.target.checked ? actions.selectAllQuestions() : actions.deselectAllQuestions()}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="select-all" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  {state.selectedQuestions.length > 0 ? `${state.selectedQuestions.length} selected` : 'Select All'}
                </label>
              </div>
              {state.selectedQuestions.length > 0 && (
                <button
                  onClick={() => setDeleteConfig({ isOpen: true, bulk: true })}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              )}
            </div>

            <button
              onClick={() => actions.addQuestion()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-sm font-bold"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </button>
          </div>

          <div className="space-y-4">
            {state.questions.map((q, index) => (
              <QuestionEditor
                key={q.id}
                index={index}
                question={q}
                isSelected={state.selectedQuestions.includes(index)}
                onSelect={() => actions.toggleSelectQuestion(index)}
                onDeselect={() => actions.toggleSelectQuestion(index)}
                onChange={(updates) => actions.updateQuestion(index, updates)}
                onDelete={() => setDeleteConfig({ isOpen: true, index })}
                onDuplicate={() => actions.duplicateQuestion(index)}
              />
            ))}
          </div>

          {state.questions.length === 0 && (
            <div className="text-center py-20 bg-gray-50 dark:bg-gray-800/20 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800">
              <LayoutList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Empty Quiz</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-xs mx-auto">
                No questions yet. Use the "Add Question" button to get started.
              </p>
              <button
                onClick={() => actions.addQuestion()}
                className="mt-6 flex items-center gap-2 mx-auto px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all font-bold"
              >
                <Plus className="w-4 h-4" />
                Add First Question
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">General Information</h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="title" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quiz Title</label>
                  <input
                    id="title"
                    type="text"
                    value={state.title}
                    onChange={(e) => actions.setTitle(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 focus:border-primary-500 outline-none dark:text-white font-medium"
                    placeholder="Enter title"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="topic" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Topic</label>
                  <input
                    id="topic"
                    type="text"
                    value={state.topic}
                    onChange={(e) => actions.setTopic(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 focus:border-primary-500 outline-none dark:text-white font-medium"
                    placeholder="Enter topic"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Visibility & Scope</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => actions.setScope('GLOBAL')}
                    className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      state.scope === 'GLOBAL'
                        ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-900/10'
                        : 'border-gray-100 dark:border-gray-800 text-gray-400'
                    }`}
                  >
                    <Globe className={`w-6 h-6 ${state.scope === 'GLOBAL' ? 'text-primary-600' : ''}`} />
                    <div className="text-center">
                      <span className={`block font-bold text-sm ${state.scope === 'GLOBAL' ? 'text-gray-900 dark:text-white' : ''}`}>Global</span>
                      <span className="text-[10px] uppercase font-bold text-gray-400">Public</span>
                    </div>
                  </button>

                  <button
                    onClick={() => actions.setScope('SCHOOL')}
                    className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      state.scope === 'SCHOOL'
                        ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-900/10'
                        : 'border-gray-100 dark:border-gray-800 text-gray-400'
                    }`}
                  >
                    <School className={`w-6 h-6 ${state.scope === 'SCHOOL' ? 'text-primary-600' : ''}`} />
                    <div className="text-center">
                      <span className={`block font-bold text-sm ${state.scope === 'SCHOOL' ? 'text-gray-900 dark:text-white' : ''}`}>School</span>
                      <span className="text-[10px] uppercase font-bold text-gray-400">Restricted</span>
                    </div>
                  </button>
                </div>

                {state.scope === 'SCHOOL' && (
                  <div className="space-y-1.5 group animate-in slide-in-from-top-2">
                    <label htmlFor="school" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select School</label>
                    <Select
                      id="school"
                      value={state.schoolId}
                      onChange={actions.setSchoolId}
                      options={[
                        { label: 'Select institution...', value: '' },
                        ...state.schools.map((s) => ({
                          label: s.name,
                          value: s.id,
                        })),
                      ]}
                      prefixIcon={<School className="w-5 h-5" />}
                    />
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Settings</h3>
              <div className="flex items-center justify-between py-3 border-t border-gray-50 dark:border-gray-800">
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Status</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={state.isActive}
                  onClick={() => actions.setIsActive(!state.isActive)}
                  className="relative inline-flex items-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-full"
                >
                  <span className="sr-only">Toggle quiz status</span>
                  <div className={`w-11 h-6 rounded-full transition-all duration-200 ${
                    state.isActive ? 'bg-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-gray-200 dark:bg-gray-700'
                  }`}>
                    <div className={`absolute top-[2px] left-[2px] bg-white rounded-full h-5 w-5 transition-transform duration-200 shadow-sm ${
                      state.isActive ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </div>
                </button>
              </div>
              <div className="flex items-center justify-between py-3 border-t border-gray-50 dark:border-gray-800">
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Questions</span>
                <span className="text-sm font-bold dark:text-white">{state.questions.length}</span>
              </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/30">
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-normal">
                Changes are not saved automatically. Remember to click the <strong>Save</strong> button when done.
              </p>
            </div>
          </aside>
        </div>
      )}

      <DeleteModal
        isOpen={deleteConfig.isOpen}
        onClose={() => setDeleteConfig({ isOpen: false })}
        onConfirm={() => {
          if (deleteConfig.bulk) {
            actions.bulkDelete();
          } else if (deleteConfig.index !== undefined) {
            actions.deleteQuestion(deleteConfig.index);
          }
          setDeleteConfig({ isOpen: false });
        }}
        title={deleteConfig.bulk ? "Delete Questions" : "Delete Question"}
        message={deleteConfig.bulk ? `Are you sure you want to delete ${state.selectedQuestions.length} questions?` : "Are you sure you want to delete this question?"}
      />

      <Modal
        isOpen={showSaveConfirm}
        onClose={() => setShowSaveConfirm(false)}
        title="Save Changes"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              onClick={() => setShowSaveConfirm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                actions.handleSave();
                setShowSaveConfirm(false);
              }}
              className="px-6 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-all shadow-sm"
            >
              Save Now
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-400 py-2">
          Are you sure you want to save the changes to this quiz? All updates will be pushed to the system immediately.
        </p>
      </Modal>
    </div>
  );
};
