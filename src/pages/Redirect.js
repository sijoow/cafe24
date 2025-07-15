// src/pages/Redirect.jsx

import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Redirect() {
  const navigate = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    const params   = new URLSearchParams(search);
    const mallId   = params.get('mallId')   || params.get('mall_id');
    const userName = params.get('user_name');
    const userId   = params.get('user_id')  || params.get('userId');

    // 1) 로컬스토리지에 저장
    if (mallId)   localStorage.setItem('mallId',   mallId);
    if (userName) localStorage.setItem('userName', userName);
    if (userId)   localStorage.setItem('userId',   userId);

    // 2) mallId 노출 없이 대시보드로 이동
    navigate('/dashboard', { replace: true });
  }, [search, navigate]);

  return null;
}
