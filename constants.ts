import { Competency, Question } from './types';

export const COMPETENCY_LABELS: Record<Competency, string> = {
  [Competency.COMMUNICATION]: '의사소통 (Communication)',
  [Competency.DECISION_MAKING]: '의사결정 (Decision Making)',
  [Competency.TEAM_MANAGEMENT]: '조직 관리 (Team Management)',
  [Competency.STRATEGIC_THINKING]: '전략적 사고 (Strategic Thinking)',
  [Competency.DIGITAL_LEADERSHIP]: '디지털 리더십 (Digital Leadership)',
  [Competency.HYBRID_REMOTE]: '하이브리드 리더십 (Hybrid/Remote)',
  [Competency.EQ]: '감성 지능 (EQ)',
  [Competency.LEARNING_AGILITY]: '학습 민첩성 (Learning Agility)',
  [Competency.ETHICAL_TRUST]: '윤리 및 신뢰 (Ethical & Trust)',
};

// Simplified question set for the demo (2 questions per competency)
export const ASSESSMENT_QUESTIONS: Question[] = [
  { id: 1, competency: Competency.COMMUNICATION, text: "나는 팀원들에게 명확하고 간결하게 비전을 전달합니까?" },
  { id: 2, competency: Competency.COMMUNICATION, text: "나는 타인의 의견을 경청하고 피드백을 수용합니까?" },
  { id: 3, competency: Competency.DECISION_MAKING, text: "나는 데이터와 직관을 균형 있게 사용하여 결정을 내립니까?" },
  { id: 4, competency: Competency.DECISION_MAKING, text: "나는 불확실한 상황에서도 적시에 결단을 내릴 수 있습니까?" },
  { id: 5, competency: Competency.TEAM_MANAGEMENT, text: "나는 팀원의 성장을 위해 적절한 위임을 실행합니까?" },
  { id: 6, competency: Competency.TEAM_MANAGEMENT, text: "나는 팀 내 갈등을 건설적으로 해결합니까?" },
  { id: 7, competency: Competency.STRATEGIC_THINKING, text: "나는 단기 성과와 장기 목표 사이의 균형을 유지합니까?" },
  { id: 8, competency: Competency.STRATEGIC_THINKING, text: "나는 시장의 변화를 예측하고 선제적으로 대응합니까?" },
  { id: 9, competency: Competency.DIGITAL_LEADERSHIP, text: "나는 최신 디지털 도구를 업무 효율화에 적극 활용합니까?" },
  { id: 10, competency: Competency.DIGITAL_LEADERSHIP, text: "나는 데이터 기반의 의사결정 문화를 장려합니까?" },
  { id: 11, competency: Competency.HYBRID_REMOTE, text: "나는 원격 근무 환경에서도 팀의 결속력을 유지합니까?" },
  { id: 12, competency: Competency.HYBRID_REMOTE, text: "나는 비대면 상황에서 성과를 공정하게 평가합니까?" },
  { id: 13, competency: Competency.EQ, text: "나는 팀원의 감정 상태를 파악하고 적절히 대응합니까?" },
  { id: 14, competency: Competency.EQ, text: "나는 스트레스 상황에서도 감정을 조절할 수 있습니까?" },
  { id: 15, competency: Competency.LEARNING_AGILITY, text: "나는 실패로부터 배우고 새로운 방식에 도전합니까?" },
  { id: 16, competency: Competency.LEARNING_AGILITY, text: "나는 지속적으로 새로운 지식과 기술을 습득합니까?" },
  { id: 17, competency: Competency.ETHICAL_TRUST, text: "나는 항상 투명하고 정직하게 행동합니까?" },
  { id: 18, competency: Competency.ETHICAL_TRUST, text: "나는 약속을 지키며 신뢰를 구축하기 위해 노력합니까?" },
];

export const MOCK_HISTORY: Record<Competency, number> = {
  [Competency.COMMUNICATION]: 3.5,
  [Competency.DECISION_MAKING]: 4.0,
  [Competency.TEAM_MANAGEMENT]: 3.0,
  [Competency.STRATEGIC_THINKING]: 2.5,
  [Competency.DIGITAL_LEADERSHIP]: 4.5,
  [Competency.HYBRID_REMOTE]: 3.5,
  [Competency.EQ]: 4.0,
  [Competency.LEARNING_AGILITY]: 3.0,
  [Competency.ETHICAL_TRUST]: 5.0,
};
