// src/pages/EventCreate.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import MorePrd from './MorePrd';
import {
  Card, Input, Button, Select, Space, Upload, Form, message, Segmented, Modal,
  InputNumber, Checkbox, ColorPicker, Alert, Grid, Divider, Tag, Tooltip, Collapse, Tabs, Switch, DatePicker,
} from 'antd';
import dayjs from 'dayjs';
import {
  UploadOutlined, DeleteOutlined, LinkOutlined, TagOutlined, VideoCameraAddOutlined,
  EditOutlined, FontSizeOutlined, BlockOutlined, ShoppingCartOutlined, YoutubeOutlined,
  SaveOutlined, PlusOutlined, EyeOutlined, PictureOutlined,
  ExclamationCircleOutlined, SwapOutlined, ExpandOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useNavigate } from 'react-router-dom';
import api from '../axios';
import { renderGrid, CARD_TEMPLATES, SAMPLE_PRODUCTS, DragScroll } from '../components/productCard';
import PopupImageRegionEditor from '../components/PopupImageRegionEditor';
import './EventCreate.css';
import sha256 from 'crypto-js/sha256';
import encHex from 'crypto-js/enc-hex';

const { Option } = Select;
const { useBreakpoint } = Grid;

// --- Utility Functions ---
const getYouTubeId = (input) => {
  if (!input) return null;
  if (/^[\w-]{11}$/.test(input)) return input;
  try {
    const url = new URL(input.trim());
    const host = url.hostname.replace('www.', '');
    if (host === 'youtu.be') return url.pathname.slice(1);
    if (host.includes('youtube.com')) {
      if (url.searchParams.get('v')) return url.searchParams.get('v');
      const m = url.pathname.match(/\/(embed|shorts)\/([\w-]{11})/);
      if (m) return m[2];
    }
  } catch (_) {}
  return null;
};

const buildYouTubeSrc = (id, autoplay = false, loop = false) => {
  const params = new URLSearchParams({ autoplay: autoplay ? '1' : '0', mute: autoplay ? '1' : '0', playsinline: '1', rel: 0, modestbranding: 1, enablejsapi: 1 });
  if (loop) { params.set('loop', '1'); params.set('playlist', id); }
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
};

const escapeHtml = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function YouTubeEmbed({ id, ratioW = 16, ratioH = 9, title = 'YouTube video', autoplay = false, loop = false }) {
  const src = buildYouTubeSrc(id, autoplay, loop);
  return (
    <div style={{ width: '100%', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: `${ratioW} / ${ratioH}` }}>
        <iframe src={src} title={title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, borderRadius: '6px' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
      </div>
    </div>
  );
}

// renderGrid / CARD_TEMPLATES 는 ../components/productCard 로 분리 (미리보기 3개 화면 공유)

// 타임세일 카운트다운 — 종료까지 D-H:M:S 자체 틱
export function Countdown({ endDate }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const end = endDate ? new Date(endDate).getTime() : 0;
  const pad = (n) => String(n).padStart(2, '0');
  if (!end) return <span style={{ color: '#999' }}>종료일 미설정</span>;
  let diff = end - now;
  if (diff <= 0) return <span style={{ fontWeight: 700, color: '#999' }}>종료된 타임세일</span>;
  const d = Math.floor(diff / 86400000); diff -= d * 86400000;
  const h = Math.floor(diff / 3600000); diff -= h * 3600000;
  const m = Math.floor(diff / 60000); diff -= m * 60000;
  const s = Math.floor(diff / 1000);
  return <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{d > 0 ? `${d}일 ` : ''}{pad(h)}:{pad(m)}:{pad(s)}</span>;
}

// 타임세일 배너 디자인 프리셋 (미리보기·라이브 동일). eventOnimon.js TIMESALE_BANNERS 와 동기화 필요.
export const TIMESALE_BANNERS = {
  dark: { label: '다크', css: { background: '#1a1a1a', color: '#fff' }, cd: '#ff6b6b' },
  red: { label: '레드 강조', css: { background: '#e8332e', color: '#fff' }, cd: '#ffe600' },
  minimal: { label: '미니멀(라이트)', css: { background: '#fff', color: '#222', border: '1px solid #e0e0e0' }, cd: '#e8332e' },
  gradient: { label: '그라데이션', css: { background: 'linear-gradient(90deg,#7b2ff7,#f107a3)', color: '#fff' }, cd: '#ffe600' },
};
export function TimesaleBanner({ title, endDate, showCountdown, bannerStyle }) {
  const bn = TIMESALE_BANNERS[bannerStyle] || TIMESALE_BANNERS.dark;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px 16px', borderRadius: 8, ...bn.css }}>
      <ClockCircleOutlined /><strong>{title || '타임세일'}</strong>
      {showCountdown !== false && <span style={{ marginLeft: 8, color: bn.cd }}>⏱ <Countdown endDate={endDate} /></span>}
    </div>
  );
}

