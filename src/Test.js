// src/Test.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Test() {
  const [products, setProducts] = useState([]);
  const [loading , setLoading]  = useState(true);
  const [error   , setError]    = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/products')
      .then(res => {
        setProducts(res.data);
      })
      .catch(err => {
        console.error('API 호출 실패:', err);
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <div>로딩 중…</div>;
  if (error)   return <div>에러 발생: {error.message}</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>상품 목록 (/test)</h1>
      <ul>
        {products.map(p => (
          <li key={p.product_no}>
            {p.product_name} – {p.price?.toLocaleString()}원
          </li>
        ))}
      </ul>
    </div>
  );
}
