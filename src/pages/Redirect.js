// src/pages/Redirect.jsx (필수 수정 최종본)

import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * 이 컴포넌트의 유일한 역할 (API 호출 없음!):
 * 1. URL에서 mall_id 파싱
 * 2. mall_id를 localStorage에 저장 (영구)
 * 3. "isInstalled: true"를 sessionStorage에 저장 (임시)
 * 4. 앱의 메인 대시보드(/dashboard)로 즉시 이동
 */
export default function Redirect() {
        const navigate = useNavigate();
        const { search } = useLocation();
        const ranRef = useRef(false); // 중복 실행 방지

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
        // 1. 영구 저장소에 mallId 저장
         localStorage.setItem('mallId', mallId);

        // 2. [핵심] 임시 저장소에 "설치 성공" 플래그 저장
        // InstallationChecker가 이 플래그를 보고 API 호출을 건너뜀
        sessionStorage.setItem('isInstalled', 'true');

         } catch (e) {
         console.warn('[Redirect] Storage 저장 실패', e);
         }
         } else {
        console.error('[Redirect] URL에서 mall_id를 찾을 수 없습니다.');
        }

        // 3. 설치가 확인된 사용자가 볼 첫 페이지(보호된 라우트)로 보냅니다.
        // (공개 페이지인 '/'로 보내면 안 됩니다.)
         navigate('/dashboard', { replace: true });

        }, [search, navigate]);

        // 이 페이지는 절대 사용자에게 보이면 안 됩니다.
        return null; 
}
