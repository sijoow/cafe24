// src/pages/EventList.jsx

import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Image,
  message,
  Popconfirm,
  Grid,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { useBreakpoint } = Grid;

export default function EventList() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const screens = useBreakpoint();
  const isMobile = screens.sm === false;

  const R2_PUBLIC_BASE =
    'https://pub-25b16c9ef8e146749bc48d4a80b1ad5e.r2.dev';

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        'https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app/api/events'
      );
      const list = res.data.map(ev => ({
        ...ev,
        id: ev._id,
        createdAt: ev.createdAt
          ? new Date(ev.createdAt).toISOString().slice(0, 10)
          : '',
      }));
      setData(list);
    } catch (err) {
      console.error(err);
      message.error('이벤트 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDelete = async id => {
    try {
      await axios.delete(
        `https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app/api/events/${id}`
      );
      message.success('이벤트가 삭제되었습니다.');
      await fetchEvents();
    } catch (err) {
      console.error(err);
      message.error('이벤트 삭제에 실패했습니다.');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 200,
      render: id => (
        <span
          onClick={() => navigate(`/event/detail/${id}`)}
          style={{
            fontSize: isMobile ? '12px' : '14px',
            lineHeight: 1.2,
            wordBreak: 'break-all',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'inline-block',
            maxWidth: isMobile ? 100 : 180,
            cursor: 'pointer',
            color: '#000'    // ← black
          }}
        >
          {id}
        </span>
      ),
    },
    {
      title: '썸네일',
      dataIndex: 'images',
      width: 120,
      render: images => {
        const src =
          Array.isArray(images) && images.length > 0 ? images[0].src : null;
        if (!src) return <span>—</span>;
        const url = src.startsWith('http') ? src : `${R2_PUBLIC_BASE}/${src}`;
        return (
          <Image
            src={url}
            width={100}
            height={60}
            style={{ objectFit: 'cover', cursor: 'pointer' }}
            preview={false}
            alt="썸네일"
            onClick={() => navigate(`/event/detail/${images[0]._id || images[0].id}`)}
          />
        );
      },
    },
    {
      title: '이벤트 제목',
      dataIndex: 'title',
      width: 240,
      render: (text, record) => (
        <span
          onClick={() => navigate(`/event/detail/${record.id}`)}
          style={{
            fontSize: isMobile ? '13px' : '16px',
            lineHeight: 1.3,
            display: 'inline-block',
            maxWidth: isMobile ? 120 : 200,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            cursor: 'pointer',
            color: '#000'  // ← 대표 컬러
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: '생성 일자',
      dataIndex: 'createdAt',
      width: 120,
      render: (text, record) => (
        <span
          onClick={() => navigate(`/event/detail/${record.id}`)}
          style={{
            fontSize: isMobile ? '12px' : '14px',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            color: '#000'    // ← black
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: '레이아웃',
      dataIndex: 'layoutType',
      width: 100,
      render: (lt, record) => {
        const label = lt === 'single' ? '단품' : lt === 'tabs' ? '탭' : '없음';
        return (
          <span
            onClick={() => navigate(`/event/detail/${record.id}`)}
            style={{
              fontSize: isMobile ? '12px' : '14px',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              color: '#000'    // ← black
            }}
          >
            {label}
          </span>
        );
      },
    },
    {
      title: '영역 수',
      dataIndex: 'images',
      width: 100,
      render: (images, record) => {
        const count = Array.isArray(images)
          ? images.reduce(
              (sum, img) =>
                sum + (Array.isArray(img.regions) ? img.regions.length : 0),
              0
            )
          : 0;
        return (
          <span
            onClick={() => navigate(`/event/detail/${record.id}`)}
            style={{
              fontSize: isMobile ? '12px' : '14px',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              color: '#000'    // ← black
            }}
          >
            {count}
          </span>
        );
      },
    },
    {
      title: '액션',
      key: 'action',
      width: isMobile ? 140 : 180,
      render: (_, record) => (
        <Space size="small" className="action-buttons">
          <Button
            size="small"
            onClick={e => {
              e.stopPropagation();
              navigate(`/event/edit/${record.id}`);
            }}
          >
            수정
          </Button>
          <Popconfirm
            title="이벤트를 삭제하시겠습니까?"
            onConfirm={() => handleDelete(record.id)}
            okText="삭제"
            cancelText="취소"
          >
            <Button
              size="small"
              danger
              onClick={e => e.stopPropagation()}
            >
              삭제
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="나의 이벤트 목록"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/event/create')}
        >
          새 이벤트 생성
        </Button>
      }
      style={{
        width: '100%',
        maxWidth: 1800,
        margin: '0 auto',
      }}
      bodyStyle={{
        padding: isMobile ? 12 : 24,
      }}
    >
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: isMobile ? 4 : 6,
          size: isMobile ? 'small' : 'default',
        }}
        scroll={{ x: 1400 }}
        style={{ tableLayout: 'fixed' }}
      />
    </Card>
  );
}
