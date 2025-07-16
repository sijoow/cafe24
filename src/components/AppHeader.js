import React from 'react';
import { useMall } from './MallContext';
import './AppHeader.css';

export default function AppHeader({ user = {} }) {
  // Context에서 mallId를 꺼냅니다
  const { mallId } = useMall();

  // mallId가 없으면 GUEST로 표시
  const displayLabel = mallId || 'GUEST';

  // avatar는 user.membership에 우선, 없으면 기본 URL
  const avatarUrl =
    user.membership?.avatarUrl ||
    'https://pub-25b16c9ef8e146749bc48d4a80b1ad5e.r2.dev/main_icon.png';

  return (
    <header className="app-header">
      <div className="header-right">
        <span className="membership-label">{displayLabel}</span>
        <img
          src={avatarUrl}
          alt="회원 아바타"
          className="membership-avatar"
        />
      </div>
    </header>
  );
}
