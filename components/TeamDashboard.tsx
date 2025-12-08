import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, TrendingUp, Search, ChevronRight, X, Trash2, ArchiveRestore, Ban, Mail, BarChart3,
  Download, FileSpreadsheet, BrainCircuit, Sparkles, Target, AlertTriangle, ShieldCheck, Zap
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip 
} from 'recharts';
import { TeamAssessmentData, AssessmentResult, Competency, CoachingFeedback } from '../types';
import { mockDB } from '../services/mockDatabase';
import { generateTeamFeedback } from '../services/geminiService';
import { COMPETENCY_LABELS } from '../constants';
import Analytics from './Analytics';
import html2canvas from 'html2canvas';

const TeamDashboard: React.FC = () => {
  const [teamData, setTeamData] = useState<TeamAssessmentData[]>([]);
  const [teamStats, setTeamStats] = useState<any>(null);
  const [selectedMember, setSelectedMember] = useState<TeamAssessmentData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');
  
  // Team Analysis State
  const [teamFeedback, setTeamFeedback] = useState<CoachingFeedback | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const teamReportRef = useRef<HTMLDivElement>(null);

  // Load data function
  const loadData = () => {
    const data = mockDB.getAll();
    const stats = mockDB.getTeamStats();
    // Sort by date descending (Newest first)
    setTeamData(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setTeamStats(stats);
  };

  useEffect(() => {
    loadData();

    // Listen for storage changes from other tabs or components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "LEADAI_TEAM_DATA") {
        loadData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // --- Filter Logic ---
  const filteredData = teamData.filter(member => {
    // Basic search
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      member.name.toLowerCase().includes(term) ||
      member.department.toLowerCase().includes(term) ||
      member.email.toLowerCase().includes(term);
    
    // Tab filter
    const isDeleted = !!member.isDeleted;
    const matchesTab = activeTab === 'active' ? !isDeleted : isDeleted;
    
    return matchesSearch && matchesTab;
  });

  // --- Action Handlers ---

  const handleSoftDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("선택한 항목을 휴지통으로 이동하시겠습니까?")) {
      mockDB.softDeleteResult(id);
      loadData();
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

  // --- New Features Handlers ---

  const handleDownloadCSV = () => {
    if (filteredData.length === 0) {
        alert("다운로드할 데이터가 없습니다.");
        return;
    }

    // CSV Header
    const headers = [
        "이름", "이메일", "직책", "부서", "진단일자", "종합점수",
        ...Object.values(COMPETENCY_LABELS).map(l => l.split(' (')[0])
    ];

    // CSV Rows
    const rows = filteredData.map(member => [
        member.name,
        member.email,
        member.role,
        member.department,
        new Date(member.date).toLocaleDateString(),
        member.totalScore.toFixed(2),
        ...Object.values(Competency).map(c => member.scores[c]?.toFixed(1) || "0")
    ]);

    // Combine
    const csvContent = [
        headers.join(","),
        ...rows.map(r => r.join(","))
    ].join("\n");

    // Create Download Link
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `LeadAI_Team_Data_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTeamAnalysis = async () => {
    if (!teamStats) return;
    setIsAnalyzing(true);
    try {
        const feedback = await generateTeamFeedback(teamStats.scores);
        setTeamFeedback(feedback);
        // Scroll to report
        setTimeout(() => {
            teamReportRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    } catch (e) {
        console.error(e);
        alert("분석 중 오류가 발생했습니다.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleDownloadTeamReport = async () => {
    if (!teamReportRef.current) return;
    try {
        const canvas = await html2canvas(teamReportRef.current, {
            backgroundColor: '#f8fafc',
            scale: 2,
            ignoreElements: (el) => el.classList.contains('no-print')
        });
        const image = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.href = image;
        link.download = `LeadAI_Team_Report_${new Date().toISOString().slice(0,10)}.png`;
        link.click();
    } catch (e) {
        console.error("Image capture failed", e);
    }
  };

  // Prepare Chart Data if stats exist
  const radarData = teamStats ? Object.values(Competency).map((comp) => ({
    subject: COMPETENCY_LABELS[comp].split(' (')[0],
    A: teamStats.scores[comp] || 0,
    fullMark: 5,
  })) : [];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header & Stats (Active Only) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">팀 대시보드</h1>
            <p className="text-slate-500">조직 구성원의 리더십 진단 현황과 통계를 관리합니다.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleDownloadCSV}
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-sm"
            >
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                전체 결과 다운로드 (Excel)
            </button>
        </div>
      </div>

      {teamStats && activeTab === 'active' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Summary Cards */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
                    <div className="p-4 bg-blue-100 rounded-full mr-5">
                        <Users className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">총 진단 인원</p>
                        <h3 className="text-3xl font-bold text-slate-800">{teamStats.count}명</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center">
                    <div className="p-4 bg-green-100 rounded-full mr-5">
                        <TrendingUp className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">조직 평균 점수</p>
                        <h3 className="text-3xl font-bold text-slate-800">{teamStats.totalAvg.toFixed(1)}점</h3>
                    </div>
                </div>
                
                {/* AI Analysis Trigger Button */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 rounded-xl shadow-lg text-white">
                    <h3 className="text-lg font-bold mb-2 flex items-center">
                        <BrainCircuit className="w-5 h-5 mr-2" />
                        Team AI Analysis
                    </h3>
                    <p className="text-purple-100 text-sm mb-4">
                        우리 팀의 데이터를 기반으로 조직 문화와 강점을 심층 분석합니다.
                    </p>
                    <button 
                        onClick={handleTeamAnalysis}
                        disabled={isAnalyzing}
                        className="w-full bg-white text-purple-700 py-2 rounded-lg font-bold hover:bg-purple-50 transition-colors flex items-center justify-center"
                    >
                        {isAnalyzing ? (
                            <>
                                <span className="animate-spin mr-2">⏳</span> 분석 중...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                팀 인사이트 분석하기
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Team Radar Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center">
                        <BarChart3 className="w-5 h-5 mr-2 text-slate-500" />
                        팀 평균 역량 분포
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">
                        우리 조직의 강점과 보완점이 시각화됩니다.<br/>
                        데이터가 쌓일수록 정확도가 높아집니다.
                    </p>
                </div>
                <div className="h-[250px] w-full md:w-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                        <Radar
                            name="팀 평균"
                            dataKey="A"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fill="#3b82f6"
                            fillOpacity={0.4}
                        />
                        <Tooltip 
                             contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                    </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
      )}

      {/* Team AI Report Section (Conditionally Rendered) */}
      {teamFeedback && (
        <div ref={teamReportRef} className="animate-fade-in bg-slate-50 border-t-4 border-purple-500 rounded-xl shadow-lg overflow-hidden">
            <div className="bg-white p-8">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded">TEAM INSIGHT</span>
                        <h2 className="text-2xl font-bold text-slate-800 mt-2">조직 리더십 인사이트 리포트</h2>
                        <p className="text-slate-500">AI가 분석한 우리 조직의 문화적 특성과 전략적 제언입니다.</p>
                    </div>
                    <button 
                        onClick={handleDownloadTeamReport}
                        className="no-print bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        리포트 저장
                    </button>
                </div>

                <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 mb-8">
                    <h3 className="font-bold text-purple-900 mb-2 flex items-center">
                        <BrainCircuit className="w-5 h-5 mr-2" />
                        Executive Summary
                    </h3>
                    <p className="text-purple-800 leading-relaxed text-lg">
                        {teamFeedback.analysis}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                            <ShieldCheck className="w-5 h-5 text-green-500 mr-2" />
                            조직의 강점 (Top Strengths)
                        </h3>
                        <ul className="space-y-2">
                            {teamFeedback.strengths.map((s, i) => (
                                <li key={i} className="flex items-start text-slate-600 bg-green-50 p-3 rounded-lg">
                                    <span className="font-bold text-green-600 mr-2">{i+1}.</span>
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                            <AlertTriangle className="w-5 h-5 text-orange-500 mr-2" />
                            조직의 과제 (Key Challenges)
                        </h3>
                        <ul className="space-y-2">
                            {teamFeedback.weaknesses.map((w, i) => (
                                <li key={i} className="flex items-start text-slate-600 bg-orange-50 p-3 rounded-lg">
                                    <span className="font-bold text-orange-600 mr-2">{i+1}.</span>
                                    {w}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                        <Zap className="w-5 h-5 text-yellow-500 mr-2" />
                        전략적 제언 (Strategic Action Plan)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {teamFeedback.actionPlans.map((plan, i) => (
                            <div key={i} className="bg-slate-50 border border-slate-200 p-5 rounded-xl hover:border-purple-300 transition-colors">
                                <span className={`text-xs font-bold px-2 py-1 rounded mb-2 inline-block
                                    ${plan.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : 
                                      plan.difficulty === 'Medium' ? 'bg-blue-100 text-blue-700' : 
                                      'bg-red-100 text-red-700'}`}>
                                    {plan.difficulty} Priority
                                </span>
                                <h4 className="font-bold text-slate-800 mb-2">{plan.title}</h4>
                                <p className="text-sm text-slate-600">{plan.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-900 text-white p-6 rounded-xl flex items-center justify-between">
                    <div>
                        <span className="text-slate-400 text-xs font-bold tracking-wider">TEAM MISSION CAMPAIGN</span>
                        <h3 className="text-xl font-bold mt-1">"{teamFeedback.weeklyMission}"</h3>
                    </div>
                    <Target className="w-10 h-10 text-purple-400 opacity-50" />
                </div>
            </div>
        </div>
      )}

      {/* Main List Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col gap-2">
                <h2 className="text-xl font-bold text-slate-800">
                  {activeTab === 'active' ? '진단 결과 리스트' : '휴지통 (삭제된 항목)'}
                </h2>
                <div className="flex bg-slate-100 rounded-lg p-1 self-start">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-3 py-1 text-sm rounded ${activeTab === 'active' ? 'bg-white shadow text-blue-600 font-bold' : 'text-slate-500'}`}
                    >
                        운영 리스트
                    </button>
                    <button
                        onClick={() => setActiveTab('deleted')}
                        className={`px-3 py-1 text-sm rounded ${activeTab === 'deleted' ? 'bg-white shadow text-red-600 font-bold' : 'text-slate-500'}`}
                    >
                        휴지통
                    </button>
                </div>
            </div>

            <div className="relative w-full md:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                    type="text" 
                    placeholder="이름, 이메일, 부서 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full md:w-64 focus:outline-none focus:border-blue-500"
                />
            </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
                    <tr>
                        <th className="px-6 py-4">이름</th>
                        <th className="px-6 py-4">이메일</th>
                        <th className="px-6 py-4">직책/부서</th>
                        <th className="px-6 py-4">날짜</th>
                        <th className="px-6 py-4">종합 점수</th>
                        <th className="px-6 py-4 text-center">관리</th>
                        {activeTab === 'active' && <th className="px-6 py-4 text-right">상세 보기</th>}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredData.map((member) => (
                        <tr 
                            key={member.id} 
                            onClick={() => activeTab === 'active' && setSelectedMember(member)}
                            className={`hover:bg-blue-50/50 transition-colors cursor-pointer group`}
                        >
                            <td className="px-6 py-4 font-bold text-slate-800">{member.name}</td>
                            <td className="px-6 py-4 flex items-center gap-2">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {member.email}
                            </td>
                            <td className="px-6 py-4">{member.role} / {member.department}</td>
                            <td className="px-6 py-4 text-slate-500">{new Date(member.date).toLocaleDateString()}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded font-bold ${
                                    member.totalScore >= 4 ? 'bg-blue-100 text-blue-700' :
                                    member.totalScore >= 3.5 ? 'bg-green-100 text-green-700' : 
                                    'bg-orange-100 text-orange-700'
                                }`}>
                                    {member.totalScore.toFixed(1)}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                {activeTab === 'active' ? (
                                    <button 
                                        onClick={(e) => handleSoftDelete(e, member.id)}
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                        title="삭제"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        <button 
                                            onClick={(e) => handleRestore(e, member.id)}
                                            className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-full"
                                            title="복구"
                                        >
                                            <ArchiveRestore className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={(e) => handlePermanentDelete(e, member.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                            title="영구 삭제"
                                        >
                                            <Ban className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </td>
                            {activeTab === 'active' && (
                                <td className="px-6 py-4 text-right">
                                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors ml-auto" />
                                </td>
                            )}
                        </tr>
                    ))}
                    {filteredData.length === 0 && (
                        <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                                데이터가 없습니다.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{selectedMember.name} 님의 리더십 분석</h2>
                        <div className="flex items-center text-sm text-slate-500 mt-1">
                            <span className="mr-3">{selectedMember.email}</span>
                            <span>{selectedMember.role} | {selectedMember.department}</span>
                        </div>
                    </div>
                    <button onClick={() => setSelectedMember(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-6 h-6 text-slate-500" />
                    </button>
                </div>
                <div className="p-8 overflow-y-auto">
                    <Analytics 
                        currentAssessment={selectedMember as unknown as AssessmentResult}
                        comparisonScores={teamStats?.scores}
                        comparisonLabel="조직 평균"
                    />
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default TeamDashboard;