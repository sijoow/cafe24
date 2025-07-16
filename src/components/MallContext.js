import React, { createContext, useContext, useState, useEffect } from 'react';

const MallContext = createContext();

/* 앱 어디서든 mallId 값을 읽어올 수 있게 export */
export function useMall() {
  return useContext(MallContext);
}

/* localStorage → Context 로딩 */
export function MallProvider({ children }) {
  const [mallId, setMallId] = useState(() => {
    return localStorage.getItem('mallId') || '';   // 초기값
  });

  /* mallId 가 바뀌면 localStorage 에도 동기화 */
  useEffect(() => {
    if (mallId) localStorage.setItem('mallId', mallId);
  }, [mallId]);

  return (
    <MallContext.Provider value={{ mallId, setMallId }}>
      {children}
    </MallContext.Provider>
  );
}
