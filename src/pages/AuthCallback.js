// src/pages/AuthCallback.jsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AuthCallback() {
  const [qs] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // OAuth 콜백에서 mallId, userId, userName 추출
    const mallId   = qs.get('mallId')   || qs.get('state');
    const userId   = qs.get('user_id')  || qs.get('userId');
    const userName = qs.get('user_name')|| qs.get('userName');

    if (mallId) {
      // 로컬스토리지에 저장해 두면 axios interceptor 등이 사용할 수 있습니다
      localStorage.setItem('mallId', mallId);
      if (userId)   localStorage.setItem('userId',   userId);
      if (userName) localStorage.setItem('userName', userName);
    }
    // URL 파라미터에 의존하지 않고, MallContext가 /api/mall 호출로 mallId를 가져오도록 루트로만 이동
    navigate('/', { replace: true });
  }, [qs, navigate]);

  return null;
}
