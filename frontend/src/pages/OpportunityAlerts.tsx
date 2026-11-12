import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Briefcase,
  Trophy,
  Award,
  Sparkles,
  MapPin,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Video,
  Search,
  Filter,
  DollarSign,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { TwoWayMockInterview } from '../components/interview/TwoWayMockInterview';
import { cn } from '../lib/utils';

interface Opportunity {
  id: string;
  title: string;
  organization: string;
  type: 'internship' | 'hackathon' | 'scholarship' | 'job';
  category: string;
  location: string;
  stipend_or_reward: string;
  deadline: string;
  skill_match_percent: number;
  required_skills: string[];
  description: string;
  interview_role_focus: string;
  urgency: string;
  badge_color: string;
}

export const OpportunityAlerts: React.FC = () => {
  const { profile } = useAuth();
  const targetRole = profile?.target_role || 'Software Engineer';

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'internship' | 'hackathon' | 'scholarship' | 'job'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Active Mock Interview Modal State
  const [activeInterviewTarget, setActiveInterviewTarget] = useState<Opportunity | null>(null);

  useEffect(() => {
    async function loadAlerts() {
      setIsLoading(true);
      try {
        const data = await api.opportunities.getAlerts(targetRole);
        setOpportunities(data);
      } catch (err) {
        console.warn('Error loading opportunity alerts, using curated catalog:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadAlerts();
  }, [targetRole]);

  // Filtered Opportunities
  const filtered = opportunities.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.type === selectedCategory;
    const matchesQuery =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.required_skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesQuery;
  });

  // If student launched an interview session for an opportunity
  if (activeInterviewTarget) {
    return (
      <div className="max-w-7xl mx-auto space-y-4 animate-fadeIn">
        <TwoWayMockInterview
          role={targetRole}
          companyTarget={activeInterviewTarget.organization}
          interviewerId={
            activeInterviewTarget.type === 'internship' || activeInterviewTarget.type === 'job'
              ? 'alex_vance'
              : 'priya_sharma'
          }
          onExit={() => setActiveInterviewTarget(null)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* 1. HEADER HERO BANNER */}
      {/* ------------------------------------------------------------- */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#7652C8] via-[#865FD9] to-[#A78BFA] text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black text-amber-300">
            <Bell className="w-3.5 h-3.5" />
            <span>PERSONALIZED OPPORTUNITY ALERTS</span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-4xl tracking-tight text-white">
            Matching Internships, Hackathons & Placement Drives
          </h1>
          <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
            Curated opportunities tailored to your role (<span className="font-bold underline">{targetRole}</span>) and current skills. Click any opportunity to launch an interactive <strong>Two-Way AI Mock Interview</strong> pre-set for that company!
          </p>
        </div>

        {/* Ambient Halo */}
        <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. FILTER TABS & SEARCH BAR */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#EDE7FF] shadow-xs">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Alerts' },
            { id: 'internship', label: '💼 Internships' },
            { id: 'hackathon', label: '🏆 Hackathons' },
            { id: 'scholarship', label: '🎓 Scholarships' },
            { id: 'job', label: '🚀 Full-Time Jobs' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id as any)}
              className={cn(
                'px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer',
                selectedCategory === cat.id
                  ? 'bg-[#7652C8] text-white shadow-xs'
                  : 'bg-[#F8F6FF] text-[#77718B] hover:text-[#302B42] hover:bg-[#EDE7FF]'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#77718B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company, skill, title..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-[#F8F6FF] border border-[#EDE7FF] text-xs text-[#302B42] placeholder-[#77718B] focus:outline-none focus:ring-2 focus:ring-[#7652C8]"
          />
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. OPPORTUNITY CARDS GRID */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((opp, idx) => (
          <motion.div
            key={opp.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            className="rounded-3xl border border-[#EDE7FF] bg-white p-5 shadow-card hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:border-[#7652C8]/50"
          >
            <div className="space-y-3">
              {/* Top Row: Type Pill & Match Percentage */}
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'text-[10px] font-black px-2.5 py-1 rounded-full border shadow-2xs',
                    opp.badge_color
                  )}
                >
                  {opp.category}
                </span>

                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>{opp.skill_match_percent}% Match</span>
                </div>
              </div>

              {/* Title & Organization */}
              <div>
                <h3 className="font-heading font-black text-base text-[#302B42] group-hover:text-[#7652C8] transition-colors leading-snug">
                  {opp.title}
                </h3>
                <span className="text-xs font-bold text-[#7652C8] block mt-0.5">
                  {opp.organization}
                </span>
              </div>

              {/* Location & Stipend Badges */}
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#77718B]">
                <div className="flex items-center gap-1 bg-[#F8F6FF] px-2 py-0.5 rounded-lg border border-[#EDE7FF]">
                  <MapPin className="w-3 h-3 text-[#7652C8]" />
                  <span>{opp.location}</span>
                </div>
                <div className="flex items-center gap-1 bg-[#F8F6FF] px-2 py-0.5 rounded-lg border border-[#EDE7FF] font-semibold text-emerald-700">
                  <DollarSign className="w-3 h-3" />
                  <span>{opp.stipend_or_reward}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-[#77718B] line-clamp-3 leading-relaxed">
                {opp.description}
              </p>

              {/* Required Skills Tags */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-bold text-[#77718B] uppercase tracking-wider block">
                  Required Skillset:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {opp.required_skills.map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#EDE7FF] text-[#7652C8]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Card Actions: Deadline & Start Interview Prep */}
            <div className="pt-5 mt-4 border-t border-[#EDE7FF] space-y-3">
              <div className="flex items-center justify-between text-[11px] text-[#77718B]">
                <span className="flex items-center gap-1 font-medium">
                  <Calendar className="w-3 h-3 text-[#7652C8]" />
                  {opp.deadline}
                </span>
                <span className="text-rose-600 font-bold">{opp.urgency}</span>
              </div>

              <button
                type="button"
                onClick={() => setActiveInterviewTarget(opp)}
                className="w-full py-3 px-4 rounded-2xl bg-[#7652C8] hover:bg-[#5f3bb5] text-white font-heading font-black text-xs shadow-md shadow-[#7652C8]/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Video className="w-4 h-4" />
                <span>Start Interview Prep for this Role</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
