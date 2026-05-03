import { useMemo, useState, useEffect } from 'react';
import type { FC } from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import ChainSecureAPI from '../services/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, Legend } from 'recharts';

type Granularity = 'day' | 'week' | 'month' | 'year';

interface Props {
    address: string;
    defaultDays?: number;
    defaultGranularity?: Granularity;
    dark?: boolean;
}

type TooltipItem = {
    dataKey?: string;
    value?: number;
};

type TooltipProps = {
    active?: boolean;
    payload?: TooltipItem[];
    label?: string;
};

type RawPoint = {
    date: string;
    inflow: number;
    outflow: number;
};

type TimeSeriesPoint = {
    date: string;
    received_btc?: number;
    sent_btc?: number;
};

type TimeSeriesResponse = {
    points?: TimeSeriesPoint[];
};

const CustomTooltip: FC<TooltipProps> = ({ active, payload, label }) => {
    if (active && payload?.length) {
        const inflow = payload.find((p) => p.dataKey === 'inflow')?.value || 0;
        const outflow = payload.find((p) => p.dataKey === 'outflow')?.value || 0;
        const net = inflow - outflow;
        return (
            <Box sx={{ p: 2, minWidth: 180, background: 'rgba(10, 15, 26, 0.95)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: 2, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(12px)' }}>
                <Typography sx={{ mb: 1.5, fontWeight: 600, fontSize: '0.85rem', fontFamily: '"Space Grotesk", sans-serif', color: '#f8fafc', borderBottom: '1px solid rgba(59, 130, 246, 0.2)', pb: 1 }}>{label}</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.25 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22c55e', boxShadow: '0 0 8px #22c55e60' }} /><Typography sx={{ fontSize: '0.8rem', color: 'rgba(248, 250, 252, 0.7)' }}>Inflow</Typography></Box>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, fontFamily: '"IBM Plex Mono", monospace', color: '#22c55e', textShadow: '0 0 10px #22c55e40' }}>{inflow.toFixed(8)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.25 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#f97316', boxShadow: '0 0 8px #f9731660' }} /><Typography sx={{ fontSize: '0.8rem', color: 'rgba(248, 250, 252, 0.7)' }}>Outflow</Typography></Box>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, fontFamily: '"IBM Plex Mono", monospace', color: '#f97316', textShadow: '0 0 10px #f9731640' }}>{outflow.toFixed(8)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, mt: 0.5, borderTop: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: '"Space Grotesk", sans-serif', color: '#f8fafc' }}>Net</Typography>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: '"IBM Plex Mono", monospace', color: net >= 0 ? '#3b82f6' : '#f97316', textShadow: net >= 0 ? '0 0 10px #3b82f640' : '0 0 10px #f9731640' }}>{net >= 0 ? '+' : ''}{net.toFixed(8)}</Typography>
                </Box>
            </Box>
        );
    }
    return null;
};

const TimeframeBtn: FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
    <Box onClick={onClick} sx={{
        px: 2, py: 0.75, borderRadius: 2, cursor: 'pointer', fontFamily: '"Space Grotesk", sans-serif', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.25s ease',
        background: active ? 'rgba(249, 115, 22, 0.2)' : 'transparent',
        color: active ? '#f97316' : 'rgba(248, 250, 252, 0.5)',
        border: active ? '1px solid rgba(249, 115, 22, 0.5)' : '1px solid transparent',
        boxShadow: active ? '0 0 15px rgba(249, 115, 22, 0.2)' : 'none',
        '&:hover': { background: 'rgba(249, 115, 22, 0.15)', color: '#fb923c' },
    }}>{label}</Box>
);

