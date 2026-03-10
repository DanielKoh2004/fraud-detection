import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, XCircle, AlertTriangle, Search, Filter, 
  ChevronLeft, ChevronRight, Shield, Skull, UserCheck,
  FileText, BarChart2, Clock, User
} from 'lucide-react';
import LeftSidebar from '../components/Layout/LeftSidebar';
import { useBlacklistData } from '../hooks/useData';

interface FlaggedAccount {
  id: string;
  msisdn: string;
  riskScore: number;
  riskTier: 'HIGH' | 'MEDIUM' | 'LOW';
  source: string;
  triggerReason: string;
  detectedAt: string;
  listType: 'blacklist' | 'greylist';
}

interface ReviewAction {
  accountId: string;
  action: 'whitelist' | 'blacklist';
  reason: string;
  reviewedBy: string;
  reviewedAt: Date;
}

// Helper to mask MSISDN
function maskMsisdn(msisdn: string): string {
  if (!msisdn || msisdn.length < 8) return '***-****';
  return `${msisdn.slice(0, 4)}****${msisdn.slice(-4)}`;
}

export default function WhitelistReview() {
  const { blacklist, greylist, loading } = useBlacklistData();
  const [activeTab, setActiveTab] = useState<'review' | 'actions' | 'stats'>('review');
  const [listFilter, setListFilter] = useState<'all' | 'blacklist' | 'greylist'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<FlaggedAccount | null>(null);
  const [reviewerName, setReviewerName] = useState('');
  const [reviewReason, setReviewReason] = useState('');
  const [reviewActions, setReviewActions] = useState<ReviewAction[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Transform data
  const flaggedAccounts = useMemo(() => {
    const accounts: FlaggedAccount[] = [];
    const baseDate = 1705708800000; // Fixed timestamp for consistency
    
    blacklist.forEach((item, idx) => {
      accounts.push({
        id: `bl-${idx}`,
        msisdn: String(item.msisdn || ''),
        riskScore: Number(item.fraud_score) || 70 + (idx % 30),
        riskTier: 'HIGH',
        source: String(item.rule_id || 'ML_MODEL'),
        triggerReason: String(item.rule_reason || 'High fraud probability'),
        detectedAt: new Date(baseDate - (idx * 3600000)).toISOString(),
        listType: 'blacklist',
      });
    });
    
    greylist.forEach((item, idx) => {
      accounts.push({
        id: `gl-${idx}`,
        msisdn: String(item.msisdn || ''),
        riskScore: Number(item.fraud_score) || 40 + (idx % 20),
        riskTier: 'MEDIUM',
        source: String(item.rule_id || 'HEURISTIC'),
        triggerReason: String(item.rule_reason || 'Suspicious pattern'),
        detectedAt: new Date(baseDate - (idx * 7200000)).toISOString(),
        listType: 'greylist',
      });
    });
    
    return accounts;
  }, [blacklist, greylist]);

  // Filter and search
  const filteredAccounts = useMemo(() => {
    let result = flaggedAccounts;
    
    // Remove already reviewed accounts
    const reviewedIds = new Set(reviewActions.map(a => a.accountId));
    result = result.filter(a => !reviewedIds.has(a.id));
    
    if (listFilter !== 'all') {
      result = result.filter(a => a.listType === listFilter);
    }
    if (searchQuery) {
      result = result.filter(a => 
        a.msisdn.includes(searchQuery) || 
        a.triggerReason.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return result;
  }, [flaggedAccounts, listFilter, searchQuery, reviewActions]);

  // Pagination
  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
  const paginatedAccounts = filteredAccounts.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  // Handle review action
  const handleReviewAction = (action: 'whitelist' | 'blacklist') => {
    if (!selectedAccount || !reviewerName.trim()) return;
    
    const newAction: ReviewAction = {
      accountId: selectedAccount.id,
      action,
      reason: reviewReason || (action === 'whitelist' ? 'Verified legitimate' : 'Confirmed fraud'),
      reviewedBy: reviewerName,
      reviewedAt: new Date(),
    };
    
    setReviewActions(prev => [newAction, ...prev]);
    setSelectedAccount(null);
    setReviewReason('');
  };

  // Stats
  const stats = useMemo(() => ({
    pending: filteredAccounts.length,
    whitelisted: reviewActions.filter(a => a.action === 'whitelist').length,
    blacklisted: reviewActions.filter(a => a.action === 'blacklist').length,
    totalReviewed: reviewActions.length,
  }), [filteredAccounts, reviewActions]);

  const getRiskColor = (tier: string) => {
    if (tier === 'HIGH') return 'text-red-400 bg-red-500/20 border-red-500/50';
    if (tier === 'MEDIUM') return 'text-amber-400 bg-amber-500/20 border-amber-500/50';
    return 'text-green-400 bg-green-500/20 border-green-500/50';
  };

  return (
    <div className="flex min-h-screen bg-slate-900">
      <LeftSidebar />
      
      <main className="flex-1 ml-64 p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <CheckCircle className="text-green-400" />
            Manual Review Console
          </h1>
          <p className="text-slate-400 mt-1">
            Review flagged accounts • Move to Whitelist or confirm to Blacklist
          </p>
        </div>

        {/* Reviewer Input */}
        <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <User size={20} className="text-cyan-400" />
            <input
              type="text"
              placeholder="Enter your Staff ID to enable review actions..."
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              className="flex-1 bg-slate-700/50 border border-white/10 rounded-lg px-4 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
            />
            {reviewerName && (
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }}
                className="flex items-center gap-2 text-green-400"
              >
                <CheckCircle size={18} />
                <span className="text-sm">Authorized</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'review', label: 'Review Queue', icon: FileText, count: stats.pending },
            { id: 'actions', label: 'Review History', icon: Clock, count: stats.totalReviewed },
            { id: 'stats', label: 'Statistics', icon: BarChart2 },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-cyan-500 text-slate-900'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
              {tab.count !== undefined && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-slate-900/30' : 'bg-slate-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Review Queue Tab */}
        {activeTab === 'review' && (
          <div className="grid grid-cols-3 gap-6">
            {/* Account List */}
            <div className="col-span-2 space-y-4">
              {/* Filters */}
              <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter size={18} className="text-slate-400" />
                    {['all', 'blacklist', 'greylist'].map(filter => (
                      <button
                        key={filter}
                        onClick={() => { setListFilter(filter as typeof listFilter); setCurrentPage(1); }}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          listFilter === filter
                            ? filter === 'blacklist' ? 'bg-red-500 text-white' :
                              filter === 'greylist' ? 'bg-amber-500 text-slate-900' :
                              'bg-cyan-500 text-slate-900'
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        }`}
                      >
                        {filter === 'all' ? 'All' : filter === 'blacklist' ? '⚫ Blacklist' : '🔘 Greylist'}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search MSISDN or reason..."
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      className="w-full pl-9 pr-4 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>

              {/* Account Cards */}
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-12 text-slate-400">Loading accounts...</div>
                ) : paginatedAccounts.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    {reviewActions.length > 0 ? '🎉 All accounts reviewed!' : 'No accounts to review'}
                  </div>
                ) : (
                  <AnimatePresence>
                    {paginatedAccounts.map((account, idx) => (
                      <motion.div
                        key={account.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => setSelectedAccount(account)}
                        className={`bg-slate-800/50 backdrop-blur border rounded-lg p-4 cursor-pointer transition-all hover:border-cyan-400/50 ${
                          selectedAccount?.id === account.id ? 'border-cyan-400 ring-1 ring-cyan-400/30' : 'border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              account.listType === 'blacklist' ? 'bg-red-500/20' : 'bg-amber-500/20'
                            }`}>
                              {account.listType === 'blacklist' ? (
                                <Skull size={20} className="text-red-400" />
                              ) : (
                                <AlertTriangle size={20} className="text-amber-400" />
                              )}
                            </div>
                            <div>
                              <div className="text-white font-mono text-lg">{maskMsisdn(account.msisdn)}</div>
                              <div className="text-slate-400 text-sm">{account.triggerReason}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className={`text-sm font-medium px-2 py-0.5 rounded border ${getRiskColor(account.riskTier)}`}>
                                Score: {account.riskScore}
                              </div>
                              <div className="text-slate-500 text-xs mt-1">{account.source}</div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded bg-slate-700 text-white disabled:opacity-50"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-slate-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded bg-slate-700 text-white disabled:opacity-50"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>

            {/* Review Panel */}
            <div className="space-y-4">
              <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-lg p-4 sticky top-6">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                  <Shield size={18} className="text-cyan-400" />
                  Review Panel
                </h3>
                
                {selectedAccount ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-900/50 rounded-lg">
                      <div className="text-cyan-400 font-mono text-xl mb-2">
                        {maskMsisdn(selectedAccount.msisdn)}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Risk Score:</span>
                          <span className={selectedAccount.riskScore >= 70 ? 'text-red-400' : 'text-amber-400'}>
                            {selectedAccount.riskScore}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Source:</span>
                          <span className="text-white">{selectedAccount.source}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Current List:</span>
                          <span className={selectedAccount.listType === 'blacklist' ? 'text-red-400' : 'text-amber-400'}>
                            {selectedAccount.listType.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 text-slate-300 text-sm">
                        <strong>Trigger:</strong> {selectedAccount.triggerReason}
                      </div>
                    </div>

                    <textarea
                      placeholder="Review notes (optional)..."
                      value={reviewReason}
                      onChange={(e) => setReviewReason(e.target.value)}
                      className="w-full bg-slate-700/50 border border-white/10 rounded-lg p-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 h-24 resize-none"
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleReviewAction('whitelist')}
                        disabled={!reviewerName}
                        className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg"
                      >
                        <UserCheck size={20} />
                        Whitelist
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleReviewAction('blacklist')}
                        disabled={!reviewerName}
                        className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg"
                      >
                        <XCircle size={20} />
                        Blacklist
                      </motion.button>
                    </div>
                    
                    {!reviewerName && (
                      <p className="text-amber-400 text-sm text-center">
                        Enter Staff ID above to enable actions
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Shield size={48} className="mx-auto mb-3 opacity-30" />
                    <p>Select an account to review</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Review History Tab */}
        {activeTab === 'actions' && (
          <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-white font-medium">Review History ({reviewActions.length} actions)</h3>
            </div>
            
            {reviewActions.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                No review actions yet. Start reviewing accounts to see history here.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {reviewActions.map((action, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        action.action === 'whitelist' ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}>
                        {action.action === 'whitelist' ? (
                          <UserCheck size={20} className="text-green-400" />
                        ) : (
                          <XCircle size={20} className="text-red-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          {action.action === 'whitelist' ? 'Moved to Whitelist' : 'Confirmed to Blacklist'}
                        </div>
                        <div className="text-slate-400 text-sm">{action.reason}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-400 text-sm">{action.reviewedBy}</div>
                      <div className="text-slate-500 text-xs">
                        {action.reviewedAt.toLocaleString()}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-lg p-6">
              <div className="text-slate-400 text-sm mb-2">Pending Review</div>
              <div className="text-3xl font-bold text-cyan-400">{stats.pending}</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur border border-green-500/30 rounded-lg p-6">
              <div className="text-slate-400 text-sm mb-2">Whitelisted</div>
              <div className="text-3xl font-bold text-green-400">{stats.whitelisted}</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur border border-red-500/30 rounded-lg p-6">
              <div className="text-slate-400 text-sm mb-2">Blacklisted</div>
              <div className="text-3xl font-bold text-red-400">{stats.blacklisted}</div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-lg p-6">
              <div className="text-slate-400 text-sm mb-2">Total Reviewed</div>
              <div className="text-3xl font-bold text-white">{stats.totalReviewed}</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
