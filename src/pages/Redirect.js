// src/pages/Redirect.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Redirect() {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState('인증 처리 중입니다…');

  // env 파일에서 불러온 API 기본 URL
  const API_BASE = process.env.REACT_APP_API_BASE_URL
  ? process.env.REACT_APP_API_BASE_URL.replace(/\/+$/, '')
  : 'https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app';

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const shop = params.get('shop') || params.get('mall_id');
    if (!code || !shop) {
      setMessage('code 또는 shop 파라미터가 없습니다.');
      return;
    }

    axios
      .get(`${API_BASE}/redirect`, { params: { code, shop } })
      .then(() => {
        setMessage('인증에 성공했습니다! 곧 이동합니다…');
        setTimeout(() => navigate('/admin'), 1500);
      })
      .catch(err => {
        console.error(err);
        setMessage('인증에 실패했습니다. 다시 시도해주세요.');
      });
  }, [location.search, navigate]);

  return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <h2>OAuth 인증 콜백</h2>
      <p>{message}</p>
    </div>
  );
}
