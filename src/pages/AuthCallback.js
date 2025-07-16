import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMall } from '../components/MallContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { setMallId } = useMall();

  useEffect(() => {
    const mall = params.get('mallId');       // ?mallId=xxx
    if (!mall) return;                       // 예외처리
    setMallId(mall);                         // ➜ Context + localStorage
    navigate('/dashboard', { replace: true });
  }, [params, setMallId, navigate]);

  return null;
}