const InflowOutflowChart: FC<Props> = ({ address, defaultDays = 90, defaultGranularity = 'week', dark = true }) => {
    const [timeframe, setTimeframe] = useState({ days: defaultDays, granularity: defaultGranularity as Granularity });
    const [rawData, setRawData] = useState<RawPoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [activePreset, setActivePreset] = useState('90d');

    const applyPreset = (key: string) => {
        const days = key === '30d' ? 30 : key === '90d' ? 90 : key === '6m' ? 180 : 365;
        setTimeframe({ days, granularity: days <= 90 ? 'week' : 'month' });
        setActivePreset(key);
    };

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            if (!address) return;
            setLoading(true);
            try {
                const res = await ChainSecureAPI.getWalletTimeSeries(address, timeframe.days, timeframe.granularity);
                const typed = res as TimeSeriesResponse;
                if (mounted && typed.points) {
                    setRawData(
                        typed.points.map((p) => ({
                            date: new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                            inflow: p.received_btc || 0,
                            outflow: p.sent_btc || 0
                        }))
                    );
                }
            }
            catch (e) { console.error(e); }
            finally { if (mounted) setLoading(false); }
        };
        load();
        return () => { mounted = false; };
    }, [address, timeframe]);

    const displayData = useMemo(() => rawData.slice(-16), [rawData]);
    const totals = useMemo(() => displayData.reduce((acc, p) => ({ inflow: acc.inflow + p.inflow, outflow: acc.outflow + p.outflow }), { inflow: 0, outflow: 0 }), [displayData]);

    const containerStyle = {
        p: 3,
        borderRadius: 4,
        background: dark ? 'rgba(10, 15, 26, 0.8)' : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        border: dark ? '1px solid rgba(249, 115, 22, 0.1)' : '1px solid rgba(249, 115, 22, 0.25)',
        boxShadow: '0 8px 40px rgba(0, 0, 0, 0.4)'
    };

    if (loading) return <Box sx={containerStyle}><Skeleton variant="text" width={200} height={28} sx={{ bgcolor: 'rgba(249, 115, 22, 0.1)', mb: 2 }} /><Skeleton variant="rounded" height={260} sx={{ borderRadius: 3, bgcolor: 'rgba(249, 115, 22, 0.06)' }} /></Box>;
    if (!displayData.length) return <Box sx={{ ...containerStyle, textAlign: 'center', py: 6 }}><Typography sx={{ color: 'rgba(248, 250, 252, 0.5)' }}>No data</Typography></Box>;

    return (
        <Box sx={containerStyle}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', fontFamily: '"Space Grotesk", sans-serif', color: '#f8fafc' }}>💸 Flow Analysis</Typography>
                <Box sx={{ display: 'flex', gap: 0.75 }}>{['30d', '90d', '6m', '1y'].map(p => <TimeframeBtn key={p} label={p} active={activePreset === p} onClick={() => applyPreset(p)} />)}</Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                {[{ label: 'Total Inflow', value: totals.inflow, color: '#22c55e' }, { label: 'Total Outflow', value: totals.outflow, color: '#f97316' }, { label: 'Net Flow', value: totals.inflow - totals.outflow, color: totals.inflow >= totals.outflow ? '#3b82f6' : '#f97316' }].map((s, i) => (
                    <Box key={i} sx={{ flex: 1, p: 2, borderRadius: 3, background: 'rgba(10, 15, 26, 0.6)', border: `1px solid ${s.color}20` }}>
                        <Typography sx={{ fontSize: '0.75rem', color: 'rgba(248, 250, 252, 0.5)', mb: 0.5 }}>{s.label}</Typography>
                        <Typography sx={{ fontWeight: 700, color: s.color, fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.95rem', textShadow: `0 0 15px ${s.color}40` }}>{i === 2 && s.value >= 0 ? '+' : ''}{s.value.toFixed(8)} BTC</Typography>
                    </Box>
                ))}
            </Box>

            <Box sx={{ height: 260, borderRadius: 3, background: 'rgba(2, 6, 23, 0.4)', p: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={displayData} margin={{ top: 10, right: 20, bottom: 10, left: 10 }} barCategoryGap="20%">
                        <defs>
                            <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity={1} /><stop offset="100%" stopColor="#22c55e" stopOpacity={0.5} /></linearGradient>
                            <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f97316" stopOpacity={1} /><stop offset="100%" stopColor="#f97316" stopOpacity={0.5} /></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(249, 115, 22, 0.08)" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'rgba(248, 250, 252, 0.5)' }} axisLine={{ stroke: 'rgba(249, 115, 22, 0.15)' }} tickLine={false} />
                        <YAxis tickFormatter={v => v.toFixed(2)} tick={{ fontSize: 11, fill: 'rgba(248, 250, 252, 0.5)' }} width={50} axisLine={{ stroke: 'rgba(249, 115, 22, 0.15)' }} tickLine={false} />
                        <RechartsTooltip content={(props) => <CustomTooltip active={props.active} payload={props.payload as TooltipItem[] | undefined} label={String(props.label ?? '')} />} cursor={{ fill: 'rgba(249, 115, 22, 0.05)' }} />
                        <Legend wrapperStyle={{ paddingTop: 12, fontSize: 12 }} iconType="circle" iconSize={8} />
                        <Bar dataKey="inflow" name="Inflow" fill="url(#gIn)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="outflow" name="Outflow" fill="url(#gOut)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </Box>
    );
};

export default InflowOutflowChart;
