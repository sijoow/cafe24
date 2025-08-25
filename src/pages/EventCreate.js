// src/pages/EventCreate.js
import React, { useState, useEffect, useRef } from 'react';
import MorePrd from './MorePrd';
import {
  Card,
  Steps,
  Upload,
  Input,
  Button,
  Segmented,
  Space,
  Modal,
  Form,
  Select,
  message,
  Tag,
  Grid,
  Alert,
} from 'antd';
import {
  InboxOutlined,
  DeleteOutlined,
  LinkOutlined,
  TagOutlined,
  BlockOutlined,
  YoutubeOutlined,
  FontSizeOutlined,
} from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../axios';
import './EventCreate.css';
import sha256 from 'crypto-js/sha256';
import encHex from 'crypto-js/enc-hex';

const { Step } = Steps;
const { useBreakpoint } = Grid;

// YouTube id 파서
function getYouTubeId(input) {
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
}

// <br/>용 이스케이프
const escapeHtml = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default function EventCreate() {
  const navigate = useNavigate();
  const { id: _unused } = useParams();

  const params = new URLSearchParams(window.location.search);
  const paramMallId = params.get('mall_id') || params.get('state');
  const storedMallId = localStorage.getItem('mallId');
  const mallId = paramMallId || storedMallId;

  const [msgApi, msgCtx] = message.useMessage();
  const screens = useBreakpoint();
  const isMobile = !screens.sm;

  // 드래그 중 클릭 무시용
  const draggingRef = useRef(false);
  const getItemStyle = (isDragging, draggableStyle) => ({
    userSelect: 'none',
    transition: isDragging
      ? undefined
      : 'transform 200ms cubic-bezier(0.2,0,0,1), opacity 200ms',
    boxShadow: isDragging ? '0 6px 12px rgba(0,0,0,0.15)' : 'none',
    zIndex: isDragging ? 2 : 1,
    ...draggableStyle,
  });

  // wizard
  const [current, setCurrent] = useState(0);
  const titleRef = useRef(null);
  useEffect(() => {
    if (current === 0) setTimeout(() => titleRef.current?.focus(), 0);
  }, [current]);

  // ---------- 여기를 수정한 next()로 교체했습니다 ----------
  const next = () => {
    if (current === 0) {
      if (!title.trim()) setTitle('제목없음');
      setCurrent(1);
    } else if (current === 1 && blocks.length === 0) {
      msgApi.warning('이미지를 추가하세요.');
    } else if (current === 2) {
      // registerMode 선택 확인
      if (!registerMode) {
        msgApi.warning('상품 등록 방식을 선택하세요.');
        return;
      }

      // registerMode === 'none' 인 경우 상품 관련 검사 없이 진행 허용
      if (registerMode === 'none') {
        setCurrent(3);
        return;
      }

      // 공통: 그리드/레이아웃 선택 체크 (카테고리/직접 공통)
      if (!gridSize) {
        msgApi.warning('그리드 사이즈를 선택해주세요.');
        return;
      }
      if (!layoutType) {
        msgApi.warning('상품 노출 방식을 선택해주세요.');
        return;
      }

      // 카테고리 기반 등록 검사
      if (registerMode === 'category') {
        if (layoutType === 'single') {
          if (!singleRoot) {
            msgApi.warning('상품 분류(대분류)를 선택하세요.');
            return;
          }
          setCurrent(3);
          return;
        }

        // layoutType === 'tabs'
        if (tabs.length < 2) {
          msgApi.warning('탭을 두 개 이상 설정하세요.');
          return;
        }
        // 탭들 중 최소 하나는 대분류가 선택되어 있어야 실제 상품을 노출할 수 있으므로 검사
        const hasAnyTabRoot = tabs.some(t => !!t.root);
        if (!hasAnyTabRoot) {
          msgApi.warning('탭 중 하나 이상의 대분류를 선택하세요.');
          return;
        }
        setCurrent(3);
        return;
      }

      // 직접 등록 검사
      if (registerMode === 'direct') {
        if (layoutType === 'single') {
          if (!directProducts || directProducts.length === 0) {
            msgApi.warning('상품을 1개 이상 등록해주세요.');
            return;
          }
          setCurrent(3);
          return;
        }

        // layoutType === 'tabs'
        const totalDirect = Object.values(tabDirectProducts || {}).reduce((s, arr) => s + (Array.isArray(arr) ? arr.length : 0), 0);
        if (totalDirect === 0) {
          msgApi.warning('탭당 최소 1개 이상의 상품을 등록해주세요.');
          return;
        }
        setCurrent(3);
        return;
      }

      // 기본 안전장치
      setCurrent(3);
    } else {
      setCurrent(c => c + 1);
    }
  };
  // ------------------------------------------------------------

  const prev = () => setCurrent(c => c - 1);

  // 제목
  const [title, setTitle] = useState('');

  // 블록들 (image / video / text)
  const [blocks, setBlocks] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  // 전체보기 토글
  const [showAllPreview, setShowAllPreview] = useState(false);

  // 업로드
  const imgRef = useRef(null);
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
        setBlocks(prev => {
          const next = [...prev, { id, type: 'image', src, file, hash, regions: [] }];
          setSelectedId(id);
          // 상세 편집 모드로
          setShowAllPreview(false);
          return next;
        });
        onSuccess('ok');
      };
      reader.readAsDataURL(file);
    },
  };

  // 드래그 정렬
  const onDragEnd = result => {
    if (!result.destination) return;
    const a = Array.from(blocks);
    const [m] = a.splice(result.source.index, 1);
    a.splice(result.destination.index, 0, m);
    setBlocks(a);
    requestAnimationFrame(() => {
      draggingRef.current = false;
    });
  };

  // 매핑
  const [addingMode, setAddingMode] = useState(false);
  const [addType, setAddType] = useState(null); // 'link' | 'coupon'
  const [pendingRegion, setPendingRegion] = useState(null);
  const [dragStartPos, setDragStart] = useState(null);
  const [dragCurrent, setDragCurrent] = useState(null);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [mapForm] = Form.useForm();

  const selectedBlock = blocks.find(b => b.id === selectedId);

  const onMouseDown = e => {
    if (!imgRef.current) return;
    const { left, top } = imgRef.current.getBoundingClientRect();
    setDragStart({ x: e.clientX - left, y: e.clientY - top });
    setDragCurrent({ x: e.clientX - left, y: e.clientY - top });
  };
  const onMouseMove = e => {
    if (!dragStartPos) return;
    const { left, top } = imgRef.current.getBoundingClientRect();
    setDragCurrent({ x: e.clientX - left, y: e.clientY - top });
  };
  const onMouseUp = () => {
    if (!dragStartPos) {
      setDragStart(null);
      return;
    }
    const { clientWidth: W, clientHeight: H } = imgRef.current;
    const x = Math.min(dragStartPos.x, dragCurrent.x);
    const y = Math.min(dragStartPos.y, dragCurrent.y);
    const w = Math.abs(dragCurrent.x - dragStartPos.x);
    const h = Math.abs(dragCurrent.y - dragStartPos.y);
    const region = {
      id: Date.now().toString(),
      xRatio: x / W,
      yRatio: y / H,
      wRatio: w / W,
      hRatio: h / H,
    };
    setPendingRegion(region);
    setMapModalVisible(true);
    setDragStart(null);
    setDragCurrent(null);
  };

  const saveRegion = () => {
    if (!pendingRegion) return;
    const vals = mapForm.getFieldsValue();
    const updated = { ...pendingRegion };
    if (addType === 'link') {
      let href = (vals.href || '').trim();
      if (!href) return msgApi.error('URL을 입력하세요.');
      if (!/^https?:\/\//.test(href)) href = 'https://' + href;
      updated.href = href;
      delete updated.coupon;
    } else {
      const coupon = (vals.coupon || []).join(',');
      if (!coupon) return msgApi.error('쿠폰을 선택하거나 입력하세요.');
      updated.coupon = coupon;
      delete updated.href;
    }
    setBlocks(prev =>
      prev.map(b =>
        b.id === selectedId && b.type === 'image'
          ? { ...b, regions: [...(b.regions || []), updated] }
          : b
      )
    );
    setMapModalVisible(false);
    setPendingRegion(null);
    setAddingMode(false);
    setAddType(null);
    mapForm.resetFields();
  };

  // 영역 편집/삭제
  const [editingRegion, setEditingRegion] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();

  const openEditRegion = r => {
    setEditingRegion(r);
    setEditModalVisible(true);
    if (r.coupon) editForm.setFieldsValue({ coupon: r.coupon.split(',') });
    else editForm.setFieldsValue({ href: r.href });
  };
  const applyEditRegion = () => {
    const vals = editForm.getFieldsValue();
    setBlocks(prev =>
      prev.map(b => {
        if (b.id !== selectedId || b.type !== 'image') return b;
        const regions = (b.regions || []).map(r => {
          if (r.id !== editingRegion.id) return r;
          if (r.coupon != null) {
            const coupon = (vals.coupon || []).join(',');
            return { ...r, coupon, href: undefined };
          } else {
            let href = (vals.href || '').trim();
            if (!/^https?:\/\//.test(href)) href = 'https://' + href;
            return { ...r, href, coupon: undefined };
          }
        });
        return { ...b, regions };
      })
    );
    setEditModalVisible(false);
    setEditingRegion(null);
  };
  const deleteRegion = () => {
    setBlocks(prev =>
      prev.map(b => {
        if (b.id !== selectedId || b.type !== 'image') return b;
        const regions = (b.regions || []).filter(r => r.id !== editingRegion.id);
        return { ...b, regions };
      })
    );
    setEditModalVisible(false);
    setEditingRegion(null);
  };

  // 카테고리/레이아웃
  const [allCats, setAllCats] = useState([]);
  useEffect(() => {
    if (!mallId) return;
    api
      .get(`/api/${mallId}/categories/all`)
      .then(res => setAllCats(res.data))
      .catch(() => msgApi.error('카테고리 불러오기 실패'));
  }, [mallId, msgApi]);

  const [singleRoot, setSingleRoot] = useState(null);
  const [singleSub, setSingleSub] = useState(null);
  const [gridSize, setGridSize] = useState(2);
  const [layoutType, setLayoutType] = useState(null);

  const roots = allCats.filter(c => c.category_depth === 1);
  const subs = allCats.filter(c => c.category_depth === 2 && String(c.parent_category_no) === singleRoot);

  // 등록 방식
  const [registerMode, setRegisterMode] = useState('category');
  const [directProducts, setDirectProducts] = useState([]);
  const [tabDirectProducts, setTabDirectProducts] = useState({});
  const [initialSelected, setInitialSelected] = useState([]);

  // 탭
  const [tabs, setTabs] = useState([
    { title: '', root: null, sub: null },
    { title: '', root: null, sub: null },
  ]);
  const [activeColor, setActiveColor] = useState('#fe6326');
  const addTab = () => {
    if (tabs.length >= 4) return;
    setTabs(ts => [...ts, { title: '', root: null, sub: null }]);
  };
  const updateTab = (i, key, val) => {
    setTabs(ts => {
      const a = [...ts];
      a[i] = { ...a[i], [key]: val, ...(key === 'root' ? { sub: null } : {}) };
      return a;
    });
  };

  // 탭 삭제 (3개 이상일 때 허용)
  const deleteTab = (index) => {
    setTabs(prevTabs => {
      if (prevTabs.length <= 2) {
        msgApi.info('탭은 최소 2개 이상이어야 합니다.');
        return prevTabs;
      }
      const newTabs = prevTabs.filter((_, i) => i !== index);
      // reindex tabDirectProducts
      setTabDirectProducts(prev => {
        const next = {};
        const remainingIndices = prevTabs.map((_, i) => i).filter(i => i !== index);
        remainingIndices.forEach((oldIdx, newIdx) => {
          next[newIdx] = prev[oldIdx] || [];
        });
        return next;
      });
      return newTabs;
    });
  };

  // 쿠폰 목록
  const [couponOptions, setCouponOptions] = useState([]);
  useEffect(() => {
    if (!mallId) return;
    api
      .get(`/api/${mallId}/coupons`)
      .then(res =>
        setCouponOptions(
          res.data.map(c => ({
            value: c.coupon_no,
            label: `${c.coupon_name} (${c.benefit_percentage}%)`,
          }))
        )
      )
      .catch(() => msgApi.error('쿠폰 불러오기 실패'));
  }, [mallId, msgApi]);

  const tagRender = ({ label, closable, onClose }) => (
    <Tag closable={closable} onClose={onClose} style={{ marginRight: 3 }}>
      {String(label).length > 6 ? String(label).slice(0, 6) + '…' : label}
    </Tag>
  );

  // MorePrd 모달
  const [morePrdVisible, setMorePrdVisible] = useState(false);
  const [morePrdTarget, setMorePrdTarget] = useState('direct'); // 'direct' | 'tab'
  const [morePrdTabIndex, setMorePrdTabIndex] = useState(0);
  const openMorePrd = (target, tabIndex = 0) => {
    setMorePrdTarget(target);
    setInitialSelected(
      target === 'direct'
        ? directProducts.map(p => p.product_no)
        : (tabDirectProducts[tabIndex] || []).map(p => p.product_no)
    );
    setMorePrdTabIndex(tabIndex);
    setMorePrdVisible(true);
  };

  // 유튜브 모달
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [videoForm] = Form.useForm();

  // 텍스트 모달
  const [textModalVisible, setTextModalVisible] = useState(false);
  const [textForm] = Form.useForm();

  const openCreateText = () => {
    // 이미지가 하나도 없으면 제한
    const hasImage = blocks.some(b => b.type === 'image');
    if (!hasImage) {
      msgApi.info('이미지 추가 후 이용 가능');
      return;
    }
    setSelectedId(null);
    textForm.resetFields();
    setTextModalVisible(true);
    setShowAllPreview(false);
  };

  const openEditText = block => {
    textForm.setFieldsValue({
      text: block.text || '',
      fontSize: block.style?.fontSize || 18,
      fontWeight: block.style?.fontWeight || 'normal',
      color: block.style?.color || '#333333',
      align: block.style?.align || 'center',
      mt: block.style?.mt ?? 16,
      mb: block.style?.mb ?? 16,
    });
    setTextModalVisible(true);
  };

  const submitText = () => {
    const { text, fontSize = 18, fontWeight = 'normal', color = '#333333', align = 'center', mt = 16, mb = 16 } =
      textForm.getFieldsValue();
    if (!text || !String(text).trim()) {
      msgApi.warning('문구를 입력하세요.');
      return;
    }
    const selectedBlock = blocks.find(b => b.id === selectedId);
    if (selectedBlock?.type === 'text') {
      setBlocks(prev =>
        prev.map(b =>
          b.id === selectedBlock.id
            ? { ...b, text, style: { fontSize: Number(fontSize), fontWeight, color, align, mt: Number(mt), mb: Number(mb) } }
            : b
        )
      );
    } else {
      const id = Date.now().toString() + Math.random();
      setBlocks(prev => [
        ...prev,
        {
          id,
          type: 'text',
          text,
          style: { fontSize: Number(fontSize), fontWeight, color, align, mt: Number(mt), mb: Number(mb) },
        },
      ]);
      setSelectedId(id);
    }
    setTextModalVisible(false);
  };

  // registerMode 변경 핸들러: 'none' 선택시 관련 상태 초기화 및 UI 비노출 보장
  const handleRegisterModeChange = (val) => {
    setRegisterMode(val);
    if (val === 'none') {
      setLayoutType(null);
      setDirectProducts([]);
      setTabDirectProducts({});
      setTabs([{ title: '', root: null, sub: null }, { title: '', root: null, sub: null }]);
      setSingleRoot(null);
      setSingleSub(null);
      setActiveColor('#fe6326');
    }
  };

  // 등록
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async () => {
    // mallId 체크: 없으면 바로 차단
    if (!mallId) {
      msgApi.error('쇼핑몰 ID(mallId)가 설정되어 있지 않습니다. 앱 설치 또는 URL의 mall_id 파라미터를 확인하세요.');
      return;
    }

    if (submitting) return;
    setSubmitting(true);
    try {
      // 이미지 업로드
      const uploaded = await Promise.all(
        blocks.map(async b => {
          if (b.type === 'image' && b.file) {
            const form = new FormData();
            form.append('file', b.file);
            const { data } = await api.post(`/api/${mallId}/uploads/image`, form, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            return { ...b, src: data.url, file: undefined };
          }
          return b;
        })
      );

      // 서버 payload
      const blocksPayload = uploaded.map(b => {
        if (b.type === 'video') {
          return { _id: b.id, type: 'video', youtubeId: b.youtubeId, ratio: b.ratio || { w: 16, h: 9 }, autoplay: !!b.autoplay };
        }
        if (b.type === 'text') {
          return { _id: b.id, type: 'text', text: b.text, style: b.style || {} };
        }
        return {
          _id: b.id,
          type: 'image',
          src: b.src,
          regions: (b.regions || []).map(r => ({
            _id: r.id,
            xRatio: r.xRatio,
            yRatio: r.yRatio,
            wRatio: r.wRatio,
            hRatio: r.hRatio,
            href: r.href,
            coupon: r.coupon,
          })),
        };
      });

      const imageOnly = blocksPayload.filter(b => b.type === 'image');

      const payload = {
        title,
        content: {
          images: imageOnly.map(i => i.src),
          blocks: blocksPayload,
          gridSize,
          layoutType,
          classification: { registerMode },
        },
        images: imageOnly.map(i => ({ _id: i._id, src: i.src, regions: i.regions })), // 하위호환
        gridSize,
        layoutType,
        classification: {
          ...(layoutType === 'single' ? { root: singleRoot, sub: singleSub } : { tabs, activeColor }),
          registerMode,
          ...(registerMode === 'direct' ? { directProducts, tabDirectProducts } : {}),
        },
      };

      const res = await api.post(`/api/${mallId}/events`, payload);
      const eventId = res.data?._id;
      if (eventId) {
        msgApi.success('이벤트 생성 완료');
        navigate(`/event/detail/${eventId}`);
      } else {
        msgApi.error('이벤트 ID를 찾을 수 없습니다.');
      }
    } catch (e) {
      console.error(e);
      msgApi.error('게시판 생성 갯수 초과 최대 10개까지의 게시판물만 등록이 가능합니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 상품 그리드 헬퍼
  function renderGrid(cols) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols},1fr)`,
          gap: 10,
          maxWidth: 800,
          margin: '24px auto',
        }}
      >
        {Array.from({ length: cols * cols }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 120,
              background: '#f0f0f0',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
            }}
          >
            <BlockOutlined style={{ fontSize: 30 }} />
          </div>
        ))}
      </div>
    );
  }

  // helper: 유튜브 iframe query string (autoplay 처리, autoplay면 mute=1 추가)
  const buildYouTubeSrc = (id, autoplay) => {
    const params = new URLSearchParams();
    if (autoplay) {
      params.set('autoplay', '1');
      params.set('mute', '1'); // 모바일 자동재생을 위해 mute
      params.set('playsinline', '1');
    }
    params.set('rel', '0');
    params.set('modestbranding', '1');
    const q = params.toString();
    return `https://www.youtube.com/embed/${id}${q ? '?' + q : ''}`;
  };

  return (
    <>
      {msgCtx}
      <Card
        title="이벤트 만들기 & 영역 매핑"
        className="event-create-card"
        style={{ width: '100%', margin: '0 auto', padding: isMobile ? 8 : 24 }}
      >
        <Steps current={current} size={isMobile ? 'small' : 'default'} direction={isMobile ? 'vertical' : 'horizontal'} style={{ marginBottom: 24 }}>
          <Step title="제목 입력" />
          <Step title="이미지 업로드" />
          <Step title="상품등록 방식 설정" />
          <Step title="확인 & 등록" />
        </Steps>

        {/* Step 1 */}
        {current === 0 && (
          <Input ref={titleRef} placeholder="이벤트 제목을 입력하세요" value={title} onChange={e => setTitle(e.target.value)} />
        )}

        {/* Step 2 */}
        {current === 1 && (
          <>
            <Upload.Dragger {...uploadProps} className="dragger" style={{ padding: isMobile ? 12 : 24, width: '100%' }}>
              <p><InboxOutlined style={{ fontSize: 24 }} /></p>
              <p>이미지를 드래그 또는 클릭하여 업로드</p>
            </Upload.Dragger>

            {/* 컨트롤 */}
            <Space style={{ margin: '12px 0' }} wrap>
              <Button
                icon={<LinkOutlined />}
                type={addingMode && addType === 'link' ? 'primary' : 'default'}
                onClick={() => {
                  const hasImage = blocks.some(b => b.type === 'image');
                  if (!hasImage) { msgApi.info('이미지 추가 후 이용 가능'); return; }
                  if (showAllPreview) { msgApi.info('추가하실 썸네일은 선택해주세요'); return; }
                  if (!selectedBlock) { msgApi.info('추가하실 썸네일은 선택해주세요'); return; }
                  if (selectedBlock.type !== 'image') { msgApi.info('이미지에서만 영역 매핑이 가능합니다.'); return; }
                  setAddType('link'); setAddingMode(true);
                }}
              >
                URL 추가
              </Button>
              <Button
                icon={<TagOutlined />}
                type={addingMode && addType === 'coupon' ? 'primary' : 'default'}
                onClick={() => {
                  const hasImage = blocks.some(b => b.type === 'image');
                  if (!hasImage) { msgApi.info('이미지 추가 후 이용 가능'); return; }
                  if (showAllPreview) { msgApi.info('추가하실 썸네일은 선택해주세요'); return; }
                  if (!selectedBlock) { msgApi.info('추가하실 썸네일은 선택해주세요'); return; }
                  if (selectedBlock.type !== 'image') { msgApi.info('이미지에서만 영역 매핑이 가능합니다.'); return; }
                  setAddType('coupon'); setAddingMode(true);
                }}
              >
                쿠폰 추가
              </Button>
              <Button
                icon={<YoutubeOutlined />}
                onClick={() => { setVideoModalVisible(true); setShowAllPreview(false); }}
              >
                YouTube 추가
              </Button>
              <Button
                icon={<FontSizeOutlined />}
                onClick={openCreateText}
              >
                텍스트 추가
              </Button>

              {/* 전체 보기 토글 - 주황색 강조 / 이미지 없으면 안내 */}
              <Button
                style={{
                  marginLeft: 8,
                  background: showAllPreview ? '#fe6326' : undefined,
                  color: showAllPreview ? '#fff' : undefined,
                  borderColor: showAllPreview ? '#fe6326' : undefined,
                }}
                onClick={() => {
                  const hasImage = blocks.some(b => b.type === 'image');
                  if (!hasImage) { msgApi.info('이미지 추가 후 이용 가능'); return; }
                  setShowAllPreview(prev => !prev);
                }}
              >
                전체보기
              </Button>
            </Space>

            {/* 썸네일 */}
            {blocks.length > 0 && (
              <DragDropContext
                onDragStart={() => { draggingRef.current = true; }}
                onDragEnd={onDragEnd}
              >
                <Droppable droppableId="thumbs" direction="horizontal">
                  {(prov) => (
                    <div ref={prov.innerRef} {...prov.droppableProps} className="thumb-list">
                      {blocks.map((b, idx) => (
                        <Draggable key={b.id} draggableId={b.id} index={idx}>
                          {(p, snapshot) => (
                            <div
                              ref={p.innerRef}
                              {...p.draggableProps}
                              {...p.dragHandleProps}
                              className={`thumb-item ${b.id === selectedId ? 'active' : ''}`}
                              onPointerUp={() => {
                                if (draggingRef.current) return;
                                // 썸네일 클릭 시 전체보기 해제 + 편집 모드 전환
                                if (showAllPreview) setShowAllPreview(false);
                                setSelectedId(b.id);
                              }}
                              style={getItemStyle(snapshot.isDragging, p.draggableProps.style)}
                            >
                              {b.type === 'video' ? (
                                <img src={`https://img.youtube.com/vi/${b.youtubeId}/hqdefault.jpg`} alt="" />
                              ) : b.type === 'text' ? (
                                <div
                                  title="텍스트 블록"
                                  style={{
                                    width:'100%', height:'100%',
                                    display:'flex', alignItems:'center', justifyContent:'center',
                                    background:'#f5f5f5', color:'#888', fontSize:24, fontWeight:700,
                                    borderRadius:4,
                                  }}
                                >
                                  Tt
                                </div>
                              ) : (
                                <img src={b.src} alt="" />
                              )}

                              <DeleteOutlined
                                className="thumb-delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setBlocks(prev => prev.filter(x => x.id !== b.id));
                                  if (selectedId === b.id) setSelectedId(null);
                                }}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {prov.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}

            {/* 프리뷰 */}
            <div style={{ width: '100%', marginTop: 16, textAlign: 'center' }}>
              {showAllPreview ? (
                // 전체 보기
                <div style={{ display: 'grid', gap: 0, maxWidth: 800, margin: '0 auto' }}>
                  {blocks.map(b =>
                    b.type === 'video' ? (
                      <div key={b.id} style={{ width: '100%' }}>
                        <div style={{ position: 'relative', width: '100%', aspectRatio: `${b.ratio?.w || 16} / ${b.ratio?.h || 9}` }}>
                          <iframe
                            src={buildYouTubeSrc(b.youtubeId, b.autoplay)}
                            title="YouTube"
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        </div>
                      </div>
                    ) : b.type === 'text' ? (
                      <div key={b.id} style={{ textAlign: b.style?.align || 'center', marginTop: b.style?.mt ?? 16, marginBottom: b.style?.mb ?? 16 }}>
                        <div
                          style={{ fontSize: b.style?.fontSize || 18, fontWeight: b.style?.fontWeight || 'normal', color: b.style?.color || '#333' }}
                          dangerouslySetInnerHTML={{ __html: escapeHtml(b.text).replace(/\n/g, '<br/>') }}
                        />
                      </div>
                    ) : (
                      <img key={b.id} src={b.src} alt="" style={{ width: '100%', maxWidth: 800, margin: '0 auto' }} />
                    )
                  )}
                </div>
              ) : (
                // 상세 편집
                <>
                  {selectedBlock?.type === 'image' && (
                    <div
                      ref={imgRef}
                      onMouseDown={addingMode ? onMouseDown : undefined}
                      onMouseMove={addingMode ? onMouseMove : undefined}
                      onMouseUp={addingMode ? onMouseUp : undefined}
                      style={{
                        position: 'relative',
                        display: 'inline-block',
                        maxWidth: 800,
                        width: '100%',
                        cursor: addingMode ? 'crosshair' : 'default',
                      }}
                    >
                      <img src={selectedBlock.src} alt="" style={{ width: '100%', userSelect: 'none' }} draggable={false} />
                      {dragStartPos && dragCurrent && (
                        <div
                          style={{
                            position: 'absolute',
                            left: Math.min(dragStartPos.x, dragCurrent.x),
                            top: Math.min(dragStartPos.y, dragCurrent.y),
                            width: Math.abs(dragCurrent.x - dragStartPos.x),
                            height: Math.abs(dragCurrent.y - dragStartPos.y),
                            border: '1px dashed #999',
                            background: 'rgba(200,200,200,0.2)',
                          }}
                        />
                      )}
                      {(selectedBlock.regions || []).map(r => {
                        const base = {
                          position: 'absolute',
                          left: `${(r.xRatio * 100).toFixed(2)}%`,
                          top: `${(r.yRatio * 100).toFixed(2)}%`,
                          width: `${(r.wRatio * 100).toFixed(2)}%`,
                          height: `${(r.hRatio * 100).toFixed(2)}%`,
                          cursor: 'pointer',
                        };
                        const style = r.coupon
                          ? { ...base, border: '2px dashed #ff6347', background: 'rgba(255,99,71,0.2)' }
                          : { ...base, border: '2px dashed #1890ff', background: 'rgba(24,144,255,0.2)' };
                        return r.coupon ? (
                          <button key={r.id} style={style} onClick={e => { e.stopPropagation(); openEditRegion(r); }} />
                        ) : (
                          <a
                            key={r.id}
                            style={style}
                            onClick={e => { e.preventDefault(); e.stopPropagation(); openEditRegion(r); }}
                          />
                        );
                      })}
                    </div>
                  )}

                  {selectedBlock?.type === 'video' && (
                    <div style={{ maxWidth: 800, width: '100%', margin: '0 auto' }}>
                      <div style={{ position: 'relative', width: '100%', aspectRatio: `${selectedBlock.ratio?.w || 16} / ${selectedBlock.ratio?.h || 9}` }}>
                        <iframe
                          src={buildYouTubeSrc(selectedBlock.youtubeId, selectedBlock.autoplay)}
                          title="YouTube video"
                          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      </div>
                      {/* autoplay 즉시 반영 체크박스 */}
                      <div style={{ marginTop: 8 }}>
                        <label style={{ marginRight: 12 }}>
                          <input
                            type="checkbox"
                            checked={!!selectedBlock.autoplay}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setBlocks(prev =>
                                prev.map(b => b.id === selectedBlock.id ? { ...b, autoplay: checked } : b)
                              );
                            }}
                          />
                          <span style={{ marginLeft: 6 }}>자동 재생 (모바일의 경우 음소거처리됩니다)</span>
                        </label>
                      </div>

                      {addingMode && <Alert type="info" message="영상에는 매핑을 적용할 수 없습니다." showIcon style={{ marginTop: 8 }} />}
                    </div>
                  )}

                  {selectedBlock?.type === 'text' && (
                    <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
                      <div
                        style={{
                          border: '1px dashed #ccc',
                          padding: 16,
                          background: '#fafafa',
                          marginTop: selectedBlock.style?.mt ?? 16,
                          marginBottom: selectedBlock.style?.mb ?? 16,
                          textAlign: selectedBlock.style?.align || 'center',
                        }}
                      >
                        <div
                          style={{
                            fontSize: selectedBlock.style?.fontSize || 18,
                            fontWeight: selectedBlock.style?.fontWeight || 'normal',
                            color: selectedBlock.style?.color || '#333',
                          }}
                          dangerouslySetInnerHTML={{ __html: escapeHtml(selectedBlock.text).replace(/\n/g, '<br/>') }}
                        />
                      </div>
                      <Button onClick={() => openEditText(selectedBlock)}>텍스트 편집</Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* Step 3 */}
        {current === 2 && (
          <div style={{ maxWidth: 400 }}>
            <h4>상품 등록 방식</h4>
            <Segmented
              options={[
                { label: '카테고리 상품 등록', value: 'category' },
                { label: '직접 상품 등록', value: 'direct' },
                { label: '노출안함', value: 'none' },
              ]}
              value={registerMode}
              onChange={handleRegisterModeChange}
              block
              style={{ marginBottom: 24 }}
            />

            {/* 카테고리 */}
            {registerMode === 'category' && (
              <>
                <h4>그리드 사이즈</h4>
                <Space>
                  {[2, 3, 4].map(n => (
                    <Button key={n} type={gridSize === n ? 'primary' : 'default'} onClick={() => setGridSize(n)}>
                      {n}×{n}
                    </Button>
                  ))}
                </Space>

                <h4 style={{ margin: '16px 0' }}>노출 방식</h4>
                <Segmented
                  options={[
                    { label: '단품상품', value: 'single' },
                    { label: '탭상품', value: 'tabs' },
                  ]}
                  value={layoutType}
                  onChange={val => {
                    setLayoutType(val);
                    setSingleRoot(null);
                    setSingleSub(null);
                    setTabs([{ title: '', root: null, sub: null }, { title: '', root: null, sub: null }]);
                    setActiveColor('#fe6326');
                  }}
                  block
                />

                {layoutType === 'single' && (
                  <Space style={{ marginTop: 24 }}>
                    <Select placeholder="대분류" style={{ width: 180 }} value={singleRoot} onChange={setSingleRoot}>
                      {roots.map(r => (
                        <Select.Option key={r.category_no} value={String(r.category_no)}>
                          {r.category_name}
                        </Select.Option>
                      ))}
                    </Select>
                    <Select placeholder="소분류" style={{ width: 180 }} value={singleSub} onChange={setSingleSub}>
                      {subs.map(s => (
                        <Select.Option key={s.category_no} value={String(s.category_no)}>
                          {s.category_name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Space>
                )}

                {layoutType === 'tabs' && (
                  <>
                    {tabs.map((t, i) => (
                      <Space key={i} size="middle" style={{ marginTop: 16 }}>
                        <Input
                          placeholder={`탭 ${i + 1} 제목`}
                          style={{ width: 120 }}
                          value={t.title}
                          onChange={e => updateTab(i, 'title', e.target.value)}
                        />
                        <Select placeholder="대분류" style={{ width: 140 }} value={t.root} onChange={v => updateTab(i, 'root', v)}>
                          {roots.map(r => (
                            <Select.Option key={r.category_no} value={String(r.category_no)}>
                              {r.category_name}
                            </Select.Option>
                          ))}
                        </Select>
                        <Select placeholder="소분류" style={{ width: 140 }} value={t.sub} onChange={v => updateTab(i, 'sub', v)}>
                          {allCats
                            .filter(c => c.category_depth === 2 && String(c.parent_category_no) === t.root)
                            .map(s => (
                              <Select.Option key={s.category_no} value={String(s.category_no)}>
                                {s.category_name}
                              </Select.Option>
                            ))}
                        </Select>

                        {/* 탭이 3개 이상일 때 삭제 버튼 노출 */}
                        {tabs.length > 2 && (
                          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => deleteTab(i)} />
                        )}
                      </Space>
                    ))}
                    <Button type="dashed" block style={{ marginTop: 16 }} onClick={addTab} disabled={tabs.length >= 4}>
                      + 탭 추가
                    </Button>
                    <Space style={{ marginTop: 12, alignItems: 'center' }}>
                      <span>활성 탭 색:</span>
                      <Input
                        type="color"
                        value={activeColor}
                        onChange={e => setActiveColor(e.target.value)}
                        style={{ width: 32, height: 32, padding: 0, border: 'none' }}
                      />
                    </Space>
                  </>
                )}
              </>
            )}

            {/* 직접 등록 */}
            {registerMode === 'direct' && (
              <>
                <h4>그리드 사이즈</h4>
                <Space>
                  {[2, 3, 4].map(n => (
                    <Button key={n} type={gridSize === n ? 'primary' : 'default'} onClick={() => setGridSize(n)}>
                      {n}×{n}
                    </Button>
                  ))}
                </Space>

                <h4 style={{ margin: '16px 0' }}>노출 방식</h4>
                <Segmented
                  options={[
                    { label: '단품상품', value: 'single' },
                    { label: '탭상품', value: 'tabs' },
                  ]}
                  value={layoutType}
                  onChange={val => {
                    setLayoutType(val);
                    setTabs([{ title: '', root: null, sub: null }, { title: '', root: null, sub: null }]);
                  }}
                  block
                />

                {layoutType === 'single' && (
                  <Button
                    type={directProducts.length > 0 ? 'primary' : 'dashed'}
                    onClick={() => openMorePrd('direct')}
                    style={{ marginTop: 16 }}
                  >
                    {directProducts.length ? `상품 ${directProducts.length}개 등록됨` : '상품 직접 등록'}
                  </Button>
                )}

                {layoutType === 'tabs' && (
                  <>
                    {tabs.map((t, i) => (
                      <Space key={i} size="middle" style={{ marginTop: 16 }}>
                        <Input
                          placeholder={`탭 ${i + 1} 제목`}
                          style={{ width: 120 }}
                          value={t.title}
                          onChange={e => updateTab(i, 'title', e.target.value)}
                        />
                        <Button
                          type={(tabDirectProducts[i] || []).length > 0 ? 'primary' : 'default'}
                          onClick={() => openMorePrd('tab', i)}
                        >
                          {(tabDirectProducts[i] || []).length
                            ? `상품 ${(tabDirectProducts[i] || []).length}개 등록됨`
                            : '상품 직접 등록'}
                        </Button>

                        {/* 탭이 3개 이상일 때 삭제 버튼 노출 */}
                        {tabs.length > 2 && (
                          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => deleteTab(i)} />
                        )}
                      </Space>
                    ))}
                    <Button type="dashed" block style={{ marginTop: 16 }} onClick={addTab} disabled={tabs.length >= 4}>
                      + 탭 추가
                    </Button>
                    <Space style={{ marginTop: 12, alignItems: 'center' }}>
                      <span>활성 탭 색:</span>
                      <Input
                        type="color"
                        value={activeColor}
                        onChange={e => setActiveColor(e.target.value)}
                        style={{ width: 32, height: 32, padding: 0, border: 'none' }}
                      />
                    </Space>
                  </>
                )}
              </>
            )}

            {registerMode === 'none' && (
              <div style={{ textAlign: 'left', color: '#fe6326', padding: 5 }}>상품을 노출하지 않습니다.</div>
            )}
          </div>
        )}

        {/* Step 4 */}
        {current === 3 && (
          <div style={{ marginTop: 24 }}>
            <h4>미리보기</h4>
            <div style={{ display: 'grid', gap: 0, maxWidth: 800, margin: '0 auto' }}>
              {blocks.map(b =>
                b.type === 'video' ? (
                  <div key={b.id} style={{ width: '100%' }}>
                    <div style={{ position: 'relative', width: '100%', aspectRatio: `${b.ratio?.w || 16} / ${b.ratio?.h || 9}` }}>
                      <iframe
                        src={buildYouTubeSrc(b.youtubeId, b.autoplay)}
                        title="YouTube preview"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  </div>
                ) : b.type === 'text' ? (
                  <div key={b.id} style={{ textAlign: b.style?.align || 'center', marginTop: b.style?.mt ?? 16, marginBottom: b.style?.mb ?? 16 }}>
                    <div
                      style={{ fontSize: b.style?.fontSize || 18, fontWeight: b.style?.fontWeight || 'normal', color: b.style?.color || '#333' }}
                      dangerouslySetInnerHTML={{ __html: escapeHtml(b.text).replace(/\n/g, '<br/>') }}
                    />
                  </div>
                ) : (
                  <img key={b.id} src={b.src} alt="미리보기" style={{ width: '100%' }} />
                )
              )}
            </div>

            {/* registerMode === 'none' 인 경우 상품관련 미리보기/그리드 숨김 */}
            {registerMode !== 'none' && layoutType === 'single' && <div style={{ marginTop: 24 }}>{renderGrid(gridSize)}</div>}
            {registerMode !== 'none' && layoutType === 'tabs' && (
              <div style={{ margin: '24px auto', maxWidth: 800 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  {tabs.map((t, i) => (
                    <Button key={i} style={{ flex: 1, background: i === 0 ? activeColor : undefined, color: i === 0 ? '#fff' : undefined }}>
                      {t.title || `탭${i + 1}`}
                    </Button>
                  ))}
                </div>
                {renderGrid(gridSize)}
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <Button
                type="primary"
                size="large"
                onClick={handleSubmit}
                block={isMobile}
                loading={submitting}
                disabled={submitting || !mallId}
                title={!mallId ? 'mall_id가 없으면 등록할 수 없습니다.' : undefined}
              >
                이벤트 등록
              </Button>
            </div>
          </div>
        )}

        {/* Prev/Next */}
        <Space direction={isMobile ? 'vertical' : 'horizontal'} style={{ marginTop: 24, width: '100%', justifyContent: 'space-between' }}>
          {current > 0 && <Button onClick={prev} block={isMobile}>이전</Button>}
          {current < 3 && <Button type="primary" onClick={next} block={isMobile}>다음</Button>}
        </Space>
      </Card>

      {/* 매핑 추가 모달 */}
      <Modal
        open={mapModalVisible}
        title={addType === 'link' ? 'URL 영역 설정' : '쿠폰 영역 설정'}
        onCancel={() => {
          setMapModalVisible(false);
          setPendingRegion(null);
          setAddingMode(false);
          setAddType(null);
          mapForm.resetFields();
        }}
        onOk={saveRegion}
        okText="적용"
        width={isMobile ? '90%' : 600}
      >
        <Form form={mapForm} layout="vertical">
          {addType === 'link' ? (
            <Form.Item name="href" label="URL" rules={[{ required: true, message: 'URL을 입력해주세요.' }]}>
              <Input placeholder="https://example.com" />
            </Form.Item>
          ) : (
            <Form.Item name="coupon" label="쿠폰 선택 혹은 번호 입력" rules={[{ required: true, message: '쿠폰을 하나 이상 선택/입력하세요.' }]}>
              <Select mode="tags" options={couponOptions} tokenSeparators={[',']} tagRender={tagRender} placeholder="쿠폰 선택 또는 번호 입력" />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* 매핑 편집 모달 */}
      <Modal
        open={editModalVisible}
        title="영역 편집"
        onCancel={() => {
          setEditModalVisible(false);
          setEditingRegion(null);
        }}
        footer={[
          <Button key="del" danger onClick={deleteRegion}>삭제</Button>,
          <Button key="cancel" onClick={() => setEditModalVisible(false)}>취소</Button>,
          <Button key="ok" type="primary" onClick={applyEditRegion}>적용</Button>,
        ]}
        width={isMobile ? '90%' : 600}
      >
        <Form form={editForm} layout="vertical">
          {editingRegion?.coupon ? (
            <Form.Item name="coupon" label="쿠폰 선택 혹은 번호 입력" rules={[{ required: true, message: '쿠폰을 하나 이상 선택/입력하세요.' }]}>
              <Select mode="tags" options={couponOptions} tokenSeparators={[',']} tagRender={tagRender} />
            </Form.Item>
          ) : (
            <Form.Item name="href" label="URL" rules={[{ required: true, message: 'URL을 입력하세요.' }]}>
              <Input placeholder="https://example.com" />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* YouTube 모달 */}
      <Modal
        open={videoModalVisible}
        title="YouTube 영상 추가"
        onCancel={() => {
          setVideoModalVisible(false);
          videoForm.resetFields();
        }}
        onOk={() => {
          const { urlOrId, aspectW = 16, aspectH = 9, autoplay = false } = videoForm.getFieldsValue();
          const vid = getYouTubeId(urlOrId);
          if (!vid) return msgApi.error('유효한 YouTube 링크/ID가 아닙니다.');
          const id = Date.now().toString() + Math.random();
          setBlocks(prev => [...prev, { id, type: 'video', youtubeId: vid, ratio: { w: Number(aspectW) || 16, h: Number(aspectH) || 9 }, autoplay: !!autoplay }]);
          setSelectedId(id);
          setShowAllPreview(false);
          setVideoModalVisible(false);
          videoForm.resetFields();
        }}
        width={isMobile ? '90%' : 520}
      >
        <Form form={videoForm} layout="vertical" initialValues={{ aspectW: 16, aspectH: 9, autoplay: false }}>
          <Form.Item name="urlOrId" label="YouTube 링크 또는 영상 ID" rules={[{ required: true, message: 'YouTube 링크/ID를 입력하세요.' }]}>
            <Input placeholder="예: https://youtu.be/XXXXXXXXXXX 또는 영상 ID" />
          </Form.Item>
          <Space>
            <Form.Item name="aspectW" label="비율 W" style={{ marginBottom: 0 }}>
              <Input type="number" min={1} step={1} style={{ width: 100 }} />
            </Form.Item>
            <div style={{ alignSelf: 'end', padding: '0 6px 8px' }}>/</div>
            <Form.Item name="aspectH" label="비율 H" style={{ marginBottom: 0 }}>
              <Input type="number" min={1} step={1} style={{ width: 100 }} />
            </Form.Item>
          </Space>
          <Form.Item name="autoplay" valuePropName="checked" style={{ marginTop: 8 }}>
            <label>
              <input type="checkbox" />
              <span style={{ marginLeft: 8 }}>자동재생 (모바일 자동재생을 위해 음소거 처리됩니다)</span>
            </label>
          </Form.Item>
        </Form>
      </Modal>

      {/* 텍스트 모달 */}
      <Modal
        open={textModalVisible}
        title={selectedBlock?.type === 'text' ? '텍스트 편집' : '텍스트 추가'}
        onCancel={() => setTextModalVisible(false)}
        onOk={submitText}
        okText="적용"
        width={isMobile ? '90%' : 520}
      >
        <Form
          form={textForm}
          layout="vertical"
          initialValues={{ text: '', align: 'center', fontSize: 18, fontWeight: 'normal', color: '#333333', mt: 16, mb: 16 }}
        >
          <Form.Item name="text" label="문구" rules={[{ required: true, message: '문구를 입력해주세요.' }]}>
            <Input.TextArea rows={4} placeholder="문구를 입력하세요. 엔터는 줄바꿈(<br/>)으로 표시됩니다." />
          </Form.Item>
          <Space wrap>
            <Form.Item name="align" label="정렬" style={{ marginBottom: 0 }}>
              <Select style={{ width: 110 }}>
                <Select.Option value="left">왼쪽</Select.Option>
                <Select.Option value="center">가운데</Select.Option>
                <Select.Option value="right">오른쪽</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="fontSize" label="폰트크기" style={{ marginBottom: 0 }}>
              <Input type="number" min={10} max={80} step={1} style={{ width: 110 }} />
            </Form.Item>
            <Form.Item name="fontWeight" label="굵기" style={{ marginBottom: 0 }}>
              <Select style={{ width: 110 }}>
                <Select.Option value="normal">보통</Select.Option>
                <Select.Option value="500">500</Select.Option>
                <Select.Option value="600">600</Select.Option>
                <Select.Option value="bold">bold</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="color" label="색상" style={{ marginBottom: 0 }}>
              <Input type="color" style={{ width: 60, padding: 0, border: 'none', background: 'transparent' }} />
            </Form.Item>
            <Form.Item name="mt" label="위 간격(px)" style={{ marginBottom: 0 }}>
              <Input type="number" min={0} step={1} style={{ width: 120 }} />
            </Form.Item>
            <Form.Item name="mb" label="아래 간격(px)" style={{ marginBottom: 0 }}>
              <Input type="number" min={0} step={1} style={{ width: 120 }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>

      {/* 상품 선택 모달 */}
      {morePrdVisible && (
        <MorePrd
          key={`${morePrdTarget}-${morePrdTabIndex}`}
          visible={morePrdVisible}
          target={morePrdTarget}
          tabIndex={morePrdTabIndex}
          initialSelected={initialSelected}
          onOk={selected => {
            if (morePrdTarget === 'direct') setDirectProducts(selected);
            else setTabDirectProducts(prev => ({ ...prev, [morePrdTabIndex]: selected }));
            setMorePrdVisible(false);
          }}
          onCancel={() => setMorePrdVisible(false)}
        />
      )}
    </>
  );
}
