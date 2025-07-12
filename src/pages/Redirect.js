// src/pages/Redirect.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Redirect() {
  const { search } = useLocation();
  const navigate   = useNavigate();
  const [msg, setMsg] = useState('인증 처리 중입니다…');

  // API 기본 URL (맨 끝 슬래시 제거)
  const API_BASE = (process.env.REACT_APP_API_BASE_URL || 'https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app')
    .replace(/\/+$/, '');

  useEffect(() => {
    const params = new URLSearchParams(search);
    const code  = params.get('code');
    const shop  = params.get('shop') || params.get('mall_id');

    // code/shop 없으면 바로 /admin 으로
    if (!code || !shop) {
      setMsg('잘못된 접근입니다. 관리자 페이지로 이동합니다…');
      setTimeout(() => navigate('/admin'), 1500);
      return;
    }

    // OAuth 콜백 처리
    axios.get(`${API_BASE}/redirect`, { params: { code, shop } })
      .then(() => {
        localStorage.setItem('shop', shop);
        setMsg('인증에 성공했습니다! 관리자 페이지로 이동합니다…');
        setTimeout(() => navigate('/admin'), 1500);
      })
      .catch(err => {
        console.error(err);
        setMsg('인증에 실패했습니다. 다시 시도하세요.');
      });
  }, [search, navigate, API_BASE]);

  return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <h2>OAuth 인증 콜백</h2>
      <p>{msg}</p>
      
    </div>
  );
}



