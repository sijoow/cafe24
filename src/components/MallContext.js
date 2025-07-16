// src/components/MallContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const MallContext = createContext();
export const useMall = () => useContext(MallContext);

/* 1) cafe24 서브도메인용 */
function mallFromHost() {
  const m = window.location.hostname.match(/^([^.]+)\.cafe24\.com$/);
  return m ? m[1] : '';
}

/* 2) URL 경로의 첫 세그먼트 (/onimon/...)용 ▶️ ★추가★ */
function mallFromPath() {
  const seg = window.location.pathname.split('/').filter(Boolean)[0];
  // /dashboard 같이 mallId 가 없는 패턴이면 ''
  return seg && seg !== 'dashboard' ? seg : '';
}

export function MallProvider({ children }) {
  const [mallId, setMallId] = useState(() =>
    localStorage.getItem('mallId') || mallFromHost() || mallFromPath()
  );

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
