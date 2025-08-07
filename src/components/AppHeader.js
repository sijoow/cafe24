// src/components/AppHeader.jsx
import React, { useState } from 'react';
import './AppHeader.css';

export default function AppHeader({ collapsed, onToggle }) {
  // 로컬스토리지에서 mallId를 바로 읽어오고, 없으면 'GUEST'
  const [label] = useState(() => localStorage.getItem('mallId') || 'GUEST');

  return (
    <header className="app-header">
      <div className="header-right">
        <span className="membership-label free">
          {label}
        </span>
        <img
          src="https://pub-25b16c9ef8e146749bc48d4a80b1ad5e.r2.dev/main_icon2.png"
          alt="회원 아바타"
          className="membership-avatar"
        />
      </div>
    </header>
  );
}
