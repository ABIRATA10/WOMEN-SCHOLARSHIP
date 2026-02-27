export interface User {
  id: string;
  email: string;
  password?: string;
  fullName: string;
  phoneNumber?: string;
}

export interface UserProfile {
  fullName: string;
  age: number;
  gender: string;
  educationLevel: 'High School' | 'Undergraduate' | 'Postgraduate' | 'Doctorate';
  yearOfStudy: string; // e.g., "1st Year", "Final Year"
  institution: string; // University or School
  fieldOfStudy: string;
  gpa: string;
  country: string;
  state: string;
  pincode: string;
  address: string;
  caste: string; // e.g., General, OBC, SC, ST
  incomeBracket: string;
  background: string; // e.g., "Single mother", "First-generation student", "STEM enthusiast"
  careerGoals: string;
  profileDeadline?: string;
}

export interface Scholarship {
  id: string;
  title: string;
  provider: string;
  amount: string;
  deadline: string;
  eligibilityCriteria: string;
  description: string;
  category: 'Government' | 'Private';
  link: string;
  targetCommunity?: string; // e.g., "OBC", "SC/ST", "Minority", "Women in STEM"
  scope: 'State' | 'National' | 'Global';
}

export interface MatchResult {
  scholarshipId: string;
  matchScore: number; // 0 to 100
  reasoning: string;
  localCurrencyAmount?: string; // Converted amount based on user location
}

export interface ScholarshipMatch {
  scholarship: Scholarship;
  match: MatchResult;
}
