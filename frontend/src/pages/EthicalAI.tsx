import { motion } from 'framer-motion';
import { 
  Shield, Lock, Scale, Lightbulb, Users, CheckCircle, 
  Eye, FileText, Award, Heart
} from 'lucide-react';
import LeftSidebar from '../components/Layout/LeftSidebar';

const principles = [
  {
    icon: Lock,
    title: 'Privacy by Design',
    description: 'All personal data is masked and protected before display. Phone numbers and IDs are never shown in full. Aggregate statistics use differential privacy to prevent re-identification attacks.',
    highlights: ['PII Masking', 'Differential Privacy', 'Data Minimization'],
    color: 'cyan',
  },
  {
    icon: Scale,
    title: 'Fairness & Non-Discrimination',
    description: 'Fraud scoring uses behavioral patterns only. Age, gender, nationality, and other protected attributes are explicitly excluded from the ML model features.',
    highlights: ['Behavioral Only', 'No Demographics', 'Balanced Training'],
    color: 'green',
  },
  {
    icon: Lightbulb,
    title: 'Explainable Decisions',
    description: 'Every flagged account shows exactly why it was flagged. Our 7-rule engine provides clear trigger reasons, and SHAP analysis explains ML model predictions.',
    highlights: ['SHAP Analysis', 'Rule Reasons', 'Transparent Scoring'],
    color: 'amber',
  },
  {
    icon: Users,
    title: 'Human-in-the-Loop',
    description: 'No automated blocking. All flagged accounts are reviewed by staff before action. A whitelist process allows appeals for false positives.',
    highlights: ['Manual Review', 'Appeal Process', 'Staff Oversight'],
    color: 'purple',
  },
];

const complianceItems = [
  { label: 'PCPD Guidelines', desc: 'Hong Kong Privacy Commissioner for Personal Data', icon: Shield },
  { label: 'Right to Explanation', desc: 'Every decision includes human-readable justification', icon: FileText },
  { label: 'Data Minimization', desc: 'Only behavioral features; no call content stored', icon: Eye },
];

const implementationTable = [
  { principle: 'Privacy', implementation: 'PII masking, Differential Privacy (ε=0.1) for aggregate stats', status: 'Active' },
  { principle: 'Explainability', implementation: 'SHAP waterfall plots, Rule-based trigger reasons', status: 'Active' },
  { principle: 'Fairness', implementation: 'Protected attributes excluded, Balanced training data', status: 'Active' },
  { principle: 'Accountability', implementation: 'Whitelist appeals, Full audit trail, Staff review', status: 'Active' },
];

export default function EthicalAI() {
  const getColorClasses = (color: string) => ({
    cyan: { bg: 'from-cyan-500/20 to-cyan-600/5', border: 'border-cyan-500/30', text: 'text-cyan-400', badge: 'bg-cyan-500/20 text-cyan-400' },
    green: { bg: 'from-green-500/20 to-green-600/5', border: 'border-green-500/30', text: 'text-green-400', badge: 'bg-green-500/20 text-green-400' },
    amber: { bg: 'from-amber-500/20 to-amber-600/5', border: 'border-amber-500/30', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-400' },
    purple: { bg: 'from-purple-500/20 to-purple-600/5', border: 'border-purple-500/30', text: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-400' },
  }[color] || { bg: '', border: '', text: '', badge: '' });

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      <LeftSidebar />

      <main className="flex-1 ml-64 p-6 overflow-y-auto">
        {/* Hero Header */}
        <motion.div 
          className="relative bg-gradient-to-r from-slate-800/80 via-slate-800/40 to-transparent backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-8 overflow-hidden"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl">
                <Shield className="text-white" size={32} />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  Responsible AI
                </h1>
                <p className="text-slate-400 text-lg mt-1">
                  Building Trust Through Transparency, Fairness, and Privacy
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Core Principles Grid */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {principles.map((principle, idx) => {
            const colors = getColorClasses(principle.color);
            const Icon = principle.icon;
            
            return (
              <motion.div
                key={principle.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-2xl p-6 hover:border-opacity-50 transition-all`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${colors.badge}`}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{principle.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-4">
                      {principle.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {principle.highlights.map(h => (
                        <span key={h} className={`px-3 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
                          {h}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Compliance Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Award size={20} className="text-green-400" />
            Compliance & Standards
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {complianceItems.map((item, idx) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="bg-slate-800/40 backdrop-blur-xl border border-green-500/20 rounded-xl p-5 text-center"
              >
                <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-full text-sm font-bold mb-3">
                  <CheckCircle size={16} />
                  {item.label}
                </div>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Implementation Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden mb-8"
        >
          <div className="p-4 border-b border-white/10">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText size={18} className="text-cyan-400" />
              Implementation Highlights
            </h2>
          </div>
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Principle</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">How We Implement It</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {implementationTable.map((row, idx) => (
                <motion.tr
                  key={row.principle}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + idx * 0.1 }}
                  className="hover:bg-white/5"
                >
                  <td className="px-6 py-4 text-white font-medium">{row.principle}</td>
                  <td className="px-6 py-4 text-slate-400">{row.implementation}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                      <CheckCircle size={14} />
                      {row.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Commitment Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-gradient-to-r from-slate-800/60 to-slate-800/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl">
              <Heart className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Our Commitment</h3>
              <p className="text-slate-400 leading-relaxed">
                We believe fraud detection should protect users without compromising their rights. 
                This system is designed to be <span className="text-cyan-400 font-medium">transparent</span>, 
                <span className="text-green-400 font-medium"> fair</span>, and 
                <span className="text-purple-400 font-medium"> privacy-preserving</span>. 
                Every decision can be explained, every flag can be appealed, and every user's privacy is protected.
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
