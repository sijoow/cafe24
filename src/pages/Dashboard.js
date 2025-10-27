// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Statistic,
  message,
  Space,
  Button,
  Table,
  Input,
  Tooltip,
  Popconfirm,
} from 'antd';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import ReactECharts from 'echarts-for-react';
import api from '../axios';
import './NormalSection.css';
import { CopyOutlined, LinkOutlined } from '@ant-design/icons';

dayjs.extend(isSameOrBefore);

const { RangePicker } = DatePicker;

export default function Dashboard() {
  const [mallId, setMallId] = useState(null);
  useEffect(() => {
    const params  = new URLSearchParams(window.location.search);
    const qMallId = params.get('mall_id') || params.get('state') || params.get('mallId');
    if (qMallId) {
      localStorage.setItem('mallId', qMallId); // mallId 자체는 localStorage에 유지
      setMallId(qMallId);
    } else {
      const stored = localStorage.getItem('mallId');
      if (stored) setMallId(stored);
    }
  }, []);

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [urls, setUrls] = useState([]);
  const [selectedUrl, setSelectedUrl] = useState(null);
  
  const [siteBaseUrl, setSiteBaseUrl] = useState('');
  const [urlInput, setUrlInput] = useState('');

  const [range, setRange] = useState([dayjs().subtract(6, 'day'), dayjs()]);
  const [minDate, setMinDate] = useState(null);
  const [dates, setDates] = useState([]);

  const [newByDate, setNewByDate] = useState([]);
  const [retByDate, setRetByDate] = useState([]);
  const [pcByDate, setPcByDate] = useState([]);
  const [andByDate, setAndByDate] = useState([]);
  const [iosByDate, setIosByDate] = useState([]);

  const [eventCount, setEventCount] = useState(0);
  const [couponCount, setCouponCount] = useState(0);
  const [prodPerf, setProdPerf] = useState([]);

  const [couponNos, setCouponNos] = useState([]);
  const [couponStats, setCouponStats] = useState([]);
  const [couponTotals, setCouponTotals] = useState({ issued: 0, used: 0, unused: 0, autoDel: 0 });

  const [loading, setLoading] = useState(false);

  const fetchSiteSettings = () => {
    if (!mallId) return;
    api.get(`/api/${mallId}/settings`)
      .then(({ data }) => {
        const url = data?.siteBaseUrl || '';
        setSiteBaseUrl(url);
        setUrlInput(url);
      })
      .catch(() => message.error('홈페이지 주소 정보를 불러오지 못했습니다.'));
  };

  useEffect(() => {
    if (!mallId) return;
    
    api.get(`/api/${mallId}/events`)
      .then(({ data }) => {
        const evs = (data || []).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
        setEvents(evs);
        setEventCount(evs.length);
        if (evs.length && !selectedEvent) {
            setSelectedEvent(evs[0]._id);
        }
      })
      .catch(() => message.error('이벤트 목록을 불러오지 못했습니다.'));

    api.get(`/api/${mallId}/coupons`)
      .then(res => setCouponCount(res.data.length))
      .catch(() => {});
      
    fetchSiteSettings();

  }, [mallId]);

  useEffect(() => {
    setCouponStats([]);
    setCouponTotals({ issued:0, used:0, unused:0, autoDel:0 });
    setCouponNos([]);

    if (!mallId || !selectedEvent) {
      setUrls([]); setSelectedUrl(null); setMinDate(null);
      return;
    }

    const ev = events.find(e => e._id === selectedEvent);
    if (ev?.createdAt) {
        const created = dayjs(ev.createdAt);
        setMinDate(created);
        setRange([created, dayjs()]);
    }

    // ✨ 바로 이 부분입니다! 백엔드에 추가된 API를 호출하여 페이지 목록을 가져옵니다.
    api.get(`/api/${mallId}/analytics/${selectedEvent}/urls`)
      .then(res => {
        const list = res.data || [];
        setUrls(list);
        // 목록이 있으면 첫 번째 항목을 자동으로 선택합니다.
        setSelectedUrl(list.length > 0 ? list[0] : null);
      })
      .catch(() => message.error('설치된 페이지 URL 목록을 불러오지 못했습니다.'));

    api.get(`/api/${mallId}/events/${selectedEvent}`)
      .then(({ data }) => {
        const all = [];
        const blocks = data.content?.blocks || [];
        const images = data.images || [];
        
        [...blocks, ...images].forEach(item => {
            if (item.type === 'image' || item.src) {
                (item.regions || []).forEach(r => {
                    if (r.coupon) all.push(r.coupon);
                });
            }
        });
        setCouponNos(Array.from(new Set(all)));
      })
      .catch(() => {});
  }, [mallId, selectedEvent, events]);

  useEffect(() => {
    const [start, end] = range;
    const arr = [];
    let cur = start.startOf('day');
    const last = end.startOf('day');
    while (cur.isSameOrBefore(last, 'day')) {
      arr.push(cur.format('YYYY-MM-DD'));
      cur = cur.add(1, 'day');
    }
    setDates(arr);
  }, [range]);

  useEffect(() => {
    if (!mallId || !selectedEvent) return;
    api.get(`/api/${mallId}/analytics/${selectedEvent}/product-performance`)
      .then(res => setProdPerf(res.data || []))
      .catch(() => {});
  }, [mallId, selectedEvent]);

  const fetchData = () => {
    if (!mallId || !selectedEvent || !selectedUrl) return;
    setLoading(true);

    const [s, e] = range.map(d => d.format('YYYY-MM-DD'));
    const params = {
      start_date: `${s}T00:00:00+09:00`,
      end_date:   `${e}T23:59:59.999+09:00`,
      url:        selectedUrl
    };

    const visReq   = api.get(`/api/${mallId}/analytics/${selectedEvent}/visitors-by-date`, { params });
    const devReq   = api.get(`/api/${mallId}/analytics/${selectedEvent}/devices-by-date`,    { params });
    const couponReq = couponNos.length
      ? api.get(`/api/${mallId}/analytics/${selectedEvent}/coupon-stats`, {
          params: {
            coupon_no:  couponNos.join(','),
            start_date: s,
            end_date:   e
          }
        })
      : Promise.resolve({ data: [] });

    Promise.all([visReq, devReq, couponReq])
      .then(([visRes, devRes, cpnRes]) => {
        const vis = Array.isArray(visRes.data) ? visRes.data : [];
        const newMap = new Map(vis.map(o => [o.date, o.newVisitors   || 0]));
        const retMap = new Map(vis.map(o => [o.date, o.returningVisitors || 0]));
        setNewByDate(dates.map(d => newMap.get(d) || 0));
        setRetByDate(dates.map(d => retMap.get(d) || 0));

        const dev = Array.isArray(devRes.data) ? devRes.data : [];
        const pcMap = new Map(), andMap = new Map(), iosMap = new Map();
        dev.forEach(o => {
          if (o.device === 'PC')      pcMap.set(o.date, o.count);
          else if (o.device === 'Android') andMap.set(o.date, o.count);
          else if (o.device === 'iOS')     iosMap.set(o.date, o.count);
        });
        setPcByDate(  dates.map(d => pcMap.get(d)  || 0));
        setAndByDate(dates.map(d => andMap.get(d) || 0));
        setIosByDate(dates.map(d => iosMap.get(d) || 0));

        const cstats = Array.isArray(cpnRes.data) ? cpnRes.data : [];
        setCouponStats(cstats);
        const tot = cstats.reduce((acc, cur) => {
          acc.issued += cur.issuedCount      || 0;
          acc.used   += cur.usedCount        || 0;
          acc.unused += cur.unusedCount      || 0;
          acc.autoDel+= cur.autoDeletedCount || 0;
          return acc;
        }, { issued: 0, used: 0, unused: 0, autoDel: 0 });
        setCouponTotals(tot);
      })
      .catch(() => message.error('데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  };
  useEffect(fetchData, [selectedUrl, range, couponNos]);

  const handleSaveOrUpdateSiteUrl = () => {
    let urlToSave = urlInput.trim();
    if (!urlToSave) {
      message.error('URL을 입력해주세요.');
      return;
    }
    if (!/^https?:\/\//i.test(urlToSave)) {
      urlToSave = 'https://' + urlToSave;
    }

    api.put(`/api/${mallId}/settings`, { siteBaseUrl: urlToSave })
      .then(() => {
        fetchSiteSettings();
        message.success('홈페이지 주소가 저장/변경되었습니다.');
      })
      .catch(() => message.error('주소 저장에 실패했습니다.'));
  };

  const handleDeleteSiteUrl = () => {
    api.put(`/api/${mallId}/settings`, { siteBaseUrl: '' })
      .then(() => {
        fetchSiteSettings();
        message.success('홈페이지 주소가 삭제되었습니다.');
      })
      .catch(() => message.error('주소 삭제에 실패했습니다.'));
  };
  
  const visitorLineOpt = {
    title:   { text: '신규 vs 재방문', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend:  { data: ['신규','재방문'], top: 30 },
    xAxis:   { type: 'category', data: dates },
    yAxis:   { type: 'value' },
    series: [
      { name: '신규',   type: 'line', data: newByDate },
      { name: '재방문', type: 'line', data: retByDate }
    ]
  };

  const deviceLineOpt = {
    title:   { text: '디바이스별 유입', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend:  { data: ['PC','Android','iOS'], top: 30 },
    xAxis:   { type: 'category', data: dates },
    yAxis:   { type: 'value' },
    series: [
      { name: 'PC',      type: 'line', data: pcByDate },
      { name: 'Android', type: 'line', data: andByDate },
      { name: 'iOS',     type: 'line', data: iosByDate }
    ]
  };

  const top5Opt = {
    title:  { text: '상품 클릭 Top 5', left: 'center', top: 10 },
    tooltip:{ trigger: 'axis' },
    grid:   { left: 60, right: 20, bottom: 60 },
    xAxis:  {
      type: 'category',
      data: prodPerf.slice(0,5).map(o => o.productName),
      axisLabel: { rotate: 30 }
    },
    yAxis: { type: 'value' },
    series:[{
      name: '클릭수',
      type: 'bar',
      data: prodPerf.slice(0,5).map(o => o.clicks),
      itemStyle: {
        color: ({ dataIndex }) => {
          const colors = ['#fe6326', '#91CC75', '#FAC858', '#EE6666', '#73C0DE'];
          return colors[dataIndex % colors.length];
        }
      }
    }]
  };

  return (
    <Space direction="vertical" style={{ width: '100%', padding: 24, gap: 24 }} className="dashbord">
      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col>
            <Select 
              placeholder="이벤트 선택" 
              options={events.map(e => ({ label: e.title||'(제목없음)', value: e._id }))} 
              value={selectedEvent} 
              onChange={setSelectedEvent} 
              style={{ width: 200 }} 
            />
          </Col>
          <Col>
            <Select 
              placeholder="페이지 선택" 
              options={urls.map(u => ({ label: u, value: u }))} 
              value={selectedUrl} 
              onChange={setSelectedUrl} 
              style={{ width: 240 }} 
            />
          </Col>
          <Col>
            <RangePicker 
              value={range} 
              format="YYYY-MM-DD" 
              onChange={vals => vals && setRange(vals)} 
              disabledDate={d => minDate && d.isBefore(minDate,'day')} 
            />
          </Col>
          <Col>
            <Button type="primary" onClick={fetchData}>조회</Button>
          </Col>
          
          <Col>
            <Tooltip title={(!siteBaseUrl || !selectedUrl) ? '홈페이지 주소와 페이지를 모두 선택해주세요.' : ''}>
              <Button
                type="primary"
                icon={<LinkOutlined />}
                disabled={!siteBaseUrl || !selectedUrl}
                onClick={() => { if (siteBaseUrl && selectedUrl) window.open(siteBaseUrl + selectedUrl, '_blank'); }}
              >
                이벤트 페이지 이동
              </Button>
            </Tooltip>
          </Col>
          <Col>
            <Tooltip title={(!siteBaseUrl || !selectedUrl) ? '홈페이지 주소와 페이지를 모두 선택해주세요.' : ''}>
              <Button
                icon={<CopyOutlined />}
                disabled={!siteBaseUrl || !selectedUrl}
                onClick={() => {
                  if (siteBaseUrl && selectedUrl) {
                    navigator.clipboard.writeText(siteBaseUrl + selectedUrl);
                    message.success('링크가 복사되었습니다.');
                  }
                }}
              >
                링크 복사
              </Button>
            </Tooltip>
          </Col>

          <Col flex="auto" />
          <Col className="kpi-col">
            <Statistic title="전체 이벤트 수" value={eventCount} suffix="개" valueStyle={{ fontSize: 18 }} style={{textAlign:'center'}}/>
          </Col>
          <Col className="kpi-col">
            <Statistic title="전체 쿠폰 수" value={couponCount} suffix="개" style={{ marginLeft: 16,textAlign:'center' }} valueStyle={{ fontSize: 18 }}/>
          </Col>
        </Row>
      </Card>
      
      <Card>
        <Space.Compact style={{ width: '100%' }}>
          <Input
            addonBefore="홈페이지 주소"
            placeholder="예: https://www.myshop.com"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onPressEnter={handleSaveOrUpdateSiteUrl}
          />
          {siteBaseUrl ? (
            <>
              <Button type="primary" onClick={handleSaveOrUpdateSiteUrl}>
                주소 변경
              </Button>
              <Popconfirm
                title="홈페이지 주소를 삭제하시겠습니까?"
                onConfirm={handleDeleteSiteUrl}
                okText="삭제"
                cancelText="취소"
              >
                <Button danger>삭제</Button>
              </Popconfirm>
            </>
          ) : (
            <Button type="primary" onClick={handleSaveOrUpdateSiteUrl}>
              홈페이지 주소 등록
            </Button>
          )}
        </Space.Compact>
      </Card>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card bodyStyle={{ height: 320 }}>
            <ReactECharts option={visitorLineOpt} style={{ height: '100%' }} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="쿠폰 다운로드 / 주문 완료 통계" style={{ height: 320, overflowY: 'auto', textAlign: 'center' }} bodyStyle={{ padding: 16, height: '100%' }} loading={loading}>
            <Space size="large" style={{ marginBottom: 16, justifyContent: 'center' }} className="couponTxtList">
              <Statistic title="발급 쿠폰"   value={couponTotals.issued}  suffix="개" valueStyle={{ fontSize: 18 }} />
              <Statistic title="사용 쿠폰"   value={couponTotals.used}    suffix="개" valueStyle={{ fontSize: 18 }} />
              <Statistic title="미사용 쿠폰" value={couponTotals.unused}  suffix="개" valueStyle={{ fontSize: 18 }} />
            </Space>
            <Table
              size="small"
              columns={[
                { title: '쿠폰번호',     dataIndex: 'couponNo',    key: 'couponNo' },
                { title: '다운로드 수',  dataIndex: 'issuedCount', key: 'issuedCount', align: 'right' },
                { title: '주문 완료 수', dataIndex: 'usedCount',   key: 'usedCount',   align: 'right' }
              ]}
              dataSource={couponStats}
              rowKey="couponNo"
              pagination={false}
              scroll={{ x: 'max-content' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card bodyStyle={{ height: 320 }}>
            <ReactECharts option={deviceLineOpt} style={{ height: '100%' }} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card bodyStyle={{ height: 320 }}>
            <ReactECharts option={top5Opt} style={{ height: '100%' }} />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}