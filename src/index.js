// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import axios from 'axios';
// 1) Antd v5 reset 스타일
import 'antd/dist/reset.css';
import { message } from 'antd';
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
    <App />
  </BrowserRouter>
);
