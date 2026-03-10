import { useState, useEffect } from 'react';
import Papa from 'papaparse';

export interface StudentData {
  msisdn: string;
  risk_score: number;
  risk_tier: string;
  identity_score: number;
  exposure_score: number;
  behavior_score: number;
  fraud_contact_count: number;
  [key: string]: unknown;
}

export interface FraudData {
  msisdn: string;
  rule_id: string;
  rule_reason: string;
  fraud_score: number;
  tier: string;
  [key: string]: unknown;
}

export function useStudentData() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load from public folder
        const response = await fetch('/data/student_risk_predictions.csv');
        const text = await response.text();
        
        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          complete: (results) => {
            setStudents(results.data as StudentData[]);
            setLoading(false);
          },
          error: (error: Error) => {
            setError(error.message);
            setLoading(false);
          }
        });
      } catch (err) {
        setError('Failed to load student data');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { students, loading, error };
}

export function useBlacklistData() {
  const [blacklist, setBlacklist] = useState<FraudData[]>([]);
  const [greylist, setGreylist] = useState<FraudData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load blacklist
        const blacklistRes = await fetch('/data/blacklist.csv');
        const blacklistText = await blacklistRes.text();
        
        Papa.parse(blacklistText, {
          header: true,
          dynamicTyping: true,
          complete: (results) => {
            setBlacklist(results.data as FraudData[]);
          }
        });

        // Load greylist
        const greylistRes = await fetch('/data/greylist.csv');
        const greylistText = await greylistRes.text();
        
        Papa.parse(greylistText, {
          header: true,
          dynamicTyping: true,
          complete: (results) => {
            setGreylist(results.data as FraudData[]);
            setLoading(false);
          }
        });
      } catch (err) {
        setError('Failed to load fraud data');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { blacklist, greylist, loading, error };
}

export function useStats(students: StudentData[], blacklist: FraudData[], greylist: FraudData[]) {
  const totalStudents = students.length;
  const criticalCount = students.filter(s => s.risk_tier === 'CRITICAL').length;
  const vulnerableCount = students.filter(s => s.risk_tier === 'VULNERABLE').length;
  const safeCount = students.filter(s => s.risk_tier === 'SAFE').length;
  
  const blacklistCount = blacklist.length;
  const greylistCount = greylist.length;
  
  // Calculate protected value (estimated based on average loss per fraud case)
  const avgLossPerCase = 50000; // HKD
  const protectedValue = blacklistCount * avgLossPerCase;
  
  return {
    totalStudents,
    criticalCount,
    vulnerableCount,
    safeCount,
    blacklistCount,
    greylistCount,
    protectedValue: `HK$${(protectedValue / 1000000000).toFixed(2)}B`,
    activeThreats: criticalCount + blacklistCount,
    criticalNew: Math.floor(criticalCount * 0.03) // ~3% new
  };
}
