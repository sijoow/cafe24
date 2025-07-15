// src/components/AppHeader.jsx
import React from 'react';
import './AppHeader.css';

export default function AppHeader({
  collapsed,
  onToggle,
  user = {},
}) {
  // 1) 먼저 localStorage에서 userName 또는 userId를 꺼내 본다
  const storedName =
    localStorage.getItem('userName') ||
    localStorage.getItem('userId');

  // 2) membership 정보를 결정
  const membership = {
    // level은 기존 user.membership이 있으면 그대로, 아니면 'free'
    level: user.membership?.level || 'free',
    // label은 storedName이 있으면 그걸, 없으면 기존 membership.label, 그래도 없으면 'GUEST'
    label:
      storedName ||
      user.membership?.label ||
      'GUEST',
    // avatarUrl은 기존에 세팅된 게 있으면 그걸, 아니면 기본 아이콘
    avatarUrl:
      user.membership?.avatarUrl ||
      'https://pub-25b16c9ef8e146749bc48d4a80b1ad5e.r2.dev/main_icon.png',
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
