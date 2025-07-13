// src/App.js
import React, { useState } from 'react';
import { Layout as AntLayout, Grid } from 'antd';
import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom';

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

export default function App() {
  const screens  = useBreakpoint();
  const isMobile = !screens.md;
  const [collapsed, setCollapsed] = useState(false);

  // 모바일에서는 토글 가능 OverlayLayout 안에 Routes를 넣되
  // 역시 최상위에 /:mallId 를 붙입니다.
  if (isMobile) {
    return (
      <BrowserRouter>
        <OverlayLayout>
          <Routes>
            <Route path="/" element={<Navigate to="/defaultMall/dashboard" replace />} />
            <Route path="/:mallId/*" element={<MobileRoutes />} />
          </Routes>
        </OverlayLayout>
      </BrowserRouter>
    );
  }

  // 데스크탑
  return (
    <BrowserRouter>
      <AntLayout style={{ minHeight: '100vh' }}>
        <Sider
          breakpoint="md"
          collapsible
          collapsedWidth={80}
          collapsed={collapsed}
          onBreakpoint={broken => setCollapsed(broken)}
          onCollapse={setCollapsed}
          width={240}
          style={{
            position: 'fixed',
            height: '100vh',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 100
          }}
        >
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
        </Sider>

        <AntLayout
          style={{
            marginLeft: collapsed ? 80 : 240,
            transition: 'margin-left 0.2s ease'
          }}
        >
          <AppHeader isMobile={false} onMenuClick={() => setCollapsed(c => !c)} />
          <Content style={{ margin: 16, padding: 16 }}>
            <Routes>
              <Route path="/" element={<Navigate to="/defaultMall/dashboard" replace />} />
              <Route path="/:mallId/*" element={<DesktopRoutes />} />
            </Routes>
          </Content>
        </AntLayout>
      </AntLayout>
    </BrowserRouter>
  );
}

function DesktopRoutes() {
  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="dashboard" element={<Dashboard />} />

      <Route path="event">
        <Route path="list"   element={<EventList />} />
        <Route path="create" element={<EventCreate />} />
        <Route path="detail/:id" element={<EventDetail />} />
        <Route path="edit/:id"   element={<EventEdit />} />
      </Route>

      <Route path="reward/coupon"    element={<RewardCoupon />} />
      <Route path="stats/pageview"      element={<PageView />} />
      <Route path="stats/participation" element={<Participation />} />
      <Route path="stats/environment"   element={<InflowEnvironment />} />

      <Route path="auth/callback" element={<Redirect />} />
      <Route path="admin"         element={<Admin />} />

      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}

function MobileRoutes() {
  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="dashboard" element={<Dashboard />} />

      <Route path="event">
        <Route path="list"   element={<EventList />} />
        <Route path="create" element={<EventCreate />} />
        <Route path="detail/:id" element={<EventDetail />} />
        <Route path="edit/:id"   element={<EventEdit />} />
      </Route>

      <Route path="reward/coupon"    element={<RewardCoupon />} />
      <Route path="stats/pageview"      element={<PageView />} />
      <Route path="stats/participation" element={<Participation />} />
      <Route path="stats/environment"   element={<InflowEnvironment />} />

      <Route path="auth/callback" element={<Redirect />} />
      <Route path="admin"         element={<Admin />} />

      <Route path="*" element={<Navigate to="dashboard" replace />} />
    </Routes>
  );
}
