// src/pages/Redirect.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Redirect() {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState('인증 처리 중입니다…');

<<<<<<< HEAD
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code   = params.get('code');
    const state  = params.get('state'); // 필요 시 사용

    if (!code) {
      setMessage('인증 코드가 없습니다.');
      return;
    }

    // 백엔드에 토큰 교환 요청
    axios
      .get('/api/oauth/callback', { params: { code, state } })
      .then(() => {
        setMessage('인증에 성공했습니다! 곧 이동합니다…');
        setTimeout(() => navigate('/admin'), 1500);
      })
      .catch(err => {
        console.error(err);
        setMessage('인증에 실패했습니다. 다시 시도해주세요.');
      });
  }, [location.search, navigate]);
=======
>>>>>>> f05e3d03574a190f9c5b7d1c3f039c1681900d81

  return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <h2>OAuth 인증 콜백</h2>
      <p>{message}</p>
    </div>
  );
}
