import React from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { AssessmentResult, Competency } from '../types';
import { COMPETENCY_LABELS, MOCK_HISTORY } from '../constants';
import { Lock } from 'lucide-react';

interface AnalyticsProps {
  currentAssessment: AssessmentResult | null;
  comparisonScores?: Record<Competency, number>; // Optional comparison dataset
  comparisonLabel?: string;
}

const Analytics: React.FC<AnalyticsProps> = ({ 
  currentAssessment, 
  comparisonScores = MOCK_HISTORY, // Default to Mock History if not provided
  comparisonLabel = "동료 평균 (Peer Group)"
}) => {
  if (!currentAssessment) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 animate-fade-in">
        <Lock className="w-12 h-12 text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-500">데이터가 없습니다</h3>
        <p className="text-slate-400">진단을 완료하면 분석 차트가 표시됩니다.</p>
      </div>
    );
  }

  // Prepare data for Radar Chart
  const radarData = Object.values(Competency).map((comp) => ({
    subject: COMPETENCY_LABELS[comp].split(' (')[0], // Use simplified Korean name
    A: currentAssessment.scores[comp] || 0,
    B: comparisonScores[comp] || 0,
    fullMark: 5,
  }));

  // Prepare data for Bar Chart (Strengths sorted)
  const barData = Object.entries(currentAssessment.scores)
    .map(([key, value]) => ({
      name: COMPETENCY_LABELS[key as Competency].split(' (')[0],
      score: Number(value),
    }))
    .sort((a, b) => b.score - a.score); // Descending order

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Radar Chart: Competency Balance */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start mb-2">
            <div>
                <h3 className="text-lg font-bold text-slate-800">역량 밸런스 비교</h3>
                <p className="text-sm text-slate-500">나 vs {comparisonLabel}</p>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                <Radar
                  name="나"
                  dataKey="A"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="#3b82f6"
                  fillOpacity={0.5}
                />
                <Radar
                  name={comparisonLabel}
                  dataKey="B"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  fill="#cbd5e1"
                  fillOpacity={0.3}
                />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Scores Ranked */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-2">상세 점수 순위</h3>
          <p className="text-sm text-slate-500 mb-6">나의 강점과 약점을 순위별로 파악할 수 있습니다.</p>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" domain={[0, 5]} hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={100} 
                  tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }} 
                />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="score" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;