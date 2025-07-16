// src/components/MallContext.js

import React, { createContext, useContext, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios, { setMallId } from '../axios';

// 1) Context 생성
const MallContext = createContext(null);

// 2) Provider: URL 파라미터 mallId 를 Context 에 넣고 axios 에도 설정
export function MallProvider({ children }) {
  const { mallId } = useParams();
  useEffect(() => {
    if (mallId) {
      setMallId(mallId);
    }
  }, [mallId]);
  return (
    <MallContext.Provider value={mallId}>
      {children}
    </MallContext.Provider>
  );
}

// 3) Hook
export function useMallId() {
  return useContext(MallContext);
}

// 4) default export 추가!
export default MallContext;
