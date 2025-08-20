// src/pages/Redirect.jsx
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../axios'; // 프로젝트의 axios 인스턴스 (baseURL 설정된)

export default function Redirect() {
  const navigate = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(search);
      // 카페24에서 보내는 키는 mall_id 혹은 state 둘 중 하나일 수 있음
      const mallId = params.get('mall_id') || params.get('state');
      const authError = params.get('auth_error');
      const installedFlag = params.get('installed');

      // 에러가 있으면 프론트에서 표시할 수 있게 저장하고 홈으로
      if (authError) {
        try { localStorage.setItem('auth_error', authError); } catch (e) { /* ignore */ }
        navigate('/', { replace: true });
        return;
      }

      if (!mallId) {
        console.error('[Redirect] mall_id (state)가 없습니다.');
        navigate('/', { replace: true });
        return;
      }

      // (1) mallId 로컬 저장
      try { localStorage.setItem('mallId', mallId); } catch (e) { /* ignore */ }

      // API 베이스: 환경변수 또는 현재 origin (개발/배포 상황에 맞게)
      const apiBase = process.env.REACT_APP_API_BASE_URL || window.location.origin;
      const installEndpoint = `${apiBase.replace(/\/$/, '')}/install/${mallId}`;

      try {
        // (2) 백엔드에 설치 상태 확인 요청
        const resp = await api.get(`/api/${mallId}/mall`);
        const data = resp.data;
        console.log('[Redirect] /api/:mallId/mall ->', data);

        if (data && data.installed) {
          // 이미 설치된 경우: 사용자정보 덮어쓰기
          try {
            localStorage.setItem('mallId', data.mallId || mallId);
            if (data.userId) localStorage.setItem('userId', data.userId);
            if (data.userName) localStorage.setItem('userName', data.userName);
          } catch (e) { /* ignore storage errors */ }

          // 홈으로 이동
          navigate('/', { replace: true });
          return;
        } else {
          // 미설치: 백엔드가 installUrl 제공하면 그 URL로, 아니면 서버의 /install/:mallId 로 이동
          if (data && data.installUrl) {
            // data.installUrl 은 Cafe24 권한 요청 URL (직접 리다이렉트 가능)
            window.location.href = data.installUrl;
            return;
          } else {
            // 안전하게 서버의 /install/:mallId 로 이동 -> 서버가 카페24로 리다이렉트 함
            window.location.href = installEndpoint;
            return;
          }
        }
      } catch (err) {
        console.warn('[Redirect] mall check failed - falling back to install flow', err);

        // 네트워크/서버 에러시에도 설치 흐름으로 유도
        // (서버가 동작하지 않는 경우에는 카페24 직접 권한 URL을 만드는 것이 위험하므로 서버 설치 엔드포인트로 보냄)
        window.location.href = installEndpoint;
        return;
      }
    })();
  }, [search, navigate]);

  // 컴포넌트는 아무 UI도 렌더링하지 않음 (리다이렉트 전용)
  return null;
}
