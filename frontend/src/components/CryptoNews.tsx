import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Chip, Button, Skeleton, IconButton } from '@mui/material';
import {
  TrendingUp as BullishIcon,
  TrendingDown as BearishIcon,
  Remove as NeutralIcon,
  OpenInNew as OpenIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import type { NewsItem } from '../types/api';
import { ChainSecureAPI } from '../services/api';

interface CryptoNewsProps {
  isDarkMode: boolean;
}

const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const sentimentConfig = {
  bullish: { icon: <BullishIcon sx={{ fontSize: 16 }} />, color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Bullish' },
  bearish: { icon: <BearishIcon sx={{ fontSize: 16 }} />, color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'Bearish' },
  neutral: { icon: <NeutralIcon sx={{ fontSize: 16 }} />, color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', label: 'Neutral' },
};

export const CryptoNews: React.FC<CryptoNewsProps> = ({ isDarkMode }) => {
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bullish' | 'bearish'>('all');
  const [visibleCount, setVisibleCount] = useState(6);

  const fetchNews = useCallback(async () => {
    try {
      const data = await ChainSecureAPI.getCryptoNews();
      if (data.articles) setArticles(data.articles);
    } catch (err) {
      console.error('Failed to fetch news:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 300000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  const filteredArticles = articles.filter((a) => filter === 'all' || a.sentiment === filter);

  if (loading) {
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" sx={{ letterSpacing: '0.25em', color: 'text.secondary', fontWeight: 600, mb: 2, display: 'block' }}>Crypto News</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 2 }}>
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rounded" height={140} sx={{ borderRadius: '16px' }} />)}
        </Box>
      </Box>
    );
  }

  if (!articles.length) return null;

  return (
    <Box sx={{ mb: 5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
        <Typography variant="overline" sx={{ letterSpacing: '0.25em', color: 'text.secondary', fontWeight: 600 }}>Latest Crypto News</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {(['all', 'bullish', 'bearish'] as const).map((f) => (
            <Chip key={f} label={f.charAt(0).toUpperCase() + f.slice(1)} size="small"
              onClick={() => { setFilter(f); setVisibleCount(6); }}
              sx={{
                fontWeight: 600, fontSize: '0.75rem', textTransform: 'capitalize', borderRadius: '8px',
                background: filter === f
                  ? f === 'bullish' ? 'rgba(16,185,129,0.2)' : f === 'bearish' ? 'rgba(239,68,68,0.2)' : isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'
                  : 'transparent',
                border: filter === f
                  ? `1px solid ${f === 'bullish' ? '#10b981' : f === 'bearish' ? '#ef4444' : isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}`
                  : isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                color: filter === f
                  ? f === 'bullish' ? '#10b981' : f === 'bearish' ? '#ef4444' : 'text.primary'
                  : 'text.secondary',
                '&:hover': { background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
              }}
            />
          ))}
          <IconButton size="small" onClick={() => { setLoading(true); fetchNews(); }} sx={{ color: 'text.secondary', ml: 0.5 }}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2 }}>
        {filteredArticles.slice(0, visibleCount).map((article) => {
          const sent = sentimentConfig[article.sentiment];
          return (
            <Paper key={article.id} component="a" href={article.url} target="_blank" rel="noopener noreferrer"
              sx={{
                p: 2.5, borderRadius: '16px',
                background: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)',
                border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', gap: 1.5,
                transition: 'all 0.25s ease', cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  borderColor: isDarkMode ? 'rgba(96,165,250,0.3)' : 'rgba(37,99,235,0.2)',
                  boxShadow: isDarkMode ? '0 8px 24px rgba(0,0,0,0.3)' : '0 8px 24px rgba(0,0,0,0.08)',
                },
              }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Chip icon={sent.icon} label={sent.label} size="small" sx={{
                  background: sent.bg, color: sent.color, fontWeight: 600, fontSize: '0.7rem',
                  border: `1px solid ${sent.color}30`, '& .MuiChip-icon': { color: sent.color },
                }} />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>{timeAgo(article.published_at)}</Typography>
              </Box>
              <Typography variant="body2" sx={{
                fontWeight: 600, lineHeight: 1.5,
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: '0.9rem',
              }}>
                {article.title}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.72rem' }}>{article.source}</Typography>
                  <OpenIcon sx={{ fontSize: 12, color: 'text.secondary', opacity: 0.5 }} />
                </Box>
                {article.currencies.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {article.currencies.slice(0, 3).map((c) => (
                      <Chip key={c.code} label={c.code} size="small" sx={{
                        height: 20, fontSize: '0.65rem', fontWeight: 700, borderRadius: '6px',
                        background: isDarkMode ? 'rgba(96,165,250,0.12)' : 'rgba(37,99,235,0.08)',
                        color: isDarkMode ? '#60a5fa' : '#2563eb', border: 'none',
                      }} />
                    ))}
                  </Box>
                )}
              </Box>
            </Paper>
          );
        })}
      </Box>

      {filteredArticles.length > visibleCount && (
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button onClick={() => setVisibleCount((c) => c + 6)} sx={{
            textTransform: 'none', fontWeight: 600, borderRadius: '12px', px: 4, color: '#60a5fa',
            border: '1px solid rgba(96,165,250,0.3)', '&:hover': { background: 'rgba(96,165,250,0.08)', borderColor: '#60a5fa' },
          }}>
            Show More News
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default CryptoNews;
