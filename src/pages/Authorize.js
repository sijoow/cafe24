// src/pages/Authorize.jsx
import React, { useEffect } from 'react';

export default function Authorize() {
  useEffect(() => {
    const clientId    = process.env.CAFE24_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.REDIRECT_URI); // https://onimon.shop/redirect
    const scope       = encodeURIComponent('mall.read_category,mall.read_product,mall.read_analytics');
    const state       = 'app_install';  // 필요시 랜덤 생성해서 보안 강화

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
      <p>앱 설치를 위해 카페24로 이동 중입니다…</p>
    </div>
  );
}
