// src/components/InstallationChecker.jsx (깜빡임 해결 최종본)

import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../axios';

/**
 * 에러 메시지를 표시할 간단한 컴포넌트
 */
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

/**
 * 보호된 라우트를 감싸는 '문지기' 컴포넌트
 */
export default function InstallationChecker({ children }) {
  // 1. [핵심 수정 1] useState의 "초기값"을 sessionStorage를 확인하여 설정
  // (새로고침 시 깜빡임 방지)
 const [status, setStatus] = useState(() => {
  if (sessionStorage.getItem('isInstalled') === 'true') {
      // 이미 인증 기록이 있으면 'checking'을 건너뛰고 바로 'ready'로 시작
   return 'ready';
  }
    // 기록이 없으면 'checking'으로 시작
  return 'checking';
 });

 const [error, setError] = useState(null);
 const location = useLocation();
 const isChecking = useRef(false);

 useEffect(() => {
  // 2. [설치 허용] /redirect 경로는 검사 안 함 (Redirect.jsx가 일하도록 둔다)
  if (location.pathname === '/redirect') {
    // 설치/인증 과정에 진입했으므로, 기존 인증 플래그가 있다면 삭제
    sessionStorage.removeItem('isInstalled');
    if (status !== 'ready') setStatus('ready');
   return;
  }

    // 3. [핵심 수정 2] 'ready' 또는 'error' 상태이면 검사 안 함 (페이지 이동 시 깜빡임 방지)
    if (status === 'ready' || status === 'error') {
      return;
    }
    
    // 4. (이하 로직은 status가 'checking'일 때만 실행됩니다)
  if (isChecking.current) return;

  const checkInstallation = async () => {
      isChecking.current = true;
    
      try {
      const mallId = localStorage.getItem('mallId');
    
      if (!mallId) {
          // [무한 루프 방지] mallId 없으면 에러 표시하고 중단
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
          // [설치 성공] sessionStorage에 "설치 성공" 플래그 기록
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
      console.error("[Checker] 설치 확인 중 API 에러 발생", err);
      setError({ title: '서버 연결 오류', message: 'API 서버에 연결할 수 없습니다. 잠시 후 새로고침 해주세요.' });
      setStatus('error');
     }
    isChecking.current = false;
 };

  checkInstallation();

 }, [status, location.pathname]); // ❗ 의존성 배열은 [status, location.pathname]이 맞습니다.

// --- 상태에 따라 다른 화면을 렌더링 ---

 if (status === 'checking') {
  return <div>앱 설치 상태를 확인하는 중입니다...</div>;
 }

 if (status === 'error') {
  return <ErrorDisplay title={error.title} message={error.message} />;
 }

 // status === 'ready'일 때만 자식 컴포넌트(실제 앱)를 보여줌
 return children;
}
