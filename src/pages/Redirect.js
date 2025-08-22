// src/pages/Redirect.jsx
import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../axios';

export default function Redirect() {
  const navigate = useNavigate();
  const { search } = useLocation();

  // React 18 StrictMode에서 useEffect가 두 번 실행되는 문제 방지용
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const run = async () => {
      try {
        const params = new URLSearchParams(search);
        // mall_id, state, mallId 모두 수용
        let mallId =
          params.get('mall_id') ||
          params.get('state') ||
          params.get('mallId');

        // 쿼리에 없으면 localStorage fallback (직접접속/새로고침 케이스)
        if (!mallId) {
          mallId = localStorage.getItem('mallId');
        }

        if (!mallId) {
          console.error('[Redirect] mall_id가 없습니다');
          navigate('/', { replace: true });
          return;
        }

        // localStorage 저장 (axios 인터셉터에서 읽음)
        try {
          localStorage.setItem('mallId', mallId);
        } catch (e) {
          // 사파리 프라이빗 모드 등 예외 보호
          console.warn('[Redirect] localStorage set 실패', e);
        }

        // 설치 여부 확인
        const { data } = await api.get(`/api/${mallId}/mall`);

        if (data?.installed) {
          if (data.userId) localStorage.setItem('userId', data.userId);
          if (data.userName) localStorage.setItem('userName', data.userName);
          navigate('/', { replace: true });
          return;
        }

        // 설치 필요: installUrl로 **최상단** 네비게이션 (임베디드 방지)
        if (data?.installUrl) {
          // 히스토리 남기지 않도록 replace 권장
          if (window.top) {
            window.top.location.replace(data.installUrl);
          } else {
            window.location.replace(data.installUrl);
          }
          return;
        }

        console.error('[Redirect] installUrl이 응답에 없습니다', data);
        navigate('/', { replace: true });
      } catch (err) {
        // 네트워크/서버 오류 시 마지막 방어선:
        // 1) mallId를 확보했다면 직접 설치 엔드포인트로 유도
        // 2) 아니면 홈으로
        console.warn('[Redirect] 설치 확인 실패', err);
        const mallId = localStorage.getItem('mallId');
        if (mallId) {
          const fallback = `/install/${encodeURIComponent(mallId)}`;
          if (window.top) {
            window.top.location.replace(fallback);
          } else {
            window.location.replace(fallback);
          }
        } else {
          navigate('/', { replace: true });
        }
      }
    };

    run();
  }, [search, navigate]);

  return null;
}
