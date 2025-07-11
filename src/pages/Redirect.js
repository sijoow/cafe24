// src/pages/Redirect.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Redirect() {
  const { search } = useLocation();
  const navigate   = useNavigate();
  const [msg, setMsg] = useState('인증 처리 중입니다…');

  // 슬래시 제거된 BASE
  const API_BASE = (process.env.REACT_APP_API_BASE_URL || 'https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app')
    .replace(/\/+$/, '');

  useEffect(() => {
    const p = new URLSearchParams(search);
    const code = p.get('code');
    // shop 또는 mall_id 둘 다 처리
    const shop = p.get('shop') || p.get('mall_id');

    if (!code || !shop) {
      setMsg('code 또는 shop(mall_id) 파라미터가 없습니다.');
      return;
    }

    axios.get(`${API_BASE}/redirect`, { params: { code, shop } })
      .then(() => {
        // 인증에 성공한 shop(=mallId)를 저장
        localStorage.setItem('shop', shop);

        setMsg('인증에 성공했습니다! 1.5초 후 관리자 페이지로 이동합니다.');
        setTimeout(() => navigate('/admin'), 1500);
      })
      .catch(e => {
        console.error(e);
        setMsg('인증에 실패했습니다. 다시 시도하세요.');
      });
  }, [search, navigate, API_BASE]);

  return (
    <div style={{ padding:20, textAlign:'center' }}>
      <h2>OAuth 인증 콜백</h2>
      <p>{msg}</p>
    </div>
  );
}
