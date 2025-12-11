import { ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface ChallengeProgressCardProps {
  challengeId: string;
  challengeResult: any;
}

export const ChallengeProgressCard = ({
  challengeId,
  challengeResult,
}: ChallengeProgressCardProps) => {
  const navigate = useNavigate();

  return (
    <div className="card dark:bg-gray-800 p-4 sm:p-6 bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-primary-900/20 dark:to-indigo-900/20 border-primary-200 dark:border-primary-800">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white mb-1">
            Challenge Progress
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Quiz {challengeResult.currentQuizIndex} of{' '}
            {challengeResult.totalQuizzes} completed
          </p>
        </div>
        <button
          onClick={async () => {
            try {
              const { challengeService } = await import('../../services');
              const challenge =
                await challengeService.getChallengeById(challengeId);
              const nextQuiz =
                challenge.quizzes?.[challengeResult.currentQuizIndex];
              if (nextQuiz) {
                navigate(`/quiz/${nextQuiz.quizId}?challengeId=${challengeId}`);
              }
            } catch {
              toast.error('Failed to load next quiz');
            }
          }}
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl"
        >
          <span>Continue to Next Quiz</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
