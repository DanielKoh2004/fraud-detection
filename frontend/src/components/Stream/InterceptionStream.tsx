import { motion } from 'framer-motion';

interface StreamRow {
  id: string;
  timestamp: string;
  callerId: string;
  recipient: string;
  riskScore: number;
  status: 'intercepted' | 'flagged' | 'monitoring' | 'allowed' | 'blocked';
  ruleId?: string;
  triggerReason?: string;
}

interface InterceptionStreamProps {
  data: StreamRow[];
  selectedId: string | null;
  onRowClick: (row: StreamRow) => void;
}

const getStatusBadge = (status: StreamRow['status']) => {
  const styles = {
    intercepted: 'bg-red-500 text-white',
    flagged: 'bg-amber-500 text-slate-900',
    monitoring: 'bg-cyan-500 text-slate-900',
    allowed: 'bg-slate-600 text-white',
    blocked: 'bg-red-600 text-white',
  };
  
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const getRuleBadge = (ruleId?: string) => {
  if (!ruleId) return null;
  
  const ruleColors: Record<string, string> = {
    'R1': 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    'R2': 'bg-orange-500/20 text-orange-400 border-orange-500/50',
    'R3': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    'R4': 'bg-red-500/20 text-red-400 border-red-500/50',
    'R5': 'bg-green-500/20 text-green-400 border-green-500/50',
    'R6': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    'R7': 'bg-pink-500/20 text-pink-400 border-pink-500/50',
    'ML': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
  };
  
  const color = ruleColors[ruleId] || ruleColors['ML'];
  
  return (
    <span className={`px-2 py-0.5 rounded border text-xs font-mono ${color}`}>
      {ruleId}
    </span>
  );
};

const getRiskScoreColor = (score: number) => {
  if (score >= 80) return 'bg-red-500';
  if (score >= 60) return 'bg-amber-500';
  if (score >= 40) return 'bg-cyan-500';
  return 'bg-slate-500';
};

export default function InterceptionStream({ data, selectedId, onRowClick }: InterceptionStreamProps) {
  return (
    <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <motion.div 
            className="w-2 h-2 rounded-full bg-cyan-400"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className="text-white font-medium">Live Interception Stream</span>
          <span className="text-xs text-slate-400 ml-2">({data.length} records from blacklist.csv)</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-400">Source: <span className="text-cyan-400">Real Data</span></span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-slate-400 font-mono uppercase tracking-wider border-b border-white/10">
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Caller ID</th>
              <th className="px-4 py-3">Rule</th>
              <th className="px-4 py-3">Risk Score</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => onRowClick(row)}
                className={`cursor-pointer transition-all ${
                  selectedId === row.id
                    ? 'bg-cyan-500/10 border-l-2 border-cyan-400'
                    : 'hover:bg-white/5 border-l-2 border-transparent'
                } ${row.status === 'intercepted' || row.status === 'blocked' ? 'border-l-2 border-l-red-500' : ''}`}
              >
                <td className="px-4 py-3 text-sm font-mono text-slate-300">{row.timestamp}</td>
                <td className="px-4 py-3">
                  <div className="text-sm text-white font-mono">{row.callerId}</div>
                </td>
                <td className="px-4 py-3">
                  {getRuleBadge(row.ruleId)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${getRiskScoreColor(row.riskScore)}`}
                        style={{ width: `${row.riskScore}%` }}
                      />
                    </div>
                    <span className="text-sm text-white font-mono w-8">{row.riskScore}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {getStatusBadge(row.status)}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

