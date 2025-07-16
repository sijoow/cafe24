// src/pages/Redirect.jsx
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Redirect() {
  const navigate = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    const params   = new URLSearchParams(search);
    // 서버에서 보내준 mallId: ?mallId=xxx 또는 state 파라미터
    const mallId   = params.get('mallId') || params.get('mall_id') || params.get('state');
    const userName = params.get('user_name');
    const userId   = params.get('user_id') || params.get('userId');

    if (mallId) {
      localStorage.setItem('mallId', mallId);
      if (userName) localStorage.setItem('userName', userName);
      if (userId)   localStorage.setItem('userId', userId);
    }
    // mallId를 저장한 뒤, URL에 mallId 없이 /dashboard로만 이동
    navigate('/dashboard', { replace: true });
  }, [search, navigate]);

  return null;
}
