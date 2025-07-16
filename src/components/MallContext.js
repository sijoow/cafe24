import React, { createContext, useContext, useState, useEffect } from 'react';

const MallContext = createContext();
export function useMall() { return useContext(MallContext); }

function detectMallFromHost() {
  // ex) yogibo.cafe24.com  →  yogibo
  const host = window.location.hostname;
  const m = host.match(/^([^.]+)\.cafe24\.com$/);
  return m ? m[1] : '';
}

export function MallProvider({ children }) {
  const [mallId, setMallId] = useState(() => {
    return (
      localStorage.getItem('mallId') ||   // 1) 저장돼 있던 값
      detectMallFromHost()               // 2) 서브도메인에서 추출
    );
  });

  /* mallId 가 정해지면 localStorage 동기화 */
  useEffect(() => {
    if (mallId) localStorage.setItem('mallId', mallId);
  }, [mallId]);

  return (
    <MallContext.Provider value={{ mallId, setMallId }}>
      {children}
    </MallContext.Provider>
  );
}
