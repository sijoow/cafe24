// src/pages/RedirectHandler.jsx
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function RedirectHandler() {
  const [qs] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const returnedState = qs.get('state');
    const savedState    = sessionStorage.getItem('oauth_state');
    sessionStorage.removeItem('oauth_state');  // 1회용

    if (returnedState !== savedState) {
      alert('Invalid state. CSRF 검사에 실패했습니다.');
      return navigate('/', { replace: true });
    }

    const installed = qs.get('installed');
    const shop      = qs.get('shop');
    const error     = qs.get('error_description');

    if (installed === 'true' && shop) {
      alert(`${shop} 쇼핑몰에 앱 설치가 완료되었습니다!`);
    } else {
      alert(`앱 설치에 실패했습니다:\n${error || 'Unknown error'}`);
    }
    navigate('/', { replace: true });
  }, [qs, navigate]);

  return <p>앱 설치 중… 잠시만 기다려 주세요.</p>;
}
