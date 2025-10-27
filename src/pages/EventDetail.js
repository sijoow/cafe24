// src/pages/EventDetail.jsx
import React, { useEffect, useState } from 'react';
import { Card, Button, Space, message, Modal, Input, Alert } from 'antd';
import { UnorderedListOutlined, CodeOutlined, CopyOutlined, EditOutlined, BlockOutlined, HighlightOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../axios';
import './EventDetail.css';

const API_BASE = process.env.REACT_APP_API_BASE_URL || 'https://port-0-cafe24api-am952nltee6yr6.sel5.cloudtype.app';

// --- 유틸리티 함수들 ---
const escapeHtml = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const buildYouTubeSrc = (id, autoplay = false, loop = false) => {
  const params = new URLSearchParams({ autoplay: autoplay ? '1' : '0', mute: autoplay ? '1' : '0', playsinline: '1', rel: 0, modestbranding: 1, enablejsapi: 1 });
  if (loop) { params.set('loop', '1'); params.set('playlist', id); }
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
};

function YouTubeEmbed({ id, ratioW = 16, ratioH = 9, title = 'YouTube video', autoplay = false, loop = false }) {
  const src = buildYouTubeSrc(id, autoplay, loop);
  return (
    <div style={{ width: '100%', maxWidth: 800, margin: '0 auto', marginBottom: '8px' }}>
      <div style={{ position: 'relative', width: '100%', aspectRatio: `${ratioW} / ${ratioH}` }}>
        <iframe src={src} title={title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />
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
        <div key={p?.product_no || i} style={{ overflow: 'hidden', border: '1px solid #e8e8e8', background: '#fff' }}>
          <div style={{ aspectRatio: '1 / 1', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa' }}>
            {p?.list_image ? ( <img src={p.list_image} alt={p.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> ) : ( <BlockOutlined style={{ fontSize: 40, color: '#d9d9d9' }} /> )}
          </div>
          <div style={{ padding: '12px', minHeight: '90px' }}>
            <div style={{ fontWeight: 500, fontSize: titleFontSize, lineHeight: 1.2 }}>{p?.product_name || `상품명 ${i + 1}`}</div>
            {p?.price != null && (<div style={{ fontWeight: 'bold', fontSize: priceFontSize, marginTop: '4px' }}>{Number(p.price).toLocaleString()}원</div>)}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const paramMallId = params.get('mall_id') || params.get('state');
  const storedMallId = localStorage.getItem('mallId');
  const mallId = paramMallId || storedMallId;

  const [event, setEvent] = useState(null);
  const [htmlModalVisible, setHtmlModalVisible] = useState(false);
  const [cssTipModalVisible, setCssTipModalVisible] = useState(false);
  const [htmlCode, setHtmlCode] = useState('');
  const [previewActiveTabs, setPreviewActiveTabs] = useState({});
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (!mallId || !id) return;
    api.get(`/api/${mallId}/events/${id}`)
      .then(res => {
        setEvent(res.data);
      })
      .catch(() => {
        messageApi.error('이벤트 로드 실패');
        navigate(`/event/list`);
      });
  }, [mallId, id, navigate, messageApi]);

  const handleShowHtml = () => {
    if (!event) {
      message.error('이벤트 데이터가 없습니다.');
      return;
    }

    let html = `<!--@layout(/layout/basic/main.html)-->\n\n`;
    html += `<div id="evt-root"></div>\n\n`;

    const allBlocks = event.content?.blocks || [];
    
    const allCoupons = allBlocks
      .flatMap(b => b.type === 'image' ? (b.regions || []).filter(r => r.coupon).map(r => r.coupon) : [])
      .join(',');

    const uniqueCoupons = [...new Set(allCoupons.split(',').filter(Boolean))];

    const productTabBlock = allBlocks.find(b => b.type === 'product_group' && b.layoutType === 'tabs');
    const totalTabCount = productTabBlock ? (productTabBlock.tabs || []).length : 0;
    const activeColor = productTabBlock ? productTabBlock.activeColor || '#1890ff' : '#1890ff';

    html += `<script src="${API_BASE}/onimon.js" data-mall-id="${mallId}" data-page-id="${id}" data-api-base="${API_BASE}" data-tab-count="${totalTabCount}" data-active-color="${activeColor}" ${uniqueCoupons.length > 0 ? `data-coupon-nos="${uniqueCoupons.join(',')}"` : ''}></script>\n`;

    setHtmlCode(html);
    setHtmlModalVisible(true);
  };
  
  const handleCopy = async (text) => {
    await navigator.clipboard.writeText(text);
    message.success('코드 복사 완료');
  };
  
  if (!event) return null;

  const blocksToRender = event.content?.blocks || (event.images || []).map(img => ({ type: 'image', ...img }));

  // ✅ [수정] CSS 팁 내용 변경
  const cssTips = `/* --- 상품 그리드 디자인 예시 <style> 태그로 감싸서 붙여넣으세요.--- */
    
    /*상품 아이콘 위치 지정 */
    .prd_icons{position:absolute; top:0!important;right:0!important} /*왼쪽 상단*/
    .prd_icons{position:absolute; bottom:0!important;right:0!important} /*왼쪽 하단*/
    .prd_icons{position:absolute; top:0!important;left:0!important} /*왼쪽 상단*/
    .prd_icons{position:absolute; bottom:0!important;left:0!important} /*왼쪽 하단*/

    /* 상품명 폰트 굵기 및 색상 변경 */
    .prd_name {
      font-weight: 500; /* 예: 500  600 700 800 숫자가 커질수록 굵기가 조절 가능*/
      color: #000000; /* 예: 검은색 */
    }

    /* 할인율 텍스트 굵기 및 색상 변경 */
    .sale_percent, .prd_coupon_percent {
      font-weight: bold; /* 예: bold */
      color: #ff4d4f !important; /* 예: 빨간색 */
    }

    /* 최종 가격 폰트 굵기 및 색상 변경 */
    .sale_price, .prd_coupon {
      font-weight: bold; /* 예: bold */
      color: #000000 !important; /* 예: 검은색 */
    }

    /* 원래 가격(줄 그어진 가격) 폰트 굵기 및 색상 변경 */
    .original_price {
      font-weight: 400; /* 예: 400 (기본) */
      color: #999999 !important; /* 예: 회색 */
    }
`;

  return (
    <>
      {contextHolder}
      <Card
        title={event.title}
        className="event-detail-card"
        extra={
          <Space>
            <Button icon={<UnorderedListOutlined />} onClick={() => navigate(`/event/list`)}>목록</Button>
            <Button icon={<EditOutlined />} onClick={() => navigate(`/event/edit/${id}`)}>수정</Button>
            <Button icon={<HighlightOutlined />} onClick={() => setCssTipModalVisible(true)}>CSS 커스텀 팁</Button>
            <Button type="primary" icon={<CodeOutlined />} onClick={handleShowHtml}>HTML 코드</Button>
          </Space>
        }
      >
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {blocksToRender.map(block => {
            const blockId = block.id || block._id;
            switch (block.type) {
              case 'image':
                return (
                  <div key={blockId} style={{ position:'relative', width:'100%', marginBottom: 8 }}>
                    <img src={block.src} alt="이벤트 이미지" style={{ width: '100%' }} />
                    {(block.regions || []).map(r => {
                      const isCoupon = !!r.coupon;
                      const style = { position: 'absolute', left: `${r.xRatio*100}%`, top: `${r.yRatio*100}%`, width: `${r.wRatio*100}%`, height: `${r.hRatio*100}%`, border: `2px dashed ${isCoupon ? '#ff6347' : '#1890ff'}`, cursor: 'pointer', background: isCoupon ? 'rgba(255, 99, 71, 0.2)' : 'rgba(24, 144, 255, 0.2)', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start' };
                      return (
                        <a key={r.id || r._id} href={isCoupon ? `#coupon-download` : r.href} target={isCoupon ? '_self' : '_blank'} rel="noreferrer" style={style} onClick={isCoupon ? (e) => { e.preventDefault(); messageApi.info('쿠폰은 생성된 HTML 페이지에서 다운로드 가능합니다.'); } : undefined}>
                           <span style={{ background: isCoupon ? '#ff6347' : '#1890ff', color: 'white', fontSize: '10px', padding: '1px 4px', borderRadius: '2px', lineHeight: 1, fontWeight: 'bold', margin: '1px' }}>
                                {isCoupon ? '쿠폰' : 'URL'}
                            </span>
                        </a>
                      );
                    })}
                  </div>
                );
              case 'video':
                return <YouTubeEmbed key={blockId} id={block.youtubeId} autoplay={block.autoplay} loop={block.loop} ratioW={block.ratio?.w} ratioH={block.ratio?.h} />;
              case 'text':
                const st = block.style || {};
                return (
                  <div key={blockId} style={{ textAlign: st.align || 'center', margin: `${st.mt || 16}px 0 ${st.mb || 16}px` }}>
                    <div style={{ fontSize: st.fontSize || 18, fontWeight: st.fontWeight || 'normal', color: st.color || '#333', whiteSpace: 'pre-wrap' }} dangerouslySetInnerHTML={{ __html: escapeHtml(block.text || '').replace(/\n/g, '<br/>') }} />
                  </div>
                );
              case 'product_group':
                  const activeTabIndex = previewActiveTabs[blockId] || 0;
                  let productsToDisplay = [];
                  if (block.layoutType === 'single') { productsToDisplay = block.directProducts || []; } 
                  else if (block.layoutType === 'tabs') {
                    if (block.registerMode === 'direct') { productsToDisplay = (block.tabDirectProducts || {})[activeTabIndex] || []; }
                  }
                  
                  return (
                    <div key={blockId} style={{ padding: '16px 0', fontFamily: "'Noto Sans KR', sans-serif" }}>
                        {block.layoutType === 'tabs' && block.tabs && (
                          <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
                            {(block.tabs || []).map((t, i) => (
                              <Button key={i} style={{ flex: 1, background: i === activeTabIndex ? block.activeColor || '#1890ff' : undefined, color: i === activeTabIndex ? '#fff' : undefined, borderColor: i === activeTabIndex ? block.activeColor || '#1890ff' : undefined }} onClick={() => { setPreviewActiveTabs(prev => ({ ...prev, [blockId]: i })); }}>
                                {t.title || `탭 ${i + 1}`}
                              </Button>
                            ))}
                          </div>
                        )}
                        {block.registerMode === 'category' ? (
                          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#888', background: '#fafafa', border: '1px dashed #d9d9d9', borderRadius: '4px', marginTop: '24px' }}>
                            카테고리 상품은 실제 페이지에서 노출됩니다.
                          </div>
                        ) : (
                          renderGrid(block.gridSize, productsToDisplay)
                        )}
                    </div>
                  );
              default:
                return null;
            }
          })}
        </div>
      </Card>
      
      <Modal
        title="전체 HTML 코드"
        open={htmlModalVisible}
        footer={[
          <Button key="close" onClick={() => setHtmlModalVisible(false)}>닫기</Button>,
          <Button key="copy" type="primary" icon={<CopyOutlined />} onClick={() => handleCopy(htmlCode)}>복사</Button>,
        ]}
        onCancel={() => setHtmlModalVisible(false)}
        width={800}
      >
        <Input.TextArea value={htmlCode} rows={20} readOnly style={{ fontFamily: 'monospace', fontSize: '12px' }} />
      </Modal>

      <Modal
        title="팁: CSS로 디자인 수정하기"
        open={cssTipModalVisible}
        onCancel={() => setCssTipModalVisible(false)}
        footer={[
            <Button key="close" onClick={() => setCssTipModalVisible(false)}>닫기</Button>,
            <Button key="copy" type="primary" icon={<CopyOutlined />} onClick={() => handleCopy(cssTips)}>
              코드 복사
            </Button>,
        ]}
        width={600}
      >
        <p>
            아래 CSS 코드를 복사하여, 생성된 HTML 코드의 
            <strong><code>&lt;script&gt;</code></strong> 태그 바로 아래에 <strong><code>&lt;style&gt;</code></strong> 태그로 감싸서 붙여넣으시면 상품 디자인을 직접 수정할 수 있습니다.
        </p>
        <Alert 
            message="예시: <style> ...복사한 코드... </style>" 
            type="info" 
            style={{ marginBottom: 16 }} 
        />
        <Input.TextArea 
            value={cssTips} 
            rows={20} 
            readOnly 
            style={{ fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre' }} 
        />
      </Modal>
    </>
  );
}