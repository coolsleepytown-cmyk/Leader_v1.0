import { GoogleGenAI, Type } from "@google/genai";
import { Competency, CoachingFeedback } from "../types";
import { COMPETENCY_LABELS } from "../constants";

export const generateCoachingFeedback = async (
  scores: Record<Competency, number>
): Promise<CoachingFeedback> => {
  let ai: GoogleGenAI;
  const model = "gemini-2.5-flash";

  try {
    // [Vercel 및 외부 배포 환경 호환성 수정]
    // 1. process.env 접근 시 ReferenceError 방지
    // 2. Vite 등 최신 번들러 환경(import.meta.env) 지원
    let apiKey = '';

    try {
      if (typeof process !== 'undefined' && process.env) {
        apiKey = process.env.API_KEY || '';
      }
    } catch (e) {
      // process is not defined in strict browser environments, ignore error
    }

    if (!apiKey) {
      try {
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env) {
          // @ts-ignore
          // Vercel에서 Vite 사용 시 VITE_ 접두사가 필요할 수 있음
          apiKey = import.meta.env.VITE_API_KEY || import.meta.env.NEXT_PUBLIC_API_KEY || '';
        }
      } catch (e) { /* ignore */ }
    }

    if (!apiKey) {
      console.warn("API Key not found. Please check Vercel Environment Variables.");
      throw new Error("API Key configuration missing");
    }

    ai = new GoogleGenAI({ apiKey });

  } catch (error) {
    console.error("Gemini Client Initialization Error:", error);
    return {
      analysis: "API 키가 설정되지 않았거나 연결에 실패했습니다. Vercel 환경 변수(API_KEY 또는 VITE_API_KEY)를 확인해주세요.",
      strengths: ["환경 변수 설정 필요"],
      weaknesses: ["API Key 누락"],
      actionPlans: [],
      weeklyMission: "관리자에게 문의하여 API 설정을 완료하세요."
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
      analysis: "AI 분석 서비스를 연결할 수 없습니다. 잠시 후 다시 시도해주세요.",
      strengths: ["데이터 분석 불가"],
      weaknesses: ["데이터 분석 불가"],
      actionPlans: [],
      weeklyMission: "시스템 점검 후 다시 시도해주세요."
    };
  }
};