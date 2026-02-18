
import { User, UserRole, Course, LanguageTrack, MarketplaceCourse, Publication } from './types';

export const APP_BRAND = {
    name: "QLASE",
    subtitle: "GESTION ACADEMICA",
    logo: "https://firebasestorage.googleapis.com/v0/b/go-lms-f8551.firebasestorage.app/o/ChatGPT%20Image%2019%20nov%202025%2C%2022_40_34.png?alt=media&token=0e8c05c6-9750-41e7-97b2-99f9093e30c8"
};

export const STORAGE_LIMITS = {
    FREE: 1024 * 1024 * 1024, // 1GB
    PREMIUM: 50 * 1024 * 1024 * 1024 // 50GB
};

export const AI_COSTS = {
    COURSE_GENERATION: 3,
    BIO_GENERATION: 1,
    FREE_MONTHLY_LIMIT: 10, // Increased from 4 to 10
    PRO_DAILY_LIMIT: 50
};

export const CLIENT_BRAND = {
  name: "Harvard University",
  logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Harvard_University_shield.svg/1200px-Harvard_University_shield.svg.png" 
};

export const CURRENT_USER_STUDENT: User = {
  id: 's1',
  name: 'Sofia Rodriguez',
  email: 's.rodriguez@qlase.edu',
  role: UserRole.STUDENT,
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=200&auto=format&fit=crop',
  premiumLanguage: true,
  isPremium: false,
  status: 'active',
  walletBalance: 150,
  storageUsed: 450 * 1024 * 1024,
  storageLimit: STORAGE_LIMITS.FREE,
  ownedCourseIds: [],
  bio: "Estudiante de Arquitectura apasionada por el diseño sostenible.",
  title: "Estudiante de Pregrado",
  location: "Ciudad de México",
  aiCredits: 10 // Updated to reflect new limit
};

export const CURRENT_USER_TEACHER: User = {
  id: 't1',
  name: 'Dr. Alejandro Velasco',
  email: 'a.velasco@qlase.edu',
  role: UserRole.TEACHER,
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&h=200&auto=format&fit=crop',
  status: 'active',
  walletBalance: 1250.50,
  pendingBalance: 320.00,
  whatsapp: "593987654321", 
  isPremium: true,
  storageUsed: 1.2 * 1024 * 1024 * 1024,
  storageLimit: STORAGE_LIMITS.PREMIUM,
  bankAccount: {
      bankName: "Banco Nacional",
      accountNumber: "1234567890",
      accountType: "ahorros",
      holderName: "Alejandro Velasco"
  },
  ownedCourseIds: [],
  bio: "Investigador Senior con interés en tecnología aplicada a la educación.",
  title: "PhD in Computer Science",
  location: "Quito, Ecuador",
  aiCredits: 50,
  lastCreditReset: Date.now()
};

export const MARKETPLACE_COURSES: MarketplaceCourse[] = [];
export const MOCK_PUBLICATIONS: Publication[] = [];
export const MOCK_COURSES: Course[] = [];

export const LANGUAGE_TRACKS: LanguageTrack[] = [
  {
    id: 'english',
    name: 'English Professional',
    level: 'B2 / C1 Business',
    color: 'blue',
    flag: '🇺🇸',
    levels: [
      { id: 1, title: 'Business Basics', description: 'Corporate Greetings', locked: false, stars: 3, totalStars: 3, topic: 'Business Introductions' },
    ]
  }
];

export const OFFLINE_EXERCISES: Record<string, Record<string, string[]>> = {
  english: {
    'Business Introductions': [
      "Good morning, Mr. Jameson. It is a pleasure to meet you.||Formal greeting used in morning settings."
    ],
    'default': [
      "The project deadline is next Friday.||Timeline statement."
    ]
  },
  french: {
    'French Greetings': [
      "Bonjour, comment allez-vous?||Formal: 'Hello, how are you?'"
    ],
    'default': [
      "Je m'appelle Pierre.||Basic introduction."
    ]
  }
};
