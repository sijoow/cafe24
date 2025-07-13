// src/pages/Authorize.jsx
import React, { useEffect } from 'react';

export default function Authorize() {
  useEffect(() => {
    // 1) 올바른 env var 이름: CRA라면 REACT_APP_ 접두사 사용
    const clientId    = process.env.REACT_APP_CAFE24_CLIENT_ID;  
    const redirectUri = encodeURIComponent(process.env.REACT_APP_REDIRECT_URI);
    const scope       = encodeURIComponent('mall.read_category,mall.read_product,mall.read_analytics');

    // 2) window.crypto로 랜덤 state 생성
    const arr   = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    const state = arr[0].toString(36) + Date.now().toString(36);

    // 3) CSRF 검사용 state 저장
    sessionStorage.setItem('oauth_state', state);

    // 4) 승인 URL 조합 및 즉시 리다이렉트
    const url =
      `https://onimon.cafe24api.com/api/v2/oauth/authorize` +
      `?response_type=code` +
      `&client_id=${clientId}` +
      `&redirect_uri=${redirectUri}` +
      `&scope=${scope}` +
      `&state=${state}`;

    window.location.replace(url);
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <p>카페24 권한 요청 중…</p>
    </div>
  );
}
