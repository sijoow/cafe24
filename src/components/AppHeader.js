import React from 'react';
import './AppHeader.css';

export default function AppHeader({
  collapsed,
  onToggle,
  user = {},
}) {
  const membership = user.membership || {
    level: 'free',
    label: 'GUEST',
    avatarUrl: 'https://pub-25b16c9ef8e146749bc48d4a80b1ad5e.r2.dev/main_icon.png',
  };

  return (
    <header className="app-header">
      {/* 오른쪽: 멤버십 정보 */}
      <div className="header-right">
        <span className={`membership-label ${membership.level}`}>
          {membership.label}
        </span>
        <img
          src={membership.avatarUrl}
          alt="회원 아바타"
          className="membership-avatar"
        />
      </div>
    </header>
  );
}
