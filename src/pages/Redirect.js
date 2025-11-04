// src/pages/Redirect.jsx (수정된 최종본)

import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * 이 컴포넌트의 유일한 역할:
 * 1. URL에서 mall_id, state 등을 파싱한다.
 * 2. mall_id를 localStorage에 저장한다.
 * 3. 메인 대시보드('/')로 사용자를 보낸다.
 * * *절대* 설치 여부를 확인(api.get)하지 않습니다.
 */
export default function Redirect() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const params = new URLSearchParams(search);
    const mallId =
      params.get('mall_id') ||
      params.get('state') ||
      params.get('mallId');

    if (mallId) {
      try {
        // mallId를 localStorage에 저장합니다.
        localStorage.setItem('mallId', mallId);
      } catch (e) {
        console.warn('[Redirect] localStorage set 실패', e);
      }
    } else {
      console.error('[Redirect] mall_id를 찾을 수 없습니다.');
    }

    // 설치 여부를 묻지 말고, 무조건 메인 페이지로 보냅니다.
    // 'InstallationChecker'가 메인 페이지에서 문지기 역할을 할 것입니다.
    navigate('/', { replace: true });

  }, [search, navigate]);

  // 이 페이지는 사용자에게 보여지지 않습니다.
  return null; 
}
