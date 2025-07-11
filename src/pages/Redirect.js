// src/pages/Redirect.jsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Redirect() {
  const location = useLocation();
  const navigate = useNavigate();
  const [message, setMessage] = useState('인증 처리 중입니다…');


  return (
    <div style={{ padding: 20, textAlign: 'center' }}>
      <h2>OAuth 인증 콜백</h2>
      <p>{message}</p>
    </div>
  );
}
