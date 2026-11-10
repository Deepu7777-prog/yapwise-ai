import React, { useState } from 'react';
import { Sparkles, Trophy, BookOpen, Laptop, Code2, GraduationCap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface StudentCharacter {
  id: number;
  name: string;
  role: string;
  college: string;
  targetCompany: string;
  speech: string;
  avatarBg: string;
  clothing: string;
  accessory: string;
  milestoneReached: number;
  animationDelay: string;
}

const STUDENTS: StudentCharacter[] = [
  {
    id: 1,
    name: 'Rahul V.',
    role: 'Java Backend Aspirant',
    college: '3rd Yr CSE',
    targetCompany: 'Amazon / Oracle',
    speech: '"Practicing Spring Boot & REST APIs daily on YapWise!"',
    avatarBg: 'bg-violet-500',
    clothing: 'Navy Hoodie',
    accessory: '💻 Laptop sleeve',
    milestoneReached: 7,
    animationDelay: '0s',
  },
  {
    id: 2,
    name: 'Ananya S.',
    role: 'AI / Data Engineer',
    college: '4th Yr IT',
    targetCompany: 'Microsoft',
    speech: '"YapWise AI voice partner helped me crack mock technical rounds without stuttering."',
    avatarBg: 'bg-purple-500',
    clothing: 'Lavender Cardigan',
    accessory: '📱 Digital Tablet',
    milestoneReached: 9,
    animationDelay: '0.4s',
  },
  {
    id: 3,
    name: 'Vikram K.',
    role: 'Full-Stack Developer',
    college: '3rd Yr ECE',
    targetCompany: 'Razorpay',
    speech: '"Solved 120 DSA questions with the Progressive Hint assistant!"',
    avatarBg: 'bg-indigo-500',
    clothing: 'Denim Jacket',
    accessory: '🎧 Studio Headphones',
    milestoneReached: 6,
    animationDelay: '0.8s',
  },
  {
    id: 4,
    name: 'Sneha R.',
    role: 'Frontend Architect',
    college: '2nd Yr CSE',
    targetCompany: 'Google India',
    speech: '"Mastering React, TypeScript & Web Accessibility from day one."',
    avatarBg: 'bg-emerald-500',
    clothing: 'Mint Green Sweater',
    accessory: '📚 College Spiral Note',
    milestoneReached: 4,
    animationDelay: '1.2s',
  },
  {
    id: 5,
    name: 'Arjun M.',
    role: 'DevOps & Cloud Engineer',
    college: '4th Yr CSE',
    targetCompany: 'Goldman Sachs',
    speech: '"Docker, CI/CD, and daily behavioral voice drills gave me real confidence."',
    avatarBg: 'bg-teal-500',
    clothing: 'Tech Parka & Glasses',
    accessory: '☕ KeepCup Tumbler',
    milestoneReached: 8,
    animationDelay: '1.6s',
  },
  {
    id: 6,
    name: 'Divya P.',
    role: 'Systems Engineer',
    college: '3rd Yr AI & DS',
    targetCompany: 'Flipkart',
    speech: '"The AI detects exactly where I fumble and gives me better sentences."',
    avatarBg: 'bg-amber-500',
    clothing: 'Peach Pullover',
    accessory: '🎒 Campus Backpack',
    milestoneReached: 5,
    animationDelay: '2.0s',
  },
  {
    id: 7,
    name: 'Rohan T.',
    role: 'Product Specialist',
    college: 'Final Year CSE',
    targetCompany: 'Deloitte Digital',
    speech: '"The STAR framework interview practice made HR rounds effortless!"',
    avatarBg: 'bg-rose-500',
    clothing: 'Semi-formal Blazer',
    accessory: '📁 Placement Folio',
    milestoneReached: 10,
    animationDelay: '2.4s',
  },
  {
    id: 8,
    name: 'Meera N.',
    role: 'Software Engineer',
    college: 'Campus Placed 🎉',
    targetCompany: 'Placed at Atlassian (32 LPA)',
    speech: '"Talk smart, speak confidently! YapWise turned my placement anxiety into dream offers."',
    avatarBg: 'bg-pink-500',
    clothing: 'Celebration Stole',
    accessory: '📜 Placement Letter',
    milestoneReached: 10,
    animationDelay: '2.8s',
  },
];

interface Props {
  currentRole?: string;
  completedCount?: number;
  onSelectMilestone?: (id: number) => void;
}

export const CampusStudentJourney3D: React.FC<Props> = ({
  currentRole = 'Software Engineer',
  completedCount = 3,
  onSelectMilestone,
}) => {
  const [selectedStudent, setSelectedStudent] = useState<StudentCharacter>(STUDENTS[0]);
  const [isPlayingMotion, setIsPlayingMotion] = useState(true);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#EDE7FF]/60 via-[#F8F6FF] to-white border border-[#D4C7F5] shadow-card p-6 md:p-8">
      {/* Background Campus Horizon & Floating 3D Orbs */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#8B70D6]/10 to-transparent pointer-events-none" />
      <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#BDEBD9]/40 blur-2xl pointer-events-none" />
      <div className="absolute top-1/2 -left-12 w-48 h-48 rounded-full bg-[#FFD9C9]/40 blur-2xl pointer-events-none" />

      {/* Header Banner */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#EDE7FF]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#EDE7FF] text-[#8B70D6] border border-[#D4C7F5]">
              <Sparkles className="w-3.5 h-3.5" />
              Interactive Campus Journey
            </span>
            <span className="text-[11px] font-bold text-[#77718B]">
              8 B.Tech Students Walking Ahead
            </span>
          </div>
          <h2 className="font-heading font-extrabold text-xl sm:text-2xl text-[#29243A]">
            The Placement Highway: From Campus to Offer Letter
          </h2>
          <p className="text-xs sm:text-sm text-[#77718B] max-w-2xl mt-1">
            Walk alongside fellow engineers mastering data structures, real-time speech, and placement interviews. Tap any student to hear their placement strategy!
          </p>
        </div>

        {/* Journey Quick Stats */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2 rounded-2xl bg-white border border-[#EDE7FF] shadow-sm text-center">
            <div className="text-[10px] font-bold text-[#77718B] uppercase tracking-wider">Milestones</div>
            <div className="text-lg font-extrabold text-[#8B70D6]">{completedCount}/10 Done</div>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-[#BDEBD9]/50 border border-[#A5DEC6] shadow-sm text-center">
            <div className="text-[10px] font-bold text-[#1D6A4E] uppercase tracking-wider">Target Role</div>
            <div className="text-xs font-extrabold text-[#1D6A4E] truncate max-w-[120px]">{currentRole}</div>
          </div>
        </div>
      </div>

      {/* Animated 3D Interactive Campus Walk Canvas */}
      <div className="relative z-10 my-6 py-6 overflow-x-auto no-scrollbar">
        <div className="min-w-[760px] relative px-4">
          {/* Curving Stone Pathway */}
          <div className="relative h-28 flex items-center">
            {/* The Winding Path */}
            <div className="absolute inset-x-0 h-10 bg-gradient-to-r from-[#EDE7FF] via-[#E2D9FC] to-[#D4C7F5] rounded-full shadow-inner border border-[#C5B5ED]" />
            <div className="absolute inset-x-4 h-0.5 border-t-2 border-dashed border-[#8B70D6]/30 top-1/2 -translate-y-1/2" />

            {/* Walking Students along the Path */}
            <div className="relative w-full flex items-center justify-between z-10 px-2">
              {STUDENTS.map((st, idx) => {
                const isSelected = selectedStudent.id === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStudent(st)}
                    className={cn(
                      'group relative flex flex-col items-center transition-all duration-300 focus:outline-none',
                      isSelected ? 'scale-110 -translate-y-2' : 'hover:scale-105 hover:-translate-y-1'
                    )}
                    style={{
                      animation: isPlayingMotion ? `bounce 2.6s infinite ease-in-out ${st.animationDelay}` : 'none',
                    }}
                  >
                    {/* Student Thought / Milestone Marker */}
                    <div
                      className={cn(
                        'mb-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-tight transition-all shadow-sm',
                        isSelected
                          ? 'bg-[#8B70D6] text-white ring-2 ring-[#EDE7FF]'
                          : 'bg-white text-[#77718B] border border-[#EDE7FF] group-hover:border-[#8B70D6]'
                      )}
                    >
                      M{st.milestoneReached}
                    </div>

                    {/* Character 3D-styled Avatar Figure */}
                    <div className="relative">
                      {/* Avatar Circle with Student Face & Accessory */}
                      <div
                        className={cn(
                          'w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-sm shadow-md transition-transform',
                          st.avatarBg,
                          isSelected && 'ring-4 ring-[#8B70D6]/30'
                        )}
                      >
                        {st.name.charAt(0)}
                      </div>

                      {/* Small Role Icon badge */}
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center text-[10px] border border-[#EDE7FF]">
                        {idx === 0 && '☕'}
                        {idx === 1 && '🤖'}
                        {idx === 2 && '⚡'}
                        {idx === 3 && '🎨'}
                        {idx === 4 && '☁️'}
                        {idx === 5 && '🚀'}
                        {idx === 6 && '💼'}
                        {idx === 7 && '🏆'}
                      </span>
                    </div>

                    {/* Student Name */}
                    <span className="mt-1.5 text-[10px] font-bold text-[#29243A] group-hover:text-[#8B70D6] truncate max-w-[70px]">
                      {st.name}
                    </span>
                    <span className="text-[9px] text-[#77718B] truncate max-w-[70px]">
                      {st.college.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Selected Student Profile & Placement Advice Card */}
      <div className="relative z-10 bg-white rounded-2xl border border-[#EDE7FF] shadow-sm p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0', selectedStudent.avatarBg)}>
            {selectedStudent.name.charAt(0)}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-heading font-extrabold text-sm sm:text-base text-[#29243A]">
                {selectedStudent.name}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EDE7FF] text-[#8B70D6]">
                {selectedStudent.role}
              </span>
              <span className="text-[10px] font-semibold text-[#77718B]">
                {selectedStudent.college} • Aiming for {selectedStudent.targetCompany}
              </span>
            </div>
            <p className="text-xs text-[#29243A] font-medium italic pt-1">
              {selectedStudent.speech}
            </p>
          </div>
        </div>

        {/* Milestone Indicator & Accessory Info */}
        <div className="flex items-center gap-3 self-end md:self-center shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-bold text-[#77718B] uppercase tracking-wider">Gear</div>
            <div className="text-xs font-semibold text-[#29243A]">{selectedStudent.accessory}</div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[#EDE7FF] text-[#8B70D6] font-bold text-xs flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Milestone {selectedStudent.milestoneReached}/10
          </div>
        </div>
      </div>
    </div>
  );
};
