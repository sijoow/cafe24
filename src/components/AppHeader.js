// src/components/AppHeader.jsx
import React from 'react';
import { useMall } from './MallContext';
import './AppHeader.css';

export default function AppHeader({ user = {} }) {
  // Context에서 mallId, userId, userName을 꺼냅니다
  const { mallId, userId, userName } = useMall();

  // 표시할 레이블: userName이 있으면 우선, 없으면 userId, 그 다음 mallId, 없다면 GUEST
  const displayLabel =
    userName ||
    (userId ? `ID: ${userId}` : mallId || 'GUEST');

  // avatar는 props.user.membership.avatarUrl에 우선, 
  // 없으면 Context의 userId 기반 기본 URL 또는 종전 디폴트
  const avatarUrl =
    user.membership?.avatarUrl ||
    (userId
      ? `https://pub-25b16c9ef8e146749bc48d4a80b1ad5e.r2.dev/main_icon.png`
      : 'https://pub-25b16c9ef8e146749bc48d4a80b1ad5e.r2.dev/main_icon.png');

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
