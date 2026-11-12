export interface AvatarProfile {
  id: string;
  name: string;
  role: string;
  title: string;
  gender: 'female' | 'male';
  badge: string;
  badgeColor: string;
  gradient: {
    from: string;
    to: string;
    glow: string;
  };
  accentColor: string;
  voiceConfig: {
    pitch: number;
    rate: number;
    genderPreference: 'female' | 'male';
    targetKeywords: string[];
    sampleGreeting: string;
  };
  visualTraits: {
    skinTone: string;
    skinHighlight: string;
    skinShadow: string;
    hairColor: string;
    hairHighlight: string;
    hairStyle: 'professional_bun' | 'short_fade' | 'wavy_shoulder' | 'side_part' | 'sleek_bob' | 'classic_taper';
    eyeColor: string;
    lipColor: string;
    attireStyle: 'navy_blazer' | 'dark_tech_suit' | 'burgundy_jacket' | 'charcoal_blazer' | 'slate_sweater' | 'executive_formal';
    attirePrimaryColor: string;
    attireSecondaryColor: string;
    glasses?: boolean;
    glassesColor?: string;
  };
  specialty: string[];
  tagline: string;
  welcomePrompt: string;
}

export const REALISTIC_AVATARS: AvatarProfile[] = [
  {
    id: 'priya_sharma',
    name: 'Dr. Priya Sharma',
    role: 'Placement Director & Executive Communication Coach',
    title: 'Senior Communication Mentor',
    gender: 'female',
    badge: 'Executive Coach',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    gradient: {
      from: '#A78BFA',
      to: '#7652C8',
      glow: 'rgba(118, 82, 200, 0.35)',
    },
    accentColor: '#7652C8',
    voiceConfig: {
      pitch: 1.05,
      rate: 0.98,
      genderPreference: 'female',
      targetKeywords: ['zira', 'heera', 'priya', 'veena', 'female', 'natural', 'samantha', 'jenny'],
      sampleGreeting: "Hello! I am Dr. Priya Sharma. I'm here to help you articulate your ideas with poise, confidence, and authority.",
    },
    visualTraits: {
      skinTone: '#C68B59',
      skinHighlight: '#E0AA7C',
      skinShadow: '#A66B3B',
      hairColor: '#1A1412',
      hairHighlight: '#332722',
      hairStyle: 'wavy_shoulder',
      eyeColor: '#3D2314',
      lipColor: '#C46D65',
      attireStyle: 'navy_blazer',
      attirePrimaryColor: '#1E293B',
      attireSecondaryColor: '#7652C8',
    },
    specialty: ['Campus Placement Interviews', 'Executive Articulation', 'Grammar Refinement', 'Confidence Coaching'],
    tagline: 'Articulate your thoughts with poise, authority, and warmth',
    welcomePrompt: "Hello! I am Dr. Priya Sharma, your executive communication coach. Tell me about your placement goals or a topic you'd like to practice discussing today!",
  },
  {
    id: 'alex_vance',
    name: 'Alex Vance',
    role: 'Principal Cloud Architect & Technical Interview Coach',
    title: 'Lead Technical Interviewer',
    gender: 'male',
    badge: 'Tech Specialist',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    gradient: {
      from: '#60A5FA',
      to: '#2563EB',
      glow: 'rgba(37, 99, 235, 0.35)',
    },
    accentColor: '#2563EB',
    voiceConfig: {
      pitch: 0.92,
      rate: 0.96,
      genderPreference: 'male',
      targetKeywords: ['david', 'alex', 'mark', 'daniel', 'male', 'guy', 'ravi', 'google uk english male'],
      sampleGreeting: "Good day! I am Alex Vance. Let's practice breaking down complex engineering systems with crisp, structured clarity.",
    },
    visualTraits: {
      skinTone: '#EAC8AE',
      skinHighlight: '#F8DFCE',
      skinShadow: '#CF9D7F',
      hairColor: '#302824',
      hairHighlight: '#52433D',
      hairStyle: 'side_part',
      eyeColor: '#2A4365',
      lipColor: '#C2847A',
      attireStyle: 'charcoal_blazer',
      attirePrimaryColor: '#0F172A',
      attireSecondaryColor: '#3B82F6',
      glasses: true,
      glassesColor: '#1E293B',
    },
    specialty: ['System Design Articulation', 'Coding Interviews', 'Technical Trade-off Explanations', 'STAR Case Studies'],
    tagline: 'Structure engineering discussions with razor-sharp precision',
    welcomePrompt: "Good day! I'm Alex Vance, Principal Architect. Let's do a mock technical round. Walk me through a challenging backend or full-stack project you've engineered.",
  },
  {
    id: 'sarah_jenkins',
    name: 'Sarah Jenkins',
    role: 'Vice President of HR & Behavioral Interview Specialist',
    title: 'Leadership & HR Mentor',
    gender: 'female',
    badge: 'HR Executive',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    gradient: {
      from: '#FB7185',
      to: '#E11D48',
      glow: 'rgba(225, 29, 72, 0.35)',
    },
    accentColor: '#E11D48',
    voiceConfig: {
      pitch: 1.02,
      rate: 0.97,
      genderPreference: 'female',
      targetKeywords: ['jenny', 'samantha', 'victoria', 'karen', 'female', 'natural', 'zira'],
      sampleGreeting: "Welcome! I'm Sarah Jenkins. Together we'll craft compelling STAR behavioral answers that stand out to senior hiring committees.",
    },
    visualTraits: {
      skinTone: '#F3D2C1',
      skinHighlight: '#FFE7DB',
      skinShadow: '#D8AB95',
      hairColor: '#8C5B32',
      hairHighlight: '#B57C48',
      hairStyle: 'sleek_bob',
      eyeColor: '#1B4D3E',
      lipColor: '#CF6B72',
      attireStyle: 'burgundy_jacket',
      attirePrimaryColor: '#881337',
      attireSecondaryColor: '#FB7185',
    },
    specialty: ['Behavioral Questions', 'Conflict Resolution', 'Leadership Principles', 'Salary & Offer Discussions'],
    tagline: 'Master authentic, high-impact storytelling for behavioral rounds',
    welcomePrompt: "Welcome! I'm Sarah Jenkins. Let's start with a foundational behavioral question: Can you tell me about a time you had to deliver a critical project under a tight deadline?",
  },
  {
    id: 'marcus_chen',
    name: 'Marcus Chen',
    role: 'Engineering Manager & Placement Panelist',
    title: 'Senior Engineering Coach',
    gender: 'male',
    badge: 'Tier-1 Interviewer',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    gradient: {
      from: '#34D399',
      to: '#059669',
      glow: 'rgba(5, 150, 105, 0.35)',
    },
    accentColor: '#059669',
    voiceConfig: {
      pitch: 0.95,
      rate: 1.0,
      genderPreference: 'male',
      targetKeywords: ['mark', 'daniel', 'george', 'alex', 'male', 'guy', 'david'],
      sampleGreeting: "Hi everyone, I'm Marcus Chen. I love helping students transform technical knowledge into fluid, confident communication.",
    },
    visualTraits: {
      skinTone: '#E8C5A5',
      skinHighlight: '#F5DAC0',
      skinShadow: '#C49B78',
      hairColor: '#171717',
      hairHighlight: '#2E2E2E',
      hairStyle: 'short_fade',
      eyeColor: '#2B1E16',
      lipColor: '#BC7D75',
      attireStyle: 'slate_sweater',
      attirePrimaryColor: '#334155',
      attireSecondaryColor: '#10B981',
    },
    specialty: ['Technical Explanations', 'Group Discussions', 'Product Thinking', 'Analytical Communication'],
    tagline: 'Speak with confidence, logic, and collaborative leadership',
    welcomePrompt: "Hi there! I'm Marcus Chen. Let's practice discussing high-level architectural concepts or daily engineering scenarios. What would you like to explore today?",
  },
  {
    id: 'maya_lin',
    name: 'Maya Lin',
    role: 'Pronunciation, Accent & Conversational English Coach',
    title: 'English Fluency Specialist',
    gender: 'female',
    badge: 'Fluency Coach',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    gradient: {
      from: '#FCD34D',
      to: '#D97706',
      glow: 'rgba(217, 119, 6, 0.35)',
    },
    accentColor: '#D97706',
    voiceConfig: {
      pitch: 1.1,
      rate: 1.02,
      genderPreference: 'female',
      targetKeywords: ['ana', 'samantha', 'zira', 'female', 'natural', 'jenny'],
      sampleGreeting: "Hi there! I'm Maya Lin. Let's make speaking English feel as natural, fun, and effortless as speaking your native language.",
    },
    visualTraits: {
      skinTone: '#EFD4C3',
      skinHighlight: '#FCE7DB',
      skinShadow: '#D2AC95',
      hairColor: '#201A18',
      hairHighlight: '#3B302C',
      hairStyle: 'professional_bun',
      eyeColor: '#3F2A1D',
      lipColor: '#D97274',
      attireStyle: 'navy_blazer',
      attirePrimaryColor: '#1E1B4B',
      attireSecondaryColor: '#F59E0B',
    },
    specialty: ['Everyday Fluency', 'Accent Smoothing', 'Grammar Without Fear', 'Conversational Idioms'],
    tagline: 'Transform hesitation into smooth, charismatic conversational fluency',
    welcomePrompt: "Hi there! I'm Maya Lin. Don't worry about making mistakes—this is a friendly space to build your speaking flow. How was your day today?",
  },
  {
    id: 'david_miller',
    name: 'David Miller',
    role: 'Campus Placement & Executive Soft Skills Coach',
    title: 'Executive Presentation Coach',
    gender: 'male',
    badge: 'Presentation Coach',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    gradient: {
      from: '#818CF8',
      to: '#4F46E5',
      glow: 'rgba(79, 70, 229, 0.35)',
    },
    accentColor: '#4F46E5',
    voiceConfig: {
      pitch: 0.9,
      rate: 0.95,
      genderPreference: 'male',
      targetKeywords: ['david', 'guy', 'george', 'male', 'mark', 'daniel'],
      sampleGreeting: "Good day! I'm David Miller. We'll train your delivery, vocal variety, and presence so you command attention in every room.",
    },
    visualTraits: {
      skinTone: '#E4BE9E',
      skinHighlight: '#F3D4BA',
      skinShadow: '#C69A75',
      hairColor: '#4A3728',
      hairHighlight: '#6E533D',
      hairStyle: 'classic_taper',
      eyeColor: '#2F4F4F',
      lipColor: '#B87B70',
      attireStyle: 'executive_formal',
      attirePrimaryColor: '#1E293B',
      attireSecondaryColor: '#6366F1',
    },
    specialty: ['Elevator Pitches', 'Body Language in Video Rounds', 'Overcoming Nervousness', 'Vocal Cadence'],
    tagline: 'Speak with executive presence, rhythm, and magnetic impact',
    welcomePrompt: "Hello! I am David Miller. Let's polish your executive self-introduction. Give me a 45-second pitch of who you are and what drives you as an engineer.",
  },
];
