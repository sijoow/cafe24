// src/pages/AuthCallback.jsx
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { message } from 'antd';

export default function AuthCallback() {
  const { search } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const mallId = params.get('mallId');
    if (mallId) {
      localStorage.setItem('mallId', mallId);
      message.success('매장 연결이 완료되었습니다.');
      navigate('/dashboard', { replace: true });
    } else {
      message.error('매장 정보가 없습니다.');
      navigate('/', { replace: true });
    }
  }, [search, navigate]);

  return null;
}
