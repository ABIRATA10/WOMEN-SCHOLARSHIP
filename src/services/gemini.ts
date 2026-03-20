import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, Scholarship, MatchResult, ScholarshipMatch, Application } from "../types.js";
import { LOCAL_SCHOLARSHIP_DATA } from "../constants/scholarshipData.js";

const apiKey = process.env.GEMINI_API_KEY || "";
if (!apiKey) {
  console.error("GEMINI_API_KEY is missing. Please set it in your environment variables.");
}
const ai = new GoogleGenAI({ apiKey });

const API_URL = import.meta.env.VITE_API_URL || '';

export async function findScholarships(
  userProfile: UserProfile
): Promise<ScholarshipMatch[]> {
  let dbScholarships = [];
  try {
    const res = await fetch(`${API_URL}/api/scholarships`);
    if (res.ok) {
      dbScholarships = await res.json();
    }
  } catch (err) {
    console.error("Failed to fetch DB scholarships:", err);
  }

    const prompt = `
    Perform an exhaustive real-time search for ALL available and upcoming scholarships worldwide for the following user profile.
    
    User Profile:
    ${JSON.stringify(userProfile, null, 2)}
    
    Local Scholarship Database (Prioritize these if they match the user's profile):
    ${LOCAL_SCHOLARSHIP_DATA}

    Database Scholarships (Prioritize these as well):
    ${JSON.stringify(dbScholarships, null, 2)}
    
    Tasks:
    1. Use the Local Scholarship Database and Database Scholarships above AND Google Search to scan the entire internet for high-quality scholarships (Government, Private, NGO, University-specific). 
    2. Prioritize:
       - Scholarships currently accepting applications.
       - Upcoming scholarships (those opening in the next 6-12 months).
       - Scholarships specifically for the user's gender (${userProfile.gender}), year of study (${userProfile.yearOfStudy}), background, extracurricular activities (${userProfile.extracurriculars || 'None listed'}), awards/honors (${userProfile.awards || 'None listed'}), or field of study.
       - Local opportunities in ${userProfile.country} and ${userProfile.state}. (e.g., if the user is from Odisha, search for e-Medhabruti, KALIA/Krusi Vidya, Gopabandhu Sikhya Sahayata Yojana, etc.)
       ${userProfile.search_scope === 'India' ? '- CRITICAL: The user has selected "India only". DO NOT show any international scholarships. Only show scholarships available in India.' : '- Global opportunities (USA, UK, Europe, etc.) that accept international students from ' + userProfile.country + '.'}
       ${(userProfile.search_scope === 'International' || userProfile.search_scope === 'Both') ? '- CRITICAL: The user has selected "International" or "Both". Ensure you include a mix of global scholarships.' : ''}
       - If the user has set a profile completion deadline (${userProfile.profileDeadline}), prioritize scholarships with deadlines that align with or follow this date, ensuring the user has enough time to apply after completing their profile.
       - CRITICAL: Leverage richer schema fields from the Database Scholarships to make highly accurate matches. Specifically, check if the user's profile matches the \`eligible_categories\`, \`eligible_states\`, \`eligible_courses\`, \`max_family_income\`, \`gender\`, \`min_percentage\`, and \`disability_required\` fields. For example, if a scholarship has \`max_family_income\` of 250000, and the user's \`incomeBracket\` is "> 8L", DO NOT match them. If a scholarship requires \`disability_required\` = 1, and the user has no disability, DO NOT match them.
       - CRITICAL RANKING: Rank fully-funded international scholarships higher when the student has 80%+ marks (or equivalent CGPA) and income below ₹8L.
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
       - Major (The specific field of study this scholarship is for, e.g., "Computer Science", "Medicine", or "General")
       - Minimum GPA (The minimum GPA required, as a number. Note: The user's CGPA is provided on a 10.0 scale, so ensure this value is compatible, e.g., 7.5)
       - Specific Location (The specific city, state, or country if applicable)
       - Scholarship Type (One of: 'Merit-based', 'Need-based', 'Other')
       - Region (e.g., Asia, Europe, North America, Global)
       - Country
       - Fully Funded (Boolean: true if tuition and living expenses are covered, false otherwise)
       - Gender Specific (e.g., 'Female', 'Any')
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
        systemInstruction: "You are an expert financial aid advisor and scholarship matching engine. Your goal is to find the most relevant, accurate, and diverse scholarships for the user based on their profile. You must return the results strictly as a JSON array of objects following the provided schema. Ensure the links are real and the amounts are accurate. Do not hallucinate scholarships.",
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
                  major: { type: Type.STRING, description: "Field of study, e.g., 'Computer Science'" },
                  minGpa: { type: Type.NUMBER, description: "Minimum GPA required" },
                  location: { type: Type.STRING, description: "Specific location if applicable" },
                  type: { type: Type.STRING, description: "One of: 'Merit-based', 'Need-based', 'Other'" },
                  fullyFunded: { type: Type.BOOLEAN, description: "True if the scholarship is fully funded" },
                  genderSpecific: { type: Type.STRING, description: "Gender requirement, e.g., 'Female', 'Any'" },
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

    if (!response.text) {
      throw new Error("The AI advisor couldn't generate a response. This might be due to a temporary connection issue or high traffic. Please try again in a few moments! ✨");
    }

    let text = response.text;
    if (text.startsWith("```json")) {
      text = text.replace(/^```json\n/, "").replace(/\n```$/, "");
    } else if (text.startsWith("```")) {
      text = text.replace(/^```\n/, "").replace(/\n```$/, "");
    }

    let parsed = JSON.parse(text);
    if (parsed && !Array.isArray(parsed) && parsed.scholarships && Array.isArray(parsed.scholarships)) {
      parsed = parsed.scholarships;
    }
    return Array.isArray(parsed) ? parsed : [];
  } catch (error: any) {
    console.error("Error finding scholarships:", error);
    
    if (error.message?.includes("quota") || error.message?.includes("limit")) {
      throw new Error("Our AI advisor is currently handling a lot of requests! 🚀 Please wait a minute and try again—we're eager to help you find your funding!");
    }
    
    if (error.message?.includes("JSON")) {
      throw new Error("We encountered a small hiccup while processing the scholarship data. 🧩 Please try searching again, and we'll get it right this time!");
    }

    if (error.message?.includes("matching your current profile")) {
      throw error;
    }

    throw new Error(error.message || "Oops! Something went wrong while searching for scholarships. 😔 Please check your internet connection and try again!");
  }
}

