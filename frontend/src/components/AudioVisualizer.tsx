import React from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
  barCount?: number;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isActive, barCount = 18 }) => {
  return (
    <div className="flex items-center justify-center gap-1.5 h-12 py-2">
      {Array.from({ length: barCount }).map((_, index) => {
        // Vary heights and animation delays
        const delay = (index % 5) * 0.15;
        const heightStyle = isActive
          ? {
              animation: `wave 1s ease-in-out ${delay}s infinite`,
              backgroundColor: index % 2 === 0 ? '#10b981' : '#6366f1',
            }
          : {
              height: '4px',
              backgroundColor: '#475569',
            };

        return (
          <div
            key={index}
            style={heightStyle}
            className="w-1.5 rounded-full transition-all duration-300"
          />
        );
      })}
    </div>
  );
};
