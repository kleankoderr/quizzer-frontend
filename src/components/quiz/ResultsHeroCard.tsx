import { useMemo, useRef } from 'react';
import {
  Trophy,
  Share2,
  Target,
  Award,
  ArrowLeft,
  RotateCcw,
  Eye,
  BookOpen,
} from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { toPng } from 'html-to-image';
import { Toast as toast } from '../../utils/toast';

// Constants
const SCORE_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 70,
  PASS: 50,
} as const;

// Helper functions
const getGradeInfo = (score: number, context: 'quiz' | 'challenge' | 'flashcard' = 'quiz', title?: string) => {
  const fallbackTitle = context === 'flashcard' ? 'these cards' : `this ${context}`;

  if (score >= SCORE_THRESHOLDS.EXCELLENT) {
    return {
      color: 'text-emerald-400',
      grade: 'A+',
      message: 'Outstanding Performance!',
      descriptionPrefix: "You've mastered ",
      descriptionSuffix: '!',
      titleDisplay: title || fallbackTitle,
    };
  }
  if (score >= SCORE_THRESHOLDS.GOOD) {
    return {
      color: 'text-blue-400',
      grade: 'A',
      message: 'Great Job!',
      descriptionPrefix: 'Strong performance in ',
      descriptionSuffix: '!',
      titleDisplay: title || fallbackTitle,
    };
  }
  if (score >= SCORE_THRESHOLDS.PASS) {
    return {
      color: 'text-amber-400',
      grade: 'B',
      message: 'Well Done!',
      descriptionPrefix: 'Good effort! Keep practicing ',
      descriptionSuffix: '.',
      titleDisplay: title || fallbackTitle,
    };
  }
  return {
    color: 'text-rose-400',
    grade: 'C',
    message: context === 'flashcard' ? 'Session Completed' : context === 'challenge' ? 'Challenge Completed' : 'Quiz Completed',
    descriptionPrefix: 'Review ',
    descriptionSuffix: ' and try again.',
    titleDisplay: title || fallbackTitle,
  };
};

const getGradeColorHex = (grade: string) => {
  switch (grade) {
    case 'A+':
      return '#34d399'; // emerald-400
    case 'A':
      return '#60a5fa'; // blue-400
    case 'B':
      return '#fbbf24'; // amber-400
    case 'C':
      return '#fb7185'; // rose-400
    default:
      return '#ffffff';
  }
};

export interface ResultsStat {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
  valueColor: string;
}

export interface ResultsHeroCardProps {
  /** Final score percentage (0-100) */
  score: number;
  /** Total score (e.g., 8 out of 10) */
  totalScore: number;
  /** Total questions */
  totalQuestions: number;
  /** User's name to display in congratulations message */
  userName?: string;
  /** Title of the quiz/challenge/flashcard set */
  title?: string;
  /** Optional stats to display (if not provided, only Score and Grade will be shown) */
  stats?: ResultsStat[];
  /** Whether to show confetti animation */
  showConfetti?: boolean;
  /** Optional back button handler */
  onBack?: () => void;
  /** Back button label */
  backLabel?: string;
  /** Optional share handler (if not provided, default share will be used) */
  onShare?: () => Promise<void>;
  /** ID for share functionality (used in default share) */
  shareId?: string;
  /** Title for share functionality */
  shareTitle?: string;
  /** Whether sharing is in progress */
  isSharing?: boolean;
  /** Custom description to override default grade-based description */
  customDescription?: string;
  /** Custom title to override default "completed the challenge" message */
  customTitle?: string;
  /** Type of completion - 'challenge' or 'quiz' (defaults to 'quiz') */
  completionType?: 'challenge' | 'quiz';
  /** Content context for descriptions - 'quiz', 'challenge', or 'flashcard' (defaults to completionType) */
  contentContext?: 'quiz' | 'challenge' | 'flashcard';
  /** Callback for retaking the quiz/flashcard session */
  onRetake?: () => void;
  /** Callback for reviewing answers */
  onReview?: () => void;
  /** Callback for navigating to study pack */
  onStudyPackClick?: () => void;
  /** Title of the study pack to display in button label */
  studyPackTitle?: string;
}

