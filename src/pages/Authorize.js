// src/pages/Authorize.jsx
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function Authorize() {
  const [qs] = useSearchParams();
  const shop = qs.get('shop');

  useEffect(() => {
    if (!shop) return;

    const clientId    = process.env.REACT_APP_CAFE24_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.REACT_APP_REDIRECT_URI);
    const scope       = encodeURIComponent('mall.read_category,mall.read_product,mall.read_analytics');

    // CSRF용 state는 서버에서 관리하므로 여기는 고정 플로우
    const url =
      `https://${shop}.cafe24api.com/api/v2/oauth/authorize` +
      `?response_type=code` +
      `&client_id=${clientId}` +
      `&redirect_uri=${redirectUri}` +
      `&scope=${scope}` +
      `&state=app_install`;  // 서버가 이 state를 검증합니다

    window.location.replace(url);
  }, [shop]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p>카페24 인증 페이지로 이동 중…</p>
    </div>
  );
}
