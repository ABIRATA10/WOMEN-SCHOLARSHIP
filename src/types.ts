export interface User {
  id: string;
  email: string;
  password?: string;
  fullName: string;
  phoneNumber?: string;
}

export interface UserProfile {
  fullName: string;
  preferredName?: string;
  profileImageUrl?: string;
  phoneNumber?: string;
  dob?: string;
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
  background: string; // e.g., "Single parent", "First-generation student", "STEM enthusiast"
  careerGoals: string;
  extracurriculars?: string;
  awards?: string;
  profileDeadline?: string;
  languagesSpoken?: string;
  volunteerExperience?: string;
  profile_completion_percentage?: number;
  search_scope?: 'State' | 'National' | 'Global' | 'All';
  documents?: { name: string; url: string; type: string }[];
  privacySettings?: {
    profileVisibility: 'Public' | 'Private';
    emailNotifications: boolean;
    smsNotifications: boolean;
  };
}

export interface Scholarship {
  id: string;
  title: string;
  provider: string;
  amount: string;
  deadline: string;
  startDate?: string;
  eligibilityCriteria: string;
  description: string;
  category: 'Government' | 'Private';
  link: string;
  targetCommunity?: string; // e.g., "OBC", "SC/ST", "Minority", "Students in STEM"
  scope: 'State' | 'National' | 'Global';
  country?: string; // e.g., "India", "USA", "UK"
  major?: string; // Field of study
  minGpa?: number;
  location?: string; // Specific location if applicable
  type?: 'Merit-based' | 'Need-based' | 'Other';
  requirements?: string[]; // Things required for applying
  fullyFunded?: boolean;
  genderSpecific?: string;
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

export type ApplicationStatus = 'Interested' | 'In Progress' | 'Applied' | 'Under Review' | 'Received Notification' | 'Awarded' | 'Rejected';

export interface ApplicationDocument {
  id: string;
  name: string;
  type: string;
  data?: string; // base64 for local storage
  uploadedAt: string;
}

export interface Application {
  scholarshipId: string;
  status: ApplicationStatus;
  updatedAt: string;
  notes?: string;
  documents?: ApplicationDocument[];
}

export interface Reminder {
  id: string;
  userId: string;
  scholarshipId: string;
  scholarshipTitle: string;
  reminderTime: string;
  triggered: boolean;
}
