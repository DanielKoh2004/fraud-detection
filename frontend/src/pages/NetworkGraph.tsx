import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Network, Users, AlertTriangle, Target, Filter, ZoomIn, ZoomOut, 
  Maximize2, Info, RefreshCw
} from 'lucide-react';
import LeftSidebar from '../components/Layout/LeftSidebar';

interface NetworkNode {
  id: string;
  type: 'fraud' | 'student';
  label: string;
  targetCount?: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
}

interface NetworkStats {
  totalFraudNumbers: number;
  totalStudents: number;
  oneToManyHunters: number;
  maxTargets: number;
}

interface ApiNetworkResponse {
  nodes: Array<{
    id: string;
    type: 'fraud' | 'student';
    label: string;
    targetCount?: number;
  }>;
  edges: NetworkEdge[];
  stats: NetworkStats;
}

export default function NetworkGraph() {
  const [apiData, setApiData] = useState<ApiNetworkResponse | null>(null);
  const [loading, setLoading] = useState(true);
  // Removed risk filter - no longer needed
  const [minTargets, setMinTargets] = useState(1);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [edges, setEdges] = useState<NetworkEdge[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });

  // Fetch real network data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try relative URL first (works with nginx proxy in Docker), then fallback to localhost
        const urls = ['/api/network', 'http://localhost:8000/api/network'];
        let data: ApiNetworkResponse | null = null;
        
        for (const url of urls) {
          try {
            const response = await fetch(url);
            if (response.ok) {
              data = await response.json();
              break;
            }
          } catch {
            continue;
          }
        }
        
        if (data) {
          setApiData(data);
        }
      } catch (err) {
        console.error('Failed to fetch network data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width || 900, height: rect.height || 600 });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Process and filter data when API data or filters change
  useEffect(() => {
    if (!apiData) return;

    let filteredNodes = [...apiData.nodes];
    let filteredEdges = [...apiData.edges];

    // Filter by min targets
    if (minTargets > 1) {
      const validFrauds = new Set(
        filteredNodes
          .filter(n => n.type === 'fraud' && (n.targetCount || 0) >= minTargets)
          .map(n => n.id)
      );
      filteredEdges = filteredEdges.filter(e => validFrauds.has(e.source));
    }

    // Keep only connected nodes
    const connectedIds = new Set<string>();
    filteredEdges.forEach(e => {
      connectedIds.add(e.source);
      connectedIds.add(e.target);
    });
    filteredNodes = filteredNodes.filter(n => connectedIds.has(n.id));

    // Limit for performance
    if (filteredNodes.length > 150) {
      filteredNodes = filteredNodes.slice(0, 150);
      const validIds = new Set(filteredNodes.map(n => n.id));
      filteredEdges = filteredEdges.filter(e => validIds.has(e.source) && validIds.has(e.target));
    }

    // Initialize positions with radial layout (fraud in center, students around)
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    
    const fraudNodes = filteredNodes.filter(n => n.type === 'fraud');
    const studentNodes = filteredNodes.filter(n => n.type === 'student');
    
    const initializedNodes: NetworkNode[] = [];
    
    // Deterministic hash function to avoid Math.random() during render
    const hashString = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
      }
      return Math.abs(hash);
    };
    
    // Position fraud nodes in inner ring
    fraudNodes.forEach((node, i) => {
      const angle = (i / fraudNodes.length) * 2 * Math.PI;
      const offset = (hashString(node.id) % 50); // Deterministic 0-49
      const radius = 100 + offset;
      initializedNodes.push({
        ...node,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
      });
    });
    
    // Position student nodes in outer ring
    studentNodes.forEach((node, i) => {
      const angle = (i / studentNodes.length) * 2 * Math.PI;
      const offset = (hashString(node.id) % 100); // Deterministic 0-99
      const radius = 200 + offset;
      initializedNodes.push({
        ...node,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
      });
    });

    setNodes(initializedNodes);
    setEdges(filteredEdges);
  }, [apiData, minTargets, dimensions]);

  // Run force simulation
  useEffect(() => {
    if (nodes.length === 0) return;

    let iteration = 0;
    const maxIterations = 120;
    const nodesMap = new Map(nodes.map(n => [n.id, { ...n }]));

    const simulate = () => {
      if (iteration >= maxIterations) {
        setNodes(Array.from(nodesMap.values()));
        return;
      }

      const alpha = 0.3 * (1 - iteration / maxIterations);
      const nodesList = Array.from(nodesMap.values());

      // Repulsion between all nodes
      for (let i = 0; i < nodesList.length; i++) {
        for (let j = i + 1; j < nodesList.length; j++) {
          const a = nodesList[i];
          const b = nodesList[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const minDist = 40;
          
          if (dist < minDist * 3) {
            const force = (minDist * 3 - dist) * alpha * 0.5;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            a.vx -= fx;
            a.vy -= fy;
            b.vx += fx;
            b.vy += fy;
          }
        }
      }

      // Attraction along edges
      edges.forEach(edge => {
        const source = nodesMap.get(edge.source);
        const target = nodesMap.get(edge.target);
        if (!source || !target) return;

        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const idealDist = 80;
        const force = (dist - idealDist) * alpha * 0.1;

        source.vx += (dx / dist) * force;
        source.vy += (dy / dist) * force;
        target.vx -= (dx / dist) * force;
        target.vy -= (dy / dist) * force;
      });

      // Center gravity
      nodesList.forEach(node => {
        node.vx += (dimensions.width / 2 - node.x) * alpha * 0.01;
        node.vy += (dimensions.height / 2 - node.y) * alpha * 0.01;
      });

      // Apply velocities
      nodesList.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;
        node.vx *= 0.85;
        node.vy *= 0.85;

        // Keep in bounds
        node.x = Math.max(40, Math.min(dimensions.width - 40, node.x));
        node.y = Math.max(40, Math.min(dimensions.height - 40, node.y));
        
        nodesMap.set(node.id, node);
      });

      iteration++;

      // Update state periodically
      if (iteration % 15 === 0 || iteration === maxIterations) {
        setNodes(Array.from(nodesMap.values()));
      }

      animationRef.current = requestAnimationFrame(simulate);
    };

    simulate();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [nodes.length, edges, dimensions]);

  const getNodeColor = useCallback((node: NetworkNode) => {
    if (node.type === 'fraud') return '#ef4444'; // Red for fraud
    return '#22d3ee'; // Cyan for all students
  }, []);

  const stats = apiData?.stats || {
    totalFraudNumbers: 0,
    totalStudents: 0,
    oneToManyHunters: 0,
    maxTargets: 0,
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      <LeftSidebar />

      <main className="flex-1 ml-64 p-6 overflow-hidden">
        {/* Header */}
        <div className="mb-6">
          <motion.h1 
            className="text-3xl font-bold text-white flex items-center gap-3"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
              <Network className="text-white" size={28} />
            </div>
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Fraud Network Graph
            </span>
          </motion.h1>
          <p className="text-slate-400 mt-2 ml-14">
            Real fraud-student connections from data • Force-directed layout
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <motion.div 
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 text-red-400 text-sm mb-1">
              <AlertTriangle size={16} /> Fraud Numbers
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalFraudNumbers.toLocaleString()}</div>
          </motion.div>
          
          <motion.div 
            className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 text-blue-400 text-sm mb-1">
              <Users size={16} /> Targeted Students
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalStudents.toLocaleString()}</div>
          </motion.div>
          
          <motion.div 
            className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 text-amber-400 text-sm mb-1">
              <Target size={16} /> One-to-Many Hunters
            </div>
            <div className="text-2xl font-bold text-white">{stats.oneToManyHunters.toLocaleString()}</div>
            <div className="text-xs text-slate-500">3+ targets</div>
          </motion.div>
          
          <motion.div 
            className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 text-purple-400 text-sm mb-1">
              <Maximize2 size={16} /> Max Targets
            </div>
            <div className="text-2xl font-bold text-white">{stats.maxTargets}</div>
          </motion.div>
        </div>

        {/* Controls & Graph */}
        <div className="grid grid-cols-4 gap-6" style={{ height: 'calc(100vh - 280px)' }}>
          {/* Controls Panel */}
          <div className="space-y-4">
            <motion.div 
              className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Filter size={18} /> Filters
              </h3>
              
              <div className="space-y-4">
                
                <div>
                  <label className="text-slate-400 text-sm block mb-2">
                    Min Targets: <span className="text-cyan-400">{minTargets}</span>
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={minTargets}
                    onChange={(e) => setMinTargets(Number(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>
                
                <div>
                  <label className="text-slate-400 text-sm block mb-2">
                    Zoom: <span className="text-cyan-400">{(zoom * 100).toFixed(0)}%</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
                      className="p-2 bg-slate-700 rounded hover:bg-slate-600"
                    >
                      <ZoomOut size={16} className="text-white" />
                    </button>
                    <input
                      type="range"
                      min={50}
                      max={200}
                      value={zoom * 100}
                      onChange={(e) => setZoom(Number(e.target.value) / 100)}
                      className="flex-1 accent-cyan-400"
                    />
                    <button 
                      onClick={() => setZoom(z => Math.min(2, z + 0.1))}
                      className="p-2 bg-slate-700 rounded hover:bg-slate-600"
                    >
                      <ZoomIn size={16} className="text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Legend */}
            <motion.div 
              className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <Info size={18} /> Legend
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 transform rotate-45"></div>
                  <span className="text-slate-400">Fraud Number</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-cyan-400"></div>
                  <span className="text-slate-400">Student (Targeted)</span>
                </div>
              </div>
            </motion.div>

            {/* Selected Node Info */}
            {selectedNode && (
              <motion.div 
                className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl p-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <h3 className="text-cyan-400 font-bold mb-2">Selected Node</h3>
                <div className="space-y-1 text-sm">
                  <div className="text-white font-mono">{selectedNode.label}</div>
                  <div className="text-slate-400">Type: {selectedNode.type === 'fraud' ? 'Fraud Number' : 'Student'}</div>
                  {selectedNode.type === 'fraud' && selectedNode.targetCount && (
                    <div className="text-slate-400">Targets: {selectedNode.targetCount}</div>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          {/* Graph Canvas */}
          <div className="col-span-3">
            <motion.div 
              ref={containerRef}
              className="bg-slate-800/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden h-full relative"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <RefreshCw className="text-cyan-400 animate-spin" size={32} />
                </div>
              ) : nodes.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                  No fraud-student connections found in data
                </div>
              ) : (
                <svg 
                  width="100%" 
                  height="100%" 
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
                >
                  {/* Edges */}
                  {edges.map((edge, i) => {
                    const source = nodes.find(n => n.id === edge.source);
                    const target = nodes.find(n => n.id === edge.target);
                    if (!source || !target) return null;
                    return (
                      <line
                        key={i}
                        x1={source.x}
                        y1={source.y}
                        x2={target.x}
                        y2={target.y}
                        stroke="rgba(100, 116, 139, 0.4)"
                        strokeWidth={1}
                      />
                    );
                  })}
                  
                  {/* Nodes */}
                  {nodes.map(node => {
                    const color = getNodeColor(node);
                    const size = node.type === 'fraud' 
                      ? 10 + Math.min((node.targetCount || 1) * 2, 20)
                      : 8;
                    
                    return (
                      <g 
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        style={{ cursor: 'pointer' }}
                      >
                        {node.type === 'fraud' ? (
                          <rect
                            x={node.x - size/2}
                            y={node.y - size/2}
                            width={size}
                            height={size}
                            fill={color}
                            transform={`rotate(45 ${node.x} ${node.y})`}
                            stroke="white"
                            strokeWidth={selectedNode?.id === node.id ? 2 : 0}
                          />
                        ) : (
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r={size}
                            fill={color}
                            stroke="white"
                            strokeWidth={selectedNode?.id === node.id ? 2 : 0}
                          />
                        )}
                      </g>
                    );
                  })}
                </svg>
              )}
              
              {/* Status */}
              <div className="absolute bottom-4 left-4 bg-slate-900/80 px-3 py-1.5 rounded text-sm text-slate-400">
                Showing {nodes.filter(n => n.type === 'fraud').length} fraud → {nodes.filter(n => n.type === 'student').length} students
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
