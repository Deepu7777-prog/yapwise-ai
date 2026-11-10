import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Compass, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4 animate-fadeIn">
      <div className="w-16 h-16 rounded-2xl bg-[#EDE7FF] border border-[#D4C7F5] text-[#8B70D6] flex items-center justify-center shadow-card">
        <Compass className="w-8 h-8" />
      </div>

      <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#29243A]">
        404 – Page Not Found
      </h1>

      <p className="text-xs sm:text-sm text-[#77718B] max-w-md leading-relaxed">
        The communication module or link you're looking for doesn't exist or has been relocated.
      </p>

      <div className="pt-2">
        <Link to="/dashboard">
          <Button variant="primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};