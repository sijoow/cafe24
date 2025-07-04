// src/pages/RewardCoupon.jsx

import React, { useState, useEffect } from 'react';
import { Table, Select, Space, message, Typography } from 'antd';
import axios from 'axios';
const { Title } = Typography;
const { Option } = Select;

export default function RewardCoupon() {
  const [coupons, setCoupons]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [view, setView]         = useState('all'); // 'all' | 'active' | 'upcoming'

  const columns = [
    { title: '쿠폰번호',    dataIndex: 'coupon_no',        key: 'coupon_no',      width: 180 },
    { title: '쿠폰명',      dataIndex: 'coupon_name',      key: 'coupon_name',    ellipsis: true },
    { title: '혜택',        dataIndex: 'benefit_text',     key: 'benefit_text',   ellipsis: true },
    { title: '할인율(%)',   dataIndex: 'benefit_percentage',key: 'benefit_percentage', width: 100 },
    { title: '발급수량',    dataIndex: 'issued_count',     key: 'issued_count',   width: 100 },
    { title: '시작일',      dataIndex: 'available_begin',   key: 'available_begin', width: 180 },
    { title: '종료일',      dataIndex: 'available_end',     key: 'available_end',   width: 180 },
  ];

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await axios.get('https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app/api/coupons', {
        params: { view },
      });
      setCoupons(res.data);
    } catch (err) {
      console.error(err);
      message.error('쿠폰 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [view]);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', padding: 24 }}>
      <Title level={3}>쿠폰 관리</Title>
      <Space>
        <span>보기:</span>
        <Select value={view} onChange={setView} style={{ width: 160 }}>
          <Option value="all">전체 쿠폰</Option>
          <Option value="active">현재 노출 중</Option>
          <Option value="upcoming">다가오는 쿠폰</Option>
        </Select>
      </Space>
      <Table
        rowKey="coupon_no"
        dataSource={coupons}
        columns={columns}
        loading={loading}
        pagination={{ pageSize: 10 }}
        bordered
      />
    </Space>
  );
}
