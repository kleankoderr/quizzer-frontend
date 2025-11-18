import { useState } from 'react';
import type { QuizQuestion, AnswerValue } from '../types';

interface QuestionRendererProps {
  question: QuizQuestion;
  questionIndex: number;
  selectedAnswer: AnswerValue | null;
  onAnswerSelect: (answer: AnswerValue) => void;
  showResults?: boolean;
  correctAnswer?: AnswerValue;
}

export const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  questionIndex,
  selectedAnswer,
  onAnswerSelect,
  showResults = false,
  correctAnswer,
}) => {
  const [matchingAnswers, setMatchingAnswers] = useState<{ [key: string]: string }>({});
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  const renderTrueFalse = () => (
    <div className="space-y-3">
      {question.options?.map((option, index) => {
        const isSelected = selectedAnswer === index;
        const isCorrect = showResults && correctAnswer === index;
        const isWrong = showResults && isSelected && selectedAnswer !== correctAnswer;

        return (
          <button
            key={index}
            onClick={() => !showResults && onAnswerSelect(index)}
            disabled={showResults}
            className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 group ${
              isCorrect
                ? 'border-green-500 bg-green-50'
                : isWrong
                ? 'border-red-500 bg-red-50'
                : isSelected
                ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md scale-[1.02]'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                  isCorrect
                    ? 'bg-green-500 text-white'
                    : isWrong
                    ? 'bg-red-500 text-white'
                    : isSelected
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 group-hover:bg-blue-100 group-hover:text-blue-700'
                }`}
              >
                {option === 'True' ? 'T' : 'F'}
              </span>
              <span className="text-base">{option}</span>
              {showResults && isCorrect && (
                <span className="ml-auto text-green-700 font-semibold">✓ Correct</span>
              )}
              {showResults && isWrong && (
                <span className="ml-auto text-red-700 font-semibold">✗ Your answer</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );

  const renderSingleSelect = () => (
    <div className="space-y-3">
      {question.options?.map((option, index) => {
        const isSelected = selectedAnswer === index;
        const isCorrect = showResults && correctAnswer === index;
        const isWrong = showResults && isSelected && selectedAnswer !== correctAnswer;

        return (
          <button
            key={index}
            onClick={() => !showResults && onAnswerSelect(index)}
            disabled={showResults}
            className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 group ${
              isCorrect
                ? 'border-green-500 bg-green-50'
                : isWrong
                ? 'border-red-500 bg-red-50'
                : isSelected
                ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md scale-[1.02]'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                  isCorrect
                    ? 'bg-green-500 text-white'
                    : isWrong
                    ? 'bg-red-500 text-white'
                    : isSelected
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 group-hover:bg-blue-100 group-hover:text-blue-700'
                }`}
              >
                {String.fromCharCode(65 + index)}
              </span>
              <span className="text-base">{option}</span>
              {showResults && isCorrect && (
                <span className="ml-auto text-green-700 font-semibold">✓ Correct</span>
              )}
              {showResults && isWrong && (
                <span className="ml-auto text-red-700 font-semibold">✗ Your answer</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );

  const renderMultiSelect = () => {
    const selectedIndices = Array.isArray(selectedAnswer) ? selectedAnswer : [];
    const correctIndices = Array.isArray(correctAnswer) ? correctAnswer : [];

    const toggleOption = (index: number) => {
      if (showResults) return;
      
      const newSelection = selectedIndices.includes(index)
        ? selectedIndices.filter((i) => i !== index)
        : [...selectedIndices, index];
      onAnswerSelect(newSelection);
    };

    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-600 mb-3 font-medium">
          Select all that apply:
        </p>
        <div className="space-y-3">
          {question.options?.map((option, index) => {
            const isSelected = selectedIndices.includes(index);
            const shouldBeSelected = correctIndices.includes(index);
            const isCorrectlySelected = showResults && isSelected && shouldBeSelected;
            const isWronglySelected = showResults && isSelected && !shouldBeSelected;
            const isMissed = showResults && !isSelected && shouldBeSelected;

            return (
              <button
                key={index}
                onClick={() => toggleOption(index)}
                disabled={showResults}
                className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 group ${
                  isCorrectlySelected
                    ? 'border-green-500 bg-green-50'
                    : isWronglySelected
                    ? 'border-red-500 bg-red-50'
                    : isMissed
                    ? 'border-orange-500 bg-orange-50'
                    : isSelected
                    ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center text-sm transition-colors ${
                      isCorrectlySelected
                        ? 'bg-green-500 border-green-600 text-white'
                        : isWronglySelected
                        ? 'bg-red-500 border-red-600 text-white'
                        : isMissed
                        ? 'bg-orange-500 border-orange-600 text-white'
                        : isSelected
                        ? 'bg-blue-500 border-blue-600 text-white'
                        : 'bg-white border-gray-300 group-hover:border-blue-400'
                    }`}
                  >
                    {(isSelected || isMissed) && '✓'}
                  </span>
                  <span className="text-base">{option}</span>
                  {isMissed && (
                    <span className="ml-auto text-orange-700 font-semibold">⚠ Missed</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMatching = () => {
    const leftItems = question.leftColumn || [];
    const rightItems = question.rightColumn || [];
    const correctMatches = typeof correctAnswer === 'object' && !Array.isArray(correctAnswer) 
      ? correctAnswer 
      : {};
    const hasCorrectAnswer = correctAnswer !== undefined;

    const handleMatchClick = (leftItem: string, rightItem: string) => {
      if (showResults) return;
      
      const currentMatches = typeof selectedAnswer === 'object' && selectedAnswer !== null && !Array.isArray(selectedAnswer)
        ? selectedAnswer
        : {};
      
      const newMatches = { ...currentMatches, [leftItem]: rightItem };
      setMatchingAnswers(newMatches);
      onAnswerSelect(newMatches);
    };

    const handleUnselect = (leftItem: string) => {
      if (showResults) return;
      
      const currentMatches = typeof selectedAnswer === 'object' && selectedAnswer !== null && !Array.isArray(selectedAnswer)
        ? selectedAnswer
        : {};
      
      const newMatches = { ...currentMatches };
      delete newMatches[leftItem];
      setMatchingAnswers(newMatches);
      onAnswerSelect(newMatches);
    };

    const currentMatches = typeof selectedAnswer === 'object' && selectedAnswer !== null && !Array.isArray(selectedAnswer)
      ? selectedAnswer
      : {};

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Items to Match</h3>
            </div>
            {leftItems.map((leftItem, index) => {
              const userMatch = currentMatches[leftItem];
              const correctMatch = correctMatches[leftItem];
              const isCorrect = showResults && hasCorrectAnswer && userMatch === correctMatch;
              const isWrong = showResults && hasCorrectAnswer && userMatch && userMatch !== correctMatch;
              const isSelected = !showResults && selectedLeft === leftItem;

              return (
                <button
                  key={index}
                  onClick={() => {
                    if (showResults) return;
                    if (userMatch) {
                      // Unselect if already matched
                      handleUnselect(leftItem);
                      setSelectedLeft(null);
                    } else {
                      // Select this left item
                      setSelectedLeft(leftItem);
                    }
                  }}
                  disabled={showResults}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    isCorrect
                      ? 'border-green-500 bg-green-50 shadow-md'
                      : isWrong
                      ? 'border-red-500 bg-red-50 shadow-md'
                      : isSelected
                      ? 'border-blue-500 bg-blue-100 shadow-lg scale-[1.02] ring-2 ring-blue-300'
                      : userMatch
                      ? 'border-blue-400 bg-blue-50 shadow-sm hover:shadow-md cursor-pointer'
                      : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50 hover:shadow-sm cursor-pointer'
                  } ${showResults ? 'cursor-default' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                      isCorrect
                        ? 'bg-green-500 text-white'
                        : isWrong
                        ? 'bg-red-500 text-white'
                        : isSelected
                        ? 'bg-blue-600 text-white'
                        : userMatch
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-1">{leftItem}</div>
                      {userMatch && (
                        <div className="flex items-center gap-2 mt-2 text-sm">
                          <span className={`font-medium px-2 py-1 rounded ${
                            isCorrect 
                              ? 'bg-green-200 text-green-800' 
                              : isWrong 
                              ? 'bg-red-200 text-red-800' 
                              : 'bg-blue-200 text-blue-800'
                          }`}>
                            → {userMatch}
                          </span>
                          {!showResults && (
                            <span className="text-xs text-gray-500 italic">(click to change)</span>
                          )}
                        </div>
                      )}
                      {isSelected && !userMatch && (
                        <div className="text-xs text-blue-600 font-medium mt-1 animate-pulse">
                          ← Now select a match from the right
                        </div>
                      )}
                    </div>
                  </div>
                  {showResults && hasCorrectAnswer && isWrong && (
                    <div className="mt-3 pt-3 border-t border-red-200">
                      <div className="text-sm text-red-700">
                        <span className="font-semibold">✗ Your answer:</span> {userMatch}
                      </div>
                      <div className="text-sm text-green-700 mt-1">
                        <span className="font-semibold">✓ Correct:</span> {correctMatch}
                      </div>
                    </div>
                  )}
                  {showResults && hasCorrectAnswer && isCorrect && (
                    <div className="mt-2 text-sm text-green-700 font-semibold">
                      ✓ Correct match!
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Column */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Possible Matches</h3>
            </div>
            {rightItems.map((rightItem, idx) => {
              const isUsed = Object.values(currentMatches).includes(rightItem);
              const canSelect = !showResults && selectedLeft && !isUsed;
              
              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (!showResults && selectedLeft && !isUsed) {
                      handleMatchClick(selectedLeft, rightItem);
                      setSelectedLeft(null);
                    }
                  }}
                  disabled={showResults || isUsed || !selectedLeft}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    canSelect
                      ? 'border-indigo-400 bg-gradient-to-br from-white to-indigo-50 hover:border-indigo-600 hover:shadow-lg hover:scale-[1.02] cursor-pointer'
                      : isUsed
                      ? 'border-gray-300 bg-gray-100 text-gray-400 opacity-60 cursor-not-allowed'
                      : 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed'
                  } ${showResults ? 'cursor-default' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                      canSelect
                        ? 'bg-indigo-100 text-indigo-700'
                        : isUsed
                        ? 'bg-gray-300 text-gray-500'
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <div className="flex-1">
                      <div className={`font-semibold ${isUsed ? 'text-gray-400' : 'text-gray-900'}`}>
                        {rightItem}
                      </div>
                      {isUsed && (
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                          Already matched
                        </div>
                      )}
                      {canSelect && (
                        <div className="text-xs text-indigo-600 font-medium mt-1">
                          Click to match →
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderFillBlank = () => {
    const userAnswer = typeof selectedAnswer === 'string' ? selectedAnswer : '';
    const correct = typeof correctAnswer === 'string' ? correctAnswer.toLowerCase().trim() : '';
    const hasCorrectAnswer = correctAnswer !== undefined && typeof correctAnswer === 'string';
    const isCorrect = showResults && hasCorrectAnswer && userAnswer.toLowerCase().trim() === correct;

    return (
      <div className="space-y-4">
        <div
          className={`p-4 rounded-lg ${
            showResults && hasCorrectAnswer
              ? isCorrect
                ? 'bg-green-50'
                : 'bg-red-50'
              : 'bg-white'
          }`}
        >
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => !showResults && onAnswerSelect(e.target.value)}
            disabled={showResults}
            placeholder="Type your answer here..."
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-0 disabled:bg-gray-100 text-base"
          />
        </div>
        {showResults && hasCorrectAnswer && (
          <div className="text-sm">
            {isCorrect ? (
              <span className="text-green-700 font-semibold">✓ Correct!</span>
            ) : (
              <span className="text-red-700">
                ✗ Correct answer: <strong>{correctAnswer as string}</strong>
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-start gap-3 mb-6">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md">
          {questionIndex + 1}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-semibold text-gray-900">
            {question.question}
          </h2>
        </div>
      </div>

      {question.questionType === 'true-false' && renderTrueFalse()}
      {question.questionType === 'single-select' && renderSingleSelect()}
      {question.questionType === 'multi-select' && renderMultiSelect()}
      {question.questionType === 'matching' && renderMatching()}
      {question.questionType === 'fill-blank' && renderFillBlank()}

      {showResults && question.explanation && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-blue-900 mb-1">💡 Explanation:</p>
          <p className="text-sm text-blue-800">{question.explanation}</p>
        </div>
      )}
    </div>
  );
};
