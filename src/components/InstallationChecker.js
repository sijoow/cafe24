// src/components/InstallationChecker.jsx (수정본)

import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../axios';

export default function InstallationChecker({ children }) {
  const [isReady, setIsReady] = useState(false);
  const location = useLocation();
  // 중복 실행 방지를 위한 Ref
  const checkRan = useRef(false);

  useEffect(() => {
    // 1. 이미 검사를 실행했다면 중복 실행 방지
    // 2. React 18 Strict Mode에서 두 번 실행되는 것을 방지
    if (checkRan.current) return;
    
    // 3. /redirect 경로는 이 검사를 건너뜀 (Redirect.jsx가 스스로 처리)
    if (location.pathname === '/redirect') {
      setIsReady(true);
      return;
    }

    // 검사 시작을 표시
    checkRan.current = true;

    const checkInstallation = async () => {
      try {
        const mallId = localStorage.getItem('mallId');
        
        // 4. mallId가 없는 경우 (요청사항)
        if (!mallId) {
          console.warn('[Checker] mallId가 없습니다. 메인 페이지로 이동합니다.');
          // 이미 메인 페이지가 아니면 메인으로 이동
          if (location.pathname !== '/') {
            window.location.href = '/';
          } else {
            // 이미 메인 페이지라면, (깨질 수 있지만) 일단 로드 (루프 방지)
            setIsReady(true);
          }
          return;
        }

        // 5. mallId가 있으면 서버에 설치 여부 확인
        const { data } = await api.get(`/api/${mallId}/mall`);

        if (data?.installed) {
          // [성공] 설치됨 -> 앱 로드
          setIsReady(true);
        } else if (data?.installUrl) {
          // [실패] 설치 안 됨 -> 설치 페이지로 이동
          console.warn('[Checker] 설치가 필요하여 설치 페이지로 이동합니다.');
          window.top.location.replace(data.installUrl);
        } else {
          // [기타] 응답은 왔으나 installUrl이 없음 (비정상)
          console.error('[Checker] 응답에 installUrl이 없습니다.', data);
          setIsReady(true); // (깨질 수 있지만) 일단 로드
        }

      } catch (error) {
        console.error("[Checker] 설치 확인 중 에러 발생", error);
        
        // 6. API 호출 에러 발생 시 (요청사항)
        console.warn('[Checker] 에러 발생. 메인 페이지로 이동합니다.');
        if (location.pathname !== '/') {
          window.location.href = '/';
        } else {
          // 이미 메인 페이지라면, (깨질 수 있지만) 일단 로드 (루프 방지)
          setIsReady(true);
        }
      }
    };

    checkInstallation();

    // 7. 의존성 배열을 []로 변경 -> 새로고침(마운트) 시 "단 한 번"만 실행
  }, []); 

  if (!isReady) {
    return <div>앱 설치 상태를 확인하는 중입니다...</div>;
  }

  return children;
}
