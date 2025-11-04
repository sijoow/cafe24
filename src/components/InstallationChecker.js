// src/components/InstallationChecker.jsx (sessionStorage 확인 최종본)

import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import api from '../axios';

// (ErrorDisplay 컴포넌트는 그대로 둡니다)
function ErrorDisplay({ title, message }) {
  return (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center', 
      maxWidth: '600px', 
      margin: '50px auto', 
      border: '1px solid #ffccc7', 
      backgroundColor: '#fff2f0',
      borderRadius: '8px'
    }}>
      <h3 style={{ color: '#d93026', marginTop: 0 }}>{title}</h3>
      <p style={{ color: '#595959' }}>{message}</p>
    </div>
  );
}

export default function InstallationChecker() {
  // 1. [핵심] useState 초기값을 sessionStorage에서 가져옵니다.
  // (새로고침 시 깜빡임 방지)
  const [status, setStatus] = useState(() => {
    if (sessionStorage.getItem('isInstalled') === 'true') {
      return 'ready';
    }
    return 'checking';
  });

  const [error, setError] = useState(null);
  const location = useLocation();
  const isChecking = useRef(false);

  useEffect(() => {
    if (location.pathname === '/redirect') {
      setStatus('ready');
      return;
    }

    // 2. [핵심] 'ready' 상태이거나 'error' 상태이면
    // (useState에서 'ready'가 됐거나, API호출이 끝났거나)
    // 페이지 이동 시 검사를 다시 실행하지 않습니다. (깜빡임 방지)
    if (status === 'ready' || status === 'error') {
      return;
    }
    
    // 3. (이하 로직은 status가 'checking'일 때만 실행됩니다)
    if (isChecking.current) return;

    const checkInstallation = async () => {
      isChecking.current = true;
      
      try {
        const mallId = localStorage.getItem('mallId');
        
        if (!mallId) {
          // [무한 루프 방지]
          setError({ 
            title: '쇼핑몰 ID를 찾을 수 없습니다.', 
            message: '카페24 관리자 페이지에서 앱을 다시 실행해주세요.' 
          });
          setStatus('error');
          isChecking.current = false;
          return;
        }

        const { data } = await api.get(`/api/${mallId}/mall`);

        if (data?.installed) {
          // [설치 성공] sessionStorage에 기록
          sessionStorage.setItem('isInstalled', 'true');
          setStatus('ready');
        } else if (data?.installUrl) {
          // [설치 안 됨] 설치 페이지로 이동
          window.top.location.replace(data.installUrl);
        } else {
          // [서버 응답 오류]
          setError({ title: '설치 확인 실패', message: '서버 응답이 올바르지 않습니다.' });
          setStatus('error');
        }
      } catch (err) {
        // [API 호출 오류]
        setError({ title: '서버 연결 오류', message: 'API 서버에 연결할 수 없습니다. 잠시 후 새로고침 해주세요.' });
        setStatus('error');
      }
      isChecking.current = false;
    };

    checkInstallation();
  }, [status, location.pathname]); 

// --- 상태에 따라 다른 화면을 렌더링 ---

  if (status === 'checking') {
    return <div>앱 설치 상태를 확인하는 중입니다...</div>;
  }

  if (status === 'error') {
    return <ErrorDisplay title={error.title} message={error.message} />;
  }

  // status === 'ready'일 때만 자식 라우트(Outlet)를 렌더링
  return <Outlet />;
}
