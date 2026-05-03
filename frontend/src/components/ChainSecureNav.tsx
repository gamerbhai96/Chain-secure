import { AppBar, Box, IconButton, Typography, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import { useNavigate } from 'react-router-dom';
import { tokens } from '../themes';

type NavProps = {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onShowHowWeWork: () => void;
  onShowFAQ: () => void;
  onShowHistory: () => void;
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
}) => {
  const navigate = useNavigate();

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
      </RightArea>
    </NavInner>
    </NavBar>
  );
};
