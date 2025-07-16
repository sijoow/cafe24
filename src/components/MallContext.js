// src/components/MallContext.jsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../axios';

const MallContext = createContext();
export function useMall() { return useContext(MallContext); }

export function MallProvider({ children }) {
  const [mallId, setMallId] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // 앱 로드될 때마다 현재 mall/user 정보를 한 번만 가져옵니다
    axios.get('/api/mall')
      .then(res => {
        setMallId(res.data.mallId);
        setUserId(res.data.userId);
      })
      .catch(err => {
        console.error('Cannot fetch mall info:', err);
      });
  }, []);

  return (
    <MallContext.Provider value={{ mallId, userId }}>
      {children}
    </MallContext.Provider>
  );
}
