import React, { useState } from 'react';
import { Layout as AntLayout, Grid } from 'antd';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from 'react-router-dom';

import Sidebar   from './components/Sidebar';
import AppHeader from './components/AppHeader';
import Dashboard from './pages/Dashboard';
import EventList from './pages/EventList';
import EventCreate  from './pages/EventCreate';
import EventDetail  from './pages/EventDetail';
import EventEdit    from './pages/EventEdit';
import RewardCoupon from './pages/RewardCoupon';
import PageView     from './pages/PageView';
import Participation      from './pages/Participation';
import InflowEnvironment from './pages/InflowEnvironment';
import RedirectPage      from './pages/Redirect';
import Admin             from './pages/Admin';
import OverlayLayout     from './components/OverLayout';

const { Sider, Content } = AntLayout;
const { useBreakpoint }  = Grid;

// URL 에 mallId 가 빠질 때의 기본값
const DEFAULT_MALL = 'onimon';

// :mallId/* 의 catch-all 용 컴포넌트
function MallRedirectToDashboard() {
  const { mallId } = useParams();
  return <Navigate to={`/${mallId}/dashboard`} replace />;
}

export default function App() {
  const screens  = useBreakpoint();
  const isMobile = !screens.md;
  const [collapsed, setCollapsed] = useState(false);

  const commonRoutes = (
    <>
      {/* OAuth 콜백 */}
      <Route path="/:mallId/auth/callback" element={<RedirectPage />} />

      {/* 기본 CRUD/통계 페이지들 */}
      <Route path="/:mallId/dashboard"           element={<Dashboard />} />
      <Route path="/:mallId/event/list"         element={<EventList />} />
      <Route path="/:mallId/event/create"       element={<EventCreate />} />
      <Route path="/:mallId/event/detail/:id"   element={<EventDetail />} />
      <Route path="/:mallId/event/edit/:id"     element={<EventEdit />} />

      <Route path="/:mallId/reward/coupon"      element={<RewardCoupon />} />
      <Route path="/:mallId/stats/pageview"     element={<PageView />} />
      <Route path="/:mallId/stats/participation"element={<Participation />} />
      <Route path="/:mallId/stats/environment"  element={<InflowEnvironment />} />

      <Route path="/:mallId/admin"              element={<Admin />} />

      {/* mallId 내부의 그 외 모든 경로는 mallId/dashboard 로 */}
      <Route path="/:mallId/*"                  element={<MallRedirectToDashboard />} />
    </>
  );

  return (
    <BrowserRouter>
      {isMobile ? (
        <OverlayLayout>
          <Routes>
            {/* 1) 루트 → 기본 몰 대시보드로 */}
            <Route path="/" element={<Navigate to={`/${DEFAULT_MALL}/dashboard`} replace />} />

            {/* 2) mallId 를 포함한 실제 페이지들 */}
            {commonRoutes}

            {/* 3) 그 외 루트 밖 → 기본 몰 대시보드 */}
            <Route path="*" element={<Navigate to={`/${DEFAULT_MALL}/dashboard`} replace />} />
          </Routes>
        </OverlayLayout>
      ) : (
        <AntLayout style={{ minHeight: '100vh' }}>
          <Sider
            breakpoint="md"
            collapsible
            collapsedWidth={80}
            collapsed={collapsed}
            onCollapse={setCollapsed}
            width={240}
            style={{ position: 'fixed', height: '100vh', left:0, top:0, bottom:0 }}
          >
            <Sidebar collapsed={collapsed} />
          </Sider>

          <AntLayout
            style={{
              marginLeft: collapsed ? 80 : 240,
              transition: 'margin-left .2s'
            }}
          >
            <AppHeader />

            <Content style={{ margin:16, padding:16 }}>
              <Routes>
                {/* 데스크탑도 동일한 라우트 구성 */}
                <Route path="/" element={<Navigate to={`/${DEFAULT_MALL}/dashboard`} replace />} />
                {commonRoutes}
                <Route path="*" element={<Navigate to={`/${DEFAULT_MALL}/dashboard`} replace />} />
              </Routes>
            </Content>
          </AntLayout>
        </AntLayout>
      )}
    </BrowserRouter>
  );
}
