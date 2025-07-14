// src/pages/Redirect.jsx

import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { message, Spin } from 'antd';

export default function Redirect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // 백엔드에서 ?mallId=… 로 전달해준 값을 읽어옵니다.
    const mallId = searchParams.get('mallId');
    if (!mallId) {
      message.error('몰 ID를 찾을 수 없습니다. 대시보드로 이동합니다.');
      return navigate('/defaultMall/dashboard', { replace: true });
    }

    // 필요하다면 로컬 스토리지 등에 저장
    localStorage.setItem('mallId', mallId);

    // mallId 가 붙은 대시보드로 이동
    navigate(`/${mallId}/dashboard`, { replace: true });
  }, [navigate, searchParams]);

  // 로딩 스피너만 표시
  return (
    <div style={{ textAlign: 'center', marginTop: 100 }}>
      <Spin size="large" tip="리다이렉트 중입니다…" />
    </div>
  );
}
