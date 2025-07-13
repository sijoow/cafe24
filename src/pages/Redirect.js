// src/pages/RedirectHandler.jsx
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function RedirectHandler() {
  const [qs] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const installed = qs.get('installed');
    const shop      = qs.get('shop');
    const error     = qs.get('error_description');

    if (installed === 'true' && shop) {
      alert(`${shop} 쇼핑몰에 앱 설치가 완료되었습니다!`);
      // 홈으로 돌아가면서 쿼리는 지워버리기
      navigate('/', { replace: true });
    } else {
      alert(`앱 설치에 실패했습니다:\n${error || 'Unknown error'}`);
      navigate('/', { replace: true });
    }
  }, [qs, navigate]);

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <p>앱 설치 중...</p>
    </div>
  );
}
