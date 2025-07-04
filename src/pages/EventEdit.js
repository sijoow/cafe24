// src/pages/EventEdit.jsx

import React, { useState, useEffect, useRef } from 'react';
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
if (process.env.NODE_ENV === 'development') {
  axios.defaults.baseURL = 'https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app/';
  
}
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
  const [gridSize, setGridSize] = useState(2);
  const [layoutType, setLayoutType] = useState('single');

  // ── 카테고리 & 탭 상태 ─────────────────────────────────────────
  const [allCats, setAllCats] = useState([]);
  const [singleRoot, setSingleRoot] = useState(null);
  const [singleSub, setSingleSub] = useState(null);
  const [tabs, setTabs] = useState([
    { title: '', root: null, sub: null },
    { title: '', root: null, sub: null },
  ]);
  const [activeColor, setActiveColor] = useState('#1890ff');
  const roots = allCats.filter(c => c.category_depth === 1);
  const subs = allCats.filter(
    c => c.category_depth === 2 && String(c.parent_category_no) === singleRoot
  );

  // ── 드래그 매핑 ───────────────────────────────────────────────
  const [addingMode, setAddingMode] = useState(false);
  const [addType, setAddType] = useState(null); // 'url' | 'coupon'
  const [dragStart, setDragStart] = useState(null);
  const [dragBox, setDragBox] = useState(null);
  const [pendingBox, setPendingBox] = useState(null);

  // ── URL/Coupon 추가 모달 ─────────────────────────────────────
  const [newValue, setNewValue] = useState('');
  const [urlModalVisible, setUrlModalVisible] = useState(false);
  const [couponModalVisible, setCouponModalVisible] = useState(false);

  // ── 쿠폰 옵션 & 편집 폼 ─────────────────────────────────────────
  const [couponOptions, setCouponOptions] = useState([]);
  const [editingForm] = Form.useForm();
  const [editingIndex, setEditingIndex] = useState(null);

  // ── 초기 데이터 로드 ───────────────────────────────────────────
  useEffect(() => {
    axios.get('https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app/api/categories/all')
      .then(res => setAllCats(res.data))
      .catch(() => message.error('카테고리 로드 실패'));

    axios.get('https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app/api/coupons')
      .then(res => setCouponOptions(res.data.map(c => ({
        value: c.coupon_no,
        label: `${c.coupon_name} (${c.benefit_percentage}%)`
      }))))
      .catch(() => message.error('쿠폰 로드 실패'));

    axios.get(`https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app/api/events/${id}`)
      .then(res => {
        const ev = res.data;
        setDocId(ev._id);
        setTitle(ev.title);
        setGridSize(ev.gridSize);
        setLayoutType(ev.layoutType);
        if (ev.layoutType === 'single') {
          setSingleRoot(ev.categoryRoot);
          setSingleSub(ev.categorySub);
        } else {
          setTabs(ev.classification.tabs);
          setActiveColor(ev.classification.activeColor);
        }
        setImages((ev.images || []).map(img => ({
          id:  String(img._id), 
          src: img.src,
          regions: (img.regions || []).map(r => ({ ...r, id: r._id })),
        })));
      })
      .catch(() => {
        message.error('이벤트 로드 실패');
        navigate('/event/list');
      });
  }, [id, navigate]);

  // ── replaceImage: 서버에 업로드하고 R2 URL로 교체 ──────────────────
  const replaceImage = async (idx, file, onSuccess) => {
    const form = new FormData();
    form.append('file', file);

    try {
      const res = await axios.post(
        '/api/uploads/image',
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      const newUrl = res.data.url;
      setImages(imgs => {
        const a = [...imgs];
        a[idx].src = newUrl;
        return a;
      });
      onSuccess('ok');
      message.success('이미지 교체 완료');
    } catch (err) {
      console.error('이미지 교체 실패', err);
      message.error('이미지 교체에 실패했습니다.');
    }
  };

  // ── 드래그 시작/이동/끝 ─────────────────────────────────────────
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

  // ── 영역 추가 함수 ─────────────────────────────────────────────
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

  // ── 편집/삭제 ──────────────────────────────────────────────────
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
  const onEditRegion = idx => {
    setEditingIndex(idx);
    editingForm.setFieldsValue(images[selectedIdx].regions[idx]);
  };
    const deleteImage = async (idx, imageId) => {
      if (images.length === 1) {
        return message.warning('최소 1장 필요');
      }
  
      // 새로 추가한(저장되지 않은) 이미지인 경우: 바로 UI에서만 제거
      if (!/^[0-9a-fA-F]{24}$/.test(imageId)) {
        setImages(imgs => imgs.filter((_, i) => i !== idx));
        setSelectedIdx(0);
        return message.success('이미지 삭제 완료');
      }
  
      try {
        // 기존에 저장된 이미지인 경우만 API 호출
        await axios.delete(`/api/events/${id}/images/${imageId}`);
        setImages(imgs => imgs.filter((_, i) => i !== idx));
        setSelectedIdx(0);
        message.success('이미지 삭제 완료');
      } catch (err) {
        console.error('이미지 삭제 실패', err);
        message.error('이미지 삭제 실패');
      }
    };



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
  // ── 저장 ───────────────────────────────────────────────────────
  const handleSave = async () => {
    // (0) id 파라미터와 state에 저장된 docId 확인
    console.log('🔍 route param id:', id);
    console.log('🔍 state docId:', docId);

    if (!id) {
      message.error('이벤트 ID가 없습니다');
      return;
    }

    const payload = {
      title,
      gridSize,
      layoutType,
      categoryRoot: layoutType === 'single' ? singleRoot : null,
      categorySub:  layoutType === 'single' ? singleSub  : null,
      classification:
        layoutType === 'single'
          ? { root: singleRoot, sub: singleSub }
          : { tabs, activeColor },
      images: images.map(img => ({
        _id:    img.id,
        src:    img.src,
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
    };

    try {
      // (1) PUT 요청 직전 URL/페이로드 로깅
       console.log(
           '▶️ PUT →',
           axios.defaults.baseURL + `/api/events/${id}`,
           payload
         );

      // (2) 실제 요청
      const res = await axios.put(`/api/events/${id}`, payload);

      // (3) 성공 로그 & 화면 이동
      console.log('✔️ 업데이트 성공:', res.data);
      message.success('수정이 완료되었습니다');
      navigate(`/event/detail/${id}`);
    } catch (err) {
      // (4) 실패 로그
      console.error('❌ 업데이트 실패:', err.response?.data || err.message);
      const msg = err.response?.data?.error || err.message;
      message.error(`저장에 실패했습니다: ${msg}`);
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
        <Step title="레이아웃 구성" />
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
          {/* 썸네일 리스트 */}
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="thumbs" direction="horizontal">
              {prov => (
                <div
                  ref={prov.innerRef}
                  {...prov.droppableProps}
                  style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '8px 0' }}
                >
                  {images.map((img, idx) => (
                    <Draggable key={img.id} draggableId={img.id} index={idx}>
                      {p => (
                        <div
                          ref={p.innerRef}
                          {...p.draggableProps}
                          {...p.dragHandleProps}
                          style={{
                            position: 'relative',
                            border:
                              idx === selectedIdx ? `2px solid ${activeColor}` : '1px solid #ddd',
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
                          <div
                            style={{ position: 'absolute', top: 4, right: 4, display: 'flex', gap: 4 }}
                          >
                            <Upload
                              accept="image/*"
                              showUploadList={false}
                              customRequest={({ file, onSuccess }) =>
                                replaceImage(idx, file, onSuccess)
                              }
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
                    customRequest={async ({ file, onSuccess }) => {
                      const form = new FormData();
                      form.append('file', file);

                      try {
                        const res = await axios.post(
                          '/api/uploads/image',
                          form,
                          { headers: { 'Content-Type': 'multipart/form-data' } }
                        );
                        const src = res.data.url;
                        const newId = Date.now().toString();
                        setImages(imgs => [...imgs, { id: newId, src, regions: [] }]);
                        setSelectedIdx(images.length);
                        onSuccess('ok');
                        message.success('이미지 추가 완료');
                      } catch (err) {
                        console.error('이미지 업로드 실패:', err);
                        message.error('이미지 업로드 실패');
                      }
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

          {/* URL / 쿠폰 추가 버튼 */}
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
              onClick={() => { setAddType('coupon'); setAddingMode(true); }}
            >
              쿠폰 추가
            </Button>
          </Space>

          {/* 매핑 영역 */}
          <div
            className="mapping-container"
            style={{ position: 'relative', cursor: addingMode ? 'crosshair' : 'default' }}
            ref={imgRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
          >
            <img
              src={images[selectedIdx]?.src}
              alt=""
              style={{ width: '100%', maxWidth: 800 }}
              draggable={false}
            />
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
            {images[selectedIdx]?.regions.map((r, i) => (
              <Popover
                key={r.id}
                trigger="click"
                placement="topLeft"
                open={editingIndex === i}
                onOpenChange={open => {
                  if (open) {
                    setEditingIndex(i);
                    editingForm.setFieldsValue(r);
                  } else {
                    editingForm.resetFields();
                    setEditingIndex(null);
                  }
                }}
                content={(
                  <Form
                    form={editingForm}
                    initialValues={r}
                    onFinish={vals => saveRegion(i, vals)}
                    layout="vertical"
                    style={{ padding: 16 }}
                  >
                    {r.coupon ? (
                      <Form.Item name="coupon" label="쿠폰 선택" rules={[{ required: true }]}>
                        <Select mode="multiple" options={couponOptions} placeholder="쿠폰 번호 선택" />
                      </Form.Item>
                    ) : (
                      <Form.Item name="href" label="링크(URL)" rules={[{ required: true }]}>
                        <Input placeholder="https://..." />
                      </Form.Item>
                    )}
                    <Form.Item>
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Button htmlType="submit" type="primary" block>적용</Button>
                        <Button block danger onClick={() => deleteRegion(i)}>삭제</Button>
                      </Space>
                    </Form.Item>
                  </Form>
                )}
              >
                <div
                  className="mapping-region"
                  style={{
                    position: 'absolute',
                    left: `${(r.xRatio * 100).toFixed(2)}%`,
                    top:  `${(r.yRatio * 100).toFixed(2)}%`,
                    width:`${(r.wRatio * 100).toFixed(2)}%`,
                    height:`${(r.hRatio * 100).toFixed(2)}%`,
                    border: r.coupon
                      ? '2px dashed rgba(255,99,71,0.7)'
                      : '2px dashed rgba(24,144,255,0.7)',
                    background: r.coupon
                      ? 'rgba(255,99,71,0.2)'
                      : 'rgba(24,144,255,0.2)',
                    cursor: 'pointer',
                  }}
                  onClick={e => { e.stopPropagation(); onEditRegion(i); }}
                />
              </Popover>
            ))}
          </div>
        </>
      )}

      {/* Step 3: 레이아웃 구성 */}
      {current === 2 && (
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
              { label: '탭',  value: 'tabs' },
              { label: '노출안함', value: 'none' },
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
            }}
          />

          {layoutType === 'single' && (
            <Space style={{ marginTop: 24 }}>
              <Select
                placeholder="대분류"
                style={{ width:180 }}
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
                  style={{ width:180 }}
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
            <Space direction="vertical" style={{ marginTop:24, width:'100%' }}>
              {tabs.map((t,i) => (
                <Space key={i} style={{ marginBottom:16 }}>
                  <Input
                    placeholder={`탭 ${i+1}`}
                    style={{ width:120 }}
                    value={t.title}
                    onChange={e => {
                      const a=[...tabs]; a[i].title=e.target.value; setTabs(a);
                    }}
                  />
                  <Select
                    placeholder="대분류"
                    style={{ width:140 }}
                    value={t.root}
                    onChange={v => {
                      const a=[...tabs]; a[i].root=v; a[i].sub=null; setTabs(a);
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
                    style={{ width:140 }}
                    value={t.sub}
                    onChange={v => {
                      const a=[...tabs]; a[i].sub=v; setTabs(a);
                    }}
                  >
                    {allCats
                      .filter(c => c.category_depth===2 && String(c.parent_category_no)===t.root)
                      .map(s => (
                        <Option key={s.category_no} value={String(s.category_no)}>
                          {s.category_name}
                        </Option>
                      ))}
                  </Select>
                </Space>
              ))}
              <Button
                type="dashed"
                onClick={() => setTabs([...tabs, { title:'', root:null, sub:null }])}
                disabled={tabs.length >= 4}
              >
                + 탭 추가
              </Button>
              <Space style={{ marginTop:12, alignItems:'center', gap:8 }}>
                <span>활성 탭 색:</span>
                <Input
                  type="color"
                  value={activeColor}
                  onChange={e => setActiveColor(e.target.value)}
                  style={{ width:32, height:32, padding:0, border:'none' }}
                />
                <span>{activeColor}</span>
              </Space>
            </Space>
          )}
        </>
      )}

      {/* URL 입력 모달 */}
      <Modal
        title="URL 추가"
        open={urlModalVisible}
        onOk={() => { addRegion(newValue); setUrlModalVisible(false); }}
        onCancel={() => {
          setPendingBox(null);
          setAddType(null);
          setAddingMode(false);
          setUrlModalVisible(false);
        }}
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
        onOk={() => { addRegion(newValue); setCouponModalVisible(false); }}
        onCancel={() => {
          setPendingBox(null);
          setAddType(null);
          setAddingMode(false);
          setCouponModalVisible(false);
        }}
      >
        <Select
          options={couponOptions}
          style={{ width:'100%' }}
          placeholder="쿠폰 선택"
          value={newValue}
          onChange={v => setNewValue(v)}
        />
      </Modal>
    </Card>
  );
}
