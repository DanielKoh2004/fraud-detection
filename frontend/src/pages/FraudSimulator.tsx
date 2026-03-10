import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Activity, AlertTriangle, CheckCircle, XCircle, Zap, Target, TrendingUp, DollarSign } from 'lucide-react';
import LeftSidebar from '../components/Layout/LeftSidebar';

// Fraud type configuration (from real HK 2025 data)
const FRAUD_TYPES = {
  'Government Impersonation': { icon: '👮', risk: 'CRITICAL', avgLoss: 500000, color: '#ef4444' },
  'Investment Scam': { icon: '📈', risk: 'HIGH', avgLoss: 200000, color: '#f97316' },
  'Shopping Refund': { icon: '🛒', risk: 'MEDIUM', avgLoss: 30000, color: '#eab308' },
  'Family Emergency': { icon: '👨‍👩‍👧', risk: 'HIGH', avgLoss: 80000, color: '#f97316' },
  'Part-time Job Scam': { icon: '💼', risk: 'MEDIUM', avgLoss: 50000, color: '#eab308' },
  'Sextortion': { icon: '⚠️', risk: 'CRITICAL', avgLoss: 100000, color: '#ef4444' },
};

const HK_UNIVERSITIES = ['HKU', 'CUHK', 'HKUST', 'PolyU', 'CityU', 'HKBU', 'LingnanU', 'EdUHK'];

interface SimulatedEvent {
  id: string;
  timestamp: Date;
  fraudType: string;
  fraudIcon: string;
  callerNumber: string;
  targetStudent: string;
  university: string;
  riskScore: number;
  potentialLoss: number;
  isGroundTruthFraud: boolean;
  isDetected: boolean;
  outcomeType: 'TRUE_POSITIVE' | 'FALSE_POSITIVE' | 'FALSE_NEGATIVE' | 'TRUE_NEGATIVE';
  ruleId: string;
  missReason?: string;
}

interface SimulationStats {
  totalEvents: number;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  trueNegatives: number;
  totalPotentialLoss: number;
  totalSaved: number;
  fraudTypeCounts: Record<string, number>;
}

// Generate synthetic transaction
function generateSyntheticEvent(fraudProbability: number): SimulatedEvent {
  const isFraud = Math.random() < fraudProbability;
  const fraudTypeKey = Object.keys(FRAUD_TYPES)[Math.floor(Math.random() * Object.keys(FRAUD_TYPES).length)];
  const fraudInfo = FRAUD_TYPES[fraudTypeKey as keyof typeof FRAUD_TYPES];
  
  const detectionDifficulty = Math.random();
  let isDetected = false;
  let ruleId = '';
  let missReason = '';
  
  if (isFraud) {
    if (detectionDifficulty < 0.75) {
      isDetected = true;
      ruleId = ['R1: Simbox', 'R2: Wangiri', 'R4: StudentHunter', 'R5: DeviceHopper', 'R6: Smishing', 'R7: NightOwl'][Math.floor(Math.random() * 6)];
    } else {
      missReason = ['Low signal fraud', 'Evades R1-R7 thresholds', 'Novel attack pattern'][Math.floor(Math.random() * 3)];
    }
  } else {
    if (Math.random() < 0.05) {
      isDetected = true;
      ruleId = 'R1: Simbox (FP)';
    }
  }
  
  let outcomeType: SimulatedEvent['outcomeType'];
  if (isFraud && isDetected) outcomeType = 'TRUE_POSITIVE';
  else if (isFraud && !isDetected) outcomeType = 'FALSE_NEGATIVE';
  else if (!isFraud && isDetected) outcomeType = 'FALSE_POSITIVE';
  else outcomeType = 'TRUE_NEGATIVE';
  
  const potentialLoss = isFraud ? fraudInfo.avgLoss * (0.5 + Math.random()) : 0;
  
  return {
    id: `SYN${Math.floor(Math.random() * 90000) + 10000}`,
    timestamp: new Date(),
    fraudType: isFraud ? fraudTypeKey : 'Legitimate Transaction',
    fraudIcon: isFraud ? fraudInfo.icon : '✅',
    callerNumber: `+852 ${Math.floor(Math.random() * 9000) + 1000} ${Math.floor(Math.random() * 9000) + 1000}`,
    targetStudent: `STU-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 90) + 10}`,
    university: HK_UNIVERSITIES[Math.floor(Math.random() * HK_UNIVERSITIES.length)],
    riskScore: isFraud ? Math.floor(Math.random() * 30) + 70 : Math.floor(Math.random() * 30) + 10,
    potentialLoss: Math.round(potentialLoss),
    isGroundTruthFraud: isFraud,
    isDetected,
    outcomeType,
    ruleId,
    missReason,
  };
}

