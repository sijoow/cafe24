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
  Grid
} from 'antd';
import {
  InboxOutlined,
  DeleteOutlined,
  PlusOutlined,
  LinkOutlined,
  TagOutlined,
  BlockOutlined
} from '@ant-design/icons';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './EventCreate.css';

const { Step } = Steps;
const { useBreakpoint } = Grid;

export default function EventCreate() {
  const navigate = useNavigate();
  const [msgApi, msgCtx] = message.useMessage();

  const API_BASE =
    process.env.REACT_APP_API_BASE_URL ||
    'https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app';

  // 반응형
  const screens = useBreakpoint();
  const isMobile = screens.sm === false;

  // 새로고침시 sessionStorage 초기화
  useEffect(() => {
    Object.keys(sessionStorage)
      .filter(key => key.startsWith('MorePrd_'))
      .forEach(key => sessionStorage.removeItem(key));
  }, []);

  // Wizard 단계
  const [current, setCurrent] = useState(0);
  const titleRef = useRef(null);
  useEffect(() => {
    if (current === 0) {
      setTimeout(() => titleRef.current?.focus(), 0);
    }
  }, [current]);
  const next = () => {
    if (current === 0) {
      if (!title.trim()) setTitle('제목없음');
      setCurrent(1);
    } else if (current === 1 && images.length === 0) {
      msgApi.warning('이미지를 업로드하세요.');
    } else if (current === 2) {
      if (!registerMode) msgApi.warning('상품 등록 방식을 선택하세요.');
      else if (registerMode === 'category') {
        if (!gridSize) msgApi.warning('그리드 사이즈를 선택해주세요.');
        else if (!layoutType) msgApi.warning('상품 노출 방식을 선택해주세요.');
        else if (layoutType === 'single' && !singleRoot) msgApi.warning('상품 분류(대분류)를 선택하세요.');
        else if (layoutType === 'tabs' && tabs.length < 2) msgApi.warning('탭을 두 개 이상 설정하세요.');
        else setCurrent(3);
      } else {
        setCurrent(3);
      }
    } else {
      setCurrent(c => c + 1);
    }
  };
  const prev = () => setCurrent(c => c - 1);

  // 1) 제목
  const [title, setTitle] = useState('');

  // 2) 이미지 & 매핑
  const [images, setImages] = useState([]); // { id, src, file?, regions: [] }
  const [selectedId, setSelectedId] = useState(null);
  const imgRef = useRef(null);

  const uploadProps = {
    name: 'file',
    accept: 'image/*',
    multiple: false,
    showUploadList: false,
    customRequest: ({ file, onSuccess }) => {
      const reader = new FileReader();
      reader.onload = e => {
        const src = e.target.result;
        const id = Date.now().toString() + Math.random();
        setImages(imgs => {
          const next = [...imgs, { id, src, file, regions: [] }];
          setSelectedId(id);
          return next;
        });
        onSuccess('ok');
      };
      reader.readAsDataURL(file);
    },
  };

  const onDragEnd = result => {
    if (!result.destination) return;
    const a = Array.from(images);
    const [m] = a.splice(result.source.index, 1);
    a.splice(result.destination.index, 0, m);
    setImages(a);
  };

  // 영역 매핑 상태
  const [addingMode, setAddingMode] = useState(false);
  const [addType, setAddType] = useState(null); // 'link' | 'coupon'
  const [pendingRegion, setPendingRegion] = useState(null);
  const [dragStartPos, setDragStart] = useState(null);
  const [dragCurrent, setDragCurrent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const selectedImage = images.find(img => img.id === selectedId);

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
    setPendingRegion({
      id: Date.now().toString(),
      xRatio: x / W,
      yRatio: y / H,
      wRatio: w / W,
      hRatio: h / H,
    });
    setModalVisible(true);
    setDragStart(null);
    setDragCurrent(null);
  };

  const [mapForm] = Form.useForm();

  const saveRegion = () => {
    if (!pendingRegion) return;
    const vals = mapForm.getFieldsValue();
    let updated = { ...pendingRegion };
    if (addType === 'link') {
      let href = (vals.href || '').trim();
      if (!href) return msgApi.error('URL을 입력하세요.');
      if (!/^https?:\/\//.test(href)) href = 'https://' + href;
      updated.href = href;
      delete updated.coupon;
    } else {
      const coupon = (vals.coupon || []).join(',');
      if (!coupon) return msgApi.error('쿠폰을 선택하세요.');
      updated.coupon = coupon;
      delete updated.href;
    }
    setImages(imgs =>
      imgs.map(img =>
        img.id === selectedId
          ? {
              ...img,
              regions: [...img.regions.filter(r => r.id !== updated.id), updated],
            }
          : img
      )
    );
    setModalVisible(false);
    setPendingRegion(null);
  };

  const deleteRegion = () => {
    if (!pendingRegion) {
      setModalVisible(false);
      return;
    }
    setImages(imgs =>
      imgs.map(img =>
        img.id === selectedId
          ? {
              ...img,
              regions: img.regions.filter(r => r.id !== pendingRegion.id),
            }
          : img
      )
    );
    setPendingRegion(null);
    setModalVisible(false);
  };

  const editRegion = region => {
    setSelectedId(selectedId); // ensure image still selected
    setPendingRegion(region);
    setAddType(region.coupon ? 'coupon' : 'link');
    mapForm.setFieldsValue(
      region.coupon
        ? { coupon: region.coupon.split(',') }
        : { href: region.href }
    );
    setModalVisible(true);
  };

  // 3) 카테고리 & 레이아웃
  const [allCats, setAllCats] = useState([]);
  useEffect(() => {
    axios
      .get(`${API_BASE}/api/categories/all`)
      .then(res => setAllCats(res.data))
      .catch(() => msgApi.error('카테고리 불러오기 실패'));
  }, []);

  const [singleRoot, setSingleRoot] = useState(null);
  const [singleSub, setSingleSub] = useState(null);

  const [gridSize, setGridSize]     = useState(2);
  const [layoutType, setLayoutType] = useState(null);

  // 탭 상태
  const [tabs, setTabs] = useState([
    { title: '', root: null, sub: null },
    { title: '', root: null, sub: null },
  ]);
  //탭상품 레이아웃 지정색상
  const [activeColor, setActiveColor] = useState('#fe6326');
  const addTab = () => {
    if (tabs.length >= 4) return;
    const newIndex = tabs.length;
    sessionStorage.removeItem(`MorePrd_tab_${newIndex}_selectedKeys`);
    sessionStorage.removeItem(`MorePrd_tab_${newIndex}_selectedDetails`);
    setTabs(ts => [...ts, { title: '', root: null, sub: null }]);
  };
  const updateTab = (i, key, val) => {
    setTabs(ts => {
      const a = [...ts];
      a[i] = { ...a[i], [key]: val, ...(key === 'root' ? { sub: null } : {}) };
      return a;
    });
  };

  const roots = allCats.filter(c => c.category_depth === 1);
  const subs  = allCats.filter(
    c => c.category_depth === 2 && String(c.parent_category_no) === singleRoot
  );

  // 3-1) 상품 등록 방식
  const [registerMode, setRegisterMode]           = useState('category'); 
  const [directProducts, setDirectProducts]       = useState([]);         
  const [tabDirectProducts, setTabDirectProducts] = useState({});         
  const [initialSelected, setInitialSelected]     = useState([]);

  // 3-2) MorePrd 모달
  const [morePrdVisible, setMorePrdVisible]   = useState(false);
  const [morePrdTarget, setMorePrdTarget]     = useState('direct');
  const [morePrdTabIndex, setMorePrdTabIndex] = useState(0);

  const openMorePrd = (target, tabIndex = 0) => {
    setMorePrdTarget(target);
    if (target === 'direct') {
      setInitialSelected(directProducts.map(p => p.product_no));
    } else {
      setInitialSelected((tabDirectProducts[tabIndex]||[]).map(p => p.product_no));
    }
    setMorePrdTabIndex(tabIndex);
    setMorePrdVisible(true);
  };

  // 4) 쿠폰 목록
  const [couponOptions, setCouponOptions] = useState([]);
  useEffect(() => {
    axios
      .get(`${API_BASE}/api/coupons`)
      .then(res =>
        setCouponOptions(
          res.data.map(c => ({
            value: c.coupon_no,
            label: `${c.coupon_name} (${c.benefit_percentage}%)`,
          }))
        )
      )
      .catch(() => msgApi.error('쿠폰 불러오기 실패'));
  }, []);

  const tagRender = ({ label, closable, onClose }) => (
    <Tag closable={closable} onClose={onClose} style={{ marginRight: 3 }}>
      {String(label).length > 6 ? String(label).slice(0, 6) + '…' : label}
    </Tag>
  );

  // 5) 최종 제출
  const handleSubmit = async () => {
    try {
      const uploaded = await Promise.all(
        images.map(async img => {
          if (img.file) {
            const form = new FormData();
            form.append('file', img.file);
            const { data } = await axios.post(
              `${API_BASE}/api/uploads/image`,
              form,
              { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            return { ...img, src: data.url, file: undefined };
          }
          return img;
        })
      );

      const payload = {
        title,
        images: uploaded.map(img => ({
          _id: img.id,
          src: img.src,
          regions: img.regions.map(r => ({
            _id:    r.id,
            xRatio: r.xRatio,
            yRatio: r.yRatio,
            wRatio: r.wRatio,
            hRatio: r.hRatio,
            href:   r.href,
            coupon: r.coupon,
          })),
        })),
        gridSize,
        layoutType,
        classification: {
          ...(layoutType === 'single'
            ? { root: singleRoot, sub: singleSub }
            : { tabs, activeColor }),
          registerMode,
          ...(registerMode === 'direct' && layoutType === 'single'
            ? { directProducts }
            : {}),
          ...(registerMode === 'direct' && layoutType === 'tabs'
            ? { tabDirectProducts }
            : {}),
        }
      };
      await axios.post(`${API_BASE}/api/events`, payload);
      msgApi.success('이벤트 생성 완료');
      navigate('/event/list');
    } catch (e) {
      console.error(e);
      msgApi.error('이벤트 등록 실패');
    }
  };

  return (
    <>
      {msgCtx}
      <Card
        title="이벤트 만들기 & 영역 매핑"
        className="event-create-card"
        style={{
          width: isMobile ? '100%' : 1600,
          margin: '0 auto',
          padding: isMobile ? 8 : 24,
        }}
      >
        <Steps
          current={current}
          size={isMobile ? 'small' : 'default'}
          direction={isMobile ? 'vertical' : 'horizontal'}
          style={{ marginBottom: 24 }}
        >
          <Step title="제목 입력" />
          <Step title="이미지 업로드" />
          <Step title="상품등록 방식 설정" />
          <Step title="확인 & 등록" />
        </Steps>

        {/* Step 1: 제목 입력 */}
        {current === 0 && (
          <Input
            ref={titleRef}
            placeholder="이벤트 제목을 입력하세요"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        )}

        {/* Step 2: 이미지 업로드 & 매핑 */}
        {current === 1 && (
          <>
            <Upload.Dragger
              {...uploadProps}
              className="dragger"
              style={{
                width: '100%',
                padding: isMobile ? 12 : 24,
              }}
            >
              <p><InboxOutlined style={{ fontSize: 24 }} /></p>
              <p>이미지를 드래그 또는 클릭하여 업로드</p>
            </Upload.Dragger>

            {/* URL/쿠폰 추가 버튼 */}
            <Space style={{ margin: '12px 0' }}>
              <Button
                icon={<LinkOutlined />}
                type={addingMode && addType==='link' ? 'primary' : 'default'}
                onClick={() => {
                  if (!selectedImage) {
                    msgApi.warning('이미지를 선택한 후 추가 가능합니다.');
                    return;
                  }
                  setAddType('link');
                  setAddingMode(true);
                }}
              >
                URL 추가
              </Button>
              <Button
                icon={<TagOutlined />}
                type={addingMode && addType==='coupon' ? 'primary' : 'default'}
                onClick={() => {
                  if (!selectedImage) {
                    msgApi.warning('이미지를 선택한 후 추가 가능합니다.');
                    return;
                  }
                  setAddType('coupon');
                  setAddingMode(true);
                }}
              >
                쿠폰 추가
              </Button>
            </Space>

            {images.length > 0 && (
              <>
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="thumbs" direction="horizontal">
                    {prov => (
                      <div
                        ref={prov.innerRef}
                        {...prov.droppableProps}
                        className="thumb-list"
                        style={{
                          display: 'flex',
                          flexDirection: isMobile ? 'column' : 'row',
                          gap: 8,
                          overflowX: isMobile ? 'hidden' : 'auto',
                          marginTop: 16,
                        }}
                      >
                        {images.map((img, idx) => (
                          <Draggable key={img.id} draggableId={img.id} index={idx}>
                            {p => (
                              <div
                                ref={p.innerRef}
                                {...p.draggableProps}
                                {...p.dragHandleProps}
                                className={`thumb-item ${img.id === selectedId ? 'active' : ''}`}
                                onClick={() => setSelectedId(img.id)}
                              >
                                <img src={img.src} alt="썸네일" />
                                <DeleteOutlined
                                  className="thumb-delete"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setImages(imgs => imgs.filter(i => i.id !== img.id));
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

                <div
                  className="mapping-container"
                  ref={imgRef}
                  onMouseDown={addingMode ? onMouseDown : undefined}
                  onMouseMove={addingMode ? onMouseMove : undefined}
                  onMouseUp={addingMode ? onMouseUp : undefined}
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    marginTop: 16,
                    cursor: addingMode ? 'crosshair' : 'default',
                  }}
                >
                  <img
                    src={selectedImage?.src}
                    alt=""
                    className="mapping-image"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      userSelect: 'none',
                    }}
                    draggable={false}
                  />

                  {dragStartPos && dragCurrent && (
                    <div
                      className="drag-box"
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

                  {selectedImage?.regions.map(r => {
                    const base = {
                      position: 'absolute',
                      left: `${(r.xRatio * 100).toFixed(2)}%`,
                      top: `${(r.yRatio * 100).toFixed(2)}%`,
                      width: `${(r.wRatio * 100).toFixed(2)}%`,
                      height: `${(r.hRatio * 100).toFixed(2)}%`,
                      cursor: 'pointer',
                    };
                    const style = r.coupon
                      ? {
                          ...base,
                          border: '2px dashed #ff6347',
                          background: 'rgba(255,99,71,0.2)',
                        }
                      : {
                          ...base,
                          border: '2px dashed #1890ff',
                          background: 'rgba(24,144,255,0.2)',
                        };
                    return r.coupon ? (
                      <button
                        key={r.id}
                        style={style}
                        onClick={e => {
                          e.stopPropagation();
                          editRegion(r);
                        }}
                      />
                    ) : (
                      <a
                        key={r.id}
                        style={style}
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          editRegion(r);
                        }}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}

        {/* Step 3: 레이아웃 구성 & 상품 등록 방식 */}
        {current === 2 && (
          <>
            <h4>상품 등록 방식</h4>
            <Segmented
              options={[
                { label: '카테고리 상품 등록', value: 'category' },
                { label: '직접 상품 등록',   value: 'direct'   },
                { label: '노출안함',         value: 'none'     },
              ]}
              value={registerMode}
              onChange={setRegisterMode}
              block={isMobile}
              style={{ marginBottom: 24 }}
            />

            {/* 카테고리 상품 등록 */}
            {registerMode === 'category' && (
              <>
                <h4>1) 그리드 사이즈</h4>
                <Space wrap style={{ gap: 8, marginBottom: 24 }}>
                  {[2,3,4].map(n => (
                    <Button
                      key={n}
                      block={isMobile}
                      style={{ flex: isMobile ? 'none' : 1 }}
                      type={gridSize === n ? 'primary' : 'default'}
                      onClick={() => setGridSize(n)}
                    >
                      {n}×{n}
                    </Button>
                  ))}
                </Space>

                <h4 style={{ marginBottom: 16 }}>2) 노출 방식</h4>
                <Segmented
                  options={[
                    { label: '단품상품', value: 'single' },
                    { label: '탭상품',   value: 'tabs'   },
                  ]}
                  value={layoutType}
                  onChange={val => {
                    setLayoutType(val);
                    setSingleRoot(null);
                    setSingleSub(null);
                    setTabs([
                      { title:'', root:null, sub:null },
                      { title:'', root:null, sub:null },
                    ]);
                    setActiveColor('#fe6326');
                  }}
                  block={isMobile}
                />

                {layoutType === 'single' && (
                  <div style={{ marginTop: 24 }}>
                    <Select
                      placeholder="대분류"
                      style={{ width: '100%', maxWidth: 300, marginBottom: 16 }}
                      value={singleRoot}
                      onChange={setSingleRoot}
                    >
                      {roots.map(r => (
                        <Select.Option key={r.category_no} value={String(r.category_no)}>
                          {r.category_name}
                        </Select.Option>
                      ))}
                    </Select>
                    {subs.length > 0 && (
                      <Select
                        placeholder="소분류"
                        style={{ width: '100%', maxWidth: 300 }}
                        value={singleSub}
                        onChange={setSingleSub}
                      >
                        {subs.map(s => (
                          <Select.Option key={s.category_no} value={String(s.category_no)}>
                            {s.category_name}
                          </Select.Option>
                        ))}
                      </Select>
                    )}
                  </div>
                )}

                {layoutType === 'tabs' && (
                  <div style={{ marginTop: 24 }}>
                    {tabs.map((t, i) => (
                      <Space
                        key={i}
                        direction={isMobile ? 'vertical' : 'horizontal'}
                        style={{ marginBottom: 16, width: '100%', alignItems: 'center' }}
                      >
                        <Input
                          placeholder={`탭 ${i + 1} 제목`}
                          value={t.title}
                          onChange={e => updateTab(i, 'title', e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <Select
                          placeholder="대분류"
                          style={{ width: isMobile ? '100%' : 150 }}
                          value={t.root}
                          onChange={v => updateTab(i, 'root', v)}
                        >
                          {roots.map(r => (
                            <Select.Option key={r.category_no} value={String(r.category_no)}>
                              {r.category_name}
                            </Select.Option>
                          ))}
                        </Select>
                        <Select
                          placeholder="소분류"
                          style={{ width: isMobile ? '100%' : 150 }}
                          value={t.sub}
                          onChange={v => updateTab(i, 'sub', v)}
                        >
                          {allCats
                            .filter(c => c.category_depth === 2 && String(c.parent_category_no) === t.root)
                            .map(s => (
                              <Select.Option key={s.category_no} value={String(s.category_no)}>
                                {s.category_name}
                              </Select.Option>
                            ))}
                        </Select>
                        {tabs.length >= 3 && (
                          <DeleteOutlined
                            onClick={() =>
                              setTabs(ts => ts.filter((_, idx) => idx !== i))
                            }
                            style={{ color: activeColor, fontSize: 14, cursor: 'pointer' }}
                          />
                        )}
                      </Space>
                    ))}
                    <Button
                      type="dashed"
                      block
                      onClick={addTab}
                      disabled={tabs.length >= 4}
                      style={{ marginBottom: 16 }}
                    >
                      + 탭 추가
                    </Button>
                    <Space style={{ alignItems: 'center', gap: 8 }}>
                      <span>활성 탭 색:</span>
                      <Input
                        type="color"
                        value={activeColor}
                        onChange={e => setActiveColor(e.target.value)}
                        style={{ width: 40, height: 32, padding: 0, border: 'none' }}
                      />
                      <span>{activeColor}</span>
                    </Space>
                  </div>
                )}
              </>
            )}

            {/* 직접 상품 등록 */}
            {registerMode === 'direct' && (
              <>
                <h4>1) 그리드 사이즈</h4>
                <Space wrap style={{ gap: 8, marginBottom: 24 }}>
                  {[2,3,4].map(n => (
                    <Button
                      key={n}
                      block={isMobile}
                      style={{ flex: isMobile ? 'none' : 1 }}
                      type={gridSize === n ? 'primary' : 'default'}
                      onClick={() => setGridSize(n)}
                    >
                      {n}×{n}
                    </Button>
                  ))}
                </Space>

                <h4 style={{ marginBottom: 16 }}>2) 노출 방식</h4>
                <Segmented
                  options={[
                    { label: '단품상품', value: 'single' },
                    { label: '탭상품',   value: 'tabs'   },
                  ]}
                  value={layoutType}
                  onChange={val => {
                    setLayoutType(val);
                    setTabs([
                      { title: '', root: null, sub: null },
                      { title: '', root: null, sub: null },
                    ]);
                  }}
                  block={isMobile}
                />

                {layoutType === 'single' && (
                  <div style={{ marginTop: 24 }}>
                    <Button
                      block={isMobile}
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
                      <Space
                        key={i}
                        direction={isMobile ? 'vertical' : 'horizontal'}
                        style={{ marginBottom: 16, width: '100%', alignItems: 'center' }}
                      >
                        <Input
                          placeholder={`탭 ${i + 1} 제목`}
                          value={t.title}
                          onChange={e => updateTab(i, 'title', e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <Button
                          type={(tabDirectProducts[i] || []).length > 0 ? 'primary' : 'default'}
                          onClick={() => openMorePrd('tab', i)}
                        >
                          {(tabDirectProducts[i] || []).length > 0
                            ? `상품 ${(tabDirectProducts[i] || []).length}개 등록됨`
                            : '상품 직접 등록'}
                        </Button>
                        {tabs.length > 2 && (
                          <DeleteOutlined
                            onClick={() =>
                              setTabs(ts => ts.filter((_, idx) => idx !== i))
                            }
                            style={{ color: '#fe6326', fontSize: 14, cursor: 'pointer' }}
                          />
                        )}
                      </Space>
                    ))}
                    <Button
                      type="dashed"
                      block
                      onClick={addTab}
                      disabled={tabs.length >= 4}
                    >
                      탭 추가
                    </Button>
                    {/* 탭 색상 선택 UI 추가 */}
                    <Space style={{ marginTop: 16, alignItems: 'center', gap: 8 }}>
                      <span>활성 탭 색:</span>
                      <Input
                        type="color"
                        value={activeColor}
                        onChange={e => setActiveColor(e.target.value)}
                        style={{ width: 40, height: 32, padding: 0, border: 'none' }}
                      />
                      <span>{activeColor}</span>
                    </Space>                   
                  </div>
                )}
              </>
            )}

            {/* 노출안함 */}
            {registerMode === 'none' && (
              <div style={{ textAlign:'left', color:'#fe6326', padding:'5px 5px' }}>
                상품을 노출하지 않습니다.
              </div>
            )}
          </>
        )}

        {/* Step 4: 미리보기 & 등록 */}
        {current === 3 && (
          <div style={{ marginTop: 24 }}>
            <h4>미리보기</h4>
            <div
              style={{
                display: 'grid',
                maxWidth:'800px',
                margin:'0 auto',
                gap: 16,
              }}
            >
              {images.map(img => (
                <img
                  key={img.id}
                  src={img.src}
                  alt="미리보기"
                  style={{ width: '100%', height: 'auto' }}
                />
              ))}
            </div>

            {layoutType === 'single' && (
              <div style={{ marginTop: 24 }}>{renderGrid(gridSize)}</div>
            )}
            {layoutType === 'tabs' && (
              <div style={{ margin:'24px auto' ,maxWidth:800}}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  {tabs.map((t, i) => (
                    <Button
                      key={i}
                      style={{
                        flex: 1,
                        background: i === 0 ? activeColor : undefined,
                        color: i === 0 ? '#fff' : undefined,
                      }}
                    >
                      {t.title || `탭${i + 1}`}
                    </Button>
                  ))}
                </div>
                {renderGrid(gridSize)}
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <Button type="primary" size="large" onClick={handleSubmit} block={isMobile}>
                이벤트 등록
              </Button>
            </div>
          </div>
        )}

        {/* 이전/다음 버튼 */}
        <Space
          direction={isMobile ? 'vertical' : 'horizontal'}
          style={{ marginTop: 24, width: '100%', justifyContent: 'space-between' }}
        >
          {current > 0 && <Button onClick={prev} block={isMobile}>이전</Button>}
          {current < 3 && <Button type="primary" onClick={next} block={isMobile}>다음</Button>}
        </Space>

        {/* 5) 영역 설정 모달 */}
        <Modal
          open={modalVisible}
          title={addType === 'link' ? 'URL 영역 설정' : '쿠폰 영역 설정'}
          onCancel={() => {
            setModalVisible(false);
            setPendingRegion(null);
            setAddingMode(false);
          }}
          footer={[
            pendingRegion && (
              <Button
                key="delete"
                danger
                onClick={() => {
                  deleteRegion();
                  setAddingMode(false);
                }}
              >
                삭제
              </Button>
            ),
            <Button
              key="cancel"
              onClick={() => {
                setModalVisible(false);
                setPendingRegion(null);
                setAddingMode(false);
              }}
            >
              취소
            </Button>,
            <Button
              key="ok"
              type="primary"
              onClick={() => {
                saveRegion();
                setAddingMode(false);
              }}
            >
              확인
            </Button>,
          ]}
          width={isMobile ? '90%' : 600}
        >
          <Form form={mapForm} layout="vertical">
            {addType === 'link' ? (
              <Form.Item
                name="href"
                label="URL"
                rules={[{ required: true, message: 'URL을 입력해주세요.' }]}
              >
                <Input placeholder="https://example.com" />
              </Form.Item>
            ) : (
              <Form.Item
                name="coupon"
                label="쿠폰 선택"
                rules={[{ required: true, message: '쿠폰을 선택해주세요.' }]}
              >
                <Select
                  mode="multiple"
                  options={couponOptions}
                  tagRender={tagRender}
                  placeholder="쿠폰을 선택하세요"
                />
              </Form.Item>
            )}
          </Form>
        </Modal>
      </Card>

      {/* MorePrd 모달 */}
      {morePrdVisible && (
        <MorePrd
          key={`${morePrdTarget}-${morePrdTabIndex}`}
          visible={morePrdVisible}
          target={morePrdTarget}
          tabIndex={morePrdTabIndex}
          initialSelected={morePrdTarget === 'direct'
            ? directProducts.map(p => p.product_no)
            : (tabDirectProducts[morePrdTabIndex] || []).map(p => p.product_no)
          }
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
    </>
  );
}

// 그리드 미리보기 헬퍼
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
        {/* 텍스트 대신 아이콘 */}
        <BlockOutlined  style={{ fontSize: 30}} />
      </div>
    ))}
    </div>
  );
}
