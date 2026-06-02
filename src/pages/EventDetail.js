// src/pages/EventDetail.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { Card, Button, Space, message, Modal, Input, Alert, Steps, Typography } from 'antd';
import { UnorderedListOutlined, CodeOutlined, CopyOutlined, EditOutlined, BlockOutlined, HighlightOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../axios';
import { renderGrid } from '../components/productCard';
import { TimesaleBanner, ImageSlidePreview } from './EventCreate';
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

// renderGrid 는 ../components/productCard 로 분리 (미리보기 3개 화면 공유)

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
  const [couponOptions, setCouponOptions] = useState([]);
  const [categoryProductsMap, setCategoryProductsMap] = useState({});
  const [timesaleProductsMap, setTimesaleProductsMap] = useState({}); // blockId -> products[] (최대 4, 미리보기)
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

  // 쿠폰 할인율 조회 (미리보기 할인 추정용)
  useEffect(() => {
    if (!mallId) return;
    api.get(`/api/${mallId}/coupons`).then(res => setCouponOptions((res.data || []).map(c => ({ value: c.coupon_no, discountPercent: Number(c.benefit_percentage) || 0 })))).catch(() => {});
  }, [mallId]);

  const previewDiscountPercent = useMemo(() => {
    const nos = event?.couponNos || [];
    if (!nos.length) return 0;
    return Math.max(0, ...nos.map(no => couponOptions.find(o => o.value === no)?.discountPercent || 0));
  }, [event, couponOptions]);

  // 카테고리 모드 블록의 미리보기용 상품 prefetch
  useEffect(() => {
    if (!mallId || !event) return;
    const blks = event.content?.blocks || [];
    const needed = new Set();
    blks.forEach(b => {
      if (b.type !== 'product_group' || b.registerMode !== 'category') return;
      if (b.layoutType === 'single') { const no = b.sub || b.root; if (no) needed.add(String(no)); }
      else if (b.layoutType === 'tabs') { (b.tabs || []).forEach(t => { const no = t.sub || t.root; if (no) needed.add(String(no)); }); }
    });
    needed.forEach(no => {
      if (categoryProductsMap[no]) return;
      api.get(`/api/${mallId}/categories/${no}/products`, { params: { limit: 300 } })
        .then(res => { const arr = Array.isArray(res.data) ? res.data : (res.data?.products || []); setCategoryProductsMap(prev => ({ ...prev, [no]: arr })); })
        .catch(() => setCategoryProductsMap(prev => ({ ...prev, [no]: [] })));
    });
  }, [mallId, event, categoryProductsMap]);

  // 타임세일 블록 미리보기 — 대상 상품 최대 4개만 로드(나머지는 라이브에서)
  useEffect(() => {
    if (!mallId || !event) return;
    (event.content?.blocks || []).forEach(b => {
      if (b.type !== 'timesale' || timesaleProductsMap[b.id]) return;
      const nos = (b.productNos || []).slice(0, 4);
      if (!nos.length) { setTimesaleProductsMap(prev => ({ ...prev, [b.id]: [] })); return; }
      Promise.all(nos.map(no => api.get(`/api/${mallId}/products/${no}`).then(r => r.data).catch(() => null)))
        .then(arr => setTimesaleProductsMap(prev => ({ ...prev, [b.id]: arr.filter(Boolean) })));
    });
  }, [mallId, event, timesaleProductsMap]);

  const handleShowHtml = () => {
    if (!event) {
      message.error('이벤트 데이터가 없습니다.');
      return;
    }

    let html = `<!--@layout(/layout/basic/layout.html)-->\n\n`;
    html += `<div id="evt-root"></div>\n\n`;

    const allBlocks = event.content?.blocks || [];

    const regionCoupons = allBlocks
      .flatMap(b => b.type === 'image' ? (b.regions || []).filter(r => r.coupon).map(r => r.coupon) : [])
      .join(',');

    // 이미지 영역 쿠폰 + 이벤트 전체 쿠폰(couponNos)을 합쳐 중복 제거
    const eventCoupons = Array.isArray(event.couponNos) ? event.couponNos.join(',') : '';
    const uniqueCoupons = [...new Set(`${regionCoupons},${eventCoupons}`.split(',').map(s => String(s).trim()).filter(Boolean))];

    const productTabBlock = allBlocks.find(b => b.type === 'product_group' && b.layoutType === 'tabs');
    const totalTabCount = productTabBlock ? (productTabBlock.tabs || []).length : 0;
    const activeColor = productTabBlock ? productTabBlock.activeColor || '#1890ff' : '#1890ff';

    const pageMaxWidthAttr = event.pageMaxWidth ? ` data-page-max-width="${event.pageMaxWidth}"` : '';

    // 렌더러 선택: 신규 빌더로 만든 이벤트(renderer='eventOnimon') 또는 신기능 블록 포함 시 새 렌더러,
    // 그 외 기존 이벤트는 onimon.js 유지(출시된 라이브 이벤트 보호)
    const usesNewRenderer = event.renderer === 'eventOnimon' || allBlocks.some(b =>
      b.type === 'timesale' || b.type === 'image_slide' ||
      (b.rolling && b.rolling.enabled) ||
      (Array.isArray(b.soldOutNos) && b.soldOutNos.length > 0)
    );
    const rendererFile = usesNewRenderer ? 'eventOnimon.js' : 'onimon.js';

    html += `<script src="${API_BASE}/${rendererFile}" data-mall-id="${mallId}" data-page-id="${id}" data-api-base="${API_BASE}" data-tab-count="${totalTabCount}" data-active-color="${activeColor}"${pageMaxWidthAttr} ${uniqueCoupons.length > 0 ? `data-coupon-nos="${uniqueCoupons.join(',')}"` : ''}></script>\n`;

    setHtmlCode(html);
    setHtmlModalVisible(true);
  };
  
  const handleCopy = async (text) => {
    await navigator.clipboard.writeText(text);
    message.success('코드 복사 완료');
  };
  
  if (!event) return null;

  const blocksToRender = event.content?.blocks || (event.images || []).map(img => ({ type: 'image', ...img }));

  // 미리보기용: 탭별 그리드 컬럼 수 + 표시 상품 목록(직접/카테고리)
  const getPreviewCols = (b, idx) => (b.layoutType === 'tabs' && b.tabGridSizes && b.tabGridSizes[idx] != null) ? b.tabGridSizes[idx] : b.gridSize;
  const getPreviewProducts = (b, idx) => {
    if (b.registerMode === 'direct') {
      return b.layoutType === 'tabs' ? ((b.tabDirectProducts || {})[idx] || []) : (b.directProducts || []);
    }
    let catNo;
    if (b.layoutType === 'tabs') { const t = (b.tabs || [])[idx] || {}; catNo = t.sub || t.root; }
    else { catNo = b.sub || b.root; }
    return catNo ? (categoryProductsMap[String(catNo)] || []) : [];
  };

  // ✅ [수정] CSS 팁 내용 변경
  const cssTips = `/* --- 상품 그리드 디자인 예시 <style> 태그로 감싸서 붙여넣으세요.--- */
      
      /*상품 아이콘 위치 지정 */
      .prd_icons{position:absolute; top:0!important;right:0!important} /*왼쪽 상단*/
      .prd_icons{position:absolute; bottom:0!important;right:0!important} /*왼쪽 하단*/
      .prd_icons{position:absolute; top:0!important;left:0!important} /*오른쪽 상단*/
      .prd_icons{position:absolute; bottom:0!important;left:0!important} /*오른쪽 하단*/

      /* 상품명 폰트 굵기 및 색상 변경 */
      .prd_name {
        font-weight: 500!important;; /* 예: 500  600 700 800 숫자가 커질수록 굵기가 조절 가능*/
        color: #000000!important; /* 예: 검은색 */
      }

      /* 할인율 텍스트 굵기 및 색상 변경 */
      .sale_percent, .prd_coupon_percent {
        font-weight: 500!important;; /*  예: 500  600 700 800 숫자가 커질수록 굵기가 조절 가능 */
        color: #ff4d4f !important; /* 예: 빨간색 */
      }

      /* 최종 가격 폰트 굵기 및 색상 변경 */
      .sale_price, .prd_coupon {
        font-weight: 500!important;; /*  예: 500  600 700 800 숫자가 커질수록 굵기가 조절 가능 */
        color: #000000 !important; /* 예: 검은색 */
      }

      /* 원래 가격(줄 그어진 가격) 폰트 굵기 및 색상 변경 */
      .original_price {
        font-weight: 500!important;; /*  예: 500  600 700 800 숫자가 커질수록 굵기가 조절 가능 */
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
        <div style={{ maxWidth: event.pageMaxWidth || 800, margin: '0 auto' }}>
          {blocksToRender.map(block => {
            const blockId = block.id || block._id;
            switch (block.type) {
              case 'image':
                return (
                  <div key={blockId} style={{ position:'relative', width:'100%', marginBottom: 8 }}>
                    <img src={block.src} alt="이벤트 이미지" style={{ width: '100%' }} />
                    {(block.regions || []).map(r => {
                      const kind = r.coupon ? 'coupon' : r.tabTarget ? 'tab' : r.popup ? 'popup' : 'url';
                      const c = { coupon: '#ff6347', tab: '#722ed1', popup: '#13c2c2', url: '#1890ff' }[kind];
                      const label = { coupon: '쿠폰', tab: '탭', popup: '팝업', url: 'URL' }[kind];
                      const style = { position: 'absolute', left: `${r.xRatio*100}%`, top: `${r.yRatio*100}%`, width: `${r.wRatio*100}%`, height: `${r.hRatio*100}%`, border: `2px dashed ${c}`, cursor: 'pointer', background: `${c}33`, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start' };
                      const badge = <span style={{ background: c, color: 'white', fontSize: '10px', padding: '1px 4px', borderRadius: '2px', lineHeight: 1, fontWeight: 'bold', margin: '1px' }}>{label}</span>;
                      if (kind === 'url') return (<a key={r.id || r._id} href={r.href} target="_blank" rel="noreferrer" style={style}>{badge}</a>);
                      return (<div key={r.id || r._id} style={style} onClick={(e) => { e.preventDefault(); messageApi.info(kind === 'coupon' ? '쿠폰은 라이브 페이지에서 다운로드됩니다.' : kind === 'tab' ? '클릭 시 상품 탭으로 이동합니다 (라이브).' : '클릭 시 팝업이 열립니다 (라이브).'); }}>{badge}</div>);
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
              case 'event_notice': {
                  const ns = block.noticeStyle || {};
                  return (
                    <div key={blockId} style={{ margin: '8px 0' }}>
                      <div style={{ padding: '12px 16px', background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 6, fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>{block.noticeTitle || '이벤트 유의사항'}</span><span style={{ fontSize: 12 }}>▾</span></div>
                      {block.noticeImage && <img src={block.noticeImage} alt="유의사항" style={{ maxWidth: '100%', display: 'block', marginTop: 8 }} />}
                      {block.noticeText && <div style={{ marginTop: block.noticeImage ? 0 : 8, padding: ns.padding ?? 16, background: ns.background || 'transparent', color: ns.color || '#444', fontSize: ns.fontSize ?? 14, lineHeight: ns.lineHeight ?? 1.7, letterSpacing: ns.letterSpacing ? `${ns.letterSpacing}px` : undefined, whiteSpace: 'pre-wrap' }}>{block.noticeText}</div>}
                    </div>
                  );
              }
              case 'product_group': {
                  const activeTabIndex = previewActiveTabs[blockId] || 0;
                  const tabCols = block.tabsPerRow && block.tabsPerRow >= 2 ? block.tabsPerRow : ((block.tabs || []).length || 1);
                  return (
                    <div key={blockId} style={{ padding: '16px 0', fontFamily: "'Noto Sans KR', sans-serif" }}>
                        {block.layoutType === 'tabs' && block.tabs && (
                          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${tabCols}, 1fr)`, gap: 8, marginTop: 16 }}>
                            {(block.tabs || []).map((t, i) => (
                              <Button key={i} style={{ background: i === activeTabIndex ? block.activeColor || '#1890ff' : undefined, color: i === activeTabIndex ? '#fff' : undefined, borderColor: i === activeTabIndex ? block.activeColor || '#1890ff' : undefined }} onClick={() => { setPreviewActiveTabs(prev => ({ ...prev, [blockId]: i })); }}>
                                {t.title || `탭 ${i + 1}`}
                              </Button>
                            ))}
                          </div>
                        )}
                        {renderGrid(getPreviewCols(block, activeTabIndex), getPreviewProducts(block, activeTabIndex), previewDiscountPercent, block.cardTemplate, { thumbRadius: block.thumbRadius, iconPosition: block.iconPosition, cardStyle: block.cardStyle, rolling: (block.layoutType === 'tabs' ? (block.tabRolling && block.tabRolling[activeTabIndex]) : block.rolling), soldOutNos: block.soldOutNos })}
                    </div>
                  );
              }
              case 'image_slide':
                return (
                  <div key={blockId} style={{ marginBottom: 16 }}>
                    <ImageSlidePreview images={block.images} sw={block.swiper} />
                  </div>
                );
              case 'timesale': {
                const tprev = (timesaleProductsMap[blockId] || []).slice(0, 4);
                const tTotal = (block.productNos || []).length;
                return (
                  <div key={blockId} style={{ marginBottom: 16 }}>
                    <TimesaleBanner title={block.title} endDate={block.endDate} showCountdown={block.showCountdown} bannerStyle={block.bannerStyle} />
                    {renderGrid(block.gridSize || 2, tprev, 0, block.cardTemplate || 'badge', { cardStyle: block.cardStyle })}
                    {tTotal > tprev.length && <div style={{ textAlign: 'center', fontSize: 12, color: '#aaa', marginTop: 6 }}>외 {tTotal - tprev.length}개 — 라이브에서 모두 표시</div>}
                  </div>
                );
              }
              default:
                return null;
            }
          })}
        </div>
      </Card>
      
      <Modal
        title="HTML 코드 — 카페24에 붙여넣는 법"
        open={htmlModalVisible}
        footer={[
          <Button key="close" onClick={() => setHtmlModalVisible(false)}>닫기</Button>,
          <Button key="copy" type="primary" icon={<CopyOutlined />} onClick={() => handleCopy(htmlCode)}>코드 복사</Button>,
        ]}
        onCancel={() => setHtmlModalVisible(false)}
        width={820}
      >
        <Alert
          type="success"
          showIcon
          style={{ marginBottom: 14 }}
          message="아래 코드를 카페24 디자인 편집의 새 화면(HTML)에 붙여넣으면 이 이벤트가 그 주소에 노출됩니다."
        />
        <Steps
          direction="vertical"
          size="small"
          current={-1}
          style={{ marginBottom: 16 }}
          items={[
            { title: '카페24 쇼핑몰 관리자 → 디자인(스마트디자인) → [디자인 편집] 진입' },
            { title: '[화면 추가]로 원하는 위치/주소(URL)의 새 화면을 만듭니다', description: '예: 이벤트 전용 페이지 주소 — 이 주소를 메뉴·배너·배송 안내 등에 연결합니다.' },
            { title: '추가한 화면을 열고 상단에서 [HTML] (HTML 수정 모드)로 전환', description: '편집 영역을 코드 보기 모드로 바꿉니다.' },
            { title: '아래 코드를 전체 복사해 그 위치에 붙여넣고 저장', description: '맨 위 <!--@layout(...)--> 줄까지 포함해 통째로 붙여넣으세요.' },
            { title: '(선택) 디자인 더 다듬기', description: '“CSS 커스텀 팁”의 코드를 <style>…</style>로 감싸 <script> 아래에 함께 붙여넣으면 글꼴·색을 바꿀 수 있습니다.' },
          ]}
        />
        <Typography.Text strong>붙여넣을 HTML 코드</Typography.Text>
        <Input.TextArea value={htmlCode} rows={12} readOnly style={{ fontFamily: 'monospace', fontSize: '12px', marginTop: 6 }} />
        <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}>
          ※ 쿠폰·페이지 너비 등은 저장만으로 자동 반영되지만, 블록 구성을 바꾸면 다시 이 코드를 받아 같은 화면에 붙여넣어 주세요.
        </Typography.Paragraph>
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
