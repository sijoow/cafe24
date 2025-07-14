// src/App.js
import React, { useState } from 'react';
import { Layout as AntLayout, Grid } from 'antd';
import { Routes, Route, Navigate } from 'react-router-dom';

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

export default function App() {
  const screens     = useBreakpoint();
  const isMobile    = !screens.md;
  const [collapsed, setCollapsed] = useState(false);

  // OAuth 콜백에서 저장된 mallId
  const savedMallId = localStorage.getItem('mallId');
  // 없다면 빈 문자열 → Navigate 시 "/" 로
  const defaultRedirect = savedMallId ? `/${savedMallId}/dashboard` : '/';

  // ── 모바일 레이아웃 ───────────────────────────────────────
  if (isMobile) {
    return (
      <OverlayLayout>
        <Routes>
          {/* 기본 경로 접속 시 실제 mallId 대시보드로 */}
          <Route index element={<Navigate to={defaultRedirect} replace />} />

          {/* mallId 기반 경로 */}
          <Route path=":mallId/dashboard"           element={<Dashboard />} />
          <Route path=":mallId/event/list"         element={<EventList />} />
          <Route path=":mallId/event/create"       element={<EventCreate />} />
          <Route path=":mallId/event/detail/:id"   element={<EventDetail />} />
          <Route path=":mallId/event/edit/:id"     element={<EventEdit />} />

          <Route path=":mallId/reward/coupon"      element={<RewardCoupon />} />
          <Route path=":mallId/stats/pageview"     element={<PageView />} />
          <Route path=":mallId/stats/participation"element={<Participation />} />
          <Route path=":mallId/stats/environment"  element={<InflowEnvironment />} />

          <Route path=":mallId/auth/callback"      element={<Redirect />} />
          <Route path=":mallId/admin"              element={<Admin />} />

          {/* 그 외 모든 경로 → 기본 mallId 대시보드 */}
          <Route path="*" element={<Navigate to={defaultRedirect} replace />} />
        </Routes>
      </OverlayLayout>
    );
  }

  // ── 데스크탑 레이아웃 ─────────────────────────────────────
  const SIDER_WIDTH     = 240;
  const COLLAPSED_WIDTH = 80;

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="md"
        collapsible
        collapsedWidth={COLLAPSED_WIDTH}
        collapsed={collapsed}
        onBreakpoint={broken => setCollapsed(broken)}
        onCollapse={setCollapsed}
        width={SIDER_WIDTH}
        style={{
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      </Sider>

      <AntLayout
        style={{
          marginLeft: collapsed ? COLLAPSED_WIDTH : SIDER_WIDTH,
          transition: 'margin-left 0.2s ease',
        }}
      >
        <AppHeader isMobile={false} onMenuClick={() => setCollapsed(c => !c)} />
        <Content style={{ margin: 16, padding: 16 }}>
          <Routes>
            {/* 기본 경로 접속 시 mallId 대시보드로 */}
            <Route index element={<Navigate to={defaultRedirect} replace />} />

            {/* mallId 기반 경로 */}
            <Route path=":mallId/dashboard"           element={<Dashboard />} />
            <Route path=":mallId/event/list"         element={<EventList />} />
            <Route path=":mallId/event/create"       element={<EventCreate />} />
            <Route path=":mallId/event/detail/:id"   element={<EventDetail />} />
            <Route path=":mallId/event/edit/:id"     element={<EventEdit />} />

            <Route path=":mallId/reward/coupon"      element={<RewardCoupon />} />
            <Route path=":mallId/stats/pageview"     element={<PageView />} />
            <Route path=":mallId/stats/participation"element={<Participation />} />
            <Route path=":mallId/stats/environment"  element={<InflowEnvironment />} />

            <Route path=":mallId/auth/callback"      element={<Redirect />} />
            <Route path=":mallId/admin"              element={<Admin />} />

            {/* 그 외 모든 경로 → mallId 대시보드 */}
            <Route path="*" element={<Navigate to={defaultRedirect} replace />} />
          </Routes>
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
