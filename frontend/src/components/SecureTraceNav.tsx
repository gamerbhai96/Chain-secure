import { AppBar, Toolbar, Box, Button, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

type SecureTraceNavProps = {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onShowHowWeWork: () => void;
  onShowFAQ: () => void;
  onShowHistory: () => void;
};

export const SecureTraceNav: React.FC<SecureTraceNavProps> = ({
  isDarkMode,
  onToggleTheme,
  onShowHowWeWork,
  onShowFAQ,
  onShowHistory,
}) => (
  <NavBar position="static" elevation={0}>
    <Toolbar
      disableGutters
      sx={{
        width: '100%',
        px: { xs: 2, md: 3 },
        py: { xs: 0.7, md: 1 },
        justifyContent: 'center',
      }}
    >
      <HeaderRow>
        <LogoBox src="/logo copy.png" alt="BitScan logo" />

        <Shell>
          <NavButton onClick={onShowHowWeWork}>How we work</NavButton>
          <NavButton onClick={onShowFAQ}>FAQ</NavButton>
          <NavButton onClick={onShowHistory}>Scan history</NavButton>
        </Shell>

        <ToggleButton onClick={onToggleTheme} aria-label="Toggle theme">
          {isDarkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
        </ToggleButton>
      </HeaderRow>
    </Toolbar>
  </NavBar>
);

const NavBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#0d1629' : '#f8fafc',
  backgroundImage: theme.palette.mode === 'dark'
    ? `radial-gradient(ellipse at top left, rgba(79, 141, 245, 0.16) 0%, transparent 55%), radial-gradient(ellipse at bottom right, rgba(14, 116, 144, 0.14) 0%, transparent 60%), linear-gradient(rgba(37, 99, 235, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(37, 99, 235, 0.08) 1px, transparent 1px)`
    : `radial-gradient(ellipse at center, rgba(59, 130, 246, 0.08) 0%, transparent 65%), linear-gradient(rgba(37, 99, 235, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(37, 99, 235, 0.05) 1px, transparent 1px)` ,
  backgroundSize: '100% 100%, 100% 100%, 80px 80px, 80px 80px',
  boxShadow: 'none',
  position: 'relative',
  zIndex: theme.zIndex.appBar,
}));

const HeaderRow = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: theme.breakpoints.values.lg,
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto',
  alignItems: 'center',
  gap: theme.spacing(3),
  margin: '0 auto',
}));

const LogoBox = styled('img')(({ theme }) => ({
  width: 72,
  height: 'auto',
  filter: 'drop-shadow(0 6px 16px rgba(59, 130, 246, 0.28))',
  [theme.breakpoints.up('md')]: {
    width: 86,
  },
}));

const Shell = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2.5),
  width: 'fit-content',
  padding: theme.spacing(0.75, 2),
  borderRadius: 9999, // rounded-full
  background: theme.palette.mode === 'dark' 
    ? 'rgba(17, 24, 39, 0.92)' 
    : 'rgba(255, 255, 255, 0.9)',
  justifySelf: 'center',
  border: theme.palette.mode === 'dark'
    ? '1.5px solid rgba(82, 97, 115, 0.5)'
    : '1.5px solid rgba(212, 222, 238, 0.7)',
  boxShadow: theme.palette.mode === 'dark'
    ? '0 10px 24px rgba(15, 23, 42, 0.28)'
    : '0 12px 24px rgba(15, 23, 42, 0.12)',
  backdropFilter: 'blur(12px)',
}));

const NavButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(0.4, 0),
  minWidth: 'auto',
  borderRadius: 0,
  fontWeight: 500,
  letterSpacing: '0.01em',
  textTransform: 'none',
  fontSize: '0.9rem',
  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.85)',
  '&:hover': {
    background: 'transparent',
    color: theme.palette.mode === 'dark' ? '#fff' : '#000',
  },
}));

const ToggleButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.85)',
  background: 'transparent',
  borderRadius: 8,
  padding: theme.spacing(0.65),
  transition: 'all 0.2s ease',
  '&:hover': {
    background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
  },
}));
