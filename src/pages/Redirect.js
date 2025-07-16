// src/pages/Redirect.jsx  ← if you really need to keep it
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Redirect() {
  const navigate = useNavigate();
  const { search } = useLocation();

  useEffect(() => {
    const params   = new URLSearchParams(search);
    const mallId   = params.get('mallId')   || params.get('state');
    const userId   = params.get('user_id')  || params.get('userId');
    const userName = params.get('user_name')|| params.get('userName');

    if (mallId) {
      localStorage.setItem('mallId', mallId);
      if (userId)   localStorage.setItem('userId',   userId);
      if (userName) localStorage.setItem('userName', userName);
    }
    // always redirect to root; MallContext will pick up the new mallId
    navigate('/', { replace: true });
  }, [search, navigate]);

  return null;
}
