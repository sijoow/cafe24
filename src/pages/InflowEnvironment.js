// src/pages/InflowEnvironment.jsx

import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Select,
  DatePicker,
  Button,
  Space,
  message,
  Grid,
} from 'antd';
import api from '../axios';                  // ← 우리 axios 인스턴스
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import './NormalSection.css';

dayjs.extend(isSameOrBefore);

const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

export default function InflowEnvironment() {
  // ─── 1) mallId 결정 ───────────────────────────────────────────
  const [mallId, setMallId] = useState(null);
  useEffect(() => {
    const params  = new URLSearchParams(window.location.search);
    const q       = params.get('mall_id') || params.get('state') || params.get('mallId');
    if (q) {
      localStorage.setItem('mallId', q);
      setMallId(q);
    } else {
      const stored = localStorage.getItem('mallId');
      if (stored) setMallId(stored);
      else message.error('mall_id 파라미터가 없습니다.');
    }
  }, []);

  const screens = useBreakpoint();
  const isMobile = screens.sm === false;

  // ─── 상태 선언 ───────────────────────────────────────────────
  const [events, setEvents]               = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [urls, setUrls]                   = useState([]); // 원본 URL 리스트
  const [urlOptions, setUrlOptions]       = useState([]); // Select 옵션 (label/value/title)
  const [urlMap, setUrlMap]               = useState(new Map()); // normalized -> [originals]
  const [selectedUrl, setSelectedUrl]     = useState(null); // 정규화된 값

  const [range, setRange]                 = useState([dayjs().subtract(7, 'day'), dayjs()]);
  const [minDate, setMinDate]             = useState(null);
  const [pieData, setPieData]             = useState([]);
  const [lineData, setLineData]           = useState({ dates: [], devices: [], series: [] });
  const [loading, setLoading]             = useState(false);

  // ─── helper: 정규화 (앞부분 skin-..., 숫자/슬래시 제거, 쿼리/해시 제거, trim) ─────────
  const normalizePath = (urlCandidate) => {
    if (!urlCandidate) return '/';
    // 절대 URL이면 pathname만 추출해서 정규화 (쿼리/해시 제거)
    if (/^https?:\/\//i.test(urlCandidate)) {
      try {
        const p = new URL(urlCandidate);
        urlCandidate = p.pathname || '';
      } catch (e) {
        urlCandidate = String(urlCandidate);
      }
    }

    let s = String(urlCandidate).trim();

    // 쿼리나 해시 제거
    s = s.split(/[?#]/)[0];

    // remove leading slashes
    s = s.replace(/^\/+/, '');

    if (!s) return '/';

    // strip trailing slashes
    s = s.replace(/\/+$/, '');

    // patterns to strip repeatedly from the start:
    const patterns = [
      /^skin-mobile\/?/i,
      /^skin-[^\/]+\/?/i,
      /^\d+\/?/
    ];

    let changed = true;
    while (changed) {
      changed = false;
      for (const p of patterns) {
        if (p.test(s)) {
          s = s.replace(p, '');
          changed = true;
        }
      }
    }

    if (!s) return '/';
    if (!s.startsWith('/')) s = '/' + s;
    return s;
  };

  // ─── helper: 후보 URL 배열 생성 (정규화 + 원본 + 변형(슬래시 유무)) ─────────────────
  const buildUrlCandidates = (normalized) => {
    const candidates = new Set();
    if (!normalized) return [];
    // normalized (leading slash)
    candidates.add(normalized);
    // without leading slash
    candidates.add(normalized.replace(/^\//, ''));
    // if urlMap has originals, add them + their slash/no-slash variants
    const originals = urlMap.get(normalized) || [];
    originals.forEach(o => {
      candidates.add(o);
      candidates.add(o.replace(/^\/+/, ''));
      // also try versions stripped of query/hash
      candidates.add(String(o).split(/[?#]/)[0]);
      candidates.add(String(o).split(/[?#]/)[0].replace(/^\/+/, ''));
    });
    return Array.from(candidates);
  };

  // ─── 2) 이벤트 목록 로드 ───────────────────────────────────────
  useEffect(() => {
    if (!mallId) return;
    api.get(`/api/${mallId}/events`)
      .then(res => {
        const sorted = (res.data || [])
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setEvents(sorted);
        if (sorted.length) setSelectedEvent(sorted[0]._id);
      })
      .catch(() => {
        message.error('이벤트 목록을 불러오지 못했습니다.');
      });
  }, [mallId]);

  // ─── 3) selectedEvent 변경 시: URL 목록 + 날짜 초기화 ─────────────
  useEffect(() => {
    if (!mallId || !selectedEvent) {
      setUrls([]);
      setUrlOptions([]);
      setUrlMap(new Map());
      setSelectedUrl(null);
      setMinDate(null);
      return;
    }

    // URL 목록
    api.get(`/api/${mallId}/analytics/${selectedEvent}/urls`)
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : [];
        setUrls(list);

        // normalized map 생성
        const normalizedMap = new Map();
        for (const orig of list) {
          const n = normalizePath(orig);
          if (!normalizedMap.has(n)) normalizedMap.set(n, [orig]);
          else normalizedMap.get(n).push(orig);
        }

        // options 생성: label은 "/test1.html (2)" 같이 보이고, value는 정규화된 값,
        // title에 원본을 join 해두면 브라우저 툴팁으로 확인 가능
        const options = Array.from(normalizedMap.entries()).map(([norm, originals]) => {
          const count = originals.length;
          const label = count > 1 ? `${norm} (${count})` : norm;
          return { label, value: norm, title: originals.join('\n') };
        });

        setUrlOptions(options);
        setUrlMap(normalizedMap);
        setSelectedUrl(options.length ? options[0].value : null);
      })
      .catch(() => {
        message.error('URL 목록을 불러오지 못했습니다.');
        setUrls([]);
        setUrlOptions([]);
        setUrlMap(new Map());
        setSelectedUrl(null);
      });

    // 이벤트 생성일로 최소 날짜 초기화
    const ev = events.find(e => e._id === selectedEvent);
    if (ev?.createdAt) {
      const start = dayjs(ev.createdAt);
      setMinDate(start);
      setRange([start, dayjs()]);
    }
  }, [mallId, selectedEvent, events]);

  // ─── helper: devices-by-date 응답 병합 (date+device 기준 합산) ─────────
  const mergeDevicesByDate = (responsesArray) => {
    // responsesArray: array of arrays (each inner is [{date, device, count}, ...])
    const map = new Map(); // key: date -> { device -> count }
    responsesArray.forEach(arr => {
      if (!Array.isArray(arr)) return;
      arr.forEach(rec => {
        const date = rec.date;
        const device = rec.device || rec.device_type || rec.deviceType || 'Unknown';
        const count = rec.count || 0;
        if (!map.has(date)) map.set(date, new Map());
        const devMap = map.get(date);
        devMap.set(device, (devMap.get(device) || 0) + count);
      });
    });

    // convert to a map-of-maps structure kept as-is for lookups
    return map; // Map { date => Map { device => count } }
  };

  // ─── 4) 데이터 조회 함수 (후보 URL 여러개로 시도해서 합산) ───────────────────────
  const fetchData = useCallback(async () => {
    if (!mallId || !selectedEvent || !selectedUrl) return;
    setLoading(true);

    const [start, end] = range.map(d => d.format('YYYY-MM-DD'));
    try {
      const candidates = buildUrlCandidates(selectedUrl);
      if (candidates.length === 0) candidates.push(selectedUrl);

      // 1) devices (pie) — 후보 각각 호출해서 합산
      const devPromises = candidates.map(candidate =>
        api.get(`/api/${mallId}/analytics/${selectedEvent}/devices`, {
          params: {
            start_date: `${start}T00:00:00+09:00`,
            end_date:   `${end}T23:59:59.999+09:00`,
            url:        candidate
          }
        })
        .then(res => Array.isArray(res.data) ? res.data : [])
        .catch(err => {
          console.warn('devices failed for', candidate, err && err.message);
          return [];
        })
      );

      // 2) devices-by-date (line) — 후보 각각 호출
      const linePromises = candidates.map(candidate =>
        api.get(`/api/${mallId}/analytics/${selectedEvent}/devices-by-date`, {
          params: {
            start_date: `${start}T00:00:00+09:00`,
            end_date:   `${end}T23:59:59.999+09:00`,
            url:        candidate
          }
        })
        .then(res => Array.isArray(res.data) ? res.data : [])
        .catch(err => {
          console.warn('devices-by-date failed for', candidate, err && err.message);
          return [];
        })
      );

      const [devResultsArr, lineResultsArr] = await Promise.all([
        Promise.all(devPromises), Promise.all(linePromises)
      ]);
      // devResultsArr: array of arrays; flatten and sum by device_type
      const flatDev = devResultsArr.flat();
      const deviceCountMap = new Map();
      flatDev.forEach(r => {
        const type = r.device_type || r.device || r.deviceType || 'Unknown';
        const cnt = r.count || 0;
        deviceCountMap.set(type, (deviceCountMap.get(type) || 0) + cnt);
      });

      const allDevices = ['PC', 'Android', 'iOS'];
      setPieData(allDevices.map(dev => ({
        name: dev,
        value: deviceCountMap.get(dev) || 0
      })));

      // line: merge responses by date+device
      const flatLine = lineResultsArr.flat();
      const dateDeviceMap = mergeDevicesByDate([flatLine]); // returns Map(date -> Map(device->count))

      // 날짜 축 생성
      const dates = [];
      let cur  = range[0].startOf('day');
      const last = range[1].startOf('day');
      while (cur.isSameOrBefore(last, 'day')) {
        dates.push(cur.format('YYYY-MM-DD'));
        cur = cur.add(1, 'day');
      }

      // series 구성: 각 디바이스별로 dates 순서에 맞춰 count 채우기
      const series = allDevices.map(dev => ({
        name: dev,
        type: 'line',
        data: dates.map(d => {
          const devMap = dateDeviceMap.get(d);
          return devMap ? (devMap.get(dev) || 0) : 0;
        })
      }));

      setLineData({ dates, devices: allDevices, series });
    } catch (err) {
      console.error('유입환경 데이터 로드 실패', err);
      message.error('유입환경 데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  }, [mallId, selectedEvent, selectedUrl, range, urlMap]);

  // ─── 5) 자동 조회 트리거 ───────────────────────────────────────
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── ECharts 옵션 ─────────────────────────────────────────────
  const pieOption = {
    title:   { text: '유입 환경 (디바이스)', left: 'center', top: 8, textStyle: { fontSize: isMobile ? 14 : 16 } },
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend:  {
      orient: isMobile ? 'horizontal' : 'vertical',
      bottom: isMobile ? 10 : 'center',
      left:   isMobile ? 'center'   : '75%',
      itemWidth: 12,
      itemHeight:12,
      textStyle:{ fontSize: isMobile ? 12 : 13 }
    },
    series: [ {
      name: '건수', type: 'pie',
      radius:  isMobile ? ['30%','50%'] : ['40%','60%'],
      center:  isMobile ? ['50%','45%'] : ['40%','50%'],
      avoidLabelOverlap: true,
      label: { show: false },
      emphasis: { label: { show: true, fontSize: isMobile ? 12 : 14, fontWeight: 'bold' } },
      data: pieData,
    } ],
  };

  const lineOption = {
    title:   { text: '일자별 디바이스 유입', left: 'center' },
    tooltip: { trigger: 'axis' },
    legend:  {
      data: lineData.devices,
      orient: isMobile ? 'horizontal' : 'vertical',
      bottom: isMobile ? 0 : 'auto',
      left:   isMobile ? 'center' : 'right',
    },
    xAxis:   { type: 'category', data: lineData.dates },
    yAxis:   { type: 'value' },
    series:  lineData.series,
  };

  // ─── 렌더링 ───────────────────────────────────────────────────
  return (
    <Space direction="vertical" style={{ width: '100%' }} className="InflowEnvironment">
      <Card size={isMobile ? 'small' : 'default'}>
        <Space
          wrap
          direction={isMobile ? 'vertical' : 'horizontal'}
          size="middle"
          style={{ width: '100%' }}
        >
          <Select
            placeholder="이벤트 선택"
            options={events.map(e => ({ label: e.title || '(제목없음)', value: e._id }))}
            value={selectedEvent}
            onChange={setSelectedEvent}
            style={{ width: isMobile ? '100%' : 200 }}
            allowClear
          />
          <Select
            placeholder="페이지 선택"
            options={urlOptions}
            value={selectedUrl}
            onChange={setSelectedUrl}
            style={{ width: isMobile ? '100%' : 240 }}
            allowClear
            showSearch
            optionLabelProp="value"
            filterOption={(input, option) => {
              const val = (option?.value || '').toString().toLowerCase();
              const lab = (option?.label || '').toString().toLowerCase();
              const title = (option?.title || '').toString().toLowerCase();
              const needle = (input || '').toLowerCase();
              return val.includes(needle) || lab.includes(needle) || title.includes(needle);
            }}
          />

          {isMobile ? (
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <DatePicker
                value={range[0]}
                onChange={d => d && setRange([d, range[1]])}
                disabledDate={d => minDate && d.isBefore(minDate, 'day')}
                style={{ width: '100%' }}
              />
              <DatePicker
                value={range[1]}
                onChange={d => d && setRange([range[0], d])}
                disabledDate={d => minDate && d.isBefore(minDate, 'day')}
                style={{ width: '100%' }}
              />
            </Space>
          ) : (
            <RangePicker
              value={range}
              onChange={setRange}
              disabledDate={d => minDate && d.isBefore(minDate, 'day')}
              style={{ width: 280 }}
            />
          )}

          <Button type="primary" loading={loading} onClick={fetchData} block={isMobile}>
            검색
          </Button>
        </Space>
      </Card>

      <div style={{
        display:       'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap:           16,
        marginTop:     16,
      }}>
        <Card
          title="디바이스 분포"
          loading={loading}
          style={{ flex: 1 }}
          size={isMobile ? 'small' : 'default'}
        >
          <ReactECharts option={pieOption} style={{ height: isMobile ? 200 : 300 }} />
        </Card>
        <Card
          title="일자별 디바이스 유입"
          loading={loading}
          style={{ flex: 2 }}
          size={isMobile ? 'small' : 'default'}
        >
          <ReactECharts option={lineOption} style={{ height: isMobile ? 200 : 300 }} />
        </Card>
      </div>
    </Space>
  );
}
