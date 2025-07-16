// src/components/MallContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../axios';

const MallContext = createContext();
export function useMall()   { return useContext(MallContext); }

export function MallProvider({ children }) {
  const [mallId,   setMallId]   = useState(null);
  const [userId,   setUserId]   = useState(null);
  const [userName, setUserName] = useState(null);

  useEffect(() => {
    axios.get('/api/mall')
      .then(res => {
        setMallId(res.data.mallId);
        setUserId(res.data.userId);
        setUserName(res.data.userName);    // 추가!
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <MallContext.Provider value={{ mallId, userId, userName }}>
      {children}
    </MallContext.Provider>
  );
}
