import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import LeftSidebar from '../components/Layout/LeftSidebar';
import RightPanel from '../components/Layout/RightPanel';
import HongKongMap from '../components/Charts/HongKongMap';
import { useStudentData, useBlacklistData, useStats } from '../hooks/useData';

// Helper to mask user_id for privacy display
function maskUserId(encrypted: string, index: number): string {
  const suffix = encrypted?.slice(-6, -2) || String(1000 + index);
  return `STU-${suffix.toUpperCase().slice(0,4)}`;
}

type TierFilter = 'ALL' | 'CRITICAL' | 'VULNERABLE' | 'SAFE';

export default function Dashboard() {
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<TierFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { students, loading: studentsLoading } = useStudentData();
  const { blacklist, greylist, loading: fraudLoading } = useBlacklistData();
  
  const stats = useStats(students, blacklist, greylist);
  
  // Use ref for base timestamp
  const baseTimestamp = useRef(Date.now());

  // Filter and sort students by tier, search query, and risk score
  const filteredStudents = useMemo(() => {
    if (!students.length) return [];
    
    let filtered = students;
    
    // Apply tier filter
    if (tierFilter !== 'ALL') {
      filtered = filtered.filter(s => s.risk_tier === tierFilter);
    }
    
    // Apply search filter (matches user_id or masked ID)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(s => {
        const userId = ((s as { user_id?: string }).user_id || '').toLowerCase();
        const maskedId = maskUserId(userId, 0).toLowerCase();
        return userId.includes(query) || maskedId.includes(query);
      });
    }
    
    return filtered
      .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))
      .slice(0, 100); // Show more results when searching
  }, [students, tierFilter, searchQuery]);

  // Transform student data for the stream table
  const streamData = useMemo(() => {
    if (!filteredStudents.length) return [];
    
    return filteredStudents.map((student, index) => {
      const timestamp = new Date(baseTimestamp.current - index * 5000);
      const riskReason = (student as { risk_reason?: string }).risk_reason || '';
      
      return {
        id: String(index),
        timestamp: timestamp.toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit',
        }),
        callerId: maskUserId((student as { user_id?: string }).user_id || '', index),
        riskScore: Math.round((student.risk_score || 0)),
        status: (student.risk_tier === 'CRITICAL' ? 'intercepted' : 
                 student.risk_tier === 'VULNERABLE' ? 'flagged' : 'monitoring') as 'intercepted' | 'flagged' | 'monitoring' | 'allowed' | 'blocked',
        ruleId: student.risk_tier || 'SAFE',
        triggerReason: riskReason,
      };
    });
  }, [filteredStudents]);

  // Get selected student data for right panel - includes LLM data
  const selectedUser = useMemo(() => {
    if (!selectedRowId) return null;
    
    const rowIndex = parseInt(selectedRowId);
    const row = streamData.find(r => r.id === selectedRowId);
    if (!row) return null;

    const student = filteredStudents[rowIndex];
    if (!student) return null;

    const riskReason = (student as { risk_reason?: string }).risk_reason || '';
    
    // Parse SHAP-like features from risk_reason
    const shapFeatures = [];
    
    if (riskReason.includes('fraud')) {
      shapFeatures.push({ name: 'Fraud Contact Detected', value: 4.5 });
    }
    if (riskReason.includes('overseas') || riskReason.includes('Mainland')) {
      shapFeatures.push({ name: 'Overseas Call Activity', value: 3.2 });
    }
    if ((student.exposure_score || 0) > 30) {
      shapFeatures.push({ name: `High Exposure (${student.exposure_score})`, value: (student.exposure_score || 0) / 20 });
    }
    if ((student.behavior_score || 0) > 30) {
      shapFeatures.push({ name: `Engaged with Suspects`, value: (student.behavior_score || 0) / 20 });
    }
    if ((student.identity_score || 0) > 50) {
      shapFeatures.push({ name: `Vulnerable Profile`, value: (student.identity_score || 0) / 25 });
    }
    
    // Default features if none extracted
    if (shapFeatures.length === 0) {
      shapFeatures.push(
        { name: 'Identity Risk', value: (student.identity_score || 0) / 25 },
        { name: 'Exposure Level', value: (student.exposure_score || 0) / 25 },
        { name: 'Behavior Pattern', value: (student.behavior_score || 0) / 25 }
      );
    }

    let profile = 'Standard Student';
    if (student.risk_tier === 'CRITICAL') profile = 'Critical Risk - Immediate Action';
    else if (student.risk_tier === 'VULNERABLE') profile = 'Vulnerable - Monitoring Required';

    return {
      id: row.callerId,
      profile: profile,
      status: student.risk_tier === 'CRITICAL' ? 'Active Threat' : 
              student.risk_tier === 'VULNERABLE' ? 'Under Watch' : 'Safe',
      segment: `Risk Score: ${student.risk_score}`,
      riskScores: {
        identity: student.identity_score || 0,
        exposure: student.exposure_score || 0,
        behavior: student.behavior_score || 0,
      },
      shapFeatures: shapFeatures.slice(0, 3),
      llmWarning: riskReason || 'This student shows elevated risk indicators.',
      // Extended data for Groq LLM
      riskTier: student.risk_tier,
      riskScore: student.risk_score,
      riskReason: riskReason,
    };
  }, [selectedRowId, streamData, filteredStudents]);

  const handleRowClick = (row: { id: string }) => {
    setSelectedRowId(row.id);
  };

  const handleWarn = () => {
    alert('SMS Warning sent to student!');
    setSelectedRowId(null);
  };

  const handleBlock = () => {
    alert('Student flagged for follow-up!');
    setSelectedRowId(null);
  };

  const isLoading = studentsLoading || fraudLoading;

  return (
    <div className="flex min-h-screen bg-[#0F172A]">
      {/* Left Sidebar */}
      <LeftSidebar />

      {/* Main Content */}
      <main className="flex-1 ml-64 overflow-y-auto">
        {/* Map */}
        <motion.div 
          className="p-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="h-64 rounded-lg overflow-hidden border border-white/10"
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <HongKongMap />
          </motion.div>
        </motion.div>

        {/* Student Risk Stream */}
        <motion.div 
          className="p-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-lg p-8 text-center"
              >
                <motion.div
                  className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <p className="text-slate-400 mt-4">Loading student risk data...</p>
              </motion.div>
            ) : (
              <motion.div
                key="table"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <StudentRiskTable 
                  data={streamData}
                  selectedId={selectedRowId}
                  onRowClick={handleRowClick}
                  tierFilter={tierFilter}
                  onTierFilterChange={setTierFilter}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  stats={stats}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Stats Row */}
        <div className="p-4 grid grid-cols-4 gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-lg p-4"
          >
            <p className="text-slate-400 text-xs font-mono uppercase">Total Students</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.totalStudents.toLocaleString()}</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-lg p-4"
          >
            <p className="text-slate-400 text-xs font-mono uppercase">Critical Risk</p>
            <p className="text-2xl font-bold text-red-500 mt-1">{stats.criticalCount.toLocaleString()}</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-lg p-4"
          >
            <p className="text-slate-400 text-xs font-mono uppercase">Vulnerable</p>
            <p className="text-2xl font-bold text-amber-500 mt-1">{stats.vulnerableCount.toLocaleString()}</p>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-lg p-4"
          >
            <p className="text-slate-400 text-xs font-mono uppercase">Safe</p>
            <p className="text-2xl font-bold text-green-500 mt-1">{stats.safeCount.toLocaleString()}</p>
          </motion.div>
        </div>
      </main>

      {/* Right Panel */}
      <RightPanel 
        selectedUser={selectedUser}
        onWarn={handleWarn}
        onBlock={handleBlock}
      />
    </div>
  );
}

