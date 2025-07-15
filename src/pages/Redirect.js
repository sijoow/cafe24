// src/pages/Redirect.jsx
// Café24가 ?mall_id=xxx&user_id=... 같은 쿼리를 붙여 열어줄 때
// → 필수 정보만 localStorage 에 저장한 뒤 “깨끗한 URL” /dashboard 로 이동
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Redirect() {
  const navigate = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    const params    = new URLSearchParams(search);
    const userName  = params.get('user_name');
    const userId    = params.get('user_id');

    if (userName) localStorage.setItem('userName', userName);
    if (userId)   localStorage.setItem('userId',   userId);

    // mallId 는 이제 세션 쿠키로 관리되므로 URL 경로에 포함하지 않습니다
    navigate('/dashboard', { replace: true });
  }, [search, navigate]);

  return null; // 리다이렉트만 수행
}
