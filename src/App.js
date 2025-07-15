// src/App.jsx
import React, {
  useState,
  useEffect,
  createContext,
  useContext
} from 'react';
import axios from 'axios';
import { Layout as AntLayout, Grid } from 'antd';
import {
  Routes,
  Route,
  Navigate,
  useLocation
} from 'react-router-dom';

import Sidebar         from './components/Sidebar';
import AppHeader       from './components/AppHeader';
import OverlayLayout   from './components/OverLayout';

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

/* ──────────────────────── axios 기본값 ──────────────────────── */
axios.defaults.withCredentials = true;          // 쿠키 전송
//axios.defaults.baseURL = import.meta.env.VITE_API_BASE || ''; // 필요 시

/* ─────────────────────── Mall Context ─────────────────────── */
const MallContext = createContext(null);
export const useMall = () => useContext(MallContext);

function MallProvider({ children }) {
  const [mallId, setMallId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 백엔드에 GET /api/me (session 상태 확인) 엔드포인트 하나 만들어 두세요
    axios
      .get('/api/me')
      .then(res => setMallId(res.data.mallId))
      .catch(() => setMallId(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40 }}>Loading...</div>;

  return (
    <MallContext.Provider value={mallId}>
      {children}
    </MallContext.Provider>
  );
}

/* ─────────────────────── 공통 레이아웃 ─────────────────────── */
const { Sider, Content } = AntLayout;
const { useBreakpoint }  = Grid;

function MainLayout() {
  const mallId          = useMall();          // 필요 시 헤더 등에 사용
  const screens         = useBreakpoint();
  const isMobile        = !screens.md;
  const [collapsed, setCollapsed] = useState(false);

  if (isMobile) {
    return (
      <OverlayLayout>
        <AppRoutes />
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
        collapsed={collapsed}
        collapsedWidth={COLLAPSED_WIDTH}
        onBreakpoint={broken => setCollapsed(broken)}
        onCollapse={setCollapsed}
        width={SIDER_WIDTH}
        style={{
          position : 'fixed',
          height   : '100vh',
          left     : 0,
          top      : 0,
          bottom   : 0,
          zIndex   : 100
        }}
      >
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(prev => !prev)}
        />
      </Sider>

      <AntLayout
        style={{
          marginLeft : collapsed ? COLLAPSED_WIDTH : SIDER_WIDTH,
          transition : 'margin-left 0.2s ease'
        }}
      >
        <AppHeader
          isMobile={false}
          mallId={mallId}
          onMenuClick={() => setCollapsed(prev => !prev)}
        />
        <Content style={{ margin: 16, padding: 16 }}>
          <AppRoutes />
        </Content>
      </AntLayout>
    </AntLayout>
  );
}

/* ─────────────────────── Route 집합 ─────────────────────── */
function AppRoutes() {
  return (
    <Routes>
      <Route index               element={<Dashboard />} />
      <Route path="dashboard"    element={<Dashboard />} />
      <Route path="event/list"   element={<EventList />} />
      <Route path="event/detail/:id" element={<EventDetail />} />
      <Route path="event/edit/:id"   element={<EventEdit />} />
      <Route path="event/create" element={<EventCreate />} />
      <Route path="reward/coupon" element={<RewardCoupon />} />
      <Route path="stats/pageview"      element={<PageView />} />
      <Route path="stats/participation" element={<Participation />} />
      <Route path="stats/environment"   element={<InflowEnvironment />} />
      <Route path="redirect" element={<RedirectPage />} />
      <Route path="*"        element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

/* ─────────────────────── 루트 자동 리다이렉트 ─────────────────────── */
function RedirectToDashboard() {
  const { search } = useLocation();
  // (설치 직후 카페24가 ?mall_id=xxx 로 열어줄 때 mallId 세션에 주입됨)
  const params     = new URLSearchParams(search);
  if (params.get('mall_id')) {
    // 쿼리스트링만 제거 → /dashboard
    return <Navigate to="/dashboard" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

/* ─────────────────────── 최상위 App ─────────────────────── */
export default function App() {
  return (
    <MallProvider>
      <Routes>
        <Route path="/"   element={<RedirectToDashboard />} />
        <Route path="/*"  element={<MainLayout />} />
      </Routes>
    </MallProvider>
  );
}