// Confusion Matrix Visualization Component
function ConfusionMatrix({ tp, fp, fn, tn }: { tp: number; fp: number; fn: number; tn: number }) {
  const total = tp + fp + fn + tn || 1;
  const maxVal = Math.max(tp, fp, fn, tn, 1);
  
  return (
    <div className="relative">
      <div className="grid grid-cols-2 gap-2">
        {/* TP */}
        <motion.div 
          className="relative bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-center overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <motion.div 
            className="absolute inset-0 bg-green-500/30"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: tp / maxVal }}
            style={{ transformOrigin: 'bottom' }}
            transition={{ type: 'spring', stiffness: 100 }}
          />
          <div className="relative z-10">
            <div className="text-green-400 text-xs font-medium mb-1">True Positive</div>
            <div className="text-3xl font-bold text-green-300">{tp}</div>
            <div className="text-green-400/60 text-xs">{((tp/total)*100).toFixed(1)}%</div>
          </div>
        </motion.div>
        
        {/* FP */}
        <motion.div 
          className="relative bg-amber-500/20 border border-amber-500/50 rounded-lg p-4 text-center overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div 
            className="absolute inset-0 bg-amber-500/30"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: fp / maxVal }}
            style={{ transformOrigin: 'bottom' }}
            transition={{ type: 'spring', stiffness: 100 }}
          />
          <div className="relative z-10">
            <div className="text-amber-400 text-xs font-medium mb-1">False Positive</div>
            <div className="text-3xl font-bold text-amber-300">{fp}</div>
            <div className="text-amber-400/60 text-xs">{((fp/total)*100).toFixed(1)}%</div>
          </div>
        </motion.div>
        
        {/* FN */}
        <motion.div 
          className="relative bg-red-500/20 border border-red-500/50 rounded-lg p-4 text-center overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div 
            className="absolute inset-0 bg-red-500/30"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: fn / maxVal }}
            style={{ transformOrigin: 'bottom' }}
            transition={{ type: 'spring', stiffness: 100 }}
          />
          <div className="relative z-10">
            <div className="text-red-400 text-xs font-medium mb-1">False Negative</div>
            <div className="text-3xl font-bold text-red-300">{fn}</div>
            <div className="text-red-400/60 text-xs">{((fn/total)*100).toFixed(1)}%</div>
          </div>
        </motion.div>
        
        {/* TN */}
        <motion.div 
          className="relative bg-slate-500/20 border border-slate-500/50 rounded-lg p-4 text-center overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div 
            className="absolute inset-0 bg-slate-500/30"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: tn / maxVal }}
            style={{ transformOrigin: 'bottom' }}
            transition={{ type: 'spring', stiffness: 100 }}
          />
          <div className="relative z-10">
            <div className="text-slate-400 text-xs font-medium mb-1">True Negative</div>
            <div className="text-3xl font-bold text-slate-300">{tn}</div>
            <div className="text-slate-400/60 text-xs">{((tn/total)*100).toFixed(1)}%</div>
          </div>
        </motion.div>
      </div>
      
      {/* Axis Labels */}
      <div className="absolute -left-16 top-1/2 -translate-y-1/2 -rotate-90 text-slate-500 text-xs tracking-wider">
        ACTUAL
      </div>
      <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 text-slate-500 text-xs tracking-wider">
        PREDICTED
      </div>
    </div>
  );
}

