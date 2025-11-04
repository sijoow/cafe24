// src/components/InstallationChecker.jsx (최초 1회만 실행하는 최종본)

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
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState(null);
  const location = useLocation();
  // 중복 실행 방지 Ref
  const checkRan = useRef(false);

  useEffect(() => {
    // 1. /redirect 경로는 검사 안 함 (Redirect.jsx가 처리)
    if (location.pathname === '/redirect') {
      setStatus('ready');
      return;
    }

    // 2. 이미 검사를 실행했으면 중복 실행 방지
    if (checkRan.current) return;

    const checkInstallation = async () => {
      // 3. 검사 시작을 표시 (최초 1회)
      checkRan.current = true;
      setStatus('checking'); 
      
      try {
        const mallId = localStorage.getItem('mallId');
        
        if (!mallId) {
          // 4. mallId 없으면 에러 표시하고 중단 (리다이렉트 안 함)
          console.error('[Checker] mallId가 없습니다. 검사를 중단합니다.');
          setError({ 
            title: '쇼핑몰 ID를 찾을 수 없습니다.', 
            message: '카페24 관리자 페이지에서 앱을 다시 실행해주세요.' 
          });
          setStatus('error');
          return;
        }

        // 5. mallId가 있으면 서버에 설치 여부 확인
        const { data } = await api.get(`/api/${mallId}/mall`);

        if (data?.installed) {
          // [성공] 설치됨
          setStatus('ready');
        } else if (data?.installUrl) {
          // [실패] 설치 안 됨 -> 설치 페이지로 이동
          console.warn('[Checker] 설치가 필요하여 설치 페이지로 이동합니다.');
          window.top.location.replace(data.installUrl);
        } else {
          // [기타] 서버 응답 오류
          console.error('[Checker] 응답에 installUrl이 없습니다.', data);
          setError({ title: '설치 확인 실패', message: '서버 응답이 올바르지 않습니다.' });
          setStatus('error');
        }
      } catch (err) {
        // 6. [API 호출 오류]
        console.error("[Checker] 설치 확인 중 API 에러 발생", err);
        setError({ title: '서버 연결 오류', message: 'API 서버에 연결할 수 없습니다. 잠시 후 새로고침 해주세요.' });
        setStatus('error');
      }
    };

    checkInstallation();

    // 7. [핵심 수정] 의존성 배열을 []로 변경합니다.
    // 이렇게 하면 이 컴포넌트가 처음 마운트될 때 "단 한 번"만 실행됩니다.
  }, []); 

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
