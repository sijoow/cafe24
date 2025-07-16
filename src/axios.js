// src/axios.js
import axios from 'axios';

const instance = axios.create({
  // you can also set a default baseURL here if you like
  // baseURL: '/',  
});

instance.interceptors.request.use(config => {
  // path looks like "/{mallId}/..."
  const [, mallId] = window.location.pathname.split('/');
  if (config.url.startsWith('/api/')) {
    // rewrite "/api/foo" → "/api/{mallId}/foo"
    config.url = `/api/${mallId}${config.url}`;
  }
  return config;
});

export default instance;
