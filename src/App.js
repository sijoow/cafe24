import React, { useState } from 'react';
import { Layout as AntLayout, Grid } from 'antd';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';

import Sidebar          from './components/Sidebar';
import AppHeader        from './components/AppHeader';
import Dashboard        from './pages/Dashboard';
import EventList        from './pages/EventList';
import EventCreate      from './pages/EventCreate';
import EventDetail      from './pages/EventDetail';
import EventEdit        from './pages/EventEdit';
import RewardCoupon     from './pages/RewardCoupon';
import PageView         from './pages/PageView';
import Participation    from './pages/Participation';
import InflowEnvironment from './pages/InflowEnvironment';
import Redirect         from './pages/Redirect';
import Admin            from './pages/Admin';
import OverlayLayout    from './components/OverLayout';

const { Sider, Content } = AntLayout;
const { useBreakpoint }  = Grid;

// ─── 공통 레이아웃 컴포넌트 ─────────────────────────────
function MainLayout() {
  const screens  = useBreakpoint();
  const isMobile = !screens.md;
  const [collapsed, setCollapsed] = useState(false);

  // 모바일이면 OverlayLayout + Outlet
  if (isMobile) {
    return (
      <OverlayLayout>
        <AppHeader isMobile onMenuClick={() => setCollapsed(c => !c)} />
        <Outlet />
      </OverlayLayout>
    );
  }

  // 데스크탑 레이아웃
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
        style={{ position:'fixed', height:'100vh', left:0, top:0, bottom:0 }}
      >
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      </Sider>
      <AntLayout
        style={{
          marginLeft: collapsed ? COLLAPSED_WIDTH : SIDER_WIDTH,
          transition: 'margin-left .2s'
        }}
      >
        <AppHeader isMobile={false} onMenuClick={() => setCollapsed(c => !c)} />
        <Content style={{ margin:16, padding:16 }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
}

// ─── 최상위 라우트 ─────────────────────────────────────
export default function App() {
  return (
    <Routes>
      {/* 루트 접속 시 기본 매장(onimon) 대시보드로 보내기 */}
      <Route path="/" element={<Navigate to="/onimon/dashboard" replace />} />

      {/* 모든 :mallId 하위는 MainLayout 으로 감싸서 Outlet 사용 */}
      <Route path="/:mallId" element={<MainLayout />}>
        {/* /:mallId → /:mallId/dashboard */}
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard"        element={<Dashboard />} />
        <Route path="event/list"       element={<EventList />} />
        <Route path="event/create"     element={<EventCreate />} />
        <Route path="event/detail/:id" element={<EventDetail />} />
        <Route path="event/edit/:id"   element={<EventEdit />} />
        <Route path="reward/coupon"    element={<RewardCoupon />} />
        <Route path="stats/pageview"   element={<PageView />} />
        <Route path="stats/participation" element={<Participation />} />
        <Route path="stats/environment"   element={<InflowEnvironment />} />
        <Route path="auth/callback"    element={<Redirect />} />
        <Route path="admin"            element={<Admin />} />
        {/* :mallId 하위에서 다른 모든 경로는 dashboard 로 리다이렉트 */}
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Route>

      {/* 그 외(틀린 URL 등)는 기본 onimon/dashboard 로 */}
      <Route path="*" element={<Navigate to="/onimon/dashboard" replace />} />
    </Routes>
  );
}
