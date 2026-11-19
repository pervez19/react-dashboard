import { Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import DashboardIcon from '@mui/icons-material/SpaceDashboardOutlined';
import AdminIcon from '@mui/icons-material/AdminPanelSettingsOutlined';
import DocsIcon from '@mui/icons-material/MenuBookOutlined';
import { Navbar } from '../core/components/Navbar/Navbar';
import { SideMenu } from '../core/components/SideMenu/SideMenu';
import { Footer } from '../core/components/Footer/Footer';
import { Spinner } from '../shared/components/Spinner/Spinner';
import { Role } from '../core/enums/RoleEnum';
import { ROUTES } from '../core/constants/appConstants';
import type { NavItem } from '../shared/types/sharedTypes';

const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Overview', to: ROUTES.DASHBOARD, icon: <DashboardIcon /> },
  { label: 'Project docs', to: ROUTES.DOCS, icon: <DocsIcon /> },
  { label: 'Administration', to: ROUTES.ADMIN, icon: <AdminIcon />, roles: [Role.ADMIN, Role.SUPER_ADMIN] },
];

/** Authenticated area: top bar + role-aware side menu. Rendered only behind AuthGuard. */
export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ position: 'relative', zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Navbar onMenuClick={() => setMobileOpen(true)} />
      </Box>
      <Box sx={{ display: 'flex', flex: 1 }}>
        <SideMenu items={NAV_ITEMS} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <Box component="main" id="main" sx={{ flex: 1, p: { xs: 2, md: 4 } }}>
            <Suspense fallback={<Spinner fullArea />}>
              <Outlet />
            </Suspense>
          </Box>
          <Footer />
        </Box>
      </Box>
    </Box>
  );
}
