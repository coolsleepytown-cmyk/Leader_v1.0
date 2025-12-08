import React, { useState, useEffect } from 'react';
import { 
  Users, TrendingUp, Search, ChevronRight, X, Trash2, ArchiveRestore, Ban, Mail, BarChart3
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip 
} from 'recharts';
import { TeamAssessmentData, AssessmentResult, Competency } from '../types';
import { mockDB } from '../services/mockDatabase';
import { COMPETENCY_LABELS } from '../constants';
import Analytics from './Analytics';

const TeamDashboard: React.FC = () => {
  const [teamData, setTeamData] = useState<TeamAssessmentData[]>([]);
  const [teamStats, setTeamStats] = useState<any>(null);
  const [selectedMember, setSelectedMember] = useState<TeamAssessmentData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');

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