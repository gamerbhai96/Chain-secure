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
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { ChainSecureAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { tokens } from '../themes';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

type AuthTab = 'login' | 'signup' | 'forgot_password';
type SignupStep = 'details' | 'otp' | 'success';
type ForgotStep = 'email' | 'reset' | 'success';

export const AuthModal: React.FC<AuthModalProps> = ({ open, onClose, isDarkMode }) => {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<AuthTab>('login');
  const [signupStep, setSignupStep] = useState<SignupStep>('details');
  const [forgotStep, setForgotStep] = useState<ForgotStep>('email');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otpCountdown, setOtpCountdown] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const passwordEndAdornment = (
    <IconButton
      size="small"
      onClick={() => setShowPassword(!showPassword)}
      edge="end"
      sx={{ color: 'text.secondary', mr: 0.5 }}
    >
      {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
    </IconButton>
  );

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setTab('login');
        setSignupStep('details');
        setForgotStep('email');
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
      if (tab === 'forgot_password') {
        await ChainSecureAPI.sendResetOtp({ email });
      } else {
        await ChainSecureAPI.sendOtp({ email, name });
      }
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

  const handleSendResetOtp = async () => {
    if (!email) { setError('Please enter your email.'); return; }
    setLoading(true);
    setError(null);
    try {
      await ChainSecureAPI.sendResetOtp({ email });
      setForgotStep('reset');
      setOtpCountdown(60);
      setOtpDigits(['', '', '', '', '', '']);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const code = otpDigits.join('');
    if (code.length < 6) { setError('Please enter the complete 6-digit code.'); return; }
    if (!password || password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    setError(null);
    try {
      await ChainSecureAPI.resetPassword({ email, otp_code: code, new_password: password });
      setForgotStep('success');
      setTimeout(() => { setTab('login'); setForgotStep('email'); setPassword(''); setOtpDigits(['', '', '', '', '', '']); }, 2000);
    } catch (err: any) {
      setError(err.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const btnSx = {
    background: tokens.colors.primary,
    color: '#fff',
    borderRadius: '12px',
    fontWeight: 700,
    fontSize: '1rem',
    py: 1.5,
    textTransform: 'none' as const,
    fontFamily: tokens.typography.heading,
    boxShadow: `0 8px 16px ${tokens.colors.primary}40`,
    transition: 'all 0.2s',
    '&:hover': {
      background: '#2563eb',
      transform: 'translateY(-2px)',
      boxShadow: `0 12px 20px ${tokens.colors.primary}60`,
    },
    '&:active': { transform: 'translateY(0)' },
    '&:disabled': { opacity: 0.6, background: tokens.colors.primary, transform: 'none', boxShadow: 'none' },
  };

  return (
    <Fade in={open} timeout={300}>
      <Box
        sx={{
          position: 'fixed', inset: 0,
          background: isDarkMode ? 'rgba(15, 23, 42, 0.7)' : 'rgba(241, 245, 249, 0.7)',
          backdropFilter: 'blur(16px)',
          zIndex: 1500,
          display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2,
        }}
        onClick={onClose}
      >
        {/* Animated Background Blobs */}
        <Box sx={{
          position: 'absolute', width: 400, height: 400, borderRadius: '50%',
          background: `radial-gradient(circle, ${tokens.colors.primary} 0%, transparent 70%)`,
          opacity: 0.15, filter: 'blur(60px)',
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }} />

        <Card
          sx={{
            maxWidth: 440, width: '100%', overflow: 'hidden', position: 'relative',
            background: isDarkMode ? 'rgba(30, 41, 59, 0.65)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(24px)',
            border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
            borderRadius: '24px',
            boxShadow: isDarkMode ? '0 25px 50px -12px rgba(0,0,0,0.5)' : '0 25px 50px -12px rgba(0,0,0,0.1)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <CardContent sx={{ p: { xs: 4, sm: 5 } }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {((signupStep === 'otp' && tab === 'signup') || (forgotStep === 'reset' && tab === 'forgot_password') || tab === 'forgot_password') && (
                  <IconButton size="small" onClick={() => { 
                    if (tab === 'forgot_password' && forgotStep === 'email') { setTab('login'); }
                    else if (tab === 'forgot_password' && forgotStep === 'reset') { setForgotStep('email'); }
                    else { setSignupStep('details'); } 
                    setError(null); 
                  }} sx={{ mr: 1, color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}>
                    <ArrowBackIcon fontSize="small" />
                  </IconButton>
                )}
                <Typography variant="h5" component="span" sx={{
                  fontFamily: tokens.typography.display,
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  color: isDarkMode ? '#fff' : '#1e293b',
                }}>
                  {tab === 'login' ? 'Welcome Back' : tab === 'forgot_password' ? (forgotStep === 'email' ? 'Reset Password' : forgotStep === 'reset' ? 'Set New Password' : 'Password Reset') : signupStep === 'details' ? 'Create Account' : signupStep === 'otp' ? 'Verify Email' : 'All Set!'}
                </Typography>
              </Box>
              <IconButton onClick={onClose} sx={{ color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }}><CloseIcon /></IconButton>
            </Box>

            {/* Tabs */}
            {signupStep === 'details' && tab !== 'forgot_password' && (
              <Box sx={{ 
                display: 'flex', gap: 1, mb: 4, p: 0.5, borderRadius: '12px', 
                background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.04)'
              }}>
                {(['login', 'signup'] as AuthTab[]).map((t) => (
                  <Button key={t} fullWidth onClick={() => { setTab(t); setError(null); }} sx={{
                    borderRadius: '10px', py: 1, fontWeight: 600, textTransform: 'none', fontSize: '0.85rem',
                    color: tab === t ? (isDarkMode ? '#fff' : '#000') : (isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'),
                    background: tab === t ? (isDarkMode ? 'rgba(255,255,255,0.1)' : '#fff') : 'transparent',
                    boxShadow: tab === t && !isDarkMode ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                    transition: 'all 0.2s',
                    '&:hover': { background: tab === t ? undefined : (isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)') },
                  }}>
                    {t === 'login' ? 'Login' : 'Sign Up'}
                  </Button>
                ))}
              </Box>
            )}

            {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3, borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', '& .MuiAlert-icon': { color: '#ef4444' } }}>{error}</Alert>}
            {successMsg && <Alert severity="success" sx={{ mb: 3, borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', '& .MuiAlert-icon': { color: '#10b981' } }}>{successMsg}</Alert>}

            {/* LOGIN */}
            {tab === 'login' && (
              <Fade in timeout={400}><Box>
                <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }}
                  slotProps={{ input: { startAdornment: <EmailIcon sx={{ mr: 1.5, color: 'text.secondary', fontSize: 20 }} /> } }}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()} variant="outlined" />
                <Box sx={{ mb: 4 }}>
                  <TextField fullWidth label="Password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                    slotProps={{ input: { startAdornment: <LockIcon sx={{ mr: 1.5, color: 'text.secondary', fontSize: 20 }} />, endAdornment: passwordEndAdornment } }}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()} variant="outlined" />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <Button size="small" onClick={() => { setTab('forgot_password'); setError(null); }} sx={{ textTransform: 'none', color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', fontWeight: 600, fontSize: '0.75rem', '&:hover': { color: tokens.colors.primary } }}>Forgot Password?</Button>
                  </Box>
                </Box>
                <Button fullWidth variant="contained" onClick={handleLogin} disabled={loading} sx={btnSx}>
                  {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Login to Dashboard'}
                </Button>
              </Box></Fade>
            )}

            {/* SIGNUP STEP 1 */}
            {tab === 'signup' && signupStep === 'details' && (
              <Fade in timeout={400}><Box>
                <TextField fullWidth label="Full Name" value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2 }}
                  slotProps={{ input: { startAdornment: <PersonIcon sx={{ mr: 1.5, color: 'text.secondary', fontSize: 20 }} /> } }} />
                <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }}
                  slotProps={{ input: { startAdornment: <EmailIcon sx={{ mr: 1.5, color: 'text.secondary', fontSize: 20 }} /> } }} />
                <TextField fullWidth label="Password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  helperText="Minimum 6 characters" sx={{ mb: 4 }}
                  slotProps={{ input: { startAdornment: <LockIcon sx={{ mr: 1.5, color: 'text.secondary', fontSize: 20 }} />, endAdornment: passwordEndAdornment } }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()} />
                <Button fullWidth variant="contained" onClick={handleSendOtp} disabled={loading} sx={btnSx}>
                  {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Continue'}
                </Button>
              </Box></Fade>
            )}

            {/* SIGNUP STEP 2 — OTP */}
            {tab === 'signup' && signupStep === 'otp' && (
              <Fade in timeout={400}><Box>
                <Typography variant="body2" sx={{ mb: 4, color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'text.secondary', textAlign: 'center', lineHeight: 1.6 }}>
                  We've sent a 6-digit code to <br/><strong>{email}</strong>
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', mb: 4 }}>
                  {otpDigits.map((digit, i) => (
                    <Box key={i} component="input"
                      ref={(el: HTMLInputElement | null) => { otpRefs.current[i] = el; }}
                      type="text" inputMode="numeric" maxLength={1}
                      value={digit}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleOtpKeyDown(i, e)}
                      onPaste={i === 0 ? handleOtpPaste : undefined}
                      sx={{
                        width: 48, height: 56, borderRadius: '12px',
                        border: isDarkMode ? `1px solid rgba(255,255,255,0.1)` : `1px solid rgba(0,0,0,0.1)`,
                        background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                        color: isDarkMode ? '#fff' : '#000',
                        fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', outline: 'none',
                        fontFamily: tokens.typography.mono, transition: 'all 0.2s ease',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                        '&:focus': { borderColor: tokens.colors.primary, background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff', boxShadow: `0 0 0 3px ${tokens.colors.primary}30` },
                      }}
                    />
                  ))}
                </Box>
                <Button fullWidth variant="contained" onClick={handleVerifyAndRegister}
                  disabled={loading || otpDigits.some((d) => !d)} sx={{ ...btnSx, mb: 3 }}>
                  {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Verify & Create Account'}
                </Button>
                <Divider sx={{ my: 3, borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }} />
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'text.secondary', mb: 1, display: 'block' }}>Didn't receive the code?</Typography>
                  <Button size="small" onClick={handleResendOtp} disabled={loading || otpCountdown > 0}
                    sx={{ textTransform: 'none', fontWeight: 600, color: tokens.colors.primary, '&:disabled': { color: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' } }}>
                    {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : 'Resend Code'}
                  </Button>
                </Box>
              </Box></Fade>
            )}

            {/* SIGNUP STEP 3 — SUCCESS */}
            {tab === 'signup' && signupStep === 'success' && (
              <Fade in timeout={500}>
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <CheckCircleIcon sx={{ fontSize: 64, color: tokens.colors.success, mb: 3 }} />
                  <Typography variant="h5" sx={{ fontFamily: tokens.typography.heading, fontWeight: 800, mb: 1.5, color: isDarkMode ? '#fff' : '#000' }}>Account Created</Typography>
                  <Typography variant="body1" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'text.secondary' }}>Welcome to ChainSecure, {name}. You're now signed in.</Typography>
                </Box>
              </Fade>
            )}

            {/* FORGOT PASSWORD STEP 1 — EMAIL */}
            {tab === 'forgot_password' && forgotStep === 'email' && (
              <Fade in timeout={400}><Box>
                <Typography variant="body2" sx={{ mb: 4, color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'text.secondary', lineHeight: 1.6 }}>
                  Enter your email address and we'll send you a 6-digit code to reset your password.
                </Typography>
                <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 4 }}
                  slotProps={{ input: { startAdornment: <EmailIcon sx={{ mr: 1.5, color: 'text.secondary', fontSize: 20 }} /> } }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendResetOtp()} variant="outlined" />
                <Button fullWidth variant="contained" onClick={handleSendResetOtp} disabled={loading} sx={btnSx}>
                  {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Send Reset Code'}
                </Button>
              </Box></Fade>
            )}

            {/* FORGOT PASSWORD STEP 2 — RESET */}
            {tab === 'forgot_password' && forgotStep === 'reset' && (
              <Fade in timeout={400}><Box>
                <Typography variant="body2" sx={{ mb: 4, color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'text.secondary', textAlign: 'center', lineHeight: 1.6 }}>
                  We've sent a 6-digit code to <br/><strong>{email}</strong>
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', mb: 4 }}>
                  {otpDigits.map((digit, i) => (
                    <Box key={i} component="input"
                      ref={(el: HTMLInputElement | null) => { otpRefs.current[i] = el; }}
                      type="text" inputMode="numeric" maxLength={1}
                      value={digit}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => handleOtpKeyDown(i, e)}
                      onPaste={i === 0 ? handleOtpPaste : undefined}
                      sx={{
                        width: 48, height: 56, borderRadius: '12px',
                        border: isDarkMode ? `1px solid rgba(255,255,255,0.1)` : `1px solid rgba(0,0,0,0.1)`,
                        background: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
                        color: isDarkMode ? '#fff' : '#000',
                        fontSize: '1.5rem', fontWeight: 700, textAlign: 'center', outline: 'none',
                        fontFamily: tokens.typography.mono, transition: 'all 0.2s ease',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
                        '&:focus': { borderColor: tokens.colors.primary, background: isDarkMode ? 'rgba(255,255,255,0.05)' : '#fff', boxShadow: `0 0 0 3px ${tokens.colors.primary}30` },
                      }}
                    />
                  ))}
                </Box>
                <TextField fullWidth label="New Password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  helperText="Minimum 6 characters" sx={{ mb: 4 }}
                  slotProps={{ input: { startAdornment: <LockIcon sx={{ mr: 1.5, color: 'text.secondary', fontSize: 20 }} />, endAdornment: passwordEndAdornment } }}
                  onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()} variant="outlined" />
                <Button fullWidth variant="contained" onClick={handleResetPassword}
                  disabled={loading || otpDigits.some((d) => !d) || password.length < 6} sx={{ ...btnSx, mb: 3 }}>
                  {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Reset Password'}
                </Button>
                <Divider sx={{ my: 3, borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }} />
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'text.secondary', mb: 1, display: 'block' }}>Didn't receive the code?</Typography>
                  <Button size="small" onClick={handleResendOtp} disabled={loading || otpCountdown > 0}
                    sx={{ textTransform: 'none', fontWeight: 600, color: tokens.colors.primary, '&:disabled': { color: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' } }}>
                    {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : 'Resend Code'}
                  </Button>
                </Box>
              </Box></Fade>
            )}

            {/* FORGOT PASSWORD STEP 3 — SUCCESS */}
            {tab === 'forgot_password' && forgotStep === 'success' && (
              <Fade in timeout={500}>
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <CheckCircleIcon sx={{ fontSize: 64, color: tokens.colors.success, mb: 3 }} />
                  <Typography variant="h5" sx={{ fontFamily: tokens.typography.heading, fontWeight: 800, mb: 1.5, color: isDarkMode ? '#fff' : '#000' }}>Password Reset!</Typography>
                  <Typography variant="body1" sx={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'text.secondary' }}>Your password has been changed successfully.</Typography>
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
