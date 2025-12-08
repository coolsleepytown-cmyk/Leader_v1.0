import React, { useEffect, useState, useRef } from 'react';
import { 
  Loader2, TrendingUp, AlertTriangle, Target, BookOpen, 
  ArrowRight, ShieldCheck, Zap, CheckCircle, Calendar, MessageSquare,
  Download, Image as ImageIcon, X, PenTool, Lightbulb, Check, AlertCircle
} from 'lucide-react';
import { AssessmentResult, CoachingFeedback, ActionNote } from '../types';
import { generateCoachingFeedback } from '../services/geminiService';
import html2canvas from 'html2canvas';

interface CoachingProps {
  assessment: AssessmentResult | null;
  onRetake: () => void;
  userName?: string;
}

const Coaching: React.FC<CoachingProps> = ({ 
  assessment, 
  onRetake, 
  userName = "사용자", 
}) => {
  const [feedback, setFeedback] = useState<CoachingFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [missionStatus, setMissionStatus] = useState<'idle' | 'accepted' | 'completed'>('idle');
  const [actionNote, setActionNote] = useState<ActionNote | null>(null);
  const [showToast, setShowToast] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  
  // Modals State
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  // Note Inputs
  const [noteInputs, setNoteInputs] = useState({ action: '', result: '', insight: '' });

  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (assessment && !feedback) {
      setLoading(true);
      generateCoachingFeedback(assessment.scores)
        .then(setFeedback)
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [assessment, feedback]);

  const handleAcceptMission = () => {
    setMissionStatus('accepted');
  };

  const handleCompleteMission = () => {
    setMissionStatus('completed');
  };

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 3000);
  };

  const handleOpenNoteModal = () => {
    setIsNoteModalOpen(true);
  };

  const handleSaveNote = () => {
    if (!noteInputs.action.trim() || !noteInputs.insight.trim()) {
        showNotification("내용을 입력해주세요.", 'info');
        return;
    }
    setActionNote({
        date: new Date().toISOString(),
        action: noteInputs.action,
        result: noteInputs.result,
        insight: noteInputs.insight
    });
    setMissionStatus('completed'); // Note writing implies completion
    setIsNoteModalOpen(false);
    showNotification("실천 노트가 저장되었습니다!");
  };

  const handleDownloadImage = async () => {
    if (!reportRef.current) {
        showNotification("리포트를 찾을 수 없습니다.", 'info');
        return;
    }
    
    try {
      showNotification("이미지를 생성 중입니다...", 'info');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#f8fafc',
        scale: 2, 
        useCORS: true,
        logging: false,
        allowTaint: true,
        ignoreElements: (element) => {
            return element.classList.contains('no-print');
        }
      });
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `LeadAI_Report_${userName}.png`;
      link.click();
      showNotification("리포트가 이미지로 저장되었습니다!");
    } catch (error) {
      console.error("Image capture failed:", error);
      showNotification("이미지 저장에 실패했습니다.", 'info');
    }
  };

  if (!assessment) {
    return (
      <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-slate-100">
        <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">아직 진단 결과가 없습니다</h2>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">
          리더십 역량을 진단하고 AI 코치의 맞춤형 피드백을 받아보세요.
          약 5분 정도 소요됩니다.
        </p>
        <button
          onClick={onRetake}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
        >
          지금 진단 시작하기
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-6">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
        <div className="text-center">
          <h3 className="text-xl font-bold text-slate-800">AI가 {userName}님의 결과를 분석 중입니다...</h3>
          <p className="text-slate-500 mt-2">Gemini Pro가 리더십 데이터를 해석하고 있습니다.</p>
        </div>
      </div>
    );
  }

  if (!feedback) return null;

  // Check if feedback indicates an API error
  const isApiError = feedback.strengths.includes("환경 변수 설정 필요") || feedback.analysis.includes("API 키가 설정되지 않았거나");

  if (isApiError) {
    return (
        <div className="max-w-2xl mx-auto mt-10 p-6 bg-red-50 border border-red-200 rounded-xl flex flex-col items-center text-center">
            <div className="p-3 bg-red-100 rounded-full mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-red-700 mb-2">AI 코칭 서비스를 실행할 수 없습니다</h3>
            <p className="text-red-600 mb-4">
                {feedback.analysis}
            </p>
            <div className="bg-white p-4 rounded-lg border border-red-100 text-sm text-slate-600 text-left w-full max-w-md">
                <p className="font-bold mb-2">해결 방법:</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>Vercel 대시보드에서 <strong>Settings &gt; Environment Variables</strong>로 이동하세요.</li>
                    <li><strong>API_KEY</strong> (또는 VITE_API_KEY) 이름으로 Google Gemini API 키를 추가하세요.</li>
                    <li>설정 후 <strong>Redeploy</strong>를 수행해야 적용됩니다.</li>
                </ul>
            </div>
            <button 
                onClick={onRetake}
                className="mt-6 px-6 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
                다시 시도하기
            </button>
        </div>
    );
  }

  return (
    <div className="relative">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-[70] animate-fade-in">
           <div className={`px-6 py-3 rounded-lg shadow-2xl flex items-center text-white
             ${showToast.type === 'success' ? 'bg-slate-800' : 'bg-blue-600'}`}>
             <CheckCircle className="w-5 h-5 mr-2" />
             {showToast.message}
           </div>
        </div>
      )}

      {/* Note Writing Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" data-html2canvas-ignore>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-blue-50">
              <h3 className="font-bold text-blue-800 flex items-center text-lg">
                <PenTool className="w-5 h-5 mr-2" />
                리더십 실천 노트 (Self-Reflection)
              </h3>
              <button 
                onClick={() => setIsNoteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
                <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 mb-4">
                    <p className="text-sm text-blue-700 font-medium">
                        💡 구조화된 회고는 성장의 핵심입니다. 이번 주 미션을 수행하며 느낀 점을 기록해보세요.
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        1. 구체적 행동 (Action)
                    </label>
                    <p className="text-xs text-slate-500 mb-2">어떤 상황에서 구체적으로 무엇을 실천했나요?</p>
                    <textarea 
                        className="w-full border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none h-24 resize-none"
                        placeholder="예: 팀 회의 때 팀원의 의견을 끝까지 경청하고, '좋은 의견입니다'라고 피드백했습니다."
                        value={noteInputs.action}
                        onChange={(e) => setNoteInputs({...noteInputs, action: e.target.value})}
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        2. 결과 및 반응 (Result)
                    </label>
                    <p className="text-xs text-slate-500 mb-2">그로 인해 어떤 변화나 반응이 있었나요?</p>
                    <textarea 
                        className="w-full border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none h-24 resize-none"
                        placeholder="예: 팀원이 자신의 의견이 존중받는다고 느껴 더 적극적으로 아이디어를 냈습니다."
                        value={noteInputs.result}
                        onChange={(e) => setNoteInputs({...noteInputs, result: e.target.value})}
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        3. 배운 점 (Insight)
                    </label>
                    <p className="text-xs text-slate-500 mb-2">이 경험을 통해 리더로서 무엇을 깨달았나요?</p>
                    <textarea 
                        className="w-full border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none h-24 resize-none"
                        placeholder="예: 작은 경청의 태도가 팀 분위기를 크게 바꿀 수 있음을 배웠습니다."
                        value={noteInputs.insight}
                        onChange={(e) => setNoteInputs({...noteInputs, insight: e.target.value})}
                    />
                </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button 
                    onClick={() => setIsNoteModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium"
                >
                    취소
                </button>
                <button 
                    onClick={handleSaveNote}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg"
                >
                    저장 및 완료
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-end gap-3 mb-4" data-html2canvas-ignore>
        <button 
            onClick={handleDownloadImage}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm"
        >
            <Download className="w-4 h-4 mr-2" />
            이미지 저장
        </button>
      </div>

      {/* Printable Report Area */}
      <div ref={reportRef} className="space-y-8 animate-fade-in p-1 bg-slate-50 pb-12"> 
        {/* Header Section */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2 mb-4">
                <span className="bg-blue-500 text-xs font-bold px-2 py-1 rounded">AI COACHING</span>
                <span className="text-slate-300 text-xs">{new Date(assessment.date).toLocaleDateString()} 분석</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-4">{userName ? `${userName}님의 ` : ''}리더십 분석 리포트</h2>
            <p className="text-slate-300 leading-relaxed max-w-3xl text-lg">
              {feedback.analysis}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Strengths Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-green-100 rounded-lg mr-3">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">핵심 강점</h3>
            </div>
            <ul className="space-y-3">
              {feedback.strengths.map((s, i) => (
                <li key={i} className="flex items-start text-slate-600">
                  <ShieldCheck className="w-5 h-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-orange-100 rounded-lg mr-3">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">보완 필요 영역</h3>
            </div>
            <ul className="space-y-3">
              {feedback.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start text-slate-600">
                  <Target className="w-5 h-5 text-orange-500 mr-2 shrink-0 mt-0.5" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Action Plan */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
              <Zap className="w-6 h-6 text-yellow-500 mr-2" />
              맞춤형 행동 가이드 (Action Plan)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {feedback.actionPlans.map((plan, i) => (
              <div key={i} className="bg-slate-50 p-6 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded 
                    ${plan.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : 
                      plan.difficulty === 'Medium' ? 'bg-blue-100 text-blue-700' : 
                      'bg-red-100 text-red-700'}`}>
                    {plan.difficulty}
                  </span>
                  <span className="text-slate-400 text-xs font-mono">STEP {i+1}</span>
                </div>
                <h4 className="font-bold text-slate-800 mb-2">{plan.title}</h4>
                <p className="text-slate-600 text-sm">{plan.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Mission & Action Note Area */}
        <div className="bg-blue-600 rounded-xl p-8 text-white relative overflow-hidden shadow-lg transition-all duration-500">
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10">
              <Target className="w-48 h-48" />
          </div>
          <div className="relative z-10">
              <div className="flex justify-between items-start">
                  <div>
                      <h3 className="text-lg font-semibold text-blue-100 mb-2 flex items-center">
                          THIS WEEK'S MISSION
                          {missionStatus !== 'idle' && (
                              <span className="ml-3 bg-blue-500 text-xs px-2 py-0.5 rounded-full border border-blue-400">
                                  {missionStatus === 'accepted' ? '진행 중 (In Progress)' : '완료됨 (Completed)'}
                              </span>
                          )}
                      </h3>
                      <div className="text-3xl font-bold leading-tight max-w-2xl">
                          "{feedback.weeklyMission}"
                      </div>
                  </div>
                  {missionStatus === 'completed' && (
                      <div className="bg-white/20 p-2 rounded-full">
                          <CheckCircle className="w-8 h-8 text-white" />
                      </div>
                  )}
              </div>

              {/* Interaction Buttons - Hidden in Image CAPTURE only if not displaying the note */}
              <div data-html2canvas-ignore="true">
                  {missionStatus === 'idle' && (
                      <button 
                          onClick={handleAcceptMission}
                          className="mt-6 px-6 py-3 rounded-full bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm flex items-center shadow-lg transition-colors"
                      >
                          미션 수락하기
                          <ArrowRight className="w-4 h-4 ml-2" />
                      </button>
                  )}

                  {missionStatus === 'accepted' && (
                      <div className="mt-8 animate-fade-in bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                          <h4 className="font-bold text-lg mb-4 flex items-center">
                              <Calendar className="w-5 h-5 mr-2" />
                              실천 가이드
                          </h4>
                          <ul className="space-y-3 mb-6 text-blue-50">
                              <li className="flex items-center">
                                  <div className="w-1.5 h-1.5 bg-blue-300 rounded-full mr-3" />
                                  팀원들과의 회의나 1:1 면담 시 의식적으로 실천해보세요.
                              </li>
                              <li className="flex items-center">
                                  <div className="w-1.5 h-1.5 bg-blue-300 rounded-full mr-3" />
                                  매일 저녁, 오늘의 실천 내용을 짧게 메모하세요.
                              </li>
                          </ul>
                          <div className="flex flex-col sm:flex-row gap-3">
                              <button 
                                  onClick={handleCompleteMission}
                                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-bold text-sm transition-colors flex items-center justify-center shadow-lg"
                              >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  미션 완료 처리
                              </button>
                              <button 
                                  onClick={handleOpenNoteModal}
                                  className="flex-1 bg-white hover:bg-slate-50 text-blue-700 px-4 py-3 rounded-lg font-bold text-sm transition-colors flex items-center justify-center shadow-lg"
                              >
                                  <MessageSquare className="w-4 h-4 mr-2" />
                                  실천 노트 작성
                              </button>
                          </div>
                      </div>
                  )}
              </div>

              {/* Display Action Note (Included in Image) */}
              {actionNote && (
                 <div className="mt-8 bg-white text-slate-800 rounded-xl p-6 shadow-xl animate-fade-in">
                    <div className="flex items-center mb-4 text-blue-600 border-b border-slate-100 pb-2">
                        <PenTool className="w-5 h-5 mr-2" />
                        <h4 className="font-bold text-lg">MY LEADERSHIP JOURNAL</h4>
                        <span className="ml-auto text-xs text-slate-400">{new Date(actionNote.date).toLocaleDateString()}</span>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Action (행동)</p>
                            <p className="text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">{actionNote.action}</p>
                        </div>
                        {actionNote.result && (
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Result (결과)</p>
                                <p className="text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">{actionNote.result}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center">
                                Insight (배운 점)
                                <Lightbulb className="w-3 h-3 ml-1 text-yellow-500" />
                            </p>
                            <p className="text-sm bg-yellow-50/50 p-3 rounded-lg border border-yellow-100 text-slate-700">{actionNote.insight}</p>
                        </div>
                    </div>
                 </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Coaching;