import { useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import { ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, Area, Legend, AreaChart } from 'recharts';
import ChainSecureAPI from '../services/api';

type Granularity = 'day' | 'week' | 'month' | 'year';

type TooltipItem = {
    name?: string;
    value?: number | string;
    color?: string;
};

type TooltipProps = {
    active?: boolean;
    payload?: TooltipItem[];
    label?: string;
};

type TimeSeriesPoint = {
    date: string;
    received_btc?: number;
    sent_btc?: number;
    cumulative_balance_btc?: number;
};

type TimeSeriesResponse = {
    points?: TimeSeriesPoint[];
    summary?: {
        total_received_btc: number;
        total_sent_btc: number;
        net_change_btc: number;
    };
};

interface Props {
    address: string;
    defaultDays?: number;
    defaultGranularity?: Granularity;
    dark?: boolean;
}

const CustomTooltip: FC<TooltipProps> = ({ active, payload, label }) => {
    if (active && payload?.length) {
        return (
            <Box sx={{
                p: 2, background: 'rgba(10, 15, 26, 0.95)', border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: 2, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(12px)',
            }}>
                <Typography sx={{ mb: 1.5, color: '#f8fafc', fontWeight: 600, fontSize: '0.85rem', fontFamily: '"Space Grotesk", sans-serif', borderBottom: '1px solid rgba(59, 130, 246, 0.2)', pb: 1 }}>{label}</Typography>
                {payload.map((item, i: number) => (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', gap: 3, py: 0.25 }}>
                        <Typography sx={{ color: item.color, fontWeight: 500, fontSize: '0.8rem' }}>{item.name}:</Typography>
                        <Typography sx={{ color: '#f8fafc', fontWeight: 600, fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.8rem', textShadow: `0 0 10px ${item.color}40` }}>{Number(item.value ?? 0).toFixed(8)} BTC</Typography>
                    </Box>
                ))}
            </Box>
        );
    }
    return null;
};

const TimeframeBtn: FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
    <Box onClick={onClick} sx={{
        px: 2, py: 0.75, borderRadius: 2, cursor: 'pointer', fontFamily: '"Space Grotesk", sans-serif', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.25s ease',
        background: active ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
        color: active ? '#3b82f6' : 'rgba(248, 250, 252, 0.5)',
        border: active ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid transparent',
        boxShadow: active ? '0 0 15px rgba(59, 130, 246, 0.2)' : 'none',
        '&:hover': { background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' },
    }}>{label}</Box>
);

const WalletCredibilityChart: FC<Props> = ({ address, defaultDays = 90, defaultGranularity = 'week', dark = true }) => {
    const [timeframe, setTimeframe] = useState({ days: defaultDays, granularity: defaultGranularity as Granularity });
    const [data, setData] = useState<TimeSeriesResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activePreset, setActivePreset] = useState('90d');

    const applyPreset = (key: string) => {
        const days = key === '30d' ? 30 : key === '90d' ? 90 : key === '6m' ? 180 : 365;
        setTimeframe({ days, granularity: days <= 90 ? 'week' : 'month' });
        setActivePreset(key);
    };

    const chartData = useMemo(() => {
        if (!data?.points?.length) return [];
        return [...data.points]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((p) => ({ ...p, formattedDate: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }));
    }, [data]);

    const displayData = useMemo(() => chartData.slice(-16), [chartData]);

    useEffect(() => {
        let mounted = true;
        const loadData = async () => {
            if (!address) return;
            setLoading(true);
            try {
                const res = await ChainSecureAPI.getWalletTimeSeries(address, timeframe.days, timeframe.granularity);
                if (mounted) setData(res as TimeSeriesResponse);
            }
            catch (e: unknown) {
                if (!mounted) return;
                if (e instanceof Error) setError(e.message);
                else setError('Failed');
            }
            finally { if (mounted) setLoading(false); }
        };
        loadData();
        return () => { mounted = false; };
    }, [address, timeframe]);

    const containerStyle = {
        p: 3,
        borderRadius: 4,
        background: dark ? 'rgba(10, 15, 26, 0.8)' : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        border: dark ? '1px solid rgba(59, 130, 246, 0.1)' : '1px solid rgba(59, 130, 246, 0.25)',
        boxShadow: '0 8px 40px rgba(0, 0, 0, 0.4)'
    };

    if (loading) return <Box sx={containerStyle}><Skeleton variant="text" width={180} height={28} sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', mb: 2 }} /><Skeleton variant="rounded" height={280} sx={{ borderRadius: 3, bgcolor: 'rgba(59, 130, 246, 0.06)' }} /></Box>;
    if (error || !chartData.length) return <Box sx={{ ...containerStyle, textAlign: 'center', py: 6 }}><Typography sx={{ color: 'rgba(248, 250, 252, 0.5)' }}>{error || 'No data'}</Typography></Box>;

    return (
        <Box sx={containerStyle}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', fontFamily: '"Space Grotesk", sans-serif', color: '#f8fafc' }}>📊 Balance History</Typography>
                <Box sx={{ display: 'flex', gap: 0.75 }}>{['30d', '90d', '6m', '1y'].map(p => <TimeframeBtn key={p} label={p} active={activePreset === p} onClick={() => applyPreset(p)} />)}</Box>
            </Box>

            {data?.summary && (
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                    {[{ label: 'Received', value: data.summary.total_received_btc, color: '#22c55e' }, { label: 'Sent', value: data.summary.total_sent_btc, color: '#ef4444' }, { label: 'Net', value: data.summary.net_change_btc, color: '#3b82f6' }].map((s, i) => (
                        <Box key={i} sx={{ flex: 1, p: 2, borderRadius: 3, background: 'rgba(10, 15, 26, 0.6)', border: `1px solid ${s.color}20` }}>
                            <Typography sx={{ fontSize: '0.75rem', color: 'rgba(248, 250, 252, 0.5)', mb: 0.5 }}>{s.label}</Typography>
                            <Typography sx={{ fontWeight: 700, color: s.color, fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.95rem', textShadow: `0 0 15px ${s.color}40` }}>{i === 2 && s.value >= 0 ? '+' : ''}{s.value.toFixed(8)} BTC</Typography>
                        </Box>
                    ))}
                </Box>
            )}

            <Box sx={{ height: 300, borderRadius: 3, background: 'rgba(2, 6, 23, 0.4)', p: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={displayData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                        <defs>
                            <linearGradient id="gRecv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
                            <linearGradient id="gSent" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                            <linearGradient id="gBal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(59, 130, 246, 0.08)" />
                        <XAxis dataKey="formattedDate" tick={{ fontSize: 11, fill: 'rgba(248, 250, 252, 0.5)' }} axisLine={{ stroke: 'rgba(59, 130, 246, 0.15)' }} tickLine={false} />
                        <YAxis tickFormatter={v => v.toFixed(4)} tick={{ fontSize: 11, fill: 'rgba(248, 250, 252, 0.5)' }} width={65} axisLine={{ stroke: 'rgba(59, 130, 246, 0.15)' }} tickLine={false} />
                        <RechartsTooltip content={({ active, payload, label }) => <CustomTooltip active={active} payload={payload as TooltipItem[] | undefined} label={String(label ?? '')} />} />
                        <Legend wrapperStyle={{ paddingTop: 16, fontSize: 12 }} iconType="circle" iconSize={8} />
                        <Area type="monotone" dataKey="received_btc" name="Received" stroke="#22c55e" fill="url(#gRecv)" strokeWidth={2} />
                        <Area type="monotone" dataKey="sent_btc" name="Sent" stroke="#ef4444" fill="url(#gSent)" strokeWidth={2} />
                        <Area type="monotone" dataKey="cumulative_balance_btc" name="Balance" stroke="#3b82f6" fill="url(#gBal)" strokeWidth={2.5} />
                    </AreaChart>
                </ResponsiveContainer>
            </Box>
        </Box>
    );
};

export default WalletCredibilityChart;
