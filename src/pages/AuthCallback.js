// src/pages/AuthCallback.jsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AuthCallback() {
  const [qs] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // OAuth 콜백으로 돌아올 때 mallId는 state 또는 mallId 파라미터로, 
    // userId/userName도 함께 전달됩니다.
    const mallId   = qs.get('mallId')   || qs.get('state');
    const userId   = qs.get('user_id')  || qs.get('userId');
    const userName = qs.get('user_name')|| qs.get('userName');

    if (mallId) {
      // 로컬스토리지에 저장
      localStorage.setItem('mallId', mallId);
      if (userId)   localStorage.setItem('userId',   userId);
      if (userName) localStorage.setItem('userName', userName);
      // 대시보드로 이동
      navigate(`/${mallId}/dashboard`, { replace: true });
    } else {
      // 문제 있으면 루트로
      navigate('/', { replace: true });
    }
  }, [qs, navigate]);

  return null;
}
