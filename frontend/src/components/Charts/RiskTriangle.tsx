import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface RiskTriangleProps {
  scores: {
    identity: number;
    exposure: number;
    behavior: number;
  };
}

export default function RiskTriangle({ scores }: RiskTriangleProps) {
  const data = [
    { axis: 'Identity', value: scores.identity, fullMark: 100 },
    { axis: 'Exposure', value: scores.exposure, fullMark: 100 },
    { axis: 'Behavior', value: scores.behavior, fullMark: 100 },
  ];

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid 
            stroke="rgba(255,255,255,0.1)" 
            strokeDasharray="3 3"
          />
          <PolarAngleAxis 
            dataKey="axis" 
            tick={{ 
              fill: '#94A3B8', 
              fontSize: 12,
              fontFamily: 'Inter'
            }}
          />
          <Radar
            name="Risk"
            dataKey="value"
            stroke="#00F0FF"
            fill="#00F0FF"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
