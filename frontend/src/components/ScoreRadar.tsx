import React from 'react';

interface MetricItem {
  subject: string;
  value: number; // 0 - 100
  fullMark?: number;
}

interface ScoreRadarProps {
  metrics: MetricItem[];
  size?: number;
}

export const ScoreRadar: React.FC<ScoreRadarProps> = ({ metrics, size = 320 }) => {
  const center = size / 2;
  const radius = (size / 2) * 0.75;
  const total = metrics.length;

  if (total < 3) return null;

  const angleStep = (Math.PI * 2) / total;

  // Generate web rings (25%, 50%, 75%, 100%)
  const rings = [0.25, 0.5, 0.75, 1.0];

  // Coordinates for data points
  const points = metrics.map((m, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (m.value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, label: m.subject, value: m.value, angle };
  });

  const polygonPath = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background rings */}
        {rings.map((ring, idx) => {
          const r = radius * ring;
          const ringPoints = Array.from({ length: total }).map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const x = center + r * Math.cos(angle);
            const y = center + r * Math.sin(angle);
            return `${x},${y}`;
          }).join(' ');

          return (
            <polygon
              key={idx}
              points={ringPoints}
              fill={idx === rings.length - 1 ? 'rgba(30, 41, 59, 0.4)' : 'transparent'}
              stroke="rgba(148, 163, 184, 0.15)"
              strokeWidth="1"
            />
          );
        })}

        {/* Axis spokes */}
        {metrics.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x2 = center + radius * Math.cos(angle);
          const y2 = center + radius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x2}
              y2={y2}
              stroke="rgba(148, 163, 184, 0.18)"
              strokeWidth="1"
            />
          );
        })}

        {/* Data polygon */}
        <polygon
          points={polygonPath}
          fill="rgba(16, 185, 129, 0.25)"
          stroke="#10b981"
          strokeWidth="2.5"
          className="transition-all duration-700 ease-out"
        />

        {/* Data point dots and labels */}
        {points.map((p, i) => {
          const labelDist = radius + 22;
          const labelX = center + labelDist * Math.cos(p.angle);
          const labelY = center + labelDist * Math.sin(p.angle);

          return (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="4" fill="#34d399" stroke="#064e3b" strokeWidth="2" />
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[11px] font-semibold fill-slate-300 select-none"
              >
                {p.label} ({Math.round(p.value)})
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
