
export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  ADMIN = 'admin'
}

export interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountType: 'ahorros' | 'corriente';
  holderName: string;
}

export interface SocialProfiles {
  researchGate?: string;
  googleScholar?: string;
  linkedIn?: string;
  twitter?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  premiumLanguage?: boolean; 
  isPremium?: boolean; 
  status?: 'active' | 'inactive' | 'invited'; 
  walletBalance?: number; 
  pendingBalance?: number; 
  ownedCourseIds?: string[]; 
  whatsapp?: string; 
  bankAccount?: BankAccount; 
  socialProfiles?: SocialProfiles;
  storageUsed?: number; 
  storageLimit?: number; 
  bio?: string;
  title?: string; 
  titles?: string[]; 
  location?: string;
  phone?: string; 
  website?: string;
  specialties?: string[];
  academicRank?: string; 
  aiCredits?: number;
  lastCreditReset?: number;
}

export interface Report {
    id: string;
    itemId: string;
    itemType: 'publication' | 'course';
    reason: string;
    reportedBy: string;
    timestamp: number;
}

export interface RubricItem {
  criteria: string;
  description: string;
  points: number;
}

export interface CourseModule {
  title: string;
  description: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded'; 
  grade?: number; 
  maxGrade: number;
  rubric?: RubricItem[]; 
  grades?: Record<string, number>; 
  teacherComments?: Record<string, string>;
  submissions?: Record<string, 'pending' | 'submitted' | 'late'>; 
  submissionContent?: Record<string, string[]>; 
  submissionDate?: Record<string, string>; 
  viewedBy?: string[];
}

export interface Material {
  id: string;
  title: string;
  type: 'video' | 'pdf' | 'link';
  url: string;
}

export interface Recording {
  id: string;
  title: string;
  date: string;
  duration: string;
  thumbnail: string;
  url: string;
  views: number;
}

export interface Diploma {
  id: string;
  studentName: string; 
  fileUrl: string;
  publicLink: string;
  issueDate: string;
}

export interface Publication {
  id: string;
  title: string;
  authorId: string; 
  author: string;
  abstract: string;
  date: string;
  tags: string[];
  downloads: number;
  type: 'Thesis' | 'Paper' | 'Journal' | 'Article';
  fileUrl?: string; 
  timestamp?: number;
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  instructorId: string;
  description: string;
  schedule: string;
  startDate?: string;
  endDate?: string;
  image: string;
  price?: number; 
  students: string[];
  assignments: Assignment[];
  materials: Material[];
  recordings: Recording[];
  diplomas?: Diploma[]; 
  createdAt?: number; 
  modality?: 'virtual' | 'in-person';
  meetingUrl?: string;
  locationDetails?: {
      campus?: string;
      building?: string;
      room?: string;
  };
  institutionLogo?: string;
  rubric?: RubricItem[]; 
  modules?: CourseModule[];
  objectives?: string[];
  requirements?: string[];
  targetAudience?: string;
  durationInfo?: string;
}

export interface MarketplaceCourse {
  id: string;
  title: string;
  instructor: string;
  instructorId: string;
  instructorWhatsapp?: string;
  rating: number;
  students: number;
  price: number;
  image: string;
  tags: string[];
  category: string; 
  paymentLink?: string; 
  allowBankTransfer?: boolean;
  allowPaymentLink?: boolean;
  customWebsiteUrl?: string;
  detailedDescription?: string;
  objectives?: string[];
  requirements?: string[];
  targetAudience?: string;
  durationInfo?: string;
  startDate?: string;
  endDate?: string;
  publishedMonth?: string;
  createdAt: number; 
  instructorIsPremium?: boolean; 
  modules?: CourseModule[];
  rubric?: RubricItem[];
}

export interface LanguageLevel {
  id: number;
  title: string;
  description: string;
  locked: boolean;
  stars: number;
  totalStars: number;
  topic: string;
}

export interface LanguageTrack {
  id: 'english' | 'french';
  name: string;
  level: string;
  color: string;
  flag: string;
  levels: LanguageLevel[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'invite' | 'grade' | 'system' | 'deadline';
  date: string;
  read: boolean;
  actionLink?: string; 
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: number;
  read: boolean;
}
