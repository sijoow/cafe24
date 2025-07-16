// src/pages/AuthCallback.jsx 예시
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AuthCallback() {
  const [qs] = useSearchParams();
  const nav = useNavigate();

  useEffect(() => {
    const mallId = qs.get('mallId');
    if (mallId) {
      localStorage.setItem('mallId', mallId);
      nav(`/${mallId}/dashboard`, { replace: true });
    } else {
      nav('/', { replace: true });
    }
  }, []);

  return null;
}
