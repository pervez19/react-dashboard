import { NavLink } from 'react-router-dom';
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar } from '@mui/material';
import { useAuth } from '../../../shared/hooks/useAuth';
import type { NavItem } from '../../../shared/types/sharedTypes';

export const SIDE_MENU_WIDTH = 248;

interface SideMenuProps {
  items: readonly NavItem[];
  /** Mobile drawer state; on md+ the menu is always visible. */
  mobileOpen: boolean;
  onClose: () => void;
}

/** Role-aware navigation: items whose `roles` the user lacks are not rendered (the backend still enforces). */
export function SideMenu({ items, mobileOpen, onClose }: SideMenuProps) {
  const { hasAnyRole } = useAuth();
  const visible = items.filter((item) => hasAnyRole(item.roles ?? []));

  const content = (
    <nav aria-label="Dashboard">
      <List>
        {visible.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            end
            onClick={onClose}
            sx={{ mx: 1, borderRadius: 2, '&.active': { bgcolor: 'action.selected', color: 'primary.main' } }}
          >
            {item.icon && <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{item.icon}</ListItemIcon>}
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </nav>
  );

  const paper = { width: SIDE_MENU_WIDTH, boxSizing: 'border-box' } as const;
  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': paper }}
      >
        {content}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{ display: { xs: 'none', md: 'block' }, width: SIDE_MENU_WIDTH, flexShrink: 0, '& .MuiDrawer-paper': paper }}
      >
        <Toolbar />
        {content}
      </Drawer>
    </>
  );
}
