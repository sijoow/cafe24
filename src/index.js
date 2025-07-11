// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import axios from 'axios';
import '@fontsource/noto-sans-kr/400.css';  // Regular
import '@fontsource/noto-sans-kr/500.css';  // Medium
import '@fontsource/noto-sans-kr/700.css';  // Bold

// 1) Antd v5 reset 스타일
import 'antd/dist/reset.css';
import { message, ConfigProvider } from 'antd';  // ← ConfigProvider 추가

message.config({
  top: 100,    
  duration: 2, 
  maxCount: 3, 
});

axios.defaults.baseURL =
  process.env.REACT_APP_API_BASE_URL ||
  'https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app';

// 3) 렌더링 — BrowserRouter 한 번만 감싸 주세요
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <ConfigProvider
      theme={{
        token: {
         colorPrimary: '#fe6326',     // 기본
         colorPrimaryHover: '#FE753F', // 호버 (원본보다 약간 밝게)
          colorPrimaryActive: '#FD500C',// 클릭(Active, 약간 어둡게)
          fontFamily: `'Noto Sans KR', sans-serif`
        },
      }}
    >
      <App />
    </ConfigProvider>
  </BrowserRouter>
);
