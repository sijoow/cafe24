// src/pages/AuthCallback.jsx
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const mallId = params.get('mallId');
    if (mallId) {
      // 쿠키에 mallId 저장 (path=/ 으로 전체 경로에 적용)
      Cookies.set('mallId', mallId, { path: '/' });
    }
    // URL에서 mallId 파라미터는 제거하고 /dashboard로 이동
    navigate('/dashboard', { replace: true });
  }, []);

  return null;  // 로딩 컴포넌트 넣어도 OK
}
