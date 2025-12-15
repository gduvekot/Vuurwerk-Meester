import { GoogleGenAI, Type } from "@google/genai";
import { JudgeResult, ScoreStats } from "../types";

// Initialize Gemini Client
// Note: Ensure process.env.API_KEY is available in the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getJudgeVerdict = async (stats: ScoreStats): Promise<JudgeResult> => {
  try {
    const prompt = `
      Je bent een strenge maar rechtvaardige Vuurwerk Grootmeester jury. 
      Beoordeel de volgende vuurwerkshow op basis van de statistieken:
      - Score: ${stats.score}
      - Hoogste Combo: ${stats.maxCombo}
      - Perfecte Timing: ${stats.perfects}
      - Missers (nat/duds): ${stats.misses}
      - Totaal afgestoken: ${stats.hits + stats.misses}

      Geef een korte, grappige of poëtische jurybeoordeling (max 2 zinnen) in het Nederlands.
      Bedenk ook een creatieve eretitel voor de speler (bijv. "Koning van de Knal", "Natte Lont").
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rankTitle: {
              type: Type.STRING,
              description: "Een creatieve eretitel voor de speler",
            },
            critique: {
              type: Type.STRING,
              description: "Korte jurybeoordeling",
            },
          },
          required: ["rankTitle", "critique"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response text");
    
    return JSON.parse(text) as JudgeResult;

  } catch (error) {
    console.error("Error fetching Gemini verdict:", error);
    return {
      rankTitle: "Vuurwerk Leerling",
      critique: "De jury is even met pauze, maar goed gedaan!"
    };
  }
};