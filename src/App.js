// src/App.jsx  (혹은 src/index에서 임포트하는 App.js 대체)
import React, { useState, useEffect } from 'react';
import { Layout as AntLayout, Grid } from 'antd';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';

import Sidebar   from './components/Sidebar';
import AppHeader from './components/AppHeader';
import EventDetail from './pages/EventDetail';
import EventEdit    from './pages/EventEdit';

// 각 페이지 컴포넌트
import Dashboard          from './pages/Dashboard';
import EventCreate        from './pages/EventCreate';
import EventList          from './pages/EventList';

import PageView           from  './pages/PageView';
import Participation      from  './pages/Participation';
//유입환경
import InflowEnvironment from './pages/InflowEnvironment';

//모바일 메뉴 환경
import OverlayLayout from './components/OverLayout';

//리다이렉트 페이지
import Redirect from './pages/Redirect';
import Admin    from './pages/Admin';
import PrdData from './pages/PrdData';

const { Sider, Content } = AntLayout;
const { useBreakpoint } = Grid;

export default function App() {
  // 라우터 훅
  const navigate = useNavigate();
  const location = useLocation();

  // ① 훅과 isMobile 계산은 컴포넌트 최상단에서
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  // 사이드바 상태
  const [collapsed, setCollapsed] = useState(false);

  // ---------------------------
  // 초기 URL 체크: mall_id / state 가 있으면
  // 한 번만 '/redirect'로 이동시킨다.
  // ---------------------------
  useEffect(() => {
    try {
      const search = location.search || '';
      if (!search) return;

      const params = new URLSearchParams(search);
      const mallId = params.get('mall_id') || params.get('state');
      if (!mallId) return;

      // 이미 처리한 mallId인지 체크 (세션 스코프)
      const handledKey = 'onimon_handled_mall';
      const lastHandled = sessionStorage.getItem(handledKey);

      // 이미 처리했거나 현재 경로이거나, 리다이렉트 페이지 자체라면 하지 않음
      if (lastHandled === mallId) {
        return;
      }
      if (location.pathname === '/redirect' || location.pathname === '/auth/callback') {
        // Redirect.jsx 는 자체로 mall 처리 / API 호출을 하니까 여기서는 건너뜀
        return;
      }

      // 처리 표시 (세션스토리지) — 네비게이션 전에 표시해두어 루프 방지
      sessionStorage.setItem(handledKey, mallId);

      // '/redirect'로 이동 (쿼리 보존)
      // Redirect.jsx가 쿼리를 읽어 백엔드 확인 / 설치 분기 수행
      navigate(`/redirect${search}`, { replace: true });
    } catch (err) {
      console.warn('[App] initial mall_id redirect error', err);
    }
    // location.search 포함해서 한 번만 실행(검색 변경시 다시 실행)
  }, [location, navigate]);

  // ── 모바일: OverlayLayout ─────────────────────────────
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
          <Route path="stats/pageview"     element={<PageView />} />
          <Route path="stats/participation" element={<Participation />} />
          <Route path="stats/environment" element={<InflowEnvironment />} />
          <Route path="redirect"  element={<Redirect />} />
          <Route path="stats/prddata"  element={<PrdData />} />
          <Route path="admin" element={<Admin    />} />
          <Route path="*" element={<Dashboard />} />
        </Routes>
      </OverlayLayout>
    );
  }

  // ── 데스크탑: 고정형 Sider + AntLayout ───────────────────
  const SIDER_WIDTH      = 240;
  const COLLAPSED_WIDTH  = 80;

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
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="event/list" element={<EventList />} />
            <Route path="event/detail/:id" element={<EventDetail />} />
            <Route path="event/edit/:id" element={<EventEdit />} />
            <Route path="event/create" element={<EventCreate />} />
            <Route path="stats/pageview"     element={<PageView />} />
            <Route path="stats/participation" element={<Participation />} />
            <Route path="stats/environment" element={<InflowEnvironment />} />
            <Route path="stats/environment" element={<InflowEnvironment />} />
            {/* 콜백/리다이렉트 처리 컴포넌트 */}
            <Route path="/auth/callback" element={<Redirect />} />
            <Route path="redirect" element={<Redirect />} />
            <Route path="admin" element={<Admin    />} />
            <Route path="stats/prddata"  element={<PrdData />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
