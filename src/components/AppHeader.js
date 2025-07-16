// src/components/AppHeader.jsx

import React from 'react';
import { useParams } from 'react-router-dom';
import './AppHeader.css';

export default function AppHeader({
  user = {},
}) {
  // URL 파라미터에서 mallId를 꺼냅니다.
  const { mallId } = useParams();

  // 항상 mallId를 표시하도록 강제
  const displayLabel = mallId || 'GUEST';

  // avatar는 기존 로직 유지
  const avatarUrl =
    user.membership?.avatarUrl ||
    'https://pub-25b16c9ef8e146749bc48d4a80b1ad5e.r2.dev/main_icon.png';

  return (
    <header className="app-header">
      <div className="header-right">
        <span className="membership-label">
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
