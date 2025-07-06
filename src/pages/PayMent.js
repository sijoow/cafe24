// src/components/Payment.jsx
import React, { useState } from 'react';
import axios from 'axios';

export default function Payment({ initialOrderId = '', initialAmount = 0 }) {
  const [orderId, setOrderId] = useState(initialOrderId);
  const [amount, setAmount] = useState(initialAmount);

  const handlePay = async () => {
    try {
      const returnUrl = window.location.origin + '/payment/result';
      const { data } = await axios.post('/api/payment/request', {
        orderId,
        amount,
        returnUrl,
      });
      // PG 팝업 열기
      window.open(
        data.paymentUrl,
        'pg_popup',
        'width=400,height=600,toolbar=no,menubar=no,scrollbars=no'
      );
    } catch (err) {
      console.error(err);
      alert('결제 요청 중 오류가 발생했습니다.');
    }
  };

  return (
    <div style={{ maxWidth: 320, margin: '0 auto' }}>
      <h3>결제하기</h3>
      <div style={{ marginBottom: 8 }}>
        <label>주문번호</label>
        <input
          type="text"
          value={orderId}
          onChange={e => setOrderId(e.target.value)}
          placeholder="주문번호 입력"
          style={{ width: '100%', padding: 4 }}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label>결제금액</label>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(Number(e.target.value))}
          placeholder="금액 입력"
          style={{ width: '100%', padding: 4 }}
        />
      </div>
      <button
        onClick={handlePay}
        style={{
          width: '100%',
          padding: '8px 0',
          fontSize: 16,
          cursor: 'pointer'
        }}
      >
        결제하기
      </button>
    </div>
  );
}
