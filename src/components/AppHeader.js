// src/components/AppHeader.jsx
import React, { useEffect, useState } from 'react'
import './AppHeader.css'

export default function AppHeader({ collapsed, onToggle }) {
  // 1) 초기값을 'GUEST' 로 두고
  const [label, setLabel] = useState('GUEST')

  // 2) 마운트 시 localStorage에서 mallId 꺼내기
  useEffect(() => {
    const mallId = localStorage.getItem('mallId')
    if (mallId) {
      setLabel(mallId)
    }
  }, [])

  return (
    <header className="app-header">
      <div className="header-right">
        {/* 레벨·아바타는 고정, 라벨만 mallId로 대체 */}
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
  )
}
