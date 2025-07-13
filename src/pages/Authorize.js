// src/pages/Authorize.jsx
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function Authorize() {
  const [qs] = useSearchParams();
  const shop = qs.get('shop') || 'onimon'; // URL 에 ?shop=xxx 가 넘어오면 그걸 쓰고, 아니면 기본값

  useEffect(() => {
    const clientId    = process.env.REACT_APP_CAFE24_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.REACT_APP_REDIRECT_URI);
    const scope       = encodeURIComponent('mall.read_category,mall.read_product,mall.read_analytics');
    // 매번 랜덤 state 생성 → sessionStorage 등에 저장
    const state       = Math.random().toString(36).slice(2);
    sessionStorage.setItem('oauth_state', state);

    const url =
      `https://${shop}.cafe24api.com/api/v2/oauth/authorize` +
      `?response_type=code` +
      `&client_id=${clientId}` +
      `&redirect_uri=${redirectUri}` +
      `&scope=${scope}` +
      `&state=${state}`;

    window.location.replace(url);
  }, [qs]);

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <p>카페24 권한 요청 중…</p>
    </div>
  );
}
