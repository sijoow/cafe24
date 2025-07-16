// src/components/AppHeader.jsx

import React from 'react';
import { useParams } from 'react-router-dom';
import './AppHeader.css';

export default function AppHeader({
  // 만약 실제 로그인된 사용자 정보를 props.user 로 넘겨주고 있다면,
  // 그 안의 user.id 나 user.username 등을 우선해서 사용해도 됩니다.
  user = {},
}) {
  // URL 파라미터에서 mallId를 꺼냅니다.
  const { mallId } = useParams();

  // membership.label 이 기본값이라면 mallId 로 대체
  const displayLabel =
    (user.membership?.label && user.membership.label !== 'GUEST')
      ? user.membership.label
      : mallId || 'GUEST';

  // avatar 도 user.avatarUrl 이 있으면 쓰고, 없으면 기본으로
  const avatarUrl =
    user.membership?.avatarUrl ||
    'https://pub-25b16c9ef8e146749bc48d4a80b1ad5e.r2.dev/main_icon.png';

  return (
    <header className="app-header">
      <div className="header-right">
        <span className={`membership-label`}>
          {displayLabel}
        </span>
        <img
          src={avatarUrl}
          alt="회원 아바타"
          className="membership-avatar"
        />
      </div>
    </header>
  );
}
