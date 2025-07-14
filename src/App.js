// src/App.js
import React, { useState } from 'react';
import { Layout as AntLayout, Grid } from 'antd';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

import Sidebar      from './components/Sidebar';
import AppHeader    from './components/AppHeader';
import OverlayLayout from './components/OverLayout';

import Dashboard    from './pages/Dashboard';
import EventList    from './pages/EventList';
import EventCreate  from './pages/EventCreate';
import EventDetail  from './pages/EventDetail';
import EventEdit    from './pages/EventEdit';
import RewardCoupon from './pages/RewardCoupon';
import PageView     from './pages/PageView';
import Participation      from './pages/Participation';
import InflowEnvironment from './pages/InflowEnvironment';
import Redirect           from './pages/Redirect';
import Admin              from './pages/Admin';

const { Sider, Content } = AntLayout;
const { useBreakpoint }  = Grid;

// ** 데스크탑 전용 레이아웃 **
function DesktopLayout({ collapsed, setCollapsed }) {
  const SIDER_WIDTH     = 240;
  const COLLAPSED_WIDTH = 80;

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="md"
        collapsible
        collapsedWidth={COLLAPSED_WIDTH}
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={SIDER_WIDTH}
        style={{ position: 'fixed', height: '100vh', left: 0, top: 0, bottom: 0 }}
      >
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      </Sider>
      <AntLayout style={{
        marginLeft: collapsed ? COLLAPSED_WIDTH : SIDER_WIDTH,
        transition: 'margin-left .2s',
      }}>
        <AppHeader isMobile={false} onMenuClick={() => setCollapsed(c => !c)} />
        <Content style={{ margin: 16, padding: 16 }}>
          {/* 이 아래가 mallId 하위의 실제 페이지 컴포넌트 */}
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
}

export default function App() {
  const screens  = useBreakpoint();
  const isMobile = !screens.md;
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Routes>
      {/* 루트 → 기본 mall 으로 리다이렉트 */}
      <Route path="/" element={<Navigate to="/defaultMall/dashboard" replace />} />

      {/* mallId 공통 경로 */}
      <Route path="/:mallId" element={
        isMobile
          ? <OverlayLayout><Outlet/></OverlayLayout>
          : <DesktopLayout collapsed={collapsed} setCollapsed={setCollapsed} />
      }>
        {/* index (/defaultMall) → dashboard 로 */}
        <Route index element={<Navigate to="dashboard" replace />} />

        {/* 실제 페이지들 */}
        <Route path="dashboard"           element={<Dashboard />} />
        <Route path="event/list"          element={<EventList />} />
        <Route path="event/create"        element={<EventCreate />} />
        <Route path="event/detail/:id"    element={<EventDetail />} />
        <Route path="event/edit/:id"      element={<EventEdit />} />

        <Route path="reward/coupon"       element={<RewardCoupon />} />
        <Route path="stats/pageview"      element={<PageView />} />
        <Route path="stats/participation" element={<Participation />} />
        <Route path="stats/environment"   element={<InflowEnvironment />} />

        <Route path="auth/callback"       element={<Redirect />} />
        <Route path="admin"               element={<Admin />} />

        {/* 그 외 mallId 하위 → dashboard */}
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* 그 외 → 기본 mall/dashboard */}
      <Route path="*" element={<Navigate to="/defaultMall/dashboard" replace />} />
    </Routes>
  );
}
