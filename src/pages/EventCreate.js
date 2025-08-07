// src/pages/EventCreate.js
import React, { useState, useEffect, useRef } from 'react'
import MorePrd from './MorePrd'
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
} from 'antd'
import {
  InboxOutlined,
  DeleteOutlined,
  PlusOutlined,
  LinkOutlined,
  TagOutlined,
  BlockOutlined
} from '@ant-design/icons'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../axios'
import dayjs from 'dayjs'
import './EventCreate.css'
import sha256 from 'crypto-js/sha256'
import encHex from 'crypto-js/enc-hex'

const { Step }         = Steps
const { useBreakpoint } = Grid

export default function EventCreate() {
  const navigate       = useNavigate()
   const params       = new URLSearchParams(window.location.search)
   const paramMallId  = params.get('mall_id') || params.get('state')
   const storedMallId = localStorage.getItem('mallId')
   const mallId       = paramMallId || storedMallId
  const [msgApi, msgCtx] = message.useMessage()

  // 반응형
  const screens  = useBreakpoint()
  const isMobile = !screens.sm

  const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  'https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app';


  // 세션 초기화 (새로고침 시)
  useEffect(() => {
    Object.keys(sessionStorage)
      .filter(key => key.startsWith('MorePrd_'))
      .forEach(key => sessionStorage.removeItem(key))
  }, [])

  // 1) Wizard 단계
  const [current, setCurrent] = useState(0)
  const titleRef             = useRef(null)
  useEffect(() => {
    if (current === 0) {
      setTimeout(() => titleRef.current?.focus(), 0)
    }
  }, [current])
  const next = () => {
    if (current === 0) {
      if (!title.trim()) setTitle('제목없음')
      setCurrent(1)
    } else if (current === 1 && images.length === 0) {
      msgApi.warning('이미지를 업로드하세요.')
    } else if (current === 2) {
      if (!registerMode) msgApi.warning('상품 등록 방식을 선택하세요.')
      else if (registerMode === 'category') {
        if (!gridSize) msgApi.warning('그리드 사이즈를 선택해주세요.')
        else if (!layoutType) msgApi.warning('상품 노출 방식을 선택해주세요.')
        else if (layoutType === 'single' && !singleRoot) msgApi.warning('상품 분류(대분류)를 선택하세요.')
        else if (layoutType === 'tabs' && tabs.length < 2) msgApi.warning('탭을 두 개 이상 설정하세요.')
        else setCurrent(3)
      } else {
        setCurrent(3)
      }
    } else {
      setCurrent(c => c + 1)
    }
  }
  const prev = () => setCurrent(c => c - 1)

  // 2) 제목
  const [title, setTitle] = useState('')

  // 3) 이미지 업로드 & 매핑
  const [images, setImages]         = useState([]) // { id, src, file?, regions: [] }
  const [selectedId, setSelectedId] = useState(null)
  const imgRef                     = useRef(null)
  const uploadProps = {
    accept: 'image/*',
    multiple: true,
    showUploadList: false,
    beforeUpload: file => {
      const maxSizeMB = 10;
      const isTooLarge = file.size / 1024 / 1024 > maxSizeMB;
      if (isTooLarge) {
        msgApi.error(`이미지 크기는 ${maxSizeMB}MB 이하여야 합니다.`);
        return Upload.LIST_IGNORE; // 업로드 자체 무시
      }
      return true;
    },
    customRequest: ({ file, onSuccess }) => {
      const reader = new FileReader();
      reader.onload = e => {
        const src = e.target.result;

        const hash = sha256(src).toString(encHex);
        const alreadyExists = images.some(img => img.hash === hash);
        if (alreadyExists) {
          msgApi.warning('같은 이미지는 한 번만 업로드할 수 있습니다.');
          return;
        }

        const id = Date.now().toString() + Math.random();
        setImages(imgs => {
          const next = [...imgs, { id, src, file, hash, regions: [] }];
          setSelectedId(id);
          return next;
        });

        onSuccess('ok');
      };
      reader.readAsDataURL(file);
    }
  };

  const onDragEnd = result => {
    if (!result.destination) return
    const a = Array.from(images)
    const [m] = a.splice(result.source.index, 1)
    a.splice(result.destination.index, 0, m)
    setImages(a)
  }

  // 영역 매핑
  const [addingMode, setAddingMode]       = useState(false)
  const [addType, setAddType]             = useState(null) // 'link' | 'coupon'
  const [pendingRegion, setPendingRegion] = useState(null)
  const [dragStartPos, setDragStart]      = useState(null)
  const [dragCurrent, setDragCurrent]     = useState(null)
  const [modalVisible, setModalVisible]   = useState(false)

  const selectedImage = images.find(img => img.id === selectedId)

  const onMouseDown = e => {
    if (!imgRef.current) return
    const { left, top } = imgRef.current.getBoundingClientRect()
    setDragStart({ x: e.clientX - left, y: e.clientY - top })
    setDragCurrent({ x: e.clientX - left, y: e.clientY - top })
  }
  const onMouseMove = e => {
    if (!dragStartPos) return
    const { left, top } = imgRef.current.getBoundingClientRect()
    setDragCurrent({ x: e.clientX - left, y: e.clientY - top })
  }
  const onMouseUp = () => {
    if (!dragStartPos) {
      setDragStart(null)
      return
    }
    const { clientWidth: W, clientHeight: H } = imgRef.current
    const x = Math.min(dragStartPos.x, dragCurrent.x)
    const y = Math.min(dragStartPos.y, dragCurrent.y)
    const w = Math.abs(dragCurrent.x - dragStartPos.x)
    const h = Math.abs(dragCurrent.y - dragStartPos.y)
    setPendingRegion({
      id:      Date.now().toString(),
      xRatio:  x / W,
      yRatio:  y / H,
      wRatio:  w / W,
      hRatio:  h / H
    })
    setModalVisible(true)
    setDragStart(null)
    setDragCurrent(null)
  }

  const [mapForm] = Form.useForm()
  const saveRegion = () => {
    if (!pendingRegion) return
    const vals = mapForm.getFieldsValue()
    let updated = { ...pendingRegion }
    if (addType === 'link') {
      let href = (vals.href || '').trim()
      if (!href) return msgApi.error('URL을 입력하세요.')
      if (!/^https?:\/\//.test(href)) href = 'https://' + href
      updated.href = href
      delete updated.coupon
    } else {
      const coupon = (vals.coupon || []).join(',')
      if (!coupon) return msgApi.error('쿠폰을 선택하세요.')
      updated.coupon = coupon
      delete updated.href
    }
    setImages(imgs =>
      imgs.map(img =>
        img.id === selectedId
          ? {
              ...img,
              regions: [...img.regions.filter(r => r.id !== updated.id), updated]
            }
          : img
      )
    )
    setModalVisible(false)
    setPendingRegion(null)
  }
  const deleteRegion = () => {
    if (!pendingRegion) {
      setModalVisible(false)
      return
    }
    setImages(imgs =>
      imgs.map(img =>
        img.id === selectedId
          ? {
              ...img,
              regions: img.regions.filter(r => r.id !== pendingRegion.id)
            }
          : img
      )
    )
    setPendingRegion(null)
    setModalVisible(false)
  }
  const editRegion = region => {
    setPendingRegion(region)
    setAddType(region.coupon ? 'coupon' : 'link')
    mapForm.setFieldsValue(
      region.coupon
        ? { coupon: region.coupon.split(',') }
        : { href: region.href }
    )
    setModalVisible(true)
  }

  // 4) 카테고리 & 레이아웃
  const [allCats, setAllCats] = useState([])
    useEffect(() => {
      if (!mallId) {
        msgApi.error('mallId가 없습니다. 다시 로그인해 주세요.')
        return
      }
      api.get(`/api/${mallId}/categories/all`)
        .then(res => setAllCats(res.data))
        .catch(err => {
          console.error('[EventCreate] 카테고리 로드 에러', err)
          msgApi.error('카테고리 불러오기 실패')
        })
    }, [mallId, msgApi])

  const [singleRoot, setSingleRoot] = useState(null)
  const [singleSub, setSingleSub]   = useState(null)
  const [gridSize, setGridSize]     = useState(2)
  const [layoutType, setLayoutType] = useState(null)

  const roots = allCats.filter(c => c.category_depth === 1)
  const subs  = allCats.filter(
    c => c.category_depth === 2 && String(c.parent_category_no) === singleRoot
  )

  // 5) 상품 등록 방식
  const [registerMode, setRegisterMode]           = useState('category')
  const [directProducts, setDirectProducts]       = useState([])
  const [tabDirectProducts, setTabDirectProducts] = useState({})
  const [initialSelected, setInitialSelected]     = useState([])

  // 탭 상태 & 색상
  const [tabs, setTabs]             = useState([
    { title: '', root: null, sub: null },
    { title: '', root: null, sub: null },
  ])
  const [activeColor, setActiveColor] = useState('#fe6326')

  // 탭 추가 함수
  const addTab = () => {
    if (tabs.length >= 4) return
    const newIndex = tabs.length
    sessionStorage.removeItem(`MorePrd_tab_${newIndex}_selectedKeys`)
    sessionStorage.removeItem(`MorePrd_tab_${newIndex}_selectedDetails`)
    setTabs(ts => [...ts, { title: '', root: null, sub: null }])
  }

  // 탭 업데이트 함수
  const updateTab = (i, key, val) => {
    setTabs(ts => {
      const a = [...ts]
      a[i] = { ...a[i], [key]: val, ...(key === 'root' ? { sub: null } : {}) }
      return a
    })
  }

  // 6) MorePrd 모달
  const [morePrdVisible, setMorePrdVisible]   = useState(false)
  const [morePrdTarget, setMorePrdTarget]     = useState('direct')
  const [morePrdTabIndex, setMorePrdTabIndex] = useState(0)

  const openMorePrd = (target, tabIndex = 0) => {
    setMorePrdTarget(target)
    setInitialSelected(
      target === 'direct'
        ? directProducts.map(p => p.product_no)
        : (tabDirectProducts[tabIndex] || []).map(p => p.product_no)
    )
    setMorePrdTabIndex(tabIndex)
    setMorePrdVisible(true)
  }

  // 7) 쿠폰 목록
  const [couponOptions, setCouponOptions] = useState([])
  useEffect(() => {
      if (!mallId) {
        msgApi.error('mallId가 없습니다. 다시 로그인해 .')
        return
      }
      api.get(`/api/${mallId}/coupons`)
        .then(res => {
          setCouponOptions(
            res.data.map(c => ({
              value: c.coupon_no,
              label: `${c.coupon_name} (${c.benefit_percentage}%)`
            }))
          )
        })
        .catch(err => {
          console.error('[EventCreate] 쿠폰 로드 에러', err)
          msgApi.error('쿠폰 불러오기 실패')
        })
    }, [mallId, msgApi])

  const tagRender = ({ label, closable, onClose }) => (
    <Tag closable={closable} onClose={onClose} style={{ marginRight: 3 }}>
      {String(label).length > 6 ? String(label).slice(0, 6) + '…' : label}
    </Tag>
  )

  // 8) 이벤트 등록
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      // 이미지 업로드
      const uploaded = await Promise.all(images.map(async img => {
        if (img.file) {
          const form = new FormData();
          form.append('file', img.file);
          const { data } = await api.post(
            `/api/${mallId}/uploads/image`,
            form,
            { headers: { 'Content-Type': 'multipart/form-data' } }
          );
          return { ...img, src: data.url, file: undefined };
        }
        return img;
      }));

          
      // payload 생성부

          // payload 생성부 (content는 객체 그대로)
          const payload = {
            title,
            content: {
              images: uploaded.map(img => img.src),
              gridSize,
              layoutType,
              classification: {
                registerMode,
                /* 필요하다면 더 넣으세요 */
              }
            },
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
                coupon: r.coupon
              }))
            })),
            gridSize,
            layoutType,
            classification: {
              ...(layoutType === 'single'
                ? { root: singleRoot, sub: singleSub }
                : { tabs, activeColor }),
              registerMode,
              ...(registerMode === 'direct'
                ? { directProducts, tabDirectProducts }
                : {})
            }
          };
      
      // 이벤트 생성 API 호출
      await api.post(`/api/${mallId}/events`, payload)
      msgApi.success('이벤트 생성 완료');
      navigate('/event/list')
    } catch (e) {
      console.error(e)
      msgApi.error('게시판의 경우 최대 10개 까지의 게시판만 등록이 가능합니다.')
    }
  }

  // ─── JSX 렌더링 (기존 코드 그대로) ───────────────────────────
  return (
    <>
      {msgCtx}
      <Card
        title="이벤트 만들기 & 영역 매핑"
        className="event-create-card"
        style={{
          width: isMobile ? '100%' : '100%',
          margin: '0 auto',
          padding: isMobile ? 8 : 24
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

        {/* Step 1 */}
        {current === 0 && (
          <Input
            ref={titleRef}
            placeholder="이벤트 제목을 입력하세요"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        )}

        {/* Step 2 */}
        {current === 1 && (
          <>
            <Upload.Dragger
              {...uploadProps}
              className="dragger"
              style={{
                padding: isMobile ? 12 : 24,
                width: '100%',
              }}
            >
              <p><InboxOutlined style={{ fontSize: 24 }} /></p>
              <p>이미지를 드래그 또는 클릭하여 업로드</p>
            </Upload.Dragger>

            <Space style={{ margin: '12px 0' }}>
              <Button
                icon={<LinkOutlined />}
                type={addingMode && addType==='link' ? 'primary' : 'default'}
                onClick={() => {
                  if (!selectedImage) return msgApi.warning('이미지를 선택하세요.')
                  setAddType('link'); setAddingMode(true)
                }}
              >URL 추가</Button>
              <Button
                icon={<TagOutlined />}
                type={addingMode && addType==='coupon' ? 'primary' : 'default'}
                onClick={() => {
                  if (!selectedImage) return msgApi.warning('이미지를 선택하세요.')
                  setAddType('coupon'); setAddingMode(true)
                }}
              >쿠폰 추가</Button>
            </Space>

            {images.length > 0 && (
              <>
                {/* 업로드된 이미지를 Grid 레이아웃으로 표시 */}
                <div
                  style={{
                    display: 'none',
                    gap: 16,
                     maxWidth: 150,
                    margin: '16px auto 0',
                  }}
                >
                  {images.map(img => (
                    <img
                      key={img.id}
                      src={img.src}
                      alt=""
                      style={{
                        width: '100%',
                        objectFit: 'contain',
                        borderRadius: 4,
                      }}
                    />
                  ))}
                </div>

                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="thumbs" direction="horizontal" className="sumTumb">
                    {prov => (
                        <div
                          ref={prov.innerRef}
                          {...prov.droppableProps}
                          className="thumb-list"
                          style={{
                            display:        'flex',
                            flexDirection:  isMobile ? 'column' : 'row',
                            gap:            8,
                            width:          '100%',    // 부모 폭에 맞춰
                            height:         120,       // 썸네일 높이에 맞춰 고정
                            overflowX:      'hidden',  // 가로 스크롤 숨기기
                            overflowY:      'hidden',  // 세로 스크롤 숨기기
                            marginTop:      16
                          }}
                        >
                        {images.map((img, idx) => (
                          <Draggable key={img.id} draggableId={img.id} index={idx}>
                            {p => (
                              <div
                                  ref={p.innerRef}
                                  {...p.draggableProps}
                                  {...p.dragHandleProps}
                                  className={`thumb-item ${img.id===selectedId?'active':''}`}
                                  style={{
                                    ...p.draggableProps.style,
                                    transition: 'transform 0.2s ease, opacity 0.2s ease'
                                  }}
                                  onClick={() => setSelectedId(img.id)}
                                >
                            <img
                              src={img.src}
                              alt="썸네일"
                              style={{
                                width: 100,
                                objectFit: 'cover',
                                borderRadius: 4
                              }}
                            />
                            <DeleteOutlined
                                  className="thumb-delete"
                                  onClick={e => {
                                    e.stopPropagation()
                                    setImages(imgs => imgs.filter(i => i.id !== img.id))
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
                  ref={imgRef}
                  onMouseDown={addingMode ? onMouseDown : undefined}
                  onMouseMove={addingMode ? onMouseMove : undefined}
                  onMouseUp={addingMode ? onMouseUp : undefined}
                  style={{
                    position: 'relative',
                    textAlign:'center',
                    width: '100%',
                    marginTop: 16,
                    cursor: addingMode ? 'crosshair' : 'default'
                  }}
                >
                  <img
                    src={selectedImage?.src}
                    alt=""
                    style={{ maxWidth:'800px',margin:'0 auto', userSelect:'none' ,width:'100%'}}
                    draggable={false}
                  />

                  {dragStartPos && dragCurrent && (
                    <div
                      style={{
                        position: 'absolute',
                        left:   Math.min(dragStartPos.x, dragCurrent.x),
                        top:    Math.min(dragStartPos.y, dragCurrent.y),
                        width:  Math.abs(dragCurrent.x - dragStartPos.x),
                        height: Math.abs(dragCurrent.y - dragStartPos.y),
                        border:'1px dashed #999',
                        background:'rgba(200,200,200,0.2)'
                      }}
                    />
                  )}

                  {selectedImage?.regions.map(r => {
                    const base = {
                      position: 'absolute',
                      left:   `${(r.xRatio * 100).toFixed(2)}%`,
                      top:    `${(r.yRatio * 100).toFixed(2)}%`,
                      width:  `${(r.wRatio * 100).toFixed(2)}%`,
                      height: `${(r.hRatio * 100).toFixed(2)}%`,
                      cursor: 'pointer'
                    }
                    const style = r.coupon
                      ? { ...base, border:'2px dashed #ff6347', background:'rgba(255,99,71,0.2)' }
                      : { ...base, border:'2px dashed #1890ff', background:'rgba(24,144,255,0.2)' }

                    return r.coupon
                      ? <button key={r.id} style={style} onClick={e => { e.stopPropagation(); editRegion(r) }} />
                      : <a key={r.id} style={style} onClick={e => { e.preventDefault(); e.stopPropagation(); editRegion(r) }} />
                  })}
                </div>
              </>
            )}
          </>
        )}

        {/* Step 3 */}
        {current === 2 && (
          <>
            <h4>상품 등록 방식</h4>
            <Segmented
              options={[
                { label:'카테고리 상품 등록', value:'category' },
                { label:'직접 상품 등록',   value:'direct'   },
                { label:'노출안함',         value:'none'     }
              ]}
              value={registerMode}
              onChange={setRegisterMode}
              block={isMobile}
              style={{ marginBottom:24 }}
            />

            {/* 카테고리 상품 등록 */}
            {registerMode==='category' && (
              <>
                <h4>1) 그리드 사이즈</h4>
                <Space wrap style={{ gap:8, marginBottom:24 }}>
                  {[2,3,4].map(n=>(
                    <Button
                      key={n}
                      block={isMobile}
                      style={{ flex: isMobile?'none':1 }}
                      type={gridSize===n?'primary':'default'}
                      onClick={()=>setGridSize(n)}
                    >{n}×{n}</Button>
                  ))}
                </Space>

                <h4 style={{ marginBottom:16 }}>2) 노출 방식</h4>
                <Segmented
                  options={[
                    { label:'단품상품', value:'single' },
                    { label:'탭상품',   value:'tabs'   }
                  ]}
                  value={layoutType}
                  onChange={val=>{
                    setLayoutType(val)
                    setSingleRoot(null); setSingleSub(null)
                    setTabs([{title:'',root:null,sub:null},{title:'',root:null,sub:null}])
                    setActiveColor('#fe6326')
                  }}
                  block={isMobile}
                />

                {layoutType==='single' && (
                  <div style={{ marginTop:24 }}>
                    <Select
                      placeholder="대분류"
                      style={{ width:'100%', maxWidth:300, marginBottom:16 }}
                      value={singleRoot}
                      onChange={setSingleRoot}
                    >
                      {roots.map(r=>(
                        <Select.Option key={r.category_no} value={String(r.category_no)}>
                          {r.category_name}
                        </Select.Option>
                      ))}
                    </Select>
                    {subs.length>0 && (
                      <Select
                        placeholder="소분류"
                        style={{ width:'100%', maxWidth:300 }}
                        value={singleSub}
                        onChange={setSingleSub}
                      >
                        {subs.map(s=>(
                          <Select.Option key={s.category_no} value={String(s.category_no)}>
                            {s.category_name}
                          </Select.Option>
                        ))}
                      </Select>
                    )}
                  </div>
                )}

                {layoutType==='tabs' && (
                  <div style={{ marginTop:24 }} className="tabPlusCategory">
                    {tabs.map((t,i)=>(
                      <Space
                        key={i}
                        direction={isMobile?'vertical':'horizontal'}
                        style={{ marginBottom:16, width:'100%', alignItems:'center' }}
                      >
                        <Input
                          placeholder={`탭 ${i+1} 제목`}
                          value={t.title}
                          onChange={e=>updateTab(i,'title',e.target.value)}
                          style={{ flex:1 }}
                        />
                        <Select
                          placeholder="대분류"
                          style={{ width:isMobile?'100%':150 }}
                          value={t.root}
                          onChange={v=>updateTab(i,'root',v)}
                        >
                          {roots.map(r=>(
                            <Select.Option key={r.category_no} value={String(r.category_no)}>
                              {r.category_name}
                            </Select.Option>
                          ))}
                        </Select>
                        <Select
                          placeholder="소분류"
                          style={{ width:isMobile?'100%':150 }}
                          value={t.sub}
                          onChange={v=>updateTab(i,'sub',v)}
                        >
                          {allCats
                            .filter(c=>c.category_depth===2 && String(c.parent_category_no)===t.root)
                            .map(s=>(
                              <Select.Option key={s.category_no} value={String(s.category_no)}>
                                {s.category_name}
                              </Select.Option>
                            ))
                          }
                        </Select>
                        {tabs.length>=3 && (
                          <DeleteOutlined
                            onClick={()=>setTabs(ts=>ts.filter((_,idx)=>idx!==i))}
                            style={{ color: activeColor, fontSize:14, cursor:'pointer' }}
                          />
                        )}
                      </Space>
                    ))}
                    <Button type="dashed" block onClick={addTab} disabled={tabs.length>=4} style={{ marginBottom:16 }}>
                      + 탭 추가
                    </Button>
                    <Space style={{ alignItems:'center', gap:8 }}>
                      <span>활성 탭 색:</span>
                      <Input
                        type="color"
                        value={activeColor}
                        onChange={e=>setActiveColor(e.target.value)}
                        style={{ width:40, height:32, padding:0, border:'none' }}
                      />
                      <span>{activeColor}</span>
                    </Space>
                  </div>
                )}
              </>
            )}

            {/* 직접 상품 등록 */}
            {registerMode==='direct' && (
              <>
                <h4>1) 그리드 사이즈</h4>
                <Space wrap style={{ gap:8, marginBottom:24 }}>
                  {[2,3,4].map(n=>(
                    <Button
                      key={n}
                      block={isMobile}
                      style={{ flex: isMobile?'none':1 }}
                      type={gridSize===n?'primary':'default'}
                      onClick={()=>setGridSize(n)}
                    >{n}×{n}</Button>
                  ))}
                </Space>

                <h4 style={{ marginBottom:16 }}>2) 노출 방식</h4>
                <Segmented
                  options={[
                    { label:'단품상품', value:'single' },
                    { label:'탭상품',   value:'tabs'   }
                  ]}
                  value={layoutType}
                  onChange={val=>{
                    setLayoutType(val)
                    setTabs([{title:'',root:null,sub:null},{title:'',root:null,sub:null}])
                  }}
                  block={isMobile}
                />

                {layoutType==='single' && (
                  <Button
                   className="goodsSingleButton"
                    block={isMobile}
                    type={directProducts.length>0?'primary':'dashed'}
                    onClick={()=>openMorePrd('direct')}
                  >
                    {directProducts.length>0
                      ? `상품 ${directProducts.length}개 등록됨`
                      : '상품 직접 등록'}
                  </Button>
                )}

                {layoutType==='tabs' && (
                  <div style={{ marginTop:24 }} className="tabListPlus">
                    {tabs.map((t,i)=>(
                      <Space
                        key={i}
                        direction={isMobile?'vertical':'horizontal'}
                        style={{ marginBottom:16, width:'100%', alignItems:'center' }}
                      >
                        <Input
                          placeholder={`탭 ${i+1} 제목`}
                          value={t.title}
                          onChange={e=>updateTab(i,'title',e.target.value)}
                          style={{ flex:1 }}
                        />
                        <Button
                          type={(tabDirectProducts[i]||[]).length>0?'primary':'default'}
                          onClick={()=>openMorePrd('tab', i)}
                        >
                          {(tabDirectProducts[i]||[]).length>0
                            ? `상품 ${(tabDirectProducts[i]||[]).length}개 등록됨`
                            : '상품 직접 등록'}
                        </Button>
                        {tabs.length>2 && (
                          <DeleteOutlined
                            onClick={()=>setTabs(ts=>ts.filter((_,idx)=>idx!==i))}
                            style={{ color:'#fe6326', fontSize:14, cursor:'pointer' }}
                          />
                        )}
                      </Space>
                    ))}
                    <Button type="dashed" block onClick={addTab} disabled={tabs.length>=4}>
                      탭 추가
                    </Button>
                    <Space style={{ marginTop:16, alignItems:'center', gap:8 }}>
                      <span>활성 탭 색:</span>
                      <Input
                        type="color"
                        value={activeColor}
                        onChange={e=>setActiveColor(e.target.value)}
                        style={{ width:40, height:32, padding:0, border:'none' }}
                      />
                      <span>{activeColor}</span>
                    </Space>
                  </div>
                )}
              </>
            )}

            {/* 노출안함 */}
            {registerMode==='none' && (
              <div style={{ textAlign:'left', color:'#fe6326', padding:'5px' }}>
                상품을 노출하지 않습니다.
              </div>
            )}
          </>
        )}

        {/* Step 4 */}
        {current===3 && (
          <div style={{ marginTop:24 }}>
            <h4>미리보기</h4>
            <div style={{ display:'grid', gap:16, maxWidth:800, margin:'0 auto' }}>
              {images.map(img=>(
                <img key={img.id} src={img.src} alt="미리보기" style={{ width:'100%' }} />
              ))}
            </div>

            {layoutType==='single' && <div style={{ marginTop:24 }}>{renderGrid(gridSize)}</div>}
            {layoutType==='tabs' && (
              <div style={{ margin:'24px auto', maxWidth:800 }}>
                <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                  {tabs.map((t,i)=>(
                    <Button
                      key={i}
                      style={{
                        flex:1,
                        background: i===0?activeColor:undefined,
                        color:      i===0?'#fff':undefined
                      }}
                    >
                      {t.title || `탭${i+1}`}
                    </Button>
                  ))}
                </div>
                {renderGrid(gridSize)}
              </div>
            )}

            <div style={{ textAlign:'center', marginTop:32 }}>
             <Button
                type="primary"
                size="large"
                onClick={handleSubmit}
                block={isMobile}
                loading={submitting}
                disabled={submitting}
              >
                이벤트 등록
              </Button>
            </div>
          </div>
        )}

        {/* 이전/다음 버튼 */}
        <Space
          direction={isMobile ? 'vertical' : 'horizontal'}
          style={{ marginTop:24, width:'100%', justifyContent:'space-between' }}
        >
          {current>0 && <Button onClick={prev} block={isMobile}>이전</Button>}
          {current<3 && <Button type="primary" onClick={next} block={isMobile}>다음</Button>}
        </Space>
      </Card>

      {/* 영역 설정 모달 */}
      <Modal
        open={modalVisible}
        title={addType==='link' ? 'URL 영역 설정' : '쿠폰 영역 설정'}
        onCancel={() => {
          setModalVisible(false)
          setPendingRegion(null)
          setAddingMode(false)
        }}
        footer={[
          pendingRegion && (
            <Button key="delete" danger onClick={() => { deleteRegion(); setAddingMode(false) }}>
              삭제
            </Button>
          ),
          <Button key="cancel" onClick={() => {
            setModalVisible(false)
            setPendingRegion(null)
            setAddingMode(false)
          }}>
            취소
          </Button>,
          <Button key="ok" type="primary" onClick={() => {
            saveRegion()
            setAddingMode(false)
          }}>
            확인
          </Button>
        ]}
        width={isMobile?'90%':600}
      >
        <Form form={mapForm} layout="vertical">
          {addType==='link' ? (
            <Form.Item
              name="href"
              label="URL"
              rules={[{ required:true, message:'URL을 입력해주세요.' }]}
            >
              <Input placeholder="https://example.com" />
            </Form.Item>
          ) : (
            <Form.Item
              name="coupon"
              label="쿠폰 선택 혹은 번호 입력"
              rules={[{ required:true, message:'쿠폰을 하나 이상 선택하거나 번호를 입력하세요.' }]}
            >
              <Select
                mode="tags"
                options={couponOptions}
                tokenSeparators={[',']}
                tagRender={tagRender}
                placeholder="쿠폰을 선택하거나 번호를 입력하세요 (쉼표로 구분)"
                style={{ width: '100%' }}
              />
            </Form.Item>
          )}
        </Form>
      </Modal>

      {/* MorePrd 모달 */}
      {morePrdVisible && (
        <MorePrd
          key={`${morePrdTarget}-${morePrdTabIndex}`}
          visible={morePrdVisible}
          target={morePrdTarget}
          tabIndex={morePrdTabIndex}
          initialSelected={initialSelected}
          onOk={selected => {
            if (morePrdTarget==='direct') setDirectProducts(selected)
            else setTabDirectProducts(prev=>({...prev,[morePrdTabIndex]:selected}))
            setMorePrdVisible(false)
          }}           
          onCancel={()=>setMorePrdVisible(false)}
        />
      )}
    </>
  )
}

// 그리드 미리보기 헬퍼
function renderGrid(cols) {
  return (
    <div
      style={{
        display:'grid',
        gridTemplateColumns:`repeat(${cols},1fr)`,
        gap:10,
        maxWidth:800,
        margin:'24px auto'
      }}
    >
      {Array.from({ length: cols*cols }).map((_,i)=>(
        <div
          key={i}
          style={{
            height:120,
            background:'#f0f0f0',
            borderRadius:4,
            display:'flex',
            alignItems:'center',
            justifyContent:'center',
            color:'#999'
          }}
        >
          <BlockOutlined style={{ fontSize:30 }} />
        </div>
      ))}
    </div>
  )
}
