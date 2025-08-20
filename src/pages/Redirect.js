// src/pages/Redirect.jsx
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../axios'; // 프로젝트에 api 인스턴스가 있으면 사용
import axios from 'axios';

export default function Redirect() {
  const navigate = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(search);

      // 카페24가 보내는 쿼리: mall_id (내 서버에서 붙이는 경우) 또는 state (OAuth state)
      const mallId = params.get('mall_id') || params.get('state');
      const authError = params.get('auth_error') || params.get('error');
      const errorDesc = params.get('error_description') || params.get('error_description');

      if (!mallId) {
        console.error('Redirect: mall_id / state 쿼리 없음');
        // 홈으로 이동
        navigate('/', { replace: true });
        return;
      }

      // auth 에러가 있으면 로그/알림 후 홈으로 (원하면 에러 페이지로 보낼 수 있음)
      if (authError) {
        console.warn('[Redirect] auth error from provider:', authError, errorDesc);
        // 알림 (UI가 없으면 간단 alert)
        try { window.alert(`인증 에러: ${authError}\n${decodeURIComponent(errorDesc || '')}`); } catch {}
        // 그래도 localStorage에는 mallId 저장
        localStorage.setItem('mallId', mallId);
        navigate('/', { replace: true });
        return;
      }

      // 안전한 base: env가 없으면 현재 origin 사용 (이전 하드코딩 문제 방지)
      const base =
        process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, '') ||
        window.location.origin.replace(/\/$/, '');

      // use project's axios instance if available, otherwise create one
      const client = api || axios.create({ baseURL: base });

      // 무한 리다이렉트 방지: 같은 mallId에 대해 sessionStorage에 시도 횟수 카운트
      const attemptKey = `install_attempt_${mallId}`;
      const attempts = parseInt(sessionStorage.getItem(attemptKey) || '0', 10);

      // (1) 로컬에 mallId 저장 (프론트에서 필요할 수 있음)
      localStorage.setItem('mallId', mallId);

      try {
        // (2) 백엔드에 설치정보 요청
        const resp = await client.get(`/api/${encodeURIComponent(mallId)}/mall`, { timeout: 8000 });
        const data = resp.data;
        console.log('[REDIRECT] /api/:mallId/mall response', data);

        if (data && data.installed) {
          // 이미 설치된 경우 — 사용자 정보가 있으면 저장
          localStorage.setItem('mallId', data.mallId || mallId);
          if (data.userId) localStorage.setItem('userId', data.userId);
          if (data.userName) localStorage.setItem('userName', data.userName);

          // 설치 완료 상태면 홈으로 (또는 원하는 라우트로)
          navigate('/', { replace: true });
          return;
        }

        // 미설치인 경우: 서버가 제공한 installUrl 사용
        const installUrl = data?.installUrl;
        if (!installUrl) {
          console.error('[REDIRECT] 설치 URL을 서버가 반환하지 않았습니다.');
          window.alert('설치 URL을 찾을 수 없습니다. 관리자에게 문의하세요.');
          navigate('/', { replace: true });
          return;
        }

        // 시도 카운트 초과 시 중단 (기본 3회)
        if (attempts >= 3) {
          console.error('[REDIRECT] install attempt limit reached for', mallId);
          window.alert('앱 설치가 여러 번 실패했습니다. 관리자에게 문의하세요.');
          navigate('/', { replace: true });
          return;
        }

        // 설치 시도 수 증가 저장
        sessionStorage.setItem(attemptKey, String(attempts + 1));

        // 서버 /install/:mallId 로 이동하는 대신 서버가 이미 installUrl을 줬으므로 바로 카페24 권한 페이지로 보낼 수 있음.
        // (보안/추적 목적상 서버의 /install/:mallId 를 통해 리다이렉트하려면 아래 주석을 풀고 사용)
        // window.location.href = `${base}/install/${encodeURIComponent(mallId)}`;

        // 바로 카페24 권한 화면으로 리다이렉트
        window.location.href = installUrl;
      } catch (err) {
        console.warn('[REDIRECT] mall check failed, falling back to install flow', err?.message || err);

        // 네트워크/서버 에러 발생 시에도 설치로 유도(최소한 한 번만)
        if (attempts >= 3) {
          window.alert('서버에 연결할 수 없습니다. 잠시 후 다시 시도하세요.');
          navigate('/', { replace: true });
          return;
        }
        sessionStorage.setItem(attemptKey, String(attempts + 1));
        // 서버의 /install 엔드포인트로 보냄 (base가 다른 서버를 가리키지 않도록 base 확인 필수)
        window.location.href = `${base}/install/${encodeURIComponent(mallId)}`;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, navigate]);

  return null;
}
