/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  Card,
  CardContent,
  Alert,
  Fade,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { ChainSecureAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { tokens } from '../themes';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

type AuthTab = 'login' | 'signup';
type SignupStep = 'details' | 'otp' | 'success';

export const AuthModal: React.FC<AuthModalProps> = ({ open, onClose, isDarkMode }) => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<AuthTab>('login');
  const [signupStep, setSignupStep] = useState<SignupStep>('details');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otpCountdown, setOtpCountdown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setTab('login');
        setSignupStep('details');
        setName('');
        setEmail('');
        setPassword('');
        setOtpDigits(['', '', '', '', '', '']);
        setError(null);
        setSuccessMsg(null);
      }, 300);
    }
  }, [open]);

  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => setOtpCountdown((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return;
      const newDigits = [...otpDigits];
      newDigits[index] = value.slice(-1);
      setOtpDigits(newDigits);
      if (value && index < 5) otpRefs.current[index + 1]?.focus();
    },
    [otpDigits]
  );

  const handleOtpKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      if (e.key === 'Backspace' && !otpDigits[index] && index > 0)
        otpRefs.current[index - 1]?.focus();
    },
    [otpDigits]
  );

  const handleOtpPaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setOtpDigits(text.split(''));
      otpRefs.current[5]?.focus();
    }
  }, []);

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      setSuccessMsg('Login successful!');
      setTimeout(onClose, 800);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!name || !email || !password) { setError('Please fill in all fields.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    setError(null);
    try {
      await ChainSecureAPI.sendOtp({ email, name });
      setSignupStep('otp');
      setOtpCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async () => {
    const code = otpDigits.join('');
    if (code.length < 6) { setError('Please enter the complete 6-digit code.'); return; }
    setLoading(true);
    setError(null);
    try {
      await ChainSecureAPI.verifyOtp({ email, otp_code: code });
      await register(name, email, password);
      setSignupStep('success');
      setTimeout(onClose, 1500);
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError(null);
    try {
      await ChainSecureAPI.sendOtp({ email, name });
      setOtpCountdown(60);
      setOtpDigits(['', '', '', '', '', '']);
      setSuccessMsg('New OTP sent!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const btnSx = {
    background: isDarkMode ? tokens.colors.darkText : tokens.colors.lightText,
    color: isDarkMode ? tokens.colors.darkBg : tokens.colors.lightBg,
    borderRadius: tokens.borderRadius.md,
    fontWeight: 600,
    fontSize: '0.9rem',
    py: 1.2,
    textTransform: 'none' as const,
    fontFamily: tokens.typography.heading,
    boxShadow: 'none',
    '&:hover': {
      background: isDarkMode ? tokens.colors.darkTextSecondary : tokens.colors.lightTextSecondary,
      transform: 'none',
      boxShadow: 'none',
    },
    '&:disabled': { opacity: 0.5 },
  };

  return (
    <Fade in={open} timeout={300}>
      <Box
        sx={{
          position: 'fixed', inset: 0,
          background: isDarkMode ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 1500,
          display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2,
        }}
        onClick={onClose}
      >
        <Card
          sx={{
            maxWidth: 400, width: '100%', overflow: 'hidden',
            background: isDarkMode ? tokens.colors.darkBg : tokens.colors.lightBg,
            border: isDarkMode ? `1px solid ${tokens.colors.darkBorder}` : `1px solid ${tokens.colors.lightBorder}`,
            borderRadius: tokens.borderRadius.lg,
            boxShadow: tokens.shadows.xl,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {signupStep === 'otp' && tab === 'signup' && (
                  <IconButton size="small" onClick={() => { setSignupStep('details'); setError(null); }} sx={{ mr: 1, color: 'text.secondary' }}>
                    <ArrowBackIcon fontSize="small" />
                  </IconButton>
                )}
                <Typography variant="h6" component="span" sx={{
                  fontFamily: tokens.typography.display,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: 'text.primary',
                }}>
                  {tab === 'login' ? 'Welcome Back' : signupStep === 'details' ? 'Create Account' : signupStep === 'otp' ? 'Verify Email' : 'All Set!'}
                </Typography>
              </Box>
              <IconButton onClick={onClose} sx={{ color: 'text.secondary', p: 0.5 }}><CloseIcon /></IconButton>
            </Box>

            {/* Tabs */}
            {signupStep === 'details' && (
              <Box sx={{ 
                display: 'flex', gap: 1, mb: 4, p: 0.5, borderRadius: tokens.borderRadius.md, 
                background: isDarkMode ? tokens.colors.darkSurfaceLight : tokens.colors.lightSurfaceAlt 
              }}>
                {(['login', 'signup'] as AuthTab[]).map((t) => (
                  <Button key={t} fullWidth onClick={() => { setTab(t); setError(null); }} sx={{
                    borderRadius: tokens.borderRadius.sm, py: 0.8, fontWeight: 600, textTransform: 'none', fontSize: '0.85rem',
                    color: tab === t ? (isDarkMode ? tokens.colors.darkBg : tokens.colors.lightBg) : 'text.secondary',
                    background: tab === t ? (isDarkMode ? tokens.colors.darkText : tokens.colors.lightText) : 'transparent',
                    boxShadow: 'none',
                    '&:hover': { background: tab === t ? undefined : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)') },
                  }}>
                    {t === 'login' ? 'Login' : 'Sign Up'}
                  </Button>
                ))}
              </Box>
            )}

            {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3, borderRadius: tokens.borderRadius.sm, '& .MuiAlert-message': { fontSize: '0.85rem' } }}>{error}</Alert>}
            {successMsg && <Alert severity="success" sx={{ mb: 3, borderRadius: tokens.borderRadius.sm, '& .MuiAlert-message': { fontSize: '0.85rem' } }}>{successMsg}</Alert>}

            {/* LOGIN */}
            {tab === 'login' && (
              <Fade in timeout={300}><Box>
                <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }}
                  slotProps={{ input: { startAdornment: <EmailIcon sx={{ mr: 1.5, color: 'text.secondary', fontSize: 18 }} /> } }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
                <TextField fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 4 }}
                  slotProps={{ input: { startAdornment: <LockIcon sx={{ mr: 1.5, color: 'text.secondary', fontSize: 18 }} /> } }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
                <Button fullWidth variant="contained" onClick={handleLogin} disabled={loading} sx={btnSx}>
                  {loading ? <CircularProgress size={20} sx={{ color: isDarkMode ? tokens.colors.darkBg : tokens.colors.lightBg }} /> : 'Login'}
                </Button>
              </Box></Fade>
            )}

            {/* SIGNUP STEP 1 */}
            {tab === 'signup' && signupStep === 'details' && (
              <Fade in timeout={300}><Box>
                <TextField fullWidth label="Full Name" value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }}
                  slotProps={{ input: { startAdornment: <PersonIcon sx={{ mr: 1.5, color: 'text.secondary', fontSize: 18 }} /> } }} />
                <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }}
                  slotProps={{ input: { startAdornment: <EmailIcon sx={{ mr: 1.5, color: 'text.secondary', fontSize: 18 }} /> } }} />
                <TextField fullWidth label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  helperText="Minimum 6 characters" sx={{ mb: 4 }}
                  slotProps={{ input: { startAdornment: <LockIcon sx={{ mr: 1.5, color: 'text.secondary', fontSize: 18 }} /> } }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()} />
                <Button fullWidth variant="contained" onClick={handleSendOtp} disabled={loading} sx={btnSx}>
                  {loading ? <CircularProgress size={20} sx={{ color: isDarkMode ? tokens.colors.darkBg : tokens.colors.lightBg }} /> : 'Send Verification Code'}
                </Button>
              </Box></Fade>
            )}

            {/* SIGNUP STEP 2 — OTP */}
            {tab === 'signup' && signupStep === 'otp' && (
              <Fade in timeout={300}><Box>
                <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary', textAlign: 'center', lineHeight: 1.6 }}>
                  We've sent a 6-digit code to <br/><strong>{email}</strong>
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 4 }}>
                  {otpDigits.map((digit, i) => (
                    <Box key={i} component="input"
                      ref={(el: HTMLInputElement | null) => { otpRefs.current[i] = el; }}
                      type="text" inputMode="numeric" maxLength={1}
                      value={digit}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleOtpKeyDown(i, e)}
                      onPaste={i === 0 ? handleOtpPaste : undefined}
                      sx={{
                        width: 44, height: 52, borderRadius: tokens.borderRadius.md,
                        border: isDarkMode ? `1px solid ${tokens.colors.darkBorder}` : `1px solid ${tokens.colors.lightBorder}`,
                        background: isDarkMode ? tokens.colors.darkSurfaceLight : tokens.colors.lightSurfaceAlt,
                        color: isDarkMode ? tokens.colors.darkText : tokens.colors.lightText,
                        fontSize: '1.25rem', fontWeight: 600, textAlign: 'center', outline: 'none',
                        fontFamily: tokens.typography.mono, transition: 'all 0.2s ease',
                        '&:focus': { borderColor: tokens.colors.primary, borderWidth: '2px' },
                      }}
                    />
                  ))}
                </Box>
                <Button fullWidth variant="contained" onClick={handleVerifyAndRegister}
                  disabled={loading || otpDigits.some((d) => !d)} sx={{ ...btnSx, mb: 3 }}>
                  {loading ? <CircularProgress size={20} sx={{ color: isDarkMode ? tokens.colors.darkBg : tokens.colors.lightBg }} /> : 'Verify & Create Account'}
                </Button>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>Didn't receive the code?</Typography>
                  <Button size="small" onClick={handleResendOtp} disabled={loading || otpCountdown > 0}
                    sx={{ textTransform: 'none', fontWeight: 600, color: 'text.primary', '&:disabled': { color: 'text.secondary' } }}>
                    {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : 'Resend Code'}
                  </Button>
                </Box>
              </Box></Fade>
            )}

            {/* SIGNUP STEP 3 — SUCCESS */}
            {tab === 'signup' && signupStep === 'success' && (
              <Fade in timeout={500}>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CheckCircleIcon sx={{ fontSize: 56, color: tokens.colors.success, mb: 2 }} />
                  <Typography variant="h6" sx={{ fontFamily: tokens.typography.heading, fontWeight: 700, mb: 1 }}>Account Created</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>Welcome to ChainSecure, {name}. You're now signed in.</Typography>
                </Box>
              </Fade>
            )}
          </CardContent>
        </Card>
      </Box>
    </Fade>
  );
};

export default AuthModal;
