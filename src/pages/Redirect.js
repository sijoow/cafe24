// src/pages/Redirect.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Redirect() {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState('인증 처리 중입니다…');

  useEffect(() => {
    // 1) URL 에서 code 파라미터 추출
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    const error = params.get('error');
    if (error) {
      setMessage(`인증 실패: ${error}`);
      return;
    }
    if (!code) {
      setMessage('인가 코드가 없습니다.');
      return;
    }

    // 2) 백엔드에 code 전송 → access_token 교환
    axios.post('/api/oauth/token', { code })
      .then(res => {
        // 토큰 저장(예: 로컬스토리지, redux 등) 후 메인으로 리다이렉트
        const { access_token } = res.data;
        localStorage.setItem('cafe24_token', access_token);
        setMessage('인증에 성공했습니다! 곧 메인 페이지로 이동합니다.');
        setTimeout(() => navigate('/'), 1500);
      })
      .catch(err => {
        console.error(err.response?.data || err.message);
        setMessage('토큰 교환 중 오류가 발생했습니다.');
      });
  }, [location, navigate]);

  return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <h2>OAuth 인증 콜백</h2>
      <p>{message}</p>
    </div>
  );
}
