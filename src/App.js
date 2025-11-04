import React, { useState, useEffect, useRef } from 'react';
import { Layout as AntLayout, Grid } from 'antd';
import { Routes, Route, useNavigate, useLocation, Outlet } from 'react-router-dom'; 
// ❗ Outlet, useEffect, useRef, useNavigate, useLocation 모두 import

// ❗ InstallationChecker import를 삭제합니다.
// import InstallationChecker from './components/InstallationChecker';

import Sidebar from './components/Sidebar';
import AppHeader from './components/AppHeader';
import EventDetail from './pages/EventDetail';
import EventEdit from './pages/EventEdit'; 
import Dashboard from './pages/Dashboard';
import EventCreate from './pages/EventCreate';
import EventList from './pages/EventList';
import PageView from './pages/PageView';
import Participation from './pages/Participation';
import InflowEnvironment from './pages/InflowEnvironment';
import OverlayLayout from './components/OverLayout';
import Admin from './pages/Admin';
import PrdData from './pages/PrdData';
import api from './axios'; // ❗ api import 추가


// ===================================================================
// 1. [핵심] "문지기" 역할을 하는 'AuthLayout' 컴포넌트
// (기존 InstallationChecker의 역할)
// ===================================================================
function AuthLayout() {
  // [상태] 'checking'(검사중), 'ready'(준비됨), 'error'(오류)
  const [status, setStatus] = useState(() => {
    // 페이지 이동/새로고침 시 "깜빡임" 방지
  	if (sessionStorage.getItem('isInstalled') === 'true') {
    	return 'ready';
  	}
  	return 'checking';
  });
  const [error, setError] = useState(null);
  const isChecking = useRef(false);

  useEffect(() => {
    // 'ready' 또는 'error' 상태이면, 더 이상 검사 안 함 (깜빡임 방지)
    if (status === 'ready' || status === 'error') {
      return;
    }
    
  	if (isChecking.current) return;

  	const checkInstallation = async () => {
  	  isChecking.current = true;
  	   
  	  try {
  	    const mallId = localStorage.getItem('mallId');
  	     
  	    if (!mallId) {
          // 비회원(GUEST)이 보호된 페이지로 접근 시도
  	      setError({ 
  	        title: '접근 권한이 없습니다.', 
  	        message: '이 페이지는 앱이 설치된 사용자만 접근할 수 있습니다.' 
  	      });
  	      setStatus('error');
          isChecking.current = false;
  	      return;
  	    }

        // [경쟁 상태 해결]
        // "설치됐나요?"라고 묻기 전에 1초간 기다려줍니다.
        // (백엔드 DB 쓰기 시간을 벌어줌)
        await new Promise(resolve => setTimeout(resolve, 1000)); 

  	    const { data } = await api.get(`/api/${mallId}/mall`);

  	    if (data?.installed) {
  	      sessionStorage.setItem('isInstalled', 'true'); // 성공 플래그 저장
  	      setStatus('ready');
  	    } else if (data?.installUrl) {
  	      // (재시도 후에도) 진짜 설치 안 됨
  	      window.top.location.replace(data.installUrl);
  	    } else {
  	      setError({ title: '설치 확인 실패', message: '서버 응답이 올바르지 않습니다.' });
  	      setStatus('error');
  	    }
  	  } catch (err) {
  	    console.error("[AuthLayout] 설치 확인 중 API 에러 발생", err);
  	    setError({ title: '서버 연결 오류', message: 'API 서버에 연결할 수 없습니다.' });
  	    setStatus('error');
  	  }
      isChecking.current = false;
  	};

  	checkInstallation();
  }, [status]); 

  // --- 상태에 따라 다른 화면을 렌더링 ---
  if (status === 'checking') {
  	return <div>앱 설치 상태를 확인하는 중입니다...</div>;
  }

  if (status === 'error') {
    // ❗ 에러 표시 컴포넌트
  	return (
      <div style={{ padding: 40, textAlign: 'center', color: '#d93026' }}>
        <h3>{error.title}</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  // status === 'ready'일 때만 자식 라우트(<Outlet />)를 렌더링
  return <Outlet />;
}
// ===================================================================


// ===================================================================
// 2. [핵심] PublicHomePage (새로운 현관문 로직)
// ===================================================================
function PublicHomePage() {
  const navigate = useNavigate();
  const { search, pathname } = useLocation();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

  	const params = new URLSearchParams(search);
  	const mallId = params.get('mall_id');

  	// [시나리오 1] 설치 직후 (URL에 mall_id가 있음)
  	if (mallId) {
  	  try {
  	    localStorage.setItem('mallId', mallId);
        // ❗ [경쟁 상태 해결]
        // ❗ 여기서 'isInstalled' 플래그를 "저장하지 않습니다."
        // ❗ AuthLayout이 1초 후 직접 검사하고 저장하도록 유도합니다.
  	    // sessionStorage.setItem('isInstalled', 'true'); 
  	  } catch (e) {
  	    console.warn('Storage set 실패', e);
  	  }
  	  // 즉시 보호된 페이지로 보냄
  	  navigate('/dashboard', { replace: true });
      return; 
  	}
    
    // [시나리오 2] 이미 설치한 사용자 재방문 (localStorage에 mallId가 있음)
    if(localStorage.getItem('mallId') && pathname === '/') {
       navigate('/dashboard', { replace: true });
       return;
    }

    // [시나리오 3] 비회원 (GUEST)
    // -> '환영' 페이지만 보여줌 (이전과 동일)

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
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [collapsed, setCollapsed] = useState(false);
  
  // 3. [핵심] 보호된 라우트들을 'ProtectedRoutes' 변수로 분리
  const ProtectedRoutes = (
      // ❗ '문지기'가 <AuthLayout />으로 변경되었습니다.
      <Route element={<AuthLayout />}> 
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
      <OverlayLayout>
        <Routes>
          <Route index element={<PublicHomePage />} />
          {ProtectedRoutes}
          <Route path="*" element={<PublicHomePage />} />
        </Routes>
      </OverlayLayout>
    );
  }

  // ── 데스크탑: 고정형 Sider + AntLayout ───────────────────
  const SIDER_WIDTH      = 240;
  const COLLAPSED_WIDTH  = 80;

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
  	 	 	<Route index element={<PublicHomePage />} />
            {ProtectedRoutes}
  	 	 	<Route path="*" element={<PublicHomePage />} />
  	 	  </Routes>
  	 	</Content>
  	  </AntLayout>
  	</AntLayout>
  );
}
