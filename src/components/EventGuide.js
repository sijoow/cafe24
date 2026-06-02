import React from 'react';
import { Card, Collapse, Tag, Space, Divider } from 'antd';
import {
  PictureOutlined, FontSizeOutlined, YoutubeOutlined, ShoppingCartOutlined,
  ExclamationCircleOutlined, LinkOutlined, TagOutlined, SwapOutlined, ExpandOutlined,
  ReadOutlined,
} from '@ant-design/icons';
import { renderGrid, CARD_TEMPLATES, SAMPLE_PRODUCTS } from './productCard';

// 빌더와 동일한 UI 요소로 각 기능을 시각적으로 설명하는 하단 가이드.
// 상품명/가격 등은 예시(SAMPLE_PRODUCTS) 데이터 사용.

const blockItems = [
  { icon: <PictureOutlined />, name: '이미지 블록', desc: '이미지를 업로드해 배치. 이미지 위에 클릭 영역(URL·쿠폰·탭 이동·팝업)을 그릴 수 있습니다.' },
  { icon: <FontSizeOutlined />, name: '텍스트 블록', desc: '문구 + 정렬/폰트크기/굵기/색상/여백 설정.' },
  { icon: <YoutubeOutlined />, name: '영상 블록', desc: 'YouTube 링크/ID로 영상 삽입 (비율·자동재생 설정).' },
  { icon: <ShoppingCartOutlined />, name: '상품 블록', desc: '직접 등록 또는 카테고리로 상품 노출. 단품/탭, 그리드, 카드 디자인 지정.' },
  { icon: <ExclamationCircleOutlined />, name: '이벤트 유의사항 블록', desc: '클릭 시 슬라이드로 펼쳐지는 유의사항(이미지 또는 텍스트).' },
];

const regionItems = [
  { color: '#fe6326', label: 'URL', icon: <LinkOutlined />, desc: '클릭 시 지정한 주소로 이동합니다.' },
  { color: '#ff6347', label: '쿠폰', icon: <TagOutlined />, desc: '클릭 시 선택한 쿠폰이 다운로드됩니다.' },
  { color: '#722ed1', label: '탭', icon: <SwapOutlined />, desc: '클릭 시 지정한 상품 블록의 해당 탭으로 이동+스크롤합니다.' },
  { color: '#13c2c2', label: '팝업', icon: <ExpandOutlined />, desc: '클릭 시 1~10장 이미지 팝업(캐러셀)이 열립니다. 팝업 안에도 닫기/링크 영역 지정 가능.' },
];

