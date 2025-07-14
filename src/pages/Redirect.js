// src/pages/Redirect.jsx
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Redirect() {
  const navigate = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(search);
    const mallId = params.get('state');    // 설치 시 state 로 넘긴 mallId
    // 실제로 토큰이 DB에 들어간 뒤
    if (mallId) {
      // ① 로컬 스토리지에 저장
      localStorage.setItem('mallId', mallId);
      // ② 진짜 대시보드로 퉁!
      navigate(`/${mallId}/dashboard`, { replace: true });
    } else {
      // state 가 없으면 무조건 로그인 화면으로
      navigate('/', { replace: true });
    }
  }, [search, navigate]);

  return null; // 이 페이지에 별도 UI는 없음
}
