// src/components/InstallationChecker.jsx (무한 루프 수정 최종본)

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

export default function InstallationChecker({ children }) {
  // 'checking'(검사중), 'ready'(준비됨), 'error'(오류) 3가지 상태로 관리
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState(null); // 에러 정보
  const location = useLocation();
  const isChecking = useRef(false); // 중복 검사 방지

  useEffect(() => {
    // 1. /redirect 경로는 이 검사기가 아닌 Redirect.jsx가 처리
    if (location.pathname === '/redirect') {
      setStatus('ready');
      return;
    }

    // 2. 이미 검사가 진행 중이면 중복 실행 방지
    if (isChecking.current) return;

    const checkInstallation = async () => {
      isChecking.current = true;
      setStatus('checking'); // 페이지 이동 시 다시 'checking' 상태로
      
      try {
        const mallId = localStorage.getItem('mallId');
        
        // 3. [핵심 수정] mallId가 없으면 리다이렉트 대신 에러 상태로 변경
        if (!mallId) {
          console.error('[Checker] mallId가 없습니다. 검사를 중단합니다.');
          setError({ 
            title: '쇼핑몰 ID를 찾을 수 없습니다.', 
            message: '카페24 관리자 페이지에서 앱을 다시 실행해주세요.' 
          });
          setStatus('error');
          isChecking.current = false;
          return; // ★ 리다이렉트(window.location)를 하지 않고 여기서 중단
        }

        // 4. mallId가 있으면 서버에 설치 여부 확인
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
        // 5. [API 호출 오류]
        console.error("[Checker] 설치 확인 중 API 에러 발생", err);
        setError({ title: '서버 연결 오류', message: 'API 서버에 연결할 수 없습니다. 잠시 후 새로고침 해주세요.' });
        setStatus('error');
      }
      isChecking.current = false;
    };

    checkInstallation();

  }, [location.pathname]); // 페이지가 바뀔 때마다 다시 검사

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
