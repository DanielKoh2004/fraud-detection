import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Send, Ban, Sparkles, Loader2 } from 'lucide-react';
import RiskTriangle from '../Charts/RiskTriangle';
import { useGroqIntervention } from '../../hooks/useGroqIntervention';

interface RightPanelProps {
  selectedUser: {
    id: string;
    profile: string;
    status: string;
    segment: string;
    riskScores: {
      identity: number;
      exposure: number;
      behavior: number;
    };
    shapFeatures: Array<{
      name: string;
      value: number;
    }>;
    llmWarning: string;
    // Extended student data for LLM
    riskTier?: string;
    riskScore?: number;
    riskReason?: string;
  } | null;
  onWarn: () => void;
  onBlock: () => void;
}

export default function RightPanel({ selectedUser, onWarn, onBlock }: RightPanelProps) {
  const { generateScript, error: llmError } = useGroqIntervention();
  const [llmScript, setLlmScript] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate LLM script when user is selected
  useEffect(() => {
    if (selectedUser) {
      setLlmScript(null); // Reset
    }
  }, [selectedUser?.id]);

  const handleGenerateScript = async () => {
    if (!selectedUser) return;
    
    setIsGenerating(true);
    try {
      const script = await generateScript({
        risk_tier: selectedUser.riskTier || selectedUser.status,
        risk_score: selectedUser.riskScore || 
          Math.round((selectedUser.riskScores.identity + selectedUser.riskScores.exposure + selectedUser.riskScores.behavior) / 3),
        age: 21,
        identity_score: selectedUser.riskScores.identity,
        exposure_score: selectedUser.riskScores.exposure,
        behavior_score: selectedUser.riskScores.behavior,
        risk_reason: selectedUser.riskReason || selectedUser.llmWarning,
      });
      setLlmScript(script);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!selectedUser) {
    return (
      <div className="w-[360px] h-screen bg-slate-800/50 backdrop-blur-xl border-l border-white/10 flex items-center justify-center flex-shrink-0">
        <div className="text-center text-slate-400">
          <AlertTriangle size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-sm">Select a student to view profile</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 50, opacity: 0 }}
        className="w-[360px] h-screen bg-slate-800/50 backdrop-blur-xl border-l border-white/10 flex flex-col flex-shrink-0"
      >
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Header */}
          <div className="p-4 border-b border-white/10">
            <p className="text-slate-400 text-xs font-mono uppercase tracking-wider">Student Profile</p>
            <h2 className="text-white text-xl font-bold mt-1">{selectedUser.id}</h2>
            <p className="text-cyan-400 text-sm">{selectedUser.profile}</p>
          </div>

          {/* Status & Segment */}
          <div className="grid grid-cols-2 gap-4 p-4 border-b border-white/10">
            <div>
              <p className="text-slate-400 text-xs font-mono">Status</p>
              <p className="text-red-500 text-sm font-medium mt-1">{selectedUser.status}</p>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-mono">Risk</p>
              <p className="text-white text-sm font-medium mt-1">{selectedUser.segment}</p>
            </div>
          </div>

          {/* Risk Triangle */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              <p className="text-white text-sm font-medium">Risk Vectors</p>
            </div>
            <RiskTriangle scores={selectedUser.riskScores} />
          </div>

          {/* SHAP Features */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-cyan-400" />
              <p className="text-white text-sm font-medium">AI Reasoning (SHAP)</p>
            </div>
            <div className="space-y-3">
              {selectedUser.shapFeatures.map((feature, index) => (
                <div key={index}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{feature.name}</span>
                    <span className="text-cyan-400 font-mono">+{feature.value.toFixed(1)}</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(feature.value * 20, 100)}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LLM Intervention */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-amber-400" />
                <p className="text-white text-sm font-medium">Intervention</p>
              </div>
              {!llmScript && !isGenerating && (
                <button
                  onClick={handleGenerateScript}
                  className="text-xs text-cyan-400 hover:text-cyan-300 px-2 py-1 rounded border border-cyan-400/50 hover:border-cyan-400"
                >
                  Generate with AI
                </button>
              )}
            </div>
            
            <p className="text-slate-400 text-xs font-mono uppercase tracking-wider mb-2">
              {llmScript ? '✨ LLM Generated Script' : 'Raw Risk Reason'}
            </p>
            
            <div className="bg-slate-700/50 border border-white/10 rounded-lg p-3 mb-4 min-h-[100px]">
              {isGenerating ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={24} className="text-cyan-400 animate-spin" />
                  <span className="text-slate-400 ml-2 text-sm">Generating with Groq LLM...</span>
                </div>
              ) : llmScript ? (
                <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{llmScript}</p>
              ) : (
                <p className="text-slate-400 text-sm leading-relaxed italic">
                  {selectedUser.llmWarning}
                  <br /><br />
                  <span className="text-cyan-400 text-xs">Click "Generate with AI" for personalized intervention script</span>
                </p>
              )}
            </div>

            {llmError && (
              <p className="text-red-400 text-xs mb-2">API Error: {llmError}</p>
            )}
          </div>
        </div>

        {/* Sticky Action Buttons */}
        <div className="p-4 border-t border-white/10 bg-slate-800/90 backdrop-blur">
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onWarn}
              className="flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg transition-colors"
            >
              <Send size={18} />
              Warn
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onBlock}
              className="flex items-center justify-center gap-2 py-3 bg-red-500 hover:bg-red-400 text-white font-semibold rounded-lg transition-colors"
            >
              <Ban size={18} />
              Block
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
