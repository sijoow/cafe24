// src/pages/EventCreate.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import MorePrd from './MorePrd';
import {
  Card, Input, Button, Select, Space, Upload, Form, message, Segmented, Modal,
  InputNumber, Checkbox, ColorPicker, Alert, Grid, Divider, Tag, Tooltip,
} from 'antd';
import {
  UploadOutlined, DeleteOutlined, LinkOutlined, TagOutlined, VideoCameraAddOutlined,
  EditOutlined, FontSizeOutlined, BlockOutlined, ShoppingCartOutlined, YoutubeOutlined,
  SaveOutlined, PlusOutlined, EyeOutlined, PictureOutlined,
} from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useNavigate } from 'react-router-dom';
import api from '../axios';
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

function renderGrid(cols, products = []) {
  const itemsToRender = products.length > 0 ? products : Array.from({ length: Math.min(cols * cols, 4) });
  const titleFontSize = `${18 - cols}px`;
  const priceFontSize = `${17 - cols}px`;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: 16, maxWidth: 800, margin: '24px auto' }}>
      {itemsToRender.map((p, i) => (
        <div key={p?.product_no || i} style={{ overflow: 'hidden', background: '#fff', borderRadius: '6px' }}>
          <div style={{ aspectRatio: '1 / 1', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa' }}>
            {p?.list_image ? (<img src={p.list_image} alt={p.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />) : (<BlockOutlined style={{ fontSize: 40, color: '#d9d9d9' }} />)}
          </div>
          <div style={{ paddingTop:'10px', minHeight: '90px' }}>
            <div style={{ fontWeight: 500, fontSize: titleFontSize, lineHeight: 1.2 }}>{p?.product_name || `상품명 ${i + 1}`}</div>
            {p?.price != null && (<div style={{ fontWeight: 'bold', fontSize: priceFontSize, marginTop: '4px' }}>{Number(p.price).toLocaleString()}원</div>)}
          </div>
        </div>
      ))}
    </div>
  );
}

const GridPreview = ({ size, active, onClick }) => {
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

function ProductBlockModal({ visible, onCancel, onOk, msgApi, isMobile, allCats, initialData }) {
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

    useEffect(() => {
        if (visible && initialData) {
            setRegisterMode(initialData.registerMode || 'direct');
            setGridSize(initialData.gridSize || 2);
            setLayoutType(initialData.layoutType || 'single');
            if (initialData.registerMode === 'category') {
                if (initialData.layoutType === 'single') { setSingleRoot(initialData.root ? String(initialData.root) : null); setSingleSub(initialData.sub ? String(initialData.sub) : null); }
                else if (initialData.layoutType === 'tabs') { setTabs(initialData.tabs || [{ title: '', root: null, sub: null }, { title: '', root: null, sub: null }]); setActiveColor(initialData.activeColor || '#fe6326'); }
            } else if (initialData.registerMode === 'direct') {
                if (initialData.layoutType === 'single') { setDirectProducts(initialData.directProducts || []); }
                else if (initialData.layoutType === 'tabs') { setTabDirectProducts(initialData.tabDirectProducts || {}); setTabs(initialData.tabs || [{ title: '', root: null, sub: null }, { title: '', root: null, sub: null }]); setActiveColor(initialData.activeColor || '#fe6326'); }
            }
        } else if (visible) { form.resetFields(); setRegisterMode('direct'); setGridSize(2); setLayoutType('single'); setSingleRoot(null); setSingleSub(null); setTabs([{ title: '', root: null, sub: null }, { title: '', root: null, sub: null }]); setActiveColor('#fe6326'); setDirectProducts([]); setTabDirectProducts({}); }
    }, [visible, initialData, form]);

    const handleRegisterModeChange = useCallback((val) => { setRegisterMode(val); setLayoutType('single'); }, []);
    const handleLayoutTypeChange = useCallback((val) => { setLayoutType(val); }, []);
    
    const addTab = useCallback(() => { if (tabs.length < 4) setTabs(ts => [...ts, { title: '', root: null, sub: null }]); }, [tabs.length]);
    const updateTab = useCallback((i, key, val) => { setTabs(ts => { const a = [...ts]; a[i] = { ...a[i], [key]: val, ...(key === 'root' ? { sub: null } : {}) }; return a; }); }, []);
    const removeTab = useCallback((index) => { if (tabs.length > 2) setTabs(prev => prev.filter((_, i) => i !== index)); }, [tabs.length]);
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
        
        const blockData = { id: initialData?.id || Date.now().toString() + Math.random(), type: 'product_group', registerMode, gridSize, layoutType };
        if (registerMode === 'category') {
            if (layoutType === 'single') { blockData.root = singleRoot; blockData.sub = singleSub; }
            else { blockData.tabs = tabs; blockData.activeColor = activeColor; }
        } else if (registerMode === 'direct') {
            if (layoutType === 'single') { blockData.directProducts = directProducts; }
            else { blockData.tabDirectProducts = tabDirectProducts; blockData.tabs = tabs; blockData.activeColor = activeColor; }
        }
        onOk(blockData); 
        onCancel();
    }, [registerMode, gridSize, layoutType, singleRoot, singleSub, tabs, activeColor, directProducts, tabDirectProducts, onOk, onCancel, initialData, msgApi]);

    return (
        <Modal open={visible} title={initialData ? "상품 블록 편집" : "상품 블록 추가"} onCancel={onCancel} onOk={handleOk} okText={initialData ? "수정" : "추가"} cancelText="취소" width={isMobile ? '90%' : 700} destroyOnClose>
            <Form form={form} layout="vertical">
                <h4 style={{ marginTop: 0 }}>1. 상품 등록 방식</h4>
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
                
                <h4>2. 노출 방식</h4>
                <Segmented options={[{ label: '단품', value: 'single' }, { label: '탭', value: 'tabs' }]} value={layoutType} onChange={handleLayoutTypeChange} block />
                <div style={{ marginTop: '8px', color: '#888', fontSize: '12px', minHeight: '32px', marginBottom: '12px' }}>
                    {layoutType === 'single'
                        ? '선택한 상품들을 하나의 목록으로 쭉 나열하여 보여줍니다.'
                        : '여러 개의 탭을 만들어, 각 탭마다 다른 상품 목록을 보여줄 수 있습니다.'
                    }
                </div>

                <h4>3. 세부 설정</h4>
                {registerMode === 'direct' && layoutType === 'single' && (<Button type={directProducts.length > 0 ? 'primary' : 'dashed'} onClick={() => openMorePrd('direct')} style={{ marginTop: 0 }}>{directProducts.length ? `상품 ${directProducts.length}개 등록됨` : '상품 직접 등록'}</Button>)}
                {registerMode === 'direct' && layoutType === 'tabs' && (<>{tabs.map((t, i) => (<div key={i}><Space size="middle" style={{ marginTop: 8, alignItems: 'center' }}><Input placeholder={`탭 ${i + 1} 제목`} style={{ width: 120 }} value={t.title} onChange={e => updateTab(i, 'title', e.target.value)} /><Button type={(tabDirectProducts[i] || []).length > 0 ? 'primary' : 'default'} onClick={() => openMorePrd('tab', i)}>{(tabDirectProducts[i] || []).length ? `상품 ${(tabDirectProducts[i] || []).length}개 등록됨` : '상품 직접 등록'}</Button>{tabs.length > 2 && (<DeleteOutlined onClick={() => removeTab(i)} style={{ cursor: 'pointer', color: '#ff4d4f' }} />)}</Space></div>))}<Button type="dashed" block style={{ marginTop: 16 }} onClick={addTab} disabled={tabs.length >= 4}><PlusOutlined /> 탭 추가</Button><Space style={{ marginTop: 12, alignItems: 'center' }}><span>활성 탭 색:</span><ColorPicker value={activeColor} onChangeComplete={(color) => setActiveColor(color.toHexString())} /></Space><div style={{ marginTop: '8px', color: '#888', fontSize: '12px' }}>원하시는 색상을 선택하여 활성화된 탭의 색상을 변경할 수 있습니다.</div></>)}
                {registerMode === 'category' && layoutType === 'single' && (<Space style={{ marginTop: 0 }}><Select placeholder="대분류" style={{ width: 180 }} value={singleRoot} onChange={setSingleRoot}>{roots.map(r => (<Option key={r.category_no} value={String(r.category_no)}>{r.category_name}</Option>))}</Select><Select placeholder="소분류" style={{ width: 180 }} value={singleSub} onChange={setSingleSub} disabled={!singleRoot}>{allCats.filter(c => c.category_depth === 2 && String(c.parent_category_no) === singleRoot).map(s => (<Option key={s.category_no} value={String(s.category_no)}>{s.category_name}</Option>))}</Select></Space>)}
                {registerMode === 'category' && layoutType === 'tabs' && (<>{tabs.map((t, i) => (<div key={i}><Space size="middle" style={{ marginTop: 8, alignItems: 'center' }}><Input placeholder={`탭 ${i + 1} 제목`} style={{ width: 120 }} value={t.title} onChange={e => updateTab(i, 'title', e.target.value)} /><Select placeholder="대분류" style={{ width: 140 }} value={t.root} onChange={v => updateTab(i, 'root', v)}>{roots.map(r => (<Option key={r.category_no} value={String(r.category_no)}>{r.category_name}</Option>))}</Select><Select placeholder="소분류" style={{ width: 140 }} value={t.sub} onChange={v => updateTab(i, 'sub', v)} disabled={!t.root}>{allCats.filter(c => c.category_depth === 2 && String(c.parent_category_no) === t.root).map(s => (<Option key={s.category_no} value={String(s.category_no)}>{s.category_name}</Option>))}</Select>{tabs.length > 2 && (<DeleteOutlined onClick={() => removeTab(i)} style={{ cursor: 'pointer', color: '#ff4d4f' }}/>)}</Space></div>))}<Button type="dashed" block style={{ marginTop: 16 }} onClick={addTab} disabled={tabs.length >= 4}><PlusOutlined /> 탭 추가</Button><Space style={{ marginTop: 12, alignItems: 'center' }}><span>활성 탭 색:</span><ColorPicker value={activeColor} onChangeComplete={(color) => setActiveColor(color.toHexString())} /></Space><div style={{ marginTop: '8px', color: '#888', fontSize: '12px' }}>원하시는 색상을 선택하여 활성화된 탭의 색상을 변경할 수 있습니다.</div></>)}
                
                <h4 style={{ marginTop: 24 }}>4. 그리드 사이즈</h4>
                <Space style={{ marginBottom: 16 }}>
                    {[2, 3, 4].map(n => (
                        <GridPreview key={n} size={n} active={gridSize === n} onClick={() => setGridSize(n)} />
                    ))}
                </Space>
            </Form>
            {morePrdVisible && <MorePrd visible={morePrdVisible} initialSelected={initialSelected} onOk={handleMorePrdOk} onCancel={() => setMorePrdVisible(false)} />}
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
  
  const [previewActiveTabs, setPreviewActiveTabs] = useState({});
  const [isPreviewMode, setIsPreviewMode] = useState(false); // ✅ 미리보기 모드 상태 추가
  
  const [productBlockModalVisible, setProductBlockModalVisible] = useState(false);
  const [editingProductBlock, setEditingProductBlock] = useState(null);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [textModalVisible, setTextModalVisible] = useState(false);
  
  const [addingMode, setAddingMode] = useState(false);
  const [addType, setAddType] = useState(null);
  const [pendingRegion, setPendingRegion] = useState(null);
  const [dragStartPos, setDragStart] = useState(null);
  const [dragCurrent, setDragCurrent] = useState(null);
  const [editingRegion, setEditingRegion] = useState(null);
  const [notification, setNotification] = useState(null);

  const [mapForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [videoForm] = Form.useForm();
  const [textForm] = Form.useForm();
  const imgRef = useRef(null);
  const couponSelectRef = useRef(null);
  const couponEditSelectRef = useRef(null);

  useEffect(() => {
    if (mallId) {
      api.get(`/api/${mallId}/categories/all`).then(res => setAllCats(res.data)).catch(() => msgApi.error('카테고리 불러오기 실패'));
      api.get(`/api/${mallId}/coupons`).then(res => setCouponOptions(res.data.map(c => ({ value: c.coupon_no, label: `${c.coupon_name} (${c.benefit_percentage}%)` })))).catch(() => msgApi.error('쿠폰 불러오기 실패'));
    }
  }, [mallId, msgApi]);

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

  const onMouseDown = e => { if (!imgRef.current) return; const { left, top } = imgRef.current.getBoundingClientRect(); setDragStart({ x: e.clientX - left, y: e.clientY - top }); setDragCurrent({ x: e.clientX - left, y: e.clientY - top }); };
  const onMouseMove = e => { if (!dragStartPos) return; const { left, top } = imgRef.current.getBoundingClientRect(); setDragCurrent({ x: e.clientX - left, y: e.clientY - top }); };
  const onMouseUp = () => { if (!dragStartPos || !dragCurrent) { setDragStart(null); setDragCurrent(null); return; } const { clientWidth: W, clientHeight: H } = imgRef.current; const x = Math.min(dragStartPos.x, dragCurrent.x); const y = Math.min(dragStartPos.y, dragCurrent.y); const w = Math.abs(dragCurrent.x - dragStartPos.x); const h = Math.abs(dragCurrent.y - dragStartPos.y); if (w < 5 || h < 5) { setDragStart(null); setDragCurrent(null); return; } const region = { id: Date.now().toString(), xRatio: x / W, yRatio: y / H, wRatio: w / W, hRatio: h / H, }; setPendingRegion(region); setMapModalVisible(true); setDragStart(null); setDragCurrent(null); };
  const saveRegion = () => { if (!pendingRegion) return; mapForm.validateFields().then(vals => { const updated = { ...pendingRegion }; if (addType === 'link') { let href = (vals.href || '').trim(); if (!/^https?:\/\//.test(href)) href = 'https://' + href; updated.href = href; delete updated.coupon; } else { updated.coupon = (vals.coupon || []).join(','); delete updated.href; } setBlocks(prev => prev.map(b => b.id === selectedId && b.type === 'image' ? { ...b, regions: [...(b.regions || []), updated] } : b)); setMapModalVisible(false); setPendingRegion(null); setAddingMode(false); setAddType(null); mapForm.resetFields(); setNotification(null); }).catch(info => console.log('Validate Failed:', info)); };
  const openEditRegion = r => { setEditingRegion(r); setEditModalVisible(true); if (r.coupon) editForm.setFieldsValue({ coupon: r.coupon.split(',') }); else editForm.setFieldsValue({ href: r.href }); };
  const applyEditRegion = () => { editForm.validateFields().then(vals => { setBlocks(prev => prev.map(b => { if (b.id !== selectedId || b.type !== 'image') return b; const regions = (b.regions || []).map(r => { if (r.id !== editingRegion.id) return r; if (r.coupon != null) { return { ...r, coupon: (vals.coupon || []).join(','), href: undefined }; } else { let href = (vals.href || '').trim(); if (!/^https?:\/\//.test(href)) href = 'https://' + href; return { ...r, href, coupon: undefined }; } }); return { ...b, regions }; })); setEditModalVisible(false); setEditingRegion(null); }).catch(info => console.log('Validate Failed:', info)); };
  const deleteRegion = () => { setBlocks(prev => prev.map(b => { if (b.id !== selectedId || b.type !== 'image') return b; return { ...b, regions: (b.regions || []).filter(r => r.id !== editingRegion.id) }; })); setEditModalVisible(false); setEditingRegion(null); };
  
  const addProductBlock = (blockData) => { if (editingProductBlock) { setBlocks(blocks.map(b => b.id === editingProductBlock.id ? { ...blockData } : b)); } else { setBlocks(prev => [...prev, blockData]); setSelectedId(blockData.id); } setEditingProductBlock(null); setProductBlockModalVisible(false); };
  const openVideoModal = (blockToEdit = null) => { setAddingMode(false); setNotification(null); setSelectedId(blockToEdit?.id || null); if (blockToEdit) { videoForm.setFieldsValue({ urlOrId: blockToEdit.youtubeId, w: blockToEdit.ratio?.w, h: blockToEdit.ratio?.h, autoplay: blockToEdit.autoplay }); } else { videoForm.resetFields(); } setVideoModalVisible(true); };
  const submitVideo = () => { videoForm.validateFields().then(vals => { const { urlOrId, w = 16, h = 9, autoplay = false } = vals; const vid = getYouTubeId(urlOrId); if (!vid) return msgApi.error('유효한 YouTube 링크/ID가 아닙니다.'); const sel = blocks.find(b => b.id === selectedId); if (sel?.type === 'video') { setBlocks(prev => prev.map(b => b.id === sel.id ? { ...b, youtubeId: vid, ratio: { w, h }, autoplay, loop: autoplay } : b)); } else { const id = Date.now().toString() + Math.random(); setBlocks(prev => [...prev, { id, type: 'video', youtubeId: vid, ratio: { w, h }, autoplay, loop: autoplay }]); setSelectedId(id); } setVideoModalVisible(false); }).catch(info => console.log('Validate Failed:', info)); };
  const openTextModal = (blockToEdit = null) => { setAddingMode(false); setNotification(null); setSelectedId(blockToEdit?.id || null); if (blockToEdit) { textForm.setFieldsValue({ text: blockToEdit.text, ...blockToEdit.style }); } else { textForm.resetFields(); } setTextModalVisible(true); };
  const submitText = () => { textForm.validateFields().then(vals => { const { text, ...style } = vals; const sel = blocks.find(b => b.id === selectedId); if (sel?.type === 'text') { setBlocks(prev => prev.map(b => b.id === sel.id ? { ...b, text, style } : b)); } else { const id = Date.now().toString() + Math.random(); setBlocks(prev => [...prev, { id, type: 'text', text, style }]); setSelectedId(id); } setTextModalVisible(false); }).catch(info => console.log('Validate Failed:', info)); };
  
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
        const uploadedBlocks = await Promise.all(
            blocks.map(async b => {
                if (b.type === 'image' && b.file) {
                    const formData = new FormData();
                    formData.append('file', b.file);
                    const { data } = await api.post(`/api/${mallId}/uploads/image`, formData);
                    const { file, hash, ...rest } = b;
                    return { ...rest, src: data.url };
                }
                const { file, hash, ...rest } = b;
                return rest;
            })
        );

        const payload = {
            title,
            content: { blocks: uploadedBlocks },
            images: uploadedBlocks.filter(b => b.type === 'image').map(i => ({ _id: i.id, src: i.src, regions: i.regions })),
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
            
            <Space style={{ marginTop: 12, flexWrap: 'wrap' }}>
               <Button icon={<LinkOutlined />} type={addingMode && addType === 'link' ? 'primary' : 'default'} onClick={() => { if (!selectedBlock || selectedBlock.type !== 'image') { msgApi.info('URL을 추가할 이미지 블록을 선택하세요.'); return; } setAddType('link'); setAddingMode(true); setNotification('클릭 시 원하는 주소의 페이지로 이동이 되는 기능 (이미지에서 원하는 부분을 마우스 좌클릭 드래그를 통해 영역을 설정하고 URL 주소를 입력하세요)'); }}>URL 추가</Button>
               <Button icon={<TagOutlined />} type={addingMode && addType === 'coupon' ? 'primary' : 'default'} onClick={() => { if (!selectedBlock || selectedBlock.type !== 'image') { msgApi.info('쿠폰을 추가할 이미지 블록을 선택하세요.'); return; } setAddType('coupon'); setAddingMode(true); setNotification('해당 부분을 클릭 시 쿠폰이 다운되는 기능 (이미지에서 원하는 부분을 마우스 좌클릭 드래그를 통해 설정 후 쿠폰을 적용하세요)'); }}>쿠폰 추가</Button>
               <Button icon={<ShoppingCartOutlined />} onClick={() => { setAddingMode(false); setNotification(null); setEditingProductBlock(null); setProductBlockModalVisible(true); }}>상품 추가</Button>
               <Button icon={<YoutubeOutlined />} onClick={() => { setAddingMode(false); setNotification(null); openVideoModal(); }}>YouTube 추가</Button>
               <Button icon={<FontSizeOutlined />} onClick={() => { setAddingMode(false); setNotification(null); openTextModal(); }}>텍스트 추가</Button>
             </Space>
            
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
            <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 8 }}>
              {blocks.map(b => {
                const isSelected = selectedId === b.id;
                // ✅ [수정] isPreviewMode에 따라 렌더링 분기
                if (isPreviewMode) {
                  // --- 미리보기 모드 ---
                  switch (b.type) {
                    case 'image': return <img key={b.id} src={b.src} alt="preview" style={{ width: '100%', display: 'block', marginBottom: '8px' }} />;
                    case 'video': return <div key={b.id} style={{ marginBottom: '16px' }}><YouTubeEmbed id={b.youtubeId} ratioW={b.ratio?.w} ratioH={b.ratio?.h} autoplay={b.autoplay} loop={b.loop} /></div>;
                    case 'text': const st = b.style || {}; return ( <div key={b.id} style={{ textAlign: st.align || 'center', margin: `${st.mt || 16}px 0 ${st.mb || 16}px` }}><div style={{ fontSize: st.fontSize || 18, fontWeight: st.fontWeight || 'normal', color: st.color || '#333', whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: escapeHtml(b.text).replace(/\n/g, '<br/>') }} /></div>);
                    case 'product_group':
                      const activeTabIndex = previewActiveTabs[b.id] || 0;
                      let productsToDisplay = [];
                      if (b.registerMode === 'direct') {
                          if (b.layoutType === 'tabs') { productsToDisplay = (b.tabDirectProducts || {})[activeTabIndex] || []; } 
                          else { productsToDisplay = b.directProducts || []; }
                      }
                      return (
                          <div key={b.id} style={{ marginBottom: 16 }}>
                              {b.layoutType === 'tabs' && (<div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>{(b.tabs || []).map((tab, i) => (<Button key={i} style={{ flex: 1, borderColor: i === activeTabIndex ? b.activeColor || '#fe6326' : undefined, backgroundColor: i === activeTabIndex ? b.activeColor || '#fe6326' : '#fff', color: i === activeTabIndex ? '#fff' : 'inherit' }} onClick={() => setPreviewActiveTabs(prev => ({ ...prev, [b.id]: i }))}>{tab.title || `탭 ${i + 1}`}</Button>))}</div>)}
                              {b.registerMode === 'direct' ? renderGrid(b.gridSize, productsToDisplay) : (<div style={{ padding: '40px 20px', textAlign: 'center', color: '#888', background: '#f0f0f0', border: '1px dashed #d9d9d9', borderRadius: 4 }}>카테고리 상품은 실제 페이지에서 노출됩니다.</div>)}
                          </div>
                      );
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
                          const isCoupon = !!r.coupon;
                          const style = { position: 'absolute', left: `${r.xRatio*100}%`, top: `${r.yRatio*100}%`, width: `${r.wRatio*100}%`, height: `${r.hRatio*100}%`, border: `2px dashed ${isCoupon ? '#ff6347' : '#fe6326'}`, cursor: 'pointer', background: isCoupon ? 'rgba(255, 99, 71, 0.2)' : 'rgba(24, 144, 255, 0.2)', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start' };
                          return (<div key={r.id} onClick={(e) => { e.stopPropagation(); openEditRegion(r); }} style={style}><span style={{ background: isCoupon ? '#ff6347' : '#fe6326', color: 'white', fontSize: '10px', padding: '1px 4px', borderRadius: '2px', lineHeight: 1, fontWeight: 'bold', margin: '1px' }}>{isCoupon ? '쿠폰' : 'URL'}</span></div>);
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
                  if (b.type === 'product_group') {
                      const activeTabIndex = previewActiveTabs[b.id] || 0;
                      let productsToDisplay = [];
                      if (b.registerMode === 'direct') {
                          if (b.layoutType === 'tabs') { productsToDisplay = b.tabDirectProducts?.[activeTabIndex] || []; } 
                          else { productsToDisplay = b.directProducts || []; }
                      }
                      return (
                          <div key={b.id} className={`preview-block-container ${isSelected ? 'selected' : ''}`}>
                              <div className="block-header">
                                  <div className="block-title"><ShoppingCartOutlined /><strong>상품 블록</strong></div>
                                  <Space><Button type="link" size="small" onClick={() => { setEditingProductBlock(b); setProductBlockModalVisible(true); }}>편집</Button><Button type="link" size="small" danger onClick={() => deleteBlock(b.id)}>삭제</Button></Space>
                              </div>
                              <div className="block-content">
                                  {b.layoutType === 'tabs' && (<div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>{(b.tabs || []).map((tab, i) => (<Button key={i} style={{ flex: 1, borderColor: i === activeTabIndex ? b.activeColor || '#fe6326' : undefined, backgroundColor: i === activeTabIndex ? b.activeColor || '#fe6326' : '#fff', color: i === activeTabIndex ? '#fff' : 'inherit' }} onClick={() => setPreviewActiveTabs(prev => ({ ...prev, [b.id]: i }))}>{tab.title || `탭 ${i + 1}`}</Button>))}</div>)}
                                  {b.registerMode === 'direct' ? renderGrid(b.gridSize, productsToDisplay) : (<div style={{ padding: '40px 20px', textAlign: 'center', color: '#888', background: '#f0f0f0', border: '1px dashed #d9d9d9', borderRadius: 4 }}>카테고리 상품은 실제 페이지에서 노출됩니다.</div>)}
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
      <Modal open={mapModalVisible} title={addType === 'link' ? 'URL 영역 설정' : '쿠폰 영역 설정'} onCancel={() => { setMapModalVisible(false); setPendingRegion(null); setAddingMode(false); setAddType(null); mapForm.resetFields(); }} onOk={saveRegion} okText="적용" cancelText="취소"><Form form={mapForm} layout="vertical">{addType === 'link' ? (<Form.Item name="href" label="URL" rules={[{ required: true, message: 'URL을 입력해주세요.' }]}><Input placeholder="https://example.com" /></Form.Item>) : (<Form.Item name="coupon" label="쿠폰 선택 혹은 번호 입력" rules={[{ required: true, message: '쿠폰을 하나 이상 선택/입력하세요.' }]}><Select ref={couponSelectRef} mode="tags" options={couponOptions} tokenSeparators={[',']} onSelect={() => couponSelectRef.current?.blur()} tagRender={({ label, closable, onClose }) => <Tag closable={closable} onClose={onClose}>{label}</Tag>} placeholder="쿠폰 선택 또는 번호 입력" /></Form.Item>)}</Form></Modal>
      <Modal open={editModalVisible} title="영역 편집" onCancel={() => setEditModalVisible(false)} footer={[<Button key="del" danger onClick={deleteRegion}>삭제</Button>,<Button key="cancel" onClick={() => setEditModalVisible(false)}>취소</Button>,<Button key="ok" type="primary" onClick={applyEditRegion}>적용</Button>,]}><Form form={editForm} layout="vertical">{editingRegion?.coupon ? (<Form.Item name="coupon" label="쿠폰 선택 혹은 번호 입력" rules={[{ required: true, message: '쿠폰을 하나 이상 선택/입력하세요.' }]}><Select ref={couponEditSelectRef} mode="tags" options={couponOptions} tokenSeparators={[',']} onSelect={() => couponEditSelectRef.current?.blur()} tagRender={({ label, closable, onClose }) => <Tag closable={closable} onClose={onClose}>{label}</Tag>} /></Form.Item>) : (<Form.Item name="href" label="URL" rules={[{ required: true, message: 'URL을 입력하세요.' }]}><Input placeholder="https://example.com" /></Form.Item>)}</Form></Modal>
      <Modal open={videoModalVisible} title={(selectedId && blocks.find(b=>b.id===selectedId)?.type==='video') ? "영상 편집" : "영상 추가"} onCancel={() => setVideoModalVisible(false)} onOk={submitVideo} okText="적용" cancelText="취소"><Form form={videoForm} layout="vertical" initialValues={{w:16, h:9}}><Form.Item name="urlOrId" label="YouTube 링크 또는 영상 ID" rules={[{ required: true, message: 'YouTube 링크/ID를 입력하세요.' }]}><Input /></Form.Item><p style={{ fontSize: '12px', color: '#888', marginTop: '-12px', marginBottom: '16px' }}>원하는 유튜브 영상 오른쪽 버튼 '동영상 URL 복사'를 통해 영상을 추가할 수 있습니다.</p><Space><Form.Item name="w" label="비율 W" style={{marginBottom:0}}><InputNumber min={1} step={1} style={{width:100}}/></Form.Item><div style={{alignSelf:'end', padding:'0 6px 8px'}}>/</div><Form.Item name="h" label="비율 H" style={{marginBottom:0}}><InputNumber min={1} step={1} style={{width:100}}/></Form.Item></Space><Form.Item name="autoplay" valuePropName="checked" style={{marginTop:8}}><Checkbox>자동재생 (자동재생 시 반복이 자동 적용됩니다)</Checkbox></Form.Item></Form></Modal>
      <Modal open={textModalVisible} title={(selectedId && blocks.find(b=>b.id===selectedId)?.type==='text') ? "텍스트 편집" : "텍스트 추가"} onCancel={() => setTextModalVisible(false)} onOk={submitText} okText="적용" cancelText="취소"><Form form={textForm} layout="vertical" initialValues={{align:'center', fontSize:18, fontWeight:'normal', color:'#333333', mt:16, mb:16}}><Form.Item name="text" label="문구" rules={[{ required: true, message: '문구를 입력해주세요.' }]}><Input.TextArea rows={4} placeholder="문구를 입력하세요. 엔터는 줄바꿈으로 표시됩니다." /></Form.Item><Space wrap><Form.Item name="align" label="정렬" style={{marginBottom:0}}><Select style={{width:110}}><Option value="left">왼쪽</Option><Option value="center">가운데</Option><Option value="right">오른쪽</Option></Select></Form.Item><Form.Item name="fontSize" label="폰트크기" style={{marginBottom:0}}><InputNumber min={10} max={80} step={1} style={{width:110}}/></Form.Item><Form.Item name="fontWeight" label="굵기" style={{marginBottom:0}}><Select style={{width:110}}><Option value="normal">보통</Option><Option value="bold">굵게</Option></Select></Form.Item><Form.Item name="color" label="색상" style={{marginBottom:0}}><Input type="color" style={{width:60, padding:0, border:'none', background:'transparent'}}/></Form.Item><Form.Item name="mt" label="위 간격(px)" style={{marginBottom:0}}><InputNumber min={0} step={1} style={{width:120}}/></Form.Item><Form.Item name="mb" label="아래 간격(px)" style={{marginBottom:0}}><InputNumber min={0} step={1} style={{width:120}}/></Form.Item></Space></Form></Modal>
    </>
  );
}
