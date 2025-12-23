
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  BrainCircuit, 
  BarChart3, 
  LogOut, 
  Users,
  ShieldAlert,
  UserCircle,
  Sparkles,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import Assessment from './components/Assessment';
import Coaching from './components/Coaching';
import Analytics from './components/Analytics';
import TeamDashboard from './components/TeamDashboard';
import { AssessmentResult, UserProfile } from './types';
import { mockDB } from './services/mockDatabase';

enum Tab {
  DASHBOARD = 'Dashboard',
  ASSESSMENT = 'Assessment',
  COACHING = 'Coaching',
  ANALYTICS = 'Analytics',
  TEAM = 'Team Dashboard'
}

const LoginScreen = ({ onLogin }: { onLogin: (user: UserProfile) => void }) => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('팀장');
  const [adminId, setAdminId] = useState('');
  const [adminPw, setAdminPw] = useState('');

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && email.trim() && company.trim()) {
      onLogin({
        name, email, company, role,
        department: 'General',
        assessments: [],
        isAdmin: false
      });
    }
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminId === 'admin' && adminPw === 'admin1234') {
      onLogin({
        name: '관리자',
        email: 'admin@limeworks.ai',
        company: 'LimeWorks HQ',
        role: 'Admin',
        department: 'Management',
        assessments: [],
        isAdmin: true
      });
    } else {
      alert("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-100 rounded-full blur-[120px] opacity-40 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-indigo-100 rounded-full blur-[100px] opacity-40 animate-pulse" />
      
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 relative z-10 border border-slate-100">
        <div className={`absolute top-0 left-0 right-0 h-2 rounded-t-[2.5rem] ${isAdminMode ? 'bg-orange-500' : 'bg-blue-600'}`} />
        
        <div className="flex justify-center mb-8">
          <div className={`p-4 rounded-2xl ${isAdminMode ? 'bg-orange-50' : 'bg-blue-50'}`}>
            {isAdminMode ? <ShieldAlert className="w-12 h-12 text-orange-600" /> : <BrainCircuit className="w-12 h-12 text-blue-600" />}
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{isAdminMode ? '관리자 모드' : 'LeadAI 시작하기'}</h1>
          <p className="text-slate-500 mt-2 font-medium">라임웍스 프리미엄 리더십 솔루션</p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
            <button onClick={() => setIsAdminMode(false)} className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${!isAdminMode ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>직원 접속</button>
            <button onClick={() => setIsAdminMode(true)} className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${isAdminMode ? 'bg-white shadow text-orange-600' : 'text-slate-400'}`}>관리자 전용</button>
        </div>

        {isAdminMode ? (
            <form onSubmit={handleAdminSubmit} className="space-y-4">
                <input type="text" required placeholder="admin" value={adminId} onChange={(e) => setAdminId(e.target.value)} className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:border-orange-500 outline-none transition-all" />
                <input type="password" required placeholder="••••••••" value={adminPw} onChange={(e) => setAdminPw(e.target.value)} className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:border-orange-500 outline-none transition-all" />
                <button type="submit" className="w-full bg-orange-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-orange-700 active:scale-95 transition-all mt-4">대시보드 접속</button>
            </form>
        ) : (
            <form onSubmit={handleUserSubmit} className="space-y-4">
                <input type="text" required placeholder="회사명" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:border-blue-500 outline-none" />
                <div className="flex gap-4">
                    <input type="text" required placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:border-blue-500 outline-none" />
                    <input type="text" placeholder="팀장" value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:border-blue-500 outline-none" />
                </div>
                <input type="email" required placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:border-blue-500 outline-none" />
                <button type="submit" className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all mt-4 flex items-center justify-center gap-2">리더십 진단 시작 <ArrowRight className="w-5 h-5" /></button>
            </form>
        )}
      </div>
      <p className="mt-10 text-slate-400 text-xs font-bold tracking-[0.3em] z-10">© 2025 LIMEWORKS LEADAI</p>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  
  const handleLogin = (newUser: UserProfile) => {
    setUser(newUser);
    if (newUser.isAdmin) setActiveTab(Tab.TEAM);
  };

  const handleAssessmentComplete = (result: AssessmentResult) => {
    setAssessmentResult(result);
    setActiveTab(Tab.COACHING);
    if (user) {
      mockDB.addResult({
        id: `user-${Date.now()}`,
        name: user.name,
        email: user.email,
        company: user.company,
        role: user.role,
        department: user.department,
        date: result.date,
        scores: result.scores,
        totalScore: result.totalScore
      });
    }
  };

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  const renderContent = () => {
    switch (activeTab) {
      case Tab.DASHBOARD:
        return (
          <div className="space-y-12 animate-fade-in pb-20">
            <header>
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                <span className="text-blue-600">{user.name}</span>님, 환영합니다 👋
              </h1>
              <p className="text-slate-500 mt-4 text-xl font-medium max-w-2xl">{user.company}의 데이터 기반 리더십 코칭 솔루션입니다.</p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { tab: Tab.ASSESSMENT, icon: ClipboardList, color: 'blue', title: '리더십 진단', desc: '9가지 핵심 지표 기반 정밀 진단' },
                { tab: Tab.COACHING, icon: BrainCircuit, color: 'purple', title: 'AI 전략 코칭', desc: 'GenAI 기반 개인화 전략 리포트' },
                { tab: Tab.ANALYTICS, icon: BarChart3, color: 'emerald', title: '성장 데이터', desc: '시각화된 역량 추이 및 분석' }
              ].map((item) => (
                <div key={item.title} onClick={() => setActiveTab(item.tab)} className="group bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-2xl transition-all cursor-pointer">
                  <div className={`bg-${item.color}-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-xl`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 mb-4">{item.title}</h3>
                  <p className="text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                </div>
              ))}
            </div>

            {assessmentResult ? (
              <div className="bg-slate-900 rounded-[3rem] p-12 text-white mt-16 flex flex-col lg:flex-row justify-between items-center gap-10">
                <div>
                    <div className="flex items-center gap-3 text-blue-400 mb-5"><Sparkles className="w-6 h-6" /><span className="font-black text-sm uppercase tracking-widest">READY TO COACH</span></div>
                    <h3 className="text-4xl font-black mb-5 tracking-tight">AI 전략 리포트가 준비되었습니다</h3>
                </div>
                <button onClick={() => setActiveTab(Tab.COACHING)} className="bg-white text-slate-900 px-12 py-5 rounded-[1.5rem] font-black hover:bg-slate-100 transition-all text-lg">코칭 확인하기</button>
              </div>
            ) : (
              <div className="bg-blue-50/50 rounded-[3rem] p-16 text-center border-2 border-dashed border-blue-100 mt-10">
                <h3 className="text-3xl font-black text-blue-900 mb-6">진단이 아직 없습니다</h3>
                <button onClick={() => setActiveTab(Tab.ASSESSMENT)} className="bg-blue-600 text-white px-14 py-5 rounded-2xl font-black shadow-2xl hover:bg-blue-700 transition-all text-lg flex items-center gap-3 mx-auto">지금 바로 시작 <ChevronRight className="w-6 h-6" /></button>
              </div>
            )}
          </div>
        );
      case Tab.ASSESSMENT:
        return <div className="max-w-4xl mx-auto py-10"><h2 className="text-4xl font-black text-slate-900 mb-12 tracking-tight">리더십 역량 진단</h2><Assessment onComplete={handleAssessmentComplete} onCancel={() => setActiveTab(Tab.DASHBOARD)} /></div>;
      case Tab.COACHING:
        return <Coaching assessment={assessmentResult} onRetake={() => setActiveTab(Tab.ASSESSMENT)} userName={user.name} />;
      case Tab.ANALYTICS:
        return <Analytics currentAssessment={assessmentResult} userName={user.name} />;
      case Tab.TEAM:
        return user.isAdmin ? <TeamDashboard /> : null;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans">
      <aside className="w-80 bg-white border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen shadow-sm no-print">
        <div className="p-10 flex items-center space-x-3 text-blue-600">
           <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg"><BrainCircuit className="w-7 h-7 text-white" /></div>
           <span className="font-black text-3xl tracking-tighter">LeadAI</span>
        </div>
        <nav className="flex-1 px-6 space-y-2 mt-4">
          {[Tab.DASHBOARD, Tab.ASSESSMENT, Tab.COACHING, Tab.ANALYTICS].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full flex items-center px-6 py-4.5 rounded-[1.5rem] text-[16px] font-black transition-all ${activeTab === tab ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}>
              {tab === Tab.DASHBOARD && <LayoutDashboard className="w-6 h-6 mr-4" />}
              {tab === Tab.ASSESSMENT && <ClipboardList className="w-6 h-6 mr-4" />}
              {tab === Tab.COACHING && <BrainCircuit className="w-6 h-6 mr-4" />}
              {tab === Tab.ANALYTICS && <BarChart3 className="w-6 h-6 mr-4" />}
              {tab === Tab.DASHBOARD ? '홈' : tab === Tab.ASSESSMENT ? '진단' : tab === Tab.COACHING ? '코칭' : '리포트'}
            </button>
          ))}
          {user.isAdmin && <button onClick={() => setActiveTab(Tab.TEAM)} className={`w-full flex items-center px-6 py-4.5 rounded-[1.5rem] text-[16px] font-black transition-all ${activeTab === Tab.TEAM ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}><Users className="w-6 h-6 mr-4" /> 조직 관리</button>}
        </nav>
        <div className="p-8"><button onClick={() => setUser(null)} className="w-full flex items-center justify-center gap-3 text-slate-400 hover:text-red-600 font-black text-sm py-4 border-t border-slate-100 transition-colors"><LogOut className="w-4 h-4" /> 로그아웃</button></div>
      </aside>
      <main className="flex-1 overflow-y-auto"><div className="max-w-7xl mx-auto p-6 md:p-16">{renderContent()}</div></main>
    </div>
  );
};

export default App;
