// 상품 카드 템플릿 — 미리보기(EventCreate/Edit/Detail)에서 공유 사용.
// 공개 렌더러(back/.../public/eventOnimon.js)의 buildCardText 와 디자인을 맞춰야 함.
import React from 'react';
import { BlockOutlined } from '@ant-design/icons';

// 스크롤바 숨김(스와이퍼 느낌) — 1회 주입
if (typeof document !== 'undefined' && !document.getElementById('ds-noscroll-style')) {
  const s = document.createElement('style');
  s.id = 'ds-noscroll-style';
  s.textContent = '.ds-noscroll::-webkit-scrollbar{display:none;} .ds-noscroll{scrollbar-width:none;-ms-overflow-style:none;} .swprev-arrow{opacity:0;transition:opacity .25s;} .swprev-wrap:hover .swprev-arrow{opacity:1;}';
  document.head.appendChild(s);
}
// 가로 드래그 스크롤 — 데스크톱 마우스로도 '쓸어서' 넘기기 (모바일은 네이티브 터치). 스크롤바 숨김 + 최대너비 가둠.
export function DragScroll({ children, style, className }) {
  const ref = React.useRef(null);
  const st = React.useRef({ active: false, x: 0, left: 0, moved: false });
  const down = (e) => { const el = ref.current; if (!el) return; st.current = { active: true, x: e.clientX, left: el.scrollLeft, moved: false }; el.style.cursor = 'grabbing'; };
  const move = (e) => { const el = ref.current; if (!el || !st.current.active) return; const dx = e.clientX - st.current.x; if (Math.abs(dx) > 3) st.current.moved = true; el.scrollLeft = st.current.left - dx; };
  const up = () => { const el = ref.current; if (el) el.style.cursor = 'grab'; st.current.active = false; };
  const clickCap = (e) => { if (st.current.moved) { e.preventDefault(); e.stopPropagation(); st.current.moved = false; } };
  return (
    <div ref={ref} className={`ds-noscroll${className ? ' ' + className : ''}`} style={{ cursor: 'grab', userSelect: 'none', maxWidth: '100%', ...style }} onMouseDown={down} onMouseMove={move} onMouseUp={up} onMouseLeave={up} onClickCapture={clickCap}>
      {children}
    </div>
  );
}

// 상품 블록 모달의 카드 디자인 선택지.
// 각 항목은 Cafe24 데이터 필드(상품명/요약정보/판매가·할인가/쿠폰가)에 자동 매핑됨.
export const CARD_TEMPLATES = [
  { value: 'basic', label: '① 기본형', desc: '요약정보 → 상품명 → 정가 취소선 → 50% 최종가' },
  { value: 'musinsa', label: '② 브랜드 강조형 (M사 스타일)', desc: '요약정보를 브랜드처럼 위에 → 상품명 → 19% 최종가' },
  { value: 'gmarket', label: '③ 쿠폰 강조형 (G사 스타일)', desc: '상품명 → 쿠폰적용가 라벨 → 큰 43% 최종가' },
  { value: 'simple', label: '④ 심플형', desc: '상품명 → 최종가만 (정가·할인율 숨김)' },
  { value: 'center', label: '⑤ 가운데 정렬형', desc: '전부 가운데, 정가→최종가 가로' },
  { value: 'emphasis', label: '⑥ 강조형(세로)', desc: '할인율·최종가 큰 글씨 세로' },
  { value: 'badge', label: '⑦ 세일 배지형', desc: '썸네일에 빨강 할인율 배지 + 상품명 → 정가 취소선 → 큰 최종가' },
];

// 미리보기 썸네일 placeholder — 실제 상품 이미지처럼 칸을 꽉 채워서
// 썸네일 모서리(사각/둥근) 차이가 한눈에 보이도록 한다.
const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect width='300' height='300' fill='%23e6eaf0'/%3E%3Cg fill='%23bac3d1'%3E%3Ccircle cx='112' cy='116' r='26'/%3E%3Cpath d='M56 234 L132 156 L184 206 L222 176 L264 234 Z'/%3E%3C/g%3E%3C/svg%3E";

