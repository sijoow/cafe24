// src/App.js

import React, { useEffect, useState } from 'react';
import { Layout as AntLayout, Grid } from 'antd';
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useParams
} from 'react-router-dom';

import api, { setMallId } from './lib/api';

import Sidebar       from './components/Sidebar';
import AppHeader     from './components/AppHeader';
import OverlayLayout from './components/OverLayout';

import Dashboard         from './pages/Dashboard';
import EventList         from './pages/EventList';
import EventCreate       from './pages/EventCreate';
import EventDetail       from './pages/EventDetail';
import EventEdit         from './pages/EventEdit';
import RewardCoupon      from './pages/RewardCoupon';
import PageView          from './pages/PageView';
import Participation     from './pages/Participation';
import InflowEnvironment from './pages/InflowEnvironment';
import Redirect          from './pages/Redirect';

const { Sider, Content } = AntLayout;
const { useBreakpoint }  = Grid;

/**
 * (A) 루트("/") 접속 시 mall_id 쿼리를 읽어 해당 mallId/dashboard 로 리다이렉트
 */
function RedirectToMall() {
  const { search } = useLocation();
  const mallId = new URLSearchParams(search).get('mall_id') || 'onimon';
  return <Navigate to={`/${mallId}/dashboard`} replace />;
}

/**
 * (B) "/:mallId/*" 이하를 처리하는 메인 레이아웃
 */
function MainLayout() {
  const screens  = useBreakpoint();
  const isMobile = !screens.md;
  const { mallId } = useParams();
  const [collapsed, setCollapsed] = useState(false);

  // mallId가 바뀔 때마다 api 모듈에 mallId 설정
  useEffect(() => {
    setMallId(mallId);
  }, [mallId]);

  // 모바일 레이아웃
  if (isMobile) {
    return (
      <OverlayLayout>
        <Routes>
          <Route index                          element={<Dashboard />} />
          <Route path="dashboard"              element={<Dashboard />} />
          <Route path="event/list"             element={<EventList />} />
          <Route path="event/detail/:id"       element={<EventDetail />} />
          <Route path="event/edit/:id"         element={<EventEdit />} />
          <Route path="event/create"           element={<EventCreate />} />
          <Route path="reward/coupon"          element={<RewardCoupon />} />
          <Route path="stats/pageview"         element={<PageView />} />
          <Route path="stats/participation"    element={<Participation />} />
          <Route path="stats/environment"      element={<InflowEnvironment />} />
          <Route path="redirect"               element={<Redirect />} />
          <Route path="*"                       element={<Dashboard />} />
        </Routes>
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
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(prev => !prev)}
        />
      </Sider>

      <AntLayout
        style={{
          marginLeft: collapsed ? COLLAPSED_WIDTH : SIDER_WIDTH,
          transition: 'margin-left 0.2s ease',
        }}
      >
        <AppHeader
          isMobile={false}
          onMenuClick={() => setCollapsed(prev => !prev)}
        />
        <Content style={{ margin: 16, padding: 16 }}>
          <Routes>
            <Route index                          element={<Dashboard />} />
            <Route path="dashboard"              element={<Dashboard />} />
            <Route path="event/list"             element={<EventList />} />
            <Route path="event/detail/:id"       element={<EventDetail />} />
            <Route path="event/edit/:id"         element={<EventEdit />} />
            <Route path="event/create"           element={<EventCreate />} />
            <Route path="reward/coupon"          element={<RewardCoupon />} />
            <Route path="stats/pageview"         element={<PageView />} />
            <Route path="stats/participation"    element={<Participation />} />
            <Route path="stats/environment"      element={<InflowEnvironment />} />
            <Route path="redirect"               element={<Redirect />} />
            <Route path="*"                       element={<Dashboard />} />
          </Routes>
        </Content>
      </AntLayout>
    </AntLayout>
  );
}

/**
 * 최상위 App 컴포넌트
 */
export default function App() {
  return (
    <Routes>
      {/* 루트 → mall_id 쿼리 기반 리다이렉트 */}
      <Route path="/" element={<RedirectToMall />} />

      {/* mallId 하위 모든 경로 → MainLayout */}
      <Route path="/:mallId/*" element={<MainLayout />} />

      {/* 그 외는 다시 루트로 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
