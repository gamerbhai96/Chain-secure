import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, Paper, Chip, Skeleton } from '@mui/material';
import { TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon } from '@mui/icons-material';
import type { CryptoPrice } from '../types/api';
import { ChainSecureAPI } from '../services/api';

interface CryptoPricesProps {
  isDarkMode: boolean;
}

const formatPrice = (price: number | null | undefined): string => {
  if (price == null) return 'N/A';
  if (price >= 1000) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(6)}`;
};

const formatVolume = (v: number | null | undefined): string => {
  if (v == null) return 'N/A';
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  return `$${v.toLocaleString()}`;
};

export const CryptoPrices: React.FC<CryptoPricesProps> = ({ isDarkMode }) => {
  const [coins, setCoins] = useState<CryptoPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [prevPrices, setPrevPrices] = useState<Record<string, number>>({});
  const [flashingCoins, setFlashingCoins] = useState<Record<string, 'up' | 'down'>>({});
  const [selectedCoin, setSelectedCoin] = useState<CryptoPrice | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchPrices = useCallback(async () => {
    try {
      const data = await ChainSecureAPI.getCryptoPrices();
      if (data.coins?.length) {
        const flashes: Record<string, 'up' | 'down'> = {};
        data.coins.forEach((c) => {
          const prev = prevPrices[c.id];
          if (prev !== undefined && prev !== c.current_price)
            flashes[c.id] = c.current_price > prev ? 'up' : 'down';
        });
        if (Object.keys(flashes).length) {
          setFlashingCoins(flashes);
          setTimeout(() => setFlashingCoins({}), 1200);
        }
        setPrevPrices(data.coins.reduce((acc, c) => ({ ...acc, [c.id]: c.current_price }), {} as Record<string, number>));
        setCoins(data.coins);
      }
    } catch (err) {
      console.error('Failed to fetch crypto prices:', err);
    } finally {
      setLoading(false);
    }
  }, [prevPrices]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" sx={{ letterSpacing: '0.25em', color: 'text.secondary', fontWeight: 600, mb: 2, display: 'block' }}>
          Live Market Prices
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'hidden' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" width={160} height={100} sx={{ borderRadius: '16px', flexShrink: 0 }} />
          ))}
        </Box>
      </Box>
    );
  }

  if (!coins.length) return null;

  return (
    <Box sx={{ mb: 5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="overline" sx={{ letterSpacing: '0.25em', color: 'text.secondary', fontWeight: 600 }}>
          Live Market Prices
        </Typography>
        <Chip label="LIVE" size="small" sx={{
          background: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 700, fontSize: '0.7rem',
          letterSpacing: '0.1em', border: '1px solid rgba(16,185,129,0.3)',
          animation: 'livePulse 2s ease-in-out infinite',
          '@keyframes livePulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.6 } },
        }} />
      </Box>

      <Box ref={scrollRef} sx={{
        display: 'flex', gap: 2, overflowX: 'auto', pb: 1, scrollSnapType: 'x mandatory',
        '&::-webkit-scrollbar': { height: 6 },
        '&::-webkit-scrollbar-track': { background: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', borderRadius: 3 },
        '&::-webkit-scrollbar-thumb': { background: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)', borderRadius: 3 },
      }}>
        {coins.map((coin) => {
          const isUp = coin.price_change_percentage_24h >= 0;
          const flash = flashingCoins[coin.id];
          const isSelected = selectedCoin?.id === coin.id;
          return (
            <Paper key={coin.id} onClick={() => setSelectedCoin(isSelected ? null : coin)} sx={{
              minWidth: 160, p: 2, flexShrink: 0, scrollSnapAlign: 'start', cursor: 'pointer', borderRadius: '16px',
              background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(10px)',
              border: isDarkMode
                ? `1px solid ${isSelected ? coin.color + '60' : 'rgba(255,255,255,0.08)'}`
                : `1px solid ${isSelected ? coin.color + '40' : 'rgba(0,0,0,0.08)'}`,
              transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden',
              '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 8px 24px ${coin.color}18`, borderColor: coin.color + '40' },
              ...(flash && {
                animation: 'priceFlash 0.6s ease',
                '@keyframes priceFlash': {
                  '0%': { boxShadow: `0 0 0 0 ${flash === 'up' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}` },
                  '50%': { boxShadow: `0 0 20px 4px ${flash === 'up' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` },
                  '100%': { boxShadow: 'none' },
                },
              }),
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                {coin.image ? (
                  <Box component="img" src={coin.image} alt={coin.name} sx={{ width: 24, height: 24, borderRadius: '50%' }} />
                ) : (
                  <Box sx={{ width: 24, height: 24, borderRadius: '50%', background: coin.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#fff', fontWeight: 700 }}>
                    {coin.symbol.slice(0, 2)}
                  </Box>
                )}
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.85rem' }}>{coin.symbol}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', ml: 'auto' }}>#{coin.market_cap_rank}</Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem', fontFamily: '"Inter", monospace', color: 'text.primary', mb: 0.5 }}>
                {formatPrice(coin.current_price)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {isUp ? <TrendingUpIcon sx={{ fontSize: 16, color: '#10b981' }} /> : <TrendingDownIcon sx={{ fontSize: 16, color: '#ef4444' }} />}
                <Typography variant="caption" sx={{ fontWeight: 700, color: isUp ? '#10b981' : '#ef4444', fontSize: '0.8rem' }}>
                  {isUp ? '+' : ''}{coin.price_change_percentage_24h?.toFixed(2)}%
                </Typography>
              </Box>
            </Paper>
          );
        })}
      </Box>

      {selectedCoin && (
        <Paper sx={{
          mt: 2, p: 2, borderRadius: '14px',
          background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.9)',
          border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
          display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedCoin.image && <Box component="img" src={selectedCoin.image} alt="" sx={{ width: 28, height: 28, borderRadius: '50%' }} />}
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{selectedCoin.name}</Typography>
          </Box>
          {[
            { label: '24h High', value: formatPrice(selectedCoin.high_24h) },
            { label: '24h Low', value: formatPrice(selectedCoin.low_24h) },
            { label: 'Volume', value: formatVolume(selectedCoin.total_volume) },
            { label: 'Market Cap', value: formatVolume(selectedCoin.market_cap) },
          ].map((item) => (
            <Box key={item.label}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>{item.label}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: '"Inter", monospace' }}>{item.value}</Typography>
            </Box>
          ))}
        </Paper>
      )}
    </Box>
  );
};

export default CryptoPrices;
