import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Paper, Chip, Container, Skeleton, IconButton } from '@mui/material';
import {
  TrendingUp as BullishIcon,
  TrendingDown as BearishIcon,
  Remove as NeutralIcon,
  OpenInNew as OpenIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import type { NewsItem } from '../types/api';
import { ChainSecureAPI } from '../services/api';

interface NewsPageProps {
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

export const News: React.FC<NewsPageProps> = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'bullish' | 'bearish'>('all');

  const fetchNews = useCallback(async () => {
    setLoading(true);
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
    window.scrollTo(0, 0);
  }, [fetchNews]);

  const filteredArticles = articles.filter((a) => filter === 'all' || a.sentiment === filter);

  return (
    <Container maxWidth="xl" sx={{ pt: 12, pb: 8 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ color: 'text.secondary', background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: '"Inter", sans-serif' }}>
          Latest Intelligence
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600 }}>
          Real-time cryptocurrency news and sentiment analysis to help you stay ahead of market movements and potential risks.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {(['all', 'bullish', 'bearish'] as const).map((f) => (
            <Chip key={f} label={f.charAt(0).toUpperCase() + f.slice(1)} 
              onClick={() => setFilter(f)}
              sx={{
                fontWeight: 600, fontSize: '0.85rem', textTransform: 'capitalize', borderRadius: '8px', px: 1, py: 2,
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
          <IconButton onClick={() => fetchNews()} sx={{ color: 'text.secondary', ml: 1, background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
          {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} variant="rounded" height={200} sx={{ borderRadius: '16px' }} />)}
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
          {filteredArticles.map((article) => {
            const sent = sentimentConfig[article.sentiment];
            return (
              <Paper key={article.id} component="a" href={article.url} target="_blank" rel="noopener noreferrer"
                sx={{
                  p: 3, borderRadius: '16px',
                  background: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.9)',
                  border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                  textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', gap: 2,
                  transition: 'all 0.25s ease', cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: isDarkMode ? 'rgba(96,165,250,0.3)' : 'rgba(37,99,235,0.2)',
                    boxShadow: isDarkMode ? '0 12px 24px rgba(0,0,0,0.4)' : '0 12px 24px rgba(0,0,0,0.1)',
                  },
                }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip icon={sent.icon} label={sent.label} size="small" sx={{
                    background: sent.bg, color: sent.color, fontWeight: 700, fontSize: '0.75rem',
                    border: `1px solid ${sent.color}30`, '& .MuiChip-icon': { color: sent.color },
                  }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{timeAgo(article.published_at)}</Typography>
                </Box>
                <Typography variant="h6" sx={{
                  fontWeight: 700, lineHeight: 1.4,
                  display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: '1.05rem',
                }}>
                  {article.title}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto', pt: 2, borderTop: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.8rem' }}>{article.source}</Typography>
                    <OpenIcon sx={{ fontSize: 14, color: 'text.secondary', opacity: 0.5 }} />
                  </Box>
                  {article.currencies.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {article.currencies.slice(0, 2).map((c) => (
                        <Chip key={c.code} label={c.code} size="small" sx={{
                          height: 22, fontSize: '0.7rem', fontWeight: 800, borderRadius: '6px',
                          background: isDarkMode ? 'rgba(96,165,250,0.15)' : 'rgba(37,99,235,0.1)',
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
      )}
    </Container>
  );
};

export default News;