export async function getRecommendations(
  profile: UserProfile,
  results: ScholarshipMatch[],
  viewedIds: string[],
  savedIds: string[],
  applications: Application[]
): Promise<ScholarshipMatch[]> {
  try {
    const viewedScholarships = results.filter(r => viewedIds.includes(r.scholarship.id));
    const savedScholarships = results.filter(r => savedIds.includes(r.scholarship.id));
    const appliedScholarships = results.filter(r => applications.some(a => a.scholarshipId === r.scholarship.id));

    const context = {
      profile,
      viewed: viewedScholarships.map(s => s.scholarship.title),
      saved: savedScholarships.map(s => s.scholarship.title),
      applied: appliedScholarships.map(s => s.scholarship.title)
    };

    const prompt = `Based on the following user context, recommend the top 3 scholarships from the provided list that the user hasn't applied to yet.
    
    User Context:
    - Profile: ${JSON.stringify(context.profile)}
    - Recently Viewed: ${context.viewed.join(', ')}
    - Saved: ${context.saved.join(', ')}
    - Already Applied: ${context.applied.join(', ')}

    Scholarship List:
    ${JSON.stringify(results.map(r => ({ id: r.scholarship.id, title: r.scholarship.title, description: r.scholarship.description })))}

    Return ONLY a JSON array of scholarship IDs. Example: ["id1", "id2", "id3"]`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const recommendedIds = JSON.parse(response.text || "[]") as string[];
    return results.filter(r => recommendedIds.includes(r.scholarship.id));
  } catch (error) {
    console.error("Failed to get recommendations", error);
    return [];
  }
}
