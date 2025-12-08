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
      weeklyMission: "Vercel Settings > Environment Variables 에서 'VITE_API_KEY'를 추가하고 재배포하세요."
    };
  }

  // Format scores for the prompt
  const scoreSummary = Object.entries(scores)
    .map(([key, value]) => `${COMPETENCY_LABELS[key as Competency]}: ${value.toFixed(1)}/5.0`)
    .join("\n");

  const systemInstruction = `
    당신은 세계적인 경영 컨설턴트이자 리더십 코치입니다.
    사용자의 리더십 역량 진단 결과(5점 만점)를 바탕으로 심층적인 분석과 구체적인 행동 계획을 제공해야 합니다.
    
    [중요: 응답 속도 최적화를 위한 지침]
    1. 핵심만 간결하게 작성하십시오. 장황한 서술을 피하고 개조식(Bullet points)을 활용하세요.
    2. 분석은 2문장 이내로 요약하십시오.
    3. 실천 과제는 즉시 실행 가능한 짧은 문장으로 작성하십시오.
    
    분석 가이드라인:
    1. 점수가 낮은 항목(3.0 미만)에 집중하여 개선점을 제안하십시오.
    2. 점수가 높은 항목(4.0 이상)은 강점으로 칭찬하고 강화할 방법을 제안하십시오.
    3. 구체적이고 실행 가능한 '주간 미션'을 하나 제시하십시오.
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
            weeklyMission: { type: Type.STRING, description: "이번 주 핵심 미션 (1문장)" }
          },
          required: ["analysis", "strengths", "weaknesses", "actionPlans", "weeklyMission"]
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
      weeklyMission: "잠시 후 다시 시도하거나 관리자에게 문의하세요."
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
      weeklyMission: "Please check API Key configuration."
    };
  }

  const scoreSummary = Object.entries(avgScores)
    .map(([key, value]) => `${COMPETENCY_LABELS[key as Competency]}: ${value.toFixed(1)}/5.0`)
    .join("\n");

  const systemInstruction = `
    당신은 조직 개발(OD) 전문가이자 기업 전략 컨설턴트입니다.
    특정 팀(또는 조직)의 '리더십 역량 평균 점수'를 바탕으로 조직 문화와 리더십 현황을 진단해야 합니다.

    분석 대상: 개인이 아닌 '팀 전체'
    
    [작성 지침]
    1. 'analysis' 필드: 우리 조직의 리더십 스타일과 분위기를 요약하십시오. (예: "실행력은 높으나 소통이 부족한 수직적 문화입니다")
    2. 'strengths' 필드: 조직 차원에서 잘 발휘되고 있는 긍정적인 문화 요소 3가지.
    3. 'weaknesses' 필드: 조직 차원에서 리스크가 될 수 있는 취약점 3가지.
    4. 'actionPlans' 필드: 조직 문화를 개선하기 위해 HR이나 리더 그룹이 실행해야 할 전략적 이니셔티브 3가지.
    5. 'weeklyMission' 필드: 조직 전체가 함께 노력해야 할 슬로건이나 캠페인 주제.

    간결하고 전문적인 톤을 유지하세요.
  `;

  const prompt = `
    다음은 우리 팀 리더들의 역량 진단 평균 점수입니다:
    ${scoreSummary}

    이 데이터를 바탕으로 조직 차원의 인사이트 리포트를 JSON으로 작성해 주세요.
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
              analysis: { type: Type.STRING, description: "조직 리더십 문화 진단 요약" },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              actionPlans: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] }
                  }
                }
              },
              weeklyMission: { type: Type.STRING, description: "조직 변화를 위한 캠페인 슬로건" }
            },
            required: ["analysis", "strengths", "weaknesses", "actionPlans", "weeklyMission"]
          }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as CoachingFeedback;
    }
    throw new Error("No text response");
  } catch (error) {
    console.error("Team GenAI Error:", error);
    return {
        analysis: "분석을 완료할 수 없습니다.",
        strengths: [],
        weaknesses: [],
        actionPlans: [],
        weeklyMission: "다시 시도해주세요."
    };
  }
};