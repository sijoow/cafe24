import React, { useEffect, useState } from 'react';
import { Select, Button, Table, Card, Space, message, Spin, Grid } from 'antd';
import api from '../axios';

const { useBreakpoint } = Grid;

export default function Participation() {
  const screens = useBreakpoint();
  const isMobile = !screens.sm;
  const mallId = localStorage.getItem('mallId');

  // 1) 이벤트(게시판) 목록
  const [events, setEvents]               = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  useEffect(() => {
    if (!mallId) return;
    api.get(`/api/${mallId}/events`)
      .then(res => {
        const evs = (res.data || []).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setEvents(evs);
        setSelectedEvent(evs[0]?._id || null);
      })
      .catch(() => message.error('이벤트 목록 로드 실패'));
  }, [mallId]);

  // 2) 통계 데이터 & 로딩
  const [stats, setStats]     = useState([]);
  const [loading, setLoading] = useState(false);

  // 3) 조회 함수
  const fetchStats = () => {
    if (!selectedEvent) {
      return message.warning('게시판을 선택해주세요.');
    }
    setLoading(true);
    api.get(
      `/api/${mallId}/analytics/${selectedEvent}/coupon-stats`
    )
    .then(res => {
      // [{ couponNo, couponName, downloadCount, usedCount }, …]
      setStats(res.data);
    })
    .catch(() => {
      message.error('쿠폰 다운로드/사용 통계 조회 실패');
      setStats([]);
    })
    .finally(() => setLoading(false));
  };

  return (
    <Card title="쿠폰 다운로드 / 사용 통계" bodyStyle={{ padding: isMobile ? 12 : 24 }}>
      {/* ─── 필터 영역 ─────────────────────────── */}
      <Space
        direction={isMobile ? 'vertical' : 'horizontal'}
        size="middle"
        style={{ marginBottom: 16 }}
      >
        <Select
          placeholder="게시판 선택"
          options={events.map(e => ({
            label: e.title || '(제목없음)',
            value: e._id
          }))}
          value={selectedEvent}
          onChange={setSelectedEvent}
          style={{ width: isMobile ? '100%' : 240 }}
        />
        <Button
          type="primary"
          onClick={fetchStats}
          loading={loading}
          block={isMobile}
        >
          조회
        </Button>
      </Space>

      {/* ─── 결과 테이블 ───────────────────────── */}
      {loading
        ? <Spin tip="로딩 중…" />
        : <Table
            rowKey="couponNo"
            dataSource={stats}
            pagination={false}
            bordered
            scroll={{ x: 'max-content' }}
            columns={[
              { title: '쿠폰 번호',  dataIndex: 'couponNo',      key: 'couponNo' },
              { title: '쿠폰명',      dataIndex: 'couponName',    key: 'couponName' },
              {
                title: '다운로드 수',
                dataIndex: 'downloadCount',
                key: 'downloadCount',
                align: 'right'
              },
              {
                title: '사용 수',
                dataIndex: 'usedCount',
                key: 'usedCount',
                align: 'right'
              }
            ]}
          />
      }
    </Card>
  );
}
