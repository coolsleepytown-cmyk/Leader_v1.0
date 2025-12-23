
import { GoogleGenAI, Type } from "@google/genai";
import { Competency, CoachingFeedback } from "../types";
import { COMPETENCY_LABELS } from "../constants";

const getApiKey = () => {
  return process.env.API_KEY || '';
};

// --- Individual Coaching ---
export const generateCoachingFeedback = async (
  scores: Record<Competency, number>
): Promise<CoachingFeedback> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";

  const scoreSummary = Object.entries(scores)
    .map(([key, value]) => `${COMPETENCY_LABELS[key as Competency]}: ${value.toFixed(1)}/5.0`)
    .join("\n");

  const systemInstruction = `
    당신은 세계적인 리더십 코치입니다. 사용자의 리더십 역량 점수를 바탕으로 분석을 제공하세요.
    - closingAdvice는 5문장 이상의 상세한 총평이어야 합니다.
    - dailyTips는 Day 1부터 Day 5까지 구체적인 행동 가이드를 포함해야 합니다.
  `;

  const prompt = `진단 결과:\n${scoreSummary}\n위 데이터를 바탕으로 JSON 코칭 피드백을 생성하세요.`;

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
            analysis: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionPlans: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  difficulty: { type: Type.STRING }
                }
              }
            },
            weeklyMission: { type: Type.STRING },
            closingAdvice: { type: Type.STRING },
            recommendedMindset: { type: Type.STRING },
            dailyTips: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING },
                  title: { type: Type.STRING },
                  content: { type: Type.STRING }
                }
              }
            }
          },
          required: ["analysis", "strengths", "weaknesses", "actionPlans", "weeklyMission", "closingAdvice", "recommendedMindset", "dailyTips"]
        }
      }
    });

    return JSON.parse(response.text) as CoachingFeedback;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

// --- Team/Organizational Coaching ---
export const generateTeamFeedback = async (
  avgScores: Record<Competency, number>
): Promise<CoachingFeedback> => {
  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-3-flash-preview";

  const scoreSummary = Object.entries(avgScores)
    .map(([key, value]) => `${COMPETENCY_LABELS[key as Competency]}: ${value.toFixed(1)}/5.0`)
    .join("\n");

  const systemInstruction = `당신은 수석 전략 코치입니다. 조직의 평균 리더십 점수를 분석하여 전략적 인사이트를 JSON으로 제공하세요.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `조직 평균 데이터:\n${scoreSummary}\n분석 리포트를 작성하세요.`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
              analysis: { type: Type.STRING },
              strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
              actionPlans: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    difficulty: { type: Type.STRING }
                  }
                }
              },
              weeklyMission: { type: Type.STRING },
              recommendedMindset: { type: Type.STRING },
              dailyTips: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    day: { type: Type.STRING },
                    title: { type: Type.STRING },
                    content: { type: Type.STRING }
                  }
                }
              }
            },
            required: ["analysis", "strengths", "weaknesses", "actionPlans", "weeklyMission", "recommendedMindset", "dailyTips"]
          }
      }
    });

    const data = JSON.parse(response.text);
    return { ...data, closingAdvice: "조직 전체를 위한 종합 전략 제언입니다." } as CoachingFeedback;
  } catch (error) {
    console.error("Team GenAI Error:", error);
    throw error;
  }
};
