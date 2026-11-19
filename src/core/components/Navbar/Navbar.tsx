import { useState, type MouseEvent } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  AppBar, Avatar, Box, Divider, IconButton, ListItemIcon, Menu, MenuItem, Stack, Toolbar, Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeIcon from '@mui/icons-material/LightModeOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/SpaceDashboardOutlined';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useTheme } from '../../../shared/hooks/useTheme';
import { Button } from '../../../shared/components/Button/Button';
import { TooltipPopup } from '../TooltipPopup/TooltipPopup';
import { ButtonType } from '../../enums/ButtonTypeEnum';
import { APP_NAME, ROUTES } from '../../constants/appConstants';
import { getInitials } from '../../utils/commonUtils';

interface NavbarProps {
  /** When provided, a menu button is shown on small screens (opens the SideMenu). */
  onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const { resolvedMode, toggle } = useTheme();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const closeMenu = () => setAnchor(null);

  return (
    <AppBar position="sticky" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Toolbar component="nav" aria-label="Main">
        {onMenuClick && (
          <IconButton edge="start" aria-label="Open navigation menu" onClick={onMenuClick} sx={{ mr: 1, display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>
        )}
        <Typography
          variant="h6"
          component={RouterLink}
          to={ROUTES.HOME}
          sx={{ color: 'inherit', textDecoration: 'none', fontWeight: 700, flexGrow: 1 }}
        >
          {APP_NAME}
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <TooltipPopup content={resolvedMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            <IconButton onClick={toggle} aria-label="Toggle colour theme">
              {resolvedMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </TooltipPopup>

          {isAuthenticated && user ? (
            <>
              <IconButton
                onClick={(e: MouseEvent<HTMLElement>) => setAnchor(e.currentTarget)}
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={!!anchor}
              >
                <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14 }}>{getInitials(user.name)}</Avatar>
              </IconButton>
              <Menu anchorEl={anchor} open={!!anchor} onClose={closeMenu}>
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography fontWeight={600}>{user.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{user.email}</Typography>
                </Box>
                <Divider />
                <MenuItem component={RouterLink} to={ROUTES.DASHBOARD} onClick={closeMenu}>
                  <ListItemIcon><DashboardIcon fontSize="small" /></ListItemIcon>
                  Dashboard
                </MenuItem>
                <MenuItem
                  disabled={isLoading}
                  onClick={() => {
                    closeMenu();
                    void logout();
                  }}
                >
                  <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                  Sign out
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button kind={ButtonType.TEXT} component={RouterLink} to={ROUTES.LOGIN}>Sign in</Button>
              <Button component={RouterLink} to={ROUTES.REGISTER} sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                Create account
              </Button>
            </>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
