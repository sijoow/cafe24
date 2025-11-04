// src/components/InstallationChecker.jsx (수정된 최종본)

import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../axios';

export default function InstallationChecker({ children }) {
  const [isReady, setIsReady] = useState(false);
  const location = useLocation();
  // 현재 검사가 진행 중인지 확인 (중복 API 호출 방지)
  const isChecking = useRef(false); 

  useEffect(() => {
    // 1. /redirect 경로는 검사에서 제외 (Redirect.jsx가 일하도록 둔다)
    if (location.pathname === '/redirect') {
      setIsReady(true);
      return;
    }

    // 2. 이미 다른 검사가 진행 중이면 중복 실행하지 않음
    if (isChecking.current) return;

    const checkInstallation = async () => {
      // 3. 검사 시작
      isChecking.current = true;
      setIsReady(false); // 페이지 이동 시 로딩 화면을 다시 보여줌

      try {
        const mallId = localStorage.getItem('mallId');
        
        if (!mallId) {
          // mallId가 없으면 설치가 불가능하므로, 설치 시작 페이지로 보냄
          console.warn('[Checker] mallId가 없습니다. 설치를 위해 /redirect로 보냅니다.');
          window.location.href = '/redirect';
          return;
        }

        // 4. 서버에 설치 여부 확인 (가장 중요한 확인)
        const { data } = await api.get(`/api/${mallId}/mall`);

        if (data?.installed) {
          // [성공] 설치됨 -> 앱 로드
          setIsReady(true);
        } else if (data?.installUrl) {
          // [실패] 설치 안 됨 -> 설치 페이지로 이동
          console.warn('[Checker] 설치가 필요하여 설치 페이지로 이동합니다.');
          window.top.location.replace(data.installUrl);
        } else {
          // [기타] 비정상 오류
          console.error('[Checker] 응답에 installUrl이 없습니다.', data);
          // 이 경우엔 /redirect로 보내서 mallId를 다시 파싱하게 함
          window.location.href = '/redirect';
        }

      } catch (error) {
        console.error("[Checker] 설치 확인 중 에러 발생", error);
        // 에러 발생 시에도 /redirect로 보내서 흐름을 재시작
        window.location.href = '/redirect';
      } finally {
        // 5. 검사 종료
        isChecking.current = false;
      }
    };

    checkInstallation();

    // 6. location.pathname이 바뀔 때마다(페이지 이동 시마다) 이 검사를 다시 실행
  }, [location.pathname]); 

  if (!isReady) {
    return <div>앱 설치 상태를 확인하는 중입니다...</div>;
  }

  return children;
}
