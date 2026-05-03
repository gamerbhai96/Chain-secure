import React, { useState, useRef, useEffect } from 'react';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Typography,
  Chip,
  Paper,
  Fade,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandIcon,
  VisibilityOutlined as ViewIcon,
} from '@mui/icons-material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { lightTheme, darkTheme } from './themes';
import { ChainSecureNav, PageWrapper } from './components/ChainSecureNav';
import type { AnalysisResponse } from './types/api';
import { Home } from './pages/Home';
import { Report } from './pages/Report';

const queryClient = new QueryClient();

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [scanHistory, setScanHistory] = useState<AnalysisResponse[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState<number | false>(false);
  const [showApproach, setShowApproach] = useState(false);
  const faqContainerRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.toggle('dark-mode', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const saved = localStorage.getItem('chainsecure_scans');
    if (saved) {
      try { setScanHistory(JSON.parse(saved)); }
      catch { localStorage.removeItem('chainsecure_scans'); }
    }
  }, [showHistory]); // Refresh history when opening the modal

  const getRiskColor = (level: string) => {
    const map: Record<string, string> = {
      'MINIMAL': '#3d7c47', 'LOW': '#3d7c47',
      'MEDIUM': '#b58b2e',
      'HIGH': '#a63d3d', 'CRITICAL': '#a63d3d',
      'UNKNOWN': '#666666'
    };
    return map[level] || map['UNKNOWN'];
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={isDarkMode ? darkTheme : lightTheme}>
        <CssBaseline />
        <PageWrapper>
          <ChainSecureNav
            isDarkMode={isDarkMode}
            onToggleTheme={() => setIsDarkMode(p => !p)}
            onShowHowWeWork={() => setShowApproach(true)}
            onShowFAQ={() => setShowFAQ(true)}
            onShowHistory={() => setShowHistory(true)}
          />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/report/:address" element={<Report isDarkMode={isDarkMode} />} />
          </Routes>

          {/* ===== MODALS ===== */}

          {/* History Modal */}
          {showHistory && (
            <Fade in>
              <Box sx={{
                position: 'fixed', inset: 0,
                background: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)',
                zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3
              }}>
                <Paper sx={{ maxWidth: 500, width: '100%', maxHeight: '70vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.08em' }}>SCAN HISTORY</Typography>
                    <IconButton size="small" onClick={() => setShowHistory(false)}><CloseIcon fontSize="small" /></IconButton>
                  </Box>
                  <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                    {scanHistory.length === 0 ? (
                      <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                        No scans yet
                      </Typography>
                    ) : scanHistory.map((item, idx) => (
                      <Box
                        key={idx}
                        onClick={() => { 
                          setShowHistory(false); 
                          navigate(`/report/${item.address}`, { state: { analysis: item } }); 
                        }}
                        sx={{
                          p: 2, mb: 1, border: '1px solid', borderColor: 'divider', cursor: 'pointer',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          '&:hover': { borderColor: 'primary.main', background: 'action.hover' }
                        }}
                      >
                        <Box>
                          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.8rem', mb: 0.5 }}>
                            {item.address?.slice(0, 10)}...{item.address?.slice(-6)}
                          </Typography>
                          <Chip label={item.risk_level} size="small" sx={{ fontSize: '0.65rem', height: 20, color: getRiskColor(item.risk_level), borderColor: getRiskColor(item.risk_level) }} variant="outlined" />
                        </Box>
                        <ViewIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Box>
            </Fade>
          )}

          {/* FAQ Modal */}
          {showFAQ && (
            <Fade in>
              <Box sx={{
                position: 'fixed', inset: 0,
                background: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)',
                zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3
              }}>
                <Paper sx={{ maxWidth: 600, width: '100%', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.08em' }}>FAQ</Typography>
                    <IconButton size="small" onClick={() => setShowFAQ(false)}><CloseIcon fontSize="small" /></IconButton>
                  </Box>
                  <Box sx={{ flex: 1, overflow: 'auto', p: 2 }} ref={faqContainerRef}>
                    {[
                      { q: 'How does ChainSecure identify risky wallets?', a: 'We use machine learning models trained on datasets like Elliptic and BitcoinHeist, combined with real-time blockchain analysis.' },
                      { q: 'What makes an address high risk?', a: 'Connections to known fraud, mixing services, ransomware payments, or unusual transaction patterns.' },
                      { q: 'Is my data stored?', a: 'No. We only analyze public blockchain data. Your scan history is stored locally in your browser.' },
                      { q: 'Can I export analysis results?', a: 'Yes, click Export PDF to download a detailed report with charts and findings.' },
                    ].map((faq, idx) => (
                      <Accordion key={idx} expanded={expandedFAQ === idx} onChange={() => setExpandedFAQ(expandedFAQ === idx ? false : idx)} sx={{ mb: 1 }}>
                        <AccordionSummary expandIcon={<ExpandIcon />}>
                          <Typography sx={{ fontWeight: 500, fontSize: '0.9rem' }}>{faq.q}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>{faq.a}</Typography>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>
                </Paper>
              </Box>
            </Fade>
          )}

          {/* Method Modal */}
          {showApproach && (
            <Fade in>
              <Box sx={{
                position: 'fixed', inset: 0,
                background: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)',
                zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3
              }}>
                <Paper sx={{ maxWidth: 550, width: '100%', maxHeight: '80vh', overflow: 'auto' }}>
                  <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.08em' }}>OUR METHOD</Typography>
                    <IconButton size="small" onClick={() => setShowApproach(false)}><CloseIcon fontSize="small" /></IconButton>
                  </Box>
                  <Box sx={{ p: 3 }}>
                    {[
                      { n: '01', t: 'Data Aggregation', d: 'We pull from Elliptic, BitcoinHeist, BABD-13, and live blockchain APIs.' },
                      { n: '02', t: 'Feature Extraction', d: '20+ behavioral features: transaction patterns, timing, network topology.' },
                      { n: '03', t: 'Ensemble Models', d: 'Gradient Boosting, Neural Networks, and Isolation Forest vote on predictions.' },
                      { n: '04', t: 'Risk Scoring', d: 'All signals combine into a single risk score with configurable thresholds.' },
                    ].map((step, idx) => (
                      <Box key={idx} sx={{ display: 'flex', gap: 3, mb: 3 }}>
                        <Typography sx={{ fontFamily: '"Inter", sans-serif', fontWeight: 700, fontSize: '1.1rem', color: 'primary.main', minWidth: 40 }}>
                          {step.n}
                        </Typography>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '0.95rem', mb: 0.5 }}>{step.t}</Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>{step.d}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              </Box>
            </Fade>
          )}
        </PageWrapper>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
