// src/pages/EventEdit.js
import React, { useState, useEffect, useRef } from 'react';
import MorePrd from './MorePrd';
import {
  Card,
  Steps,
  Input,
  Button,
  Select,
  Space,
  Upload,
  Popover,
  Form,
  message,
  Segmented,
  Modal,
  InputNumber,
  Checkbox,
} from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  PlusOutlined,
  UnorderedListOutlined,
  SaveOutlined,
  LinkOutlined,
  TagOutlined,
  VideoCameraAddOutlined,
  EditOutlined,
  FontSizeOutlined,
} from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../axios';
import './EventEdit.css';

const { Step } = Steps;
const { Option } = Select;

// HTML Escape (텍스트 블록에서 <br/> 변환용)
const escapeHtml = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default function EventEdit() {
  const params       = new URLSearchParams(window.location.search);
  const paramMallId  = params.get('mall_id') || params.get('state');
  const storedMallId = localStorage.getItem('mallId');
  const mallId       = paramMallId || storedMallId;
  const { id }       = useParams();
  const navigate     = useNavigate();
  const imgRef       = useRef(null);

  // 썸네일 드래그/클릭 충돌 방지
  const draggingRef = useRef(false);
  const getItemStyle = (isDragging, draggableStyle) => ({
    userSelect: 'none',
    transition: isDragging ? undefined : 'transform 200ms cubic-bezier(0.2,0,0,1), opacity 200ms',
    boxShadow: isDragging ? '0 6px 12px rgba(0,0,0,0.15)' : 'none',
    zIndex: isDragging ? 2 : 1,
    ...draggableStyle,
  });

  // Steps
  const [current, setCurrent] = useState(0);

  // 공통 상태
  const [docId, setDocId] = useState(null);
  const [title, setTitle] = useState('');

  // ✅ 이미지+영상+텍스트 통합 블록
  // image: {id,type:'image',src,file?,regions:[]}
  // video: {id,type:'video',youtubeId,ratio:{w,h}, autoplay?}
  // text : {id,type:'text',text,style:{align,fontSize,fontWeight,color,mt,mb}}
  const [blocks, setBlocks] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);

  // 전체보기
  const [showAllPreview, setShowAllPreview] = useState(false);

  // 상품 등록 방식
  const [registerMode, setRegisterMode]     = useState('category');
  const [directProducts, setDirectProducts] = useState([]);
  const [tabDirectProducts, setTabDirectProducts] = useState({});

  // 카테고리/레이아웃
  const [gridSize, setGridSize]     = useState(2);
  const [layoutType, setLayoutType] = useState('single');
  const [allCats, setAllCats]       = useState([]);
  const [singleRoot, setSingleRoot] = useState(null);
  const [singleSub, setSingleSub]   = useState(null);
  const [tabs, setTabs] = useState([
    { title: '', root: null, sub: null },
    { title: '', root: null, sub: null },
  ]);
  const [activeColor, setActiveColor] = useState('#1890ff');

  // 탭 헬퍼
  const addTab = () => {
    if (tabs.length >= 4) return;
    setTabs(ts => [...ts, { title: '', root: null, sub: null }]);
  };
  const updateTab = (i, key, val) => {
    setTabs(ts => {
      const a = [...ts];
      a[i] = { ...a[i], [key]: val };
      if (key === 'root') a[i].sub = null;
      return a;
    });
  };
  const removeTab = i => {
    // 보호: 최소 2개는 유지
    if (tabs.length <= 2) {
      message.warning('탭은 최소 2개 이상이어야 합니다.');
      return;
    }
    setTabs(ts => ts.filter((_, idx) => idx !== i));
    // reindex tabDirectProducts: shift down indices greater than i
    setTabDirectProducts(prev => {
      const next = {};
      Object.keys(prev).forEach(k => {
        const idx = Number(k);
        if (idx < i) next[idx] = prev[idx];
        else if (idx > i) next[idx - 1] = prev[idx];
      });
      return next;
    });
  };

  // URL/Coupon 매핑
  const [addingMode, setAddingMode]           = useState(false);
  const [addType, setAddType]                 = useState(null);
  const [dragStart, setDragStart]             = useState(null);
  const [dragBox, setDragBox]                 = useState(null);
  const [pendingBox, setPendingBox]           = useState(null);
  const [newValue, setNewValue]               = useState(null);
  const [urlModalVisible, setUrlModalVisible] = useState(false);
  const [couponModalVisible, setCouponModalVisible] = useState(false);

  // 쿠폰 옵션 & 편집
  const [couponOptions, setCouponOptions] = useState([]);
  const [editingForm] = Form.useForm();
  const [editingIndex, setEditingIndex] = useState(null);

  // MorePrd 모달
  const [morePrdVisible, setMorePrdVisible]   = useState(false);
  const [morePrdTarget, setMorePrdTarget]     = useState('direct');
  const [morePrdTabIndex, setMorePrdTabIndex] = useState(0);
  const [initialSelected, setInitialSelected] = useState([]);

  // 🔹 영상 블록 추가/수정 모달
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoInput, setVideoInput] = useState('');
  const [videoRatioW, setVideoRatioW] = useState(16);
  const [videoRatioH, setVideoRatioH] = useState(9);
  const [editingVideoIdx, setEditingVideoIdx] = useState(null);
  const [videoAutoplay, setVideoAutoplay] = useState(false); // 추가: autoplay

  // 🔹 텍스트 블록 추가/수정 모달
  const [textModalOpen, setTextModalOpen] = useState(false);
  const [textForm] = Form.useForm();

  // ────────────────────────────────────────────────────────────────
  // 유틸: YouTube ID 파서
  function parseYouTubeId(input) {
    if (!input) return null;
    if (/^[\w-]{11}$/.test(input)) return input;
    try {
      const url = new URL(String(input).trim());
      const host = url.hostname.replace('www.', '');
      if (host === 'youtu.be') return url.pathname.slice(1);
      if (host.includes('youtube.com')) {
        if (url.searchParams.get('v')) return url.searchParams.get('v');
        const m = url.pathname.match(/\/(embed|shorts)\/([\w-]{11})/);
        if (m) return m[2];
      }
    } catch (_) {}
    const m = String(input).match(/src=["']([^"']+)["']/i);
    if (m) return parseYouTubeId(m[1]);
    return null;
  }

  function buildYouTubeSrc(id, autoplay) {
    const params = new URLSearchParams();
    if (autoplay) {
      params.set('autoplay', '1');
      params.set('mute', '1'); // 자동 재생시 무음으로 설정(모바일 정책)
      params.set('playsinline', '1');
    }
    params.set('rel', '0');
    params.set('modestbranding', '1');
    const q = params.toString();
    return `https://www.youtube.com/embed/${id}${q ? '?' + q : ''}`;
  }

  function YouTubeEmbed({ id, ratioW = 16, ratioH = 9, title = 'YouTube video', autoplay = false }) {
    if (!id) {
      return (
        <div style={{
          width:'100%', maxWidth:800, margin:'0 auto',
          background:'#eee', color:'#666',
          display:'flex', alignItems:'center', justifyContent:'center',
          height: Math.round((ratioH/ratioW) * 800)
        }}>
          <span style={{fontSize:14}}>영상 (ID 없음)</span>
        </div>
      );
    }
    const src = buildYouTubeSrc(id, autoplay);
    const paddingTop = `${(ratioH/ratioW) * 100}%`;
    return (
      <div style={{ width:'100%', maxWidth:800, margin:'0 auto' }}>
        <div style={{ position:'relative', width:'100%', paddingTop, aspectRatio:`${ratioW} / ${ratioH}` }}>
          <iframe
            src={src}
            title={title}
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:0 }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </div>
    );
  }
  // ────────────────────────────────────────────────────────────────

  // 초기 데이터 로드
  useEffect(() => {
    if (!mallId) return;

    api.get(`/api/${mallId}/categories/all`)
      .then(r => setAllCats(r.data))
      .catch(() => message.error('카테고리 로드 실패'));

    api.get(`/api/${mallId}/coupons`)
      .then(r => setCouponOptions(
        r.data.map(c => ({
          value: c.coupon_no,
          label: `${c.coupon_name} (${c.benefit_percentage}%)`
        }))
      ))
      .catch(() => message.error('쿠폰 로드 실패'));

    api.get(`/api/${mallId}/events/${id}`)
      .then(({ data: ev }) => {
        setDocId(ev._id);
        setTitle(ev.title);
        setGridSize(ev.gridSize);
        setLayoutType(ev.layoutType);
        setRegisterMode(ev.classification?.registerMode || 'category');

        if (ev.classification?.registerMode === 'direct') {
          if (ev.layoutType === 'single') {
            setDirectProducts(ev.classification.directProducts || []);
          } else {
            setTabDirectProducts(ev.classification.tabDirectProducts || {});
          }
        }

        if (ev.layoutType === 'single') {
          setSingleRoot(ev.classification?.root != null ? String(ev.classification.root) : null);
          setSingleSub(ev.classification?.sub  != null ? String(ev.classification.sub)  : null);
        } else {
          const incomingTabs = ev.classification?.tabs;
          setTabs(
            Array.isArray(incomingTabs)
              ? incomingTabs.map(t => ({
                  title: String(t.title || ''),
                  root:  t.root != null ? String(t.root) : null,
                  sub:   t.sub  != null ? String(t.sub)  : null,
                }))
              : [{ title:'', root:null, sub:null }, { title:'', root:null, sub:null }]
          );
          setActiveColor(ev.classification?.activeColor || '#1890ff');
        }

        // ✅ blocks 정규화: content.blocks → 없으면 images를 image 블록으로
        const rawBlocks = Array.isArray(ev?.content?.blocks)
          ? ev.content.blocks
          : (ev.images || []).map(img => ({
              _id: img._id || img.id,
              type: 'image',
              src: img.src,
              regions: img.regions || []
            }));

        const norm = rawBlocks.map(b => {
          const t = b.type || 'image';
          if (t === 'video') {
            return {
              id: b._id || b.id || `${Date.now()}-${Math.random()}`,
              type: 'video',
              youtubeId: b.youtubeId || parseYouTubeId(b.src),
              ratio: b.ratio || { w:16, h:9 },
              regions: [],
              autoplay: !!b.autoplay, // 서버에 저장된 autoplay를 불러옴
            };
          }
          if (t === 'text') {
            return {
              id: b._id || b.id || `${Date.now()}-${Math.random()}`,
              type: 'text',
              text: b.text || '',
              style: b.style || {},
            };
          }
          return {
            id: b._id || b.id || `${Date.now()}-${Math.random()}`,
            type: 'image',
            src: b.src,
            file: undefined,
            youtubeId: undefined,
            ratio: { w:16, h:9 },
            regions: (b.regions || []).map(r => ({
              ...r,
              id: r._id || r.id || `${Date.now()}-${Math.random()}`,
            })),
          };
        });

        setBlocks(norm);
        setSelectedIdx(0);
      })
      .catch(() => {
        message.error('이벤트 로드 실패');
        navigate(`/${mallId}/event/list`);
      });
  }, [mallId, id, navigate]);

  // 이미지 교체 (현재 선택 블록 = 이미지일 때만)
  const replaceImage = (idx, file, onSuccess) => {
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target.result;
      setBlocks(bks => {
        const a = [...bks];
        a[idx] = { ...a[idx], src: dataUrl, file };
        return a;
      });
      onSuccess();
      message.success('이미지 교체 완료');
    };
    reader.readAsDataURL(file);
  };

  // 매핑 핸들러 (이미지 블록일 때만)
  const onMouseDown = e => {
    if (!addingMode || !imgRef.current) return;
    const blk = blocks[selectedIdx];
    if (!blk || blk.type !== 'image') return;
    const { left, top } = imgRef.current.getBoundingClientRect();
    setDragStart({ x: e.clientX - left, y: e.clientY - top });
  };
  const onMouseMove = e => {
    if (!dragStart || !imgRef.current) return;
    const { left, top } = imgRef.current.getBoundingClientRect();
    const cur = { x: e.clientX - left, y: e.clientY - top };
    setDragBox({
      x: Math.min(dragStart.x, cur.x),
      y: Math.min(dragStart.y, cur.y),
      w: Math.abs(cur.x - dragStart.x),
      h: Math.abs(cur.y - dragStart.y),
    });
  };
  const onMouseUp = () => {
    if (dragBox) {
      const blk = blocks[selectedIdx];
      if (!blk || blk.type !== 'image') {
        setDragStart(null);
        setDragBox(null);
        return;
      }
      setPendingBox(dragBox);
      if (addType === 'url')    setUrlModalVisible(true);
      if (addType === 'coupon') setCouponModalVisible(true);
    }
    setDragStart(null);
    setDragBox(null);
  };

  const addRegion = value => {
    if (!pendingBox) return;
    const blk = blocks[selectedIdx];
    if (!blk || blk.type !== 'image') {
      message.warning('이미지에서만 영역을 추가할 수 있습니다.');
      return;
    }
    const W = imgRef.current.clientWidth;
    const H = imgRef.current.clientHeight;
    const newR = {
      id: `${Date.now()}-${Math.random()}`,
      xRatio: pendingBox.x / W,
      yRatio: pendingBox.y / H,
      wRatio: pendingBox.w / W,
      hRatio: pendingBox.h / H,
      ...(addType==='url'    ? { href: value }   : {}),
      ...(addType==='coupon' ? { coupon: value } : {}),
    };
    setBlocks(bks => {
      const a = [...bks];
      a[selectedIdx] = { ...a[selectedIdx], regions: [...(a[selectedIdx].regions||[]), newR] };
      return a;
    });
    setAddingMode(false);
    setAddType(null);
    setPendingBox(null);
    setNewValue(null);
    message.success(addType === 'url' ? 'URL 추가됨' : '쿠폰 추가됨');
  };

  // 영역 편집/삭제 (이미지 블록)
  const onEditRegion = idx => {
    setEditingIndex(idx);
    const blk = blocks[selectedIdx];
    const r = (blk?.regions || [])[idx];
    if (r) editingForm.setFieldsValue(r);
  };
  const saveRegion = (idx, vals) => {
    setBlocks(bks => {
      const a = [...bks];
      const regions = [...(a[selectedIdx].regions||[])];
      regions[idx] = { ...regions[idx], ...vals };
      a[selectedIdx] = { ...a[selectedIdx], regions };
      return a;
    });
    setEditingIndex(null);
    message.success('영역 수정됨');
  };
  const deleteRegion = idx => {
    setBlocks(bks => {
      const a = [...bks];
      a[selectedIdx] = {
        ...a[selectedIdx],
        regions: (a[selectedIdx].regions || []).filter((_, i) => i !== idx)
      };
      return a;
    });
    setEditingIndex(null);
    message.success('영역 삭제됨');
  };

  // 블록 순서 변경/삭제
  const onDragEnd = result => {
    if (!result.destination) return;
    const a = Array.from(blocks);
    const [m] = a.splice(result.source.index, 1);
    a.splice(result.destination.index, 0, m);
    setBlocks(a);
    if (result.source.index === selectedIdx) {
      setSelectedIdx(result.destination.index);
    }
    requestAnimationFrame(() => { draggingRef.current = false; });
  };

  const deleteBlock = idx => {
    if (blocks.length === 1) {
      return message.warning('최소 1개 블록이 필요합니다.');
    }
    setBlocks(prev => prev.filter((_, i) => i !== idx));
    setSelectedIdx(0);
    message.success('블록 삭제 완료');
  };

  // 🔹 영상 블록 추가/수정
  const openAddVideo = () => {
    if (blocks.length === 0) return message.info('이미지 추가 후 이용가능');
    setEditingVideoIdx(null);
    setVideoInput('');
    setVideoRatioW(16);
    setVideoRatioH(9);
    setVideoAutoplay(false);
    setVideoModalOpen(true);
  };
  const openEditVideo = (idx) => {
    const blk = blocks[idx];
    if (!blk || blk.type !== 'video') return;
    setEditingVideoIdx(idx);
    setVideoInput(blk.youtubeId || '');
    setVideoRatioW(blk.ratio?.w || 16);
    setVideoRatioH(blk.ratio?.h || 9);
    setVideoAutoplay(!!blk.autoplay);
    setVideoModalOpen(true);
  };
  const confirmVideoModal = () => {
    const yid = parseYouTubeId(videoInput);
    if (!yid) {
      message.error('유효한 YouTube URL/ID를 입력하세요.');
      return;
    }
    if (editingVideoIdx == null) {
      // add
      setBlocks(prev => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          type: 'video',
          youtubeId: yid,
          ratio: { w: Number(videoRatioW) || 16, h: Number(videoRatioH) || 9 },
          regions: [],
          autoplay: !!videoAutoplay,
        }
      ]);
      setSelectedIdx(blocks.length);
      message.success('영상 블록 추가됨');
    } else {
      // edit
      setBlocks(prev => {
        const a = [...prev];
        a[editingVideoIdx] = {
          ...a[editingVideoIdx],
          type: 'video',
          youtubeId: yid,
          ratio: { w: Number(videoRatioW) || 16, h: Number(videoRatioH) || 9 },
          autoplay: !!videoAutoplay,
        };
        return a;
      });
      message.success('영상 블록 수정됨');
    }
    setVideoModalOpen(false);
  };

  // 🔹 텍스트 블록 추가/수정
  const openCreateText = () => {
    if (blocks.length === 0) return message.info('이미지 추가 후 이용가능');
    textForm.resetFields();
    setTextModalOpen(true);
  };
  const openEditText = (blk) => {
    textForm.setFieldsValue({
      text: blk.text || '',
      align: blk.style?.align || 'center',
      fontSize: blk.style?.fontSize || 18,
      fontWeight: blk.style?.fontWeight || 'normal',
      color: blk.style?.color || '#333333',
      mt: blk.style?.mt ?? 16,
      mb: blk.style?.mb ?? 16,
    });
    setTextModalOpen(true);
  };
  const submitText = () => {
    const { text, fontSize=18, fontWeight='normal', color='#333333', align='center', mt=16, mb=16 } = textForm.getFieldsValue();
    if (!String(text || '').trim()) return message.warning('문구를 입력하세요.');
    const sel = blocks[selectedIdx];
    if (sel && sel.type === 'text') {
      // edit
      setBlocks(prev => prev.map((b,i) =>
        i === selectedIdx
          ? { ...b, text, style:{ fontSize:Number(fontSize), fontWeight, color, align, mt:Number(mt), mb:Number(mb) } }
          : b
      ));
    } else {
      // add
      const idv = `${Date.now()}-${Math.random()}`;
      setBlocks(prev => [
        ...prev,
        { id:idv, type:'text', text, style:{ fontSize:Number(fontSize), fontWeight, color, align, mt:Number(mt), mb:Number(mb) } }
      ]);
      setSelectedIdx(blocks.length);
    }
    setTextModalOpen(false);
  };

  // 저장
  const handleSave = async () => {
    try {
      // 이미지 블록만 업로드
      const uploaded = await Promise.all(
        blocks.map(async b => {
          if (b.type === 'image' && b.file) {
            const form = new FormData();
            form.append('file', b.file);
            const { data } = await api.post(
              `/api/${mallId}/uploads/image`,
              form,
              { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            return { ...b, src: data.url, file: undefined };
          }
          return b;
        })
      );

      // payload.content.blocks로 저장 + 레거시 images 동시 제공
      const contentBlocks = uploaded.map(b => {
        if (b.type === 'video') {
          return {
            _id: b.id,
            type: 'video',
            youtubeId: b.youtubeId,
            ratio: b.ratio || { w:16, h:9 },
            autoplay: !!b.autoplay, // 추가: autoplay 저장
          };
        }
        if (b.type === 'text') {
          return {
            _id: b.id,
            type: 'text',
            text: b.text || '',
            style: b.style || {}
          };
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
            href:   r.href,
            coupon: r.coupon
          }))
        };
      });

      const legacyImages = uploaded
        .filter(b => b.type === 'image')
        .map(b => ({
          _id: b.id,
          src: b.src,
          regions: (b.regions || []).map(r => ({
            _id: r.id,
            xRatio: r.xRatio,
            yRatio: r.yRatio,
            wRatio: r.wRatio,
            hRatio: r.hRatio,
            href:   r.href,
            coupon: r.coupon
          }))
        }));

      const payload = {
        title,
        content: { blocks: contentBlocks },
        gridSize,
        layoutType,
        classification: {
          registerMode,
          ...(registerMode==='category'&&layoutType==='single'&&{ root: singleRoot, sub: singleSub }),
          ...(registerMode==='category'&&layoutType==='tabs'  &&{ tabs, activeColor }),
          ...(registerMode==='direct'  &&layoutType==='single'&&{ directProducts }),
          ...(registerMode==='direct'  &&layoutType==='tabs'  &&{ tabDirectProducts, tabs, activeColor }),
          // registerMode==='none'이면 위에 아무것도 추가하지 않음(상품 노출 관련 속성 미포함)
        },
        images: legacyImages, // 레거시 호환
      };

      await api.put(`/api/${mallId}/events/${id}`, payload);
      message.success('저장 완료');
      navigate(`/event/detail/${id}`);
    } catch (err) {
      console.error(err);
      message.error('저장 실패');
    }
  };

  const selectedBlock = blocks[selectedIdx];

  // 이미지 유무
  const hasAnyImage = blocks.some(b => b.type === 'image');

  // ------------------------------
  // step 이동 전 유효성 검사 핸들러
  // ------------------------------
  const handleStepChange = (target) => {
    // target === 2 => "상품등록 방식 설정" 으로 이동하려고 할 때 유효성 검사
    if (target === 2) {
      if (!registerMode) {
        message.warning('상품 등록 방식을 선택하세요.');
        return;
      }

      // 공통: gridSize와 layoutType 검사
      if (!gridSize) {
        message.warning('그리드 사이즈를 선택해주세요.');
        return;
      }
      if (!layoutType) {
        message.warning('상품 노출 방식을 선택해주세요.');
        return;
      }

      // category 모드: single -> 대분류 필요 / tabs -> 탭 2개 이상
      if (registerMode === 'category') {
        if (layoutType === 'single' && !singleRoot) {
          message.warning('상품 분류(대분류)를 선택하세요.');
          return;
        }
        if (layoutType === 'tabs' && (!Array.isArray(tabs) || tabs.length < 2)) {
          message.warning('탭을 두 개 이상 설정하세요.');
          return;
        }
        // category 모드는 카테고리 선택만으로 통과
        setCurrent(target);
        return;
      }

      // direct 모드: 반드시 상품이 등록되어 있어야 함
      if (registerMode === 'direct') {
        if (layoutType === 'single') {
          if (!directProducts || directProducts.length === 0) {
            message.warning('상품을 한 개 이상 등록하세요.');
            return;
          }
          setCurrent(target);
          return;
        }
        if (layoutType === 'tabs') {
          // 각 탭마다 상품이 하나 이상 등록되어 있는지 확인
          for (let i = 0; i < tabs.length; i++) {
            const arr = tabDirectProducts[i] || [];
            if (!arr || arr.length === 0) {
              message.warning(`탭 ${i + 1}에 상품을 추가하세요.`);
              return;
            }
          }
          setCurrent(target);
          return;
        }
      }

      // none 모드는 특별 제약 없음
      setCurrent(target);
      return;
    }

    // 다른 스텝으로 이동은 허용
    setCurrent(target);
  };

  return (
    <Card
      title="이벤트 수정"
      extra={
        <Space>
          <Button icon={<UnorderedListOutlined />} onClick={() => navigate(`/${mallId}/event/list`)}>
            목록
          </Button>
          <Button onClick={() => navigate(`/${mallId}/event/detail/${docId || id}`)}>
            취소
          </Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
            저장
          </Button>
        </Space>
      }
      style={{ minHeight: '80vh' }}
    >
      <Steps current={current} onChange={handleStepChange} style={{ marginBottom: 24 }}>
        <Step title="제목 입력" />
        <Step title="미디어(이미지/영상/텍스트) & 매핑" />
        <Step title="상품등록 방식 설정" />
      </Steps>

      {/* Step 1 */}
      {current === 0 && (
        <Input
          placeholder="제목을 입력하세요"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      )}

      {/* Step 2 */}
      {current === 1 && (
        <>
          {/* 썸네일 리스트 (블록 단위) */}
          <DragDropContext
            onDragStart={() => { draggingRef.current = true; }}
            onDragEnd={onDragEnd}
          >
            <Droppable droppableId="thumbs" direction="horizontal">
              {prov => (
                <div
                  ref={prov.innerRef}
                  {...prov.droppableProps}
                  style={{ display:'flex', gap:8, overflowX:'auto', padding:'8px 0' }}
                >
                  {blocks.map((blk, idx) => (
                    <Draggable key={blk.id} draggableId={String(blk.id)} index={idx}>
                      {(p, snapshot) => (
                        <div
                          ref={p.innerRef}
                          {...p.draggableProps}
                          {...p.dragHandleProps}
                          style={{
                            position:'relative',
                            border: idx===selectedIdx ? `2px solid ${activeColor}` : '1px solid #ddd',
                            borderRadius:4,
                            width: 140,
                            height: 78,
                            overflow:'hidden',
                            cursor:'pointer',
                            ...getItemStyle(snapshot.isDragging, p.draggableProps.style)
                          }}
                          onPointerUp={() => {
                            if (draggingRef.current) return;
                            setSelectedIdx(idx);
                            setShowAllPreview(false); // 전체보기 해제
                          }}
                          title={
                            blk.type === 'video'
                              ? `YouTube: ${blk.youtubeId || ''}${blk.autoplay ? ' (autoplay)' : ''}`
                              : blk.type === 'text'
                              ? '텍스트'
                              : '이미지'
                          }
                        >
                          {blk.type === 'image' ? (
                            <img
                              src={blk.src}
                              alt=""
                              style={{ width:'100%', height:'100%', objectFit:'cover' }}
                            />
                          ) : blk.type === 'video' ? (
                            <div style={{
                              width:'100%', height:'100%',
                              background:'#000', color:'#fff',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              fontSize:12
                            }}>
                              <span>🎬 {blk.youtubeId || '영상'}{blk.autoplay ? ' · 자동재생' : ''}</span>
                            </div>
                          ) : (
                            <div
                              style={{
                                width:'100%', height:'100%',
                                background:'#f5f5f5', color:'#888',
                                display:'flex', alignItems:'center', justifyContent:'center',
                                fontSize:22, fontWeight:700
                              }}
                            >
                              Tt
                            </div>
                          )}

                          <div style={{ position:'absolute', top:4, right:4, display:'flex', gap:4 }}>
                            {blk.type === 'image' ? (
                              <Upload
                                accept="image/*"
                                showUploadList={false}
                                customRequest={({file,onSuccess})=>replaceImage(idx,file,onSuccess)}
                              >
                                <Button size="small" icon={<UploadOutlined />} />
                              </Upload>
                            ) : blk.type === 'video' ? (
                              <Button
                                size="small"
                                icon={<EditOutlined />}
                                onClick={(e)=>{ e.stopPropagation(); openEditVideo(idx); }}
                              />
                            ) : (
                              <Button
                                size="small"
                                icon={<EditOutlined />}
                                onClick={(e)=>{ e.stopPropagation(); openEditText(blocks[idx]); setSelectedIdx(idx); }}
                              />
                            )}
                            <Button
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={(e)=>{ e.stopPropagation(); deleteBlock(idx); }}
                            />
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}

                  {/* 이미지 블록 추가 */}
                  <div
                    style={{
                      width:140, height:78,
                      border:'1px dashed #ccc',
                      borderRadius:4,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      cursor:'pointer'
                    }}
                  >
                    <Upload
                      accept="image/*"
                      showUploadList={false}
                      customRequest={({file,onSuccess,onError})=>{
                        const reader = new FileReader();
                        reader.onload = e=>{
                          const dataUrl = e.target.result;
                          setBlocks(prev=>[
                            ...prev,
                            { id:`${Date.now()}-${Math.random()}`, type:'image', src:dataUrl, file, regions:[] }
                          ]);
                          setSelectedIdx(blocks.length);
                          onSuccess();
                          message.success('이미지 추가됨');
                        };
                        reader.onerror = onError;
                        reader.readAsDataURL(file);
                      }}
                    >
                      <PlusOutlined style={{ fontSize:24, color:'#888' }} />
                    </Upload>
                  </div>

                  {/* 영상 블록 추가 */}
                  <div
                    onClick={openAddVideo}
                    style={{
                      width:140, height:78,
                      border:'1px dashed #ccc',
                      borderRadius:4,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      cursor:'pointer'
                    }}
                    title="영상 블록 추가"
                  >
                    <VideoCameraAddOutlined style={{ fontSize:24, color:'#888' }} />
                  </div>

                  {/* 텍스트 블록 추가 */}
                  <div
                    onClick={openCreateText}
                    style={{
                      width:140, height:78,
                      border:'1px dashed #ccc',
                      borderRadius:4,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      cursor:'pointer'
                    }}
                    title="텍스트 블록 추가"
                  >
                    <FontSizeOutlined style={{ fontSize:24, color:'#888' }} />
                  </div>

                  {prov.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* 매핑/컨트롤 + 전체보기 */}
          <Space style={{ margin:'8px 0' }} wrap>
            <Button
              icon={<LinkOutlined />}
              type={addingMode && addType==='url' ? 'primary':'default'}
              onClick={()=>{
                if (blocks.length === 0) return message.info('이미지 추가 후 이용가능');
                if (showAllPreview) return message.info('추가하실 썸네일은 선택해주세요');
                const sel = blocks[selectedIdx];
                if (!sel || sel.type !== 'image') return message.info('대상 이미지를 선택하세요.');
                setAddingMode(true); setAddType('url');
              }}
            >URL 추가</Button>

            <Button
              icon={<TagOutlined />}
              type={addingMode && addType==='coupon' ? 'primary':'default'}
              onClick={()=>{
                if (blocks.length === 0) return message.info('이미지 추가 후 이용가능');
                if (showAllPreview) return message.info('추가하실 썸네일은 선택해주세요');
                const sel = blocks[selectedIdx];
                if (!sel || sel.type !== 'image') return message.info('대상 이미지를 선택하세요.');
                setAddingMode(true); setAddType('coupon'); setNewValue([]);
              }}
            >쿠폰 추가</Button>

            <Button
              style={{
                marginLeft: 8,
                background: showAllPreview ? '#fe6326' : undefined,
                color: showAllPreview ? '#fff' : undefined,
                borderColor: showAllPreview ? '#fe6326' : undefined
              }}
              onClick={()=>{
                if (blocks.length === 0) return message.info('이미지 추가 후 이용가능');
                setShowAllPreview(v=>!v);
              }}
            >
              전체 보기
            </Button>
          </Space>

          {/* 미디어 미리보기 / 매핑 캔버스 */}
          {showAllPreview ? (
            // 전체보기 모드
            <div style={{ display:'grid', gap:0, maxWidth:800, margin:'0 auto' }}>
              {blocks.map(b =>
                b.type === 'video' ? (
                  <div key={b.id} style={{ width:'100%' }}>
                    <div style={{ position:'relative', width:'100%', aspectRatio:`${b.ratio?.w||16} / ${b.ratio?.h||9}` }}>
                      <iframe
                        src={buildYouTubeSrc(b.youtubeId, !!b.autoplay)}
                        title="YouTube"
                        style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:0 }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  </div>
                ) : b.type === 'text' ? (
                  <div
                    key={b.id}
                    style={{
                      textAlign: b.style?.align || 'center',
                      marginTop: b.style?.mt ?? 16,
                      marginBottom: b.style?.mb ?? 16,
                    }}
                  >
                    <div
                      style={{
                        fontSize: b.style?.fontSize || 18,
                        fontWeight: b.style?.fontWeight || 'normal',
                        color: b.style?.color || '#333',
                      }}
                      dangerouslySetInnerHTML={{ __html: escapeHtml(b.text || '').replace(/\n/g, '<br/>') }}
                    />
                  </div>
                ) : (
                  <img key={b.id} src={b.src} alt="" style={{ width:'100%', maxWidth:800, margin:'0 auto' }} />
                )
              )}
            </div>
          ) : selectedBlock?.type === 'video' ? (
            <div style={{ margin:'16px auto', maxWidth:800 }}>
              <YouTubeEmbed
                id={selectedBlock.youtubeId}
                ratioW={selectedBlock.ratio?.w || 16}
                ratioH={selectedBlock.ratio?.h || 9}
                title={`youtube-${selectedBlock.youtubeId || 'preview'}`}
                autoplay={!!selectedBlock.autoplay}
              />
              <div style={{ marginTop:8 }}>
                <Button size="small" icon={<EditOutlined />} onClick={()=>openEditVideo(selectedIdx)}>
                  영상 편집
                </Button>
              </div>
            </div>
          ) : selectedBlock?.type === 'text' ? (
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
                  dangerouslySetInnerHTML={{ __html: escapeHtml(selectedBlock.text || '').replace(/\n/g, '<br/>') }}
                />
              </div>
              <Button onClick={() => openEditText(selectedBlock)}>텍스트 편집</Button>
            </div>
          ) : (
            <div
              className="mapping-container"
              ref={imgRef}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              style={{
                position:'relative',
                width:'100%',
                maxWidth:800,
                margin:'16px auto',
                cursor:addingMode ? 'crosshair':'default'
              }}
            >
              {selectedBlock && selectedBlock.type === 'image' && (
                <img
                  src={selectedBlock.src}
                  alt=""
                  style={{ width:'100%', userSelect:'none' }}
                  draggable={false}
                />
              )}

              {dragBox && (
                <div
                  style={{
                    position:'absolute',
                    left:dragBox.x,
                    top:dragBox.y,
                    width:dragBox.w,
                    height:dragBox.h,
                    border:'2px dashed #1890ff',
                    background:'rgba(24,144,255,0.15)'
                  }}
                />
              )}

              {(selectedBlock?.regions || []).map((r,i)=>(
                <Popover
                  key={r.id}
                  trigger="click"
                  placement="topLeft"
                  getPopupContainer={trigger=>trigger.parentNode}
                  open={editingIndex===i}
                  onOpenChange={open=>open?onEditRegion(i):setEditingIndex(null)}
                  content={
                    <Form
                      form={editingForm}
                      initialValues={r}
                      onFinish={vals=>saveRegion(i,vals)}
                      layout="vertical"
                      style={{ width:500 }}
                    >
                      {r.coupon ? (
                        <Form.Item
                          name="coupon"
                          label="쿠폰 선택 혹은 번호 입력"
                          rules={[{ required:true, message:'쿠폰을 선택하거나 번호를 입력하세요' }]}
                        >
                          <Select
                            mode="tags"
                            tokenSeparators={[',']}
                            options={couponOptions}
                            placeholder="쿠폰 선택 또는 번호 입력"
                          />
                        </Form.Item>
                      ) : (
                        <Form.Item
                          name="href"
                          label="URL 입력"
                          rules={[{ required:true, message:'URL을 입력하세요' }]}
                        >
                          <Input placeholder="https://example.com" />
                        </Form.Item>
                      )}
                      <Form.Item>
                        <Space style={{ justifyContent:'flex-end', width:'100%' }}>
                          <Button onClick={()=>setEditingIndex(null)}>취소</Button>
                          <Button danger onClick={()=>deleteRegion(i)}>삭제</Button>
                          <Button type="primary" htmlType="submit">적용</Button>
                        </Space>
                      </Form.Item>
                    </Form>
                  }
                >
                  <div
                    style={{
                      position:'absolute',
                      left:`${(r.xRatio*100).toFixed(2)}%`,
                      top:`${(r.yRatio*100).toFixed(2)}%`,
                      width:`${(r.wRatio*100).toFixed(2)}%`,
                      height:`${(r.hRatio*100).toFixed(2)}%`,
                      border: r.coupon
                        ? '2px dashed rgba(255,99,71,0.7)'
                        : '2px dashed rgba(24,144,255,0.7)',
                      background: r.coupon
                        ? 'rgba(255,99,71,0.2)'
                        : 'rgba(24,144,255,0.2)',
                      cursor:'pointer'
                    }}
                    onClick={e=>{ e.stopPropagation(); onEditRegion(i); }}
                  />
                </Popover>
              ))}
            </div>
          )}
        </>
      )}

      {/* Step 3 */}
      {current === 2 && (
        <div style={{ maxWidth: 400 }}>
          <h4>상품 등록 방식</h4>
          <Segmented
            options={[
              { label: '카테고리 상품 등록', value: 'category' },
              { label: '직접 상품 등록',   value: 'direct'   },
              { label: '노출안함',         value: 'none'     },
            ]}
            value={registerMode}
            onChange={setRegisterMode}
            block
            style={{ marginBottom: 24 }}
          />

          {/* 카테고리 상품 등록 */}
          {registerMode === 'category' && (
            <>
              <h4>그리드 사이즈</h4>
              <Space>
                {[2,3,4].map(n => (
                  <Button
                    key={n}
                    type={gridSize === n ? 'primary' : 'default'}
                    onClick={() => setGridSize(n)}
                  >
                    {n}×{n}
                  </Button>
                ))}
              </Space>

              <h4 style={{ margin: '16px 0' }}>노출 방식</h4>
              <Segmented
                options={[
                  { label: '단품상품', value: 'single' },
                  { label: '탭상품',   value: 'tabs'   },
                ]}
                value={layoutType}
                onChange={val => setLayoutType(val)}
                block
              />

              {layoutType === 'single' && (
                <Space style={{ marginTop: 24 }}>
                  <Select
                    placeholder="대분류"
                    style={{ width: 180 }}
                    value={singleRoot}
                    onChange={setSingleRoot}
                  >
                    {allCats.filter(c => c.category_depth === 1).map(r => (
                      <Option key={r.category_no} value={String(r.category_no)}>
                        {r.category_name}
                      </Option>
                    ))}
                  </Select>
                  <Select
                    placeholder="소분류"
                    style={{ width: 180 }}
                    value={singleSub}
                    onChange={setSingleSub}
                  >
                    {allCats
                      .filter(c => c.category_depth === 2 && String(c.parent_category_no) === singleRoot)
                      .map(s => (
                        <Option key={s.category_no} value={String(s.category_no)}>
                          {s.category_name}
                        </Option>
                      ))}
                  </Select>
                </Space>
              )}

              {layoutType === 'tabs' && (
                <>
                  {tabs.map((t,i) => (
                    <Space key={i} size="middle" style={{ marginTop:16 }}>
                      <Input
                        placeholder={`탭 ${i+1} 제목`}
                        style={{ width:120 }}
                        value={t.title}
                        onChange={e => updateTab(i,'title',e.target.value)}
                      />
                      <Select
                        placeholder="대분류"
                        style={{ width:140 }}
                        value={t.root}
                        onChange={v => updateTab(i,'root',v)}
                      >
                        {allCats.filter(c => c.category_depth === 1).map(r => (
                          <Option key={r.category_no} value={String(r.category_no)}>
                            {r.category_name}
                          </Option>
                        ))}
                      </Select>
                      <Select
                        placeholder="소분류"
                        style={{ width:140 }}
                        value={t.sub}
                        onChange={v => updateTab(i,'sub',v)}
                      >
                        {allCats
                          .filter(c => c.category_depth === 2 && String(c.parent_category_no) === t.root)
                          .map(s => (
                            <Option key={s.category_no} value={String(s.category_no)}>
                              {s.category_name}
                            </Option>
                          ))}
                      </Select>
                      {tabs.length >= 3 && (
                        <DeleteOutlined onClick={() => removeTab(i)} style={{ cursor:'pointer' }} />
                      )}
                    </Space>
                  ))}
                  <Button
                    type="dashed"
                    block
                    style={{ marginTop:16 }}
                    onClick={addTab}
                    disabled={tabs.length >= 4}
                  >
                    + 탭 추가
                  </Button>
                  <Space style={{ marginTop:12, alignItems:'center' }}>
                    <span>활성 탭 색:</span>
                    <Input
                      type="color"
                      value={activeColor}
                      onChange={e => setActiveColor(e.target.value)}
                      style={{ width:32, height:32, padding:0, border:'none' }}
                    />
                  </Space>
                </>
              )}
            </>
          )}

          {/* 직접 상품 등록 */}
          {registerMode === 'direct' && (
            <>
              <h4>그리드 사이즈</h4>
              <Space>
                {[2,3,4].map(n => (
                  <Button
                    key={n}
                    type={gridSize === n ? 'primary' : 'default'}
                    onClick={() => setGridSize(n)}
                  >
                    {n}×{n}
                  </Button>
                ))}
              </Space>

              <h4 style={{ margin: '16px 0' }}>노출 방식</h4>
              <Segmented
                options={[
                  { label: '단품상품', value: 'single' },
                  { label: '탭상품',   value: 'tabs'   },
                ]}
                value={layoutType}
                onChange={val => setLayoutType(val)}
                block
              />

              {layoutType === 'single' && (
                <Button
                  type={directProducts.length > 0 ? 'primary' : 'dashed'}
                  onClick={() => {
                    setInitialSelected(directProducts.map(p => p.product_no));
                    setMorePrdTarget('direct');
                    setMorePrdVisible(true);
                  }}
                >
                  {directProducts.length
                    ? `상품 ${directProducts.length}개 등록됨`
                    : '상품 직접 등록'}
                </Button>
              )}

              {layoutType === 'tabs' && (
                <>
                  {tabs.map((t,i) => (
                    <Space key={i} size="middle" style={{ marginTop:16 }}>
                      <Input
                        placeholder={`탭 ${i+1} 제목`}
                        style={{ width:120 }}
                        value={t.title}
                        onChange={e => updateTab(i,'title',e.target.value)}
                      />
                      <Button
                        type={(tabDirectProducts[i]||[]).length > 0 ? 'primary' : 'default'}
                        onClick={() => {
                          setInitialSelected((tabDirectProducts[i]||[]).map(p => p.product_no));
                          setMorePrdTarget('tab');
                          setMorePrdTabIndex(i);
                          setMorePrdVisible(true);
                        }}
                      >
                        {(tabDirectProducts[i]||[]).length
                          ? `상품 ${(tabDirectProducts[i]||[]).length}개 등록됨`
                          : '상품 직접 등록'}
                      </Button>
                      {tabs.length >= 3 && (
                        <DeleteOutlined onClick={() => removeTab(i)} style={{ cursor:'pointer' }} />
                      )}
                    </Space>
                  ))}
                  <Button
                    type="dashed"
                    block
                    style={{ marginTop:16 }}
                    onClick={addTab}
                    disabled={tabs.length >= 4}
                  >
                    + 탭 추가
                  </Button>
                  <Space style={{ marginTop:12, alignItems:'center' }}>
                    <span>활성 탭 색:</span>
                    <Input
                      type="color"
                      value={activeColor}
                      onChange={e => setActiveColor(e.target.value)}
                      style={{ width:32, height:32, padding:0, border:'none' }}
                    />
                  </Space>
                </>
              )}
            </>
          )}

          {/* 노출안함 */}
          {registerMode === 'none' && (
            <div style={{ textAlign:'center', color:'#999', padding:'32px 0' }}>
              상품을 노출하지 않습니다.
            </div>
          )}
        </div>
      )}

      {/* MorePrd 모달 */}
      {morePrdVisible && (
        <MorePrd
          visible={morePrdVisible}
          target={morePrdTarget}
          tabIndex={morePrdTabIndex}
          initialSelected={initialSelected}
          onOk={selected => {
            if (morePrdTarget === 'direct') {
              setDirectProducts(selected);
            } else {
              setTabDirectProducts(prev => ({
                ...prev,
                [morePrdTabIndex]: selected
              }));
            }
            setMorePrdVisible(false);
          }}
          onCancel={() => setMorePrdVisible(false)}
        />
      )}

      {/* URL 모달 */}
      <Modal
        title="URL 추가"
        open={urlModalVisible}
        onCancel={() => {
          setPendingBox(null);
          setAddType(null);
          setAddingMode(false);
          setUrlModalVisible(false);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setPendingBox(null);
            setAddType(null);
            setAddingMode(false);
            setUrlModalVisible(false);
          }}>취소</Button>,
          <Button key="add" type="primary" onClick={() => {
            addRegion(newValue);
            setUrlModalVisible(false);
          }}>등록</Button>,
        ]}
      >
        <Input
          placeholder="https://example.com"
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
        />
      </Modal>

      {/* 쿠폰 모달 */}
      <Modal
        title="쿠폰 추가"
        open={couponModalVisible}
        onCancel={() => {
          setPendingBox(null);
          setAddType(null);
          setAddingMode(false);
          setCouponModalVisible(false);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setPendingBox(null);
            setAddType(null);
            setAddingMode(false);
            setCouponModalVisible(false);
          }}>취소</Button>,
          <Button key="delete" danger onClick={() => {
            setPendingBox(null);
            setAddType(null);
            setAddingMode(false);
            setCouponModalVisible(false);
          }}>삭제</Button>,
          <Button key="apply" type="primary" onClick={() => {
            addRegion(newValue);
            setCouponModalVisible(false);
          }}>적용</Button>,
        ]}
      >
        <Select
          mode="tags"
          tokenSeparators={[',']}
          options={couponOptions}
          placeholder="쿠폰 선택 혹은 번호 입력 (쉼표로 구분)"
          value={newValue || []}
          onChange={v => setNewValue(v)}
          style={{ width:'100%' }}
        />
      </Modal>

      {/* 영상 블록 추가/수정 모달 */}
      <Modal
        title={editingVideoIdx == null ? '영상 블록 추가' : '영상 블록 수정'}
        open={videoModalOpen}
        onCancel={()=>setVideoModalOpen(false)}
        onOk={confirmVideoModal}
        okText={editingVideoIdx == null ? '추가' : '수정'}
      >
        <Space direction="vertical" style={{ width:'100%' }}>
          <Input
            placeholder="YouTube URL/ID/iframe src"
            value={videoInput}
            onChange={e=>setVideoInput(e.target.value)}
          />
          <Space>
            비율:
            <InputNumber min={1} value={videoRatioW} onChange={v=>setVideoRatioW(v||16)} />
            :
            <InputNumber min={1} value={videoRatioH} onChange={v=>setVideoRatioH(v||9)} />
          </Space>

          <Checkbox checked={videoAutoplay} onChange={e=>setVideoAutoplay(e.target.checked)}>
            자동 재생 (무음으로 재생됩니다)
          </Checkbox>

          <div style={{ marginTop:8 }}>
            미리보기
            <div style={{ marginTop:8 }}>
              <YouTubeEmbed id={parseYouTubeId(videoInput)} ratioW={videoRatioW} ratioH={videoRatioH} autoplay={videoAutoplay} />
            </div>
          </div>
        </Space>
      </Modal>

      {/* 텍스트 블록 추가/수정 모달 */}
      <Modal
        title={selectedBlock?.type==='text' ? '텍스트 편집' : '텍스트 추가'}
        open={textModalOpen}
        onCancel={()=>setTextModalOpen(false)}
        onOk={submitText}
        okText="적용"
      >
        <Form
          form={textForm}
          layout="vertical"
          initialValues={{ text:'', align:'center', fontSize:18, fontWeight:'normal', color:'#333333', mt:16, mb:16 }}
        >
          <Form.Item name="text" label="문구" rules={[{ required:true, message:'문구를 입력하세요.' }]}>
            <Input.TextArea rows={4} placeholder="문구를 입력하세요. 엔터는 줄바꿈(<br/>)으로 보여집니다." />
          </Form.Item>
          <Space wrap>
            <Form.Item name="align" label="정렬" style={{ marginBottom:0 }}>
              <Select style={{ width:110 }}>
                <Option value="left">왼쪽</Option>
                <Option value="center">가운데</Option>
                <Option value="right">오른쪽</Option>
              </Select>
            </Form.Item>
            <Form.Item name="fontSize" label="폰트크기" style={{ marginBottom:0 }}>
              <Input type="number" min={10} max={80} step={1} style={{ width:110 }} />
            </Form.Item>
            <Form.Item name="fontWeight" label="굵기" style={{ marginBottom:0 }}>
              <Select style={{ width:110 }}>
                <Option value="normal">보통</Option>
                <Option value="500">500</Option>
                <Option value="600">600</Option>
                <Option value="bold">bold</Option>
              </Select>
            </Form.Item>
            <Form.Item name="color" label="색상" style={{ marginBottom:0 }}>
              <Input type="color" style={{ width:60, padding:0, border:'none', background:'transparent' }} />
            </Form.Item>
            <Form.Item name="mt" label="위 간격(px)" style={{ marginBottom:0 }}>
              <Input type="number" min={0} step={1} style={{ width:120 }} />
            </Form.Item>
            <Form.Item name="mb" label="아래 간격(px)" style={{ marginBottom:0 }}>
              <Input type="number" min={0} step={1} style={{ width:120 }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </Card>
  );
}
