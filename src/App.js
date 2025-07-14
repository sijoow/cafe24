import React, { useState } from 'react';
import { Layout as AntLayout, Grid } from 'antd';
import { Routes, Route, Navigate } from 'react-router-dom';

import Sidebar   from './components/Sidebar';
import AppHeader from './components/AppHeader';
import Dashboard from './pages/Dashboard';
import EventList from './pages/EventList';
import EventCreate  from './pages/EventCreate';
import EventDetail  from './pages/EventDetail';
import EventEdit    from './pages/EventEdit';
import RewardCoupon from './pages/RewardCoupon';
import PageView     from './pages/PageView';
import Participation      from './pages/Participation';
import InflowEnvironment from './pages/InflowEnvironment';
import RedirectPage      from './pages/Redirect';
import Admin             from './pages/Admin';
import OverlayLayout     from './components/OverLayout';

const { Sider, Content } = AntLayout;
const { useBreakpoint }  = Grid;

// 기본으로 사용할 몰 아이디
const DEFAULT_MALL = 'onimon';

export default function App() {
  const screens  = useBreakpoint();
  const isMobile = !screens.md;
  const [collapsed, setCollapsed] = useState(false);

  // ─── 모바일 레이아웃 ───────────────────────────
  if (isMobile) {
    return (
      <OverlayLayout>
        <Routes>
          {/* 아무 파라미터 없이 들어오면 기본 몰로 리다이렉트 */}
          <Route index element={<Navigate to={`/${DEFAULT_MALL}/dashboard`} replace />} />

          {/* :mallId 하위로 모든 라우트 묶기 */}
          <Route path=":mallId">
            <Route path="auth/callback" element={<RedirectPage />} />

            <Route path="dashboard" element={<Dashboard />} />
            <Route path="event/list"   element={<EventList />} />
            <Route path="event/create" element={<EventCreate />} />
            <Route path="event/detail/:id" element={<EventDetail />} />
            <Route path="event/edit/:id"   element={<EventEdit />} />

            <Route path="reward/coupon"       element={<RewardCoupon />} />
            <Route path="stats/pageview"       element={<PageView />} />
            <Route path="stats/participation" element={<Participation />} />
            <Route path="stats/environment"   element={<InflowEnvironment />} />

            <Route path="admin" element={<Admin />} />

            {/* 정의된 게 아니면 mallId/dashboard 로 상대 리다이렉트 */}
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* 그 외 → 기본 몰의 dashboard */}
          <Route path="*" element={<Navigate to={`/${DEFAULT_MALL}/dashboard`} replace />} />
        </Routes>
      </OverlayLayout>
    );
  }

  // ─── 데스크탑 레이아웃 ─────────────────────────
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
        style={{ position: 'fixed', height: '100vh', left:0, top:0, bottom:0 }}
      >
        <Sidebar collapsed={collapsed} />
      </Sider>

      <AntLayout style={{
        marginLeft: collapsed ? COLLAPSED_WIDTH : SIDER_WIDTH,
        transition: 'margin-left .2s'
      }}>
        <AppHeader />
        <Content style={{ margin:16, padding:16 }}>
          <Routes>
            <Route index element={<Navigate to={`/${DEFAULT_MALL}/dashboard`} replace />} />
            <Route path=":mallId">
              <Route path="auth/callback" element={<RedirectPage />} />

              <Route path="dashboard" element={<Dashboard />} />
              <Route path="event/list"   element={<EventList />} />
              <Route path="event/create" element={<EventCreate />} />
              <Route path="event/detail/:id" element={<EventDetail />} />
              <Route path="event/edit/:id"   element={<EventEdit />} />

              <Route path="reward/coupon"       element={<RewardCoupon />} />
              <Route path="stats/pageview"       element={<PageView />} />
              <Route path="stats/participation" element={<Participation />} />
              <Route path="stats/environment"   element={<InflowEnvironment />} />

              <Route path="admin" element={<Admin />} />

              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>

            <Route path="*" element={<Navigate to={`/${DEFAULT_MALL}/dashboard`} replace />} />
          </Routes>
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
