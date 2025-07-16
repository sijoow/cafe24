import React from 'react';
import { useMall } from './MallContext';
import './AppHeader.css';

export default function AppHeader() {
  const { mallId, userId, userName } = useMall();

  const displayLabel = userName || userId || mallId || 'GUEST';
  const avatarUrl    = 'https://pub-25b16c9ef8e146749bc48d4a80b1ad5e.r2.dev/main_icon.png';

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
