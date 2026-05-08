import React, { useState } from 'react';
import { Box, Typography, Chip, TextField, InputAdornment, IconButton, Button, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import {
  ContentPasteOutlined as PasteIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ChainSecureAPI from '../services/api';
import type { AnalysisResponse } from '../types/api';
import { CryptoPrices } from '../components/CryptoPrices';
import { CryptoNews } from '../components/CryptoNews';

interface HomeProps {
  isDarkMode: boolean;
}

const FeatureCard = styled(Box)<{ theme?: Theme }>(({ theme }) => ({
  padding: theme?.spacing(3) || 24,
  borderRadius: typeof theme?.shape?.borderRadius === 'number' ? theme.shape.borderRadius * 1.5 : 8,
  background: theme?.palette?.background?.paper,
  border: '1px solid ' + theme?.palette?.divider,
  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  '&:hover': {
    boxShadow: theme?.shadows?.[2],
    borderColor: theme?.palette?.text?.secondary,
  },
}));

export const Home: React.FC<HomeProps> = ({ isDarkMode }) => {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    if (!address) return;
    try {
      setLoading(true);
      setError(null);
      const result = await ChainSecureAPI.analyzeAddress(address);
      
      const saved = localStorage.getItem('chainsecure_scans');
      let history = saved ? JSON.parse(saved) : [];
      history = [result, ...history.filter((i: AnalysisResponse) => i.address !== result.address)].slice(0, 10);
      localStorage.setItem('chainsecure_scans', JSON.stringify(history));

      navigate(`/report/${address}`, { state: { analysis: result } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const testAddresses = [
    { label: 'Satoshi Genesis', addr: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' },
    { label: 'Exchange Hot', addr: '34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo' },
    { label: 'SegWit', addr: 'bc1qm34lsc65zpw79lxes69zkqmk6ee3ewf0j77s3h' },
  ];

  return (
    <Box sx={{
      maxWidth: 1000,
      margin: '0 auto',
      pt: { xs: 12, md: 20 },
      pb: 8,
      px: 4,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
    }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center', gap: 1 }}>
        <Chip
          label="⚡ AI-Powered Analysis"
          size="small"
          sx={{
            background: (theme: Theme) => theme.palette.mode === 'dark' 
              ? theme.palette.primary.dark
              : theme.palette.primary.main,
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '0.75rem',
            px: 2,
            border: 'none',
          }}
        />
        <Chip
          label="🔒 Secure & Private"
          size="small"
          sx={{
            background: (theme: Theme) => theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(0, 0, 0, 0.05)',
            color: 'inherit',
            fontWeight: 500,
            fontSize: '0.75rem',
            px: 2,
          }}
        />
      </Box>

      <Typography
        variant="h1"
        sx={{
          mb: 3,
          fontSize: { xs: '3rem', md: '4.5rem' },
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
        }}
      >
        Know who you're dealing with.
      </Typography>

      <Typography
        variant="body1"
        sx={{
          mb: 6,
          color: 'text.secondary',
          fontSize: { xs: '1.1rem', md: '1.25rem' },
          lineHeight: 1.7,
          maxWidth: 600,
        }}
      >
        Advanced Bitcoin wallet analysis powered by machine learning. 
        Detect fraud patterns, assess risk levels, and make informed decisions in seconds.
      </Typography>

      <Box sx={{ width: '100%', maxWidth: 650, mb: 8 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2, textAlign: 'left' }}>
            {error}
          </Alert>
        )}
        <TextField
          fullWidth
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
          placeholder="Enter Bitcoin address (e.g. bc1q... or 1A1z...)"
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              pr: 1,
              backgroundColor: (theme) => theme.palette.background.paper,
            }
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton 
                    size="small" 
                    onClick={() => navigator.clipboard.readText().then(setAddress)}
                    sx={{
                      background: 'rgba(14, 165, 233, 0.12)',
                      '&:hover': { background: 'rgba(14, 165, 233, 0.22)' }
                    }}
                  >
                    <PasteIcon fontSize="small" />
                  </IconButton>
                  <Button
                    variant="contained"
                    onClick={handleAnalyze}
                    disabled={loading || !address}
                    sx={{
                      px: 3,
                      py: 1,
                      fontWeight: 600,
                      borderRadius: 1,
                      textTransform: 'none',
                      boxShadow: 'none',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {loading ? 'Analyzing...' : 'Analyze'}
                  </Button>
                </Box>
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', pt: 0.5, fontWeight: 500 }}>
            Try an example:
          </Typography>
          {testAddresses.map((t, i) => (
            <Chip
              key={i}
              label={t.label}
              variant="outlined"
              onClick={() => setAddress(t.addr)}
              sx={{
                borderColor: address === t.addr ? 'primary.main' : 'divider',
                color: address === t.addr ? 'primary.main' : 'text.secondary',
                cursor: 'pointer',
                fontWeight: 500,
                '&:hover': { 
                  borderColor: 'primary.main',
                  background: 'rgba(14, 165, 233, 0.06)',
                }
              }}
            />
          ))}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, width: '100%', textAlign: 'left', mb: 8 }}>
        <FeatureCard>
          <SecurityIcon sx={{ fontSize: 32, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Risk Detection
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            ML-powered identification of suspicious patterns
          </Typography>
        </FeatureCard>
        <FeatureCard>
          <SpeedIcon sx={{ fontSize: 32, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Instant Results
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Real-time blockchain analysis in seconds
          </Typography>
        </FeatureCard>
        <FeatureCard>
          <AnalyticsIcon sx={{ fontSize: 32, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            Deep Insights
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Comprehensive transaction behavior analysis
          </Typography>
        </FeatureCard>
      </Box>

      {/* Market Data integrated into the flow */}
      <Box sx={{ width: '100%', textAlign: 'left' }}>
        <CryptoPrices isDarkMode={isDarkMode} />
        <CryptoNews isDarkMode={isDarkMode} />
      </Box>
    </Box>
  );
};
