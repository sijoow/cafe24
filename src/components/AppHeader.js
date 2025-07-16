// src/components/AppHeader.jsx
import React, { useContext } from 'react';
import MallContext from '../components/MallContext';
import './AppHeader.css';

export default function AppHeader() {
  const mallId = useContext(MallContext) || 'GUEST';
  return (
    <header className="app-header">
      <div className="header-right">
        <span className="membership-label">{mallId}</span>
        <img
          src="https://pub-25b16c9ef8e146749bc48d4a80b1ad5e.r2.dev/main_icon.png"
          alt="회원 아바타"
          className="membership-avatar"
        />
      </div>
    </header>
  );
}
