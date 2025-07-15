// src/App.js
import React, { useEffect, useState } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate
} from 'react-router-dom';
import { Layout as AntLayout, Grid } from 'antd';

import Sidebar       from './components/Sidebar';
import AppHeader     from './components/AppHeader';
import OverlayLayout from './components/OverLayout';

import Dashboard        from './pages/Dashboard';
import EventList        from './pages/EventList';
import EventCreate      from './pages/EventCreate';
import EventDetail      from './pages/EventDetail';
import EventEdit        from './pages/EventEdit';
import RewardCoupon     from './pages/RewardCoupon';
import PageView         from './pages/PageView';
import Participation    from './pages/Participation';
import InflowEnvironment from './pages/InflowEnvironment';

const { Sider, Content } = AntLayout;
const { useBreakpoint }  = Grid;

// ─── (A) 최초 진입: 카페24가 붙여준 mall_id, user_id, user_name 읽어서 저장 → /dashboard 로 치환
function RedirectToMall() {
  const { search } = useLocation();
  const navigate  = useNavigate();

  useEffect(() => {
    const params   = new URLSearchParams(search);
    const mallId   = params.get('mall_id')   || params.get('mallId');
    const userName = params.get('user_name') || params.get('userName');
    const userId   = params.get('user_id')   || params.get('userId');

    if (mallId)   localStorage.setItem('mallId',   mallId);
    if (userName) localStorage.setItem('userName', userName);
    if (userId)   localStorage.setItem('userId',   userId);

    navigate('/dashboard', { replace: true });
  }, [search, navigate]);

  return null;
}

// ─── (B) 메인 레이아웃: mallId는 localStorage에서, URL엔 노출되지 않음
function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const screens  = useBreakpoint();
  const isMobile = !screens.md;

  // guard: 만약 localStorage에 mallId가 없으면 / 로 보내기
  const mallId = localStorage.getItem('mallId');
  if (!mallId) return <Navigate to="/" replace />;

  // ── 모바일 레이아웃
  if (isMobile) {
    return (
      <OverlayLayout collapsed={collapsed} onToggle={() => setCollapsed(p => !p)}>
        <Routes>
          <Route index                      element={<Dashboard />} />
          <Route path="dashboard"          element={<Dashboard />} />
          <Route path="event/list"         element={<EventList />} />
          <Route path="event/detail/:id"   element={<EventDetail />} />
          <Route path="event/edit/:id"     element={<EventEdit />} />
          <Route path="event/create"       element={<EventCreate />} />
          <Route path="reward/coupon"      element={<RewardCoupon />} />
          <Route path="stats/pageview"     element={<PageView />} />
          <Route path="stats/participation"element={<Participation />} />
          <Route path="stats/environment"  element={<InflowEnvironment />} />
          <Route path="*"                  element={<Dashboard />} />
        </Routes>
      </OverlayLayout>
    );
  }

  // ── 데스크탑 레이아웃
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
          zIndex: 100,
        }}
      >
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(p => !p)} />
      </Sider>

      <AntLayout
        style={{
          marginLeft: collapsed ? COLLAPSED_WIDTH : SIDER_WIDTH,
          transition: 'margin-left 0.2s ease',
        }}
      >
        <AppHeader />

        <Content style={{ margin: 16, padding: 16 }}>
          <Routes>
            <Route index                      element={<Dashboard />} />
            <Route path="dashboard"          element={<Dashboard />} />
            <Route path="event/list"         element={<EventList />} />
            <Route path="event/detail/:id"   element={<EventDetail />} />
            <Route path="event/edit/:id"     element={<EventEdit />} />
            <Route path="event/create"       element={<EventCreate />} />
            <Route path="reward/coupon"      element={<RewardCoupon />} />
            <Route path="stats/pageview"     element={<PageView />} />
            <Route path="stats/participation"element={<Participation />} />
            <Route path="stats/environment"  element={<InflowEnvironment />} />
            <Route path="*"                  element={<Dashboard />} />
          </Routes>
        </Content>
      </AntLayout>
    </AntLayout>
  );
}

// ─── (C) 최상위 App
export default function App() {
  return (
    <Routes>
      <Route path="/"   element={<RedirectToMall />} />
      <Route path="/*"  element={<MainLayout />} />
      <Route path="*"   element={<Navigate to="/" replace />} />
    </Routes>
  );
}
