import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Grid } from 'antd';

import Sidebar from './components/Sidebar';
import AppHeader from './components/AppHeader';
import OverlayLayout from './components/OverLayout';
import { MallProvider } from './components/MallContext';

import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import EventList from './pages/EventList';
import EventCreate from './pages/EventCreate';
import EventDetail from './pages/EventDetail';
import EventEdit from './pages/EventEdit';
import RewardCoupon from './pages/RewardCoupon';
import PageView from './pages/PageView';
import Participation from './pages/Participation';
import InflowEnvironment from './pages/InflowEnvironment';
import RedirectPage from './pages/Redirect';

const { Sider, Content } = Layout;
const { useBreakpoint } = Grid;

// 루트("/") 접속 시 대시보드로 리다이렉트
function HomeRedirect() {
  return <Navigate to="/dashboard" replace />;
}

function MainLayout() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [collapsed, setCollapsed] = useState(false);

  // 모바일일 때 OverlayLayout 사용
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

  // 데스크탑 레이아웃
  const SIDER_WIDTH = 240;
  const COLLAPSED_WIDTH = 80;

  return (
    <Layout style={{ minHeight: '100vh' }}>
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
          zIndex: 100,
        }}
      >
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      </Sider>

      <Layout
        style={{
          marginLeft: collapsed ? COLLAPSED_WIDTH : SIDER_WIDTH,
          transition: 'margin-left 0.2s',
        }}
      >
        <AppHeader />
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
      </Layout>
    </Layout>
  );
}

export default function App() {
  return (
    <MallProvider>
      <Routes>
        {/* OAuth 콜백에서 mallId 받아오기 */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* 기본 경로 리다이렉트 */}
        <Route path="/" element={<HomeRedirect />} />

        {/* 나머지는 메인 레이아웃 */}
        <Route path="/*" element={<MainLayout />} />
      </Routes>
    </MallProvider>
  );
}
