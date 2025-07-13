// src/App.js
import React, { useState } from 'react';
import { Layout as AntLayout, Grid } from 'antd';
import { Routes, Route } from 'react-router-dom';

import Sidebar      from './components/Sidebar';
import AppHeader    from './components/AppHeader';
import EventDetail  from './pages/EventDetail';  // ← 오타 수정
import EventEdit    from './pages/EventEdit';
import Dashboard    from './pages/Dashboard';
import EventCreate  from './pages/EventCreate';
import EventList    from './pages/EventList';
import RewardCoupon from './pages/RewardCoupon';
import PageView     from './pages/PageView';
import Participation      from './pages/Participation';
import InflowEnvironment from './pages/InflowEnvironment';
import Redirect           from './pages/Redirect';
import Admin              from './pages/Admin';
import OverlayLayout      from './components/OverLayout';

const { Sider, Content } = AntLayout;
const { useBreakpoint }  = Grid;

export default function App() {
  const screens  = useBreakpoint();
  const isMobile = !screens.md;
  const [collapsed, setCollapsed] = useState(false);

  // 모바일일 때
  if (isMobile) {
    return (
      <OverlayLayout>
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* mallId 파라미터 추가 */}
          <Route path=":mallId/event/list"   element={<EventList />} />
          <Route path=":mallId/event/detail/:id" element={<EventDetail />} />
          <Route path=":mallId/event/edit/:id"   element={<EventEdit />} />
          <Route path=":mallId/event/create"     element={<EventCreate />} />

          <Route path="reward/coupon"    element={<RewardCoupon />} />
          <Route path="stats/pageview"     element={<PageView />} />
          <Route path="stats/participation" element={<Participation />} />
          <Route path="stats/environment"   element={<InflowEnvironment />} />
          <Route path="redirect"         element={<Redirect />} />
          <Route path="admin"            element={<Admin />} />

          <Route path="*" element={<Dashboard />} />
        </Routes>
      </OverlayLayout>
    );
  }

  // 데스크탑일 때
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
        style={{ position: 'fixed', height: '100vh', left: 0, top: 0, bottom: 0, zIndex: 100 }}
      >
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      </Sider>

      <AntLayout style={{ marginLeft: collapsed ? COLLAPSED_WIDTH : SIDER_WIDTH, transition: 'margin-left .2s' }}>
        <AppHeader isMobile={false} onMenuClick={() => setCollapsed(c => !c)} />
        <Content style={{ margin: 16, padding: 16 }}>
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* mallId 파라미터 추가 */}
            <Route path=":mallId/event/list"     element={<EventList />} />
            <Route path=":mallId/event/detail/:id" element={<EventDetail />} />
            <Route path=":mallId/event/edit/:id"   element={<EventEdit />} />
            <Route path=":mallId/event/create"     element={<EventCreate />} />

            <Route path="reward/coupon"    element={<RewardCoupon />} />
            <Route path="stats/pageview"     element={<PageView />} />
            <Route path="stats/participation" element={<Participation />} />
            <Route path="stats/environment"   element={<InflowEnvironment />} />

            <Route path="/auth/callback" element={<Redirect />} />
            <Route path="admin"         element={<Admin />} />

            <Route path="*" element={<Dashboard />} />
          </Routes>
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
