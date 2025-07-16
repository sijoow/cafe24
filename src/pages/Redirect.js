// OAuth 콜백 이후 mallId, user_id 등을 저장하고 대시보드로 이동
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Redirect() {
  const navigate = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const mallId   = params.get('mallId')   || params.get('mall_id');
    const userName = params.get('user_name')|| params.get('user_name');
    const userId   = params.get('user_id')  || params.get('userId');

    if (mallId) {
      localStorage.setItem('mallId', mallId);
      if (userName) localStorage.setItem('userName', userName);
      if (userId)   localStorage.setItem('userId', userId);
      navigate(`/${mallId}/dashboard`, { replace: true });
    } else {
      // mallId 없으면 기본 onimon
      navigate(`/onimon/dashboard`, { replace: true });
    }
  }, [search, navigate]);

  return null;
}