// 모달 카드 템플릿 선택 시 보여줄 "예시" 상품.
// ⚠ 모든 쇼핑몰이 공통으로 보는 화면이므로 특정 몰의 실제 상품명을 넣지 않는다.
// 각 위치에 어떤 데이터가 들어가는지 알려주는 안내용 placeholder 텍스트를 사용한다.
// (상품명=Cafe24 상품명, 요약설명=Cafe24 요약설명에 자동 매핑되고, 가격·아이콘은 표시 시연용)
export const SAMPLE_PRODUCTS = [
  { product_no: 'sample1', product_name: '카페24 상품명이 들어갑니다', summary_description: '상품요약설명 텍스트가 들어갑니다', price: 50000, benefit_price: 25000, benefit_percentage: 50, image_medium: PLACEHOLDER_IMG, decoration_icon_url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Ccircle cx='22' cy='22' r='22' fill='%23fe6326'/%3E%3Ctext x='22' y='27' font-size='11' fill='white' text-anchor='middle' font-family='sans-serif' font-weight='bold'%3EBEST%3C/text%3E%3C/svg%3E" },
  { product_no: 'sample2', product_name: '카페24 상품명이 들어갑니다', summary_description: '상품요약설명 텍스트가 들어갑니다', price: 39000, sale_price: 31200, image_medium: PLACEHOLDER_IMG, decoration_icon_url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='44'%3E%3Ccircle cx='22' cy='22' r='22' fill='%2313c2c2'/%3E%3Ctext x='22' y='27' font-size='12' fill='white' text-anchor='middle' font-family='sans-serif' font-weight='bold'%3ENEW%3C/text%3E%3C/svg%3E" },
];

const num = (v) => { if (v == null) return null; const n = parseFloat(String(v).replace(/[^0-9.]/g, '')); return isFinite(n) ? n : null; };
const fmt = (v) => `${(Number(v) || 0).toLocaleString('ko-KR')}원`;

// 정가/판매가/쿠폰가 → 최종가·할인율 계산. previewPct: 쿠폰 추정 할인율(benefit_price 없을 때)
function computePrice(p, previewPct) {
  const orig = num(p.price) || 0;
  const sale = num(p.sale_price);
  let benefit = num(p.benefit_price);
  if (benefit == null && previewPct > 0) { const base = (sale != null && sale < orig) ? sale : orig; benefit = Math.round(base * (100 - previewPct) / 100); }
  const isSale = sale != null && sale < orig;
  const isCoupon = benefit != null && benefit < (isSale ? sale : orig);
  let finalP = orig; if (isSale) finalP = sale; if (isCoupon) finalP = benefit;
  let pct = null;
  if (isCoupon) { const base = isSale ? sale : orig; pct = base > 0 ? Math.round((base - benefit) / base * 100) : null; }
  else if (isSale) { pct = orig > 0 ? Math.round((orig - sale) / orig * 100) : null; }
  return { orig, finalP, pct: pct || 0, hasDiscount: finalP < orig, isCoupon };
}

function CardBody({ p, template, pr, cardStyle = {} }) {
  const name = p.product_name || '';
  const summary = p.summary_description || '';
  // 반응형: 카드(컨테이너) 폭에 비례해 글자 크기 자동 조절 (cqw + clamp).
  const nameBase = 'clamp(12px, 6.5cqw, 18px)';
  const priceSize = 'clamp(12px, 6cqw, 17px)';
  const subBase = 'clamp(10px, 4.5cqw, 13px)';
  const origSize = 'clamp(10px, 5cqw, 14px)';
  const bigSize = 'clamp(13px, 8cqw, 22px)';
  const hugeSize = 'clamp(14px, 9cqw, 24px)';
  // 블록별 카드 스타일 오버라이드 (상품명/요약 크기·굵기, 할인율 색상)
  const cs = cardStyle || {};
  const scl = (base, s) => (s && Number(s) !== 1) ? `calc(${base} * ${s})` : base;
  const nameSize = scl(nameBase, cs.nameScale);
  const subSize = scl(subBase, cs.descScale);
  const nameWeight = cs.nameWeight || 500;
  const descWeight = cs.descWeight || 400;
  const pctColor = cs.percentColor || '#ff4d4f';
  const strike = (s) => <span style={{ color: '#bbb', textDecoration: 'line-through', fontSize: origSize }}>{s}</span>;
  const pctEl = (sz) => pr.pct > 0 ? <span style={{ color: pctColor, fontWeight: 'bold', fontSize: sz, marginRight: 6 }}>{pr.pct}%</span> : null;
  const sub = (summary && !cs.descHide) ? <div style={{ fontSize: subSize, fontWeight: descWeight, color: '#999' }}>{summary}</div> : null;

  switch (template) {
    case 'simple':
      return (<div style={{ paddingTop: 10, minHeight: 70 }}>
        <div style={{ fontWeight: nameWeight, fontSize: nameSize, lineHeight: 1.2 }}>{name}</div>
        <div style={{ marginTop: 6, fontWeight: 'bold', fontSize: priceSize }}>{fmt(pr.finalP)}</div>
      </div>);
    case 'musinsa':
      return (<div style={{ paddingTop: 10, minHeight: 80 }}>
        {summary && !cs.descHide && <div style={{ fontSize: subSize, color: '#888', fontWeight: cs.descWeight || 600 }}>{summary}</div>}
        <div style={{ fontWeight: nameWeight, fontSize: nameSize, lineHeight: 1.3, marginTop: 2 }}>{name}</div>
        <div style={{ marginTop: 6 }}>{pctEl(priceSize)}<span style={{ fontWeight: 'bold', fontSize: priceSize }}>{fmt(pr.finalP)}</span></div>
      </div>);
    case 'gmarket':
      return (<div style={{ paddingTop: 10, minHeight: 90 }}>
        <div style={{ fontWeight: nameWeight, fontSize: nameSize, lineHeight: 1.3 }}>{name}</div>
        {sub}
        {pr.hasDiscount && <div style={{ marginTop: 6 }}><span style={{ fontSize: subSize, color: '#999', marginRight: 4 }}>{pr.isCoupon ? '쿠폰적용가' : '판매가'}</span>{strike(fmt(pr.orig))}</div>}
        <div style={{ marginTop: 2 }}>{pr.hasDiscount && pctEl(bigSize)}<span style={{ fontWeight: 'bold', fontSize: bigSize, color: '#111' }}>{fmt(pr.finalP)}</span></div>
      </div>);
    case 'center':
      return (<div style={{ paddingTop: 10, minHeight: 80, textAlign: 'center' }}>
        {sub}
        <div style={{ fontWeight: nameWeight, fontSize: nameSize, lineHeight: 1.3 }}>{name}</div>
        <div style={{ marginTop: 6 }}>{pr.hasDiscount && <>{strike(fmt(pr.orig))}<span style={{ margin: '0 4px', color: '#ccc' }}>→</span></>}{pr.hasDiscount && pctEl(priceSize)}<span style={{ fontWeight: 'bold', fontSize: priceSize }}>{fmt(pr.finalP)}</span></div>
      </div>);
    case 'emphasis':
      return (<div style={{ paddingTop: 10, minHeight: 100 }}>
        {sub}
        <div style={{ fontWeight: nameWeight, fontSize: nameSize, lineHeight: 1.3 }}>{name}</div>
        {pr.hasDiscount && <div style={{ marginTop: 6 }}>{strike(fmt(pr.orig))}</div>}
        {pr.hasDiscount && pr.pct > 0 && <div style={{ color: pctColor, fontWeight: 'bold', fontSize: hugeSize, lineHeight: 1.1 }}>{pr.pct}%</div>}
        <div style={{ fontWeight: 'bold', fontSize: hugeSize, lineHeight: 1.2 }}>{fmt(pr.finalP)}</div>
      </div>);
    case 'badge':
      return (<div style={{ paddingTop: 10, minHeight: 90 }}>
        <div style={{ fontWeight: nameWeight, fontSize: nameSize, lineHeight: 1.3 }}>{name}</div>
        <div style={{ marginTop: 4, lineHeight: 1.4 }}>
          {pr.hasDiscount && <div>{strike(fmt(pr.orig))}</div>}
          <div style={{ fontWeight: 'bold', fontSize: bigSize, color: '#111' }}>{fmt(pr.finalP)}</div>
        </div>
      </div>);
    case 'basic':
    default:
      return (<div style={{ paddingTop: 10, minHeight: 90 }}>
        {sub}
        <div style={{ fontWeight: nameWeight, fontSize: nameSize, lineHeight: 1.2 }}>{name}</div>
        <div style={{ marginTop: 4, lineHeight: 1.4 }}>
          {pr.hasDiscount && <div>{strike(fmt(pr.orig))}</div>}
          <div>{pr.hasDiscount && pctEl(priceSize)}<span style={{ fontWeight: 'bold', fontSize: priceSize }}>{fmt(pr.finalP)}</span></div>
        </div>
      </div>);
  }
}

// 아이콘 위치 스타일 (좌상/우상/좌하/우하)
function iconPosStyle(pos) {
  const base = { position: 'absolute', display: 'flex', flexWrap: 'wrap', gap: 4, pointerEvents: 'none' };
  if (pos === 'top-right') return { ...base, top: 8, right: 8 };
  if (pos === 'bottom-left') return { ...base, bottom: 8, left: 8 };
  if (pos === 'bottom-right') return { ...base, bottom: 8, right: 8 };
  return { ...base, top: 8, left: 8 };
}

// cols: 그리드 컬럼 수, products: 상품 배열(비면 스켈레톤), previewPct: 쿠폰 추정 할인율, template: 카드 템플릿 id
// opts: { thumbRadius: 'square'|'rounded', iconPosition: 'top-left'|'top-right'|'bottom-left'|'bottom-right' }
export function renderGrid(cols, products = [], previewPct = 0, template = 'basic', opts = {}) {
  const thumbRadiusPx = opts.thumbRadius === 'rounded' ? 12 : 0;
  const iconPosition = opts.iconPosition || 'off';
  const cardStyle = opts.cardStyle || {};
  // 콘텐츠 너비(기본/넓게/꽉채움) 미리보기 반영 — 좁은 칸에서도 좌우 여백 차이로 보이게 함
  const widthMap = { default: '74%', wide: '90%', full: '100%' };
  const gridWidth = opts.widthMode ? (widthMap[opts.widthMode] || '100%') : undefined;
  const rolling = (opts.rolling && opts.rolling.enabled) ? opts.rolling : null;
  const soldOutSet = new Set((opts.soldOutNos || []).map(String));
  const isSkeleton = products.length === 0;
  const itemsToRender = isSkeleton ? Array.from({ length: Math.min(cols * cols, 4) }) : products;

  // 카드 1개 렌더 (그리드/롤링 공용)
  const renderCard = (p, i) => {
    if (isSkeleton) {
      return (
        <div key={i} style={{ overflow: 'hidden', background: '#fff', borderRadius: thumbRadiusPx }}>
          <div style={{ aspectRatio: '1 / 1', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', borderRadius: thumbRadiusPx }}><BlockOutlined style={{ fontSize: 40, color: '#d9d9d9' }} /></div>
          <div style={{ paddingTop: 10, minHeight: 70 }}><div style={{ fontWeight: 500, fontSize: `${18 - cols}px` }}>{`상품명 ${i + 1}`}</div></div>
        </div>
      );
    }
    const pr = computePrice(p, previewPct);
    const img = p.image_medium || p.list_image;
    const soldOut = soldOutSet.has(String(p.product_no));
    // Cafe24 데코 아이콘(아이콘 꾸미기) 수집 — decoration_icon_url + 추가 아이콘 + 기본 아이콘
    const iconUrls = [];
    if (p.decoration_icon_url) iconUrls.push(p.decoration_icon_url);
    (p.additional_icons || []).forEach((ic) => { if (ic && ic.icon_url) iconUrls.push(ic.icon_url); });
    if (p.icons) ['icon_new', 'icon_recom', 'icon_best', 'icon_sale'].forEach((k) => { if (p.icons[k]) iconUrls.push(p.icons[k]); });
    return (
      <div key={p.product_no || i} style={{ overflow: 'hidden', background: '#fff', borderRadius: thumbRadiusPx, containerType: 'inline-size', position: 'relative' }}>
        <div style={{ position: 'relative', aspectRatio: '1 / 1', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', overflow: 'hidden', borderRadius: thumbRadiusPx }}>
          {img ? (<img src={img} alt={p.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: soldOut ? 'grayscale(0.7)' : 'none' }} />) : (<BlockOutlined style={{ fontSize: 40, color: '#d9d9d9' }} />)}
          {template === 'badge' && pr.pct > 0 && (
            <div style={{ position: 'absolute', top: 8, left: 8, background: cardStyle.percentColor || '#ff4d4f', color: '#fff', borderRadius: 8, padding: '2px 8px', fontWeight: 700, fontSize: 'clamp(11px, 5.5cqw, 16px)', lineHeight: 1.2, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>{pr.pct}%</div>
          )}
          {iconUrls.length > 0 && iconPosition !== 'off' && !soldOut && (
            <div style={iconPosStyle(iconPosition)}>
              {iconUrls.map((u, k) => <img key={k} src={u} alt="아이콘" style={{ width: 'clamp(16px, 24cqw, 46px)', height: 'auto', display: 'block' }} />)}
            </div>
          )}
        </div>
        <CardBody p={p} template={template} pr={pr} cardStyle={cardStyle} />
        {soldOut && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(33,37,43,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4, borderRadius: thumbRadiusPx, pointerEvents: 'none' }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: 'clamp(14px, 9cqw, 28px)', letterSpacing: 1, marginTop: '-18%' }}>SOLD OUT</span>
          </div>
        )}
      </div>
    );
  };

  // 롤링(슬라이드) 미리보기 — 라이브는 Splide, 미리보기는 가로 스크롤+스냅으로 동일 느낌 표현
  if (rolling) {
    const pv = Math.max(1, rolling.perView || cols || 2);
    const gap = 16;
    const peekPx = rolling.peek ? 26 : 0;
    const basis = `calc((100% - ${gap * (pv - 1)}px - ${peekPx}px) / ${pv})`;
    const ac = rolling.activeColor || '#333333';
    const arrowBase = { position: 'absolute', top: '38%', transform: 'translateY(-50%)', width: 26, height: 26, borderRadius: '50%', background: ac, boxShadow: '0 1px 4px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', zIndex: 2, pointerEvents: 'none' };
    const arrowCls = rolling.arrowHover !== false ? 'swprev-arrow' : undefined;
    return (
      <div className="swprev-wrap" style={{ position: 'relative', maxWidth: '100%', overflow: 'hidden' }}>
        <DragScroll style={{ display: 'flex', gap, overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 8, WebkitOverflowScrolling: 'touch' }}>
          {products.map((p, i) => (
            <div key={p.product_no || i} style={{ flex: `0 0 ${basis}`, scrollSnapAlign: 'start' }}>{renderCard(p, i)}</div>
          ))}
        </DragScroll>
        {rolling.arrows !== false && (<><div className={arrowCls} style={{ ...arrowBase, left: 2 }}>‹</div><div className={arrowCls} style={{ ...arrowBase, right: 2 }}>›</div></>)}
        {rolling.pagination && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8 }}>
            {products.slice(0, Math.min(products.length, 6)).map((_, i) => <span key={i} style={{ width: i === 0 ? 16 : 6, height: 6, borderRadius: 3, background: i === 0 ? ac : '#ddd', transition: 'all .2s' }} />)}
          </div>
        )}
        <div style={{ textAlign: 'center', fontSize: 11, color: '#bbb', marginTop: 6 }}>← 좌우로 드래그 / 스와이프 →{rolling.autoplay ? ` · 자동 ${rolling.interval || 3}초` : ''}{rolling.loop ? ' · 무한반복' : ''}</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: 16, width: gridWidth, maxWidth: 800, margin: '16px auto' }}>
      {itemsToRender.map((p, i) => renderCard(p, i))}
    </div>
  );
}
