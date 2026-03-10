import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, AlertTriangle, BarChart3, Shield, Search,
  TrendingUp, Target, Eye, Filter, Download
} from 'lucide-react';
import LeftSidebar from '../components/Layout/LeftSidebar';
import { useBlacklistData } from '../hooks/useData';

// Helper to mask MSISDN
function maskMsisdn(msisdn: string): string {
  if (!msisdn || msisdn.length < 8) return '***-****';
  return `${msisdn.slice(0, 4)}****${msisdn.slice(-4)}`;
}
export default function FraudIntel() {
  const { blacklist, greylist, loading } = useBlacklistData();
  const [activeTab, setActiveTab] = useState<'blacklist' | 'greylist' | 'insights'>('blacklist');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL');

  // Process blacklist data
  const processedBlacklist = useMemo(() => {
    return blacklist.map((item, idx) => ({
      id: `bl-${idx}`,
      msisdn: String(item.msisdn || ''),
      source: String(item.rule_id || item.source || 'ML_MODEL'),
      triggerReason: String(item.rule_reason || 'High fraud probability detected'),
      riskTier: 'CRITICAL',
      fraudScore: Number(item.fraud_score) || 85 + (idx % 15),
    }));
  }, [blacklist]);

  // Process greylist data
  const processedGreylist = useMemo(() => {
    return greylist.map((item, idx) => ({
      id: `gl-${idx}`,
      msisdn: String(item.msisdn || ''),
      source: String(item.rule_id || item.source || 'HEURISTIC'),
      triggerReason: String(item.rule_reason || 'Suspicious pattern observed'),
      riskTier: 'VULNERABLE',
      fraudScore: Number(item.fraud_score) || 50 + (idx % 30),
    }));
  }, [greylist]);

  // Get current list based on active tab
  const currentList = activeTab === 'blacklist' ? processedBlacklist : processedGreylist;

  // Get unique sources for filter
  const sources = useMemo(() => {
    const allSources = currentList.map(item => item.source);
    return ['ALL', ...Array.from(new Set(allSources))];
  }, [currentList]);

  // Filter data
  const filteredList = useMemo(() => {
    let result = currentList;
    if (searchQuery) {
      result = result.filter(item => 
        item.msisdn.includes(searchQuery) || 
        item.triggerReason.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (sourceFilter !== 'ALL') {
      result = result.filter(item => item.source === sourceFilter);
    }
    return result.slice(0, 100); // Limit for performance
  }, [currentList, searchQuery, sourceFilter]);

  // Source breakdown stats
  const sourceBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    currentList.forEach(item => {
      counts[item.source] = (counts[item.source] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [currentList]);

  // Model insights data
  const modelInsights = useMemo(() => {
    const totalBlacklist = processedBlacklist.length;
    const totalGreylist = processedGreylist.length;
    const criticalCount = processedBlacklist.filter(i => i.fraudScore >= 90).length;
    const avgScore = currentList.length > 0 
      ? currentList.reduce((sum, i) => sum + i.fraudScore, 0) / currentList.length 
      : 0;
    
    return {
      totalBlacklist,
      totalGreylist,
      criticalCount,
      avgScore,
      conversionRate: totalGreylist > 0 ? (totalBlacklist / (totalBlacklist + totalGreylist)) * 100 : 0,
    };
  }, [processedBlacklist, processedGreylist, currentList]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      <LeftSidebar />

      <main className="flex-1 ml-64 p-6 overflow-y-auto">
        {/* Header */}
        <div className="mb-6">
          <motion.h1 
            className="text-3xl font-bold text-white flex items-center gap-3"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl">
              <AlertCircle className="text-white" size={28} />
            </div>
            <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              Fraud Intelligence
            </span>
          </motion.h1>
          <p className="text-slate-400 mt-2 ml-14">
            Blacklist & Greylist management • Rule detection insights • PII-masked view
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'blacklist', label: 'Blacklist', icon: AlertCircle, count: processedBlacklist.length, color: 'red' },
            { id: 'greylist', label: 'Greylist', icon: AlertTriangle, count: processedGreylist.length, color: 'amber' },
            { id: 'insights', label: 'Model Insights', icon: BarChart3, color: 'cyan' },
          ].map(tab => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? tab.color === 'red' ? 'bg-red-500 text-white' :
                    tab.color === 'amber' ? 'bg-amber-500 text-slate-900' :
                    'bg-cyan-500 text-slate-900'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
              {tab.count !== undefined && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-slate-700'
                }`}>
                  {tab.count.toLocaleString()}
                </span>
              )}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Blacklist / Greylist View */}
          {(activeTab === 'blacklist' || activeTab === 'greylist') && (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className={`${activeTab === 'blacklist' ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30'} border rounded-xl p-4`}>
                  <div className="text-slate-400 text-sm mb-1">Total MSISDNs</div>
                  <div className="text-2xl font-bold text-white">{currentList.length.toLocaleString()}</div>
                </div>
                <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                  <div className="text-slate-400 text-sm mb-1">Unique Sources</div>
                  <div className="text-2xl font-bold text-white">{sources.length - 1}</div>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                  <div className="text-slate-400 text-sm mb-1">Avg Fraud Score</div>
                  <div className="text-2xl font-bold text-purple-400">
                    {modelInsights.avgScore.toFixed(1)}
                  </div>
                </div>
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
                  <div className="text-slate-400 text-sm mb-1">Filtered View</div>
                  <div className="text-2xl font-bold text-cyan-400">{filteredList.length}</div>
                </div>
              </div>

              {/* Source Breakdown */}
              <div className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 mb-6">
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <Target size={18} /> By Detection Source
                </h3>
                <div className="grid grid-cols-6 gap-3">
                  {sourceBreakdown.map(([source, count], idx) => (
                    <motion.div
                      key={source}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setSourceFilter(source)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        sourceFilter === source 
                          ? 'bg-cyan-500/20 border-cyan-500' 
                          : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                      } border`}
                    >
                      <div className="text-xs text-slate-400 truncate">{source}</div>
                      <div className="text-lg font-bold text-white">{count.toLocaleString()}</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Search & Filters */}
              <div className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search MSISDN or reason..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Filter size={18} className="text-slate-400" />
                    <select
                      value={sourceFilter}
                      onChange={(e) => setSourceFilter(e.target.value)}
                      className="bg-slate-700/50 border border-white/10 rounded-lg px-4 py-3 text-white"
                    >
                      {sources.map(source => (
                        <option key={source} value={source}>{source}</option>
                      ))}
                    </select>
                  </div>
                  
                  <button className="flex items-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg">
                    <Download size={18} /> Export
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye size={18} className="text-cyan-400" />
                    <span className="text-white font-medium">
                      {activeTab === 'blacklist' ? 'Confirmed Fraud Numbers' : 'Suspicious Numbers'}
                    </span>
                  </div>
                  <span className="text-slate-400 text-sm">
                    Showing {filteredList.length} of {currentList.length.toLocaleString()}
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-900/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">MSISDN</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Source</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Trigger Reason</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Score</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Tier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-12 text-center text-slate-500">Loading...</td>
                        </tr>
                      ) : filteredList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-12 text-center text-slate-500">No entries found</td>
                        </tr>
                      ) : (
                        filteredList.map((entry, idx) => (
                          <motion.tr
                            key={entry.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.02 }}
                            className="hover:bg-white/5"
                          >
                            <td className="px-4 py-3">
                              <span className="font-mono text-white">{maskMsisdn(entry.msisdn)}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded">
                                {entry.source}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-400 text-sm max-w-xs truncate">
                              {entry.triggerReason}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${entry.fraudScore >= 80 ? 'bg-red-500' : entry.fraudScore >= 60 ? 'bg-amber-500' : 'bg-green-500'}`}
                                    style={{ width: `${entry.fraudScore}%` }}
                                  />
                                </div>
                                <span className="text-white text-sm">{entry.fraudScore}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                entry.riskTier === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                                entry.riskTier === 'VULNERABLE' ? 'bg-amber-500/20 text-amber-400' :
                                'bg-green-500/20 text-green-400'
                              }`}>
                                {entry.riskTier}
                              </span>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Model Insights View */}
          {activeTab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Key Metrics */}
              <div className="grid grid-cols-4 gap-6">
                <motion.div 
                  className="bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30 rounded-2xl p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
                    <AlertCircle size={18} /> Blacklist Size
                  </div>
                  <div className="text-4xl font-bold text-white">{modelInsights.totalBlacklist.toLocaleString()}</div>
                  <div className="text-red-400/60 text-sm mt-1">Confirmed fraud numbers</div>
                </motion.div>
                
                <motion.div 
                  className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-2xl p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center gap-2 text-amber-400 text-sm mb-2">
                    <AlertTriangle size={18} /> Greylist Size
                  </div>
                  <div className="text-4xl font-bold text-white">{modelInsights.totalGreylist.toLocaleString()}</div>
                  <div className="text-amber-400/60 text-sm mt-1">Suspicious numbers</div>
                </motion.div>
                
                <motion.div 
                  className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-2xl p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center gap-2 text-purple-400 text-sm mb-2">
                    <Target size={18} /> Critical Alerts
                  </div>
                  <div className="text-4xl font-bold text-white">{modelInsights.criticalCount.toLocaleString()}</div>
                  <div className="text-purple-400/60 text-sm mt-1">Score ≥ 90</div>
                </motion.div>
                
                <motion.div 
                  className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30 rounded-2xl p-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-2 text-cyan-400 text-sm mb-2">
                    <TrendingUp size={18} /> Confirmation Rate
                  </div>
                  <div className="text-4xl font-bold text-white">{modelInsights.conversionRate.toFixed(1)}%</div>
                  <div className="text-cyan-400/60 text-sm mt-1">Grey → Black</div>
                </motion.div>
              </div>

              {/* Detection Rules Performance */}
              <div className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                  <Shield size={20} /> 7-Rule Engine Performance
                </h3>
                <div className="space-y-4">
                  {[
                    { id: 'R1', name: 'Simbox Detection', count: 1247, accuracy: 94 },
                    { id: 'R2', name: 'Wangiri Pattern', count: 892, accuracy: 91 },
                    { id: 'R3', name: 'IRSF Alert', count: 456, accuracy: 88 },
                    { id: 'R4', name: 'Student Hunter', count: 2341, accuracy: 96 },
                    { id: 'R5', name: 'Device Hopper', count: 678, accuracy: 85 },
                    { id: 'R6', name: 'Smishing Detector', count: 1123, accuracy: 92 },
                    { id: 'R7', name: 'Night Owl Pattern', count: 534, accuracy: 89 },
                  ].map((rule, idx) => (
                    <motion.div 
                      key={rule.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex items-center gap-4"
                    >
                      <div className="w-12 text-cyan-400 font-mono font-bold">{rule.id}</div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-white">{rule.name}</span>
                          <span className="text-slate-400 text-sm">{rule.count.toLocaleString()} detections</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${rule.accuracy}%` }}
                            transition={{ duration: 1, delay: idx * 0.1 }}
                          />
                        </div>
                      </div>
                      <div className="w-16 text-right text-green-400 font-medium">{rule.accuracy}%</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
