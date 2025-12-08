import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import { Question, Competency, AssessmentResult } from '../types';
import { ASSESSMENT_QUESTIONS, COMPETENCY_LABELS } from '../constants';

interface AssessmentProps {
  onComplete: (result: AssessmentResult) => void;
  onCancel: () => void;
}

const Assessment: React.FC<AssessmentProps> = ({ onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const totalQuestions = ASSESSMENT_QUESTIONS.length;

  const handleAnswer = (score: number) => {
    setAnswers((prev) => ({ ...prev, [ASSESSMENT_QUESTIONS[currentStep].id]: score }));
    if (currentStep < totalQuestions - 1) {
      setTimeout(() => setCurrentStep((prev) => prev + 1), 200); // Small delay for UX
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const calculateResults = () => {
    const scores: Partial<Record<Competency, number[]>> = {};
    
    // Group raw scores by competency
    ASSESSMENT_QUESTIONS.forEach((q) => {
      const score = answers[q.id] || 0;
      if (!scores[q.competency]) scores[q.competency] = [];
      scores[q.competency]!.push(score);
    });

    // Calculate averages
    const finalScores: Record<string, number> = {};
    let sumTotal = 0;
    let countTotal = 0;

    Object.keys(scores).forEach((key) => {
      const compKey = key as Competency;
      const compScores = scores[compKey]!;
      const avg = compScores.reduce((a, b) => a + b, 0) / compScores.length;
      finalScores[compKey] = avg;
      sumTotal += avg;
      countTotal++;
    });

    const result: AssessmentResult = {
      date: new Date().toISOString(),
      scores: finalScores as Record<Competency, number>,
      totalScore: sumTotal / countTotal,
    };

    onComplete(result);
  };

  const currentQuestion = ASSESSMENT_QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / totalQuestions) * 100;
  
  // Check if current question is answered. 
  // For the last step, this ensures the button enables immediately upon selection.
  const isCurrentAnswered = !!answers[currentQuestion.id];

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Progress Bar */}
      <div className="h-2 bg-slate-100">
        <div 
          className="h-full bg-blue-600 transition-all duration-300" 
          style={{ width: `${progress}%` }} 
        />
      </div>

      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm font-semibold text-blue-600 tracking-wider uppercase">
            {COMPETENCY_LABELS[currentQuestion.competency]}
          </span>
          <span className="text-slate-400 text-sm">
            {currentStep + 1} / {totalQuestions}
          </span>
        </div>

        <h2 className="text-2xl font-bold text-slate-800 mb-8 min-h-[80px]">
          {currentQuestion.text}
        </h2>

        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((score) => (
            <button
              key={score}
              onClick={() => handleAnswer(score)}
              className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 group flex items-center justify-between
                ${answers[currentQuestion.id] === score 
                  ? 'border-blue-600 bg-blue-50 text-blue-700' 
                  : 'border-slate-100 hover:border-blue-300 hover:bg-slate-50'}`}
            >
              <span className="font-medium text-lg">
                {score === 1 && "전혀 그렇지 않다"}
                {score === 2 && "그렇지 않다"}
                {score === 3 && "보통이다"}
                {score === 4 && "그렇다"}
                {score === 5 && "매우 그렇다"}
              </span>
              {answers[currentQuestion.id] === score && (
                <CheckCircle className="w-6 h-6 text-blue-600" />
              )}
            </button>
          ))}
        </div>

        <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`flex items-center text-slate-600 hover:text-slate-900 px-4 py-2 rounded transition-colors
              ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            이전
          </button>

          {currentStep === totalQuestions - 1 ? (
             <button
             onClick={calculateResults}
             disabled={!isCurrentAnswered}
             className={`flex items-center px-6 py-2 rounded-lg font-bold text-white transition-all
               ${isCurrentAnswered 
                 ? 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg' 
                 : 'bg-slate-300 cursor-not-allowed'}`}
           >
             결과 보기
             <CheckCircle className="w-5 h-5 ml-2" />
           </button>
          ) : (
            <button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!isCurrentAnswered}
              className={`flex items-center px-6 py-2 rounded-lg font-bold transition-all
                ${isCurrentAnswered
                  ? 'bg-slate-800 text-white hover:bg-slate-900'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
            >
              다음
              <ChevronRight className="w-5 h-5 ml-2" />
            </button>
          )}
        </div>
        
        <div className="mt-4 text-center">
            <button onClick={onCancel} className="text-sm text-slate-400 hover:text-red-500">
                진단 취소
            </button>
        </div>
      </div>
    </div>
  );
};

export default Assessment;