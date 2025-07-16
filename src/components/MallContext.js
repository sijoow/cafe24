// src/components/MallContext.js

import React, { createContext, useContext, useState } from 'react';

const MallContext = createContext({
  mallId: null,
  setMallId: () => {}
});

// MallContext.Provider 로 전체를 감싸고, mallId 상태를 관리합니다.
export function MallProvider({ children }) {
  const [mallId, setMallId] = useState(null);

  return (
    <MallContext.Provider value={{ mallId, setMallId }}>
      {children}
    </MallContext.Provider>
  );
}

// Context 에서 mallId (및 setMallId) 를 꺼내 쓰는 커스텀 훅
export function useMall() {
  const context = useContext(MallContext);
  if (!context) {
    throw new Error('useMall must be used within a MallProvider');
  }
  return context;
}

// default export 도 해두면 import MallContext from '...' 가능
export default MallContext;
