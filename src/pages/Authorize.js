// src/pages/Authorize.jsx
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function Authorize() {
  const [qs] = useSearchParams();
  const shop = qs.get('shop');
  
  useEffect(() => {
    if (!shop) return;
    
    const clientId    = 'WRIVy34WDJHhUJfG3aY5SF'
    const redirectUri = 'https://onimon.shop/redirect'
    const scope       = encodeURIComponent('mall.read_category,mall.read_product,mall.read_analytics');
    // 진짜 랜덤 state
    const state = Math.random().toString(36).substr(2) + Date.now().toString(36);
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
  
  return <p>카페24 인증 화면으로 이동 중…</p>;
}
