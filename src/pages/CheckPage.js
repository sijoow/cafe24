import React from 'react';
import Payment from './PayMent';

export default function CheckoutPage() {
  return (
    <div>
      {/* orderId, amount를 실제 값으로 넘겨주세요 */}
      <Payment initialOrderId="ORDER1234" initialAmount={5000} />
    </div>
  );
}