export const GridPreview = ({ size, active, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: '8px',
        border: `2px solid ${active ? '#fe6326' : '#d9d9d9'}`,
        borderRadius: '8px',
        width: '70px',
        height: '70px',
        backgroundColor: active ? '#fff7e6' : 'white',
        transition: 'all 0.2s',
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${size}, 1fr)`, gap: '4px', width: '32px', height: '32px', marginBottom: '4px' }}>
        {Array.from({ length: size * size }).map((_, i) => (
          <div key={i} style={{ backgroundColor: active ? '#fe6326' : '#d9d9d9', borderRadius: '2px' }}></div>
        ))}
      </div>
      <span style={{ fontSize: '12px', fontWeight: active ? 'bold' : 'normal', color: active ? '#fe6326' : '#595959' }}>{size}×{size}</span>
    </div>
  );
};

// ③ 기능 추가(롤링) 탭 — 초보자용 비주얼 안내: 작은 일러스트 아이콘 + 옵션 행
export const SLIDE_ICON = {
  perView: (<svg width="44" height="30" viewBox="0 0 44 30"><rect x="3" y="7" width="11" height="16" rx="2" fill="#cdd4de" /><rect x="16.5" y="7" width="11" height="16" rx="2" fill="#9aa3b2" /><rect x="30" y="7" width="11" height="16" rx="2" fill="#cdd4de" /></svg>),
  peek: (<svg width="44" height="30" viewBox="0 0 44 30"><rect x="3" y="6" width="24" height="18" rx="3" fill="#9aa3b2" /><rect x="30" y="6" width="18" height="18" rx="3" fill="#dde2e8" /></svg>),
  loop: (<svg width="38" height="30" viewBox="0 0 24 24" fill="none" stroke="#8a93a2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12a8 8 0 0 1 13.5-5.7L20 8" /><path d="M20 3.5V8h-4.5" /><path d="M20 12a8 8 0 0 1-13.5 5.7L4 16" /><path d="M4 20.5V16h4.5" /></svg>),
  autoplay: (<svg width="38" height="30" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#8a93a2" strokeWidth="2" /><path d="M10 8.2l5.2 3.8-5.2 3.8z" fill="#8a93a2" /></svg>),
  arrows: (<svg width="44" height="30" viewBox="0 0 44 30" fill="none" stroke="#8a93a2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 9l-5 6 5 6" /><path d="M27 9l5 6-5 6" /></svg>),
  dots: (<svg width="44" height="30" viewBox="0 0 44 30"><circle cx="13" cy="15" r="3.5" fill="#8a93a2" /><circle cx="24" cy="15" r="3.5" fill="#cdd4de" /><circle cx="35" cy="15" r="3.5" fill="#cdd4de" /></svg>),
};
export function SlideConcept() {
  return (
    <svg width="92" height="58" viewBox="0 0 92 58" style={{ flexShrink: 0 }}>
      <rect x="6" y="12" width="26" height="34" rx="4" fill="#fff" stroke="#bcd0ff" strokeWidth="2" />
      <rect x="35" y="9" width="28" height="40" rx="4" fill="#fff" stroke="#5b8cff" strokeWidth="2" />
      <rect x="66" y="12" width="22" height="34" rx="4" fill="#fff" stroke="#bcd0ff" strokeWidth="2" />
      <path d="M3 29h6M9 26l-4 3 4 3" fill="none" stroke="#8aa9ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M89 29h-6M83 26l4 3-4 3" fill="none" stroke="#8aa9ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="40" cy="54" r="2.2" fill="#5b8cff" /><circle cx="49" cy="54" r="2.2" fill="#cdd9f6" /><circle cx="58" cy="54" r="2.2" fill="#cdd9f6" />
    </svg>
  );
}
// ② 디자인 탭 — 카드 디자인 옵션 행 아이콘
export const CARD_ICON = {
  thumb: (<svg width="44" height="30" viewBox="0 0 44 30"><rect x="11" y="4" width="22" height="22" rx="6" fill="#cdd4de" /></svg>),
  icon: (<svg width="44" height="30" viewBox="0 0 44 30"><rect x="8" y="4" width="28" height="22" rx="3" fill="#e3e7ee" /><circle cx="14" cy="10" r="4" fill="#8a93a2" /></svg>),
  name: (<svg width="44" height="30" viewBox="0 0 44 30"><rect x="8" y="10" width="28" height="4.5" rx="2" fill="#8a93a2" /><rect x="8" y="18" width="17" height="4.5" rx="2" fill="#cdd4de" /></svg>),
  desc: (<svg width="44" height="30" viewBox="0 0 44 30"><rect x="8" y="11" width="28" height="3.5" rx="1.7" fill="#aab2c0" /><rect x="8" y="18" width="21" height="3.5" rx="1.7" fill="#d2d8e0" /></svg>),
  color: (<svg width="44" height="30" viewBox="0 0 44 30"><circle cx="22" cy="15" r="8" fill="#ff4d4f" /></svg>),
};
export function OptRow({ visual, title, desc, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid #f5f5f5' }}>
      <div style={{ width: 46, height: 30, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{visual}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{title}</div>
        {desc && <div style={{ fontSize: 11, color: '#999', marginTop: 1, lineHeight: 1.4 }}>{desc}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

// 이미지 슬라이드 예시 미리보기 — 선택 옵션(개수/peek/화살표/점/자동/반복) 반영. 모달·캔버스 공용.
export function ImageSlidePreview({ images, sw = {} }) {
  const imgs = (images || []).filter(im => im && im.src);
  if (imgs.length === 0) return null;
  const perView = Math.max(1, Number(sw.perView) || 1);
  const gap = sw.gap != null ? sw.gap : (perView > 1 ? 12 : 0);
  const peekPx = sw.peek ? 24 : 0;
  const basis = `calc((100% - ${gap * (perView - 1)}px - ${peekPx}px) / ${perView})`;
  const ac = sw.activeColor || '#333333';
  const arrowBase = { position: 'absolute', top: '42%', transform: 'translateY(-50%)', width: 26, height: 26, borderRadius: '50%', background: ac, boxShadow: '0 1px 4px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', zIndex: 2, pointerEvents: 'none' };
  const arrowCls = sw.arrowHover !== false ? 'swprev-arrow' : undefined;
  return (
    <div className="swprev-wrap" style={{ position: 'relative', border: '1px solid #eee', borderRadius: 8, padding: '10px 8px 8px', background: '#fafafa', maxWidth: '100%', overflow: 'hidden' }}>
      <DragScroll style={{ display: 'flex', gap, overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 4 }}>
        {imgs.map((im, i) => (
          <div key={i} style={{ flex: `0 0 ${basis}`, scrollSnapAlign: 'start' }}>
            <img src={im.src} alt="" style={{ width: '100%', display: 'block', borderRadius: 6 }} draggable={false} />
          </div>
        ))}
      </DragScroll>
      {sw.arrows !== false && (<><div className={arrowCls} style={{ ...arrowBase, left: 4 }}>‹</div><div className={arrowCls} style={{ ...arrowBase, right: 4 }}>›</div></>)}
      {sw.pagination !== false && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 8 }}>
          {imgs.slice(0, Math.min(imgs.length, 6)).map((_, i) => <span key={i} style={{ width: i === 0 ? 14 : 6, height: 6, borderRadius: 3, background: i === 0 ? ac : '#ddd' }} />)}
        </div>
      )}
      <div style={{ textAlign: 'center', fontSize: 11, color: '#bbb', marginTop: 6 }}>← 좌우로 드래그/스와이프 →{sw.autoplay ? ` · 자동 ${sw.interval || 3}초` : ''}{sw.loop !== false ? ' · 무한반복' : ''}</div>
    </div>
  );
}

export function ProductBlockModal({ visible, onCancel, onOk, msgApi, isMobile, allCats, initialData }) {
    const [form] = Form.useForm();
    const [registerMode, setRegisterMode] = useState('direct');
    const [gridSize, setGridSize] = useState(2);
    const [layoutType, setLayoutType] = useState('single');
    const [singleRoot, setSingleRoot] = useState(null);
    const [singleSub, setSingleSub] = useState(null);
    const roots = allCats.filter(c => c.category_depth === 1);
    const [tabs, setTabs] = useState([{ title: '', root: null, sub: null }, { title: '', root: null, sub: null }]);
    const [activeColor, setActiveColor] = useState('#fe6326');
    const [directProducts, setDirectProducts] = useState([]);
    const [tabDirectProducts, setTabDirectProducts] = useState({});
    const [morePrdVisible, setMorePrdVisible] = useState(false);
    const [morePrdTarget, setMorePrdTarget] = useState('direct');
    const [morePrdTabIndex, setMorePrdTabIndex] = useState(0);
    const [initialSelected, setInitialSelected] = useState([]);
    // 신규 고도화: 탭별 그리드 / 탭 줄당 개수 / 콘텐츠 너비 / 카테고리 번호 직접입력
    const [tabGridSizes, setTabGridSizes] = useState({});
    const [tabsPerRow, setTabsPerRow] = useState(null);
    const [tabWidthMode, setTabWidthMode] = useState('default');
    const [singleManualCat, setSingleManualCat] = useState('');
    const [cardTemplate, setCardTemplate] = useState('basic');
    const [thumbRadius, setThumbRadius] = useState('square');
    const [iconPosition, setIconPosition] = useState('off');
    const CARD_STYLE_DEFAULT = { nameWeight: 500, nameScale: 1, descWeight: 400, descScale: 1, percentColor: '#ff4d4f', descHide: true };
    const [cardStyle, setCardStyleState] = useState(CARD_STYLE_DEFAULT);
    const setCS = (patch) => setCardStyleState(prev => ({ ...prev, ...patch }));
    const [previewTab, setPreviewTab] = useState(0); // 모달 미리보기에서 선택된 탭
    // ③ 기능 추가 — 상품 롤링(슬라이드). 라이브는 Splide(MIT), perView 0 = 그리드와 동일
    const ROLLING_DEFAULT = { enabled: false, perView: 0, peek: true, autoplay: false, interval: 3, loop: true, arrows: true, pagination: true, activeColor: '#333333', arrowHover: true };
    const [rolling, setRollingState] = useState(ROLLING_DEFAULT);
    const setR = (patch) => setRollingState(prev => ({ ...prev, ...patch }));
    const [soldOutNos, setSoldOutNos] = useState([]); // 품절(SOLD OUT) 처리한 상품번호
    // 롤링 허들: 상품 3개 이상부터 (카테고리 모드는 런타임 로드라 개수 불명 → 허용)
    const knownProductCount = registerMode === 'direct'
      ? (layoutType === 'single' ? directProducts.length : Math.max(0, ...Object.values(tabDirectProducts).map(a => (a || []).length)))
      : null;
    const canRoll = knownProductCount == null || knownProductCount >= 3;
    const [tabRolling, setTabRolling] = useState({}); // { tabIdx: rollingConfig } — 탭별 롤링
    // 탭 모드면 선택 탭(previewTab)의 롤링을 편집/표시, 단품이면 단일 rolling
    const isTabsRoll = layoutType === 'tabs';
    const curRolling = isTabsRoll ? (tabRolling[previewTab] || ROLLING_DEFAULT) : rolling;
    const setCurR = (patch) => { if (isTabsRoll) setTabRolling(prev => ({ ...prev, [previewTab]: { ...(prev[previewTab] || ROLLING_DEFAULT), ...patch } })); else setR(patch); };
    const curCount = isTabsRoll ? (registerMode === 'direct' ? (tabDirectProducts[previewTab] || []).length : null) : knownProductCount;
    const curCanRoll = curCount == null || curCount >= 3;
    const catFilter = (input, option) => {
      const kw = (input || '').trim().toLowerCase();
      if (!kw) return true;
      const label = String(option?.children ?? '').toLowerCase();
      const val = String(option?.value ?? '');
      return label.includes(kw) || val.includes(input.trim());
    };
    const gridOpts = [{ label: '1×1', value: 1 }, { label: '2×2', value: 2 }, { label: '3×3', value: 3 }, { label: '4×4', value: 4 }];

    useEffect(() => {
        const subExists = (no) => !!no && allCats.some(c => String(c.category_no) === String(no) && c.category_depth === 2);
        if (visible && initialData) {
            setRegisterMode(initialData.registerMode || 'direct');
            setGridSize(initialData.gridSize || 2);
            setTabGridSizes(initialData.tabGridSizes || {});
            setLayoutType(initialData.layoutType || 'single');
            setTabsPerRow(initialData.tabsPerRow ?? null);
            setTabWidthMode(initialData.tabWidthMode || 'default');
            setCardTemplate(initialData.cardTemplate || 'basic');
            setThumbRadius(initialData.thumbRadius || 'square');
            setIconPosition(initialData.iconPosition || 'off');
            setCardStyleState({ ...CARD_STYLE_DEFAULT, ...(initialData.cardStyle || {}) });
            setRollingState({ ...ROLLING_DEFAULT, ...(initialData.rolling || {}) });
            setTabRolling(initialData.tabRolling || {});
            setSoldOutNos(initialData.soldOutNos || []);
            if (initialData.registerMode === 'category') {
                if (initialData.layoutType === 'single') {
                    const rootVal = initialData.root ? String(initialData.root) : null;
                    const subVal = initialData.sub ? String(initialData.sub) : null;
                    if (subVal && !subExists(subVal)) { setSingleManualCat(subVal); setSingleRoot(null); setSingleSub(null); }
                    else { setSingleRoot(rootVal); setSingleSub(subVal); setSingleManualCat(''); }
                }
                else if (initialData.layoutType === 'tabs') {
                    const loaded = (initialData.tabs || [{ title: '', root: null, sub: null }, { title: '', root: null, sub: null }]).map(t => {
                        const subVal = t.sub ? String(t.sub) : null;
                        if (subVal && !subExists(subVal)) return { ...t, manual: subVal, sub: null };
                        return { ...t, manual: '' };
                    });
                    setTabs(loaded); setActiveColor(initialData.activeColor || '#fe6326');
                }
            } else if (initialData.registerMode === 'direct') {
                if (initialData.layoutType === 'single') { setDirectProducts(initialData.directProducts || []); }
                else if (initialData.layoutType === 'tabs') { setTabDirectProducts(initialData.tabDirectProducts || {}); setTabs(initialData.tabs || [{ title: '', root: null, sub: null }, { title: '', root: null, sub: null }]); setActiveColor(initialData.activeColor || '#fe6326'); }
            }
        } else if (visible) { form.resetFields(); setRegisterMode('direct'); setGridSize(2); setTabGridSizes({}); setLayoutType('single'); setSingleRoot(null); setSingleSub(null); setSingleManualCat(''); setTabs([{ title: '', root: null, sub: null }, { title: '', root: null, sub: null }]); setActiveColor('#fe6326'); setDirectProducts([]); setTabDirectProducts({}); setTabsPerRow(null); setTabWidthMode('default'); setCardTemplate('basic'); setThumbRadius('square'); setIconPosition('off'); setCardStyleState(CARD_STYLE_DEFAULT); setRollingState(ROLLING_DEFAULT); setTabRolling({}); setSoldOutNos([]); }
    }, [visible, initialData, form, allCats]);

    const handleRegisterModeChange = useCallback((val) => { setRegisterMode(val); setLayoutType('single'); setSingleRoot(null); setSingleSub(null); setSingleManualCat(''); setTabGridSizes({}); setDirectProducts([]); setTabDirectProducts({}); }, []);
    const handleLayoutTypeChange = useCallback((val) => { setLayoutType(val); setTabGridSizes({}); }, []);

    const addTab = useCallback(() => { setTabs(ts => ts.length < 11 ? [...ts, { title: '', root: null, sub: null }] : ts); }, []);
    const updateTab = useCallback((i, key, val) => { setTabs(ts => { const a = [...ts]; a[i] = { ...a[i], [key]: val, ...(key === 'root' ? { sub: null } : {}) }; return a; }); }, []);
    const removeTab = useCallback((index) => { setTabs(prev => prev.length > 2 ? prev.filter((_, i) => i !== index) : prev); const shift = (prev) => { const next = {}; Object.keys(prev).map(Number).filter(k => !isNaN(k)).sort((a, b) => a - b).forEach(k => { if (k < index) next[k] = prev[k]; else if (k > index) next[k - 1] = prev[k]; }); return next; }; setTabDirectProducts(shift); setTabGridSizes(shift); }, []);
    const openMorePrd = useCallback((target, tabIndex = 0) => { setMorePrdTarget(target); setInitialSelected(target === 'direct' ? directProducts : (tabDirectProducts[tabIndex] || [])); setMorePrdTabIndex(tabIndex); setMorePrdVisible(true); }, [directProducts, tabDirectProducts]);
    
    const handleMorePrdOk = useCallback((selected) => { 
        if (morePrdTarget === 'direct') setDirectProducts(selected);
        else setTabDirectProducts(prev => ({ ...prev, [morePrdTabIndex]: selected })); 
        setMorePrdVisible(false); 
    }, [morePrdTarget, morePrdTabIndex]);
    
    const handleOk = useCallback(() => {
        if (registerMode === 'direct') {
            if (layoutType === 'single' && (!directProducts || directProducts.length === 0)) {
                return msgApi.warning('단품 상품을 1개 이상 등록해주세요.');
            }
            if (layoutType === 'tabs') {
                const allTabsHaveProducts = tabs.every((tab, i) => (tabDirectProducts[i] || []).length > 0);
                if (!allTabsHaveProducts) {
                    return msgApi.warning('모든 탭에 상품을 1개 이상 등록해주세요.');
                }
            }
        }
        if (registerMode === 'category') {
            if (layoutType === 'single' && !singleRoot && !singleManualCat.trim()) {
                return msgApi.warning('카테고리를 선택하거나 번호를 직접 입력해주세요.');
            }
            if (layoutType === 'tabs') {
                const allTabsHaveCategory = tabs.every(t => t.root || (t.manual || '').trim());
                if (!allTabsHaveCategory) {
                    return msgApi.warning('모든 탭에 카테고리를 설정하거나 번호를 직접 입력해주세요.');
                }
            }
        }

        const blockData = { id: initialData?.id || Date.now().toString() + Math.random(), type: 'product_group', registerMode, gridSize, layoutType };
        if (registerMode === 'category') {
            if (layoutType === 'single') {
                const manual = singleManualCat.trim();
                blockData.root = (singleRoot || manual) || undefined;
                blockData.sub = (manual || singleSub) || undefined;
            } else {
                blockData.tabs = tabs.map(t => { const manual = (t.manual || '').trim(); return { title: t.title, root: (t.root || manual) || null, sub: (manual || t.sub) || null }; });
                blockData.activeColor = activeColor;
            }
        } else if (registerMode === 'direct') {
            if (layoutType === 'single') { blockData.directProducts = directProducts; }
            else { blockData.tabDirectProducts = tabDirectProducts; blockData.tabs = tabs; blockData.activeColor = activeColor; }
        }
        if (layoutType === 'tabs' && Object.keys(tabGridSizes).length > 0) blockData.tabGridSizes = tabGridSizes;
        if (layoutType === 'tabs' && tabsPerRow && tabsPerRow >= 2) blockData.tabsPerRow = tabsPerRow;
        if (layoutType === 'tabs' && tabWidthMode !== 'default') blockData.tabWidthMode = tabWidthMode;
        blockData.cardTemplate = cardTemplate;
        blockData.thumbRadius = thumbRadius;
        blockData.iconPosition = iconPosition;
        blockData.cardStyle = cardStyle;
        blockData.rolling = layoutType === 'tabs' ? { enabled: false } : rolling;
        blockData.tabRolling = tabRolling;
        blockData.soldOutNos = soldOutNos;
        onOk(blockData);
        onCancel();
    }, [registerMode, gridSize, layoutType, singleRoot, singleSub, singleManualCat, tabs, activeColor, directProducts, tabDirectProducts, tabGridSizes, tabsPerRow, tabWidthMode, cardTemplate, thumbRadius, iconPosition, cardStyle, rolling, tabRolling, soldOutNos, onOk, onCancel, initialData, msgApi]);

    return (
        <Modal open={visible} title={initialData ? "상품 블록 편집" : "상품 블록 추가"} onCancel={onCancel} onOk={handleOk} okText={initialData ? "수정" : "추가"} cancelText="취소" width={isMobile ? '95%' : 980} destroyOnClose>
            <Form form={form} layout="vertical">
              <div style={{ display: 'flex', gap: 20, flexDirection: isMobile ? 'column' : 'row', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
                  <Tabs defaultActiveKey="prod" items={[
                    { key: 'prod', label: '① 상품 구성', children: (<div style={{ paddingTop: 4 }}>
                <h4 style={{ marginTop: 0 }}>1. 상품 등록 방식 <span style={{ fontWeight: 'normal', fontSize: 12, color: '#888' }}>· 상품을 가져오는 방법을 고르세요</span></h4>
                <Segmented 
                    options={[
                        { label: '상품 검색하여 추가', value: 'direct' }, 
                        { label: '카테고리 지정하여 불러오기', value: 'category' }
                    ]} 
                    value={registerMode} 
                    onChange={handleRegisterModeChange} 
                    block 
                    style={{ marginBottom: 8 }} 
                />
                <Alert 
                    message={registerMode === 'direct' ? '원하는 상품을 직접 찾아 개별적으로 노출할 수 있습니다.' : '선택한 카테고리의 상품들을 자동으로 불러와 노출합니다.'}
                    type="info"
                    style={{ marginBottom: 24 }}
                />
                
                <h4>2. 노출 방식 <span style={{ fontWeight: 'normal', fontSize: 12, color: '#888' }}>· 한 줄로 쭉(단품) vs 탭으로 구분</span></h4>
                <Segmented options={[{ label: '단품', value: 'single' }, { label: '탭', value: 'tabs' }]} value={layoutType} onChange={handleLayoutTypeChange} block />
                <div style={{ marginTop: '8px', color: '#888', fontSize: '12px', minHeight: '32px', marginBottom: '12px' }}>
                    {layoutType === 'single'
                        ? '선택한 상품들을 하나의 목록으로 쭉 나열하여 보여줍니다.'
                        : '여러 개의 탭을 만들어, 각 탭마다 다른 상품 목록을 보여줄 수 있습니다.'
                    }
                </div>

                <h4>3. 세부 설정 <span style={{ fontWeight: 'normal', fontSize: 12, color: '#888' }}>· {registerMode === 'direct' ? (layoutType === 'tabs' ? '탭별로 상품을 검색해 추가' : '노출할 상품을 검색해 추가') : (layoutType === 'tabs' ? '탭별로 카테고리 지정' : '불러올 카테고리 지정')}</span></h4>
                {registerMode === 'direct' && layoutType === 'single' && (<Button type={directProducts.length > 0 ? 'primary' : 'dashed'} onClick={() => openMorePrd('direct')} style={{ marginTop: 0 }}>{directProducts.length ? `상품 ${directProducts.length}개 등록됨` : '상품 직접 등록'}</Button>)}
                {registerMode === 'direct' && layoutType === 'tabs' && (<>{tabs.map((t, i) => (<div key={i}><Space size="small" style={{ marginTop: 8, alignItems: 'center' }} wrap><Input placeholder={`탭 ${i + 1} 제목`} style={{ width: 110 }} value={t.title} onChange={e => updateTab(i, 'title', e.target.value)} /><Select value={tabGridSizes[i] ?? gridSize} onChange={(v) => setTabGridSizes(prev => ({ ...prev, [i]: v }))} style={{ width: 84 }} options={gridOpts} /><Button type={(tabDirectProducts[i] || []).length > 0 ? 'primary' : 'default'} onClick={() => openMorePrd('tab', i)}>{(tabDirectProducts[i] || []).length ? `상품 ${(tabDirectProducts[i] || []).length}개` : '상품 등록'}</Button>{tabs.length > 2 && (<DeleteOutlined onClick={() => removeTab(i)} style={{ cursor: 'pointer', color: '#ff4d4f' }} />)}</Space></div>))}<Button type="dashed" block style={{ marginTop: 16 }} onClick={addTab} disabled={tabs.length >= 11}><PlusOutlined /> 탭 추가</Button><Space style={{ marginTop: 12, alignItems: 'center' }} wrap><span>활성 탭 색:</span><ColorPicker value={activeColor} onChangeComplete={(color) => setActiveColor(color.toHexString())} /><span style={{ marginLeft: 12 }}>탭 줄당 개수:</span><Segmented options={[{ label: '자동(1줄)', value: 0 }, { label: '2개씩', value: 2 }, { label: '3개씩', value: 3 }, { label: '4개씩', value: 4 }]} value={tabsPerRow ?? 0} onChange={(v) => setTabsPerRow(Number(v) || null)} /><span style={{ marginLeft: 12 }}>탭 영역 너비:</span><Segmented options={[{ label: '기본(페이지 너비)', value: 'default' }, { label: '꽉 채움(전체)', value: 'full' }]} value={tabWidthMode === 'wide' ? 'default' : tabWidthMode} onChange={setTabWidthMode} /></Space></>)}
                {registerMode === 'category' && layoutType === 'single' && (<><Space wrap><Select showSearch filterOption={catFilter} placeholder="대분류 (이름/번호)" style={{ width: 200 }} value={singleRoot} onChange={setSingleRoot} disabled={!!singleManualCat.trim()}>{roots.map(r => (<Option key={r.category_no} value={String(r.category_no)}>{r.category_name} ({r.category_no})</Option>))}</Select><Select showSearch filterOption={catFilter} placeholder="소분류 (이름/번호)" style={{ width: 200 }} value={singleSub} onChange={setSingleSub} disabled={!singleRoot || !!singleManualCat.trim()}>{allCats.filter(c => c.category_depth === 2 && String(c.parent_category_no) === singleRoot).map(s => (<Option key={s.category_no} value={String(s.category_no)}>{s.category_name} ({s.category_no})</Option>))}</Select></Space><div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 13, color: '#888', whiteSpace: 'nowrap' }}>또는 번호 직접 입력</span><Input placeholder="카테고리 번호 (예: 1167)" style={{ width: 200 }} value={singleManualCat} onChange={(e) => setSingleManualCat(e.target.value.replace(/[^0-9]/g, ''))} allowClear /></div>{singleManualCat.trim() && (<div style={{ marginTop: 6, fontSize: 12, color: '#fa8c16' }}>번호 직접 입력 사용 중 — 위 드롭다운은 무시됩니다.</div>)}</>)}
                {registerMode === 'category' && layoutType === 'tabs' && (<>{tabs.map((t, i) => (<div key={i}><Space size="small" style={{ marginTop: 8, alignItems: 'center' }} wrap><Input placeholder={`탭 ${i + 1} 제목`} style={{ width: 100 }} value={t.title} onChange={e => updateTab(i, 'title', e.target.value)} /><Select showSearch filterOption={catFilter} placeholder="대분류" style={{ width: 120 }} value={t.root} onChange={v => updateTab(i, 'root', v)} disabled={!!(t.manual || '').trim()}>{roots.map(r => (<Option key={r.category_no} value={String(r.category_no)}>{r.category_name} ({r.category_no})</Option>))}</Select><Select showSearch filterOption={catFilter} placeholder="소분류" style={{ width: 120 }} value={t.sub} onChange={v => updateTab(i, 'sub', v)} disabled={!t.root || !!(t.manual || '').trim()}>{allCats.filter(c => c.category_depth === 2 && String(c.parent_category_no) === t.root).map(s => (<Option key={s.category_no} value={String(s.category_no)}>{s.category_name} ({s.category_no})</Option>))}</Select><Input placeholder="번호 직접" style={{ width: 90 }} value={t.manual || ''} onChange={(e) => updateTab(i, 'manual', e.target.value.replace(/[^0-9]/g, ''))} allowClear /><Select value={tabGridSizes[i] ?? gridSize} onChange={(v) => setTabGridSizes(prev => ({ ...prev, [i]: v }))} style={{ width: 84 }} options={gridOpts} />{tabs.length > 2 && (<DeleteOutlined onClick={() => removeTab(i)} style={{ cursor: 'pointer', color: '#ff4d4f' }}/>)}</Space></div>))}<Button type="dashed" block style={{ marginTop: 16 }} onClick={addTab} disabled={tabs.length >= 11}><PlusOutlined /> 탭 추가</Button><Space style={{ marginTop: 12, alignItems: 'center' }} wrap><span>활성 탭 색:</span><ColorPicker value={activeColor} onChangeComplete={(color) => setActiveColor(color.toHexString())} /><span style={{ marginLeft: 12 }}>탭 줄당 개수:</span><Segmented options={[{ label: '자동(1줄)', value: 0 }, { label: '2개씩', value: 2 }, { label: '3개씩', value: 3 }, { label: '4개씩', value: 4 }]} value={tabsPerRow ?? 0} onChange={(v) => setTabsPerRow(Number(v) || null)} /><span style={{ marginLeft: 12 }}>탭 영역 너비:</span><Segmented options={[{ label: '기본(페이지 너비)', value: 'default' }, { label: '꽉 채움(전체)', value: 'full' }]} value={tabWidthMode === 'wide' ? 'default' : tabWidthMode} onChange={setTabWidthMode} /></Space></>)}
                
                {registerMode === 'direct' && (() => {
                  const allDirect = layoutType === 'single' ? directProducts : Object.values(tabDirectProducts).flat();
                  const uniq = Array.from(new Map(allDirect.filter(Boolean).map(p => [String(p.product_no), p])).values());
                  if (uniq.length === 0) return null;
                  return (
                    <div style={{ marginTop: 20 }}>
                      <h4 style={{ marginBottom: 6 }}>품절(SOLD OUT) 표시 <span style={{ fontWeight: 'normal', fontSize: 12, color: '#888' }}>· 품절 상품을 켜면 카드에 SOLD OUT 오버레이</span></h4>
                      <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, maxHeight: 220, overflowY: 'auto' }}>
                        {uniq.map(p => {
                          const on = soldOutNos.includes(String(p.product_no));
                          const thumb = p.list_image || p.image_medium || p.image_small;
                          return (
                            <div key={p.product_no} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderBottom: '1px solid #f7f7f7' }}>
                              <div style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 4, overflow: 'hidden', background: '#f5f5f5', filter: on ? 'grayscale(1)' : 'none' }}>
                                {thumb ? <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
                              </div>
                              <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: on ? '#aaa' : '#333', textDecoration: on ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.product_name || p.product_no}</span>
                              <Switch size="small" checked={on} onChange={(c) => setSoldOutNos(prev => c ? [...new Set([...prev, String(p.product_no)])] : prev.filter(n => n !== String(p.product_no)))} />
                              <span style={{ fontSize: 11, color: on ? '#ff4d4f' : '#bbb', width: 56, textAlign: 'right' }}>{on ? 'SOLD OUT' : '판매중'}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
                    </div>) },
                    { key: 'design', label: '② 디자인', children: (<div style={{ paddingTop: 4 }}>
                <h4 style={{ marginTop: 0 }}>4. 그리드 사이즈 {layoutType === 'tabs' && <span style={{ fontWeight: 'normal', fontSize: 12, color: '#888' }}>(기본값 · 탭별로 위에서 별도 지정 가능)</span>}</h4>
                <Space style={{ marginBottom: 16 }}>
                    {[2, 3, 4].map(n => (
                        <GridPreview key={n} size={n} active={gridSize === n} onClick={() => setGridSize(n)} />
                    ))}
                </Space>

                <h4 style={{ marginTop: 24 }}>5. 상품 카드 디자인 <span style={{ fontWeight: 'normal', fontSize: 12, color: '#888' }}>(Cafe24 상품명·요약정보·가격에 자동 매핑)</span></h4>
                <Select style={{ width: '100%' }} value={cardTemplate} onChange={setCardTemplate} options={CARD_TEMPLATES.map(t => ({ value: t.value, label: t.label }))} />
                <div style={{ marginTop: 6, fontSize: 12, color: '#888' }}>{CARD_TEMPLATES.find(t => t.value === cardTemplate)?.desc}</div>
                <div style={{ marginTop: 10 }}>
                  <OptRow visual={CARD_ICON.thumb} title="썸네일 모양" desc="상품 이미지 모서리">
                    <Segmented size="small" options={[{ label: '사각형', value: 'square' }, { label: '둥근', value: 'rounded' }]} value={thumbRadius} onChange={setThumbRadius} />
                  </OptRow>
                  <OptRow visual={CARD_ICON.name} title="상품명" desc="크기 · 굵기">
                    <Space size={6}>
                      <Segmented size="small" options={[{ label: '작게', value: 0.85 }, { label: '보통', value: 1 }, { label: '크게', value: 1.2 }]} value={cardStyle.nameScale} onChange={(v) => setCS({ nameScale: v })} />
                      <Segmented size="small" options={[{ label: '보통', value: 500 }, { label: '굵게', value: 700 }]} value={cardStyle.nameWeight} onChange={(v) => setCS({ nameWeight: v })} />
                    </Space>
                  </OptRow>
                  <OptRow visual={CARD_ICON.color} title="할인율 % 색상" desc="할인율 숫자 색상">
                    <ColorPicker value={cardStyle.percentColor} onChangeComplete={(c) => setCS({ percentColor: c.toHexString() })} />
                  </OptRow>
                  <OptRow visual={CARD_ICON.icon} title="아이콘 위치" desc="Cafe24 '아이콘 꾸미기' 표시 위치 · 기본 안 함">
                    <Segmented size="small" options={[{ label: '안 함', value: 'off' }, { label: '좌상', value: 'top-left' }, { label: '우상', value: 'top-right' }, { label: '좌하', value: 'bottom-left' }, { label: '우하', value: 'bottom-right' }]} value={iconPosition} onChange={setIconPosition} />
                  </OptRow>
                  <OptRow visual={CARD_ICON.desc} title="요약설명" desc="Cafe24 요약설명 텍스트 표시 여부 · 기본 숨김">
                    <Segmented size="small" options={[{ label: '표시', value: false }, { label: '숨김', value: true }]} value={!!cardStyle.descHide} onChange={(v) => setCS({ descHide: v })} />
                  </OptRow>
                  {!cardStyle.descHide && (
                    <OptRow visual={<span style={{ color: '#ccc', fontSize: 18 }}>↳</span>} title="요약설명 스타일" desc="크기 · 굵기">
                      <Space size={6}>
                        <Segmented size="small" options={[{ label: '작게', value: 0.85 }, { label: '보통', value: 1 }, { label: '크게', value: 1.2 }]} value={cardStyle.descScale} onChange={(v) => setCS({ descScale: v })} />
                        <Segmented size="small" options={[{ label: '보통', value: 400 }, { label: '굵게', value: 600 }]} value={cardStyle.descWeight} onChange={(v) => setCS({ descWeight: v })} />
                      </Space>
                    </OptRow>
                  )}
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: '#888', lineHeight: 1.6, background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 8, padding: '8px 10px' }}>※ <b>요약설명</b>은 Cafe24 어드민 → 상품 → 요약설명 텍스트가 그대로 노출(미입력 자동 생략). <b>아이콘</b>은 Cafe24 '아이콘 꾸미기'를 등록한 상품에만, 위에서 고른 위치에 표시됩니다.</div>
                    </div>) },
                    { key: 'feature', label: (<span>③ 기능 추가 <span style={{ fontSize: 11, color: '#999' }}>(선택)</span></span>), children: (<div style={{ paddingTop: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'linear-gradient(135deg,#f0f5ff,#f6ffed)', border: '1px solid #e6effe', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                        <SlideConcept />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#1d39c4' }}>상품 롤링(슬라이드)</div>
                          <div style={{ fontSize: 12, color: '#555', marginTop: 3, lineHeight: 1.5 }}>그리드처럼 쌓지 않고 <b>좌우로 넘기는 슬라이드</b>로 보여줘요. 모바일은 손가락으로 스와이프 👆</div>
                        </div>
                      </div>
                      {isTabsRoll && (
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>설정할 탭 선택 — <b>탭마다 따로</b> 지정됩니다</div>
                          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(tabs.length || 1, 4)}, 1fr)`, gap: 6 }}>
                            {tabs.map((t, i) => (
                              <Button key={i} size="small" type={previewTab === i ? 'primary' : 'default'} onClick={() => setPreviewTab(i)}>{t.title || `탭 ${i + 1}`}{(tabRolling[i] || {}).enabled ? ' ●' : ''}</Button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 14, fontWeight: 600 }}>슬라이드 사용{isTabsRoll ? ` · ${tabs[previewTab]?.title || `탭 ${previewTab + 1}`}` : ''}</span>
                        <Segmented options={[{ label: '사용 안 함', value: false }, { label: '사용', value: true, disabled: !curCanRoll }]} value={!!(curRolling.enabled && curCanRoll)} onChange={(v) => setCurR({ enabled: v })} />
                      </div>
                      {!curCanRoll && (<Alert type="warning" showIcon style={{ marginTop: 12 }} message={`상품 3개 이상부터 슬라이드를 사용할 수 있어요. (현재 ${curCount}개)`} />)}
                      {curRolling.enabled && curCanRoll && (<div style={{ marginTop: 4 }}>
                        <OptRow visual={SLIDE_ICON.perView} title="한 화면 개수" desc="한 번에 보일 상품 수 · 2.3 같은 소수도 가능">
                          <Space size={6} wrap>
                            <Segmented size="small" options={[{ label: '그리드와 동일', value: 0 }, { label: '1', value: 1 }, { label: '2', value: 2 }, { label: '3', value: 3 }, { label: '4', value: 4 }]} value={[0, 1, 2, 3, 4].includes(curRolling.perView) ? curRolling.perView : ''} onChange={(v) => setCurR({ perView: v })} />
                            <InputNumber size="small" min={1} max={6} step={0.1} value={[0, 1, 2, 3, 4].includes(curRolling.perView) ? null : curRolling.perView} onChange={(v) => setCurR({ perView: v || 0 })} placeholder="예: 2.3" style={{ width: 88 }} />
                          </Space>
                        </OptRow>
                        <OptRow visual={SLIDE_ICON.peek} title="다음 상품 살짝 보이기" desc="옆 상품 끝을 살짝 노출">
                          <Segmented size="small" options={[{ label: '끔', value: false }, { label: '켬', value: true }]} value={curRolling.peek} onChange={(v) => setCurR({ peek: v })} />
                        </OptRow>
                        <OptRow visual={SLIDE_ICON.loop} title="무한 반복" desc="끝에서 처음으로 이어짐">
                          <Segmented size="small" options={[{ label: '끔', value: false }, { label: '켬', value: true }]} value={curRolling.loop} onChange={(v) => setCurR({ loop: v })} />
                        </OptRow>
                        <OptRow visual={SLIDE_ICON.autoplay} title="자동 넘김" desc="가만히 둬도 자동으로">
                          <Space size={6}>
                            <Segmented size="small" options={[{ label: '끔', value: false }, { label: '켬', value: true }]} value={curRolling.autoplay} onChange={(v) => setCurR({ autoplay: v })} />
                            <InputNumber min={1} max={15} value={curRolling.interval} onChange={(v) => setCurR({ interval: v || 3 })} disabled={!curRolling.autoplay} style={{ width: 70 }} addonAfter="초" size="small" />
                          </Space>
                        </OptRow>
                        <OptRow visual={SLIDE_ICON.arrows} title="좌우 화살표" desc="‹ › 버튼 표시 방식">
                          <Space size={6}>
                            <Segmented size="small" options={[{ label: '끔', value: false }, { label: '켬', value: true }]} value={curRolling.arrows} onChange={(v) => setCurR({ arrows: v })} />
                            <Segmented size="small" options={[{ label: '항상', value: false }, { label: '마우스 올릴 때', value: true }]} value={curRolling.arrowHover !== false} onChange={(v) => setCurR({ arrowHover: v })} disabled={!curRolling.arrows} />
                          </Space>
                        </OptRow>
                        <OptRow visual={SLIDE_ICON.dots} title="점(인디케이터)" desc="● ○ ○ 위치 표시">
                          <Segmented size="small" options={[{ label: '끔', value: false }, { label: '켬', value: true }]} value={curRolling.pagination} onChange={(v) => setCurR({ pagination: v })} />
                        </OptRow>
                        <OptRow visual={CARD_ICON.color} title="버튼 색상" desc="활성 점 · 화살표 색">
                          <ColorPicker value={curRolling.activeColor || '#333333'} onChangeComplete={(c) => setCurR({ activeColor: c.toHexString() })} />
                        </OptRow>
                        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'flex-start', background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 8, padding: '8px 10px' }}>
                          <span style={{ fontSize: 14, lineHeight: 1.4 }}>💡</span>
                          <span style={{ fontSize: 11, color: '#888', lineHeight: 1.6 }}>설정은 <b>우측 미리보기</b>에서 바로 확인돼요. 라이브에선 <b>Splide</b>(무료) 슬라이더로 동작하고, 쇼핑몰 스킨에 이미 있으면 재사용합니다.</span>
                        </div>
                      </div>)}
                    </div>) },
                  ]} />
                </div>
                <div style={{ width: isMobile ? '100%' : 340, flexShrink: 0, position: isMobile ? 'static' : 'sticky', top: 8, alignSelf: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>미리보기</span>
                    <span style={{ fontSize: 11, color: '#aaa' }}>설정 시 실시간 반영</span>
                  </div>
                  <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, padding: '8px 12px 12px', background: '#fafafa' }}>
                    {(() => {
                      const safeTab = previewTab < tabs.length ? previewTab : 0;
                      const cols = layoutType === 'tabs' ? (tabGridSizes[safeTab] ?? gridSize) : gridSize;
                      const previewRolling = layoutType === 'tabs' ? (tabRolling[safeTab] || { enabled: false }) : rolling;
                      const count = previewRolling.enabled ? Math.max(6, (previewRolling.perView || cols) + 3) : cols;
                      const sample = Array.from({ length: count }, (_, i) => SAMPLE_PRODUCTS[i % SAMPLE_PRODUCTS.length]);
                      const tabWLabel = tabWidthMode === 'full' ? '전체 너비' : '페이지 너비';
                      return (<>
                        <div style={{ fontSize: 12, color: '#aaa', textAlign: 'center', marginBottom: 8 }}>예시 상품{rolling.enabled ? ' · 롤링(슬라이드)' : (layoutType === 'tabs' ? ` · 탭 ${safeTab + 1} (${cols}×${cols}) · ${tabWLabel}` : ` · ${cols}×${cols}`)}</div>
                        <div style={{ width: '100%', margin: '0 auto' }}>
                          {layoutType === 'tabs' && (
                            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tabsPerRow && tabsPerRow >= 2 ? tabsPerRow : (tabs.length || 1)}, 1fr)`, gap: 8, marginBottom: 12 }}>
                              {tabs.map((t, i) => (
                                <Button key={i} size="small" onClick={() => setPreviewTab(i)} style={{ borderColor: i === safeTab ? activeColor : undefined, background: i === safeTab ? activeColor : '#fff', color: i === safeTab ? '#fff' : 'inherit' }}>{t.title || `탭 ${i + 1}`}</Button>
                              ))}
                            </div>
                          )}
                          {renderGrid(cols, sample, 0, cardTemplate, { thumbRadius, iconPosition, cardStyle, rolling })}
                        </div>
                      </>);
                    })()}
                  </div>
                </div>
              </div>
            </Form>
            {morePrdVisible && <MorePrd visible={morePrdVisible} initialSelected={initialSelected} onOk={handleMorePrdOk} onCancel={() => setMorePrdVisible(false)} />}
        </Modal>
    );
}

// =================================================================
// --- 이미지 슬라이드(스와이퍼) 블록 모달 — 이미지 2장+ 를 좌우 슬라이드. 라이브는 Splide(MIT) ---
// =================================================================
export const IMG_SLIDE_DEFAULT = { perView: 1, peek: false, autoplay: true, interval: 3, loop: true, arrows: true, pagination: true, activeColor: '#333333', arrowHover: true, gap: 12 };
export function ImageSlideModal({ visible, onCancel, onOk, msgApi, isMobile, initialData }) {
  const [images, setImages] = useState([]); // { src, file, hash, href }
  const [sw, setSwState] = useState(IMG_SLIDE_DEFAULT);
  const setSW = (patch) => setSwState(prev => ({ ...prev, ...patch }));
  useEffect(() => {
    if (visible && initialData) {
      setImages((initialData.images || []).map(im => ({ ...im })));
      setSwState({ ...IMG_SLIDE_DEFAULT, ...(initialData.swiper || {}) });
    } else if (visible) { setImages([]); setSwState(IMG_SLIDE_DEFAULT); }
  }, [visible, initialData]);
  const addImage = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target.result;
      const hash = sha256(src).toString(encHex);
      setImages(prev => prev.some(im => im.hash === hash) ? prev : [...prev, { src, file, hash, href: '' }]);
    };
    reader.readAsDataURL(file);
  };
  const move = (i, dir) => setImages(prev => { const a = [...prev]; const j = i + dir; if (j < 0 || j >= a.length) return prev; [a[i], a[j]] = [a[j], a[i]]; return a; });
  const canSave = images.length >= 2;
  const handleOk = () => {
    if (!canSave) return msgApi.warning('이미지는 2장 이상 등록해야 슬라이드가 됩니다.');
    onOk({ id: initialData?.id || (Date.now().toString() + Math.random()), type: 'image_slide', images: images.map(({ src, file, hash, href }) => ({ src, file, hash, href: href || '' })), swiper: sw });
    onCancel();
  };
  return (
    <Modal open={visible} title={initialData ? '이미지 슬라이드 편집' : '이미지 슬라이드 추가'} onCancel={onCancel} onOk={handleOk} okText={initialData ? '수정' : '추가'} cancelText="취소" width={isMobile ? '95%' : 720} destroyOnClose>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'linear-gradient(135deg,#fff7e6,#fff1f0)', border: '1px solid #ffe7ba', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
        <SlideConcept />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#d46b08' }}>이미지 슬라이드(스와이퍼)</div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 3, lineHeight: 1.5 }}>여러 장의 이미지(배너)를 <b>좌우로 넘기는 슬라이드</b>로 보여줘요. <b>2장 이상</b>부터 사용 가능 👆</div>
        </div>
      </div>
      <Upload accept="image/*" multiple showUploadList={false} beforeUpload={(file) => { if (file.size / 1024 / 1024 > 10) { msgApi.error('이미지는 10MB 이하여야 합니다.'); return Upload.LIST_IGNORE; } addImage(file); return false; }}>
        <Button icon={<UploadOutlined />}>이미지 추가 ({images.length}장)</Button>
      </Upload>
      {images.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginTop: 12 }}>
          {images.map((im, i) => (
            <div key={im.hash || i} style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
              <div style={{ position: 'relative', aspectRatio: '16/9', background: '#f5f5f5' }}>
                <img src={im.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <span style={{ position: 'absolute', top: 4, left: 4, background: 'rgba(0,0,0,.55)', color: '#fff', borderRadius: 4, fontSize: 11, padding: '0 6px' }}>{i + 1}</span>
              </div>
              <div style={{ padding: 6 }}>
                <Input size="small" placeholder="클릭 시 이동 링크(선택)" value={im.href} onChange={(e) => setImages(prev => prev.map((x, j) => j === i ? { ...x, href: e.target.value } : x))} />
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <Space size={2}>
                    <Button size="small" type="text" disabled={i === 0} onClick={() => move(i, -1)}>◀</Button>
                    <Button size="small" type="text" disabled={i === images.length - 1} onClick={() => move(i, 1)}>▶</Button>
                  </Space>
                  <Button size="small" type="text" danger onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}>삭제</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {!canSave && <Alert type="warning" showIcon style={{ marginTop: 12 }} message={`이미지 2장 이상부터 슬라이드를 만들 수 있어요. (현재 ${images.length}장)`} />}
      {canSave && (
        <div style={{ marginTop: 16, borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
          <OptRow visual={SLIDE_ICON.perView} title="한 화면 개수" desc="한 번에 보일 이미지 수 · 2.3 같은 소수도 가능 (배너는 1 권장)">
            <Space size={6} wrap>
              <Segmented size="small" options={[{ label: '1', value: 1 }, { label: '2', value: 2 }, { label: '3', value: 3 }]} value={[1, 2, 3].includes(sw.perView) ? sw.perView : ''} onChange={(v) => setSW({ perView: v })} />
              <InputNumber size="small" min={1} max={6} step={0.1} value={[1, 2, 3].includes(sw.perView) ? null : sw.perView} onChange={(v) => setSW({ perView: v || 1 })} placeholder="예: 2.3" style={{ width: 88 }} />
            </Space>
          </OptRow>
          <OptRow visual={<span style={{ fontSize: 18, color: '#8a93a2' }}>↔</span>} title="이미지 간격" desc="이미지 사이 여백">
            <Segmented size="small" options={[{ label: '없음', value: 0 }, { label: '좁게', value: 8 }, { label: '보통', value: 12 }, { label: '넓게', value: 24 }]} value={[0, 8, 12, 24].includes(sw.gap) ? sw.gap : 12} onChange={(v) => setSW({ gap: v })} />
          </OptRow>
          <OptRow visual={SLIDE_ICON.peek} title="다음 이미지 살짝 보이기" desc="옆 이미지 끝을 살짝 노출">
            <Segmented size="small" options={[{ label: '끔', value: false }, { label: '켬', value: true }]} value={sw.peek} onChange={(v) => setSW({ peek: v })} />
          </OptRow>
          <OptRow visual={SLIDE_ICON.loop} title="무한 반복" desc="끝에서 처음으로 이어짐">
            <Segmented size="small" options={[{ label: '끔', value: false }, { label: '켬', value: true }]} value={sw.loop} onChange={(v) => setSW({ loop: v })} />
          </OptRow>
          <OptRow visual={SLIDE_ICON.autoplay} title="자동 넘김" desc="가만히 둬도 자동으로">
            <Space size={6}>
              <Segmented size="small" options={[{ label: '끔', value: false }, { label: '켬', value: true }]} value={sw.autoplay} onChange={(v) => setSW({ autoplay: v })} />
              <InputNumber min={1} max={15} value={sw.interval} onChange={(v) => setSW({ interval: v || 3 })} disabled={!sw.autoplay} style={{ width: 70 }} addonAfter="초" size="small" />
            </Space>
          </OptRow>
          <OptRow visual={SLIDE_ICON.arrows} title="좌우 화살표" desc="‹ › 버튼 표시 방식">
            <Space size={6}>
              <Segmented size="small" options={[{ label: '끔', value: false }, { label: '켬', value: true }]} value={sw.arrows} onChange={(v) => setSW({ arrows: v })} />
              <Segmented size="small" options={[{ label: '항상', value: false }, { label: '마우스 올릴 때', value: true }]} value={sw.arrowHover !== false} onChange={(v) => setSW({ arrowHover: v })} disabled={!sw.arrows} />
            </Space>
          </OptRow>
          <OptRow visual={SLIDE_ICON.dots} title="점(인디케이터)" desc="● ○ ○ 위치 표시">
            <Segmented size="small" options={[{ label: '끔', value: false }, { label: '켬', value: true }]} value={sw.pagination} onChange={(v) => setSW({ pagination: v })} />
          </OptRow>
          <OptRow visual={CARD_ICON.color} title="버튼 색상" desc="활성 점 · 화살표 색">
            <ColorPicker value={sw.activeColor || '#333333'} onChangeComplete={(c) => setSW({ activeColor: c.toHexString() })} />
          </OptRow>
          <div style={{ marginTop: 10, fontSize: 11, color: '#888', lineHeight: 1.6 }}>※ 라이브에선 <b>Splide</b>(무료)로 동작합니다. 이미지 순서는 ◀ ▶ 로 조절하세요.</div>
          <div style={{ fontSize: 12, color: '#aaa', textAlign: 'center', margin: '14px 0 6px' }}>↓ 예시 슬라이드 (선택 옵션 반영)</div>
          <ImageSlidePreview images={images} sw={sw} />
        </div>
      )}
    </Modal>
  );
}

// =================================================================
// --- Main EventCreate Component ---
// =================================================================
export default function EventCreate() {
  const navigate = useNavigate();
  const [msgApi, msgCtx] = message.useMessage();
  const screens = useBreakpoint();
  const isMobile = !screens.sm;

  const params = new URLSearchParams(window.location.search);
  const paramMallId = params.get('mall_id') || params.get('state');
  const storedMallId = localStorage.getItem('mallId');
  const mallId = paramMallId || storedMallId;

  useEffect(() => {
    if (mallId) {
      localStorage.setItem('mallId', mallId);
    } else {
      msgApi.warning(' 앱을 통해 접속해주세요.');
    }
  }, [mallId, msgApi]);

  const draggingRef = useRef(false);
  const getItemStyle = (isDragging, draggableStyle) => ({
    userSelect: 'none',
    transition: isDragging ? undefined : 'transform 200ms cubic-bezier(0.2,0,0,1)',
    zIndex: isDragging ? 2 : 1,
    ...draggableStyle,
  });

  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [allCats, setAllCats] = useState([]);
  const [couponOptions, setCouponOptions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [eventCouponNos, setEventCouponNos] = useState([]);
  const [pageMaxWidth, setPageMaxWidth] = useState(null);
  const [pageMaxWidthInput, setPageMaxWidthInput] = useState(null); // 입력 중 draft (적용 누르면 pageMaxWidth 반영)
  // 카테고리 모드 블록 미리보기용 상품 (categoryNo -> products[])
  const [categoryProductsMap, setCategoryProductsMap] = useState({});

  const [previewActiveTabs, setPreviewActiveTabs] = useState({});
  const [isPreviewMode, setIsPreviewMode] = useState(false); // ✅ 미리보기 모드 상태 추가
  
  const [productBlockModalVisible, setProductBlockModalVisible] = useState(false);
  const [editingProductBlock, setEditingProductBlock] = useState(null);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [textModalVisible, setTextModalVisible] = useState(false);
  const [noticeModalVisible, setNoticeModalVisible] = useState(false);
  const [noticeImagePreview, setNoticeImagePreview] = useState('');
  const [noticeImageFile, setNoticeImageFile] = useState(undefined);
  // 타임세일(기간할인 표시) — 읽기 전용 Benefits 기반
  const [timesaleModalVisible, setTimesaleModalVisible] = useState(false);
  const [benefitsList, setBenefitsList] = useState([]);
  const [timesaleProductsMap, setTimesaleProductsMap] = useState({}); // blockId -> products[] (미리보기용)
  // 타임세일 개편: 탭(기간할인/쿠폰할인) + 모드(Cafe24 불러오기/직접 입력)
  const [tsType, setTsType] = useState('benefit'); // 'benefit'(기간할인) | 'coupon'(쿠폰할인)
  const [tsMode, setTsMode] = useState('select'); // 'select'(Cafe24 불러오기) | 'manual'(직접 입력)
  const [couponsList, setCouponsList] = useState([]);
  const [tsManualProducts, setTsManualProducts] = useState([]); // 직접 등록 상품 객체
  const [tsManualRange, setTsManualRange] = useState(null); // [dayjs, dayjs]
  const [tsMorePrdVisible, setTsMorePrdVisible] = useState(false);
  const [tsSelectProducts, setTsSelectProducts] = useState([]); // 선택한 기간할인/쿠폰의 실제 상품(미리보기용)

  // 이미지 슬라이드(스와이퍼) 블록
  const [imageSlideVisible, setImageSlideVisible] = useState(false);
  const [imageSlideInit, setImageSlideInit] = useState(null);
  const openImageSlide = (block = null) => { setImageSlideInit(block); setImageSlideVisible(true); };
  const handleImageSlideOk = (blockData) => {
    setBlocks(prev => prev.some(b => b.id === blockData.id) ? prev.map(b => b.id === blockData.id ? blockData : b) : [...prev, blockData]);
    setSelectedId(blockData.id);
  };

  const [addingMode, setAddingMode] = useState(false);
  const [addType, setAddType] = useState(null);
  const [popupImages, setPopupImages] = useState([]);
  const [popupShowClose, setPopupShowClose] = useState(true);
  const [pendingRegion, setPendingRegion] = useState(null);
  const [dragStartPos, setDragStart] = useState(null);
  const [dragCurrent, setDragCurrent] = useState(null);
  const [editingRegion, setEditingRegion] = useState(null);
  const [notification, setNotification] = useState(null);

  const [mapForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [videoForm] = Form.useForm();
  const [textForm] = Form.useForm();
  const [noticeForm] = Form.useForm();
  const [timesaleForm] = Form.useForm();
  const imgRef = useRef(null);
  const couponSelectRef = useRef(null);
  const couponEditSelectRef = useRef(null);
  const tsBannerStyle = Form.useWatch('bannerStyle', timesaleForm);
  const tsTitle = Form.useWatch('title', timesaleForm);
  const tsShowCd = Form.useWatch('showCountdown', timesaleForm);
  const tsGrid = Form.useWatch('gridSize', timesaleForm);
  const tsTemplate = Form.useWatch('cardTemplate', timesaleForm);
  const tsBenefitNo = Form.useWatch('benefitNo', timesaleForm);
  const tsCouponNo = Form.useWatch('couponNo', timesaleForm);

  useEffect(() => {
    if (mallId) {
      api.get(`/api/${mallId}/categories/all`).then(res => setAllCats(res.data)).catch(() => msgApi.error('카테고리 불러오기 실패'));
      api.get(`/api/${mallId}/coupons`).then(res => setCouponOptions(res.data.map(c => ({ value: c.coupon_no, label: `${c.coupon_name} (${c.benefit_percentage}%)`, discountPercent: Number(c.benefit_percentage) || 0 })))).catch(() => msgApi.error('쿠폰 불러오기 실패'));
      api.get(`/api/${mallId}/benefits`).then(res => { const arr = Array.isArray(res.data) ? res.data : (res.data?.benefits || []); setBenefitsList(arr.filter(b => b.benefit_type === 'DP')); }).catch(() => {});
    }
  }, [mallId, msgApi]);

  // 이벤트 전체 쿠폰의 최대 할인율(%) — 미리보기 할인 추정용
  const previewDiscountPercent = useMemo(() => {
    if (!eventCouponNos.length) return 0;
    return Math.max(0, ...eventCouponNos.map(no => couponOptions.find(o => o.value === no)?.discountPercent || 0));
  }, [eventCouponNos, couponOptions]);

  // 탭 이동 region 대상 옵션 — 모든 product_group(tabs) 블록의 각 탭. value=`${blockId}::${tabIndex}`
  const tabTargetOptions = useMemo(() => {
    const opts = [];
    blocks.forEach((b, bi) => {
      if (b.type !== 'product_group' || b.layoutType !== 'tabs') return;
      (b.tabs || []).forEach((t, i) => { opts.push({ value: `${b.id}::${i}`, label: `상품 블록 ${bi + 1} → 탭${i + 1}${t.title ? ` (${t.title})` : ''}` }); });
    });
    return opts;
  }, [blocks]);

  // 카테고리 모드 블록의 categoryNo 를 모아 미리보기용 상품을 prefetch (동일 번호 1회)
  useEffect(() => {
    if (!mallId) return;
    const needed = new Set();
    blocks.forEach(b => {
      if (b.type !== 'product_group' || b.registerMode !== 'category') return;
      if (b.layoutType === 'single') { const no = b.sub || b.root; if (no) needed.add(String(no)); }
      else if (b.layoutType === 'tabs') { (b.tabs || []).forEach(t => { const no = t.sub || t.root; if (no) needed.add(String(no)); }); }
    });
    needed.forEach(no => {
      if (categoryProductsMap[no]) return;
      api.get(`/api/${mallId}/categories/${no}/products`, { params: { limit: 300 } })
        .then(res => { const arr = Array.isArray(res.data) ? res.data : (res.data?.products || []); setCategoryProductsMap(prev => ({ ...prev, [no]: arr })); })
        .catch(() => setCategoryProductsMap(prev => ({ ...prev, [no]: [] })));
    });
  }, [mallId, blocks, categoryProductsMap]);

  const uploadProps = {
    accept: 'image/*',
    multiple: true,
    showUploadList: false,
    beforeUpload: file => {
      const maxSizeMB = 10;
      if (file.size / 1024 / 1024 > maxSizeMB) {
        msgApi.error(`이미지 크기는 ${maxSizeMB}MB 이하여야 합니다.`);
        return Upload.LIST_IGNORE;
      }
      return true;
    },
    customRequest: ({ file, onSuccess }) => {
      const reader = new FileReader();
      reader.onload = e => {
        const src = e.target.result;
        const hash = sha256(src).toString(encHex);
        if (blocks.some(b => b.hash && b.hash === hash)) {
          msgApi.warning('같은 이미지는 한 번만 업로드할 수 있습니다.');
          return;
        }
        const id = Date.now().toString() + Math.random();
        const newBlock = { id, type: 'image', src, file, hash, regions: [] };
        setBlocks(prev => [...prev, newBlock]);
        setSelectedId(id);
        onSuccess('ok');
      };
      reader.readAsDataURL(file);
    },
  };

  const onDragEnd = result => {
    if (!result.destination) return;
    const a = Array.from(blocks);
    const [m] = a.splice(result.source.index, 1);
    a.splice(result.destination.index, 0, m);
    setBlocks(a);
    requestAnimationFrame(() => { draggingRef.current = false; });
  };

  const deleteBlock = (idToDelete) => {
    setBlocks(prev => {
      const newBlocks = prev.filter(b => b.id !== idToDelete);
      if (selectedId === idToDelete) {
        setSelectedId(newBlocks.length > 0 ? newBlocks[0].id : null);
      }
      return newBlocks;
    });
    msgApi.success('블록이 삭제되었습니다.');
  };

  const selectedBlock = blocks.find(b => b.id === selectedId);

  // 미리보기용: 탭별 그리드 컬럼 수 + 표시 상품 목록(직접/카테고리)
  const getPreviewCols = (b, idx) => (b.layoutType === 'tabs' && b.tabGridSizes && b.tabGridSizes[idx] != null) ? b.tabGridSizes[idx] : b.gridSize;
  const getPreviewProducts = (b, idx) => {
    if (b.registerMode === 'direct') {
      return b.layoutType === 'tabs' ? ((b.tabDirectProducts || {})[idx] || []) : (b.directProducts || []);
    }
    let catNo;
    if (b.layoutType === 'tabs') { const t = (b.tabs || [])[idx] || {}; catNo = t.sub || t.root; }
    else { catNo = b.sub || b.root; }
    return catNo ? (categoryProductsMap[String(catNo)] || []) : [];
  };

  const onMouseDown = e => { if (!imgRef.current) return; const { left, top } = imgRef.current.getBoundingClientRect(); setDragStart({ x: e.clientX - left, y: e.clientY - top }); setDragCurrent({ x: e.clientX - left, y: e.clientY - top }); };
  const onMouseMove = e => { if (!dragStartPos) return; const { left, top } = imgRef.current.getBoundingClientRect(); setDragCurrent({ x: e.clientX - left, y: e.clientY - top }); };
  const onMouseUp = () => { if (!dragStartPos || !dragCurrent) { setDragStart(null); setDragCurrent(null); return; } const { clientWidth: W, clientHeight: H } = imgRef.current; const x = Math.min(dragStartPos.x, dragCurrent.x); const y = Math.min(dragStartPos.y, dragCurrent.y); const w = Math.abs(dragCurrent.x - dragStartPos.x); const h = Math.abs(dragCurrent.y - dragStartPos.y); if (w < 5 || h < 5) { setDragStart(null); setDragCurrent(null); return; } const region = { id: Date.now().toString(), xRatio: x / W, yRatio: y / H, wRatio: w / W, hRatio: h / H, }; setPendingRegion(region); setMapModalVisible(true); setDragStart(null); setDragCurrent(null); };
  const saveRegion = () => { if (!pendingRegion) return; mapForm.validateFields().then(vals => { const updated = { ...pendingRegion }; if (addType === 'link') { let href = (vals.href || '').trim(); if (!/^https?:\/\//.test(href)) href = 'https://' + href; updated.href = href; delete updated.coupon; delete updated.tabTarget; delete updated.popup; } else if (addType === 'tab') { const [blockId, idxStr] = String(vals.tabTarget || '').split('::'); const tabIndex = parseInt(idxStr, 10); if (!blockId || !isFinite(tabIndex)) return msgApi.error('이동할 탭을 선택하세요.'); updated.tabTarget = { blockId, tabIndex }; delete updated.href; delete updated.coupon; delete updated.popup; } else if (addType === 'popup') { const imgs = popupImages.filter(p => p.url); if (imgs.length === 0) return msgApi.error('팝업 이미지를 1장 이상 추가하세요.'); updated.popup = { images: imgs, interval: 3000, showCloseButton: popupShowClose }; delete updated.href; delete updated.coupon; delete updated.tabTarget; } else { updated.coupon = (vals.coupon || []).join(','); delete updated.href; delete updated.tabTarget; delete updated.popup; } setBlocks(prev => prev.map(b => b.id === selectedId && b.type === 'image' ? { ...b, regions: [...(b.regions || []), updated] } : b)); setMapModalVisible(false); setPendingRegion(null); setAddingMode(false); setAddType(null); setPopupImages([]); mapForm.resetFields(); setNotification(null); }).catch(info => console.log('Validate Failed:', info)); };
  const openEditRegion = r => { setEditingRegion(r); setEditModalVisible(true); if (r.coupon) editForm.setFieldsValue({ coupon: r.coupon.split(',') }); else if (r.tabTarget) editForm.setFieldsValue({ tabTarget: `${r.tabTarget.blockId}::${r.tabTarget.tabIndex}` }); else if (r.popup) { setPopupImages(r.popup.images || []); setPopupShowClose(r.popup.showCloseButton !== false); } else editForm.setFieldsValue({ href: r.href }); };
  const applyEditRegion = () => { editForm.validateFields().then(vals => { setBlocks(prev => prev.map(b => { if (b.id !== selectedId || b.type !== 'image') return b; const regions = (b.regions || []).map(r => { if (r.id !== editingRegion.id) return r; if (r.coupon != null) { return { ...r, coupon: (vals.coupon || []).join(','), href: undefined, tabTarget: undefined, popup: undefined }; } else if (r.tabTarget) { const [blockId, idxStr] = String(vals.tabTarget || '').split('::'); const tabIndex = parseInt(idxStr, 10); if (!blockId || !isFinite(tabIndex)) return r; return { ...r, tabTarget: { blockId, tabIndex }, href: undefined, coupon: undefined, popup: undefined }; } else if (r.popup) { const imgs = popupImages.filter(p => p.url); if (imgs.length === 0) return r; return { ...r, popup: { images: imgs, interval: r.popup.interval ?? 3000, showCloseButton: popupShowClose }, href: undefined, coupon: undefined, tabTarget: undefined }; } else { let href = (vals.href || '').trim(); if (!/^https?:\/\//.test(href)) href = 'https://' + href; return { ...r, href, coupon: undefined, tabTarget: undefined, popup: undefined }; } }); return { ...b, regions }; })); setEditModalVisible(false); setEditingRegion(null); setPopupImages([]); }).catch(info => console.log('Validate Failed:', info)); };
  const deleteRegion = () => { setBlocks(prev => prev.map(b => { if (b.id !== selectedId || b.type !== 'image') return b; return { ...b, regions: (b.regions || []).filter(r => r.id !== editingRegion.id) }; })); setEditModalVisible(false); setEditingRegion(null); };
  
  const addProductBlock = (blockData) => { if (editingProductBlock) { setBlocks(blocks.map(b => b.id === editingProductBlock.id ? { ...blockData } : b)); } else { setBlocks(prev => [...prev, blockData]); setSelectedId(blockData.id); } setEditingProductBlock(null); setProductBlockModalVisible(false); };
  const openVideoModal = (blockToEdit = null) => { setAddingMode(false); setNotification(null); setSelectedId(blockToEdit?.id || null); if (blockToEdit) { videoForm.setFieldsValue({ urlOrId: blockToEdit.youtubeId, w: blockToEdit.ratio?.w, h: blockToEdit.ratio?.h, autoplay: blockToEdit.autoplay }); } else { videoForm.resetFields(); } setVideoModalVisible(true); };
  const submitVideo = () => { videoForm.validateFields().then(vals => { const { urlOrId, w = 16, h = 9, autoplay = false } = vals; const vid = getYouTubeId(urlOrId); if (!vid) return msgApi.error('유효한 YouTube 링크/ID가 아닙니다.'); const sel = blocks.find(b => b.id === selectedId); if (sel?.type === 'video') { setBlocks(prev => prev.map(b => b.id === sel.id ? { ...b, youtubeId: vid, ratio: { w, h }, autoplay, loop: autoplay } : b)); } else { const id = Date.now().toString() + Math.random(); setBlocks(prev => [...prev, { id, type: 'video', youtubeId: vid, ratio: { w, h }, autoplay, loop: autoplay }]); setSelectedId(id); } setVideoModalVisible(false); }).catch(info => console.log('Validate Failed:', info)); };
  const openTextModal = (blockToEdit = null) => { setAddingMode(false); setNotification(null); setSelectedId(blockToEdit?.id || null); if (blockToEdit) { textForm.setFieldsValue({ text: blockToEdit.text, ...blockToEdit.style }); } else { textForm.resetFields(); } setTextModalVisible(true); };
  const submitText = () => { textForm.validateFields().then(vals => { const { text, ...style } = vals; const sel = blocks.find(b => b.id === selectedId); if (sel?.type === 'text') { setBlocks(prev => prev.map(b => b.id === sel.id ? { ...b, text, style } : b)); } else { const id = Date.now().toString() + Math.random(); setBlocks(prev => [...prev, { id, type: 'text', text, style }]); setSelectedId(id); } setTextModalVisible(false); }).catch(info => console.log('Validate Failed:', info)); };

  // 이벤트 유의사항 블록 (event_notice) — 토글 버튼 + 이미지 + 본문
  const openNoticeModal = (blockToEdit = null) => {
    setAddingMode(false); setNotification(null);
    setSelectedId(blockToEdit?.id || null);
    if (blockToEdit && blockToEdit.type === 'event_notice') {
      const ns = blockToEdit.noticeStyle || {};
      noticeForm.setFieldsValue({ noticeTitle: blockToEdit.noticeTitle || '이벤트 유의사항', noticeText: blockToEdit.noticeText || '', background: ns.background || '', color: ns.color || '#444444', fontSize: ns.fontSize ?? 14, fontWeight: ns.fontWeight || 400, textAlign: ns.textAlign || 'left', lineHeight: ns.lineHeight ?? 1.7, letterSpacing: ns.letterSpacing ?? 0, padding: ns.padding ?? 16 });
      setNoticeImagePreview(blockToEdit.noticeImage || '');
      setNoticeImageFile(blockToEdit.noticeImageFile);
    } else {
      noticeForm.setFieldsValue({ noticeTitle: '이벤트 유의사항', noticeText: '', background: '', color: '#444444', fontSize: 14, lineHeight: 1.7, letterSpacing: 0, padding: 16 });
      setNoticeImagePreview(''); setNoticeImageFile(undefined);
    }
    setNoticeModalVisible(true);
  };
  const submitNotice = () => {
    const vals = noticeForm.getFieldsValue();
    const { noticeTitle, noticeText, background, color, fontSize, fontWeight, textAlign, lineHeight, letterSpacing, padding } = vals;
    if (!noticeImagePreview && !noticeText?.trim()) { return msgApi.warning('이미지나 본문 텍스트 중 하나는 입력하세요.'); }
    const sel = blocks.find(b => b.id === selectedId);
    const patch = { noticeTitle: (noticeTitle || '이벤트 유의사항').trim(), noticeText: (noticeText || '').trim(), noticeImage: noticeImagePreview || undefined, noticeImageFile, noticeStyle: { background: background || undefined, color: color || undefined, fontSize: typeof fontSize === 'number' ? fontSize : undefined, fontWeight: fontWeight || undefined, textAlign: textAlign || undefined, lineHeight: typeof lineHeight === 'number' ? lineHeight : undefined, letterSpacing: typeof letterSpacing === 'number' ? letterSpacing : undefined, padding: typeof padding === 'number' ? padding : undefined } };
    if (sel?.type === 'event_notice') { setBlocks(prev => prev.map(b => b.id === sel.id ? { ...b, ...patch } : b)); }
    else { const id = Date.now().toString() + Math.random(); setBlocks(prev => [...prev, { id, type: 'event_notice', ...patch }]); setSelectedId(id); }
    setNoticeModalVisible(false);
  };

  // 팝업 영역 (popup) — 1~10장 이미지 + 각 이미지 닫기/링크 영역
  const addPopupImage = (file) => {
    if (popupImages.length >= 10) { msgApi.warning('팝업 이미지는 최대 10장까지 가능합니다.'); return; }
    if (file.size / 1024 / 1024 > 10) { msgApi.error('이미지는 10MB 이하여야 합니다.'); return; }
    const reader = new FileReader();
    reader.onload = (e) => { setPopupImages(prev => [...prev, { url: e.target?.result || '', file }]); };
    reader.readAsDataURL(file);
  };
  const removePopupImage = (idx) => setPopupImages(prev => prev.filter((_, i) => i !== idx));
  const movePopupImage = (from, to) => setPopupImages(prev => { if (to < 0 || to >= prev.length) return prev; const arr = [...prev]; const [m] = arr.splice(from, 1); arr.splice(to, 0, m); return arr; });
  const renderPopupEditor = () => (
    <div>
      <div style={{ marginBottom: 8, fontSize: 13, color: '#555' }}>팝업에 띄울 이미지를 1~10장 추가하세요. 2장 이상이면 자동 순환(슬라이드)되고, 각 이미지에 링크를 걸 수 있습니다. 닫기 버튼은 자동 포함.</div>
      <Space style={{ marginBottom: 10 }} wrap>
        <Upload accept="image/*" multiple showUploadList={false} beforeUpload={(file) => { addPopupImage(file); return false; }}>
          <Button icon={<UploadOutlined />} disabled={popupImages.length >= 10}>팝업 이미지 추가 ({popupImages.length}/10)</Button>
        </Upload>
        <Checkbox checked={popupShowClose} onChange={(e) => setPopupShowClose(e.target.checked)}>우상단 X 닫기 버튼 표시 (끄면 닫기 영역으로만 닫힘)</Checkbox>
      </Space>
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {popupImages.map((p, i) => (
          <div key={i} style={{ border: '1px solid #f0f0f0', borderRadius: 6, padding: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>팝업 이미지 {i + 1}</span>
              <span style={{ flex: 1 }} />
              <Button size="small" onClick={() => movePopupImage(i, i - 1)} disabled={i === 0}>↑</Button>
              <Button size="small" onClick={() => movePopupImage(i, i + 1)} disabled={i === popupImages.length - 1}>↓</Button>
              <Button size="small" danger onClick={() => removePopupImage(i)}>이미지 삭제</Button>
            </div>
            <PopupImageRegionEditor src={p.url} regions={p.regions || []} onChange={(regions) => setPopupImages(prev => prev.map((pp, idx) => (idx === i ? { ...pp, regions } : pp)))} />
          </div>
        ))}
      </div>
    </div>
  );
  
  // 타임세일(기간할인 표시) 블록 — Cafe24 기간할인을 골라 카운트다운 + 할인가 노출 (생성 아님, 읽기)
  const openTimesaleModal = (blockToEdit = null) => {
    setAddingMode(false); setNotification(null);
    setSelectedId(blockToEdit?.id || null);
    if (blockToEdit && blockToEdit.type === 'timesale') {
      setTsType(blockToEdit.promoType || (blockToEdit.couponNo ? 'coupon' : 'benefit'));
      setTsMode(blockToEdit.manual ? 'manual' : 'select');
      setTsManualProducts(blockToEdit.manualProducts || []);
      setTsManualRange(blockToEdit.endDate ? [blockToEdit.startDate ? dayjs(blockToEdit.startDate) : null, dayjs(blockToEdit.endDate)] : null);
      timesaleForm.setFieldsValue({ benefitNo: blockToEdit.benefitNo, couponNo: blockToEdit.couponNo, title: blockToEdit.title, showCountdown: blockToEdit.showCountdown !== false, gridSize: blockToEdit.gridSize || 2, cardTemplate: blockToEdit.cardTemplate || 'badge', bannerStyle: blockToEdit.bannerStyle || 'dark' });
    } else {
      setTsType('benefit'); setTsMode('select'); setTsManualProducts([]); setTsManualRange(null);
      timesaleForm.setFieldsValue({ benefitNo: undefined, couponNo: undefined, title: '', showCountdown: true, gridSize: 2, cardTemplate: 'badge', bannerStyle: 'dark' });
    }
    setTimesaleModalVisible(true);
  };
  const submitTimesale = async () => {
    const vals = timesaleForm.getFieldsValue();
    let title = (vals.title || '').trim();
    let endDate = null, startDate = null, productNos = [], benefitNo = null, couponNo = null, manualProducts = null;

    if (tsMode === 'manual') {
      productNos = tsManualProducts.map(p => Number(p.product_no)).filter(Boolean);
      if (productNos.length === 0) return msgApi.warning('표시할 상품을 직접 등록해주세요.');
      if (!tsManualRange || !tsManualRange[1]) return msgApi.warning('타임세일 종료일을 선택해주세요.');
      startDate = tsManualRange[0] ? tsManualRange[0].toISOString() : null;
      endDate = tsManualRange[1].toISOString();
      manualProducts = tsManualProducts.map(p => ({ product_no: p.product_no, product_name: p.product_name, price: p.price, sale_price: p.sale_price, benefit_price: p.benefit_price, list_image: p.list_image, image_medium: p.image_medium }));
      if (!title) title = '타임세일';
    } else if (tsType === 'benefit') {
      if (!vals.benefitNo) return msgApi.warning('표시할 기간할인을 선택하세요. (또는 "직접 입력"을 이용하세요)');
      benefitNo = vals.benefitNo;
      let benefit = benefitsList.find(b => String(b.benefit_no) === String(vals.benefitNo));
      try { const { data } = await api.get(`/api/${mallId}/benefits/${vals.benefitNo}`); if (data) benefit = data; } catch (e) {}
      const ps = (benefit && benefit.period_sale) || {};
      productNos = (ps.product_list || []).map(Number).filter(Boolean);
      if (productNos.length === 0) return msgApi.warning('이 기간할인에 지정된 대상 상품이 없습니다. "직접 입력"으로 상품·기간을 등록해주세요.');
      startDate = benefit?.benefit_start_date || null; endDate = benefit?.benefit_end_date || null;
      if (!title) title = benefit?.benefit_name || '타임세일';
    } else { // coupon
      if (!vals.couponNo) return msgApi.warning('표시할 쿠폰을 선택하세요. (또는 "직접 입력"을 이용하세요)');
      couponNo = vals.couponNo;
      const coupon = couponsList.find(c => String(c.coupon_no) === String(vals.couponNo)) || {};
      const plist = coupon.available_product_list || [];
      productNos = (Array.isArray(plist) ? plist : []).map(Number).filter(Boolean);
      if (productNos.length === 0) return msgApi.warning('이 쿠폰의 대상 상품을 자동으로 가져오지 못했어요. "직접 입력"으로 상품·기간을 등록해주세요.');
      endDate = coupon.available_end_date || coupon.issued_end_date || null;
      if (!title) title = coupon.coupon_name || '쿠폰 타임세일';
    }

    const patch = {
      type: 'timesale', promoType: tsType, manual: tsMode === 'manual',
      benefitNo, couponNo, title, startDate, endDate, productNos, manualProducts,
      showCountdown: vals.showCountdown !== false, gridSize: vals.gridSize || 2, cardTemplate: vals.cardTemplate || 'badge', bannerStyle: vals.bannerStyle || 'dark',
    };
    const sel = blocks.find(b => b.id === selectedId);
    if (sel?.type === 'timesale') setBlocks(prev => prev.map(b => b.id === sel.id ? { ...b, ...patch } : b));
    else { const id = Date.now().toString() + Math.random(); setBlocks(prev => [...prev, { id, ...patch }]); setSelectedId(id); }
    setTimesaleModalVisible(false);
  };

  // 쿠폰할인 탭 — Cafe24 쿠폰 목록 로드 (1회)
  useEffect(() => {
    if (timesaleModalVisible && tsType === 'coupon' && couponsList.length === 0 && mallId) {
      api.get(`/api/${mallId}/coupons`).then(r => setCouponsList(r.data?.coupons || (Array.isArray(r.data) ? r.data : []))).catch(() => {});
    }
  }, [timesaleModalVisible, tsType, mallId, couponsList.length]);

  // 타임세일 "Cafe24에서 불러오기" — 선택한 기간할인/쿠폰의 실제 대상 상품 일부를 미리보기로 로드
  useEffect(() => {
    if (!timesaleModalVisible || tsMode !== 'select' || !mallId) return;
    let cancelled = false;
    (async () => {
      try {
        let nos = [];
        if (tsType === 'benefit' && tsBenefitNo) {
          const { data } = await api.get(`/api/${mallId}/benefits/${tsBenefitNo}`);
          nos = ((data?.period_sale?.product_list) || []).map(Number).filter(Boolean).slice(0, 4);
        } else if (tsType === 'coupon' && tsCouponNo) {
          const c = couponsList.find(x => String(x.coupon_no) === String(tsCouponNo));
          nos = ((c?.available_product_list) || []).map(Number).filter(Boolean).slice(0, 4);
        }
        if (nos.length === 0) { if (!cancelled) setTsSelectProducts([]); return; }
        const arr = await Promise.all(nos.map(no => api.get(`/api/${mallId}/products/${no}`).then(r => r.data).catch(() => null)));
        if (!cancelled) setTsSelectProducts(arr.filter(Boolean));
      } catch (e) { if (!cancelled) setTsSelectProducts([]); }
    })();
    return () => { cancelled = true; };
  }, [timesaleModalVisible, tsMode, tsType, tsBenefitNo, tsCouponNo, mallId, couponsList]);

  // 타임세일 블록 미리보기용 상품 prefetch (benefitNo -> products[])
  useEffect(() => {
    if (!mallId) return;
    blocks.forEach(b => {
      if (b.type !== 'timesale' || timesaleProductsMap[b.id]) return;
      const nos = (b.productNos || []).slice(0, 20);
      if (!nos.length) { setTimesaleProductsMap(prev => ({ ...prev, [b.id]: [] })); return; }
      Promise.all(nos.map(no => api.get(`/api/${mallId}/products/${no}`).then(r => r.data).catch(() => null)))
        .then(arr => setTimesaleProductsMap(prev => ({ ...prev, [b.id]: arr.filter(Boolean) })));
    });
  }, [mallId, blocks, timesaleProductsMap]);

  const handleSubmit = async () => {
    if (!title.trim()) return msgApi.error('이벤트 제목을 입력하세요.');
    if (blocks.length === 0) return msgApi.error('콘텐츠 블록을 하나 이상 추가하세요.');
    if (!mallId) return msgApi.error('Mall ID가 없습니다.');

    const productBlock = blocks.find(b => b.type === 'product_group');
    if (productBlock) {
      const { registerMode, layoutType, directProducts, tabDirectProducts, tabs, root } = productBlock;
      if (registerMode === 'direct') {
        if (layoutType === 'single' && (!directProducts || directProducts.length === 0)) { return msgApi.error('상품 블록에 상품을 1개 이상 등록해주세요.'); }
        if (layoutType === 'tabs') { const allTabsHaveProducts = tabs.every((tab, i) => (tabDirectProducts[i] || []).length > 0); if (!allTabsHaveProducts) { return msgApi.error('상품 블록의 모든 탭에 상품을 1개 이상 등록해주세요.'); } }
      }
      if (registerMode === 'category') {
        if (layoutType === 'single' && !root) { return msgApi.error('상품 블록에 카테고리(대분류)를 선택해주세요.'); }
        if (layoutType === 'tabs') { const allTabsHaveCategory = tabs.every(tab => tab.root); if (!allTabsHaveCategory) { return msgApi.error('상품 블록의 모든 탭에 카테고리(대분류)를 선택해주세요.'); } }
      }
    }

    setSubmitting(true);
    try {
        const uploadPopupRegions = async (regions) => {
          if (!regions || !regions.some(r => r.popup?.images?.length)) return regions;
          return Promise.all(regions.map(async r => {
            if (!r.popup?.images?.length) return r;
            const images = await Promise.all(r.popup.images.map(async img => {
              if (!img.url || /^https?:\/\//.test(img.url)) return { url: img.url, href: img.href, regions: img.regions };
              let blob = img.file;
              if (!blob) blob = await (await fetch(img.url)).blob();
              const fd = new FormData();
              fd.append('file', blob, `popup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.png`);
              const { data } = await api.post(`/api/${mallId}/uploads/image`, fd);
              return { url: data.url, href: img.href, regions: img.regions };
            }));
            return { ...r, popup: { ...r.popup, images } };
          }));
        };
        const uploadedBlocks = await Promise.all(
            blocks.map(async b => {
                const regions = await uploadPopupRegions(b.regions);
                if (b.type === 'image' && b.file) {
                    const formData = new FormData();
                    formData.append('file', b.file);
                    const { data } = await api.post(`/api/${mallId}/uploads/image`, formData);
                    const { file, hash, ...rest } = b;
                    return { ...rest, regions, src: data.url };
                }
                if (b.type === 'image_slide' && Array.isArray(b.images)) {
                    const images = await Promise.all(b.images.map(async img => {
                        if (!img.file || /^https?:\/\//.test(img.src || '')) return { src: img.src, href: img.href || '' };
                        const fd = new FormData();
                        fd.append('file', img.file);
                        const { data } = await api.post(`/api/${mallId}/uploads/image`, fd);
                        return { src: data.url, href: img.href || '' };
                    }));
                    const { file, hash, noticeImageFile, ...rest } = b;
                    return { ...rest, images };
                }
                if (b.type === 'event_notice' && b.noticeImageFile) {
                    const formData = new FormData();
                    formData.append('file', b.noticeImageFile);
                    const { data } = await api.post(`/api/${mallId}/uploads/image`, formData);
                    const { file, hash, noticeImageFile, ...rest } = b;
                    return { ...rest, noticeImage: data.url };
                }
                const { file, hash, noticeImageFile, ...rest } = b;
                return { ...rest, regions };
            })
        );

        const payload = {
            title,
            content: { blocks: uploadedBlocks },
            images: uploadedBlocks.filter(b => b.type === 'image').map(i => ({ _id: i.id, src: i.src, regions: i.regions })),
            couponNos: eventCouponNos,
            pageMaxWidth: pageMaxWidth || null,
            renderer: 'eventOnimon', // 신규 빌더로 만든 이벤트 → 새 렌더러. 기존(미표기) 이벤트는 onimon.js 유지
        };

        const { data } = await api.post(`/api/${mallId}/events`, payload);
        if (data._id) {
            msgApi.success('이벤트가 성공적으로 등록되었습니다.');
            navigate(`/event/detail/${data._id}`);
        }
    } catch (error) {
        console.error("Submit Error:", error);
        msgApi.error(error.response?.data?.message || '이벤트 등록에 실패했습니다.');
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <>
      {msgCtx}
      <Card title="이벤트 페이지 제작" extra={
        <Space>
          <Button icon={isPreviewMode ? <EditOutlined /> : <EyeOutlined />} onClick={() => setIsPreviewMode(!isPreviewMode)}>
            {isPreviewMode ? '편집모드로 돌아가기' : '미리보기'}
          </Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSubmit} loading={submitting} disabled={!mallId}>
            이벤트 등록
          </Button>
        </Space>
      }>
        <div style={{ display: 'flex', gap: '24px', flexDirection: isMobile ? 'column' : 'row' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3>제목</h3>
            <Input placeholder="이벤트 제목을 입력하세요" value={title} onChange={e => setTitle(e.target.value)} />

            <h3 style={{ marginTop: 20, marginBottom: 4 }}>💸 이벤트 적용 쿠폰</h3>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: '#888' }}>선택한 쿠폰이 적용된 가격(혜택가)으로 상품이 표시됩니다. 쿠폰이 적용되지 않는 상품은 정가로 표시.</p>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: '#d32f2f', fontWeight: 600, lineHeight: 1.5 }}>
              ⚠ 라이브 페이지에 쿠폰을 노출하려면 여기 목록에 반드시 추가해야 합니다. 추가하지 않은 쿠폰은 cafe24 에 자동 적용 가능 여부와 상관없이 위젯에 표시되지 않습니다.<br />
              쿠폰을 추가/삭제한 뒤 저장만 하면 라이브 페이지에 자동 반영됩니다 (HTML 재배포 불필요).<br />
              아직 오픈되지 않은(예: 6/1 시작) 쿠폰은 목록에 없어도 <b>쿠폰 번호를 직접 입력 후 Enter</b> 로 미리 추가할 수 있습니다.
            </p>
            <Select mode="tags" placeholder="쿠폰 선택, 또는 미오픈 쿠폰 번호 입력 후 Enter" options={couponOptions} optionFilterProp="label" tokenSeparators={[',']} value={eventCouponNos} onChange={setEventCouponNos} style={{ width: '100%' }} allowClear />

            <h3 style={{ marginTop: 20, marginBottom: 4 }}>↔ 페이지 최대 너비</h3>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: '#888' }}>
              이벤트 페이지 전체(이미지·영상·유의사항·상품)의 웹 최대 너비입니다. 비워두면 기본 800px. 예: 1400<br />
              값을 바꾼 뒤 <b>적용</b>을 누르면 미리보기에 반영됩니다. (라이브 반영은 하단 저장 버튼)
            </p>
            <Space align="center" wrap>
              <InputNumber min={320} max={2400} step={20} placeholder="800" value={pageMaxWidthInput ?? undefined} onChange={(v) => setPageMaxWidthInput(typeof v === 'number' ? v : null)} onPressEnter={() => { setPageMaxWidth(pageMaxWidthInput); msgApi.success(`미리보기에 ${pageMaxWidthInput || 800}px 로 적용했습니다.`); }} style={{ width: 140 }} addonAfter="px" />
              <Button type="primary" onClick={() => { setPageMaxWidth(pageMaxWidthInput); msgApi.success(`미리보기에 ${pageMaxWidthInput || 800}px 로 적용했습니다.`); }}>적용</Button>
              <Button size="small" onClick={() => { setPageMaxWidthInput(null); setPageMaxWidth(null); msgApi.success('기본 너비(800px)로 적용했습니다.'); }}>기본(800)으로</Button>
              {(pageMaxWidthInput ?? null) !== (pageMaxWidth ?? null) ? (<span style={{ fontSize: 12, color: '#fa8c16' }}>변경됨 — [적용]을 눌러 미리보기에 반영하세요</span>) : (<span style={{ fontSize: 12, color: '#999' }}>현재 적용: {pageMaxWidth || 800}px</span>)}
            </Space>

            <Divider />
            <h3>콘텐츠 구성</h3>
            {blocks.length > 0 && (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="blocks-list" direction="horizontal">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="thumb-list">
                      {blocks.map((block, index) => (
                        <Draggable key={block.id} draggableId={block.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                              style={getItemStyle(snapshot.isDragging, provided.draggableProps.style)}
                              className={`thumb-item ${selectedId === block.id ? 'active' : ''} ${block.type} ${snapshot.isDragging ? 'is-dragging' : ''}`}
                              onClick={() => setSelectedId(block.id)}
                            >
                              {block.type === 'image' && <img src={block.src} alt="콘텐츠 이미지" />}
                              {block.type === 'video' && <><YoutubeOutlined /><span>영상 블록</span></>}
                              {block.type === 'text' && <><FontSizeOutlined /><span>텍스트 블록</span></>}
                              {block.type === 'product_group' && <><ShoppingCartOutlined /><span>상품 블록</span></>}
                              {block.type === 'event_notice' && <><ExclamationCircleOutlined /><span>유의사항</span></>}
                              {block.type === 'timesale' && <><ClockCircleOutlined /><span>타임세일</span></>}
                              {block.type === 'image_slide' && <><PictureOutlined /><span>이미지 슬라이드</span></>}
                              <DeleteOutlined className="thumb-delete" onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}/>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
            
            <div style={{ marginTop: 12, marginBottom: 4, fontSize: 12, fontWeight: 600, color: '#555' }}>콘텐츠 블록 추가</div>
            <Space style={{ flexWrap: 'wrap' }}>
               <Button type="primary" ghost icon={<ShoppingCartOutlined />} onClick={() => { setAddingMode(false); setNotification(null); setEditingProductBlock(null); setProductBlockModalVisible(true); }}>상품 추가</Button>
               <Button icon={<ClockCircleOutlined />} onClick={() => { setAddingMode(false); setNotification(null); openTimesaleModal(); }}>타임세일 추가</Button>
               <Button icon={<PictureOutlined />} onClick={() => { setAddingMode(false); setNotification(null); openImageSlide(); }}>이미지 슬라이드 추가</Button>
               <Button icon={<YoutubeOutlined />} onClick={() => { setAddingMode(false); setNotification(null); openVideoModal(); }}>YouTube 추가</Button>
               <Button icon={<FontSizeOutlined />} onClick={() => { setAddingMode(false); setNotification(null); openTextModal(); }}>텍스트 추가</Button>
               <Button icon={<ExclamationCircleOutlined />} onClick={() => openNoticeModal()}>이벤트 유의사항 추가</Button>
             </Space>
            <div style={{ marginTop: 12, marginBottom: 4, fontSize: 12, fontWeight: 600, color: '#555' }}>이미지 영역 기능 <span style={{ fontWeight: 'normal', color: '#999' }}>· 이미지 블록을 선택한 뒤 이미지 위에서 드래그</span></div>
            <Space style={{ flexWrap: 'wrap' }}>
               <Button icon={<LinkOutlined />} type={addingMode && addType === 'link' ? 'primary' : 'default'} onClick={() => { if (!selectedBlock || selectedBlock.type !== 'image') { msgApi.info('URL을 추가할 이미지 블록을 선택하세요.'); return; } setAddType('link'); setAddingMode(true); setNotification('클릭 시 원하는 주소의 페이지로 이동이 되는 기능 (이미지에서 원하는 부분을 마우스 좌클릭 드래그를 통해 영역을 설정하고 URL 주소를 입력하세요)'); }}>URL 추가</Button>
               <Button icon={<TagOutlined />} type={addingMode && addType === 'coupon' ? 'primary' : 'default'} onClick={() => { if (!selectedBlock || selectedBlock.type !== 'image') { msgApi.info('쿠폰을 추가할 이미지 블록을 선택하세요.'); return; } setAddType('coupon'); setAddingMode(true); setNotification('해당 부분을 클릭 시 쿠폰이 다운되는 기능 (이미지에서 원하는 부분을 마우스 좌클릭 드래그를 통해 설정 후 쿠폰을 적용하세요)'); }}>쿠폰 추가</Button>
               <Button icon={<SwapOutlined />} type={addingMode && addType === 'tab' ? 'primary' : 'default'} onClick={() => { if (!selectedBlock || selectedBlock.type !== 'image') { msgApi.info('탭 이동을 추가할 이미지 블록을 선택하세요.'); return; } if (tabTargetOptions.length === 0) { msgApi.info('먼저 탭(tabs) 방식의 상품 블록을 추가하세요.'); return; } setAddType('tab'); setAddingMode(true); setNotification('이미지에서 영역을 드래그한 뒤, 클릭 시 이동할 상품 탭을 선택하세요.'); }}>탭 이동 추가</Button>
               <Button icon={<ExpandOutlined />} type={addingMode && addType === 'popup' ? 'primary' : 'default'} onClick={() => { if (!selectedBlock || selectedBlock.type !== 'image') { msgApi.info('팝업을 추가할 이미지 블록을 선택하세요.'); return; } setAddType('popup'); setAddingMode(true); setPopupImages([]); setPopupShowClose(true); setNotification('이미지에서 영역을 드래그한 뒤, 팝업에 띄울 이미지(1~10장)를 추가하세요.'); }}>팝업 영역 추가</Button>
             </Space>

            <Collapse
              ghost
              style={{ marginTop: 8 }}
              items={[{
                key: 'btnGuide',
                label: <span style={{ fontWeight: 600 }}>🔎 각 버튼 기능 설명 보기</span>,
                children: (
                  <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                    <p style={{ color: '#d32f2f', margin: '0 0 10px' }}>※ <b>URL · 쿠폰 · 탭 이동 · 팝업</b>은 먼저 <b>이미지 블록을 선택</b>한 뒤, 이미지 위에서 마우스 좌클릭 드래그로 영역을 그려야 사용할 수 있습니다.</p>
                    {[
                      { icon: <LinkOutlined />, color: '#fe6326', name: 'URL 추가', desc: '이미지에 클릭 영역을 그려, 클릭 시 입력한 주소(외부 링크·상품 상세·게시판 등)로 이동시킵니다.' },
                      { icon: <TagOutlined />, color: '#ff6347', name: '쿠폰 추가', desc: '클릭 시 쿠폰이 다운로드되는 영역을 만듭니다. 위 "이벤트 적용 쿠폰" 목록에 추가된 쿠폰만 라이브에 노출됩니다. (여러 개 지정 가능)' },
                      { icon: <SwapOutlined />, color: '#722ed1', name: '탭 이동 추가', desc: '클릭 시 지정한 상품 블록의 특정 탭으로 이동+스크롤합니다. 먼저 "탭" 방식 상품 블록이 있어야 합니다.' },
                      { icon: <ExpandOutlined />, color: '#13c2c2', name: '팝업 영역 추가', desc: '클릭 시 1~10장 이미지 팝업(슬라이드)을 띄웁니다. 팝업 안의 각 이미지에도 닫기·링크 영역을 그릴 수 있습니다.' },
                      { icon: <ShoppingCartOutlined />, color: '#1677ff', name: '상품 추가', desc: '상품 목록 블록을 추가합니다. 상품 검색/카테고리 지정, 단품/탭, 그리드(2·3·4), 카드 디자인 6종을 설정합니다.' },
                      { icon: <YoutubeOutlined />, color: '#ff4d4f', name: 'YouTube 추가', desc: '유튜브 링크 또는 영상 ID로 영상 블록을 추가합니다. 화면 비율과 자동재생(무음·반복)을 설정할 수 있습니다.' },
                      { icon: <FontSizeOutlined />, color: '#52c41a', name: '텍스트 추가', desc: '문구 블록을 추가합니다. 정렬·폰트 크기·굵기·색상·위아래 여백을 지정합니다. (엔터는 줄바꿈)' },
                      { icon: <ExclamationCircleOutlined />, color: '#8c8c8c', name: '이벤트 유의사항 추가', desc: '라이브에서 클릭 시 펼쳐지는 유의사항 블록입니다. 이미지·본문 텍스트 중 하나만 입력해도 됩니다.' },
                    ].map((b, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '7px 0', borderBottom: '1px solid #f5f5f5' }}>
                        <div style={{ flexShrink: 0, width: 150, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, color: '#444' }}>
                          <span style={{ color: b.color }}>{b.icon}</span>{b.name}
                        </div>
                        <div style={{ flex: 1, color: '#555' }}>{b.desc}</div>
                      </div>
                    ))}
                    <p style={{ color: '#999', margin: '10px 0 0' }}>더 자세한 설명은 좌측 메뉴 <b>도움말 &gt; 나의 이벤트 제작 사용설명서</b>에서 볼 수 있습니다.</p>
                  </div>
                ),
              }]}
            />

            {addingMode && (
              <Alert
                message={notification}
                type="info"
                showIcon
                closable
                onClose={() => {
                  setNotification(null);
                  setAddingMode(false);
                  setAddType(null);
                }}
                style={{ marginTop: 16 }}
              />
            )}

            <Upload.Dragger {...uploadProps} style={{ marginTop: 16 }}>
              <p className="ant-upload-drag-icon"><UploadOutlined /></p>
              <p className="ant-upload-text">이미지 블록을 추가하려면 파일을 드래그하거나 클릭하세요</p>
            </Upload.Dragger>
          </div>
          <div style={{ flex: 1, minWidth: 0, border: '1px solid #f0f0f0', borderRadius: 8, padding: '16px', background: '#fafafa' }}>
            <h3 style={{ marginTop: 0 ,textAlign:'center'}}>{isPreviewMode ? '미리보기 모드' : '편집 모드'}</h3>
            <div style={{ maxHeight: '70vh', overflowY: 'auto', overflowX: 'hidden', paddingRight: 8, maxWidth: pageMaxWidth || 800, margin: '0 auto' }}>
              {blocks.map(b => {
                const isSelected = selectedId === b.id;
                // ✅ [수정] isPreviewMode에 따라 렌더링 분기
                if (isPreviewMode) {
                  // --- 미리보기 모드 ---
                  switch (b.type) {
                    case 'image': return <img key={b.id} src={b.src} alt="preview" style={{ width: '100%', display: 'block', marginBottom: '8px' }} />;
                    case 'video': return <div key={b.id} style={{ marginBottom: '16px' }}><YouTubeEmbed id={b.youtubeId} ratioW={b.ratio?.w} ratioH={b.ratio?.h} autoplay={b.autoplay} loop={b.loop} /></div>;
                    case 'text': const st = b.style || {}; return ( <div key={b.id} style={{ textAlign: st.align || 'center', margin: `${st.mt || 16}px 0 ${st.mb || 16}px` }}><div style={{ fontSize: st.fontSize || 18, fontWeight: st.fontWeight || 'normal', color: st.color || '#333', whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: escapeHtml(b.text).replace(/\n/g, '<br/>') }} /></div>);
                    case 'event_notice': return (
                      <div key={b.id} style={{ marginBottom: 8 }}>
                        <div style={{ padding: '12px 16px', background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 6, fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>{b.noticeTitle || '이벤트 유의사항'}</span><span style={{ fontSize: 12 }}>▾</span></div>
                        {b.noticeImage && <img src={b.noticeImage} alt="유의사항" style={{ maxWidth: '100%', display: 'block', marginTop: 8 }} />}
                        {b.noticeText && <div style={{ marginTop: b.noticeImage ? 0 : 8, padding: b.noticeStyle?.padding ?? 16, background: b.noticeStyle?.background || 'transparent', color: b.noticeStyle?.color || '#444', fontSize: b.noticeStyle?.fontSize ?? 14, lineHeight: b.noticeStyle?.lineHeight ?? 1.7, letterSpacing: b.noticeStyle?.letterSpacing ? `${b.noticeStyle.letterSpacing}px` : undefined, whiteSpace: 'pre-wrap' }}>{b.noticeText}</div>}
                      </div>
                    );
                    case 'timesale': {
                      const tprods = timesaleProductsMap[b.id] || [];
                      return (
                        <div key={b.id} style={{ marginBottom: 16 }}>
                          <TimesaleBanner title={b.title} endDate={b.endDate} showCountdown={b.showCountdown} bannerStyle={b.bannerStyle} />
                          {renderGrid(b.gridSize || 2, tprods, 0, b.cardTemplate || 'badge', {})}
                        </div>
                      );
                    }
                    case 'product_group': {
                      const activeTabIndex = previewActiveTabs[b.id] || 0;
                      const tabCols = b.tabsPerRow && b.tabsPerRow >= 2 ? b.tabsPerRow : ((b.tabs || []).length || 1);
                      return (
                          <div key={b.id} style={{ marginBottom: 16 }}>
                              {b.layoutType === 'tabs' && (<div style={{ display: 'grid', gridTemplateColumns: `repeat(${tabCols}, 1fr)`, gap: 8, marginBottom: 8 }}>{(b.tabs || []).map((tab, i) => (<Button key={i} style={{ borderColor: i === activeTabIndex ? b.activeColor || '#fe6326' : undefined, backgroundColor: i === activeTabIndex ? b.activeColor || '#fe6326' : '#fff', color: i === activeTabIndex ? '#fff' : 'inherit' }} onClick={() => setPreviewActiveTabs(prev => ({ ...prev, [b.id]: i }))}>{tab.title || `탭 ${i + 1}`}</Button>))}</div>)}
                              {renderGrid(getPreviewCols(b, activeTabIndex), getPreviewProducts(b, activeTabIndex), previewDiscountPercent, b.cardTemplate, { thumbRadius: b.thumbRadius, iconPosition: b.iconPosition, cardStyle: b.cardStyle, rolling: (b.layoutType === 'tabs' ? (b.tabRolling && b.tabRolling[activeTabIndex]) : b.rolling), soldOutNos: b.soldOutNos })}
                          </div>
                      );
                    }
                    case 'image_slide': return (<div key={b.id} style={{ marginBottom: 16 }}><ImageSlidePreview images={b.images} sw={b.swiper} /></div>);
                    default: return null;
                  }
                } else {
                  // --- 편집 모드 ---
                  if (b.type === 'image') return (
                    <div key={b.id} className={`preview-block-container ${isSelected ? 'selected' : ''}`}>
                      <div className="block-header">
                          <div className="block-title"><PictureOutlined /><strong>이미지 블록</strong></div>
                          <Button type="link" size="small" danger onClick={() => deleteBlock(b.id)}>삭제</Button>
                      </div>
                      <div className="block-content image-content" onMouseDown={addingMode && isSelected ? onMouseDown : undefined} onMouseMove={addingMode && isSelected ? onMouseMove : undefined} onMouseUp={addingMode && isSelected ? onMouseUp : undefined} style={{cursor: addingMode && isSelected ? 'crosshair':'default', position:'relative', width: '100%'}}>
                        <img ref={isSelected ? imgRef : null} src={b.src} alt="preview" style={{ width: '100%', display: 'block'}} draggable={false} onDragStart={e => e.preventDefault()} />
                        {(b.regions || []).map(r => {
                          const kind = r.coupon ? 'coupon' : r.tabTarget ? 'tab' : r.popup ? 'popup' : 'url';
                          const c = { coupon: '#ff6347', tab: '#722ed1', popup: '#13c2c2', url: '#fe6326' }[kind];
                          const label = { coupon: '쿠폰', tab: '탭', popup: '팝업', url: 'URL' }[kind];
                          const style = { position: 'absolute', left: `${r.xRatio*100}%`, top: `${r.yRatio*100}%`, width: `${r.wRatio*100}%`, height: `${r.hRatio*100}%`, border: `2px dashed ${c}`, cursor: 'pointer', background: `${c}33`, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start' };
                          return (<div key={r.id} onClick={(e) => { e.stopPropagation(); openEditRegion(r); }} style={style}><span style={{ background: c, color: 'white', fontSize: '10px', padding: '1px 4px', borderRadius: '2px', lineHeight: 1, fontWeight: 'bold', margin: '1px' }}>{label}</span></div>);
                        })}
                        {isSelected && dragStartPos && dragCurrent && <div style={{position:'absolute', left: Math.min(dragStartPos.x, dragCurrent.x), top: Math.min(dragStartPos.y, dragCurrent.y), width: Math.abs(dragCurrent.x-dragStartPos.x), height:Math.abs(dragCurrent.y-dragStartPos.y), border:'1px dashed #999', background:'rgba(200,200,200,0.2)'}} />}
                      </div>
                    </div>
                  );
                  if (b.type === 'video') return (
                    <div key={b.id} className={`preview-block-container ${isSelected ? 'selected' : ''}`}>
                      <div className="block-header">
                          <div className="block-title"><YoutubeOutlined /><strong>영상 블록</strong></div>
                          <Space><Button type="link" size="small" onClick={() => openVideoModal(b)}>편집</Button><Button type="link" size="small" danger onClick={() => deleteBlock(b.id)}>삭제</Button></Space>
                      </div>
                      <div className="block-content"><YouTubeEmbed id={b.youtubeId} ratioW={b.ratio?.w} ratioH={b.ratio?.h} autoplay={b.autoplay} loop={b.loop} /></div>
                    </div>
                  );
                  if (b.type === 'text') return (
                    <div key={b.id} className={`preview-block-container ${isSelected ? 'selected' : ''}`}>
                      <div className="block-header">
                          <div className="block-title"><FontSizeOutlined /><strong>텍스트 블록</strong></div>
                          <Space><Button type="link" size="small" onClick={() => openTextModal(b)}>편집</Button><Button type="link" size="small" danger onClick={() => deleteBlock(b.id)}>삭제</Button></Space>
                      </div>
                      <div className="block-content" style={{ margin: `${b.style?.mt || 0}px 0 ${b.style?.mb || 0}px` }}>
                        <div style={{ textAlign: b.style?.align || 'center', fontSize: b.style?.fontSize || 18, fontWeight: b.style?.fontWeight || 'normal', color: b.style?.color || '#333', whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: escapeHtml(b.text).replace(/\n/g, '<br/>') }} />
                      </div>
                    </div>
                  );
                  if (b.type === 'event_notice') return (
                    <div key={b.id} className={`preview-block-container ${isSelected ? 'selected' : ''}`}>
                      <div className="block-header">
                        <div className="block-title"><ExclamationCircleOutlined /><strong>이벤트 유의사항</strong></div>
                        <Space><Button type="link" size="small" onClick={() => openNoticeModal(b)}>편집</Button><Button type="link" size="small" danger onClick={() => deleteBlock(b.id)}>삭제</Button></Space>
                      </div>
                      <div className="block-content">
                        <div style={{ padding: '10px 14px', background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 6, fontWeight: 600, fontSize: 15, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>{b.noticeTitle || '이벤트 유의사항'}</span><span style={{ fontSize: 12 }}>▾</span></div>
                        {b.noticeImage && <img src={b.noticeImage} alt="유의사항" style={{ maxWidth: '100%', display: 'block', marginTop: 10 }} />}
                        {b.noticeText && <div style={{ marginTop: b.noticeImage ? 0 : 10, padding: b.noticeStyle?.padding ?? 16, background: b.noticeStyle?.background || 'transparent', color: b.noticeStyle?.color || '#444', fontSize: b.noticeStyle?.fontSize ?? 14, lineHeight: b.noticeStyle?.lineHeight ?? 1.7, letterSpacing: b.noticeStyle?.letterSpacing ? `${b.noticeStyle.letterSpacing}px` : undefined, whiteSpace: 'pre-wrap' }}>{b.noticeText}</div>}
                      </div>
                    </div>
                  );
                  if (b.type === 'timesale') {
                    const tprods = timesaleProductsMap[b.id] || [];
                    return (
                      <div key={b.id} className={`preview-block-container ${isSelected ? 'selected' : ''}`}>
                        <div className="block-header">
                          <div className="block-title"><ClockCircleOutlined /><strong>타임세일</strong></div>
                          <Space><Button type="link" size="small" onClick={() => openTimesaleModal(b)}>편집</Button><Button type="link" size="small" danger onClick={() => deleteBlock(b.id)}>삭제</Button></Space>
                        </div>
                        <div className="block-content">
                          <TimesaleBanner title={b.title} endDate={b.endDate} showCountdown={b.showCountdown} bannerStyle={b.bannerStyle} />
                          {tprods.length === 0 ? <div style={{ padding: '24px', textAlign: 'center', color: '#888' }}>대상 상품 {b.productNos?.length || 0}개 — 라이브에서 할인가로 표시됩니다</div> : renderGrid(b.gridSize || 2, tprods, 0, b.cardTemplate || 'badge', {})}
                        </div>
                      </div>
                    );
                  }
                  if (b.type === 'image_slide') {
                    return (
                      <div key={b.id} className={`preview-block-container ${isSelected ? 'selected' : ''}`}>
                        <div className="block-header">
                          <div className="block-title"><PictureOutlined /><strong>이미지 슬라이드</strong> <span style={{ fontSize: 12, color: '#999' }}>({(b.images || []).length}장)</span></div>
                          <Space><Button type="link" size="small" onClick={() => openImageSlide(b)}>편집</Button><Button type="link" size="small" danger onClick={() => deleteBlock(b.id)}>삭제</Button></Space>
                        </div>
                        <div className="block-content">
                          <ImageSlidePreview images={b.images} sw={b.swiper} />
                        </div>
                      </div>
                    );
                  }
                  if (b.type === 'product_group') {
                      const activeTabIndex = previewActiveTabs[b.id] || 0;
                      const tabCols = b.tabsPerRow && b.tabsPerRow >= 2 ? b.tabsPerRow : ((b.tabs || []).length || 1);
                      return (
                          <div key={b.id} className={`preview-block-container ${isSelected ? 'selected' : ''}`}>
                              <div className="block-header">
                                  <div className="block-title"><ShoppingCartOutlined /><strong>상품 블록</strong></div>
                                  <Space><Button type="link" size="small" onClick={() => { setEditingProductBlock(b); setProductBlockModalVisible(true); }}>편집</Button><Button type="link" size="small" danger onClick={() => deleteBlock(b.id)}>삭제</Button></Space>
                              </div>
                              <div className="block-content">
                                  {b.layoutType === 'tabs' && (<div style={{ display: 'grid', gridTemplateColumns: `repeat(${tabCols}, 1fr)`, gap: 8, marginBottom: 8 }}>{(b.tabs || []).map((tab, i) => (<Button key={i} style={{ borderColor: i === activeTabIndex ? b.activeColor || '#fe6326' : undefined, backgroundColor: i === activeTabIndex ? b.activeColor || '#fe6326' : '#fff', color: i === activeTabIndex ? '#fff' : 'inherit' }} onClick={() => setPreviewActiveTabs(prev => ({ ...prev, [b.id]: i }))}>{tab.title || `탭 ${i + 1}`}</Button>))}</div>)}
                                  {renderGrid(getPreviewCols(b, activeTabIndex), getPreviewProducts(b, activeTabIndex), previewDiscountPercent, b.cardTemplate, { thumbRadius: b.thumbRadius, iconPosition: b.iconPosition, cardStyle: b.cardStyle, rolling: (b.layoutType === 'tabs' ? (b.tabRolling && b.tabRolling[activeTabIndex]) : b.rolling), soldOutNos: b.soldOutNos })}
                              </div>
                          </div>
                      );
                  }
                  return null;
                }
              })}
            </div>
          </div>
        </div>
      </Card>

      <ProductBlockModal visible={productBlockModalVisible} onCancel={() => { setEditingProductBlock(null); setProductBlockModalVisible(false); }} onOk={addProductBlock} msgApi={msgApi} isMobile={isMobile} allCats={allCats} initialData={editingProductBlock} />
      {imageSlideVisible && <ImageSlideModal visible={imageSlideVisible} initialData={imageSlideInit} onCancel={() => { setImageSlideVisible(false); setImageSlideInit(null); }} onOk={handleImageSlideOk} msgApi={msgApi} isMobile={isMobile} />}
      <Modal open={mapModalVisible} width={addType === 'popup' ? 680 : 520} title={addType === 'link' ? 'URL 영역 설정' : addType === 'tab' ? '탭 이동 영역 설정' : addType === 'popup' ? '팝업 영역 설정' : '쿠폰 영역 설정'} onCancel={() => { setMapModalVisible(false); setPendingRegion(null); setAddingMode(false); setAddType(null); setPopupImages([]); mapForm.resetFields(); }} onOk={saveRegion} okText="적용" cancelText="취소"><Form form={mapForm} layout="vertical">{addType === 'link' ? (<Form.Item name="href" label="URL" rules={[{ required: true, message: 'URL을 입력해주세요.' }]}><Input placeholder="https://example.com" /></Form.Item>) : addType === 'tab' ? (<Form.Item name="tabTarget" label="이동할 탭" rules={[{ required: true, message: '이동할 탭을 선택하세요.' }]}><Select options={tabTargetOptions} placeholder="이동할 상품 탭 선택" /></Form.Item>) : addType === 'popup' ? renderPopupEditor() : (<Form.Item name="coupon" label="쿠폰 선택 혹은 번호 입력" rules={[{ required: true, message: '쿠폰을 하나 이상 선택/입력하세요.' }]}><Select ref={couponSelectRef} mode="tags" options={couponOptions} tokenSeparators={[',']} onSelect={() => couponSelectRef.current?.blur()} tagRender={({ label, closable, onClose }) => <Tag closable={closable} onClose={onClose}>{label}</Tag>} placeholder="쿠폰 선택 또는 번호 입력" /></Form.Item>)}</Form></Modal>
      <Modal open={editModalVisible} width={editingRegion?.popup ? 680 : 520} title="영역 편집" onCancel={() => { setEditModalVisible(false); setPopupImages([]); }} footer={[<Button key="del" danger onClick={deleteRegion}>삭제</Button>,<Button key="cancel" onClick={() => { setEditModalVisible(false); setPopupImages([]); }}>취소</Button>,<Button key="ok" type="primary" onClick={applyEditRegion}>적용</Button>,]}><Form form={editForm} layout="vertical">{editingRegion?.coupon ? (<Form.Item name="coupon" label="쿠폰 선택 혹은 번호 입력" rules={[{ required: true, message: '쿠폰을 하나 이상 선택/입력하세요.' }]}><Select ref={couponEditSelectRef} mode="tags" options={couponOptions} tokenSeparators={[',']} onSelect={() => couponEditSelectRef.current?.blur()} tagRender={({ label, closable, onClose }) => <Tag closable={closable} onClose={onClose}>{label}</Tag>} /></Form.Item>) : editingRegion?.tabTarget ? (<Form.Item name="tabTarget" label="이동할 탭" rules={[{ required: true, message: '이동할 탭을 선택하세요.' }]}><Select options={tabTargetOptions} placeholder="이동할 상품 탭 선택" /></Form.Item>) : editingRegion?.popup ? renderPopupEditor() : (<Form.Item name="href" label="URL" rules={[{ required: true, message: 'URL을 입력하세요.' }]}><Input placeholder="https://example.com" /></Form.Item>)}</Form></Modal>
      <Modal open={videoModalVisible} title={(selectedId && blocks.find(b=>b.id===selectedId)?.type==='video') ? "영상 편집" : "영상 추가"} onCancel={() => setVideoModalVisible(false)} onOk={submitVideo} okText="적용" cancelText="취소"><Form form={videoForm} layout="vertical" initialValues={{w:16, h:9}}><Form.Item name="urlOrId" label="YouTube 링크 또는 영상 ID" rules={[{ required: true, message: 'YouTube 링크/ID를 입력하세요.' }]}><Input /></Form.Item><p style={{ fontSize: '12px', color: '#888', marginTop: '-12px', marginBottom: '16px' }}>원하는 유튜브 영상 오른쪽 버튼 '동영상 URL 복사'를 통해 영상을 추가할 수 있습니다.</p><Space><Form.Item name="w" label="비율 W" style={{marginBottom:0}}><InputNumber min={1} step={1} style={{width:100}}/></Form.Item><div style={{alignSelf:'end', padding:'0 6px 8px'}}>/</div><Form.Item name="h" label="비율 H" style={{marginBottom:0}}><InputNumber min={1} step={1} style={{width:100}}/></Form.Item></Space><Form.Item name="autoplay" valuePropName="checked" style={{marginTop:8}}><Checkbox>자동재생 (자동재생 시 반복이 자동 적용됩니다)</Checkbox></Form.Item></Form></Modal>
      <Modal open={textModalVisible} title={(selectedId && blocks.find(b=>b.id===selectedId)?.type==='text') ? "텍스트 편집" : "텍스트 추가"} onCancel={() => setTextModalVisible(false)} onOk={submitText} okText="적용" cancelText="취소"><Form form={textForm} layout="vertical" initialValues={{align:'center', fontSize:18, fontWeight:'normal', color:'#333333', mt:16, mb:16}}><Form.Item name="text" label="문구" rules={[{ required: true, message: '문구를 입력해주세요.' }]}><Input.TextArea rows={4} placeholder="문구를 입력하세요. 엔터는 줄바꿈으로 표시됩니다." /></Form.Item><Space wrap><Form.Item name="align" label="정렬" style={{marginBottom:0}}><Select style={{width:110}}><Option value="left">왼쪽</Option><Option value="center">가운데</Option><Option value="right">오른쪽</Option></Select></Form.Item><Form.Item name="fontSize" label="폰트크기" style={{marginBottom:0}}><InputNumber min={10} max={80} step={1} style={{width:110}}/></Form.Item><Form.Item name="fontWeight" label="굵기" style={{marginBottom:0}}><Select style={{width:110}}><Option value="normal">보통</Option><Option value="bold">굵게</Option></Select></Form.Item><Form.Item name="color" label="색상" style={{marginBottom:0}}><Input type="color" style={{width:60, padding:0, border:'none', background:'transparent'}}/></Form.Item><Form.Item name="mt" label="위 간격(px)" style={{marginBottom:0}}><InputNumber min={0} step={1} style={{width:120}}/></Form.Item><Form.Item name="mb" label="아래 간격(px)" style={{marginBottom:0}}><InputNumber min={0} step={1} style={{width:120}}/></Form.Item></Space></Form></Modal>
      <Modal open={noticeModalVisible} title={(selectedId && blocks.find(b=>b.id===selectedId)?.type==='event_notice') ? "이벤트 유의사항 편집" : "이벤트 유의사항 추가"} onCancel={() => setNoticeModalVisible(false)} onOk={submitNotice} okText="적용" cancelText="취소" width={600}>
        <Form form={noticeForm} layout="vertical" initialValues={{ noticeTitle: '이벤트 유의사항', color:'#444444', fontSize:14, lineHeight:1.7, letterSpacing:0, padding:16 }}>
          <Alert type="info" showIcon style={{ marginBottom: 16 }} message="텍스트 입력 또는 이미지 영역을 통해 유의사항에 대한 디자인 작업을 해주세요. (이미지·본문 중 하나만 입력해도 됩니다)" />
          <Form.Item name="noticeTitle" label="토글 버튼 제목" rules={[{ required: true, message: '버튼 제목을 입력하세요.' }]}><Input placeholder="예: 이벤트 유의사항" /></Form.Item>
          <Form.Item label="유의사항 이미지 (선택)">
            <Upload accept="image/*" showUploadList={false} beforeUpload={(file) => { if (file.size/1024/1024 > 10) { msgApi.error('이미지는 10MB 이하여야 합니다.'); return Upload.LIST_IGNORE; } const reader = new FileReader(); reader.onload = (e) => { setNoticeImagePreview(e.target?.result || ''); setNoticeImageFile(file); }; reader.readAsDataURL(file); return false; }}>
              <Button icon={<UploadOutlined />}>{noticeImagePreview ? '이미지 변경' : '이미지 업로드'}</Button>
            </Upload>
            {noticeImagePreview && (<div style={{ marginTop: 10, position: 'relative', display: 'inline-block' }}><img src={noticeImagePreview} alt="유의사항 미리보기" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 4, border: '1px solid #f0f0f0' }} /><Button size="small" danger onClick={() => { setNoticeImagePreview(''); setNoticeImageFile(undefined); }} style={{ position: 'absolute', top: 4, right: 4 }}>제거</Button></div>)}
          </Form.Item>
          <Form.Item name="noticeText" label="본문 텍스트 (선택)"><Input.TextArea rows={8} placeholder="유의사항 본문을 입력하세요. 엔터로 줄바꿈." /></Form.Item>
          <Divider style={{ margin: '12px 0' }}>본문 스타일</Divider>
          <Space wrap>
            <Form.Item name="background" label="배경색" style={{ marginBottom: 8 }}><Input type="color" style={{ width: 60, padding: 0, border: 'none', background: 'transparent' }} /></Form.Item>
            <Form.Item name="color" label="글자색" style={{ marginBottom: 8 }}><Input type="color" style={{ width: 60, padding: 0, border: 'none', background: 'transparent' }} /></Form.Item>
            <Form.Item name="fontSize" label="폰트 크기(px)" style={{ marginBottom: 8 }}><InputNumber min={10} max={32} step={1} style={{ width: 100 }} /></Form.Item>
            <Form.Item name="lineHeight" label="줄 간격" style={{ marginBottom: 8 }}><InputNumber min={1} max={3} step={0.1} style={{ width: 100 }} /></Form.Item>
            <Form.Item name="letterSpacing" label="자간(px)" style={{ marginBottom: 8 }}><InputNumber min={-2} max={5} step={0.1} style={{ width: 100 }} /></Form.Item>
            <Form.Item name="padding" label="패딩(px)" style={{ marginBottom: 8 }}><InputNumber min={0} max={64} step={2} style={{ width: 100 }} /></Form.Item>
          </Space>
          <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5 }}>라이브 페이지에서 토글 버튼 클릭 시 슬라이드 다운으로 이미지 + 본문이 펼쳐집니다. 이미지나 본문 중 하나만 입력해도 됩니다.</div>
        </Form>
      </Modal>
      <Modal open={timesaleModalVisible} title={(selectedId && blocks.find(b=>b.id===selectedId)?.type==='timesale') ? "타임세일 편집" : "타임세일 추가"} onCancel={() => setTimesaleModalVisible(false)} onOk={submitTimesale} okText="적용" cancelText="취소" width={620}>
        <Tabs activeKey={tsType} onChange={(k) => setTsType(k)} items={[{ key: 'benefit', label: '① 기간할인' }, { key: 'coupon', label: '② 쿠폰할인' }]} />
        <Segmented block options={[{ label: 'Cafe24에서 불러오기', value: 'select' }, { label: '직접 입력', value: 'manual' }]} value={tsMode} onChange={setTsMode} style={{ marginBottom: 14 }} />
        <Alert type="warning" showIcon banner style={{ marginBottom: 14 }}
          message="이 블록은 할인을 새로 만들지 않고 ‘표시’만 합니다."
          description="실제 결제 할인은 선택한 기간할인·쿠폰이 Cafe24에 실제 적용돼 있을 때만 일치합니다. ‘직접 입력’은 카운트다운 배너 표시용이며, 결제가는 상품의 현재 Cafe24 가격을 따릅니다." />
        <Form form={timesaleForm} layout="vertical" initialValues={{ showCountdown: true, gridSize: 2, cardTemplate: 'badge', bannerStyle: 'dark' }}>
          {tsMode === 'select' && tsType === 'benefit' && (<>
            <Alert type="info" showIcon style={{ marginBottom: 14 }} message="Cafe24 기간할인을 선택하면 종료까지 카운트다운 + 자동 할인가로 상품이 표시됩니다." />
            <Form.Item name="benefitNo" label="표시할 기간할인 선택">
              <Select placeholder={benefitsList.length ? '진행/예정 기간할인 선택' : '기간할인이 없습니다 — 직접 입력을 이용하세요'} showSearch optionFilterProp="label" options={benefitsList.map(b => ({ value: b.benefit_no, label: `${b.benefit_name} (${(b.benefit_start_date || '').slice(0, 10)} ~ ${(b.benefit_end_date || '').slice(0, 10)})` }))} />
            </Form.Item>
          </>)}
          {tsMode === 'select' && tsType === 'coupon' && (<>
            <Alert type="info" showIcon style={{ marginBottom: 14 }} message="쿠폰을 선택하면 그 쿠폰이 적용되는 상품을 불러와 쿠폰 할인가로 표시합니다. (상품 목록을 못 가져오면 직접 입력을 이용하세요)" />
            <Form.Item name="couponNo" label="표시할 쿠폰 선택">
              <Select placeholder={couponsList.length ? '쿠폰 선택' : '쿠폰을 불러오는 중 / 없음 — 직접 입력을 이용하세요'} showSearch optionFilterProp="label" options={couponsList.map(c => ({ value: c.coupon_no, label: `${c.coupon_name || c.coupon_no}${c.available_end_date ? ` (~${String(c.available_end_date).slice(0, 10)})` : ''}` }))} />
            </Form.Item>
          </>)}
          {tsMode === 'manual' && (<>
            <Alert type="warning" showIcon style={{ marginBottom: 14 }} message="직접 입력 — 기간/상품을 자동으로 못 가져올 때" description="대상 상품을 직접 등록하고, 타임세일 시작·종료일을 직접 지정하세요. (할인가는 Cafe24에 적용된 실제 가격으로 표시)" />
            <Form.Item label="대상 상품 직접 등록" required>
              <Button type={tsManualProducts.length ? 'primary' : 'dashed'} onClick={() => setTsMorePrdVisible(true)}>{tsManualProducts.length ? `상품 ${tsManualProducts.length}개 등록됨 (변경)` : '상품 직접 등록'}</Button>
            </Form.Item>
            <Form.Item label="타임세일 기간 (시작 ~ 종료)" required>
              <DatePicker.RangePicker showTime value={tsManualRange} onChange={setTsManualRange} style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
            </Form.Item>
          </>)}
          <Form.Item name="title" label="배너 제목 (비우면 자동)"><Input placeholder="예: ⏰ 오늘만 타임세일" /></Form.Item>
          <Form.Item name="showCountdown" valuePropName="checked" style={{ marginBottom: 8 }}><Checkbox>종료까지 카운트다운 표시</Checkbox></Form.Item>
          <Form.Item name="bannerStyle" label="배너 디자인" style={{ marginBottom: 8 }}>
            <Segmented options={Object.keys(TIMESALE_BANNERS).map(k => ({ value: k, label: TIMESALE_BANNERS[k].label }))} />
          </Form.Item>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>↓ 배너 미리보기 (예시 카운트다운)</div>
            <TimesaleBanner title={tsTitle} endDate={(tsMode === 'manual' && tsManualRange && tsManualRange[1]) ? tsManualRange[1].valueOf() : (Date.now() + 2 * 86400000 + 3 * 3600000)} showCountdown={tsShowCd} bannerStyle={tsBannerStyle} />
          </div>
          <Space wrap>
            <Form.Item name="gridSize" label="그리드" style={{ marginBottom: 0 }}><Select style={{ width: 100 }} options={[{ label: '2×2', value: 2 }, { label: '3×3', value: 3 }, { label: '4×4', value: 4 }]} /></Form.Item>
            <Form.Item name="cardTemplate" label="카드 디자인" style={{ marginBottom: 0 }}><Select style={{ width: 220 }} options={CARD_TEMPLATES.map(t => ({ value: t.value, label: t.label }))} /></Form.Item>
          </Space>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>↓ 예시 상품 카드 미리보기</div>
            {(() => {
              const cols = tsGrid || 2;
              const picked = tsMode === 'manual' ? tsManualProducts : tsSelectProducts;
              const tprev = picked.length ? picked.slice(0, cols) : Array.from({ length: cols }, (_, i) => SAMPLE_PRODUCTS[i % SAMPLE_PRODUCTS.length]);
              return renderGrid(cols, tprev, 0, tsTemplate || 'badge', {});
            })()}
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: '#fa8c16' }}>※ 할인가는 Cafe24에 적용된 실제 가격으로 표시되며, 기간이 끝나면 자동으로 원가로 돌아갑니다.</div>
        </Form>
        {tsMorePrdVisible && <MorePrd visible={tsMorePrdVisible} initialSelected={tsManualProducts} onOk={(prods) => { setTsManualProducts(Array.isArray(prods) ? prods : []); setTsMorePrdVisible(false); }} onCancel={() => setTsMorePrdVisible(false)} />}
      </Modal>
    </>
  );
}
