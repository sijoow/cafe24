import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../axios';

const MallContext = createContext(null);

// ① Provider 는 default export 가 아닌, **named** export 로
export function MallProvider({ children }) {
  const [mallId,   setMallId]   = useState(null);
  const [userId,   setUserId]   = useState(null);
  const [userName, setUserName] = useState(null);

  useEffect(() => {
    axios.get('/api/mall')
      .then(res => {
        setMallId(res.data.mallId);
        setUserId(res.data.userId);
        setUserName(res.data.userName);
      })
      .catch(console.error);
  }, []);

  return (
    <MallContext.Provider value={{ mallId, userId, userName }}>
      {children}
    </MallContext.Provider>
  );
}

// ② useMall 훅도 named export
export function useMall() {
  return useContext(MallContext);
}