const Row = ({ left, children }) => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
    <div style={{ flexShrink: 0, width: 150, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>{left}</div>
    <div style={{ flex: 1, color: '#555', fontSize: 13, lineHeight: 1.6 }}>{children}</div>
  </div>
);

export default function EventGuide() {
  const items = [
    {
      key: 'blocks',
      label: '① 콘텐츠 블록 종류',
      children: (
        <div>
          <p style={{ color: '#888', fontSize: 13 }}>아래 버튼/드래그로 블록을 추가하고, 썸네일을 드래그해 순서를 바꿀 수 있습니다.</p>
          {blockItems.map((b, i) => (
            <Row key={i} left={<>{b.icon}<span>{b.name}</span></>}>{b.desc}</Row>
          ))}
        </div>
      ),
    },
    {
      key: 'regions',
      label: '② 이미지 클릭 영역 (URL · 쿠폰 · 탭 이동 · 팝업)',
      children: (
        <div>
          <p style={{ color: '#888', fontSize: 13 }}>이미지 블록을 선택한 뒤 상단 버튼을 누르고, 이미지 위에서 <b>마우스 드래그</b>로 영역을 그립니다. 영역 종류는 색으로 구분됩니다.</p>
          <div style={{ position: 'relative', maxWidth: 360, margin: '8px 0', borderRadius: 6, overflow: 'hidden', border: '1px solid #eee' }}>
            <div style={{ aspectRatio: '16/9', background: 'linear-gradient(135deg,#f0f0f0,#e0e0e0)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb' }}>예시 이미지</div>
            {regionItems.map((r, i) => (
              <div key={i} style={{ position: 'absolute', top: `${8 + i * 20}%`, left: `${6 + i * 18}%`, width: '24%', height: '16%', border: `2px dashed ${r.color}`, background: `${r.color}33`, display: 'flex', alignItems: 'flex-start' }}>
                <span style={{ background: r.color, color: '#fff', fontSize: 10, padding: '1px 4px', borderRadius: 2, fontWeight: 'bold', margin: 1 }}>{r.label}</span>
              </div>
            ))}
          </div>
          {regionItems.map((r, i) => (
            <Row key={i} left={<><span style={{ color: r.color }}>{r.icon}</span><Tag color={r.color} style={{ marginInlineEnd: 0 }}>{r.label}</Tag></>}>{r.desc}</Row>
          ))}
        </div>
      ),
    },
    {
      key: 'product',
      label: '③ 상품 블록 설정',
      children: (
        <div>
          <Row left="등록 방식">상품 검색하여 직접 추가 / 카테고리 지정(번호 직접입력 가능, 이름·번호 검색 지원).</Row>
          <Row left="노출 방식">단품(목록 한 줄) / 탭(여러 탭에 다른 상품).</Row>
          <Row left="그리드 사이즈">2×2 · 3×3 · 4×4. 탭 모드는 <b>탭별로 그리드를 따로</b> 지정할 수 있습니다.</Row>
          <Row left="탭 줄당 개수">탭 버튼을 한 줄에 몇 개 배치할지 (자동/2/3/4).</Row>
          <Row left="콘텐츠 너비">기본(800px) / 넓게(95%) / 꽉 채움(100%).</Row>
        </div>
      ),
    },
    {
      key: 'card',
      label: '④ 상품 카드 디자인 (6종 템플릿)',
      children: (
        <div>
          <p style={{ color: '#888', fontSize: 13 }}>상품명·요약정보·가격/할인율은 <b>Cafe24 데이터에 자동 매핑</b>됩니다. 아래는 예시 상품으로 본 각 템플릿 모양입니다.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            {CARD_TEMPLATES.map((t) => (
              <div key={t.value} style={{ width: 200 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{t.label}</div>
                <div style={{ fontSize: 11, color: '#999', marginBottom: 6, minHeight: 30 }}>{t.desc}</div>
                <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 8 }}>
                  {renderGrid(1, [SAMPLE_PRODUCTS[0]], 0, t.value, { thumbRadius: 'rounded', iconPosition: 'top-left' })}
                </div>
              </div>
            ))}
          </div>
          <Divider style={{ margin: '16px 0 8px' }} />
          <Row left="썸네일 모양">사각형 / 둥근 모서리.</Row>
          <Row left="아이콘 위치">좌상 · 우상 · 좌하 · 우하. (BEST/NEW 등 아이콘은 <b>Cafe24 어드민 "아이콘 꾸미기" 등록 상품</b>에만 실제 노출)</Row>
        </div>
      ),
    },
    {
      key: 'event',
      label: '⑤ 이벤트 전체 설정 (쿠폰 · 페이지 너비)',
      children: (
        <div>
          <Row left="이벤트 적용 쿠폰">선택한 쿠폰의 <b>혜택가</b>로 상품이 표시됩니다. 라이브 노출하려면 반드시 목록에 추가해야 하며, 추가/삭제 후 저장만 하면 자동 반영(HTML 재배포 불필요). 미오픈 쿠폰은 번호 직접 입력 후 Enter.</Row>
          <Row left="페이지 최대 너비">이미지·영상·유의사항·상품의 웹 최대 너비(기본 800px). 값 변경 후 <b>적용</b>을 누르면 미리보기에 반영, 저장 시 라이브 반영.</Row>
        </div>
      ),
    },
    {
      key: 'notice',
      label: '⑥ 이벤트 유의사항 블록',
      children: (
        <div>
          <p style={{ color: '#888', fontSize: 13 }}>라이브에서 토글 버튼 클릭 시 본문이 슬라이드로 펼쳐집니다. 이미지 또는 텍스트 중 하나만 입력해도 됩니다.</p>
          <div style={{ maxWidth: 360, margin: '8px 0' }}>
            <div style={{ padding: '12px 16px', background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 6, fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}><span>이벤트 유의사항</span><span>▾</span></div>
            <div style={{ padding: 14, fontSize: 13, color: '#444', lineHeight: 1.7, border: '1px solid #f0f0f0', borderTop: 'none' }}>· 예시: 본 이벤트는 조기 종료될 수 있습니다.<br />· 쿠폰은 1인 1회 다운로드 가능합니다.</div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <Card
      title={<Space><ReadOutlined /><span>사용 설명서 — 이벤트 페이지 제작 가이드</span></Space>}
      style={{ marginTop: 24 }}
      styles={{ body: { paddingTop: 8 } }}
    >
      <p style={{ color: '#888', fontSize: 13, marginTop: 0 }}>각 항목을 펼쳐 기능 설명과 예시를 확인하세요. (예시의 상품명·가격은 임의 데이터입니다)</p>
      <Collapse items={items} defaultActiveKey={['blocks']} />
    </Card>
  );
}
