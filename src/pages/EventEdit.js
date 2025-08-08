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
} from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../axios';
import './EventEdit.css';

const { Step } = Steps;
const { Option } = Select;

export default function EventEdit() {
  const params       = new URLSearchParams(window.location.search);
  const paramMallId  = params.get('mall_id') || params.get('state');
  const storedMallId = localStorage.getItem('mallId');
  const mallId       = paramMallId || storedMallId;
  const { id }       = useParams();
  const navigate     = useNavigate();
  const imgRef       = useRef(null);

  // Steps
  const [current, setCurrent] = useState(0);

  // 공통 상태
  const [docId, setDocId] = useState(null);
  const [title, setTitle] = useState('');

  // ✅ 이미지+영상 통합 블록
  // block = { id, type: 'image'|'video', src?, file?, regions?, youtubeId?, ratio:{w,h} }
  const [blocks, setBlocks] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);

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
  const removeTab = i => setTabs(ts => ts.filter((_, idx) => idx !== i));

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
  const [videoInput, setVideoInput] = useState('');  // URL / ID / iframe src 아무거나
  const [videoRatioW, setVideoRatioW] = useState(16);
  const [videoRatioH, setVideoRatioH] = useState(9);
  const [editingVideoIdx, setEditingVideoIdx] = useState(null);

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

  function YouTubeEmbed({ id, ratioW = 16, ratioH = 9, title = 'YouTube video' }) {
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
    const src = `https://www.youtube.com/embed/${id}`;
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

        const norm = rawBlocks.map(b => ({
          id: b._id || b.id || `${Date.now()}-${Math.random()}`,
          type: b.type || 'image',
          src: b.src,
          file: undefined,
          youtubeId: b.youtubeId || parseYouTubeId(b.src),
          ratio: b.ratio || { w:16, h:9 },
          regions: (b.regions || []).map(r => ({
            ...r,
            id: r._id || r.id || `${Date.now()}-${Math.random()}`,
          })),
        }));

        setBlocks(norm.length ? norm : []);
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
    setBlocks(prev => {
      const a = Array.from(prev);
      const [m] = a.splice(result.source.index, 1);
      a.splice(result.destination.index, 0, m);
      return a;
    });
    if (result.source.index === selectedIdx) {
      setSelectedIdx(result.destination.index);
    }
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
    setEditingVideoIdx(null);
    setVideoInput('');
    setVideoRatioW(16);
    setVideoRatioH(9);
    setVideoModalOpen(true);
  };
  const openEditVideo = (idx) => {
    const blk = blocks[idx];
    if (!blk || blk.type !== 'video') return;
    setEditingVideoIdx(idx);
    setVideoInput(blk.youtubeId || '');
    setVideoRatioW(blk.ratio?.w || 16);
    setVideoRatioH(blk.ratio?.h || 9);
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
        };
        return a;
      });
      message.success('영상 블록 수정됨');
    }
    setVideoModalOpen(false);
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
      const contentBlocks = uploaded.map(b => ({
        id: b.id,
        type: b.type,
        src: b.type === 'image' ? b.src : b.src, // video는 src 사용 안 해도 호환 위해 둠
        youtubeId: b.type === 'video' ? b.youtubeId : undefined,
        ratio: b.ratio || (b.type === 'video' ? { w:16, h:9 } : undefined),
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
        // ✅ blocks 저장
        content: { blocks: contentBlocks },
        gridSize,
        layoutType,
        classification: {
          registerMode,
          ...(registerMode==='category'&&layoutType==='single'&&{ root: singleRoot, sub: singleSub }),
          ...(registerMode==='category'&&layoutType==='tabs'  &&{ tabs, activeColor }),
          ...(registerMode==='direct'  &&layoutType==='single'&&{ directProducts }),
          ...(registerMode==='direct'  &&layoutType==='tabs'  &&{ tabDirectProducts, tabs, activeColor }),
        },
        // ✅ 레거시 호환: images도 같이 유지
        images: legacyImages,
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
      <Steps current={current} onChange={setCurrent} style={{ marginBottom: 24 }}>
        <Step title="제목 입력" />
        <Step title="미디어(이미지/영상) & 매핑" />
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
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="thumbs" direction="horizontal">
              {prov => (
                <div
                  ref={prov.innerRef}
                  {...prov.droppableProps}
                  style={{ display:'flex', gap:8, overflowX:'auto', padding:'8px 0' }}
                >
                  {blocks.map((blk, idx) => (
                    <Draggable key={blk.id} draggableId={String(blk.id)} index={idx}>
                      {p => (
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
                            ...p.draggableProps.style
                          }}
                          onClick={()=>setSelectedIdx(idx)}
                          title={blk.type === 'video' ? `YouTube: ${blk.youtubeId || ''}` : '이미지'}
                        >
                          {blk.type === 'image' ? (
                            <img
                              src={blk.src}
                              alt=""
                              style={{ width:'100%', height:'100%', objectFit:'cover', cursor:'pointer' }}
                            />
                          ) : (
                            <div style={{
                              width:'100%', height:'100%',
                              background:'#000', color:'#fff',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              fontSize:12
                            }}>
                              <span>🎬 {blk.youtubeId || '영상'}</span>
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
                            ) : (
                              <Button
                                size="small"
                                icon={<EditOutlined />}
                                onClick={(e)=>{ e.stopPropagation(); openEditVideo(idx); }}
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

                  {prov.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {/* 매핑/영상 컨트롤 */}
          <Space style={{ margin:'8px 0' }}>
            <Button
              icon={<LinkOutlined />}
              type={addingMode && addType==='url' ? 'primary':'default'}
              disabled={selectedBlock?.type !== 'image'}
              onClick={()=>{ setAddingMode(true); setAddType('url'); }}
            >URL 추가</Button>
            <Button
              icon={<TagOutlined />}
              type={addingMode && addType==='coupon' ? 'primary':'default'}
              disabled={selectedBlock?.type !== 'image'}
              onClick={()=>{ setAddingMode(true); setAddType('coupon'); setNewValue([]); }}
            >쿠폰 추가</Button>
          </Space>

          {/* 미디어 미리보기 / 매핑 캔버스 */}
          {selectedBlock?.type === 'video' ? (
            <div style={{ margin:'16px auto', maxWidth:800 }}>
              <YouTubeEmbed
                id={selectedBlock.youtubeId}
                ratioW={selectedBlock.ratio?.w || 16}
                ratioH={selectedBlock.ratio?.h || 9}
                title={`youtube-${selectedBlock.youtubeId || 'preview'}`}
              />
              <div style={{ marginTop:8 }}>
                <Button size="small" icon={<EditOutlined />} onClick={()=>openEditVideo(selectedIdx)}>
                  영상 편집
                </Button>
              </div>
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
                    border:'2px dashed #1890ff'
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
          <div style={{ marginTop:8 }}>
            미리보기
            <div style={{ marginTop:8 }}>
              <YouTubeEmbed id={parseYouTubeId(videoInput)} ratioW={videoRatioW} ratioH={videoRatioH} />
            </div>
          </div>
        </Space>
      </Modal>
    </Card>
  );
}
