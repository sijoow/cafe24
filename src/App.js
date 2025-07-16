// src/App.js
import React, { useState } from 'react';
import { Layout as AntLayout, Grid } from 'antd';
import {
  Routes,
  Route,
  Navigate,
  useLocation
} from 'react-router-dom';

// 전역 axios 설정
import './axios';


import Sidebar       from './components/Sidebar';
import AppHeader     from './components/AppHeader';
import OverlayLayout from './components/OverLayout';

import AuthCallback      from './pages/AuthCallback';
import Dashboard         from './pages/Dashboard';
import EventList         from './pages/EventList';
import EventCreate       from './pages/EventCreate';
import EventDetail       from './pages/EventDetail';
import EventEdit         from './pages/EventEdit';
import RewardCoupon      from './pages/RewardCoupon';
import PageView          from './pages/PageView';
import Participation     from './pages/Participation';
import InflowEnvironment from './pages/InflowEnvironment';
import RedirectPage      from './pages/Redirect';

const { Sider, Content } = AntLayout;
const { useBreakpoint }  = Grid;

// 루트("/") → /dashboard 로 리다이렉트
function HomeRedirect() {
  return <Navigate to="/dashboard" replace />;
}

function MainLayout() {
  const screens  = useBreakpoint();
  const isMobile = !screens.md;
  const [collapsed, setCollapsed] = useState(false);

  if (isMobile) {
    return (
      <OverlayLayout>
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="event/list" element={<EventList />} />
          <Route path="event/detail/:id" element={<EventDetail />} />
          <Route path="event/edit/:id" element={<EventEdit />} />
          <Route path="event/create" element={<EventCreate />} />
          <Route path="reward/coupon" element={<RewardCoupon />} />
          <Route path="stats/pageview" element={<PageView />} />
          <Route path="stats/participation" element={<Participation />} />
          <Route path="stats/environment" element={<InflowEnvironment />} />
          <Route path="redirect" element={<RedirectPage />} />
          <Route path="*" element={<Dashboard />} />
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
        onBreakpoint={broken => setCollapsed(broken)}
        onCollapse={setCollapsed}
        width={SIDER_WIDTH}
        style={{
          position: 'fixed',
          height: '100vh',
          left: 0, top: 0, bottom: 0,
          zIndex: 100
        }}
      >
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      </Sider>

      <AntLayout
        style={{
          marginLeft: collapsed ? COLLAPSED_WIDTH : SIDER_WIDTH,
          transition: 'margin-left 0.2s'
        }}
      >
        <AppHeader isMobile={false} onMenuClick={() => setCollapsed(v => !v)} />
        <Content style={{ margin: 16, padding: 16 }}>
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="event/list" element={<EventList />} />
            <Route path="event/detail/:id" element={<EventDetail />} />
            <Route path="event/edit/:id" element={<EventEdit />} />
            <Route path="event/create" element={<EventCreate />} />
            <Route path="reward/coupon" element={<RewardCoupon />} />
            <Route path="stats/pageview" element={<PageView />} />
            <Route path="stats/participation" element={<Participation />} />
            <Route path="stats/environment" element={<InflowEnvironment />} />
            <Route path="redirect" element={<RedirectPage />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </Content>
      </AntLayout>
    </AntLayout>
  );
}

export default function App() {
  return (
    <Routes>
      {/* OAuth 콜백에서 mallId 를 받아 저장 */}
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* 루트로 들어오면 대시보드로 */}
      <Route path="/" element={<HomeRedirect />} />

      {/* 메인 레이아웃 (mallId 없이!) */}
      <Route path="/*" element={<MainLayout />} />
    </Routes>
  );
}
