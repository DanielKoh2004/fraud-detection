/**
 * Hook for calling the Groq LLM API to generate intervention scripts
 */
import { useState, useCallback } from 'react';

const API_BASE = '';

interface StudentProfile {
  risk_tier: string;
  risk_score: number;
  age?: number;
  identity_score?: number;
  exposure_score?: number;
  behavior_score?: number;
  risk_reason?: string;
  mainland_cnt?: number;
  mainland_to_hk_cnt?: number;
  total_msg_cnt?: number;
  total_voice_cnt?: number;
  app_max_cnt?: number;
  fraud_msisdn_present?: boolean;
}

interface InterventionResponse {
  script: string;
  success: boolean;
  error?: string;
}

export function useGroqIntervention() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [script, setScript] = useState<string | null>(null);

  const generateScript = useCallback(async (profile: StudentProfile): Promise<string> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/intervention`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data: InterventionResponse = await response.json();
      
      if (data.success) {
        setScript(data.script);
        return data.script;
      } else {
        const errorMsg = data.error || 'Failed to generate script';
        setError(errorMsg);
        return data.script; // Return the error message from API
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error';
      setError(errorMsg);
      // Return fallback message when API is unavailable
      return `⚠️ LLM API unavailable. Start the backend with: cd frontend/api && python main.py\n\nFallback: ${profile.risk_reason || 'This student requires attention based on their risk profile.'}`;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setScript(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    generateScript,
    script,
    loading,
    error,
    reset,
  };
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/`);
    const data = await response.json();
    return data.status === 'ok' && data.groq_available;
  } catch {
    return false;
  }
}
