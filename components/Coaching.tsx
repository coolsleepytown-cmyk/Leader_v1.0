import React, { useEffect, useState, useRef } from 'react';
import { 
  Loader2, TrendingUp, AlertTriangle, Target, BookOpen, 
  ArrowRight, ShieldCheck, Zap, CheckCircle, Calendar, MessageSquare,
  Download, Image as ImageIcon, X, PenTool, Lightbulb, Check, AlertCircle, Mail, Send, Quote, Share2, Sun, Sparkles,
  CalendarCheck
} from 'lucide-react';
import { AssessmentResult, CoachingFeedback, ActionNote } from '../types';
import { generateCoachingFeedback } from '../services/geminiService';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  // Modals State
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  
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

  // Helper for PDF Generation returning File object
  const generatePdfFile = async (): Promise<File | null> => {
    if (!reportRef.current) return null;
    
    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#f8fafc',
        scale: 2, 
        useCORS: true,
        logging: false,
        allowTaint: true,
        ignoreElements: (element) => {
            return element.classList.contains('no-print') || element.hasAttribute('data-html2canvas-ignore');
        }
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const pdfBlob = pdf.output('blob');
      return new File([pdfBlob], `LeadAI_Coaching_Report_${userName}.pdf`, { type: 'application/pdf' });
    } catch (error) {
      console.error("PDF generation failed:", error);
      return null;
    }
  };

  // Updated: Download PDF using jspdf
  const handleDownloadPDF = async () => {
    const originalCursor = document.body.style.cursor;
    document.body.style.cursor = 'wait';
    showNotification("PDF 파일을 생성 중입니다...");
    
    const file = await generatePdfFile();
    
    if (file) {
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.click();
        URL.revokeObjectURL(url);
        showNotification("코칭 리포트가 PDF로 저장되었습니다!");
    } else {
        showNotification("PDF 저장에 실패했습니다.", 'info');
    }
    document.body.style.cursor = originalCursor;
  };

  // Updated: Send Email using Share API (Mobile) or Download+Mailto (Desktop)
  const handleSendEmail = async () => {
    if (!emailInput.trim()) {
        showNotification("이메일 주소를 입력해주세요.", 'info');
        return;
    }
    
    setIsSendingEmail(true);

    const subject = `[LeadAI] Leadership Coaching Report - ${userName}`;
    const body = `[LeadAI Leadership Coaching Report]\n\n` +
                 `■ Analysis Summary\n${feedback?.analysis || 'N/A'}\n\n` +
                 `■ Key Strengths\n${feedback?.strengths.map(s => `• ${s}`).join('\n') || 'N/A'}\n\n` +
                 `■ Areas for Improvement\n${feedback?.weaknesses.map(w => `• ${w}`).join('\n') || 'N/A'}\n\n` +
                 `■ Action Plans\n${feedback?.actionPlans.map((p, i) => `${i+1}. ${p.title}`).join('\n') || 'N/A'}\n\n` +
                 `■ Weekly Mission\n"${feedback?.weeklyMission || ''}"\n\n`;

    const file = await generatePdfFile();

    if (file) {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile && navigator.canShare && navigator.canShare({ files: [file] })) {
             try {
                await navigator.share({
                    files: [file],
                    title: subject,
                    text: body,
                });
                showNotification("메일 앱으로 파일을 공유했습니다.");
                setIsEmailModalOpen(false);
                setIsSendingEmail(false);
                return;
            } catch (error) {
                console.log("Share API cancelled");
            }
        }
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        const mailtoLink = `mailto:${emailInput}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body + "\n\n(참고: 리포트 파일이 브라우저 다운로드 폴더에 저장되었습니다. 이 메일에 첨부해주세요.)")}`;
        window.location.href = mailtoLink;
        showNotification("PDF가 다운로드되었습니다. 메일 작성 창에 파일을 첨부해주세요.");

    } else {
        showNotification("PDF 생성 실패. 텍스트만 전송합니다.", 'info');
        const mailtoLink = `mailto:${emailInput}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoLink;
    }

    setIsEmailModalOpen(false);
    setEmailInput('');
    setIsSendingEmail(false);
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
        <div className="relative">
            <Loader2 className="w-20 h-20 text-blue-600 animate-spin" />
            <Sparkles className="w-8 h-8 text-blue-400 absolute top-0 right-0 animate-pulse" />
        </div>
        <div className="text-center">
          <h3 className="text-2xl font-bold text-slate-800">AI가 {userName}님의 결과를 분석 중입니다...</h3>
          <p className="text-slate-500 mt-2 text-lg font-medium">라임웍스가 리더십 데이터를 분석하고 있습니다.</p>
        </div>
      </div>
    );
  }

  if (!feedback) return null;

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

      {/* Email Modal */}
      {isEmailModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" data-html2canvas-ignore>
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-800 flex items-center">
                          <Mail className="w-5 h-5 mr-2 text-blue-600" />
                          코칭 리포트 전송
                      </h3>
                      <button onClick={() => setIsEmailModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm text-blue-800">
                    <p className="font-bold mb-1">📢 파일 첨부 안내</p>
                    <p>보안 정책상 웹에서 메일로 파일을 직접 첨부할 수 없습니다.</p>
                    <p className="mt-2 text-blue-600">
                        파일이 <strong>자동으로 다운로드</strong>되니,<br/>
                        열리는 메일 창에 <strong>드래그하여 첨부</strong>해주세요.
                    </p>
                  </div>
                  <input 
                      type="email" 
                      placeholder="받는 사람 이메일 주소" 
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-3 mb-4 focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                  <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setIsEmailModalOpen(false)} 
                        className="px-4 py-2 text-slate-500 text-sm"
                        disabled={isSendingEmail}
                      >
                          취소
                      </button>
                      <button 
                        onClick={handleSendEmail} 
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold flex items-center"
                        disabled={isSendingEmail}
                      >
                          {isSendingEmail ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                처리 중...
                            </>
                          ) : (
                            <>
                                <Send className="w-4 h-4 mr-2" />
                                메일 작성 및 다운로드
                            </>
                          )}
                      </button>
                  </div>
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
            onClick={() => setIsEmailModalOpen(true)}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm"
        >
            <Mail className="w-4 h-4 mr-2" />
            이메일 발송
        </button>
        <button 
            onClick={handleDownloadPDF}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm"
        >
            <Download className="w-4 h-4 mr-2" />
            PDF 저장
        </button>
      </div>

      {/* Printable Report Area */}
      <div ref={reportRef} className="space-y-8 animate-fade-in p-1 bg-slate-50 pb-12"> 
        {/* Header Section */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2 mb-4">
                <span className="bg-blue-500 text-xs font-bold px-2 py-1 rounded">AI COACHING REPORT</span>
                <span className="text-slate-300 text-xs">{new Date(assessment.date).toLocaleDateString()} 분석</span>
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-4">{userName ? `${userName}님의 ` : ''}리더십 코칭 분석</h2>
            <p className="text-slate-300 leading-relaxed max-w-3xl text-lg">
              {feedback.analysis}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

        <div className="bg-blue-600 rounded-xl p-8 text-white relative overflow-hidden shadow-lg transition-all duration-500">
          <div className="relative z-10">
              <div className="flex justify-between items-start">
                  <div>
                      <h3 className="text-lg font-semibold text-blue-100 mb-2 flex items-center">
                          THIS WEEK'S MISSION
                      </h3>
                      <div className="text-3xl font-bold leading-tight max-w-2xl">
                          "{feedback.weeklyMission}"
                      </div>
                  </div>
              </div>
              {actionNote && (
                 <div className="mt-8 bg-white text-slate-800 rounded-xl p-6 shadow-xl">
                    <div className="flex items-center mb-4 text-blue-600 border-b border-slate-100 pb-2">
                        <PenTool className="w-5 h-5 mr-2" />
                        <h4 className="font-bold text-lg">MY LEADERSHIP JOURNAL</h4>
                        <span className="ml-auto text-xs text-slate-400">{new Date(actionNote.date).toLocaleDateString()}</span>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Action</p>
                            <p className="text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">{actionNote.action}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Insight</p>
                            <p className="text-sm bg-yellow-50/50 p-3 rounded-lg border border-yellow-100 text-slate-700">{actionNote.insight}</p>
                        </div>
                    </div>
                 </div>
              )}
          </div>
        </div>

        {feedback.closingAdvice && (
            <div className="mt-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-10 text-white text-center shadow-2xl relative overflow-hidden print-break-inside-avoid">
                <Quote className="w-16 h-16 text-slate-700 absolute top-4 left-4 opacity-30" />
                <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-6 font-serif uppercase tracking-widest">Comprehensive Review</h3>
                    <div className="w-16 h-1 bg-blue-500 mx-auto mb-6 rounded-full"></div>
                    <p className="text-lg leading-loose text-slate-200 italic font-light max-w-4xl mx-auto">
                        "{feedback.closingAdvice}"
                    </p>
                </div>
            </div>
        )}

        {feedback.recommendedMindset && (
             <div className="mt-8 bg-white border border-teal-100 rounded-xl overflow-hidden shadow-lg print-break-inside-avoid">
                 <div className="bg-teal-50 p-6 border-b border-teal-100 flex items-center">
                     <Sun className="w-6 h-6 text-teal-600 mr-3" />
                     <h3 className="text-xl font-bold text-teal-900">Mindset & Daily Practice</h3>
                 </div>
                 <div className="p-8 space-y-8">
                     <div className="bg-teal-50/30 p-6 rounded-xl border border-teal-50 italic text-slate-700 text-lg font-medium">
                        "{feedback.recommendedMindset}"
                     </div>
                     {feedback.dailyTips && (
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            {feedback.dailyTips.map((tip, index) => (
                                <div key={index} className="bg-white border border-slate-200 rounded-lg p-4 hover:border-teal-300 transition-all">
                                    <div className="text-xs font-bold text-teal-600 mb-2 uppercase">{tip.day}</div>
                                    <h5 className="font-bold text-slate-800 text-sm mb-2">{tip.title}</h5>
                                    <p className="text-xs text-slate-600 leading-relaxed">{tip.content}</p>
                                </div>
                            ))}
                        </div>
                     )}
                 </div>
             </div>
        )}
      </div>
    </div>
  );
};

export default Coaching;