export const ResultsHeroCard = ({
                                  score,
                                  totalScore,
                                  totalQuestions,
                                  userName,
                                  title,
                                  stats,
                                  showConfetti = false,
                                  onBack,
                                  backLabel = 'Back',
                                  onShare,
                                  shareId,
                                  shareTitle,
                                  isSharing = false,
                                  customDescription,
                                  customTitle,
                                  completionType = 'quiz',
                                  contentContext,
                                  onRetake,
                                  onReview,
                                  onStudyPackClick,
                                  studyPackTitle,
                                }: ResultsHeroCardProps) => {
  const { width, height } = useWindowSize();
  const resultsRef = useRef<HTMLDivElement>(null);

  // Extract first name from userName
  const firstName = userName ? userName.split(' ')[0] : undefined;

  // Use contentContext if provided, otherwise fall back to completionType
  const context = contentContext || (completionType === 'challenge' ? 'challenge' : 'quiz');
  const gradeInfo = useMemo(() => getGradeInfo(score, context, title), [score, context, title]);

  // Helper to get retake button label based on context
  const getRetakeLabel = () => {
    if (context === 'flashcard') return 'Restart Flashcards';
    if (context === 'challenge') return 'Retry Challenge';
    return 'Retake Quiz';
  };

  // Default stats if none provided
  const defaultStats: ResultsStat[] = useMemo(
    () => [
      {
        icon: Target,
        label: 'Score',
        value: `${totalScore}/${totalQuestions}`,
        color: 'text-green-200',
        valueColor: 'text-white',
      },
      {
        icon: Award,
        label: 'Grade',
        value: gradeInfo.grade,
        color: gradeInfo.color,
        valueColor: gradeInfo.color,
      },
    ],
    [totalScore, totalQuestions, gradeInfo],
  );

  const displayStats = stats || defaultStats;

  // Default share handler
  const handleDefaultShare = async () => {
    if (!resultsRef.current || isSharing) return;

    try {
      const dataUrl = await toPng(resultsRef.current, {
        cacheBust: true,
        filter: (node) => {
          return !(
            node instanceof HTMLElement && node.dataset.html2canvasIgnore
          );
        },
      });

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `result-${shareId || 'quiz'}.png`, {
        type: 'image/png',
      });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: shareTitle || 'Quiz Results',
          text: `I just completed "${shareTitle || 'a quiz'}" on Quizzer! Score: ${score}%`,
        });
      } else {
        const link = document.createElement('a');
        link.download = `result-${shareId || 'quiz'}.png`;
        link.href = dataUrl;
        link.click();
        toast.success('Image saved to device!');
      }
    } catch (error) {
      // Ignore abort errors which happen when user cancels share
      if (error instanceof Error && error.name === 'AbortError') return;

      toast.error('Failed to share results');
    }
  };

  const handleShare = onShare || handleDefaultShare;

  return (
    <>
      {/* Confetti */}
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
        />
      )}

      {/* Results Hero */}
      <div
        ref={resultsRef}
        className="relative overflow-hidden rounded-3xl bg-primary-600 dark:bg-primary-900 shadow-xl border border-primary-500/30"
      >
        {/* Background Lighting */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-white opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div
            className="absolute bottom-0 left-0 w-[20rem] h-[20rem] bg-white opacity-[0.03] rounded-full blur-2xl translate-y-1/3 -translate-x-1/3" />
        </div>

        <div className="relative z-10 px-6 py-8 md:p-12">
          {/* Back Button */}
          {onBack && (
            <div className="absolute top-4 left-4 md:top-6 md:left-6">
              <button
                onClick={onBack}
                data-html2canvas-ignore="true"
                className="p-2 md:px-4 md:py-2 bg-white/10 hover:bg-white/20 rounded-full md:rounded-xl text-white transition-all flex items-center gap-2 border border-white/10"
                aria-label={backLabel}
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden md:inline font-medium text-sm">
                  {backLabel}
                </span>
              </button>
            </div>
          )}

          {/* Share Button */}
          {(onShare || shareId) && (
            <div className="absolute top-4 right-4 md:top-6 md:right-6">
              <button
                onClick={handleShare}
                disabled={isSharing}
                data-html2canvas-ignore="true"
                className={`p-2 md:px-4 md:py-2 bg-white/10 hover:bg-white/20 rounded-full md:rounded-xl text-white transition-all flex items-center gap-2 border border-white/10 ${isSharing ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label="Share Results"
              >
                <Share2 className="w-5 h-5" />
                <span className="hidden md:inline font-medium text-sm">
                  {isSharing ? 'Sharing...' : 'Share'}
                </span>
              </button>
            </div>
          )}

          {/* Hero Content */}
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* Trophy Icon */}
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-white/20 blur-xl rounded-full" />
              <div
                className="relative inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/10 border border-white/20 shadow-2xl animate-float">
                <Trophy className="w-8 h-8 md:w-10 md:h-10 text-white drop-shadow-lg" />
              </div>
            </div>

            <h1 className="text-xl md:text-3xl font-semibold text-white mb-2 tracking-tight">
              {customTitle ? (
                customTitle
              ) : (
                <>
                  Congratulations
                  {firstName && (
                    <>
                      {' '}
                      <span className="text-blue-200 font-bold">{firstName}</span>
                      ,
                    </>
                  )}
                  {firstName ? '' : '!'}
                  {' you\'ve completed the '}
                  {completionType === 'challenge' ? 'challenge' : 'quiz'}!
                </>
              )}
            </h1>
            <p className="text-primary-100 text-sm md:text-lg mb-6 md:mb-10 max-w-xl mx-auto leading-relaxed">
              {customDescription ? (
                customDescription
              ) : (
                <>
                  {gradeInfo.descriptionPrefix}
                  <span className="text-blue-200 font-semibold">{gradeInfo.titleDisplay}</span>
                  {gradeInfo.descriptionSuffix}
                </>
              )}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 w-full items-center">
              {/* Circular Progress */}
              <div className="flex flex-col items-center justify-center order-1 md:order-none">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/5 blur-2xl rounded-full transform scale-110" />

                  <svg className="transform -rotate-90 w-40 h-40 md:w-48 md:h-48 drop-shadow-xl relative z-10">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="42%"
                      stroke="currentColor"
                      strokeWidth="10"
                      fill="transparent"
                      className="text-white/10"
                    />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="42%"
                      stroke={getGradeColorHex(gradeInfo.grade)}
                      strokeWidth="10"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * (window.innerWidth < 768 ? 80 : 96)}`}
                      style={{
                        strokeDasharray: '280',
                        strokeDashoffset: `${280 * (1 - score / 100)}`,
                      }}
                      pathLength={280}
                      className={`${gradeInfo.color} transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor]`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                    <span className="text-4xl md:text-5xl font-bold tracking-tighter text-white">
                      {score}%
                    </span>
                    <span className="text-xs font-medium text-white/70 uppercase tracking-widest mt-1">
                      Final Score
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 md:gap-4 w-full order-2 md:order-none">
                {displayStats.map((stat, idx) => (
                  <div
                    key={idx}
                    className="bg-white/10 rounded-2xl p-4 md:p-5 flex flex-col justify-between border border-white/5 hover:bg-white/15 transition-colors group"
                  >
                    <div className="flex items-center gap-2 mb-2 text-primary-100">
                      <stat.icon
                        className={`w-4 h-4 ${stat.color} opacity-80`}
                      />
                      <span className="text-xs font-medium uppercase tracking-wider opacity-70">
                        {stat.label}
                      </span>
                    </div>
                    <div
                      className={`text-xl md:text-2xl font-bold tracking-tight ${stat.valueColor}`}
                    >
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            {(onReview || onRetake || onStudyPackClick) && (
              <div
                data-html2canvas-ignore="true"
                className="mt-8 md:mt-10 flex flex-col md:flex-row gap-3 md:gap-4 w-full max-w-2xl mx-auto"
              >
                {/* Review Answers Button */}
                {onReview && (
                  <button
                    onClick={onReview}
                    className="flex-1 px-6 py-3.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Eye className="w-5 h-5" />
                    <span>
                      {context === 'flashcard' ? 'Review Cards' : 'Review Answers'}
                    </span>
                  </button>
                )}

                {/* Retake/Restart Button */}
                {onRetake && (
                  <button
                    onClick={onRetake}
                    className="flex-1 px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 border border-white/20 hover:border-white/30 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span>{getRetakeLabel()}</span>
                  </button>
                )}

                {/* Back to Study Pack Button */}
                {onStudyPackClick && (
                  <button
                    onClick={onStudyPackClick}
                    className="flex-1 px-6 py-3.5 bg-transparent hover:bg-white/10 text-white/90 hover:text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>
                      {studyPackTitle ? `Back to ${studyPackTitle}` : 'Back to Study Pack'}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
