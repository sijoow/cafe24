// src/pages/Redirect.jsx
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../axios';

export default function Redirect() {
  const navigate = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(search);
      const mallId = params.get('mall_id') || params.get('state');
      const installedFlag = params.get('installed');
      const authError = params.get('auth_error');
      const authErrorDesc = params.get('auth_error_description');

      if (!mallId) {
        console.error('mall_id가 없습니다');
        navigate('/', { replace: true });
        return;
      }

      // 1) 콜백으로부터 "설치 완료" 플래그가 있는 경우: 바로 처리 (DB 조회 생략)
      if (installedFlag === '1') {
        localStorage.setItem('mallId', mallId);
        // (선택) 알림/토스트: 설치 완료
        console.log('[REDIRECT] installation success for', mallId);
        navigate('/', { replace: true });
        return;
      }

      // 2) 콜백으로부터 에러가 온 경우: 에러 페이지로 (또는 홈으로)
      if (authError) {
        console.warn('[REDIRECT] auth error', authError, authErrorDesc);
        // 여기서 /?auth_error=... 로 리다이렉트하거나 에러 페이지로 보냅니다.
        navigate(`/?auth_error=${encodeURIComponent(authError)}&auth_error_description=${encodeURIComponent(authErrorDesc||'')}`, { replace: true });
        return;
      }

      // 3) 일반적인 flow: 설치여부 확인 (서버가 설치 URL을 내려주면 설치흐름으로 보냄)
      try {
        localStorage.setItem('mallId', mallId);
        const resp = await api.get(`/api/${mallId}/mall`);
        const data = resp.data;
        console.log('[REDIRECT] /api/:mallId/mall response', data);

        if (data && data.installed) {
          if (data.userId) localStorage.setItem('userId', data.userId);
          if (data.userName) localStorage.setItem('userName', data.userName);
          navigate('/', { replace: true });
          return;
        } else {
          const base = process.env.REACT_APP_API_BASE_URL || window.location.origin;
          window.location.href = `${base.replace(/\/$/, '')}/install/${mallId}`;
          return;
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
