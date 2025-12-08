export enum Competency {
  COMMUNICATION = 'Communication',
  DECISION_MAKING = 'Decision Making',
  TEAM_MANAGEMENT = 'People & Team Management',
  STRATEGIC_THINKING = 'Strategic Thinking',
  DIGITAL_LEADERSHIP = 'Digital Leadership',
  HYBRID_REMOTE = 'Hybrid & Remote Leadership',
  EQ = 'Emotional/EQ Leadership',
  LEARNING_AGILITY = 'Learning Agility',
  ETHICAL_TRUST = 'Ethical & Trust Leadership'
}

export interface Question {
  id: number;
  competency: Competency;
  text: string;
}

export interface AssessmentResult {
  date: string;
  scores: Record<Competency, number>; // Average score per competency (1-5)
  totalScore: number;
}

export interface ActionPlan {
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface ActionNote {
  date: string;
  action: string;   // 구체적 행동 (What did you do?)
  result: string;   // 결과 및 반응 (What was the outcome?)
  insight: string;  // 배운 점 (What did you learn?)
}

export interface CoachingFeedback {
  analysis: string;
  strengths: string[];
  weaknesses: string[];
  actionPlans: ActionPlan[];
  weeklyMission: string;
}

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  department: string;
  assessments: AssessmentResult[];
  isAdmin?: boolean; // Added for access control
}

export interface TeamAssessmentData {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  date: string;
  scores: Record<Competency, number>;
  totalScore: number;
  isDeleted?: boolean;
}