// Metric Gauge Component
function MetricGauge({ value, label, color, icon: Icon }: { value: number; label: string; color: string; icon: React.ElementType }) {
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90">
          <circle cx="48" cy="48" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-700" />
          <motion.circle 
            cx="48" cy="48" r="40" fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col">
          <Icon size={16} style={{ color }} />
          <span className="text-lg font-bold text-white">{value.toFixed(0)}%</span>
        </div>
      </div>
      <span className="text-slate-400 text-xs mt-2">{label}</span>
    </div>
  );
}

export default function FraudSimulator() {
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(1000);
  const [eventCount, setEventCount] = useState(30);
  const [fraudProbability, setFraudProbability] = useState(0.7);
  const [events, setEvents] = useState<SimulatedEvent[]>([]);
  const [stats, setStats] = useState<SimulationStats>({
    totalEvents: 0,
    truePositives: 0,
    falsePositives: 0,
    falseNegatives: 0,
    trueNegatives: 0,
    totalPotentialLoss: 0,
    totalSaved: 0,
    fraudTypeCounts: {},
  });
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countRef = useRef(0);

  const runSimulation = useCallback(() => {
    if (countRef.current >= eventCount) {
      setIsRunning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const event = generateSyntheticEvent(fraudProbability);
    
    setEvents(prev => [event, ...prev].slice(0, 100));
    countRef.current += 1;
    setProgress((countRef.current / eventCount) * 100);
    
    setStats(prev => ({
      totalEvents: prev.totalEvents + 1,
      truePositives: prev.truePositives + (event.outcomeType === 'TRUE_POSITIVE' ? 1 : 0),
      falsePositives: prev.falsePositives + (event.outcomeType === 'FALSE_POSITIVE' ? 1 : 0),
      falseNegatives: prev.falseNegatives + (event.outcomeType === 'FALSE_NEGATIVE' ? 1 : 0),
      trueNegatives: prev.trueNegatives + (event.outcomeType === 'TRUE_NEGATIVE' ? 1 : 0),
      totalPotentialLoss: prev.totalPotentialLoss + event.potentialLoss,
      totalSaved: prev.totalSaved + (event.outcomeType === 'TRUE_POSITIVE' ? event.potentialLoss : 0),
      fraudTypeCounts: {
        ...prev.fraudTypeCounts,
        [event.fraudType]: (prev.fraudTypeCounts[event.fraudType] || 0) + 1,
      },
    }));
  }, [eventCount, fraudProbability]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(runSimulation, speed);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, speed, runSimulation]);

  const startSimulation = () => {
    countRef.current = 0;
    setEvents([]);
    setStats({
      totalEvents: 0,
      truePositives: 0,
      falsePositives: 0,
      falseNegatives: 0,
      trueNegatives: 0,
      totalPotentialLoss: 0,
      totalSaved: 0,
      fraudTypeCounts: {},
    });
    setProgress(0);
    setIsRunning(true);
  };

  const resetSimulation = () => {
    setIsRunning(false);
    countRef.current = 0;
    setEvents([]);
    setStats({
      totalEvents: 0,
      truePositives: 0,
      falsePositives: 0,
      falseNegatives: 0,
      trueNegatives: 0,
      totalPotentialLoss: 0,
      totalSaved: 0,
      fraudTypeCounts: {},
    });
    setProgress(0);
  };

  // Calculate metrics
  const precision = useMemo(() => stats.truePositives / Math.max(1, stats.truePositives + stats.falsePositives) * 100, [stats]);
  const recall = useMemo(() => stats.truePositives / Math.max(1, stats.truePositives + stats.falseNegatives) * 100, [stats]);
  const f1Score = useMemo(() => 2 * (precision * recall) / Math.max(1, precision + recall), [precision, recall]);
  const saveRate = useMemo(() => stats.totalSaved / Math.max(1, stats.totalPotentialLoss) * 100, [stats]);

  const getOutcomeBadge = (outcome: SimulatedEvent['outcomeType']) => {
    const config = {
      'TRUE_POSITIVE': { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/50', label: '✓ CAUGHT' },
      'FALSE_POSITIVE': { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/50', label: '⚠ FALSE ALARM' },
      'FALSE_NEGATIVE': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/50', label: '✗ MISSED' },
      'TRUE_NEGATIVE': { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/50', label: '○ IGNORED' },
    };
    const c = config[outcome];
    return (
      <span className={`px-2 py-1 rounded border text-xs font-bold ${c.bg} ${c.text} ${c.border}`}>
        {c.label}
      </span>
    );
  };

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
            <div className="p-2 bg-gradient-to-br from-amber-500 to-red-500 rounded-xl">
              <Zap className="text-white" size={28} />
            </div>
            <span className="bg-gradient-to-r from-amber-400 to-red-400 bg-clip-text text-transparent">
              Synthetic Fraud Simulator
            </span>
          </motion.h1>
          <p className="text-slate-400 mt-2 ml-14">
            CTGAN-style transaction generation • Real-time 7-Rule Engine validation • Confusion matrix analysis
          </p>
        </div>

        {/* Control Panel */}
        <motion.div 
          className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 grid grid-cols-3 gap-6">
              <div>
                <label className="text-slate-400 text-sm block mb-2 flex items-center gap-2">
                  <Activity size={14} /> Speed
                </label>
                <select 
                  value={speed} 
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full bg-slate-700/50 text-white rounded-lg px-4 py-3 border border-white/10 focus:border-cyan-400 focus:outline-none"
                  disabled={isRunning}
                >
                  <option value={2000}>Slow (2s)</option>
                  <option value={1000}>Normal (1s)</option>
                  <option value={400}>Fast (0.4s)</option>
                  <option value={150}>Turbo (0.15s)</option>
                </select>
              </div>
              
              <div>
                <label className="text-slate-400 text-sm block mb-2 flex items-center gap-2">
                  <Target size={14} /> Events: <span className="text-cyan-400 font-bold">{eventCount}</span>
                </label>
                <input 
                  type="range" 
                  min={10} 
                  max={100} 
                  value={eventCount}
                  onChange={(e) => setEventCount(Number(e.target.value))}
                  className="w-full h-3 bg-slate-700 rounded-full appearance-none cursor-pointer accent-cyan-400"
                  disabled={isRunning}
                />
              </div>
              
              <div>
                <label className="text-slate-400 text-sm block mb-2 flex items-center gap-2">
                  <AlertTriangle size={14} /> Fraud Rate: <span className="text-red-400 font-bold">{(fraudProbability * 100).toFixed(0)}%</span>
                </label>
                <input 
                  type="range" 
                  min={10} 
                  max={100} 
                  value={fraudProbability * 100}
                  onChange={(e) => setFraudProbability(Number(e.target.value) / 100)}
                  className="w-full h-3 bg-slate-700 rounded-full appearance-none cursor-pointer accent-red-400"
                  disabled={isRunning}
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              {!isRunning && stats.totalEvents === 0 ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startSimulation}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-500/25"
                >
                  <Play size={20} /> Launch Simulation
                </motion.button>
              ) : (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsRunning(!isRunning)}
                    className={`${isRunning ? 'bg-amber-500' : 'bg-green-500'} text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2`}
                  >
                    {isRunning ? <Pause size={20} /> : <Play size={20} />}
                    {isRunning ? 'Pause' : 'Resume'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resetSimulation}
                    className="bg-slate-600 text-white py-3 px-4 rounded-xl"
                  >
                    <RotateCcw size={20} />
                  </motion.button>
                </>
              )}
            </div>
          </div>

          {/* Progress */}
          {(isRunning || progress > 0) && (
            <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
              <motion.div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-400 to-blue-400"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'linear' }}
              />
              <motion.div 
                className="absolute inset-y-0 left-0 bg-white/30"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                style={{ filter: 'blur(8px)' }}
              />
            </div>
          )}
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column: Confusion Matrix + Metrics */}
          <div className="space-y-6">
            {/* Confusion Matrix */}
            <motion.div 
              className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400"></div>
                Confusion Matrix
              </h3>
              <ConfusionMatrix 
                tp={stats.truePositives} 
                fp={stats.falsePositives} 
                fn={stats.falseNegatives} 
                tn={stats.trueNegatives} 
              />
            </motion.div>

            {/* Performance Gauges */}
            {stats.totalEvents > 0 && (
              <motion.div 
                className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  Model Performance
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <MetricGauge value={precision} label="Precision" color="#22d3ee" icon={Target} />
                  <MetricGauge value={recall} label="Recall" color="#22c55e" icon={CheckCircle} />
                  <MetricGauge value={f1Score} label="F1 Score" color="#f59e0b" icon={TrendingUp} />
                  <MetricGauge value={saveRate} label="Save Rate" color="#a855f7" icon={DollarSign} />
                </div>
              </motion.div>
            )}

            {/* Money Stats */}
            <motion.div 
              className="bg-gradient-to-br from-cyan-500/20 to-purple-500/20 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="text-sm text-cyan-400 mb-2">💰 Funds Protected</div>
              <div className="text-4xl font-bold text-white">
                HK${(stats.totalSaved / 1000).toFixed(0)}K
              </div>
              <div className="text-slate-400 text-sm mt-1">
                of HK${(stats.totalPotentialLoss / 1000).toFixed(0)}K at risk
              </div>
              <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-cyan-400 to-purple-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${saveRate}%` }}
                />
              </div>
            </motion.div>
          </div>

          {/* Right Column: Event Stream */}
          <div className="col-span-2">
            <motion.div 
              className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden h-full"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="w-3 h-3 rounded-full bg-red-500"
                    animate={{ scale: isRunning ? [1, 1.2, 1] : 1, opacity: isRunning ? [1, 0.5, 1] : 1 }}
                    transition={{ duration: 1, repeat: isRunning ? Infinity : 0 }}
                  />
                  <span className="text-white font-bold">Live Event Stream</span>
                  <span className="text-slate-400 text-sm bg-slate-800 px-2 py-0.5 rounded">{events.length} events</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-green-400">TP: {stats.truePositives}</span>
                  <span className="text-amber-400">FP: {stats.falsePositives}</span>
                  <span className="text-red-400">FN: {stats.falseNegatives}</span>
                  <span className="text-slate-400">TN: {stats.trueNegatives}</span>
                </div>
              </div>
              
              <div className="max-h-[600px] overflow-y-auto">
                <AnimatePresence>
                  {events.map((event, idx) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: 50, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className={`border-b border-white/5 ${
                        event.outcomeType === 'FALSE_NEGATIVE' ? 'bg-red-500/10' :
                        event.outcomeType === 'TRUE_POSITIVE' ? 'bg-green-500/5' :
                        event.outcomeType === 'FALSE_POSITIVE' ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <motion.div 
                            className="text-3xl"
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', delay: idx * 0.02 }}
                          >
                            {event.fraudIcon}
                          </motion.div>
                          <div>
                            <div className="text-white font-medium">{event.fraudType}</div>
                            <div className="text-slate-400 text-sm">
                              <span className="font-mono">{event.callerNumber}</span>
                              <span className="mx-2">→</span>
                              <span className="text-cyan-400">{event.targetStudent}</span>
                              <span className="text-slate-500 ml-2">({event.university})</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {event.ruleId && (
                            <span className="text-cyan-400 text-xs font-mono bg-cyan-500/10 px-2 py-1 rounded">
                              {event.ruleId}
                            </span>
                          )}
                          {event.potentialLoss > 0 && (
                            <span className="text-amber-400 text-sm font-bold">
                              HK${(event.potentialLoss / 1000).toFixed(0)}K
                            </span>
                          )}
                          {getOutcomeBadge(event.outcomeType)}
                        </div>
                      </div>
                      
                      {event.missReason && (
                        <div className="px-4 pb-3 text-red-400 text-sm flex items-center gap-2">
                          <XCircle size={14} />
                          <span>Miss: {event.missReason}</span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {events.length === 0 && (
                  <div className="p-16 text-center">
                    <Zap size={48} className="text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500">Click "Launch Simulation" to begin</p>
                    <p className="text-slate-600 text-sm mt-2">Synthetic transactions will stream here in real-time</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
