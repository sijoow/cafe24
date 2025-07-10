// src/pages/EventEdit.jsx

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
} from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  PlusOutlined,
  UnorderedListOutlined,
  SaveOutlined,
  LinkOutlined,
  TagOutlined,
} from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './EventEdit.css';

// Ensure axios always points to your real API
const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  'https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app';
axios.defaults.baseURL = API_BASE;

const { Step } = Steps;
const { Option } = Select;

export default function EventEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const imgRef = useRef(null);

  // ── Steps & 기본 정보 ─────────────────────────────────────────
  const [current, setCurrent] = useState(0);
  const [docId, setDocId] = useState(null);
  const [title, setTitle] = useState('');
  const [images, setImages] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);

  // ── 상품 등록 방식 상태 ────────────────────────────────────────
  const [registerMode, setRegisterMode] = useState('category'); // 'category' | 'direct' | 'none'
  const [directProducts, setDirectProducts] = useState([]);     // 단일 직접등록 상품 리스트
  const [tabDirectProducts, setTabDirectProducts] = useState({});// 탭별 직접등록
  const [initialSelected, setInitialSelected] = useState([]);
  const [morePrdVisible, setMorePrdVisible] = useState(false);
  const [morePrdTarget, setMorePrdTarget] = useState('direct');   // 'direct' | 'tab'
  const [morePrdTabIndex, setMorePrdTabIndex] = useState(0);

  // ── 레이아웃 & 카테고리 상태 ────────────────────────────────────
  const [gridSize, setGridSize] = useState(2);
  const [layoutType, setLayoutType] = useState('single');
  const [allCats, setAllCats] = useState([]);
  const [singleRoot, setSingleRoot] = useState(null);
  const [singleSub, setSingleSub] = useState(null);
  const [tabs, setTabs] = useState([
    { title: '', root: null, sub: null },
    { title: '', root: null, sub: null },
  ]);
  const [activeColor, setActiveColor] = useState('#1890ff');

  // ── URL/Coupon 추가 모드 & 드래그 매핑 ───────────────────────────
  const [addingMode, setAddingMode] = useState(false);
  const [addType, setAddType] = useState(null); // 'url' | 'coupon'
  const [dragStart, setDragStart] = useState(null);
  const [dragBox, setDragBox] = useState(null);
  const [pendingBox, setPendingBox] = useState(null);
  const [newValue, setNewValue] = useState(null);
  const [urlModalVisible, setUrlModalVisible] = useState(false);
  const [couponModalVisible, setCouponModalVisible] = useState(false);

  // ── 쿠폰 옵션 & 편집 폼 ─────────────────────────────────────────
  const [couponOptions, setCouponOptions] = useState([]);
  const [editingForm] = Form.useForm();
  const [editingIndex, setEditingIndex] = useState(null);

  const roots = allCats.filter(c => c.category_depth === 1);
  const subs  = allCats.filter(
    c => c.category_depth === 2 && String(c.parent_category_no) === singleRoot
  );

  // ── MorePrd 모달 열기 헬퍼 ───────────────────────────────────────
  const openMorePrd = (target, tabIndex = 0) => {
    setMorePrdTarget(target);
    if (target === 'direct') {
      setInitialSelected(directProducts.map(p => p.product_no));
    } else {
      setInitialSelected((tabDirectProducts[tabIndex] || []).map(p => p.product_no));
    }
    setMorePrdTabIndex(tabIndex);
    setMorePrdVisible(true);
  };

  // ── 초기 데이터 로드 ───────────────────────────────────────────
  useEffect(() => {
    // 카테고리 & 쿠폰
    axios.get('/api/categories/all')
      .then(res => setAllCats(res.data))
      .catch(() => message.error('카테고리 로드 실패'));
    axios.get('/api/coupons')
      .then(res => setCouponOptions(
        res.data.map(c => ({ value: c.coupon_no, label: `${c.coupon_name} (${c.benefit_percentage}%)` }))
      ))
      .catch(() => message.error('쿠폰 로드 실패'));

    // 이벤트 불러오기
    axios.get(`/api/events/${id}`)
      .then(res => {
        const ev = res.data;
        setDocId(ev._id);
        setTitle(ev.title);
        setGridSize(ev.gridSize);
        setLayoutType(ev.layoutType);

        // 상품 등록 방식 초기화
        setRegisterMode(ev.classification.registerMode || 'category');
        if (ev.classification.registerMode === 'direct') {
          if (ev.layoutType === 'single') {
            setDirectProducts(ev.classification.directProducts || []);
          } else {
            setTabDirectProducts(ev.classification.tabDirectProducts || {});
          }
        }

        // 카테고리/탭 초기화
        if (ev.layoutType === 'single') {
          setSingleRoot(ev.classification.root);
          setSingleSub(ev.classification.sub);
        } else {
          setTabs(ev.classification.tabs);
          setActiveColor(ev.classification.activeColor);
        }

        // 이미지 & regions
        setImages((ev.images || []).map(img => ({
          id: String(img._id),
          src: img.src,
          regions: (img.regions || []).map(r => ({ ...r, id: r._id })),
        })));
      })
      .catch(() => {
        message.error('이벤트 로드 실패');
        navigate('/event/list');
      });
  }, [id, navigate]);
    // 1) replaceImage → 바로 업로드하지 않고 DataURL 생성
    const replaceImage = (idx, file, onSuccess) => {
      const reader = new FileReader();
      reader.onload = e => {
        const dataUrl = e.target.result;
        setImages(imgs => {
          const a = [...imgs];
          a[idx] = { 
            id: a[idx].id,
            src: dataUrl,      // 미리보기용
            file,              // 저장 시 업로드
            regions: a[idx].regions
          };
          return a;
        });
        onSuccess();
        message.success('미리보기 등록 완료 (저장 시 업로드됩니다)');
      };
      reader.readAsDataURL(file);
    };

  // ── 드래그 매핑 이벤트 핸들러 ─────────────────────────────────
  const onMouseDown = e => {
    if (!addingMode || !imgRef.current) return;
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
    if (!dragBox) {
      setDragStart(null);
      return;
    }
    setPendingBox(dragBox);
    setDragStart(null);
    setDragBox(null);
    if (addType === 'url') setUrlModalVisible(true);
    if (addType === 'coupon') setCouponModalVisible(true);
  };

  // ── 새 영역 추가 ─────────────────────────────────────────────
  const addRegion = value => {
    if (!pendingBox) return;
    const W = imgRef.current.clientWidth;
    const H = imgRef.current.clientHeight;
    const newR = {
      id: Date.now().toString(),
      xRatio: pendingBox.x / W,
      yRatio: pendingBox.y / H,
      wRatio: pendingBox.w / W,
      hRatio: pendingBox.h / H,
      ...(addType === 'url' ? { href: value } : {}),
      ...(addType === 'coupon' ? { coupon: value } : {}),
    };
    setImages(imgs => {
      const a = [...imgs];
      a[selectedIdx].regions.push(newR);
      return a;
    });
    message.success(addType === 'url' ? 'URL 영역 추가됨' : '쿠폰 영역 추가됨');
    setAddingMode(false);
    setAddType(null);
    setPendingBox(null);
    setNewValue('');
  };

  // ── 영역 편집/삭제 ───────────────────────────────────────────
  const onEditRegion = idx => {
    setEditingIndex(idx);
    editingForm.setFieldsValue(images[selectedIdx].regions[idx]);
  };
  const saveRegion = (idx, vals) => {
    setImages(imgs => {
      const a = [...imgs];
      a[selectedIdx].regions[idx] = { ...a[selectedIdx].regions[idx], ...vals };
      return a;
    });
    setEditingIndex(null);
    message.success('영역 수정됨');
  };
  const deleteRegion = idx => {
    setImages(imgs => {
      const a = [...imgs];
      a[selectedIdx].regions = a[selectedIdx].regions.filter((_, i) => i !== idx);
      return a;
    });
    setEditingIndex(null);
    message.success('영역 삭제됨');
  };

  // ── 이미지 순서 변경 ─────────────────────────────────────────
  const onDragEnd = result => {
    if (!result.destination) return;
    const a = Array.from(images);
    const [m] = a.splice(result.source.index, 1);
    a.splice(result.destination.index, 0, m);
    setImages(a);
    if (result.source.index === selectedIdx) {
      setSelectedIdx(result.destination.index);
    }
  };

  // ── 이미지 삭제 ─────────────────────────────────────────────
  const deleteImage = async (idx, imageId) => {
    if (images.length === 1) {
      return message.warning('최소 1장 필요');
    }
    if (!/^[0-9a-fA-F]{24}$/.test(imageId)) {
      setImages(imgs => imgs.filter((_, i) => i !== idx));
      setSelectedIdx(0);
      return message.success('이미지 삭제 완료');
    }
    try {
      await axios.delete(`/api/events/${id}/images/${imageId}`);
      setImages(imgs => imgs.filter((_, i) => i !== idx));
      setSelectedIdx(0);
      message.success('이미지 삭제 완료');
    } catch (err) {
      console.error(err);
      message.error('이미지 삭제 실패');
    }
  };

  // ── 저장 ───────────────────────────────────────────────────────
  const handleSave = async () => {
    try {
      // ① 파일 업로드
      const uploaded = await Promise.all(
        images.map(async img => {
          if (img.file) {
            const form = new FormData();
            form.append('file', img.file);
            const { data } = await axios.post('/api/uploads/image', form);
            return { ...img, src: data.url, file: undefined };
          }
          return img;
        })
      );

      // ② 나머지 payload 구성 & 전송
      const payload = {
        // ...다른 필드들
        images: uploaded.map(img => ({
          _id: img.id,
          src: img.src,
          regions: img.regions.map(r => ({
            _id: r.id,
            xRatio: r.xRatio, yRatio: r.yRatio,
            wRatio: r.wRatio, hRatio: r.hRatio,
            href: r.href, coupon: r.coupon
          }))
        })),
        // ...
      };
      await axios.put(`/api/events/${id}`, payload);
      message.success('저장 완료');
      navigate(`/event/detail/${id}`);
    } catch (err) {
      console.error(err);
      message.error('저장에 실패했습니다');
    }
  };


  return (
    <Card
      title="이벤트 수정"
      extra={
        <Space>
          <Button icon={<UnorderedListOutlined />} onClick={() => navigate('/event/list')}>
            목록
          </Button>
          <Button onClick={() => navigate(`/event/detail/${docId}`)}>취소</Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave}>
            저장
          </Button>
        </Space>
      }
      style={{ minHeight: '80vh' }}
    >
      {/* Steps */}
      <Steps current={current} onChange={setCurrent} style={{ marginBottom: 24 }}>
        <Step title="제목 입력" />
        <Step title="이미지 매핑" />
        <Step title="상품등록 방식 설정" />
      </Steps>

      {/* Step 1: 제목 입력 */}
      {current === 0 && (
        <Input
          placeholder="제목을 입력하세요"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
      )}

    {/* Step 2: 이미지 매핑 */}
    {current === 1 && (
      <>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="thumbs" direction="horizontal">
            {(prov) => (
              <div
                ref={prov.innerRef}
                {...prov.droppableProps}
                style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '8px 0' }}
              >
                {images.map((img, idx) => (
                  <Draggable key={img.id} draggableId={img.id} index={idx}>
                    {(p) => (
                      <div
                        ref={p.innerRef}
                        {...p.draggableProps}
                        {...p.dragHandleProps}
                        style={{
                          position: 'relative',
                          border: idx === selectedIdx ? `2px solid ${activeColor}` : '1px solid #ddd',
                          borderRadius: 4,
                          ...p.draggableProps.style,
                        }}
                        onClick={() => setSelectedIdx(idx)}
                      >
                        <img
                          src={img.src}
                          alt=""
                          style={{ width: 100, height: 60, objectFit: 'cover', cursor: 'pointer' }}
                        />
                        <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 4 }}>
                          <Upload
                            accept="image/*"
                            showUploadList={false}
                            customRequest={({ file, onSuccess }) => replaceImage(idx, file, onSuccess)}
                          >
                            <Button size="small" icon={<UploadOutlined />} />
                          </Upload>
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => deleteImage(idx, img.id)}
                          />
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                <div
                  style={{
                    width: 100,
                    height: 60,
                    border: '1px dashed #ccc',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    customRequest={({ file, onSuccess, onError }) => {
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        const dataUrl = e.target.result;
                        setImages((prev) => {
                          const newImg = { id: Date.now().toString(), src: dataUrl, file, regions: [] };
                          setSelectedIdx(prev.length);
                          return [...prev, newImg];
                        });
                        onSuccess();
                        message.success('미리보기 등록 완료 (저장 시 업로드됩니다)');
                      };
                      reader.onerror = (err) => {
                        console.error(err);
                        onError(err);
                        message.error('파일 읽기 실패');
                      };
                      reader.readAsDataURL(file);
                    }}
                  >
                    <PlusOutlined style={{ fontSize: 24, color: '#888' }} />
                  </Upload>
                </div>
                {prov.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <Space style={{ margin: '8px 0' }}>
          <Button
            icon={<LinkOutlined />}
            type={addingMode && addType === 'url' ? 'primary' : 'default'}
            onClick={() => { setAddType('url'); setAddingMode(true); }}
          >
            URL 추가
          </Button>
          <Button
            icon={<TagOutlined />}
            type={addingMode && addType === 'coupon' ? 'primary' : 'default'}
            onClick={() => {
              setAddType('coupon');
              setAddingMode(true);
              setNewValue([]); // 쿠폰 모드일 땐 빈 배열로 시작
            }}
          >
            쿠폰 추가
          </Button>
        </Space>

        <div
          className="mapping-container"
          ref={imgRef}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 800,
            margin: '16px auto',
            cursor: addingMode ? 'crosshair' : 'default',
          }}
        >
          <img
            src={images[selectedIdx]?.src}
            alt=""
            style={{ width: '100%', height: 'auto', objectFit: 'contain', userSelect: 'none' }}
            draggable={false}
          />

          {/* 드래그 박스 */}
          {dragBox && (
            <div
              className="drag-box"
              style={{
                position: 'absolute',
                left: dragBox.x,
                top: dragBox.y,
                width: dragBox.w,
                height: dragBox.h,
                border: '2px dashed #1890ff',
              }}
            />
          )}

          {/* 기존 영역 더블클릭 시 편집 Popover */}
          {images[selectedIdx]?.regions.map((r, i) => (
            <Popover
              key={r.id}
              trigger="click"
              placement="topLeft"
              getPopupContainer={(trigger) => trigger.parentNode}
              overlayStyle={{ maxWidth: 500, width: 500 }}
              open={editingIndex === i}
              onOpenChange={(open) => {
                if (open) onEditRegion(i);
                else setEditingIndex(null);
              }}
              content={
                <Form
                  form={editingForm}
                  initialValues={r}
                  onFinish={(vals) => saveRegion(i, vals)}
                  layout="vertical"
                  style={{ width: '100%' }}
                >
                  {r.coupon ? (
                    <Form.Item
                      name="coupon"
                      label="쿠폰 선택"
                      rules={[{ required: true, message: '쿠폰을 하나 이상 선택하세요' }]}
                    >
                      <Select mode="multiple" options={couponOptions} placeholder="쿠폰 번호 선택" />
                    </Form.Item>
                  ) : (
                    <Form.Item
                      name="href"
                      label="링크(URL)"
                      rules={[{ required: true, message: 'URL을 입력해주세요.' }]}
                    >
                      <Input placeholder="https://example.com" />
                    </Form.Item>
                  )}
                  <Form.Item>
                    <Space style={{ justifyContent: 'space-between' ,textAlign:'right'}}>
                      <Button onClick={() => setEditingIndex(null)}>
                        취소
                      </Button>
                      <Button danger onClick={() => deleteRegion(i)}>
                        삭제
                      </Button>
                      <Button htmlType="submit" type="primary">
                        적용
                      </Button>
                    </Space>
                  </Form.Item>
                </Form>
              }
            >
              <div
                className="mapping-region"
                style={{
                  position: 'absolute',
                  left: `${(r.xRatio * 100).toFixed(2)}%`,
                  top: `${(r.yRatio * 100).toFixed(2)}%`,
                  width: `${(r.wRatio * 100).toFixed(2)}%`,
                  height: `${(r.hRatio * 100).toFixed(2)}%`,
                  border: r.coupon
                    ? '2px dashed rgba(255,99,71,0.7)'
                    : '2px dashed rgba(24,144,255,0.7)',
                  background: r.coupon
                    ? 'rgba(255,99,71,0.2)'
                    : 'rgba(24,144,255,0.2)',
                  cursor: 'pointer',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onEditRegion(i);
                }}
              />
            </Popover>
          ))}
        </div>
      </>
    )}


      {/* Step 3: 레이아웃 구성 & 상품 등록 방식 */}
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
                  { label: '단품', value: 'single' },
                  { label: '탭',   value: 'tabs'   },
                ]}
                value={layoutType}
                onChange={val => {
                  setLayoutType(val);
                  setSingleRoot(null);
                  setSingleSub(null);
                  setTabs([
                    { title: '', root: null, sub: null },
                    { title: '', root: null, sub: null },
                  ]);
                }}
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
                    {roots.map(r => (
                      <Option key={r.category_no} value={String(r.category_no)}>
                        {r.category_name}
                      </Option>
                    ))}
                  </Select>
                  {subs.length > 0 && (
                    <Select
                      placeholder="소분류"
                      style={{ width: 180 }}
                      value={singleSub}
                      onChange={setSingleSub}
                    >
                      {subs.map(s => (
                        <Option key={s.category_no} value={String(s.category_no)}>
                          {s.category_name}
                        </Option>
                      ))}
                    </Select>
                  )}
                </Space>
              )}

              {layoutType === 'tabs' && (
                <Space direction="vertical" style={{ marginTop: 24, width: '100%' }}>
                  {tabs.map((t, i) => (
                    <Space key={i} style={{ marginBottom: 16 }}>
                      <Input
                        placeholder={`탭 ${i+1}`}
                        style={{ width: 120 }}
                        value={t.title}
                        onChange={e => {
                          const a = [...tabs];
                          a[i].title = e.target.value;
                          setTabs(a);
                        }}
                      />
                      <Select
                        placeholder="대분류"
                        style={{ width: 140 }}
                        value={t.root}
                        onChange={v => {
                          const a = [...tabs];
                          a[i].root = v;
                          a[i].sub = null;
                          setTabs(a);
                        }}
                      >
                        {roots.map(r => (
                          <Option key={r.category_no} value={String(r.category_no)}>
                            {r.category_name}
                          </Option>
                        ))}
                      </Select>
                      <Select
                        placeholder="소분류"
                        style={{ width: 140 }}
                        value={t.sub}
                        onChange={v => {
                          const a = [...tabs];
                          a[i].sub = v;
                          setTabs(a);
                        }}
                      >
                        {allCats
                          .filter(c => c.category_depth === 2 && String(c.parent_category_no) === t.root)
                          .map(s => (
                            <Option key={s.category_no} value={String(s.category_no)}>
                              {s.category_name}
                            </Option>
                          ))}
                      </Select>
                      <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() => {
                          if (tabs.length > 2) {
                            setTabs(ts => ts.filter((_, idx) => idx !== i));
                          } else {
                            message.warning('최소 2개의 탭은 남아있어야 합니다');
                          }
                        }}
                      />
                    </Space>
                  ))}
                  <Button
                    type="dashed"
                    onClick={() => setTabs([...tabs, { title: '', root: null, sub: null }])}
                    disabled={tabs.length >= 4}
                  >
                    + 탭 추가
                  </Button>
                  <Space style={{ marginTop: 12, alignItems: 'center', gap: 8 }}>
                    <span>활성 탭 색:</span>
                    <Input
                      type="color"
                      value={activeColor}
                      onChange={e => setActiveColor(e.target.value)}
                      style={{ width: 32, height: 32, padding: 0, border: 'none' }}
                    />
                    <span>{activeColor}</span>
                  </Space>
                </Space>
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
                  { label: '단품', value: 'single' },
                  { label: '탭',   value: 'tabs'   },
                ]}
                value={layoutType}
                onChange={val => {
                  setLayoutType(val);
                  setTabs([
                    { title: '', root: null, sub: null },
                    { title: '', root: null, sub: null },
                  ]);
                }}
                block
              />

              {layoutType === 'single' && (
                <div style={{ marginTop: 24 }}>
                  <Button
                    block
                    type={directProducts.length > 0 ? 'primary' : 'dashed'}
                    onClick={() => openMorePrd('direct')}
                  >
                    {directProducts.length > 0
                      ? `상품 ${directProducts.length}개 등록됨`
                      : '상품 직접 등록'}
                  </Button>
                </div>
              )}

              {layoutType === 'tabs' && (
                <div style={{ marginTop: 24 }}>
                  {tabs.map((t, i) => (
                    <Space key={i} style={{ marginBottom: 16, width: '100%', alignItems: 'center' }}>
                      <Input
                        placeholder={`탭 ${i + 1} 제목`}
                        value={t.title}
                        onChange={e => {
                          const a = [...tabs];
                          a[i].title = e.target.value;
                          setTabs(a);
                        }}
                        style={{ flex: 1 }}
                      />
                      <Button
                        block
                        type={(tabDirectProducts[i] || []).length > 0 ? 'primary' : 'dashed'}
                        onClick={() => openMorePrd('tab', i)}
                      >
                        {(tabDirectProducts[i] || []).length > 0
                          ? `상품 ${(tabDirectProducts[i] || []).length}개 등록됨`
                          : '상품 직접 등록'}
                      </Button>
                      <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() => {
                          if (tabs.length > 2) {
                            setTabs(ts => ts.filter((_, idx) => idx !== i));
                          } else {
                            message.warning('최소 2개의 탭은 남아있어야 합니다');
                          }
                        }}
                      />
                    </Space>
                  ))}
                  <Button
                    type="dashed"
                    block
                    onClick={() => setTabs([...tabs, { title: '', root: null, sub: null }])}
                    disabled={tabs.length >= 4}
                  >
                    탭 추가
                  </Button>
                </div>
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
          key={`${morePrdTarget}-${morePrdTabIndex}`}
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

      {/* URL 입력 모달 */}
      <Modal
        title="URL 추가"
        open={urlModalVisible}
        onCancel={() => {
          setPendingBox(null)
          setAddType(null)
          setAddingMode(false)
          setUrlModalVisible(false)
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setPendingBox(null)
            setAddType(null)
            setAddingMode(false)
            setUrlModalVisible(false)
          }}>
            취소
          </Button>,
          <Button key="add" type="primary" onClick={() => {
            addRegion(newValue)
            setUrlModalVisible(false)
          }}>
            등록
          </Button>
        ]}
      >
        <Input
          placeholder="https://example.com"
          value={newValue}
          onChange={e => setNewValue(e.target.value)}
        />
      </Modal>
      {/* 쿠폰 선택 모달 */}
      <Modal
        title="쿠폰 추가"
        open={couponModalVisible}
        onCancel={() => {
          setPendingBox(null)
          setAddType(null)
          setAddingMode(false)
          setCouponModalVisible(false)
        }}
        footer={[
          // 취소
          <Button key="cancel" onClick={() => {
            setPendingBox(null)
            setAddType(null)
            setAddingMode(false)
            setCouponModalVisible(false)
          }}>
            취소
          </Button>,
          // 삭제
          <Button key="delete" danger onClick={() => {
            setPendingBox(null)
            setAddType(null)
            setAddingMode(false)
            setCouponModalVisible(false)
            // (필요하다면 deleteRegion 호출)
          }}>
            삭제
          </Button>,
          // 적용
          <Button key="apply" type="primary" onClick={() => {
            addRegion(newValue)
            setCouponModalVisible(false)
          }}>
            적용
          </Button>
        ]}
      >
        <Select
          mode="multiple"
          options={couponOptions}
          placeholder="쿠폰 선택"
          value={newValue || []}
          onChange={v => setNewValue(v)}
          style={{ width:'100%' }}
        />
      </Modal>
    </Card>
  );
}
