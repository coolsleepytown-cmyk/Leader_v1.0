import { GoogleGenAI, Type } from "@google/genai";
import { Competency, CoachingFeedback } from "../types";
import { COMPETENCY_LABELS } from "../constants";

// Common API Key retrieval logic
const getApiKey = () => {
  let apiKey = '';
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      apiKey = import.meta.env.VITE_API_KEY || import.meta.env.NEXT_PUBLIC_API_KEY;
    }
  } catch (e) { /* ignore */ }

  if (!apiKey) {
    try {
      if (typeof process !== 'undefined' && process.env) {
        apiKey = process.env.API_KEY || process.env.VITE_API_KEY || '';
      }
    } catch (e) { /* ignore */ }
  }
  return apiKey;
};

const createGeminiClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("API Key not found. Please set VITE_API_KEY in Vercel Environment Variables.");
    throw new Error("API Key configuration missing");
  }
  return new GoogleGenAI({ apiKey });
};

// --- Individual Coaching ---
export const generateCoachingFeedback = async (
  scores: Record<Competency, number>
): Promise<CoachingFeedback> => {
  let ai: GoogleGenAI;
  const model = "gemini-2.5-flash";

  try {
    ai = createGeminiClient();
  } catch (error) {
    console.error("Gemini Client Initialization Error:", error);
    return {
      analysis: "API 키가 설정되지 않았습니다. Vercel 환경 변수 설정을 확인해주세요.",
      strengths: ["환경 변수 설정 필요"],
      weaknesses: ["API Key 누락"],
      actionPlans: [],
      weeklyMission: "Vercel Settings > Environment Variables 에서 'VITE_API_KEY'를 추가하고 재배포하세요.",
      closingAdvice: "시스템 오류로 인해 분석을 완료할 수 없습니다.",
      recommendedMindset: "시스템 오류로 인해 내용을 불러올 수 없습니다.",
      dailyTips: []
    };
  }

  // Format scores for the prompt
  const scoreSummary = Object.entries(scores)
    .map(([key, value]) => `${COMPETENCY_LABELS[key as Competency]}: ${value.toFixed(1)}/5.0`)
    .join("\n");

  const systemInstruction = `
    당신은 세계적인 경영 컨설턴트이자 리더십 코치입니다.
    사용자의 리더십 역량 진단 결과(5점 만점)를 바탕으로 심층적인 분석과 구체적인 행동 계획을 제공해야 합니다.
    
    [중요: 응답 톤앤매너]
    1. 전문적이지만 딱딱하지 않아야 합니다. '부드러운 카리스마'를 유지하세요.
    2. 데이터에 기반하여 객관적으로 평가하되, 사용자의 성장을 진심으로 응원하는 어조를 사용하세요.
    
    [작성 지침]
    1. analysis: 리더십 스타일을 2문장 이내로 명확하게 요약.
    2. strengths/weaknesses: 각각 3가지 핵심 키워드 위주.
    3. weeklyMission: 즉시 실행 가능한 구체적인 미션.
    4. closingAdvice: 이 부분은 리포트의 결론입니다. 사용자의 강점과 약점을 종합하여, 객관적인 현재 위치를 짚어주고 앞으로 나아가야 할 방향을 상세하게 서술하세요. (분량: 5~6문장 이상의 상세한 단락)
    5. recommendedMindset: 리더가 가져야 할 핵심 마인드셋을 감동적이고 철학적인 문장으로 제안하세요. (전체를 관통하는 하나의 메시지)
    6. dailyTips: 위 마인드셋을 1주일(5일) 동안 실천하기 위한 요일별 구체적 가이드입니다. (Day 1 ~ Day 5). 
       각 날짜별로 '오늘의 테마(Title)'와 '구체적 실천 행동(Content)'을 제시하세요. 행동은 아주 구체적이어야 합니다. (예: "출근 직후 팀원 3명에게 먼저 인사하기")
  `;

  const prompt = `
    다음은 리더십 진단 결과입니다:
    ${scoreSummary}

    이 데이터를 바탕으로 코칭 피드백을 JSON 형식으로 생성해 주세요.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING, description: "전반적인 리더십 스타일 요약 (핵심만 2문장 이내)" },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "주요 강점 3가지 (단답형)"
            },
            weaknesses: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "보완 필요 영역 3가지 (단답형)"
            },
            actionPlans: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] }
                }
              },
              description: "구체적인 행동 제안 3가지"
            },
            weeklyMission: { type: Type.STRING, description: "이번 주 핵심 미션 (1문장)" },
            closingAdvice: { type: Type.STRING, description: "종합 평가 및 디테일한 요약 (객관적 평가와 격려가 포함된 5-6문장 이상의 긴 글)" },
            recommendedMindset: { type: Type.STRING, description: "실천을 위한 핵심 마인드셋 메시지" },
            dailyTips: {
              type: Type.ARRAY,
              description: "5일간의 요일별 실천 가이드 (Day 1 ~ Day 5)",
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING, description: "e.g., Day 1" },
                  title: { type: Type.STRING, description: "오늘의 테마" },
                  content: { type: Type.STRING, description: "오늘의 구체적 실천 행동" }
                }
              }
            }
          },
          required: ["analysis", "strengths", "weaknesses", "actionPlans", "weeklyMission", "closingAdvice", "recommendedMindset", "dailyTips"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as CoachingFeedback;
    }
    throw new Error("No text response from Gemini");
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback if API fails
    return {
      analysis: "AI 분석 서비스를 연결할 수 없습니다. API 키 상태를 확인해주세요.",
      strengths: ["일시적 오류"],
      weaknesses: ["연결 실패"],
      actionPlans: [],
      weeklyMission: "잠시 후 다시 시도하거나 관리자에게 문의하세요.",
      closingAdvice: "네트워크 상태를 확인해주세요.",
      recommendedMindset: "다시 시도해주세요.",
      dailyTips: []
    };
  }
};

// --- Team/Organizational Coaching ---
export const generateTeamFeedback = async (
  avgScores: Record<Competency, number>
): Promise<CoachingFeedback> => {
  let ai: GoogleGenAI;
  const model = "gemini-2.5-flash";

  try {
    ai = createGeminiClient();
  } catch (error) {
    return {
      analysis: "API Key Error",
      strengths: [],
      weaknesses: [],
      actionPlans: [],
      weeklyMission: "Please check API Key configuration.",
      closingAdvice: "",
      recommendedMindset: "",
      dailyTips: []
    };
  }

  const scoreSummary = Object.entries(avgScores)
    .map(([key, value]) => `${COMPETENCY_LABELS[key as Competency]}: ${value.toFixed(1)}/5.0`)
    .join("\n");

  const systemInstruction = `
    당신은 기업의 C-Level 임원들을 코칭하는 '수석 전략 코치'입니다.
    조직의 리더십 역량 진단 데이터(평균 점수)를 바탕으로, 조직 문화의 현주소를 진단하고 미래 전략을 제안해야 합니다.

    [분석 톤앤매너]
    - 단순히 수치를 나열하지 말고, 실제 컨설팅 보고서처럼 통찰력 있게 서술하십시오.
    - '전략적 제언(Action Plans)' 부분은 추상적인 조언이 아닌, 실제 실행 가능한 로드맵 형태여야 합니다.
    
    [작성 지침]
    1. 'analysis': 현재 조직 분위기를 날카롭게 파악하고, 비즈니스 영향 예측 (3문장).
    2. 'strengths': 조직의 경쟁력이 되는 문화적 강점 3가지.
    3. 'weaknesses': 조직 성장을 저해할 수 있는 잠재적 리스크 3가지.
    4. 'actionPlans': 전략적 이니셔티브 3가지.
    5. 'weeklyMission': 전사적으로 공유할 수 있는 강력한 변화의 슬로건.
    6. 'recommendedMindset': 우리 조직이 변화하기 위해 리더들이 공유해야 할 핵심 가치(Core Value).
    7. 'dailyTips': 조직 차원에서 리더들이 1주일간 실천해야 할 공통 캠페인 (Day 1 ~ Day 5).
       - 예: [Day 1] 경청의 날: 모든 회의에서 3분간 듣기만 하기
  `;

  const prompt = `
    다음은 우리 조직 리더들의 역량 진단 평균 점수입니다:
    ${scoreSummary}

    위 데이터를 바탕으로 임원 보고용 조직 진단 및 전략 리포트를 JSON으로 작성해 주세요.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
              analysis: { type: Type.STRING, description: "조직 리더십 문화 진단 및 비즈니스 영향 분석" },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              actionPlans: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "전략적 이니셔티브 제목" },
                    description: { type: Type.STRING, description: "구체적 실행 가이드 및 기대 효과 (코칭 스타일)" },
                    difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] }
                  }
                }
              },
              weeklyMission: { type: Type.STRING, description: "조직 변화를 위한 강력한 슬로건" },
              recommendedMindset: { type: Type.STRING, description: "조직 문화 혁신을 위한 핵심 가치 제언" },
              dailyTips: {
                type: Type.ARRAY,
                description: "조직 리더 공통 실천 캠페인 (5일)",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    day: { type: Type.STRING, description: "Day 1 ~ Day 5" },
                    title: { type: Type.STRING, description: "캠페인 테마" },
                    content: { type: Type.STRING, description: "구체적 행동 지침" }
                  }
                }
              }
            },
            required: ["analysis", "strengths", "weaknesses", "actionPlans", "weeklyMission", "recommendedMindset", "dailyTips"]
          }
      }
    });

    if (response.text) {
      // Add empty closingAdvice for compatibility since it's used in Individual feedback
      const data = JSON.parse(response.text);
      return { ...data, closingAdvice: "" } as CoachingFeedback;
    }
    throw new Error("No text response");
  } catch (error) {
    console.error("Team GenAI Error:", error);
    return {
        analysis: "분석을 완료할 수 없습니다.",
        strengths: [],
        weaknesses: [],
        actionPlans: [],
        weeklyMission: "다시 시도해주세요.",
        closingAdvice: "",
        recommendedMindset: "",
        dailyTips: []
    };
  }
};