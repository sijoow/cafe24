// src/App.js

import React, { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate
} from 'react-router-dom';
import { Layout as AntLayout, Grid } from 'antd';

import Sidebar            from './components/Sidebar';
import AppHeader          from './components/AppHeader';
import OverlayLayout      from './components/OverLayout';

import Dashboard          from './pages/Dashboard';
import EventList          from './pages/EventList';
import EventCreate        from './pages/EventCreate';
import EventDetail        from './pages/EventDetail';
import EventEdit          from './pages/EventEdit';
import RewardCoupon       from './pages/RewardCoupon';
import PageView           from './pages/PageView';
import Participation      from './pages/Participation';
import InflowEnvironment  from './pages/InflowEnvironment';
import RedirectPage       from './pages/Redirect';

const { Sider, Content } = AntLayout;
const { useBreakpoint }  = Grid;

// ─── InitMall: URL 쿼리(mall_id, user_id, user_name) 있으면 저장 후 제거
function InitMall({ children }) {
  const { search, pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params   = new URLSearchParams(search);
    const mallId   = params.get('mall_id')   || params.get('mallId');
    const userId   = params.get('user_id')   || params.get('userId');
    const userName = params.get('user_name') || params.get('userName');

    if (mallId) {
      localStorage.setItem('mallId', mallId);
      if (userId)   localStorage.setItem('userId',   userId);
      if (userName) localStorage.setItem('userName', userName);
      // 쿼리 제거
      navigate(pathname, { replace: true });
    }
  }, [search, pathname, navigate]);

  return children;
}

// ─── MainLayout: 모든 서브 라우트 처리
function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const screens  = useBreakpoint();
  const isMobile = !screens.md;

  // (선택) mallId 없으면 루트로
  // const mallId = localStorage.getItem('mallId');
  // if (!mallId) return <Navigate to="/" replace />;

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
          <Route path="redirect"           element={<RedirectPage />} />
          <Route path="*"                  element={<Dashboard />} />
        </Routes>
      </OverlayLayout>
    );
  }

  const SIDER_WIDTH     = 240;
  const COLLAPSED_WIDTH = 80;

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="md"
        collapsible
        collapsedWidth={COLLAPSED_WIDTH}
        collapsed={collapsed}
        onBreakpoint={b => setCollapsed(b)}
        onCollapse={setCollapsed}
        width={SIDER_WIDTH}
        style={{
          position: 'fixed',
          height: '100vh',
          left: 0, top: 0, bottom: 0,
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
        <AppHeader onMenuClick={() => setCollapsed(p => !p)} />

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
            <Route path="redirect"           element={<RedirectPage />} />
            <Route path="*"                  element={<Dashboard />} />
          </Routes>
        </Content>
      </AntLayout>
    </AntLayout>
  );
}

// ─── App: InitMall 으로 둘러싸고, 최상위 라우팅 설정
export default function App() {
  return (
    <BrowserRouter>
      <InitMall>
        <Routes>
          {/* 첫 진입 콜백 처리 */}
          <Route path="/" element={<RedirectPage />} />

          {/* 나머지 모든 경로 */}
          <Route path="/*" element={<MainLayout />} />

          {/* 매칭 안 되면 / */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </InitMall>
    </BrowserRouter>
  );
}
