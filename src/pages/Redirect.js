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
      const installed = params.get('installed'); // 이 플래그를 우선 처리
      const authError = params.get('auth_error') || params.get('auth_error_description');

      if (!mallId) {
        console.error('mall_id가 없습니다');
        navigate('/', { replace: true });
        return;
      }

      // (1) 항상 로컬에 mallId 저장
      localStorage.setItem('mallId', mallId);

      // (A) 콜백에서 설치 성공 플래그가 있으면 DB 쓰기가 완료되었을 가능성이 높음.
      // 바로 홈으로 보냄 (추가로 /api/:mallId/mall을 호출해도 되지만 race로 인한 재설치 흐름 방지)
      if (installed === '1') {
        // (선택) 필요하면 설치 완료 응답을 확인하기 위해 /api/:mallId/mall을 한 번 호출해볼 수 있음.
        // 단, 여기선 바로 홈으로 이동하여 설치 루프를 차단.
        console.log('[REDIRECT] installed=1 received, skipping /api check and navigating home');
        navigate('/', { replace: true });
        return;
      }

      // (B) 권한 거부/오류가 있다면 에러 처리(프론트에 표시하거나 홈으로)
      if (authError) {
        console.warn('[REDIRECT] auth error from provider:', authError);
        // 에러 페이지로 보낼 수도 있고 홈으로
        navigate('/', { replace: true });
        return;
      }

      // (C) 설치 플래그 없으면 기존 로직: 서버에 설치여부 묻고 설치 유도
      try {
        const base =
          process.env.REACT_APP_API_BASE_URL ||
          (window.location.origin || 'https://onimon.shop'); // 안전 fallback
        // 여기서는 프록시/원격 서버 주소를 사용 (서버가 /install/:mallId로 cafe24로 리다이렉트)
        const resp = await api.get(`/api/${mallId}/mall`);
        const data = resp.data;
        console.log('[REDIRECT] /api/:mallId/mall response', data);

        if (data && data.installed) {
          if (data.userId) localStorage.setItem('userId', data.userId);
          if (data.userName) localStorage.setItem('userName', data.userName);
          navigate('/', { replace: true });
          return;
        } else {
          // 미설치: 서버의 /install/:mallId로 보낸다 (서버가 cafe24 권한 URL로 리다이렉트)
          // base는 반드시 서버 주소(포트/도메인)를 가리켜야 함
          window.location.href = `${base.replace(/\/$/, '')}/install/${mallId}`;
          return;
        }
      } catch (err) {
        console.warn('[REDIRECT] mall check failed', err);
        // 네트워크/서버 에러도 설치 흐름으로 유도
        const base =
          process.env.REACT_APP_API_BASE_URL ||
          (window.location.origin || 'https://onimon.shop');
        window.location.href = `${base.replace(/\/$/, '')}/install/${mallId}`;
      }
    })();
  }, [search, navigate]);

  return null;
}
