// src/components/AppHeader.jsx
import React, { useState, useEffect } from 'react';
import './AppHeader.css';

export default function AppHeader() {
  // 1) 상태로 한 번만 읽어두기
  const [label, setLabel] = useState('GUEST');

  useEffect(() => {
    const stored = localStorage.getItem('userName') || localStorage.getItem('userId');
    if (stored) {
      setLabel(stored);
    }
  }, []);

  return (
    <header className="app-header">
      <div className="header-right">
        <span className="membership-label free">
          {label}
        </span>
        <img
          src="https://pub-25b16c9ef8e146749bc48d4a80b1ad5e.r2.dev/main_icon.png"
          alt="회원 아바타"
          className="membership-avatar"
        />
      </div>
    </header>
  );
}
