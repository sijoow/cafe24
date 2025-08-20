// src/pages/Redirect.jsx (수정본 — installAttempt 플래그 추가)
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

      localStorage.setItem('mallId', mallId);

      try {
        const resp = await api.get(`/api/${mallId}/mall`);
        const data = resp.data;
        console.log('[REDIRECT] mall check', data);

        if (data && data.installed) {
          if (data.userId) localStorage.setItem('userId', data.userId);
          if (data.userName) localStorage.setItem('userName', data.userName);
          navigate('/', { replace: true });
          return;
        } else {
          // 설치되지 않았음 -> 한 번만 install로 보냄 (무한루프 방지)
          const attempted = localStorage.getItem(`installAttempt_${mallId}`);
          const now = Date.now();
          if (!attempted || now - attempted > 1000 * 60 * 5) { // 5분 이내 재시도 막기
            localStorage.setItem(`installAttempt_${mallId}`, String(now));
            const base = process.env.REACT_APP_API_BASE_URL || 'https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app';
            window.location.href = `${base.replace(/\/$/, '')}/install/${mallId}`;
            return;
          } else {
            // 이미 시도한 상태라면 사용자에게 안내 페이지로 보내기
            navigate('/', { replace: true });
            return;
          }
        }
      } catch (err) {
        console.warn('[REDIRECT] mall check failed', err);
        // 네트워크 문제 등은 설치 재시도 유도 (한 번만)
        const attempted = localStorage.getItem(`installAttempt_${mallId}`);
        const now = Date.now();
        if (!attempted || now - attempted > 1000 * 60 * 5) {
          localStorage.setItem(`installAttempt_${mallId}`, String(now));
          const base = process.env.REACT_APP_API_BASE_URL || 'https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app';
          window.location.href = `${base.replace(/\/$/, '')}/install/${mallId}`;
        } else {
          navigate('/', { replace: true });
        }
      }
    })();
  }, [search, navigate]);

  return null;
}
