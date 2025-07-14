// src/App.js
import React, { useState } from 'react';
import { Layout as AntLayout, Grid } from 'antd';
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useParams
} from 'react-router-dom';

import Sidebar   from './components/Sidebar';
import AppHeader from './components/AppHeader';
import OverlayLayout      from './components/OverLayout';

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

// ─── (A) 루트("/") 접근 시 mall_id 쿼리 읽고 해당 mallId/dashboard 로 리다이렉트
function RedirectToMall() {
  const { search } = useLocation();
  const mallId = new URLSearchParams(search).get('mall_id') || 'onimon';
  return <Navigate to={`/${mallId}/dashboard`} replace />;
}

// ─── (B) "/:mallId/*" 하위 라우트를 모두 처리하는 레이아웃
function MainLayout() {
  const screens  = useBreakpoint();
  const isMobile = !screens.md;
  const { mallId } = useParams();
  const [collapsed, setCollapsed] = useState(false);

  // (1) 모바일 레이아웃
  if (isMobile) {
    return (
      <OverlayLayout>
        <Routes>
          <Route path="auth/callback"      element={<Redirect />} />
          <Route path="dashboard"          element={<Dashboard />} />
          <Route path="event/list"         element={<EventList />} />
          <Route path="event/create"       element={<EventCreate />} />
          <Route path="event/detail/:id"   element={<EventDetail />} />
          <Route path="event/edit/:id"     element={<EventEdit />} />
          <Route path="reward/coupon"      element={<RewardCoupon />} />
          <Route path="stats/pageview"     element={<PageView />} />
          <Route path="stats/participation"element={<Participation />} />
          <Route path="stats/environment"  element={<InflowEnvironment />} />
          <Route path="admin"              element={<Admin />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </OverlayLayout>
    );
  }

  // (2) 데스크탑 레이아웃
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
      >
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      </Sider>
      <AntLayout
        style={{
          marginLeft: collapsed ? COLLAPSED_WIDTH : SIDER_WIDTH,
          transition: 'margin-left 0.2s'
        }}
      >
        <AppHeader />
        <Content style={{ margin: 16, padding: 16 }}>
          <Routes>
            <Route path="auth/callback"      element={<Redirect />} />
            <Route path="dashboard"          element={<Dashboard />} />
            <Route path="event/list"         element={<EventList />} />
            <Route path="event/create"       element={<EventCreate />} />
            <Route path="event/detail/:id"   element={<EventDetail />} />
            <Route path="event/edit/:id"     element={<EventEdit />} />
            <Route path="reward/coupon"      element={<RewardCoupon />} />
            <Route path="stats/pageview"     element={<PageView />} />
            <Route path="stats/participation"element={<Participation />} />
            <Route path="stats/environment"  element={<InflowEnvironment />} />
            <Route path="admin"              element={<Admin />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </Content>
      </AntLayout>
    </AntLayout>
  );
}

// ─── 최상위 App: "/" 는 RedirectToMall, "/:mallId/*" 는 MainLayout, 그 외는 다시 "/"
export default function App() {
  return (
    <Routes>
      <Route path="/"       element={<RedirectToMall />} />
      <Route path="/:mallId/*" element={<MainLayout />} />
      <Route path="*"       element={<Navigate to="/" replace />} />
    </Routes>
  );
}
