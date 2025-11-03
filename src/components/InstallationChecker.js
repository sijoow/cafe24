// src/components/InstallationChecker.jsx

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../axios';

// 이 컴포넌트가 모든 페이지를 감싸게 됩니다.
export default function InstallationChecker({ children }) {
  const [isReady, setIsReady] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // /redirect 경로는 이 검사를 건너뛰게 해야 무한 루프에 빠지지 않습니다.
    if (location.pathname === '/redirect') {
      setIsReady(true);
      return;
    }

    const checkInstallation = async () => {
      try {
        const mallId = localStorage.getItem('mallId');
        if (!mallId) {
          // mallId 자체가 없으면 검사할 수 없으므로 /redirect로 보냅니다.
          window.location.href = '/redirect'; 
          return;
        }

        const { data } = await api.get(`/api/${mallId}/mall`);

        if (data?.installed) {
          // 설치되었으면 자식 컴포넌트(실제 페이지)를 보여줍니다.
          setIsReady(true);
        } else if (data?.installUrl) {
          // 설치되지 않았으면 설치 URL로 보냅니다.
          window.top.location.replace(data.installUrl);
        } else {
            // 비정상적인 경우, 일단 /redirect로 보냅니다.
            window.location.href = '/redirect';
        }
      } catch (error) {
        console.error("설치 확인 중 에러 발생", error);
        // 에러 발생 시에도 일단 /redirect로 보내서 다시 시도하도록 유도
        const mallId = localStorage.getItem('mallId');
        if(mallId) {
            window.location.href = `/redirect?mall_id=${mallId}`;
        } else {
            window.location.href = '/';
        }
      }
    };

    checkInstallation();
  }, [location.pathname]);

  // 검사가 끝나기 전까지는 아무것도 보여주지 않거나 로딩 스피너를 보여줍니다.
  if (!isReady) {
    return <div>앱 로딩 중...</div>;
  }

  // 검사가 끝나고 설치가 확인되면 실제 페이지 내용을 보여줍니다.
  return children;
}
