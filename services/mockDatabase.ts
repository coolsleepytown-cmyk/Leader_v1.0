import { Competency, TeamAssessmentData } from "../types";

const STORAGE_KEY = "LEADAI_TEAM_DATA";

// Restore Initial Mock Data so dashboard is not empty
const INITIAL_MOCK_DATA: TeamAssessmentData[] = [
  {
    id: 'mock-1',
    name: '김철수',
    email: 'kim@company.com',
    role: '팀장',
    department: '영업 1팀',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    scores: {
      [Competency.COMMUNICATION]: 4.5,
      [Competency.DECISION_MAKING]: 4.0,
      [Competency.TEAM_MANAGEMENT]: 3.5,
      [Competency.STRATEGIC_THINKING]: 3.0,
      [Competency.DIGITAL_LEADERSHIP]: 4.0,
      [Competency.HYBRID_REMOTE]: 3.5,
      [Competency.EQ]: 4.5,
      [Competency.LEARNING_AGILITY]: 4.0,
      [Competency.ETHICAL_TRUST]: 5.0,
    },
    totalScore: 4.0,
    isDeleted: false
  },
  {
    id: 'mock-2',
    name: '이영희',
    email: 'lee@company.com',
    role: '파트장',
    department: '개발팀',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days ago
    scores: {
      [Competency.COMMUNICATION]: 3.0,
      [Competency.DECISION_MAKING]: 4.5,
      [Competency.TEAM_MANAGEMENT]: 4.0,
      [Competency.STRATEGIC_THINKING]: 4.5,
      [Competency.DIGITAL_LEADERSHIP]: 5.0,
      [Competency.HYBRID_REMOTE]: 4.5,
      [Competency.EQ]: 3.5,
      [Competency.LEARNING_AGILITY]: 5.0,
      [Competency.ETHICAL_TRUST]: 4.0,
    },
    totalScore: 4.2,
    isDeleted: false
  },
  {
    id: 'mock-3',
    name: '박지성',
    email: 'park@company.com',
    role: '매니저',
    department: '인사팀',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    scores: {
      [Competency.COMMUNICATION]: 5.0,
      [Competency.DECISION_MAKING]: 3.0,
      [Competency.TEAM_MANAGEMENT]: 4.5,
      [Competency.STRATEGIC_THINKING]: 2.5,
      [Competency.DIGITAL_LEADERSHIP]: 3.0,
      [Competency.HYBRID_REMOTE]: 3.5,
      [Competency.EQ]: 5.0,
      [Competency.LEARNING_AGILITY]: 3.5,
      [Competency.ETHICAL_TRUST]: 5.0,
    },
    totalScore: 3.9,
    isDeleted: false
  },
  {
    id: 'mock-4',
    name: '최민수',
    email: 'choi@company.com',
    role: '팀장',
    department: '마케팅',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    scores: {
      [Competency.COMMUNICATION]: 4.0,
      [Competency.DECISION_MAKING]: 4.0,
      [Competency.TEAM_MANAGEMENT]: 4.0,
      [Competency.STRATEGIC_THINKING]: 4.0,
      [Competency.DIGITAL_LEADERSHIP]: 4.0,
      [Competency.HYBRID_REMOTE]: 4.0,
      [Competency.EQ]: 4.0,
      [Competency.LEARNING_AGILITY]: 4.0,
      [Competency.ETHICAL_TRUST]: 4.0,
    },
    totalScore: 4.0,
    isDeleted: true // Example of deleted user
  }
];

export const mockDB = {
  // Load data simply but robustly
  getAll: (): TeamAssessmentData[] => {
    try {
      if (typeof window === 'undefined') return INITIAL_MOCK_DATA;
      
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as TeamAssessmentData[];
      }
      
      // Initialize if empty
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_DATA));
      return INITIAL_MOCK_DATA;
    } catch (error) {
      console.error("Failed to load team data:", error);
      return INITIAL_MOCK_DATA;
    }
  },

  // Save result - append to top
  addResult: (data: TeamAssessmentData) => {
    try {
      // Must read from storage to get latest
      const currentData = mockDB.getAll();
      
      const newItem = {
        ...data,
        id: data.id || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        isDeleted: false
      };

      const newData = [newItem, ...currentData];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    } catch (error) {
      console.error("Failed to save team data:", error);
      return [];
    }
  },

  // Simple Soft Delete
  softDeleteResult: (id: string) => {
    try {
      const currentData = mockDB.getAll();
      const newData = currentData.map(item => 
        item.id === id ? { ...item, isDeleted: true } : item
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    } catch (error) {
      console.error("Failed to soft delete:", error);
      return [];
    }
  },

  // Restore
  restoreResult: (id: string) => {
    try {
      const currentData = mockDB.getAll();
      const newData = currentData.map(item => 
        item.id === id ? { ...item, isDeleted: false } : item
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    } catch (error) {
      console.error("Failed to restore:", error);
      return [];
    }
  },

  // Permanent Delete
  permanentDeleteResult: (id: string) => {
    try {
      const currentData = mockDB.getAll();
      const newData = currentData.filter(item => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      return newData;
    } catch (error) {
      console.error("Failed to permanently delete:", error);
      return [];
    }
  },

  // Stats calculation
  getTeamStats: () => {
    const data = mockDB.getAll().filter(item => !item.isDeleted);
    if (data.length === 0) return null;

    const competencies = [
      'Communication', 'Decision Making', 'People & Team Management',
      'Strategic Thinking', 'Digital Leadership', 'Hybrid & Remote Leadership',
      'Emotional/EQ Leadership', 'Learning Agility', 'Ethical & Trust Leadership'
    ] as Competency[];

    const avgScores: Partial<Record<Competency, number>> = {};

    competencies.forEach((comp) => {
      const sum = data.reduce((acc, curr) => acc + (curr.scores[comp] || 0), 0);
      avgScores[comp] = sum / data.length;
    });

    const totalAvg = data.reduce((acc, curr) => acc + curr.totalScore, 0) / data.length;

    return {
      scores: avgScores as Record<Competency, number>,
      totalAvg,
      count: data.length,
    };
  }
};