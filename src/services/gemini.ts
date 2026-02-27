import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, Scholarship, MatchResult, ScholarshipMatch } from "../types";
import { LOCAL_SCHOLARSHIP_DATA } from "../constants/scholarshipData";

const apiKey = process.env.GEMINI_API_KEY || "";
if (!apiKey) {
  console.error("GEMINI_API_KEY is missing. Please set it in your environment variables.");
}
const ai = new GoogleGenAI({ apiKey });

export async function findScholarships(
  userProfile: UserProfile
): Promise<ScholarshipMatch[]> {
  const prompt = `
    As an expert financial aid advisor for women, perform an exhaustive real-time search for ALL available and upcoming scholarships worldwide for the following user profile.
    
    User Profile:
    ${JSON.stringify(userProfile, null, 2)}
    
    Local Scholarship Database (Prioritize these if they match the user's profile):
    ${LOCAL_SCHOLARSHIP_DATA}
    
    Tasks:
    1. Use the Local Scholarship Database above AND Google Search to scan the entire internet for high-quality scholarships (Government, Private, NGO, University-specific). 
    2. Prioritize:
       - Scholarships currently accepting applications.
       - Upcoming scholarships (those opening in the next 6-12 months).
       - Scholarships specifically for the user's gender (${userProfile.gender}), year of study (${userProfile.yearOfStudy}), background, or field of study.
       - Local opportunities in ${userProfile.country} and ${userProfile.state}.
       - Global opportunities (USA, UK, Europe, etc.) that accept international students from ${userProfile.country}.
       - If the user has set a profile completion deadline (${userProfile.profileDeadline}), prioritize scholarships with deadlines that align with or follow this date, ensuring the user has enough time to apply after completing their profile.
    3. For each scholarship found, provide:
       - A unique ID
       - Title
       - Provider
       - Amount (in original currency. If exact amount is unknown, provide a well-researched approximation, e.g., "Approx. $5,000")
       - Local Currency Amount (converted to ${userProfile.country} currency. If exact conversion is unknown, provide an approximation)
       - Deadline (Be specific: e.g., "Dec 15, 2026", "Upcoming - Opens July", or "Rolling")
       - Detailed Eligibility Criteria
       - A brief description
       - Category (Government or Private)
       - Scope (State, National, or Global - State means specific to ${userProfile.state}, National means specific to ${userProfile.country}, Global means international)
       - A direct application link (MANDATORY: Ensure this link is accurate and active. If a specific application page is not found, provide the provider's official scholarship portal or main website).
       - A match score (0-100)
       - AI reasoning for the match
    
    Return at least 20-25 results as a JSON array of objects. Ensure a broad range of opportunities are presented.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              scholarship: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  provider: { type: Type.STRING },
                  amount: { type: Type.STRING },
                  deadline: { type: Type.STRING },
                  eligibilityCriteria: { type: Type.STRING },
                  description: { type: Type.STRING },
                  category: { type: Type.STRING },
                  scope: { type: Type.STRING, description: "One of: 'State', 'National', 'Global'" },
                  link: { type: Type.STRING },
                  targetCommunity: { type: Type.STRING, description: "Specific caste or community this scholarship targets, if any." },
                },
                required: ["id", "title", "provider", "amount", "deadline", "eligibilityCriteria", "description", "category", "link", "scope"],
              },
              match: {
                type: Type.OBJECT,
                properties: {
                  scholarshipId: { type: Type.STRING },
                  matchScore: { type: Type.NUMBER },
                  reasoning: { type: Type.STRING },
                  localCurrencyAmount: { type: Type.STRING },
                },
                required: ["scholarshipId", "matchScore", "reasoning", "localCurrencyAmount"],
              },
            },
            required: ["scholarship", "match"],
          },
        },
      },
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error finding scholarships:", error);
    return [];
  }
}
