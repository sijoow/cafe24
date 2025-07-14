import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function Redirect() {
  const [params] = useSearchParams();
  const navigate  = useNavigate();

  useEffect(() => {
    const mallId = params.get('mallId');
    if (mallId) {
      navigate(`/${mallId}/dashboard`, { replace: true });
    } else {
      // mallId 없으면 임시로 onimon
      navigate('/onimon/dashboard', { replace: true });
    }
  }, [params, navigate]);

  return null;
}
