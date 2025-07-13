// src/App.js
import React, { useState } from 'react';
import { Layout as AntLayout, Grid } from 'antd';
import { Routes, Route, Outlet } from 'react-router-dom';

import Sidebar      from './components/Sidebar';
import AppHeader    from './components/AppHeader';
import Dashboard    from './pages/Dashboard';
import EventList    from './pages/EventList';
import EventDetail  from './pages/EventDetail';
import EventEdit    from './pages/EventEdit';
import EventCreate  from './pages/EventCreate';
import RewardCoupon from './pages/RewardCoupon';
import PageView     from './pages/PageView';
import Participation      from './pages/Participation';
import InflowEnvironment from './pages/InflowEnvironment';
import Redirect           from './pages/Redirect';
import Admin              from './pages/Admin';
import OverlayLayout      from './components/OverLayout';

const { Sider, Content } = AntLayout;
const { useBreakpoint }  = Grid;

function DesktopLayout() {
  const screens  = useBreakpoint();
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = !screens.md;
  
  if (isMobile) return null; // 모바일은 OverlayLayout 쓸 거예요

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="md"
        collapsible
        collapsedWidth={80}
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={240}
      >
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      </Sider>
      <AntLayout style={{ marginLeft: collapsed ? 80 : 240 }}>
        <AppHeader isMobile={false} onMenuClick={() => setCollapsed(c => !c)} />
        <Content style={{ margin:16, padding:16 }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
}

export default function App() {
  const screens  = useBreakpoint();
  const isMobile = !screens.md;

  if (isMobile) {
    return (
      <OverlayLayout>
        <Routes>
          {/* 모바일은 mallId 없이 쓰시려면 여기에 따로 빼세요 */}
          <Route path=":mallId/*" element={<Outlet />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="event">
              <Route path="list" element={<EventList />} />
              <Route path="detail/:id" element={<EventDetail />} />
              <Route path="edit/:id" element={<EventEdit />} />
              <Route path="create" element={<EventCreate />} />
            </Route>
            <Route path="reward/coupon" element={<RewardCoupon />} />
            <Route path="stats">
              <Route path="pageview" element={<PageView />} />
              <Route path="participation" element={<Participation />} />
              <Route path="environment" element={<InflowEnvironment />} />
            </Route>
            <Route path="auth/callback" element={<Redirect />} />
            <Route path="admin" element={<Admin />} />
          </Route>
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </OverlayLayout>
    );
  }

  return (
    <Routes>
      <Route element={<DesktopLayout />}>
        <Route path=":mallId/*">
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="event">
            <Route path="list" element={<EventList />} />
            <Route path="detail/:id" element={<EventDetail />} />
            <Route path="edit/:id" element={<EventEdit />} />
            <Route path="create" element={<EventCreate />} />
          </Route>
          <Route path="reward/coupon" element={<RewardCoupon />} />
          <Route path="stats">
            <Route path="pageview" element={<PageView />} />
            <Route path="participation" element={<Participation />} />
            <Route path="environment" element={<InflowEnvironment />} />
          </Route>
          <Route path="auth/callback" element={<Redirect />} />
          <Route path="admin" element={<Admin />} />
        </Route>
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}
