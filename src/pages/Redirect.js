// src/pages/Redirect.jsx
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Redirect() {
  const navigate = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    const params   = new URLSearchParams(search);
    // state 파라미터로 mallId가 오기도 하니 둘 다 체크
    const mallId   = params.get('mallId')   || params.get('state');
    const userId   = params.get('user_id')  || params.get('userId');
    const userName = params.get('user_name')|| params.get('userName');

    if (mallId) {
      localStorage.setItem('mallId', mallId);
      if (userId)   localStorage.setItem('userId',   userId);
      if (userName) localStorage.setItem('userName', userName);

      // 저장 후 대시보드로
      navigate(`/${mallId}/dashboard`, { replace: true });
    } else {
      // mallId가 없으면 기본 onimon
      navigate('/onimon/dashboard', { replace: true });
    }
  }, [search, navigate]);

  return null;
}
