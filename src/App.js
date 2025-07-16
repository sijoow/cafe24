// src/App.js
import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate, useParams } from 'react-router-dom';
import { Layout, Grid } from 'antd';

import Sidebar           from './components/Sidebar';
import AppHeader         from './components/AppHeader';
import OverlayLayout     from './components/OverLayout';
import { MallProvider }  from './components/MallContext';

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

const { Sider, Content } = Layout;
const { useBreakpoint }  = Grid;

// “/” 접속 시 localStorage에 남아있는 mallId로 대시보드로 리다이렉트
function HomeRedirect() {
  const mallId = localStorage.getItem('mallId') || 'onimon';
  return <Navigate to={`/${mallId}/dashboard`} replace />;
}

// MainLayout 안에서 useParams로 mallId 꺼내서 Context에 반영
function MainLayoutWrapper() {
  const { mallId } = useParams();
  const navigate  = useNavigate();

  // URL 매개변수로 mallId가 바뀌면 Context도 동기화
  useEffect(() => {
    if (mallId) {
      localStorage.setItem('mallId', mallId);
    } else {
      // mallId 없으면 루트로
      navigate('/', { replace: true });
    }
  }, [mallId, navigate]);

  return <MainLayout />;
}

function MainLayout() {
  const screens  = useBreakpoint();
  const isMobile = !screens.md;
  const [collapsed, setCollapsed] = React.useState(false);

  const SIDER_WIDTH     = 240;
  const COLLAPSED_WIDTH = 80;

  const commonRoutes = (
    <>
      <Route index               element={<Dashboard />} />
      <Route path="dashboard"    element={<Dashboard />} />
      <Route path="event/list"   element={<EventList />} />
      <Route path="event/detail/:id" element={<EventDetail />} />
      <Route path="event/edit/:id"   element={<EventEdit />} />
      <Route path="event/create"      element={<EventCreate />} />
      <Route path="reward/coupon"     element={<RewardCoupon />} />
      <Route path="stats/pageview"    element={<PageView />} />
      <Route path="stats/participation" element={<Participation />} />
      <Route path="stats/environment" element={<InflowEnvironment />} />
      <Route path="*"                 element={<Dashboard />} />
    </>
  );

  if (isMobile) {
    return (
      <OverlayLayout>
        <Routes>{commonRoutes}</Routes>
      </OverlayLayout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        breakpoint="md"
        collapsible
        collapsedWidth={COLLAPSED_WIDTH}
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={SIDER_WIDTH}
        style={{ position:'fixed', height:'100vh', left:0, top:0, bottom:0 }}
      >
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} />
      </Sider>

      <Layout
        style={{
          marginLeft: collapsed ? COLLAPSED_WIDTH : SIDER_WIDTH,
          transition: 'margin-left 0.2s'
        }}
      >
        <AppHeader />
        <Content style={{ margin:16, padding:16 }}>
          <Routes>{commonRoutes}</Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default function App() {
  return (
    <MallProvider>
      <Routes>
        {/* OAuth 콜백 핸들러 */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* 루트 접근 */}
        <Route path="/" element={<HomeRedirect />} />

        {/* mallId를 URL 파라미터로 받아서 동기화 */}
        <Route path="/:mallId/*" element={<MainLayoutWrapper />} />
      </Routes>
    </MallProvider>
  );
}
