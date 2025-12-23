import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, TrendingUp, Search, ChevronRight, X, Trash2, ArchiveRestore, Ban, Mail, BarChart3,
  Download, FileSpreadsheet, BrainCircuit, Sparkles, Target, AlertTriangle, ShieldCheck, Zap,
  CheckSquare, Square, ArrowUpDown, Send, Loader2, CheckCircle, Lightbulb, Share2, Sun, CalendarCheck
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip 
} from 'recharts';
import { TeamAssessmentData, AssessmentResult, Competency, CoachingFeedback } from '../types';
import { mockDB } from '../services/mockDatabase';
import { generateTeamFeedback } from '../services/geminiService';
import { COMPETENCY_LABELS } from '../constants';
import Analytics from './Analytics';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const TeamDashboard: React.FC = () => {
  const [teamData, setTeamData] = useState<TeamAssessmentData[]>([]);
  const [teamStats, setTeamStats] = useState<any>(null);
  const [selectedMember, setSelectedMember] = useState<TeamAssessmentData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showToast, setShowToast] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState<{key: 'company' | 'date', direction: 'asc' | 'desc'}>({
    key: 'date',
    direction: 'desc'
  });
  
  // Team Analysis State
  const [teamFeedback, setTeamFeedback] = useState<CoachingFeedback | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const teamReportRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Email Modal State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState('');

  // Load data function
  const loadData = () => {
    const data = mockDB.getAll();
    const stats = mockDB.getTeamStats();
    setTeamData(data);
    setTeamStats(stats);
  };

  useEffect(() => {
    loadData();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "LEADAI_TEAM_DATA") {
        loadData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setShowToast({ message, type });
    setTimeout(() => setShowToast(null), 3000);
  };

  const filteredData = teamData
    .filter(member => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        member.name.toLowerCase().includes(term) ||
        member.department.toLowerCase().includes(term) ||
        member.company.toLowerCase().includes(term) ||
        member.email.toLowerCase().includes(term);
      
      const isDeleted = !!member.isDeleted;
      const matchesTab = activeTab === 'active' ? !isDeleted : isDeleted;
      
      return matchesSearch && matchesTab;
    })
    .sort((a, b) => {
      const direction = sortConfig.direction === 'asc' ? 1 : -1;
      if (sortConfig.key === 'company') {
        return a.company.localeCompare(b.company) * direction;
      } else {
        return (new Date(a.date).getTime() - new Date(b.date).getTime()) * direction;
      }
    });

  const handleSort = (key: 'company' | 'date') => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleAllSelection = () => {
    if (selectedIds.size === filteredData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map(d => d.id)));
    }
  };

  const handleSoftDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("선택한 항목을 휴지통으로 이동하시겠습니까?")) {
      mockDB.softDeleteResult(id);
      loadData();
      const newSet = new Set(selectedIds);
      newSet.delete(id);
      setSelectedIds(newSet);
    }
  };

  const handleBulkSoftDelete = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`선택한 ${selectedIds.size}개 항목을 휴지통으로 이동하시겠습니까?`)) {
      selectedIds.forEach(id => mockDB.softDeleteResult(id));
      loadData();
      setSelectedIds(new Set());
    }
  };

  const handleRestore = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("선택한 항목을 복구하시겠습니까?")) {
      mockDB.restoreResult(id);
      loadData();
    }
  };

  const handlePermanentDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      mockDB.permanentDeleteResult(id);
      loadData();
    }
  };

  const handleDownloadCSV = () => {
    if (filteredData.length === 0) {
        showNotification("다운로드할 데이터가 없습니다.", 'info');
        return;
    }
    const headers = [
        "회사명", "이름", "이메일", "직책", "부서", "진단일자", "종합점수",
        ...Object.values(COMPETENCY_LABELS).map(l => l.split(' (')[0])
    ];
    const rows = filteredData.map(member => [
        member.company,
        member.name,
        member.email,
        member.role,
        member.department,
        new Date(member.date).toLocaleDateString(),
        member.totalScore.toFixed(2),
        ...Object.values(Competency).map(c => member.scores[c]?.toFixed(1) || "0")
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `LeadAI_Team_Data_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("CSV 파일 다운로드가 시작되었습니다.");
  };

  const handleTeamAnalysis = async () => {
    if (selectedIds.size === 0 && !window.confirm("선택된 인원이 없습니다. 전체 인원을 대상으로 분석하시겠습니까?")) {
        return;
    }
    setIsAnalyzing(true);
    try {
        let targetData = filteredData;
        if (selectedIds.size > 0) {
            targetData = filteredData.filter(d => selectedIds.has(d.id));
        }
        const stats = mockDB.getTeamStats(targetData);
        if (!stats) throw new Error("분석할 데이터가 부족합니다.");
        const feedback = await generateTeamFeedback(stats.scores);
        setTeamFeedback(feedback);
        setTimeout(() => {
            teamReportRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    } catch (e) {
        console.error(e);
        showNotification("분석 중 오류가 발생했습니다.", 'info');
    } finally {
        setIsAnalyzing(false);
    }
  };

  const generatePdfFile = async (element: HTMLElement, filename: string): Promise<File | null> => {
    const originalCursor = document.body.style.cursor;
    document.body.style.cursor = 'wait';
    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            backgroundColor: '#f8fafc',
            useCORS: true,
            logging: false,
            ignoreElements: (element) => element.classList.contains('no-print')
        });
        const imgData = canvas.toDataURL('image/png');
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
        return new File([pdfBlob], filename, { type: 'application/pdf' });
    } catch (error) {
        console.error("PDF generation failed:", error);
        return null;
    } finally {
        document.body.style.cursor = originalCursor;
    }
  };

  const handleDownloadDashboardPDF = async () => {
    const target = dashboardRef.current;
    if (!target) return;
    showNotification("대시보드 PDF를 생성 중입니다...");
    const file = await generatePdfFile(target, 'LeadAI_Team_Dashboard.pdf');
    if (file) {
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.click();
        URL.revokeObjectURL(url);
        showNotification("대시보드 PDF 다운로드 완료!");
    }
  };

  const handleDownloadReportPDF = async () => {
    const target = teamReportRef.current;
    if (!target) return;
    showNotification("인사이트 리포트 PDF를 생성 중입니다...");
    const file = await generatePdfFile(target, 'LeadAI_Team_Insight_Report.pdf');
    if (file) {
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.click();
        URL.revokeObjectURL(url);
        showNotification("리포트 PDF 다운로드 완료!");
    }
  };

  const handleEmailReport = () => {
      setIsEmailModalOpen(true);
      setEmailRecipient("admin@company.com");
  };

  const confirmEmailSend = async () => {
      setIsSendingEmail(true);
      const target = teamReportRef.current || dashboardRef.current;
      if (!target) {
          showNotification("리포트 영역을 찾을 수 없습니다.", 'info');
          setIsSendingEmail(false);
          return;
      }
      const subject = `[LeadAI] 조직 리더십 인사이트 리포트`;
      const body = `[조직 리더십 인사이트 리포트]\n\n` +
                   `■ Executive Summary\n${teamFeedback?.analysis || '내용 없음'}\n\n` + 
                   `■ 조직의 강점\n${teamFeedback?.strengths.map((s, i) => `${i+1}. ${s}`).join('\n') || ''}\n\n` +
                   `■ 조직의 과제\n${teamFeedback?.weaknesses.map((w, i) => `${i+1}. ${w}`).join('\n') || ''}\n\n` +
                   `■ 전략적 제언\n${teamFeedback?.actionPlans.map((p, i) => `${i+1}. ${p.title}`).join('\n') || ''}\n\n` +
                   `※ 상세 리포트는 다운로드된 PDF 파일을 확인해 주세요.`;
      const file = await generatePdfFile(target, 'LeadAI_Team_Report.pdf');
      if (file) {
          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
          if (isMobile && navigator.canShare && navigator.canShare({ files: [file] })) {
              try {
                  await navigator.share({ files: [file], title: subject, text: body });
                  setIsEmailModalOpen(false);
                  setIsSendingEmail(false);
                  return;
              } catch (error) { console.log("Share API cancelled"); }
          }
          const url = URL.createObjectURL(file);
          const link = document.createElement('a');
          link.href = url;
          link.download = file.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          if (emailRecipient) {
              const mailtoLink = `mailto:${emailRecipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body + "\n\n(참고: 리포트 파일이 브라우저 다운로드 폴더에 저장되었습니다. 이 메일에 첨부해주세요.)")}`;
              window.location.href = mailtoLink;
              showNotification("PDF가 다운로드되었습니다. 메일 작성 창에 파일을 첨부해주세요.");
          } else {
             showNotification("PDF가 다운로드되었습니다.");
          }
      } else { showNotification("PDF 생성에 실패했습니다.", 'info'); }
      setIsEmailModalOpen(false);
      setEmailRecipient('');
      setIsSendingEmail(false);
  };

  const radarData = teamStats ? Object.values(Competency).map((comp) => ({
    subject: COMPETENCY_LABELS[comp].split(' (')[0],
    A: teamStats.scores[comp] || 0,
    fullMark: 5,
  })) : [];

  return (
    <div ref={dashboardRef} className="space-y-8 animate-fade-in pb-12">
      {showToast && (
        <div className="fixed top-4 right-4 z-[70] animate-fade-in no-print">
           <div className={`px-6 py-3 rounded-lg shadow-2xl flex items-center text-white
             ${showToast.type === 'success' ? 'bg-slate-800' : 'bg-blue-600'}`}>
             <CheckCircle className="w-5 h-5 mr-2" />
             {showToast.message}
           </div>
        </div>
      )}

      {isEmailModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm no-print">
              <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
                  <h3 className="font-bold text-lg mb-4 flex items-center">
                      <Mail className="w-5 h-5 mr-2 text-blue-600" />
                      리포트 이메일 전송
                  </h3>
                  <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm text-blue-800">
                    <p className="font-bold mb-1">📢 파일 첨부 안내</p>
                    <p>보안 정책상 웹에서 메일로 파일을 직접 첨부할 수 없습니다.</p>
                    <p className="mt-2 text-blue-600">파일이 자동으로 다운로드되니, 열리는 메일 창에 파일을 첨부해주세요.</p>
                  </div>
                  <input type="email" className="w-full border p-2 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-blue-200" placeholder="name@company.com" value={emailRecipient} onChange={e => setEmailRecipient(e.target.value)} />
                  <div className="flex justify-end gap-2">
                      <button onClick={() => setIsEmailModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm" disabled={isSendingEmail}>취소</button>
                      <button onClick={confirmEmailSend} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm flex items-center" disabled={isSendingEmail}>
                         {isSendingEmail ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 처리 중...</> : <><Send className="w-4 h-4 mr-2" /> 메일 작성 및 다운로드</>}
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">팀 대시보드</h1>
            <p className="text-slate-500">조직 구성원의 리더십 진단 현황과 통계를 관리합니다.</p>
        </div>
        <div className="flex gap-2">
             <button onClick={handleDownloadDashboardPDF} className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center shadow-sm">
                <Download className="w-4 h-4 mr-2" /> 대시보드 PDF 저장
            </button>
            <button onClick={handleDownloadCSV} className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center shadow-sm">
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" /> Excel 다운로드
            </button>
        </div>
      </div>

      {teamStats && activeTab === 'active' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
                    <div className="p-4 bg-blue-100 rounded-full mr-5"><Users className="w-8 h-8 text-blue-600" /></div>
                    <div><p className="text-sm text-slate-500 font-medium">총 진단 인원</p><h3 className="text-3xl font-bold text-slate-800">{teamStats.count}명</h3></div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
                    <div className="p-4 bg-green-100 rounded-full mr-5"><TrendingUp className="w-8 h-8 text-green-600" /></div>
                    <div><p className="text-sm text-slate-500 font-medium">조직 평균 점수</p><h3 className="text-3xl font-bold text-slate-800">{teamStats.totalAvg.toFixed(1)}점</h3></div>
                </div>
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-xl shadow-lg text-white no-print">
                    <h3 className="text-lg font-bold mb-2 flex items-center"><BrainCircuit className="w-5 h-5 mr-2" /> Team AI Analysis</h3>
                    <p className="text-purple-100 text-sm mb-4">전체 또는 선택 인원의 데이터를 분석합니다.</p>
                    <button onClick={handleTeamAnalysis} disabled={isAnalyzing} className="w-full bg-white text-purple-700 py-2 rounded-lg font-bold hover:bg-purple-50 transition-colors flex items-center justify-center">
                        {isAnalyzing ? <><Loader2 className="animate-spin mr-2 w-4 h-4" /> 분석 중...</> : <><Sparkles className="w-4 h-4 mr-2" /> 팀 인사이트 분석하기</>}
                    </button>
                </div>
            </div>
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1"><h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center"><BarChart3 className="w-5 h-5 mr-2 text-slate-500" /> 팀 평균 역량 분포</h3><p className="text-sm text-slate-500">우리 조직의 리더십 밸런스를 확인하세요.</p></div>
                <div className="h-[250px] w-full md:w-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="#e2e8f0" /><PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                        <Radar name="팀 평균" dataKey="A" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.4} /><Tooltip />
                    </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
      )}

      {teamFeedback && (
        <div ref={teamReportRef} className="animate-fade-in bg-slate-50 border-t-4 border-purple-500 rounded-xl shadow-lg overflow-hidden">
            <div className="bg-white p-8">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded border border-purple-200">TEAM INSIGHT</span>
                        <h2 className="text-2xl font-bold text-slate-800 mt-2">조직 리더십 인사이트 리포트</h2>
                        <p className="text-slate-500">AI 분석 데이터 기반 조직 전략 리포트입니다.</p>
                    </div>
                    <div className="flex gap-2 no-print">
                        <button onClick={handleDownloadReportPDF} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors">
                            <Download className="w-4 h-4 mr-2" /> 리포트 PDF 다운로드
                        </button>
                        <button onClick={handleEmailReport} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors">
                            <Mail className="w-4 h-4 mr-2" /> 이메일 전송
                        </button>
                    </div>
                </div>
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 mb-8"><h3 className="font-bold text-purple-900 mb-2 flex items-center"><BrainCircuit className="w-5 h-5 mr-2" /> Executive Summary</h3><p className="text-purple-800 leading-relaxed text-lg">{teamFeedback.analysis}</p></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-slate-200"><h3 className="font-bold text-slate-800 mb-4 flex items-center"><ShieldCheck className="w-5 h-5 text-green-500 mr-2" /> 조직의 강점</h3><ul className="space-y-2">{teamFeedback.strengths.map((s, i) => (<li key={i} className="flex items-start text-slate-600 bg-green-50 p-3 rounded-lg border border-green-100"><span className="font-bold text-green-600 mr-2">{i+1}.</span>{s}</li>))}</ul></div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200"><h3 className="font-bold text-slate-800 mb-4 flex items-center"><AlertTriangle className="w-5 h-5 text-orange-500 mr-2" /> 조직의 과제</h3><ul className="space-y-2">{teamFeedback.weaknesses.map((w, i) => (<li key={i} className="flex items-start text-slate-600 bg-orange-50 p-3 rounded-lg border border-orange-100"><span className="font-bold text-orange-600 mr-2">{i+1}.</span>{w}</li>))}</ul></div>
                </div>
                <div className="mb-8"><h3 className="font-bold text-slate-800 mb-4 flex items-center text-xl"><Zap className="w-6 h-6 text-yellow-500 mr-2" /> 전략적 제언</h3><div className="grid grid-cols-1 gap-4">{teamFeedback.actionPlans.map((plan, i) => (<div key={i} className="bg-white border-l-4 border-l-purple-500 border border-slate-200 p-6 rounded-r-xl shadow-sm"><div className="flex justify-between items-center mb-3"><span className={`text-xs font-bold px-3 py-1 rounded-full ${plan.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{plan.difficulty} Priority</span></div><h4 className="font-bold text-lg text-slate-800 mb-3">{plan.title}</h4><div className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-lg">{plan.description}</div></div>))}</div></div>
                <div className="bg-slate-900 text-white p-6 rounded-xl flex items-center justify-between mb-8"><div><span className="text-slate-400 text-xs font-bold tracking-wider uppercase">Team Mission</span><h3 className="text-xl font-bold mt-1">"{teamFeedback.weeklyMission}"</h3></div><Target className="w-10 h-10 text-purple-400 opacity-50" /></div>
            </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
            <div className="flex flex-col gap-2"><h2 className="text-xl font-bold text-slate-800">{activeTab === 'active' ? '진단 결과 리스트' : '휴지통'}</h2><div className="flex bg-slate-100 rounded-lg p-1 self-start"><button onClick={() => setActiveTab('active')} className={`px-3 py-1 text-sm rounded ${activeTab === 'active' ? 'bg-white shadow text-blue-600 font-bold' : 'text-slate-500'}`}>운영 리스트</button><button onClick={() => setActiveTab('deleted')} className={`px-3 py-1 text-sm rounded ${activeTab === 'deleted' ? 'bg-white shadow text-red-600 font-bold' : 'text-slate-500'}`}>휴지통</button></div></div>
            <div className="relative w-full md:w-auto"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" /><input type="text" placeholder="검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full md:w-64 focus:outline-none focus:border-blue-500" /></div>
        </div>
        <div className="overflow-x-auto"><table className="w-full text-left text-sm text-slate-600"><thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500"><tr>{activeTab === 'active' && <th className="px-6 py-4 w-10 no-print"><button onClick={toggleAllSelection}>{selectedIds.size === filteredData.length ? <CheckSquare className="w-4 h-4 text-blue-600"/> : <Square className="w-4 h-4 text-slate-400"/>}</button></th>}<th className="px-6 py-4 cursor-pointer" onClick={() => handleSort('company')}>회사명</th><th className="px-6 py-4 cursor-pointer" onClick={() => handleSort('date')}>날짜</th><th className="px-6 py-4">이름</th><th className="px-6 py-4">이메일</th><th className="px-6 py-4">직책/부서</th><th className="px-6 py-4">점수</th><th className="px-6 py-4 text-center no-print">관리</th></tr></thead><tbody className="divide-y divide-slate-100">{filteredData.map((member) => (<tr key={member.id} onClick={() => activeTab === 'active' && setSelectedMember(member)} className={`hover:bg-blue-50/50 cursor-pointer ${selectedIds.has(member.id) ? 'bg-blue-50' : ''}`}>{activeTab === 'active' && <td className="px-6 py-4 no-print" onClick={(e) => e.stopPropagation()}><button onClick={() => toggleSelection(member.id)}>{selectedIds.has(member.id) ? <CheckSquare className="w-4 h-4 text-blue-600"/> : <Square className="w-4 h-4 text-slate-300"/>}</button></td>}<td className="px-6 py-4 font-bold text-slate-700">{member.company}</td><td className="px-6 py-4 text-slate-500">{new Date(member.date).toLocaleDateString()}</td><td className="px-6 py-4 font-bold text-slate-800">{member.name}</td><td className="px-6 py-4 text-slate-500">{member.email}</td><td className="px-6 py-4">{member.role} / {member.department}</td><td className="px-6 py-4 font-bold text-blue-600">{member.totalScore.toFixed(1)}</td><td className="px-6 py-4 text-center no-print" onClick={(e) => e.stopPropagation()}>{activeTab === 'active' ? (<div className="flex gap-2 justify-center"><button onClick={(e) => { e.stopPropagation(); setIsEmailModalOpen(true); setEmailRecipient(member.email); }} className="p-2 hover:bg-blue-50 rounded-full"><Send className="w-4 h-4 text-slate-400 hover:text-blue-500" /></button><button onClick={(e) => handleSoftDelete(e, member.id)} className="p-2 hover:bg-red-50 rounded-full"><Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" /></button></div>) : (<div className="flex gap-2 justify-center"><button onClick={(e) => handleRestore(e, member.id)} className="p-2 hover:bg-green-50 rounded-full"><ArchiveRestore className="w-4 h-4 text-slate-400 hover:text-green-600" /></button><button onClick={(e) => handlePermanentDelete(e, member.id)} className="p-2 hover:bg-red-50 rounded-full"><Ban className="w-4 h-4 text-slate-400 hover:text-red-600" /></button></div>)}</td></tr>))}</tbody></table></div>
      </div>

      {selectedMember && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm no-print">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"><div className="p-6 border-b bg-slate-50 flex justify-between items-center"><div><h2 className="text-xl font-bold text-slate-800">{selectedMember.name} 리더십 분석</h2><p className="text-sm text-slate-500">{selectedMember.company} | {selectedMember.role}</p></div><button onClick={() => setSelectedMember(null)} className="p-2 hover:bg-slate-200 rounded-full"><X className="w-6 h-6 text-slate-500" /></button></div><div className="p-8 overflow-y-auto"><Analytics currentAssessment={selectedMember as any} comparisonScores={teamStats?.scores} comparisonLabel="조직 평균" /></div></div>
        </div>
      )}
    </div>
  );
};

export default TeamDashboard;