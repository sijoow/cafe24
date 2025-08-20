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

      if (!mallId) {
        console.error('mall_id가 없습니다');
        navigate('/', { replace: true });
        return;
      }

      // (1) 로컬에 저장
      localStorage.setItem('mallId', mallId);

      try {
        // (2) 백엔드에 설치정보 요청
        const resp = await api.get(`/api/${mallId}/mall`);
        const data = resp.data;
        console.log('[REDIRECT] /api/:mallId/mall response', data);

        if (data && data.installed) {
          // 이미 설치된 앱: 사용자정보 저장 후 홈으로
          localStorage.setItem('mallId', data.mallId || mallId);
          if (data.userId) localStorage.setItem('userId', data.userId);
          if (data.userName) localStorage.setItem('userName', data.userName);
          navigate('/', { replace: true });
          return;
        } else {
          // 미설치: 서버의 /install/:mallId 로 이동 -> 서버가 카페24 권한 URL로 redirect
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
