// src/pages/AuthCallback.jsx  (이름도 Redirect → AuthCallback 으로 바꾸셔도 좋습니다)
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    const params   = new URLSearchParams(search);
    // OAuth state나 쿼리에서 넘어온 mallId
    const mallId   = params.get('mallId') || params.get('mall_id') || params.get('state');
    const userName = params.get('user_name');
    const userId   = params.get('user_id') || params.get('userId');

    if (mallId) {
      localStorage.setItem('mallId', mallId);
      if (userName) localStorage.setItem('userName', userName);
      if (userId)   localStorage.setItem('userId', userId);
    }
    // mallId 무조건 localStorage에 세팅 후 `/dashboard` 로만 이동
    navigate('/dashboard', { replace: true });
  }, [search, navigate]);

  return null;
}
