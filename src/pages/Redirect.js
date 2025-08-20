// src/pages/Redirect.jsx
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../axios'; // axios 인스턴스: baseURL이 /api 로 설정되어 있어야 편리

export default function Redirect() {
  const navigate = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(search);
      const mallId = params.get('mall_id') || params.get('state');
      const authError = params.get('auth_error');
      if (authError) {
        localStorage.setItem('auth_error', authError);
        navigate('/', { replace: true });
        return;
      }
      if (!mallId) {
        console.error('mall_id가 없습니다');
        navigate('/', { replace: true });
        return;
      }

      localStorage.setItem('mallId', mallId);

      try {
        const resp = await api.get(`/api/${mallId}/mall`);
        const data = resp.data;
        console.log('[REDIRECT] /api/:mallId/mall ->', data);

        if (data && data.installed) {
          // 설치되었으면 사용자 정보 갱신 후 홈으로
          localStorage.setItem('mallId', data.mallId || mallId);
          if (data.userId) localStorage.setItem('userId', data.userId);
          if (data.userName) localStorage.setItem('userName', data.userName);
          navigate('/', { replace: true });
          return;
        } else {
          // 미설치: 서버에서 제공한 installUrl 있으면 그것으로, 없으면 서버 /install/:mallId
          if (data && data.installUrl) {
            window.location.href = data.installUrl;
            return;
          }
          const base = process.env.REACT_APP_API_BASE_URL || window.location.origin;
          window.location.href = `${base.replace(/\/$/, '')}/install/${mallId}`;
        }
      } catch (err) {
        console.warn('[REDIRECT] mall check failed', err);
        const base = process.env.REACT_APP_API_BASE_URL || window.location.origin;
        window.location.href = `${base.replace(/\/$/, '')}/install/${mallId}`;
      }
    })();
  }, [search, navigate]);

  return null;
}
