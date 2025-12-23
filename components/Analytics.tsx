import React, { useState, useRef } from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell
} from 'recharts';
import { AssessmentResult, Competency } from '../types';
import { COMPETENCY_LABELS, MOCK_HISTORY } from '../constants';
import { 
  Lock, Lightbulb, TrendingUp, AlertCircle, Zap, Target, BookOpen, 
  MessageCircle, ArrowRightCircle, Download, Mail, X, CheckCircle, Send, Loader2 
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface AnalyticsProps {
  currentAssessment: AssessmentResult | null;
  comparisonScores?: Record<Competency, number>;
  comparisonLabel?: string;
  userName?: string;
}

const Analytics: React.FC<AnalyticsProps> = ({ 
  currentAssessment, 
  comparisonScores = MOCK_HISTORY,
  comparisonLabel = "동료 평균 (Peer Group)",
  userName = "사용자"
}) => {
  const [showToast, setShowToast] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  const analyticsRef = useRef<HTMLDivElement>(null);

  if (!currentAssessment) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 animate-fade-in">
        <Lock className="w-12 h-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-500">데이터가 없습니다</h3>
        <p className="text-slate-400">진단을 완료하면 분석 차트가 표시됩니다.</p>
      </div>
    );
  }

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 3000);
  };

  const generatePdfFile = async (): Promise<File | null> => {
    if (!analyticsRef.current) return null;
    try {
      const canvas = await html2canvas(analyticsRef.current, {
        backgroundColor: '#f8fafc',
        scale: 2, 
        useCORS: true,
        logging: false,
        allowTaint: true,
        ignoreElements: (element) => element.classList.contains('no-print')
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
      return new File([pdf.output('blob')], `LeadAI_Analysis_${userName}.pdf`, { type: 'application/pdf' });
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const handleDownloadPDF = async () => {
    showNotification("PDF 파일을 생성 중입니다...");
    const file = await generatePdfFile();
    if (file) {
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.click();
        URL.revokeObjectURL(url);
        showNotification("분석 리포트가 PDF로 저장되었습니다!");
    } else {
        showNotification("PDF 저장에 실패했습니다.", 'info');
    }
  };

  const handleSendEmail = async () => {
    if (!emailInput.trim()) return;
    setIsSendingEmail(true);
    const file = await generatePdfFile();
    if (file) {
        const subject = `[LeadAI] 분석 리포트 - ${userName}`;
        const body = `LeadAI 리더십 분석 결과입니다. 첨부된 PDF 파일을 확인해 주세요.`;
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile && navigator.canShare && navigator.canShare({ files: [file] })) {
             try {
                await navigator.share({ files: [file], title: subject, text: body });
                setIsEmailModalOpen(false);
                setIsSendingEmail(false);
                return;
            } catch (e) {}
        }
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.click();
        URL.revokeObjectURL(url);
        window.location.href = `mailto:${emailInput}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body + "\n\n(참고: 파일이 다운로드되었습니다. 메일에 첨부해 주세요.)")}`;
        showNotification("PDF가 다운로드되었습니다. 메일 작성 창에 첨부해 주세요.");
    }
    setIsEmailModalOpen(false);
    setIsSendingEmail(false);
  };

  const radarData = Object.values(Competency).map((comp) => ({
    subject: COMPETENCY_LABELS[comp].split(' (')[0],
    A: currentAssessment.scores[comp] || 0,
    B: comparisonScores[comp] || 0,
    fullMark: 5,
  }));

  const sortedScores = (Object.entries(currentAssessment.scores) as [Competency, number][])
    .sort(([, a], [, b]) => b - a);

  const barData = sortedScores.map(([key, value]) => ({
      name: COMPETENCY_LABELS[key as Competency].split(' (')[0],
      score: Number(value),
      id: key
    }));

  const topStrength = sortedScores[0];
  const weakness = sortedScores[sortedScores.length - 1];
  
  const getCoachingTips = (comp: Competency) => {
    const tips: Record<string, { quick: string, long: string, question: string }> = {
      [Competency.COMMUNICATION]: {
        quick: "상대방의 말을 한 문장으로 요약하여 확인하는 습관을 가져보세요.",
        long: "복잡한 비즈니스 이슈를 3가지 핵심 포인트로 구조화하여 설명하는 훈련이 필요합니다.",
        question: "팀원들이 내 지시를 듣고 '왜'를 명확히 이해하고 있습니까?"
      },
      [Competency.DECISION_MAKING]: {
        quick: "스스로 마감 시한을 정하고, 70%의 확신이 있다면 실행하십시오.",
        long: "의사결정 사후 분석을 통해 결정 프로세스를 정교화하세요.",
        question: "나의 결정 지연이 팀의 속도를 늦추고 있지는 않습니까?"
      },
      [Competency.STRATEGIC_THINKING]: {
        quick: "업무 시작 전 15분간 오늘 할 일이 조직 목표와 어떻게 연결되는지 그려보세요.",
        long: "산업 트렌드 분석을 주 1회 루틴화하여 비즈니스 시나리오를 설계하세요.",
        question: "나는 지금 불을 끄는 리더입니까, 길을 닦는 리더입니까?"
      },
      [Competency.TEAM_MANAGEMENT]: {
        quick: "팀원 각자와 15분간의 커피 챗을 통해 업무 외 고민을 청취하세요.",
        long: "팀원의 강점을 발견하고 배치하는 Orchestrator로 진화해야 합니다.",
        question: "팀원들이 실수했을 때 즉시 보고할 만큼의 심리적 안전감이 있습니까?"
      }
    };
    return tips[comp] || { 
        quick: "해당 역량의 실천 지표를 정의하고 매일 체크리스트를 작성해보세요.", 
        long: "관련 분야의 도서를 탐독하고 멘토를 찾아 조언을 구하십시오.", 
        question: "이 역량이 1점 올라간다면 팀 성과에 어떤 변화가 생길까요?" 
    };
  };

  const currentTips = getCoachingTips(weakness[0]);

  return (
    <div className="relative">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-[70] animate-fade-in no-print">
           <div className={`px-6 py-3 rounded-lg shadow-2xl flex items-center text-white
             ${showToast.type === 'success' ? 'bg-slate-800' : 'bg-blue-600'}`}>
             <CheckCircle className="w-5 h-5 mr-2" />
             {showToast.message}
           </div>
        </div>
      )}

      {/* Email Modal */}
      {isEmailModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm no-print">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-800 flex items-center">
                          <Mail className="w-5 h-5 mr-2 text-blue-600" />
                          분석 리포트 전송
                      </h3>
                      <button onClick={() => setIsEmailModalOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
                  </div>
                  <input 
                      type="email" 
                      placeholder="이메일 주소 입력" 
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-3 mb-4 outline-none focus:ring-2 focus:ring-blue-200"
                  />
                  <div className="flex justify-end gap-2">
                      <button onClick={() => setIsEmailModalOpen(false)} className="px-4 py-2 text-slate-500 text-sm">취소</button>
                      <button 
                        onClick={handleSendEmail} 
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold flex items-center"
                        disabled={isSendingEmail}
                      >
                        {isSendingEmail ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                        보내기
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Toolbar */}
      <div className="flex justify-end gap-3 mb-6 no-print">
        <button 
            onClick={() => setIsEmailModalOpen(true)}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center shadow-sm"
        >
            <Mail className="w-4 h-4 mr-2" />
            이메일 발송
        </button>
        <button 
            onClick={handleDownloadPDF}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center shadow-sm"
        >
            <Download className="w-4 h-4 mr-2" />
            PDF 저장
        </button>
      </div>

      <div ref={analyticsRef} className="space-y-8 animate-fade-in pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800">역량 밸런스 분석</h3>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                  <Radar name="나" dataKey="A" stroke="#2563eb" strokeWidth={2} fill="#3b82f6" fillOpacity={0.5} />
                  <Radar name={comparisonLabel} dataKey="B" stroke="#94a3b8" strokeWidth={2} fill="#cbd5e1" fillOpacity={0.3} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6">역량별 상세 지표</h3>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" domain={[0, 5]} hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#475569', fontSize: 12 }} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
                      {barData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#1e40af' : index === barData.length - 1 ? '#ea580c' : '#3b82f6'} />
                      ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-8 border border-slate-100 shadow-sm">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <Lightbulb className="w-6 h-6 text-yellow-500 mr-2" />
              핵심 데이터 인사이트
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                  <div className="flex items-center mb-3 text-blue-700 font-bold uppercase text-xs tracking-wider">
                      <TrendingUp className="w-4 h-4 mr-2" /> Top Strength
                  </div>
                  <h4 className="font-bold text-slate-800 mb-2">{COMPETENCY_LABELS[topStrength[0]].split(' (')[0]}</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                      귀하의 강점 역량은 {topStrength[1].toFixed(1)}점으로, 조직 내 신뢰와 성과를 이끄는 원동력입니다.
                  </p>
              </div>
              <div className="bg-orange-50/50 p-6 rounded-xl border border-orange-100">
                  <div className="flex items-center mb-3 text-orange-700 font-bold uppercase text-xs tracking-wider">
                      <AlertCircle className="w-4 h-4 mr-2" /> Focus Area
                  </div>
                  <h4 className="font-bold text-slate-800 mb-2">{COMPETENCY_LABELS[weakness[0]].split(' (')[0]}</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">
                      가장 큰 보완점인 {COMPETENCY_LABELS[weakness[0] as Competency].split(' (')[0]} 역량 개선을 통해 리더십 성장을 이끌 수 있습니다.
                  </p>
              </div>
          </div>

          <div className="border-t border-slate-100 pt-8">
              <h4 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                  <Zap className="w-5 h-5 text-indigo-600 mr-2" />
                  전략적 리더십 향상 가이드
              </h4>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                      <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase">
                          <ArrowRightCircle className="w-4 h-4" /> Quick Wins
                      </div>
                      <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 min-h-[140px] text-sm leading-relaxed text-slate-700">
                          {currentTips.quick}
                      </div>
                  </div>
                  <div className="space-y-4">
                      <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase">
                          <Target className="w-4 h-4" /> Long-term Growth
                      </div>
                      <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 min-h-[140px] text-sm leading-relaxed text-slate-700">
                          {currentTips.long}
                      </div>
                  </div>
                  <div className="space-y-4">
                      <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase">
                          <MessageCircle className="w-4 h-4" /> Reflective Coaching
                      </div>
                      <div className="bg-indigo-900 p-5 rounded-lg min-h-[140px] flex items-center italic text-indigo-100 text-sm leading-relaxed font-medium">
                          "{currentTips.question}"
                      </div>
                  </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;