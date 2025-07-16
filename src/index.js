// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import axios from 'axios';

// 한글 폰트
import '@fontsource/noto-sans-kr/400.css';  // Regular
import '@fontsource/noto-sans-kr/500.css';  // Medium
import '@fontsource/noto-sans-kr/700.css';  // Bold

// 1) AntD v5 reset 스타일
import 'antd/dist/reset.css';
import { message, ConfigProvider } from 'antd';

// 2) 전역 메시지 설정
message.config({
  top: 100,
  duration: 2,
  maxCount: 3,
});

// 3) axios 기본 URL 설정
axios.defaults.baseURL =
  process.env.REACT_APP_API_BASE_URL ||
  'https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app';

// 4) 렌더링 — BrowserRouter 는 여기서만!
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#fe6326',
          colorPrimaryHover: '#FE753F',
          colorPrimaryActive: '#FD500C',
          fontFamily: `'Noto Sans KR', sans-serif`,
        },
      }}
    >
      <App />
    </ConfigProvider>
  </BrowserRouter>
);
