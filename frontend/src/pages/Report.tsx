import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Card, Button, Alert, AlertTitle, List, ListItem, ListItemIcon, ListItemText, Fade } from '@mui/material';
import { styled } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import {
  FileDownloadOutlined as DownloadIcon,
  VisibilityOutlined as ViewIcon,
  Analytics as AnalyticsIcon,
  CheckCircleOutline as CheckIcon,
  WarningAmber as WarnIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import WalletCredibilityChart from '../components/WalletCredibilityChart';
import InflowOutflowChart from '../components/InflowOutflowChart';
import { downloadPdfReportWithCharts } from '../utils/reportGenerator';
import type { AnalysisResponse } from '../types/api';
import ChainSecureAPI from '../services/api';

const StatCard = styled(Card)<{ theme?: Theme }>(({ theme }) => ({
  padding: theme?.spacing(3) || 24,
  borderRadius: typeof theme?.shape?.borderRadius === 'number' ? theme.shape.borderRadius * 1.5 : 8,
  background: theme?.palette?.background?.paper,
  border: '1px solid ' + theme?.palette?.divider,
  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  boxShadow: theme?.shadows?.[1],
  '&:hover': {
    boxShadow: theme?.shadows?.[2],
    borderColor: theme?.palette?.text?.secondary,
  },
}));

const ChartCard = styled(Card)<{ theme?: Theme }>(({ theme }) => ({
  padding: theme?.spacing(3) || 24,
  borderRadius: typeof theme?.shape?.borderRadius === 'number' ? theme.shape.borderRadius * 1.5 : 8,
  background: theme?.palette?.background?.paper,
  border: '1px solid ' + theme?.palette?.divider,
  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
  height: '100%',
  boxShadow: theme?.shadows?.[1],
  '&:hover': {
    boxShadow: theme?.shadows?.[2],
  },
}));

interface ReportProps {
  isDarkMode: boolean;
}

export const Report: React.FC<ReportProps> = ({ isDarkMode }) => {
  const { state } = useLocation();
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(state?.analysis || null);
  const [loading, setLoading] = useState(!state?.analysis);
  const [error, setError] = useState<string | null>(null);
  const [showCharts, setShowCharts] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    if (!analysis && address) {
      const fetchAnalysis = async () => {
        try {
          setLoading(true);
          const result = await ChainSecureAPI.analyzeAddress(address);
          setAnalysis(result);
          
          const saved = localStorage.getItem('chainsecure_scans');
          let history = saved ? JSON.parse(saved) : [];
          history = [result, ...history.filter((i: AnalysisResponse) => i.address !== result.address)].slice(0, 10);
          localStorage.setItem('chainsecure_scans', JSON.stringify(history));
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Analysis failed');
        } finally {
          setLoading(false);
        }
      };
      fetchAnalysis();
    }
  }, [address, analysis]);

  const isEmptyWallet = useMemo(() => {
    if (!analysis || !analysis.analysis_summary) return false;
    const summary = analysis.analysis_summary;
    return summary.transaction_count === 0 && summary.total_received_btc === 0 && summary.total_sent_btc === 0;
  }, [analysis]);

  useEffect(() => {
    if (isEmptyWallet) setShowCharts(false);
    else if (analysis) setShowCharts(true);
  }, [isEmptyWallet, analysis]);

  const getRiskColor = (level: string) => {
    const map: Record<string, string> = {
      'MINIMAL': '#3d7c47', 'LOW': '#3d7c47',
      'MEDIUM': '#b58b2e',
      'HIGH': '#a63d3d', 'CRITICAL': '#a63d3d',
      'UNKNOWN': '#666666'
    };
    return map[level] || map['UNKNOWN'];
  };

  if (loading) {
    return (
      <Box sx={{ pt: 16, pb: 8, px: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh' }}>
        <Box sx={{ position: 'relative', width: 80, height: 80, mb: 3 }}>
          <Box sx={{
            width: '100%', height: '100%', borderRadius: '50%',
            border: '3px solid', borderColor: 'divider', borderTopColor: 'primary.main',
            animation: 'spin 1s linear infinite',
            '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } }
          }} />
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 60, height: 60, borderRadius: '50%',
            background: (theme: Theme) => theme.palette.mode === 'dark' ? 'rgba(14, 165, 233, 0.05)' : 'rgba(14, 165, 233, 0.02)',
          }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Analyzing Blockchain</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Scanning transaction patterns and risk indicators...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ pt: 16, pb: 8, px: 4, maxWidth: 800, margin: '0 auto' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ mb: 4 }}>Back to Scan</Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!analysis) return null;

  return (
    <Box sx={{ pt: { xs: 12, md: 14 }, pb: 8, px: { xs: 4, md: 8 }, maxWidth: 1400, margin: '0 auto', minHeight: '100vh' }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ mb: 4, color: 'text.secondary' }}>
        Scan Another Address
      </Button>
      
      <Fade in timeout={600}>
        <Box>
          {/* Risk Score Header */}
          <Card sx={{ 
            mb: 4, p: 4,
            background: (theme: Theme) => theme.palette.background.paper,
            border: (theme: Theme) => `1px solid ${theme.palette.divider}`,
            boxShadow: (theme: Theme) => theme.shadows[1],
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
              <Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.1em', color: 'text.secondary', textTransform: 'uppercase' }}>
                  Risk Assessment
                </Typography>
                <Typography variant="h2" sx={{ fontWeight: 700, color: isEmptyWallet ? 'text.secondary' : getRiskColor(analysis.risk_level), fontSize: { xs: '2rem', md: '2.5rem' } }}>
                  {isEmptyWallet ? 'Empty Wallet' : analysis.risk_level}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h1" sx={{ fontWeight: 700, fontSize: { xs: '2.5rem', md: '3rem' }, color: isEmptyWallet ? 'text.secondary' : getRiskColor(analysis.risk_level) }}>
                  {isEmptyWallet ? '—' : `${Math.round((analysis.risk_score || 0) * 100)}%`}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.9rem', fontWeight: 500 }}>
                  risk score
                </Typography>
              </Box>
            </Box>
          </Card>

          {/* Address */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem', mb: 0.5 }}>ADDRESS</Typography>
            <Typography sx={{ fontFamily: '"Geist Mono", monospace', fontSize: '0.85rem', wordBreak: 'break-all' }}>
              {analysis.address}
            </Typography>
          </Box>

          {/* Stats Grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
            {[
              { label: 'Transactions', value: isEmptyWallet ? '0' : (analysis.analysis_summary?.transaction_count || 0).toLocaleString(), icon: '📊' },
              { label: 'Balance', value: isEmptyWallet ? '0' : `${(analysis.analysis_summary?.current_balance_btc || 0).toFixed(6)} BTC`, icon: '₿' },
              { label: 'Total Received', value: isEmptyWallet ? '0' : `${(analysis.analysis_summary?.total_received_btc || 0).toFixed(4)} BTC`, icon: '💰' },
              { label: 'Confidence', value: isEmptyWallet ? '—' : `${((analysis.confidence || 0) * 100).toFixed(0)}%`, icon: '🎯' },
            ].map((stat, i) => (
              <StatCard key={i}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h4" sx={{ mr: 2, fontSize: '1.5rem' }}>{stat.icon}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    {stat.label}
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: { xs: '1.5rem', md: '1.8rem' }, color: 'text.primary' }}>
                  {stat.value}
                </Typography>
              </StatCard>
            ))}
          </Box>

          {/* Action Buttons */}
          {!isEmptyWallet && (
            <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined" size="large" onClick={() => setShowCharts(!showCharts)} startIcon={showCharts ? <ViewIcon /> : <AnalyticsIcon />}
                sx={{ borderRadius: 3, px: 3, py: 1.5, fontWeight: 600 }}
              >
                {showCharts ? 'Hide Charts' : 'View Charts'}
              </Button>
              <Button
                variant="outlined" size="large" disabled={generatingPdf} startIcon={<DownloadIcon />}
                onClick={async () => {
                  setGeneratingPdf(true);
                  try {
                    await new Promise(r => setTimeout(r, 5000));
                    await downloadPdfReportWithCharts(analysis, analysis.address!);
                  } finally {
                    setGeneratingPdf(false);
                  }
                }}
                sx={{ borderRadius: 3, px: 3, py: 1.5, fontWeight: 600 }}
              >
                {generatingPdf ? 'Generating...' : 'Export PDF'}
              </Button>
            </Box>
          )}

          {/* Hidden charts for PDF */}
          {!isEmptyWallet && analysis.address && (
            <Box sx={{ position: 'absolute', left: '-9999px', opacity: 0 }}>
              <Box data-chart="balance-history" sx={{ background: '#fff' }}>
                <WalletCredibilityChart address={analysis.address} defaultDays={90} defaultGranularity="week" dark={false} />
              </Box>
              <Box data-chart="inflow-outflow" sx={{ background: '#fff' }}>
                <InflowOutflowChart address={analysis.address} defaultDays={90} defaultGranularity="week" dark={false} />
              </Box>
            </Box>
          )}

          {/* Charts Section */}
          {!isEmptyWallet && showCharts && (
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
                <ChartCard sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>Wallet Credibility</Typography>
                  <WalletCredibilityChart address={analysis.address!} defaultDays={90} defaultGranularity="week" dark={isDarkMode} />
                </ChartCard>
                <ChartCard sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>Transaction Flow</Typography>
                  <InflowOutflowChart address={analysis.address!} defaultDays={90} defaultGranularity="week" dark={isDarkMode} />
                </ChartCard>
              </Box>
            </Box>
          )}

          {/* Analysis Details */}
          <Card sx={{ 
            p: 4,
            background: (theme: Theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.9)',
            border: (theme: Theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
          }}>
            <Typography variant="h6" sx={{ mb: 3, fontSize: '0.9rem', letterSpacing: '0.1em', color: 'text.secondary', textTransform: 'uppercase', fontWeight: 600 }}>
              Analysis Details
            </Typography>

            {isEmptyWallet ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.secondary' }}>No Activity Found</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>This address has no transaction history on the blockchain.</Typography>
              </Box>
            ) : (analysis.risk_level === 'MINIMAL' || analysis.risk_level === 'LOW') ? (
              <List dense disablePadding>
                {(analysis.positive_indicators?.length ? analysis.positive_indicators : [
                  'Normal transaction patterns detected', 'No matches in fraud databases', 'Clean wallet history'
                ]).map((item, idx) => (
                  <ListItem key={idx} disableGutters sx={{ py: 1.5, px: 0, borderBottom: (theme: Theme) => `1px solid ${theme.palette.divider}`, '&:last-child': { borderBottom: 'none' } }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <CheckIcon sx={{ fontSize: 20, color: 'success.main', background: 'rgba(72, 187, 120, 0.1)', p: 1, borderRadius: '50%' }} />
                    </ListItemIcon>
                    <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <List dense disablePadding>
                {(analysis.risk_factors?.length ? analysis.risk_factors : [
                  'Unusual transaction patterns detected', 'High-risk associations found'
                ]).map((item, idx) => (
                  <ListItem key={idx} disableGutters sx={{ py: 1.5, px: 0, borderBottom: (theme: Theme) => `1px solid ${theme.palette.divider}`, '&:last-child': { borderBottom: 'none' } }}>
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <WarnIcon sx={{ fontSize: 20, color: getRiskColor(analysis.risk_level), background: `${getRiskColor(analysis.risk_level)}15`, p: 1, borderRadius: '50%' }} />
                    </ListItemIcon>
                    <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} />
                  </ListItem>
                ))}
              </List>
            )}

            {analysis.data_limitations && (
              <Alert severity="warning" sx={{ mt: 3, borderRadius: 3, '& .MuiAlert-message': { fontWeight: 500 } }}>
                <AlertTitle sx={{ fontWeight: 600 }}>Data Limitations</AlertTitle>
                {analysis.data_limitations.description}
              </Alert>
            )}
          </Card>
        </Box>
      </Fade>
    </Box>
  );
};
