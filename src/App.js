// src/App.js
import React, { useState } from 'react';
import { Layout as AntLayout, Grid } from 'antd';
import { Routes, Route, Navigate } from 'react-router-dom';

import Sidebar from './components/Sidebar';
import AppHeader from './components/AppHeader';
import OverlayLayout from './components/OverlayLayout';

import Redirect from './pages/Redirect';
import Dashboard from './pages/Dashboard';
import EventList from './pages/EventList';
import EventCreate from './pages/EventCreate';
import EventDetail from './pages/EventDetail';
import EventEdit from './pages/EventEdit';
import RewardCoupon from './pages/RewardCoupon';
import PageView from './pages/PageView';
import Participation from './pages/Participation';
import InflowEnvironment from './pages/InflowEnvironment';
import Admin from './pages/Admin';

const { Sider, Content } = AntLayout;
const { useBreakpoint } = Grid;

function MainLayout() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [collapsed, setCollapsed] = useState(false);

  // localStorage에서 mallId 꺼내기
  const mallId = localStorage.getItem('mallId');
  if (!mallId) {
    return <Navigate to="/redirect" replace />;
  }

  // 모바일 전용 레이아웃
  if (isMobile) {
    return (
      <OverlayLayout>
        <Routes>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="event/list" element={<EventList />} />
          <Route path="event/create" element={<EventCreate />} />
          <Route path="event/detail/:id" element={<EventDetail />} />
          <Route path="event/edit/:id" element={<EventEdit />} />
          <Route path="reward/coupon" element={<RewardCoupon />} />
          <Route path="stats/pageview" element={<PageView />} />
          <Route path="stats/participation" element={<Participation />} />
          <Route path="stats/environment" element={<InflowEnvironment />} />
          <Route path="admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </OverlayLayout>
    );
  }

  // 데스크탑 레이아웃
  const SIDER_WIDTH = 240;
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
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(prev => !prev)} />
      </Sider>

      <AntLayout
        style={{
          marginLeft: collapsed ? COLLAPSED_WIDTH : SIDER_WIDTH,
          transition: 'margin-left 0.2s ease',
        }}
      >
        <AppHeader isMobile={false} onMenuClick={() => setCollapsed(prev => !prev)} />
        <Content style={{ margin: 16, padding: 16 }}>
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="event/list" element={<EventList />} />
            <Route path="event/create" element={<EventCreate />} />
            <Route path="event/detail/:id" element={<EventDetail />} />
            <Route path="event/edit/:id" element={<EventEdit />} />
            <Route path="reward/coupon" element={<RewardCoupon />} />
            <Route path="stats/pageview" element={<PageView />} />
            <Route path="stats/participation" element={<Participation />} />
            <Route path="stats/environment" element={<InflowEnvironment />} />
            <Route path="admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </Content>
      </AntLayout>
    </AntLayout>
  );
}

export default function App() {
  return (
    <Routes>
      {/* OAuth 콜백 후 mallId 저장 및 대시보드 이동 */}
      <Route path="/redirect" element={<Redirect />} />
      {/* 나머지 모든 경로 */}
      <Route path="/*" element={<MainLayout />} />
    </Routes>
  );
}
