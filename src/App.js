import React, { useState, useEffect, useRef } from 'react'; // ❗ useEffect, useRef 추가
import { Layout as AntLayout, Grid } from 'antd';
// ❗ useNavigate, useLocation 추가
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'; 

// 1. InstallationChecker를 import 합니다.
import InstallationChecker from './components/InstallationChecker';

import Sidebar from './components/Sidebar';
import AppHeader from './components/AppHeader';
import EventDetail from './pages/EventDetail';
import EventEdit from './pages/EventEdit'; 

// 각 페이지 컴포넌트
import Dashboard from './pages/Dashboard';
import EventCreate from './pages/EventCreate';
import EventList from './pages/EventList';
import PageView from './pages/PageView';
import Participation from './pages/Participation'
import InflowEnvironment from './pages/InflowEnvironment'
import OverlayLayout from './components/OverLayout';

// ❗ Redirect import는 제거합니다.
// import Redirect from './pages/Redirect' 
import Admin from './pages/Admin';
import PrdData from './pages/PrdData';


// ===================================================================
// 2. [핵심] PublicHomePage (새로운 현관문 로직)
// ===================================================================
function PublicHomePage() {
 const navigate = useNavigate();
 const { search, pathname } = useLocation(); // pathname 추가
  const ranRef = useRef(false); // 중복 실행 방지

useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

     const params = new URLSearchParams(search);
     const mallId = params.get('mall_id');  
     // [시나리오 1] 설치 직후 (URL에 mall_id가 있음)
     if (mallId) {
         try {
          localStorage.setItem('mallId', mallId);
          sessionStorage.setItem('isInstalled', 'true'); // "설치 성공!" 플래그
         } catch (e) {
          console.warn('Storage set 실패', e);
         }
         // 즉시 보호된 페이지로 보냄
         navigate('/dashboard', { replace: true });
       return; 
     }
    
    // [시나리오 2] 이미 설치한 사용자 재방문 (localStorage에 mallId가 있음)
    // (이 사용자가 '/'로 잘못 들어왔을 때)
    if(localStorage.getItem('mallId') && pathname === '/') {
       navigate('/dashboard', { replace: true });
       return;
    }

    // [시나리오 3] 비회원 (URL과 localStorage 둘 다 mallId가 없음)
    // -> 아무것도 안 하고 '환영' 페이지만 보여줌

 }, [search, navigate, pathname]);
 return (
     <div style={{ padding: 40, textAlign: 'center' }}>
      <h1>저희 앱에 오신 것을 환영합니다!</h1>
      <p>카페24 관리자 페이지에서 앱을 설치하고 로그인해주세요.</p>
     </div>
 );
}
// ===================================================================


const { Sider, Content } = AntLayout;
const { useBreakpoint } = Grid;

export default function App() {
 // ① 훅과 isMobile 계산은 컴포넌트 최상단에서
 const screens = useBreakpoint();
 const isMobile = !screens.md;
 // ② 모바일용 OverlayLayout vs 데스크탑용 AntLayout+Sidebar
 const [collapsed, setCollapsed] = useState(false);
  
  // 3. [핵심] 보호된 라우트들을 'ProtectedRoutes' 변수로 분리
  const ProtectedRoutes = (
      // InstallationChecker가 "보호된 페이지"만 감싸도록 Route로 만듭니다.
      <Route element={<InstallationChecker />}> 
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="event/list" element={<EventList />} />
          <Route path="event/detail/:id" element={<EventDetail />} />
          <Route path="event/edit/:id" element={<EventEdit />} />
          <Route path="event/create" element={<EventCreate />} />
          <Route path="stats/pageview" element={<PageView />} />
          <Route path="stats/participation" element={<Participation />} />
          <Route path="stats/environment" element={<InflowEnvironment />} />
          <Route path="stats/prddata" element={<PrdData />} />
          <Route path="admin" element={<Admin />} />
      </Route>
  );

 
 // ── 모바일: OverlayLayout ─────────────────────────────
 if (isMobile) {
  return (
     // ❗ 4. Checker를 여기서 제거합니다!
   <OverlayLayout>
    <Routes>
         {/* 5. 공개 페이지 (현관문) */}
     <Route index element={<PublicHomePage />} />
          
          {/* 6. 보호된 페이지들 */}
          {ProtectedRoutes}
          
          {/* ❗ 7. /redirect 라우트 제거 */}
          {/* <Route path="redirect" element={<Redirect />} /> */}

        {/* 8. 잘못된 경로는 공개 홈으로 */}
    <Route path="*" element={<PublicHomePage />} />
   </Routes>
  </OverlayLayout>
 );
}

// ── 데스크탑: 고정형 Sider + AntLayout ───────────────────
const SIDER_WIDTH   = 240;
const COLLAPSED_WIDTH = 80;

return (
// ❗ 4. Checker를 여기서 제거합니다!
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
        {/* 5. 공개 페이지 (현관문) */}
     <Route index element={<PublicHomePage />} />

        {/* 6. 보호된 페이지들 */}
        {ProtectedRoutes}

        {/* ❗ 7. /redirect 라우트 제거 */}
     {/* <Route path="redirect" element={<Redirect />} /> */}

        {/* 8. 잘못된 경로는 공개 홈으로 */}
      <Route path="*" element={<PublicHomePage />} />
       </Routes>
      </Content>
     </AntLayout>
    </AntLayout>
);
}
