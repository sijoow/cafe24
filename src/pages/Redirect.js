// src/pages/Redirect.jsx (sessionStorage 기록 기능 추가)

import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// ❗ 이 파일은 API를 호출하지 않습니다.

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
     // 1. mallId 저장 (영구)
   localStorage.setItem('mallId', mallId);
     
     // 2. [핵심] "설치 성공!" 플래그 저장 (임시)
     sessionStorage.setItem('isInstalled', 'true');
     
  } catch (e) {
   console.warn('[Redirect] Storage 저장 실패', e);
  }
 } else {
      console.error('[Redirect] URL에서 mall_id를 찾을 수 없습니다.');
    }

    // 3. /dashboard로 이동
 navigate('/dashboard', { replace: true });

 }, [search, navigate]);

 return null; // 이 페이지는 보이지 않음
}
