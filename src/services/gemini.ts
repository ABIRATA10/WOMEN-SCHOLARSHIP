import { UserProfile, Scholarship, MatchResult, ScholarshipMatch, Application } from "../types";
import { LOCAL_SCHOLARSHIP_DATA } from "../constants/scholarshipData";

export async function findScholarships(
  userProfile: UserProfile
): Promise<ScholarshipMatch[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const lines = LOCAL_SCHOLARSHIP_DATA.trim().split('\n');
  const headers = lines[0].split(',');
  
  const scholarships: ScholarshipMatch[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    // Basic CSV parsing handling quotes
    const line = lines[i];
    if (!line) continue;
    
    const values: string[] = [];
    let inQuotes = false;
    let currentValue = '';
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue);
    
    const [
      id, title, provider, provider_type, gender, category, state, 
      income_limit, education_level, eligibility_text, deadline, link
    ] = values;

    // Basic matching logic
    let matchScore = 50;
    let reasoning = "General match based on your profile.";

    if (gender === 'Female' && userProfile.gender === 'Female') {
      matchScore += 20;
      reasoning = "Strong match for female applicants.";
    }
    
    if (state !== 'All' && state !== 'Global' && userProfile.state.toLowerCase().includes(state.toLowerCase())) {
      matchScore += 20;
      reasoning = `Matches your location in ${state}.`;
    }

    if (category !== 'All' && userProfile.category && category.includes(userProfile.category)) {
      matchScore += 10;
    }

    if (matchScore > 100) matchScore = 100;

    scholarships.push({
      scholarship: {
        id: id || Math.random().toString(),
        title: title || 'Unknown Scholarship',
        provider: provider || 'Unknown Provider',
        amount: income_limit === 'NA' ? 'Varies' : `Up to ₹${income_limit}`,
        deadline: deadline || 'Rolling',
        eligibilityCriteria: eligibility_text || 'See website for details',
        description: eligibility_text || 'Scholarship opportunity',
        category: provider_type || 'Private',
        scope: state === 'All' ? 'National' : state === 'Global' ? 'Global' : 'State',
        link: link || '#',
        targetCommunity: category,
        major: 'General',
        minGpa: 0,
        location: state,
        type: 'Merit-based'
      },
      match: {
        scholarshipId: id || Math.random().toString(),
        matchScore,
        reasoning,
        localCurrencyAmount: income_limit === 'NA' ? 'Varies' : `₹${income_limit}`
      }
    });
  }

  // Sort by match score
  return scholarships.sort((a, b) => b.match.matchScore - a.match.matchScore).slice(0, 20);
}

export async function getRecommendations(
  profile: UserProfile,
  results: ScholarshipMatch[],
  viewedIds: string[],
  savedIds: string[],
  applications: Application[]
): Promise<ScholarshipMatch[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simple recommendation logic: return top 3 unseen/unapplied scholarships
  const appliedIds = applications.map(a => a.scholarshipId);
  
  const available = results.filter(r => 
    !appliedIds.includes(r.scholarship.id) && 
    !viewedIds.includes(r.scholarship.id)
  );
  
  return available.slice(0, 3);
}
