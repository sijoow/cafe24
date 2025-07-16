// src/components/MallContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const MallContext = createContext();
export function useMall() {
  return useContext(MallContext);
}

function detectMallFromHost() {
  // 서브도메인에서 mallId 추출 (예: yogibo.cafe24.com → yogibo)
  const host = window.location.hostname;
  const m = host.match(/^([^.]+)\.cafe24\.com$/);
  return m ? m[1] : '';
}

export function MallProvider({ children }) {
  // 1) mallId, userId, userName 초기값 설정
  const [mallId,   setMallId]   = useState(() =>
    localStorage.getItem('mallId') || detectMallFromHost()
  );
  const [userId,   setUserId]   = useState(() =>
    localStorage.getItem('userId') || ''
  );
  const [userName, setUserName] = useState(() =>
    localStorage.getItem('userName') || ''
  );

  // 2) 상태가 변경되면 로컬스토리지에 동기화
  useEffect(() => {
    if (mallId)   localStorage.setItem('mallId',   mallId);
  }, [mallId]);

  useEffect(() => {
    if (userId)   localStorage.setItem('userId',   userId);
  }, [userId]);

  useEffect(() => {
    if (userName) localStorage.setItem('userName', userName);
  }, [userName]);

  return (
    <MallContext.Provider
      value={{
        mallId,
        setMallId,
        userId,
        setUserId,
        userName,
        setUserName
      }}
    >
      {children}
    </MallContext.Provider>
  );
}
