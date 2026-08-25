import { NavLink, Route, Routes } from 'react-router-dom';
import Header from '../../components/common/Header.jsx';
import InventoryManager from './components/InventoryManager.jsx';
import MenuEditor from './components/MenuEditor.jsx';
import SalesReports from './components/SalesReports.jsx';
import UserAccessControl from './components/UserAccessControl.jsx';

const TABS = [
  { path: '', label: 'Sales', element: <SalesReports /> },
  { path: 'menu', label: 'Menu', element: <MenuEditor /> },
  { path: 'inventory', label: 'Inventory', element: <InventoryManager /> },
  { path: 'users', label: 'Access Control', element: <UserAccessControl /> },
];

/** Owner-only admin area: menu editing, inventory, sales reports, and staff access control. */
export default function AdminPanelPage() {
  return (
    <div>
      <Header title="Admin Panel" />
      <nav style={{ display: 'flex', gap: '1rem', padding: '0.75rem 1rem', borderBottom: '1px solid #ddd' }}>
        {TABS.map((tab) => (
          <NavLink key={tab.path} to={`/admin/${tab.path}`} end={tab.path === ''}>
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Routes>
        {TABS.map((tab) => (
          <Route key={tab.path} path={tab.path} element={tab.element} />
        ))}
      </Routes>
    </div>
  );
}
