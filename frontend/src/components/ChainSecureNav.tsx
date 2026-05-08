import React, { useState } from 'react';
import { AppBar, Box, IconButton, Typography, Button, Avatar, Menu, MenuItem } from '@mui/material';
import { styled } from '@mui/material/styles';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import { tokens } from '../themes';
import type { User } from '../types/api';

type NavProps = {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onShowHowWeWork: () => void;
  onShowFAQ: () => void;
  onShowHistory: () => void;
  isAuthenticated: boolean;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
};


export const PageWrapper = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: theme.palette.background.default,
  position: 'relative',
}));

const NavBar = styled(AppBar)(({ theme }) => ({
  background: theme.palette.background.default,
  borderBottom: '1px solid ' + theme.palette.divider,
  boxShadow: 'none',
}));

const NavInner = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  maxWidth: 1200,
  margin: '0 auto',
  padding: '14px 24px',
  width: '100%',
});

const LogoArea = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
});

interface StyleProps {
  isDark: boolean;
}


const LogoText = styled(Typography)<StyleProps>(({ theme }) => ({
  fontFamily: tokens.typography.display,
  fontWeight: 700,
  fontSize: '1.2rem',
  color: theme.palette.text.primary,
  letterSpacing: '-0.02em',
}));

const NavLinks = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  [theme.breakpoints.down('sm')]: { display: 'none' },
}));

const NavButton = styled(Button)<StyleProps>(({ theme }) => ({
  fontFamily: tokens.typography.body,
  fontSize: '0.85rem',
  fontWeight: 500,
  color: theme.palette.text.secondary,
  padding: '6px 12px',
  borderRadius: tokens.borderRadius.sm,
  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
  textTransform: 'none',
  '&:hover': {
    color: theme.palette.text.primary,
    background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
  },
}));

const NavDot = styled(Box)(() => ({
  width: 4,
  height: 4,
  borderRadius: '50%',
  background: tokens.colors.primary,
  opacity: 0.6,
  margin: '0 8px',
}));

const RightArea = styled(Box)({
  display: 'flex',
  alignItems: 'center',
});

const ThemeBtn = styled(IconButton)<StyleProps>(({ theme }) => ({
  color: theme.palette.text.primary,
  padding: 8,
  borderRadius: tokens.borderRadius.sm,
  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
  background: 'transparent',
  '&:hover': {
    background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
  },
}));

export const ChainSecureNav: React.FC<NavProps> = ({
  isDarkMode,
  onToggleTheme,
  onShowHowWeWork,
  onShowFAQ,
  onShowHistory,
  isAuthenticated,
  user,
  onLogin,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const getInitials = (name: string) =>
    name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <NavBar position="fixed" elevation={0}>
      <NavInner>
        <LogoArea onClick={() => navigate('/')} sx={{ cursor: 'pointer' }}>
        <Box component="img" src="/logo.png" alt="ChainSecure Logo" sx={{ width: 40, height: 40, objectFit: 'contain' }} />
        <LogoText isDark={isDarkMode}>ChainSecure</LogoText>
      </LogoArea>

      <NavLinks>
        <NavButton isDark={isDarkMode} onClick={onShowHistory}>History</NavButton>
        <NavDot />
        <NavButton isDark={isDarkMode} onClick={onShowHowWeWork}>Method</NavButton>
        <NavDot />
        <NavButton isDark={isDarkMode} onClick={onShowFAQ}>FAQ</NavButton>
      </NavLinks>

      <RightArea>
        <ThemeBtn onClick={onToggleTheme} isDark={isDarkMode}>
          {isDarkMode ? <LightModeOutlinedIcon fontSize="small" /> : <DarkModeOutlinedIcon fontSize="small" />}
        </ThemeBtn>

        {isAuthenticated && user ? (
          <>
            <IconButton
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{ ml: 1, p: 0.5, border: '2px solid rgba(96,165,250,0.4)', borderRadius: '50%', transition: 'all 0.2s ease', '&:hover': { borderColor: '#60a5fa', transform: 'scale(1.05)' } }}
            >
              <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', fontWeight: 700, background: 'linear-gradient(135deg, #2563eb, #0891b2)', color: '#fff' }}>
                {getInitials(user.name)}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              slotProps={{ paper: { sx: { mt: 1, borderRadius: '14px', minWidth: 200, boxShadow: '0 10px 40px rgba(0,0,0,0.25)' } } }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{user.name}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{user.email}</Typography>
              </Box>
              <MenuItem onClick={() => { setAnchorEl(null); onLogout(); }} sx={{ gap: 1.5, py: 1.2, color: '#ef4444' }}>
                <LogoutIcon fontSize="small" />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Sign Out</Typography>
              </MenuItem>
            </Menu>
          </>
        ) : (
          <Button onClick={onLogin} sx={{
            ml: 1, borderRadius: 2, px: 2, py: 0.6, fontWeight: 600, fontSize: '0.82rem', textTransform: 'none',
            background: 'linear-gradient(135deg, #2563eb, #0891b2)', color: '#fff',
            boxShadow: '0 2px 10px rgba(37,99,235,0.3)', transition: 'all 0.25s ease',
            '&:hover': { background: 'linear-gradient(135deg, #1d4ed8, #0e7490)', transform: 'translateY(-1px)', boxShadow: '0 4px 16px rgba(37,99,235,0.45)' },
          }}>
            <LoginIcon sx={{ fontSize: 16, mr: 0.5 }} /> Login
          </Button>
        )}
      </RightArea>
    </NavInner>
    </NavBar>
  );
};
