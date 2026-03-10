import { Shield, LayoutDashboard, Users, Zap, Settings, Bell, CheckCircle, Network, FileSearch } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  active?: boolean;
}

const NavItem = ({ icon, label, to, active }: NavItemProps) => (
  <Link to={to}>
    <motion.div
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all rounded-lg ${
        active 
          ? 'bg-cyan-500/10 border-l-2 border-cyan-400 text-cyan-400' 
          : 'text-slate-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </motion.div>
  </Link>
);

interface LeftSidebarProps {
  activePage?: string;
  onNavigate?: (page: string) => void;
  stats?: {
    protectedValue: string;
    activeThreats: number;
    criticalNew: number;
  };
}

export default function LeftSidebar({ stats }: LeftSidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const defaultStats = {
    protectedValue: 'HK$0.61B',
    activeThreats: 493,
    criticalNew: 15,
  };
  
  const displayStats = stats || defaultStats;
  
  return (
    <div className="w-64 h-screen bg-slate-800/50 backdrop-blur-xl border-r border-white/10 flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">WUTONG DEFENSE</h1>
            <p className="text-slate-400 text-xs">SOC Console v2.4</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        <NavItem 
          icon={<LayoutDashboard size={20} />} 
          label="Dashboard" 
          to="/dashboard"
          active={currentPath === '/dashboard' || currentPath === '/'}
        />
        <NavItem 
          icon={<Zap size={20} />} 
          label="Fraud Simulator" 
          to="/fraud-simulator"
          active={currentPath === '/fraud-simulator'}
        />
        <NavItem 
          icon={<CheckCircle size={20} />} 
          label="Whitelist Review" 
          to="/whitelist-review"
          active={currentPath === '/whitelist-review'}
        />
        <NavItem 
          icon={<Network size={20} />} 
          label="Network Graph" 
          to="/network-graph"
          active={currentPath === '/network-graph'}
        />
        <NavItem 
          icon={<FileSearch size={20} />} 
          label="Fraud Intel" 
          to="/fraud-intel"
          active={currentPath === '/fraud-intel'}
        />
        <NavItem 
          icon={<Settings size={20} />} 
          label="Ethical AI" 
          to="/ethical-ai"
          active={currentPath === '/ethical-ai'}
        />
      </nav>

      {/* Global Stats */}
      <div className="p-4 space-y-3">
        {/* Protected Value */}
        <div className="glass-card p-3">
          <p className="text-slate-400 text-xs font-mono uppercase tracking-wider">Protected Value</p>
          <p className="text-2xl font-bold text-white mt-1">{displayStats.protectedValue}</p>
          <p className="text-safe text-xs flex items-center gap-1 mt-1">
            <span>↗</span> +12% this week
          </p>
        </div>

        {/* Active Threats */}
        <div className="glass-card p-3">
          <p className="text-slate-400 text-xs font-mono uppercase tracking-wider">Active Threats</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-bold text-white">{displayStats.activeThreats}</p>
            <motion.div 
              className="w-2 h-2 rounded-full bg-critical"
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
          <p className="text-critical text-xs mt-1">+{displayStats.criticalNew} critical new</p>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center">
            <Users size={16} className="text-slate-300" />
          </div>
          <div className="flex-1">
            <p className="text-white text-sm font-medium">Operator 42</p>
            <p className="text-slate-400 text-xs">Level 3 Clearance</p>
          </div>
          <Bell size={18} className="text-slate-400 cursor-pointer hover:text-white" />
        </div>
      </div>
    </div>
  );
}
