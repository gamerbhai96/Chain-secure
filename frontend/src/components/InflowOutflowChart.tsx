import { useMemo, useState, useEffect } from 'react';
import type { FC } from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { BitScanAPI } from '../services/api';
import { 
  ResponsiveContainer, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  CartesianGrid, 
  Legend
} from 'recharts';

interface InflowOutflowData {
  date: string;
  inflow: number;
  outflow: number;
  net: number;
}

type Granularity = 'day' | 'week' | 'month' | 'year';

interface Props {
  address: string;
  defaultDays?: number;
  defaultGranularity?: Granularity;
  dark?: boolean;
}

const CustomTooltip: FC<any> = ({ active, payload, label, dark }) => {
  if (active && payload && payload.length) {
    const inflow = payload.find((p: any) => p.dataKey === 'inflow')?.value || 0;
    const outflow = payload.find((p: any) => p.dataKey === 'outflow')?.value || 0;
    const net = inflow - outflow;

    return (
      <Box sx={{ 
        p: 1.5, 
        backgroundColor: dark ? '#1e1e1e' : '#fff',
        border: `1px solid ${dark ? '#333' : '#ddd'}`,
        borderRadius: 1,
        boxShadow: '0px 2px 8px rgba(0,0,0,0.15)'
      }}>
        <Typography variant="subtitle2" sx={{ mb: 0.5, color: dark ? '#fff' : '#333', fontWeight: 600 }}>
          {label}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Typography variant="body2" sx={{ color: '#10b981' }}>Inflow:</Typography>
            <Typography variant="body2" sx={{ color: dark ? '#fff' : '#333', fontWeight: 500 }}>
              {inflow.toFixed(8)} BTC
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Typography variant="body2" sx={{ color: '#ef4444' }}>Outflow:</Typography>
            <Typography variant="body2" sx={{ color: dark ? '#fff' : '#333', fontWeight: 500 }}>
              {outflow.toFixed(8)} BTC
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, pt: 0.5, borderTop: `1px solid ${dark ? '#444' : '#eee'}` }}>
            <Typography variant="body2" sx={{ color: net >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>Net:</Typography>
            <Typography variant="body2" sx={{ color: net >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
              {net >= 0 ? '+' : ''}{net.toFixed(8)} BTC
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }
  return null;
};

const InflowOutflowChart: FC<Props> = ({ 
  address,
  defaultDays = 90, 
  defaultGranularity = 'week',
  dark = false 
}) => {
  const [timeframe, setTimeframe] = useState<{
    days: number;
    granularity: Granularity;
  }>({
    days: defaultDays,
    granularity: defaultGranularity
  });

  const [data, setData] = useState<InflowOutflowData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activePreset, setActivePreset] = useState<string>('90d');

  // Fetch wallet time series data
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (!address) return;
      
      setLoading(true);
      
      try {
        const res = await BitScanAPI.getWalletTimeSeries(
          address, 
          timeframe.days, 
          timeframe.granularity
        );
        
        if (mounted && res.points) {
          const inflowData = res.points.map(point => {
            const dateObj = new Date(point.date);
            const isValidDate = !isNaN(dateObj.getTime());
            
            return {
              date: isValidDate 
                ? dateObj.toLocaleDateString('en-US', {
                    month: 'short',
                    day: timeframe.granularity === 'week' ? 'numeric' : undefined,
                    year: timeframe.granularity === 'month' ? 'numeric' : undefined
                  })
                : point.date,
              inflow: point.received_btc || 0,
              outflow: point.sent_btc || 0,
              net: (point.received_btc || 0) - (point.sent_btc || 0)
            };
          });
          setData(inflowData);
        }
      } catch (error: any) {
        console.error('Error loading inflow/outflow data:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    
    return () => {
      mounted = false;
    };
  }, [address, timeframe.days, timeframe.granularity]);

  const getOptimalGranularity = (days: number): Granularity => {
    if (days <= 90) return 'week';  // 30d and 90d use weekly
    if (days <= 180) return 'month'; // 6m uses monthly
    return 'month';
  };

  const applyPreset = (key: string) => {
    let days: number;
    switch (key) {
      case '30d': days = 30; break;
      case '90d': days = 90; break;
      case '6m': days = 180; break;
      case '1y': days = 365; break;
      default: days = 90;
    }
    
    const granularity = getOptimalGranularity(days);
    setTimeframe({ days, granularity });
    setActivePreset(key);
  };

  const chartData = useMemo(() => {
    return data.map(point => ({
      ...point,
      inflow: Number(point.inflow) || 0,
      outflow: Number(point.outflow) || 0,
      net: (Number(point.inflow) || 0) - (Number(point.outflow) || 0)
    }));
  }, [data]);

  // Limit displayed data to prevent scrolling
  const displayData = useMemo(() => {
    if (!chartData.length) return [];
    const maxPoints = timeframe.granularity === 'week' ? 16 : 12;
    return chartData.slice(-maxPoints);
  }, [chartData, timeframe.granularity]);

  const totals = useMemo(() => {
    return chartData.reduce((acc, point) => ({
      inflow: acc.inflow + point.inflow,
      outflow: acc.outflow + point.outflow,
      net: acc.net + point.net
    }), { inflow: 0, outflow: 0, net: 0 });
  }, [chartData]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!chartData.length) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>No inflow/outflow data available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Inflow vs Outflow Analysis
      </Typography>

      {/* Timeframe selector */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2, overflowX: 'auto', pb: 1 }}>
        {['30d', '90d', '6m', '1y'].map((preset) => (
          <Paper
            key={preset}
            elevation={0}
            onClick={() => applyPreset(preset)}
            sx={{
              px: 2,
              py: 1,
              borderRadius: 1,
              cursor: 'pointer',
              backgroundColor: activePreset === preset 
                ? (dark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)')
                : (dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'),
              color: activePreset === preset 
                ? (dark ? '#818cf8' : '#4f46e5')
                : (dark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'),
              border: `1px solid ${activePreset === preset 
                ? (dark ? 'rgba(99, 102, 241, 0.5)' : 'rgba(99, 102, 241, 0.3)') 
                : (dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')}`,
              '&:hover': {
                backgroundColor: dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              },
              whiteSpace: 'nowrap',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            {preset}
          </Paper>
        ))}
      </Box>

      {/* Summary Stats */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
        <Paper elevation={0} sx={{ 
          p: 1.5, 
          flex: 1, 
          minWidth: 140, 
          borderRadius: 1.5, 
          border: '1px solid', 
          borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)'
        }}>
          <Typography variant="caption" sx={{ opacity: 0.6, fontSize: '0.7rem' }}>Total Inflow</Typography>
          <Typography variant="body1" sx={{ fontWeight: 600, color: '#10b981', fontSize: '0.95rem' }}>
            {totals.inflow.toFixed(8)} BTC
          </Typography>
        </Paper>
        <Paper elevation={0} sx={{ 
          p: 1.5, 
          flex: 1, 
          minWidth: 140, 
          borderRadius: 1.5, 
          border: '1px solid', 
          borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)'
        }}>
          <Typography variant="caption" sx={{ opacity: 0.6, fontSize: '0.7rem' }}>Total Outflow</Typography>
          <Typography variant="body1" sx={{ fontWeight: 600, color: '#ef4444', fontSize: '0.95rem' }}>
            {totals.outflow.toFixed(8)} BTC
          </Typography>
        </Paper>
        <Paper elevation={0} sx={{ 
          p: 1.5, 
          flex: 1, 
          minWidth: 140, 
          borderRadius: 1.5, 
          border: '1px solid', 
          borderColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
          background: totals.net >= 0 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)'
            : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)'
        }}>
          <Typography variant="caption" sx={{ opacity: 0.6, fontSize: '0.7rem' }}>Net Flow</Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              fontWeight: 600, 
              fontSize: '0.95rem',
              color: totals.net >= 0 ? '#10b981' : '#ef4444' 
            }}
          >
            {totals.net >= 0 ? '+' : ''}{totals.net.toFixed(8)} BTC
          </Typography>
        </Paper>
      </Box>

      {/* Bar Chart */}
      <Box sx={{ height: 250, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={displayData}
            margin={{ top: 10, right: 20, bottom: 20, left: 10 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false}
              stroke={dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'} 
            />
            <XAxis 
              dataKey="date" 
              tick={{ 
                fontSize: 11,
                fill: dark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
              }}
              axisLine={{ stroke: dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}
              tickLine={{ stroke: dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}
            />
            <YAxis 
              tickFormatter={(value) => `${value.toFixed(2)}`}
              tick={{ 
                fontSize: 11,
                fill: dark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
              }}
              width={60}
              axisLine={{ stroke: dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}
              tickLine={{ stroke: dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}
            />
            <RechartsTooltip 
              content={(props) => <CustomTooltip {...props} dark={dark} />}
              cursor={{ fill: dark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }}
            />
            <Legend 
              wrapperStyle={{
                paddingTop: '10px',
                fontSize: '12px',
                color: dark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
              }}
            />
            <Bar 
              dataKey="inflow" 
              name="Inflow" 
              fill="#10b981"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="outflow" 
              name="Outflow" 
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export default InflowOutflowChart;
