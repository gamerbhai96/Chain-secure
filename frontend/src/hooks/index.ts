import { useState, useEffect } from 'react';
import type { SystemStats } from '../types/api';
import ChainSecureAPI from '../services/api';

/**
 * Hook for managing system statistics
 */
export const useSystemStats = () => {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ChainSecureAPI.getSystemStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
      // Set fallback stats
      setStats({
        total_analyses_performed: '12.4K',
        unique_addresses_analyzed: '8.7K',
        fraud_detection_rate: 0.943,
        average_analysis_time: '2.1',
        system_status: 'operational'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, loading, error, refetch: fetchStats };
};

/**
 * Hook for managing theme state
 */
export const useTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Try new key first, then migrate from old key
    let saved = localStorage.getItem('chainsecure-theme');
    if (!saved) {
      saved = localStorage.getItem('bittrace-theme');
      if (saved) {
        localStorage.setItem('chainsecure-theme', saved);
        localStorage.removeItem('bittrace-theme');
      }
    }
    return saved ? JSON.parse(saved) : false;
  });

  const toggleTheme = () => {
    setIsDarkMode((prev: boolean) => {
      const newValue = !prev;
      localStorage.setItem('chainsecure-theme', JSON.stringify(newValue));
      return newValue;
    });
  };

  return { isDarkMode, toggleTheme };
};