// src/pages/AuthCallback.jsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AuthCallback() {
  const [qs] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // 카페24 OAuth 설치 콜백으로 돌아올 때 mallId 는 state 파라미터로 옴
    const mallId = qs.get('mallId') || qs.get('state');
    if (mallId) {
      // 첫 설치 시 로컬스토리지에 저장
      localStorage.setItem('mallId', mallId);
      // 대시보드로 이동
      navigate(`/${mallId}/dashboard`, { replace: true });
    } else {
      // 문제가 있으면 그냥 루트로
      navigate('/', { replace: true });
    }
  }, []);

  return null;
}