// Student Risk Table Component with Tier Filter
interface StudentRow {
  id: string;
  timestamp: string;
  callerId: string;
  riskScore: number;
  status: 'intercepted' | 'flagged' | 'monitoring' | 'allowed' | 'blocked';
  ruleId: string;
  triggerReason?: string;
}

interface StudentRiskTableProps {
  data: StudentRow[];
  selectedId: string | null;
  onRowClick: (row: StudentRow) => void;
  tierFilter: TierFilter;
  onTierFilterChange: (tier: TierFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  stats: {
    totalStudents: number;
    criticalCount: number;
    vulnerableCount: number;
    safeCount: number;
  };
}

function StudentRiskTable({ data, selectedId, onRowClick, tierFilter, onTierFilterChange, searchQuery, onSearchChange, stats }: StudentRiskTableProps) {
  const getRiskTierBadge = (tier: string) => {
    const styles: Record<string, string> = {
      'CRITICAL': 'bg-red-500/20 text-red-400 border-red-500/50',
      'VULNERABLE': 'bg-amber-500/20 text-amber-400 border-amber-500/50',
      'SAFE': 'bg-green-500/20 text-green-400 border-green-500/50',
    };
    return (
      <span className={`px-2 py-0.5 rounded border text-xs font-medium ${styles[tier] || styles['SAFE']}`}>
        {tier}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'intercepted': 'bg-red-500 text-white',
      'flagged': 'bg-amber-500 text-slate-900',
      'monitoring': 'bg-cyan-500 text-slate-900',
    };
    const labels: Record<string, string> = {
      'intercepted': 'Critical',
      'flagged': 'Vulnerable',
      'monitoring': 'Safe',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || 'bg-slate-600 text-white'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return 'bg-red-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const filterButtons: { tier: TierFilter; label: string; count: number; color: string }[] = [
    { tier: 'ALL', label: 'All', count: stats.totalStudents, color: 'bg-slate-600' },
    { tier: 'CRITICAL', label: 'Critical', count: stats.criticalCount, color: 'bg-red-500' },
    { tier: 'VULNERABLE', label: 'Vulnerable', count: stats.vulnerableCount, color: 'bg-amber-500' },
    { tier: 'SAFE', label: 'Safe', count: stats.safeCount, color: 'bg-green-500' },
  ];

  return (
    <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-lg overflow-hidden">
      {/* Header with Search and Filter */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <motion.div 
              className="w-2 h-2 rounded-full bg-red-500"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-white font-medium">Student Risk Monitor</span>
            <span className="text-xs text-slate-400">({data.length} shown)</span>
          </div>
          
          {/* Search Box */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search student ID..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-slate-700/50 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 w-48"
            />
          </div>
        </div>
        
        {/* Tier Filter Buttons */}
        <div className="flex items-center gap-2">
          {filterButtons.map(({ tier, label, count, color }) => (
            <button
              key={tier}
              onClick={() => onTierFilterChange(tier)}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                tierFilter === tier 
                  ? `${color} text-white` 
                  : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
              }`}
            >
              {label} ({count.toLocaleString()})
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-slate-800">
            <tr className="text-left text-xs text-slate-400 font-mono uppercase tracking-wider border-b border-white/10">
              <th className="px-4 py-3">Student ID</th>
              <th className="px-4 py-3">Risk Tier</th>
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
                transition={{ delay: Math.min(index * 0.02, 0.5) }}
                onClick={() => onRowClick(row)}
                className={`cursor-pointer transition-all ${
                  selectedId === row.id
                    ? 'bg-cyan-500/10 border-l-2 border-cyan-400'
                    : 'hover:bg-white/5 border-l-2 border-transparent'
                } ${row.status === 'intercepted' ? 'border-l-2 border-l-red-500' : ''}`}
              >
                <td className="px-4 py-3">
                  <div className="text-sm text-white font-mono">{row.callerId}</div>
                </td>
                <td className="px-4 py-3">
                  {getRiskTierBadge(row.ruleId)}
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
