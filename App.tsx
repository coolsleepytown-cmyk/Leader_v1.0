import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  BrainCircuit, 
  BarChart3, 
  LogOut, 
  Users,
} from 'lucide-react';
import Assessment from './components/Assessment';
import Coaching from './components/Coaching';
import Analytics from './components/Analytics';
import TeamDashboard from './components/TeamDashboard';
import { AssessmentResult, UserProfile, Competency } from './types';
import { mockDB } from './services/mockDatabase';

enum Tab {
  DASHBOARD = 'Dashboard',
  ASSESSMENT = 'Assessment',
  COACHING = 'Coaching',
  ANALYTICS = 'Analytics',
  TEAM = 'Team Dashboard'
}

// Login Component
const LoginScreen = ({ onLogin }: { onLogin: (user: UserProfile) => void }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('팀장');
  const [department, setDepartment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && email.trim()) {
      // Simple Admin Logic: Check if name or role implies admin rights
      const isAdmin = name.toLowerCase() === 'admin' || role.toLowerCase() === 'admin' || name === '관리자';
      
      onLogin({
        name: name,
        email: email,
        role: role || '팀장',
        department: department || 'General',
        assessments: [],
        isAdmin: isAdmin
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 animate-fade-in">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-100 p-3 rounded-full">
            <BrainCircuit className="w-12 h-12 text-blue-600" />
          </div>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">LeadAI 시작하기</h1>
          <p className="text-slate-500 mt-2">리더십 역량 강화를 위한 첫 걸음</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">이름</label>
            <input 
              type="text" 
              required
              placeholder="이름을 입력하세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">이메일</label>
            <input 
              type="email" 
              required
              placeholder="example@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">직책/역할</label>
            <input 
              type="text" 
              placeholder="예: 팀장, 파트장"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">부서 (선택)</label>
            <input 
              type="text" 
              placeholder="예: 영업기획팀"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 mt-2"
          >
            접속하기
          </button>
        </form>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  
  const handleLogin = (newUser: UserProfile) => {
    setUser(newUser);
  };

  const handleLogout = () => {
    setUser(null);
    setAssessmentResult(null);
    setActiveTab(Tab.DASHBOARD);
  };

  const handleAssessmentComplete = (result: AssessmentResult) => {
    setAssessmentResult(result);
    setActiveTab(Tab.COACHING);
    
    // Auto-save to Team Dashboard (Mock DB)
    if (user) {
      // Generate a unique ID to prevent overwrite and ensure robust multi-user simulation
      const uniqueId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      mockDB.addResult({
        id: uniqueId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        date: result.date,
        scores: result.scores,
        totalScore: result.totalScore
      });
    }
  };

  // Login Screen
  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case Tab.DASHBOARD:
        return (
          <div className="space-y-8 animate-fade-in">
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-slate-800">
                안녕하세요, {user.name} {user.role}님 👋
              </h1>
              <p className="text-slate-500 mt-2">오늘도 더 나은 리더가 되기 위한 여정을 시작해보세요.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab(Tab.ASSESSMENT)}>
                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <ClipboardList className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">리더십 진단</h3>
                <p className="text-slate-500 text-sm mt-2">9가지 핵심 역량에 대한 자가 진단을 수행하세요.</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab(Tab.COACHING)}>
                <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <BrainCircuit className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">AI 코칭</h3>
                <p className="text-slate-500 text-sm mt-2">진단 결과를 바탕으로 한 맞춤형 피드백을 확인하세요.</p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab(Tab.ANALYTICS)}>
                <div className="bg-emerald-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">성장 분석</h3>
                <p className="text-slate-500 text-sm mt-2">나의 리더십 스타일 변화 추이를 시각화합니다.</p>
              </div>
              
              {user.isAdmin && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab(Tab.TEAM)}>
                  <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">팀 대시보드</h3>
                  <p className="text-slate-500 text-sm mt-2">팀원들의 진단 결과와 조직 통계를 확인하세요.</p>
                </div>
              )}
            </div>

            {assessmentResult && (
               <div className="bg-slate-900 rounded-xl p-8 text-white mt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                 <div>
                    <h3 className="text-xl font-bold mb-2">최근 진단 결과 분석 완료</h3>
                    <p className="text-slate-400">
                      {new Date(assessmentResult.date).toLocaleDateString()} 진행된 진단에 대한 AI 분석이 준비되었습니다.
                    </p>
                 </div>
                 <button 
                  onClick={() => setActiveTab(Tab.COACHING)}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-bold transition-colors whitespace-nowrap"
                 >
                    결과 보기
                 </button>
               </div>
            )}
          </div>
        );
      case Tab.ASSESSMENT:
        return (
          <div className="max-w-4xl mx-auto animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">리더십 역량 진단 (Self-Assessment)</h2>
            <Assessment 
              onComplete={handleAssessmentComplete} 
              onCancel={() => setActiveTab(Tab.DASHBOARD)}
            />
          </div>
        );
      case Tab.COACHING:
        return (
          <Coaching 
            assessment={assessmentResult} 
            onRetake={() => setActiveTab(Tab.ASSESSMENT)} 
            userName={user.name}
          />
        );
      case Tab.ANALYTICS:
        return <Analytics currentAssessment={assessmentResult} />;
      case Tab.TEAM:
        return user.isAdmin ? <TeamDashboard /> : null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6">
          <div className="flex items-center space-x-2 text-blue-700 font-bold text-2xl">
             <BrainCircuit className="w-8 h-8" />
             <span>LeadAI</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button
            onClick={() => setActiveTab(Tab.DASHBOARD)}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors
              ${activeTab === Tab.DASHBOARD ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <LayoutDashboard className="w-5 h-5 mr-3" />
            대시보드
          </button>
          <button
            onClick={() => setActiveTab(Tab.ASSESSMENT)}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors
              ${activeTab === Tab.ASSESSMENT ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <ClipboardList className="w-5 h-5 mr-3" />
            진단하기
          </button>
          <button
            onClick={() => setActiveTab(Tab.COACHING)}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors
              ${activeTab === Tab.COACHING ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <BrainCircuit className="w-5 h-5 mr-3" />
            AI 코칭
          </button>
          <button
            onClick={() => setActiveTab(Tab.ANALYTICS)}
            className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors
              ${activeTab === Tab.ANALYTICS ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <BarChart3 className="w-5 h-5 mr-3" />
            분석 리포트
          </button>
          
          {user.isAdmin && (
            <button
              onClick={() => setActiveTab(Tab.TEAM)}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors
                ${activeTab === Tab.TEAM ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Users className="w-5 h-5 mr-3" />
              팀 대시보드
            </button>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center p-2 rounded-lg bg-slate-50 mb-4">
             <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center mr-3 text-blue-700 font-bold">
               {user.name.charAt(0)}
             </div>
             <div>
                <p className="text-sm font-bold text-slate-800">{user.name}</p>
                <p className="text-xs text-slate-500 truncate w-32">{user.role}</p>
             </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center text-slate-500 hover:text-red-600 text-sm py-2"
          >
            <LogOut className="w-4 h-4 mr-2" />
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center space-x-2 text-blue-700 font-bold text-xl">
             <BrainCircuit className="w-6 h-6" />
             <span>LeadAI</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">{user.name}</span>
            <button onClick={handleLogout} className="p-2 text-slate-600">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-w-7xl mx-auto p-4 md:p-8">
           {renderContent()}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around p-3 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          <button onClick={() => setActiveTab(Tab.DASHBOARD)} className={`p-2 flex flex-col items-center ${activeTab === Tab.DASHBOARD ? 'text-blue-600' : 'text-slate-400'}`}>
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-[10px] mt-1">홈</span>
          </button>
          <button onClick={() => setActiveTab(Tab.ASSESSMENT)} className={`p-2 flex flex-col items-center ${activeTab === Tab.ASSESSMENT ? 'text-blue-600' : 'text-slate-400'}`}>
            <ClipboardList className="w-6 h-6" />
            <span className="text-[10px] mt-1">진단</span>
          </button>
          <button onClick={() => setActiveTab(Tab.COACHING)} className={`p-2 flex flex-col items-center ${activeTab === Tab.COACHING ? 'text-blue-600' : 'text-slate-400'}`}>
            <BrainCircuit className="w-6 h-6" />
            <span className="text-[10px] mt-1">코칭</span>
          </button>
           {user.isAdmin && (
            <button onClick={() => setActiveTab(Tab.TEAM)} className={`p-2 flex flex-col items-center ${activeTab === Tab.TEAM ? 'text-blue-600' : 'text-slate-400'}`}>
              <Users className="w-6 h-6" />
              <span className="text-[10px] mt-1">팀</span>
            </button>
           )}
      </nav>
    </div>
  );
};

export default App;