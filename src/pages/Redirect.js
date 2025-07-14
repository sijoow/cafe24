// src/pages/Redirect.jsx
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Redirect() {
  const { search } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const mallId = params.get('mallId');
    if (mallId) {
      // 콜백으로 받은 mallId를 경로에 반영
      navigate(`/${mallId}/dashboard`, { replace: true });
    } else {
      // mallId가 없으면 기본 대시보드로
      navigate(`/defaultMall/dashboard`, { replace: true });
    }
  }, [search, navigate]);

  return null;
}
