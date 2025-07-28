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
  const [docId, setDocId]           = useState(null);
  const [title, setTitle]           = useState('');
  const [images, setImages]         = useState([]);
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
        setRegisterMode(ev.classification.registerMode || 'category');

        if (ev.classification.registerMode === 'direct') {
          if (ev.layoutType === 'single') {
            setDirectProducts(ev.classification.directProducts || []);
          } else {
            setTabDirectProducts(ev.classification.tabDirectProducts || {});
          }
        }

        if (ev.layoutType === 'single') {
          setSingleRoot(ev.classification.root != null
            ? String(ev.classification.root)
            : null
          );
          setSingleSub(ev.classification.sub != null
            ? String(ev.classification.sub)
            : null
          );
        } else {
          const incomingTabs = ev.classification.tabs;
          setTabs(
            Array.isArray(incomingTabs)
              ? incomingTabs.map(t => ({
                  title: String(t.title),
                  root:  t.root  != null ? String(t.root) : null,
                  sub:   t.sub   != null ? String(t.sub)  : null,
                }))
              : [
                  { title: '', root: null, sub: null },
                  { title: '', root: null, sub: null },
                ]
          );
          setActiveColor(ev.classification.activeColor || '#1890ff');
        }

        setImages(
          (ev.images || []).map(img => ({
            id:      img._id,
            src:     img.src,
            regions: img.regions.map(r => ({ ...r, id: r._id }))
          }))
        );
      })
      .catch(() => {
        message.error('이벤트 로드 실패');
        navigate(`/${mallId}/event/list`);
      });
  }, [mallId, id, navigate]);

  // 이미지 교체
  const replaceImage = (idx, file, onSuccess) => {
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target.result;
      setImages(imgs => {
        const a = [...imgs];
        a[idx] = { ...a[idx], src: dataUrl, file };
        return a;
      });
      onSuccess();
      message.success('미리보기 등록 완료');
    };
    reader.readAsDataURL(file);
  };

  // 매핑 핸들러
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
    if (dragBox) {
      setPendingBox(dragBox);
      if (addType === 'url')    setUrlModalVisible(true);
      if (addType === 'coupon') setCouponModalVisible(true);
    }
    setDragStart(null);
    setDragBox(null);
  };
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
      ...(addType==='url'    ? { href: value }   : {}),
      ...(addType==='coupon' ? { coupon: value } : {}),
    };
    setImages(imgs => {
      const a = [...imgs];
      a[selectedIdx].regions.push(newR);
      return a;
    });
    setAddingMode(false);
    setAddType(null);
    setPendingBox(null);
    setNewValue(null);
    message.success(addType === 'url' ? 'URL 추가됨' : '쿠폰 추가됨');
  };

  // 영역 편집/삭제
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

  // 이미지 순서 변경
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

  // 이미지 삭제
  const deleteImage = idx => {
    if (images.length === 1) {
      return message.warning('최소 1장 필요');
    }
    const remaining = images.filter((_, i) => i !== idx);
    setImages(remaining);
    setSelectedIdx(0);
    message.success('이미지 삭제 완료');
  };

  // 저장
  const handleSave = async () => {
    try {
      const uploaded = await Promise.all(
        images.map(async img => {
          if (img.file) {
            const form = new FormData();
            form.append('file', img.file);
            const { data } = await api.post(
              `/api/${mallId}/uploads/image`,
              form,
              { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            return { ...img, src: data.url };
          }
          return img;
        })
      );

      const payload = {
        title,
        content: '',
        gridSize,
        layoutType,
        classification: {
          registerMode,
          ...(registerMode==='category'&&layoutType==='single'&&{ root: singleRoot, sub: singleSub }),
          ...(registerMode==='category'&&layoutType==='tabs'  &&{ tabs, activeColor }),
          ...(registerMode==='direct'  &&layoutType==='single'&&{ directProducts }),
          ...(registerMode==='direct'  &&layoutType==='tabs'  &&{ tabDirectProducts, tabs, activeColor }),
        },
        images: uploaded.map(img => ({
          _id:     img.id,
          src:     img.src,
          regions: img.regions.map(r => ({
            _id:    r.id,
            xRatio: r.xRatio,
            yRatio: r.yRatio,
            wRatio: r.wRatio,
            hRatio: r.hRatio,
            href:   r.href,
            coupon: r.coupon,
          }))
        })),
      };

      await api.put(`/api/${mallId}/events/${id}`, payload);
      message.success('저장 완료');
      navigate(`/${mallId}/event/detail/${id}`);
    } catch (err) {
      console.error(err);
      message.error('저장 실패');
    }
  };

  return (
    <Card
      title="이벤트 수정"
      extra={
        <Space>
          <Button icon={<UnorderedListOutlined />} onClick={() => navigate(`/${mallId}/event/list`)}>
            목록
          </Button>
          <Button onClick={() => navigate(`/${mallId}/event/detail/${docId}`)}>
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
        <Step title="이미지 매핑" />
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
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="thumbs" direction="horizontal">
              {prov => (
                <div
                  ref={prov.innerRef}
                  {...prov.droppableProps}
                  style={{ display:'flex', gap:8, overflowX:'auto', padding:'8px 0' }}
                >
                  {images.map((img, idx) => (
                    <Draggable key={img.id} draggableId={img.id} index={idx}>
                      {p => (
                        <div
                          ref={p.innerRef}
                          {...p.draggableProps}
                          {...p.dragHandleProps}
                          style={{
                            position:'relative',
                            border: idx===selectedIdx ? `2px solid ${activeColor}` : '1px solid #ddd',
                            borderRadius:4,
                            ...p.draggableProps.style
                          }}
                          onClick={()=>setSelectedIdx(idx)}
                        >
                          <img
                            src={img.src}
                            alt=""
                            style={{ width:100, height:60, objectFit:'cover', cursor:'pointer' }}
                          />
                          <div style={{ position:'absolute', top:4, right:4, display:'flex', gap:4 }}>
                            <Upload
                              accept="image/*"
                              showUploadList={false}
                              customRequest={({file,onSuccess})=>replaceImage(idx,file,onSuccess)}
                            >
                              <Button size="small" icon={<UploadOutlined />} />
                            </Upload>
                            <Button
                              size="small"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={()=>deleteImage(idx)}
                            />
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  <div
                    style={{
                      width:100, height:60,
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
                          setImages(prev=>[
                            ...prev,
                            { id:Date.now().toString(), src:dataUrl, file, regions:[] }
                          ]);
                          setSelectedIdx(images.length);
                          onSuccess();
                          message.success('미리보기 등록 완료');
                        };
                        reader.onerror = onError;
                        reader.readAsDataURL(file);
                      }}
                    >
                      <PlusOutlined style={{ fontSize:24, color:'#888' }} />
                    </Upload>
                  </div>
                  {prov.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          <Space style={{ margin:'8px 0' }}>
            <Button
              icon={<LinkOutlined />}
              type={addingMode && addType==='url' ? 'primary':'default'}
              onClick={()=>{ setAddingMode(true); setAddType('url'); }}
            >URL 추가</Button>
            <Button
              icon={<TagOutlined />}
              type={addingMode && addType==='coupon' ? 'primary':'default'}
              onClick={()=>{ setAddingMode(true); setAddType('coupon'); setNewValue([]); }}
            >쿠폰 추가</Button>
          </Space>

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
            <img
              src={images[selectedIdx]?.src}
              alt=""
              style={{ width:'100%', userSelect:'none' }}
              draggable={false}
            />

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

            {images[selectedIdx]?.regions.map((r,i)=>(
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
    </Card>
  );
}
