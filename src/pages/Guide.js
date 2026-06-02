// src/pages/Guide.js
// 나의 이벤트 제작 사용설명서 — 상단 탭 형식.
// 이벤트 페이지 제작에서 쓰는 기능을 "하나의 탭 = 하나의 기능"으로 자세히 설명한다.
// 실제 빌더(EventCreate)의 버튼/블록/상품 모달 UI를 그대로 재현하고,
// 화면에 노출되는 예시이므로 상품명·가격은 임의(샘플) 데이터를 사용한다.
import React, { useState } from 'react';
import {
  Card, Tabs, Typography, Tag, Space, Divider, Alert, Button, Input,
  Select, Segmented, InputNumber, ColorPicker, Upload, Steps, Checkbox,
} from 'antd';
import {
  AppstoreOutlined, LinkOutlined, TagOutlined, SwapOutlined, ExpandOutlined,
  ShoppingCartOutlined, YoutubeOutlined, FontSizeOutlined, ExclamationCircleOutlined,
  UploadOutlined, PictureOutlined, SaveOutlined, EyeOutlined, ProfileOutlined,
  ClockCircleOutlined, RetweetOutlined, ColumnWidthOutlined,
} from '@ant-design/icons';
import { renderGrid, CARD_TEMPLATES, SAMPLE_PRODUCTS } from '../components/productCard';
import { TimesaleBanner, ImageSlidePreview, OptRow, SLIDE_ICON, CARD_ICON, TIMESALE_BANNERS } from './EventCreate';
import dayjs from 'dayjs';
import './EventCreate.css';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;

// ── 임의(샘플) 상품 데이터 — 실제 데이터는 Cafe24 상품에 자동 매핑됨 ──
const thumb = (bg) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${bg}'/><stop offset='1' stop-color='#ffffff'/></linearGradient></defs><rect width='300' height='300' fill='url(%23g)'/></svg>`
  )}`;

const GUIDE_PRODUCTS = [
  { product_no: 'g1', product_name: '베이직 그래픽 반팔 티셔츠', summary_description: 'DAILY GRAPHIC TEE', price: 39000, benefit_price: 19500, benefit_percentage: 50, image_medium: thumb('#ffd8a8'), decoration_icon_url: SAMPLE_PRODUCTS[0].decoration_icon_url },
  { product_no: 'g2', product_name: '데일리 코튼 와이드 팬츠', summary_description: 'COTTON WIDE PANTS', price: 59000, sale_price: 41300, image_medium: thumb('#a5d8ff') },
  { product_no: 'g3', product_name: '오버핏 무지 후드 집업', summary_description: 'OVERFIT HOOD ZIP-UP', price: 79000, benefit_price: 63900, image_medium: thumb('#b2f2bb') },
  { product_no: 'g4', product_name: '클래식 첼시 앵클 부츠', summary_description: 'CLASSIC CHELSEA BOOTS', price: 129000, benefit_price: 73530, image_medium: thumb('#d0bfff'), decoration_icon_url: SAMPLE_PRODUCTS[1].decoration_icon_url },
];

// 클릭 영역 4종 — 빌더와 동일한 색/라벨
const REGION_KINDS = [
  { kind: 'url', label: 'URL', color: '#fe6326', icon: <LinkOutlined />, btn: 'URL 추가', how: '이미지에서 원하는 부분을 마우스 좌클릭 드래그로 영역을 그린 뒤, 이동할 주소(https://...)를 입력합니다.', desc: '클릭하면 입력한 주소로 이동합니다. 외부 링크·상품 상세·게시판 등 어떤 URL이든 가능합니다.' },
  { kind: 'coupon', label: '쿠폰', color: '#ff6347', icon: <TagOutlined />, btn: '쿠폰 추가', how: '영역을 그린 뒤 쿠폰을 선택하거나 미오픈 쿠폰 번호를 직접 입력합니다. (여러 개 지정 가능)', desc: '클릭하면 선택한 쿠폰이 다운로드됩니다. "이벤트 적용 쿠폰" 목록에 추가된 쿠폰이어야 라이브에 보입니다.' },
  { kind: 'tab', label: '탭', color: '#722ed1', icon: <SwapOutlined />, btn: '탭 이동 추가', how: '먼저 탭(tabs) 방식 상품 블록을 만든 뒤, 영역을 그리고 이동할 탭을 선택합니다.', desc: '클릭하면 지정한 상품 블록의 해당 탭으로 이동하며 그 위치까지 스크롤됩니다. (예: "신상품 보기" 버튼)' },
  { kind: 'popup', label: '팝업', color: '#13c2c2', icon: <ExpandOutlined />, btn: '팝업 영역 추가', how: '영역을 그린 뒤 팝업에 띄울 이미지를 1~10장 추가합니다. 각 이미지에 닫기·링크 영역도 그릴 수 있습니다.', desc: '클릭하면 이미지 팝업이 열립니다. 2장 이상이면 자동 슬라이드되고, 우상단 X 닫기 버튼은 켜고 끌 수 있습니다.' },
];

// 빌더의 그리드 사이즈 선택 미리보기 (EventCreate의 GridPreview와 동일)
const GridPreview = ({ size, active, onClick }) => (
  <div
    onClick={onClick}
    style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', padding: 8, border: `2px solid ${active ? '#fe6326' : '#d9d9d9'}`,
      borderRadius: 8, width: 70, height: 70, backgroundColor: active ? '#fff7e6' : '#fff', transition: 'all 0.2s',
    }}
  >
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${size}, 1fr)`, gap: 4, width: 32, height: 32, marginBottom: 4 }}>
      {Array.from({ length: size * size }).map((_, i) => (
        <div key={i} style={{ backgroundColor: active ? '#fe6326' : '#d9d9d9', borderRadius: 2 }} />
      ))}
    </div>
    <span style={{ fontSize: 12, fontWeight: active ? 'bold' : 'normal', color: active ? '#fe6326' : '#595959' }}>{size}×{size}</span>
  </div>
);

const Note = ({ children, color = '#888' }) => (
  <p style={{ margin: '0 0 10px', fontSize: 13, color, lineHeight: 1.7 }}>{children}</p>
);
const SubTitle = ({ children }) => (
  <h4 style={{ margin: '18px 0 8px', color: '#1f1f1f' }}>{children}</h4>
);
// 좌측 라벨 + 우측 설명 행
const Row = ({ left, children }) => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '9px 0', borderBottom: '1px solid #f5f5f5' }}>
    <div style={{ flexShrink: 0, width: 130, fontWeight: 600, color: '#444', display: 'flex', alignItems: 'center', gap: 6 }}>{left}</div>
    <div style={{ flex: 1, color: '#555', fontSize: 13, lineHeight: 1.7 }}>{children}</div>
  </div>
);

// 블록 종류 예시: 왼쪽에 실제 블록 모양 미리보기 + 오른쪽에 항목별 설명
const BlockExample = ({ icon, name, preview, points }) => (
  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start', padding: '16px 0', borderBottom: '1px dashed #ececec' }}>
    <div style={{ width: 320, maxWidth: '100%' }}>
      <div className="preview-block-container">
        <div className="block-header">
          <div className="block-title">{icon}<strong>{name}</strong></div>
        </div>
        <div className="block-content">{preview}</div>
      </div>
      <div style={{ textAlign: 'center', fontSize: 11, color: '#bbb', marginTop: 4 }}>↑ 실제 블록 예시</div>
    </div>
    <div style={{ flex: 1, minWidth: 260 }}>
      {points.map((p, i) => (<Row key={i} left={p.t}>{p.d}</Row>))}
    </div>
  </div>
);

// 실제로 뜨는 설정 "창(모달)" 모양을 흉내 낸 목업 — 초보자가 화면과 바로 매칭할 수 있게.
const ModalMock = ({ title, children, okText = '적용' }) => (
  <div style={{ width: 360, maxWidth: '100%', border: '1px solid #e8e8e8', borderRadius: 10, boxShadow: '0 6px 20px rgba(0,0,0,0.10)', overflow: 'hidden', background: '#fff' }}>
    <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
      <span>{title}</span><span style={{ color: '#bbb' }}>✕</span>
    </div>
    <div style={{ padding: 16 }}>{children}</div>
    <div style={{ padding: '10px 16px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
      <Button size="small">취소</Button>
      <Button size="small" type="primary">{okText}</Button>
    </div>
  </div>
);

export default function Guide() {
  // 데모용 로컬 상태 (실제 저장 X — 보여주기 위한 인터랙션)
  const [registerMode, setRegisterMode] = useState('direct');
  const [layoutType, setLayoutType] = useState('single');
  const [gridSize, setGridSize] = useState(2);
  const [cardTemplate, setCardTemplate] = useState('basic');
  const [thumbRadius, setThumbRadius] = useState('square');
  const [iconPosition, setIconPosition] = useState('off');
  const [activeTab, setActiveTab] = useState(0);
  const demoTabs = ['탭 1', '탭 2', '탭 3'];

  // ── 새 기능 데모용 상태 ──
  // 상품 카드 디자인 세부(요약설명 표시/숨김, 상품명·할인율 스타일)
  const [descHide, setDescHide] = useState(true);
  const [nameWeight, setNameWeight] = useState(500);
  const [percentColor, setPercentColor] = useState('#ff4d4f');
  // 상품 롤링(스와이퍼) 옵션
  const [rolling, setRolling] = useState({ enabled: true, perView: 2.3, peek: true, autoplay: false, interval: 3, loop: true, arrows: true, pagination: true });
  const setR = (patch) => setRolling((prev) => ({ ...prev, ...patch }));
  // 품절(SOLD OUT) 데모 — 두 번째 예시 상품을 품절 처리
  const [soldOutOn, setSoldOutOn] = useState(true);
  // 이미지 슬라이드 옵션
  const [slideSw, setSlideSw] = useState({ perView: 1, peek: false, autoplay: true, interval: 3, loop: true, arrows: true, pagination: true });
  const setSlideOpt = (patch) => setSlideSw((prev) => ({ ...prev, ...patch }));
  // 타임세일 배너 디자인 미리보기
  const [tsBanner, setTsBanner] = useState('dark');
  // 탭 영역 너비(기본 98% / 꽉 채움 100%)
  const [tabWidth, setTabWidth] = useState('default');

  const cardStyleDemo = { nameWeight, nameScale: 1, descWeight: 400, descScale: 1, percentColor, descHide };
  // 이미지 슬라이드 예시 이미지(샘플 배너) — 실제로는 직접 올린 이미지가 들어갑니다.
  const slideBanner = (txt, c1, c2) =>
    `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='240'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs><rect width='640' height='240' fill='url(%23g)'/><text x='320' y='132' font-size='30' fill='%23ffffff' text-anchor='middle' font-family='sans-serif' font-weight='bold'>${txt}</text></svg>`
    )}`;
  const GUIDE_SLIDES = [
    { src: slideBanner('배너 이미지 1', '#fe6326', '#ffa940'), href: '' },
    { src: slideBanner('배너 이미지 2', '#1677ff', '#69b1ff'), href: '' },
    { src: slideBanner('배너 이미지 3', '#52c41a', '#95de64'), href: '' },
  ];

  // ── 공통: 빌더 상단 툴바(블록 추가 버튼) 재현 — 실제 화면과 동일하게 2그룹으로 ──
  const toolbar = (
    <div>
      <div style={{ marginTop: 4, marginBottom: 4, fontSize: 12, fontWeight: 600, color: '#555' }}>콘텐츠 블록 추가</div>
      <Space style={{ flexWrap: 'wrap' }}>
        <Button type="primary" ghost icon={<ShoppingCartOutlined />}>상품 추가</Button>
        <Button icon={<ClockCircleOutlined />}>타임세일 추가</Button>
        <Button icon={<PictureOutlined />}>이미지 슬라이드 추가</Button>
        <Button icon={<YoutubeOutlined />}>YouTube 추가</Button>
        <Button icon={<FontSizeOutlined />}>텍스트 추가</Button>
        <Button icon={<ExclamationCircleOutlined />}>이벤트 유의사항 추가</Button>
      </Space>
      <div style={{ marginTop: 12, marginBottom: 4, fontSize: 12, fontWeight: 600, color: '#555' }}>이미지 영역 기능 <span style={{ fontWeight: 'normal', color: '#999' }}>· 이미지 블록을 선택한 뒤 이미지 위에서 드래그</span></div>
      <Space style={{ flexWrap: 'wrap' }}>
        <Button icon={<LinkOutlined />}>URL 추가</Button>
        <Button icon={<TagOutlined />}>쿠폰 추가</Button>
        <Button icon={<SwapOutlined />}>탭 이동 추가</Button>
        <Button icon={<ExpandOutlined />}>팝업 영역 추가</Button>
      </Space>
    </div>
  );

  // ── 이미지 블록 + 클릭 영역(4종) 오버레이 데모 ──
  const imageRegionDemo = (
    <div className="preview-block-container selected" style={{ maxWidth: 460 }}>
      <div className="block-header">
        <div className="block-title"><PictureOutlined /><strong>이미지 블록</strong></div>
        <Button type="link" size="small" danger>삭제</Button>
      </div>
      <div className="block-content image-content" style={{ position: 'relative', cursor: 'crosshair' }}>
        <div style={{ width: '100%', aspectRatio: '4/3', background: 'linear-gradient(135deg,#fff0e6,#ffe7d1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e0a878', fontWeight: 600 }}>
          이벤트 배너 이미지 (예시)
        </div>
        {REGION_KINDS.map((r, i) => (
          <div key={r.kind} style={{ position: 'absolute', top: `${10 + i * 19}%`, left: `${6 + i * 17}%`, width: '26%', height: '15%', border: `2px dashed ${r.color}`, background: `${r.color}33`, display: 'flex', alignItems: 'flex-start' }}>
            <span style={{ background: r.color, color: '#fff', fontSize: 10, padding: '1px 4px', borderRadius: 2, fontWeight: 'bold', margin: 1 }}>{r.label}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // ── 상품 카드 디자인 6종 갤러리 ──
  const cardGallery = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
      {CARD_TEMPLATES.map((t) => (
        <div key={t.value} style={{ width: 190 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{t.label}</div>
          <div style={{ fontSize: 11, color: '#999', marginBottom: 6, minHeight: 32 }}>{t.desc}</div>
          <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 8 }}>
            {renderGrid(1, [GUIDE_PRODUCTS[0]], 50, t.value, { thumbRadius: 'rounded', iconPosition: 'top-left' })}
          </div>
        </div>
      ))}
    </div>
  );

  const tabs = [
    {
      key: 'overview',
      label: <Space size={4}><AppstoreOutlined />화면 구성</Space>,
      children: (
        <div>
          <Title level={5} style={{ marginTop: 0 }}>이벤트 페이지 제작 화면</Title>
          <Note>「이벤트」 &gt; 「이벤트 페이지 제작」 메뉴로 들어가면 좌우 2단 화면이 열립니다. 왼쪽에서 만들고, 오른쪽에서 실시간으로 확인합니다.</Note>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', margin: '12px 0' }}>
            <div style={{ flex: 1, minWidth: 230, border: '1px solid #f0f0f0', borderRadius: 8, padding: 16 }}>
              <Tag color="orange">왼쪽</Tag><Text strong> 편집 패널</Text>
              <p style={{ fontSize: 13, color: '#555', marginTop: 8, lineHeight: 1.8 }}>· 제목 · 이벤트 적용 쿠폰 · 페이지 최대 너비 설정<br />· 블록 추가 버튼(8종)과 이미지 드래그 업로드<br />· 추가된 블록 썸네일 목록 (드래그로 순서 변경)</p>
            </div>
            <div style={{ flex: 1, minWidth: 230, border: '1px solid #f0f0f0', borderRadius: 8, padding: 16, background: '#fafafa' }}>
              <Tag color="blue">오른쪽</Tag><Text strong> 미리보기</Text>
              <p style={{ fontSize: 13, color: '#555', marginTop: 8, lineHeight: 1.8 }}>· 실제 노출 모습을 실시간으로 표시<br />· 상단 <Button size="small" icon={<EyeOutlined />}>미리보기</Button> 로 편집/미리보기 모드 전환<br />· 탭·팝업 등 동작도 직접 눌러 확인</p>
            </div>
          </div>
          <SubTitle>제작 순서 한눈에 보기</SubTitle>
          <Steps responsive size="small" current={-1} items={[
            { title: '제목·쿠폰·너비' }, { title: '블록 추가' }, { title: '블록별 설정' }, { title: '미리보기·저장' },
          ]} />
          <Alert style={{ marginTop: 16 }} type="warning" showIcon message="반드시 앱(Cafe24 관리자)을 통해 접속하세요. Mall ID가 없으면 상품·쿠폰·카테고리를 불러올 수 없습니다." />
        </div>
      ),
    },
    {
      key: 'basic',
      label: <Space size={4}><ProfileOutlined />제목·쿠폰·너비</Space>,
      children: (
        <div>
          <Title level={5} style={{ marginTop: 0 }}>이벤트 기본 설정</Title>

          <SubTitle>제목</SubTitle>
          <Note>관리용 이벤트 이름입니다. 목록·통계에서 이 제목으로 구분됩니다.</Note>
          <Input placeholder="이벤트 제목을 입력하세요" defaultValue="여름맞이 시즌오프 EVENT" style={{ maxWidth: 420 }} />

          <SubTitle>💸 이벤트 적용 쿠폰</SubTitle>
          <Note>선택한 쿠폰이 적용된 가격(혜택가)으로 상품이 표시됩니다. 쿠폰이 적용되지 않는 상품은 정가로 표시됩니다.</Note>
          <Select mode="tags" style={{ width: '100%', maxWidth: 520 }} placeholder="쿠폰 선택, 또는 미오픈 쿠폰 번호 입력 후 Enter"
            defaultValue={['여름 시즌오프 50% 쿠폰', '신규회원 19% 쿠폰']}
            options={[{ value: '여름 시즌오프 50% 쿠폰' }, { value: '신규회원 19% 쿠폰' }, { value: '주말 한정 43% 쿠폰' }]} />
          <div style={{ marginTop: 10 }}>
            <Row left={<span style={{ color: '#d32f2f' }}>⚠ 필수</span>}>라이브 페이지에 쿠폰을 노출하려면 <b>반드시 이 목록에 추가</b>해야 합니다. 추가하지 않은 쿠폰은 위젯에 표시되지 않습니다.</Row>
            <Row left="자동 반영">쿠폰을 추가/삭제한 뒤 <b>저장만 하면</b> 라이브에 자동 반영됩니다. (HTML 재배포 불필요)</Row>
            <Row left="미오픈 쿠폰">아직 시작 전인 쿠폰은 목록에 없어도 <b>쿠폰 번호를 직접 입력 후 Enter</b>로 미리 추가할 수 있습니다.</Row>
          </div>

          <SubTitle>↔ 페이지 최대 너비</SubTitle>
          <Note>이벤트 페이지 전체(이미지·영상·유의사항·상품)의 웹 최대 너비입니다. 비워두면 기본 800px.</Note>
          <Space align="center" wrap>
            <InputNumber min={320} max={2400} step={20} placeholder="800" defaultValue={800} style={{ width: 140 }} addonAfter="px" />
            <Button type="primary">적용</Button>
            <Button size="small">기본(800)으로</Button>
            <span style={{ fontSize: 12, color: '#999' }}>현재 적용: 800px</span>
          </Space>
          <Note color="#aaa">값을 바꾼 뒤 <b>적용</b>을 누르면 미리보기에 반영됩니다. (라이브 반영은 최종 저장)</Note>
        </div>
      ),
    },
    {
      key: 'add',
      label: <Space size={4}><AppstoreOutlined />블록 추가·순서</Space>,
      children: (
        <div>
          <Title level={5} style={{ marginTop: 0 }}>콘텐츠 블록 쌓기</Title>
          <Note>이벤트 페이지는 여러 "블록"을 위에서 아래로 쌓아 만듭니다. 아래 버튼으로 블록을 추가하세요.</Note>
          {toolbar}

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 14 }}>
            <div style={{ flex: 1, minWidth: 260, border: '1px solid #f0f0f0', borderRadius: 8, padding: 14 }}>
              <Tag color="orange">콘텐츠 블록 추가</Tag>
              <p style={{ fontSize: 13, color: '#555', marginTop: 8, lineHeight: 1.8 }}>
                페이지에 새 <b>블록 자체</b>를 추가하는 버튼들입니다. 그중 <b>상품 추가</b>가 가장 중요해서 <b>맨 앞</b>에 있습니다. 그 옆으로 타임세일 · 이미지 슬라이드 · YouTube · 텍스트 · 이벤트 유의사항이 있습니다.<br />
                <Text type="secondary" style={{ fontSize: 12 }}>* 이미지 블록은 버튼이 아니라 아래 드래그 업로드로 추가합니다.</Text>
              </p>
            </div>
            <div style={{ flex: 1, minWidth: 260, border: '1px solid #f0f0f0', borderRadius: 8, padding: 14, background: '#fafafa' }}>
              <Tag color="blue">이미지 영역 기능</Tag>
              <p style={{ fontSize: 13, color: '#555', marginTop: 8, lineHeight: 1.8 }}>
                새 블록을 만드는 게 아니라, <b>이미 올린 이미지 블록 위에</b> 클릭 동작을 넣는 버튼들입니다. <b>URL · 쿠폰 · 탭 이동 · 팝업</b>이 있으며, <b>이미지 블록을 먼저 선택</b>한 뒤 이미지 위에서 드래그해야 동작합니다. (자세히는 "이미지 + 클릭영역" 탭)
              </p>
            </div>
          </div>

          <SubTitle>이미지 블록은 드래그 업로드</SubTitle>
          <Note>이미지 블록만 별도의 업로드 영역을 씁니다. 파일을 끌어다 놓거나 클릭해 올립니다.</Note>
          <Upload.Dragger disabled showUploadList={false}>
            <p className="ant-upload-drag-icon"><UploadOutlined /></p>
            <p className="ant-upload-text">이미지 블록을 추가하려면 파일을 드래그하거나 클릭하세요</p>
            <p style={{ fontSize: 12, color: '#aaa' }}>이미지는 10MB 이하 · 같은 이미지는 한 번만 업로드</p>
          </Upload.Dragger>

          <SubTitle>블록 종류와 예시 — 하나씩 살펴보기</SubTitle>
          <Note>버튼을 누르면 아래와 같은 블록이 추가됩니다. 각 블록의 모양과 설정 항목은 다음과 같습니다.</Note>

          <BlockExample
            icon={<PictureOutlined />}
            name="이미지 블록"
            preview={(
              <div style={{ position: 'relative' }}>
                <div style={{ width: '100%', aspectRatio: '4/3', background: 'linear-gradient(135deg,#fff0e6,#ffe7d1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e0a878', fontWeight: 600 }}>이벤트 배너 이미지</div>
                <div style={{ position: 'absolute', top: '20%', left: '12%', width: '30%', height: '20%', border: '2px dashed #ff6347', background: '#ff634733', display: 'flex', alignItems: 'flex-start' }}>
                  <span style={{ background: '#ff6347', color: '#fff', fontSize: 10, padding: '1px 4px', borderRadius: 2, fontWeight: 'bold', margin: 1 }}>쿠폰</span>
                </div>
              </div>
            )}
            points={[
              { t: '업로드', d: '이미지를 올리면 블록이 됩니다. (10MB 이하, 같은 이미지 중복 업로드 방지)' },
              { t: '클릭 영역', d: <>이미지 위에 <b>URL·쿠폰·탭·팝업</b> 영역을 드래그로 그려 클릭 동작을 넣습니다. (자세히는 "이미지+클릭영역" 탭)</> },
              { t: '활용 예', d: '메인 배너, 상세 설명 이미지, 쿠폰 받기 버튼 이미지 등.' },
            ]}
          />

          <BlockExample
            icon={<FontSizeOutlined />}
            name="텍스트 블록"
            preview={<div style={{ textAlign: 'center', fontSize: 22, fontWeight: 'bold', color: '#fe6326' }}>지금이 가장 쌉니다 · 최대 50% OFF</div>}
            points={[
              { t: '문구', d: '제목·안내 문구를 입력합니다. 엔터는 줄바꿈으로 표시됩니다.' },
              { t: '스타일', d: '정렬(왼쪽/가운데/오른쪽), 폰트 크기, 굵기, 색상, 위·아래 여백을 지정합니다.' },
              { t: '활용 예', d: '섹션 제목, 혜택 강조 문구, 짧은 안내 멘트.' },
            ]}
          />

          <BlockExample
            icon={<YoutubeOutlined />}
            name="영상 블록"
            preview={(
              <div style={{ width: '100%', aspectRatio: '16/9', background: '#1f1f1f', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', gap: 8 }}>
                <YoutubeOutlined style={{ fontSize: 34, color: '#ff4d4f' }} /><span style={{ fontSize: 13 }}>YouTube 영상</span>
              </div>
            )}
            points={[
              { t: '추가 방법', d: '유튜브 링크 또는 영상 ID를 붙여넣습니다. ([공유] > [동영상 URL 복사])' },
              { t: '비율', d: '기본 16:9. 세로 영상이면 9:16 등으로 조정합니다.' },
              { t: '자동재생', d: '켜면 음소거·반복이 자동 적용되어 배너 영상처럼 재생됩니다.' },
            ]}
          />

          <BlockExample
            icon={<ShoppingCartOutlined />}
            name="상품 블록"
            preview={renderGrid(2, GUIDE_PRODUCTS.slice(0, 2), 50, 'basic', { thumbRadius: 'rounded', iconPosition: 'top-left' })}
            points={[
              { t: '등록 방식', d: '상품을 직접 검색해 고르거나, 카테고리를 지정해 자동으로 불러옵니다.' },
              { t: '노출 방식', d: '단품(한 목록) 또는 탭(탭마다 다른 상품). 그리드는 2·3·4 중 선택.' },
              { t: '카드 디자인', d: '7종 템플릿 + 썸네일 모양·상품명·할인율·아이콘·요약설명. 가격은 쿠폰 혜택가로 자동 표시. (자세히는 "상품 블록" 탭)' },
              { t: '롤링·품절', d: <>그리드 대신 좌우로 넘기는 <b>슬라이드(롤링)</b>로 보여주거나, 특정 상품을 <b>품절(SOLD OUT)</b> 처리할 수 있습니다.</> },
            ]}
          />

          <BlockExample
            icon={<ClockCircleOutlined />}
            name="타임세일 블록"
            preview={(
              <div>
                <TimesaleBanner title="타임세일" endDate={dayjs().add(2, 'day').toISOString()} showCountdown bannerStyle="dark" />
                {renderGrid(2, GUIDE_PRODUCTS.slice(0, 2), 50, 'badge', { thumbRadius: 'rounded' })}
              </div>
            )}
            points={[
              { t: '카운트다운', d: '종료 시각까지 남은 시간을 실시간으로 보여주는 배너 + 할인 상품 목록.' },
              { t: '두 종류', d: '기간할인 / 쿠폰할인 중 선택. Cafe24에서 불러오거나 직접 입력할 수 있습니다.' },
              { t: '자세히', d: '아래 "타임세일" 탭에서 단계별로 설명합니다.' },
            ]}
          />

          <BlockExample
            icon={<PictureOutlined />}
            name="이미지 슬라이드 블록"
            preview={<ImageSlidePreview images={GUIDE_SLIDES} sw={{ perView: 1, peek: false, arrows: true, pagination: true, loop: true }} />}
            points={[
              { t: '여러 배너', d: '이미지 2장 이상을 좌우로 넘기는 슬라이드 배너로 보여줍니다.' },
              { t: '링크·순서', d: '각 이미지에 이동 링크를 넣고 ◀ ▶ 로 순서를 바꿀 수 있습니다.' },
              { t: '자세히', d: '아래 "이미지 슬라이드" 탭에서 옵션을 설명합니다.' },
            ]}
          />

          <BlockExample
            icon={<ExclamationCircleOutlined />}
            name="이벤트 유의사항 블록"
            preview={(
              <div>
                <div style={{ padding: '10px 14px', background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 6, fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span>이벤트 유의사항</span><span style={{ fontSize: 12 }}>▾</span></div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#666', lineHeight: 1.6 }}>· 본 이벤트는 조기 종료될 수 있습니다.<br />· 쿠폰은 1인 1회 다운로드 가능합니다.</div>
              </div>
            )}
            points={[
              { t: '토글 제목', d: '버튼에 표시할 제목을 정합니다. (예: 이벤트 유의사항)' },
              { t: '내용', d: '이미지·본문 텍스트 중 하나만 입력해도 됩니다. 본문은 배경색·글자색·폰트·줄간격·자간·패딩 조절 가능.' },
              { t: '동작', d: '라이브에서 버튼 클릭 시 본문이 슬라이드로 펼쳐집니다.' },
            ]}
          />

          <SubTitle>블록 썸네일 목록 (순서 드래그)</SubTitle>
          <Note>추가한 블록은 아래 목록에 쌓입니다. <b>썸네일을 좌우로 드래그</b>해 노출 순서를 바꾸고, 클릭해 선택합니다. 주황 테두리 = 현재 선택된 블록.</Note>
          <div className="thumb-list" style={{ minHeight: 90 }}>
            <div className="thumb-item image"><div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#ffd8a8,#fff)' }} /></div>
            <div className="thumb-item product_group active"><ShoppingCartOutlined /><span>상품 블록</span></div>
            <div className="thumb-item"><ClockCircleOutlined /><span>타임세일</span></div>
            <div className="thumb-item"><PictureOutlined /><span>이미지 슬라이드</span></div>
            <div className="thumb-item video"><YoutubeOutlined /><span>영상 블록</span></div>
            <div className="thumb-item text"><FontSizeOutlined /><span>텍스트 블록</span></div>
            <div className="thumb-item"><ExclamationCircleOutlined /><span>유의사항</span></div>
          </div>
        </div>
      ),
    },
    {
      key: 'image',
      label: <Space size={4}><PictureOutlined />이미지 + 클릭영역</Space>,
      children: (
        <div>
          <Title level={5} style={{ marginTop: 0 }}>이미지 블록 & 클릭 영역 (URL·쿠폰·탭·팝업)</Title>
          <Note>
            이미지 블록은 배너·상세 이미지를 올리는 블록입니다. 여기에 더해, 이미지의 특정 <b>부분</b>을 "클릭 영역"으로 지정하면
            고객이 그 부분을 눌렀을 때 동작(주소 이동 · 쿠폰 다운로드 · 탭 이동 · 팝업 열기)이 일어납니다.
            아래 순서대로 따라 하시면 됩니다.
          </Note>

          {/* A. 이미지 올리기 */}
          <SubTitle>STEP A. 이미지 올리기</SubTitle>
          <Note>아래 업로드 칸에 이미지 파일을 끌어다 놓거나, 칸을 클릭해 파일을 선택합니다. 올리면 이미지 블록이 하나 생깁니다.</Note>
          <Upload.Dragger disabled showUploadList={false} style={{ maxWidth: 460 }}>
            <p className="ant-upload-drag-icon"><UploadOutlined /></p>
            <p className="ant-upload-text">이미지 블록을 추가하려면 파일을 드래그하거나 클릭하세요</p>
            <p style={{ fontSize: 12, color: '#aaa' }}>이미지는 10MB 이하 · 같은 이미지는 한 번만 업로드</p>
          </Upload.Dragger>

          {/* B. 블록 선택 */}
          <SubTitle>STEP B. ⭐ 먼저 이미지 블록을 "선택"하세요 (가장 많이 실수하는 부분)</SubTitle>
          <Note>
            URL·쿠폰·탭·팝업 버튼은 <b>이미지 블록이 선택된 상태에서만</b> 동작합니다.
            아래처럼 <b style={{ color: '#fe6326' }}>주황색 테두리</b>가 생기면 선택된 것입니다. (썸네일을 한 번 클릭)
          </Note>
          <div className="thumb-list" style={{ minHeight: 90, justifyContent: 'flex-start' }}>
            <div className="thumb-item image active"><div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#ffd8a8,#fff)' }} /></div>
            <div className="thumb-item image" style={{ opacity: 0.6 }}><div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#d0d0d0,#fff)' }} /></div>
            <span style={{ alignSelf: 'center', fontSize: 12, color: '#888' }}>← 왼쪽은 선택됨(주황), 오른쪽은 선택 안 됨</span>
          </div>

          {/* C. 영역 그리기 5단계 */}
          <SubTitle>STEP C. 클릭 영역 그리는 법 (5단계)</SubTitle>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <Steps direction="vertical" size="small" current={-1} items={[
                { title: '① 이미지 블록 클릭(선택)', description: '주황 테두리가 생겼는지 확인합니다.' },
                { title: '② 상단 버튼 누르기', description: <>원하는 버튼(예: <Tag color="#ff6347">쿠폰 추가</Tag>)을 누릅니다. 파란 안내문이 뜨고, 마우스 모양이 +(십자)로 바뀝니다.</> },
                { title: '③ 이미지 위에서 드래그', description: '마우스 왼쪽 버튼을 누른 채 끌면 점선 사각형이 그려집니다. (너무 작으면 안 그려져요)' },
                { title: '④ 손을 떼면 설정 창이 뜸', description: '드래그를 끝내면 그 영역의 설정 창이 자동으로 열립니다.' },
                { title: '⑤ 내용 입력 후 [적용]', description: '주소·쿠폰 등을 입력하고 적용하면, 영역이 색깔 박스로 표시됩니다.' },
              ]} />
            </div>
            <div style={{ flex: 1, minWidth: 280 }}>
              {imageRegionDemo}
              <div style={{ textAlign: 'center', fontSize: 11, color: '#bbb', marginTop: 4 }}>↑ 색으로 구분된 클릭 영역 (URL·쿠폰·탭·팝업)</div>
            </div>
          </div>

          {/* D. 영역 종류 4가지 + 설정 창 */}
          <SubTitle>STEP D. 영역 종류 4가지 — 설정 창까지 보기</SubTitle>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px dashed #ececec' }}>
            <div>
              <div style={{ marginBottom: 8 }}><LinkOutlined style={{ color: '#fe6326' }} /> <Tag color="#fe6326">URL</Tag> <Text type="secondary" style={{ fontSize: 12 }}>버튼: URL 추가</Text></div>
              <ModalMock title="URL 영역 설정">
                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>URL</div>
                <Input placeholder="https://example.com" defaultValue="https://myshop.com/event/summer" />
              </ModalMock>
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <Row left="언제 쓰나">클릭 시 다른 페이지(상품 상세, 기획전, 외부 링크 등)로 보내고 싶을 때.</Row>
              <Row left="입력">이동할 주소 하나를 입력합니다.</Row>
              <Row left="팁">https:// 를 안 붙여도 자동으로 붙습니다.</Row>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px dashed #ececec' }}>
            <div>
              <div style={{ marginBottom: 8 }}><TagOutlined style={{ color: '#ff6347' }} /> <Tag color="#ff6347">쿠폰</Tag> <Text type="secondary" style={{ fontSize: 12 }}>버튼: 쿠폰 추가</Text></div>
              <ModalMock title="쿠폰 영역 설정">
                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>쿠폰 선택 혹은 번호 입력</div>
                <Select mode="tags" style={{ width: '100%' }} defaultValue={['여름 시즌오프 50% 쿠폰']} options={[{ value: '여름 시즌오프 50% 쿠폰' }, { value: '신규회원 19% 쿠폰' }]} />
              </ModalMock>
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <Row left="언제 쓰나">"쿠폰 받기" 버튼처럼, 클릭하면 쿠폰이 다운로드되게 할 때.</Row>
              <Row left="입력">쿠폰을 고르거나, 여러 개를 선택할 수 있습니다.</Row>
              <Row left={<span style={{ color: '#d32f2f' }}>⚠ 주의</span>}>상단 <b>"이벤트 적용 쿠폰"</b> 목록에도 그 쿠폰이 있어야 라이브에 보입니다. 미오픈 쿠폰은 번호 입력 후 Enter.</Row>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start', padding: '12px 0', borderBottom: '1px dashed #ececec' }}>
            <div>
              <div style={{ marginBottom: 8 }}><SwapOutlined style={{ color: '#722ed1' }} /> <Tag color="#722ed1">탭 이동</Tag> <Text type="secondary" style={{ fontSize: 12 }}>버튼: 탭 이동 추가</Text></div>
              <ModalMock title="탭 이동 영역 설정">
                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>이동할 탭</div>
                <Select style={{ width: '100%' }} defaultValue="상품 블록 1 → 탭2 (하의)" options={[{ value: '상품 블록 1 → 탭1 (상의)' }, { value: '상품 블록 1 → 탭2 (하의)' }]} />
              </ModalMock>
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              <Row left="언제 쓰나">"하의 보러가기" 버튼처럼, 같은 페이지의 특정 상품 탭으로 보내고 싶을 때.</Row>
              <Row left="동작">클릭하면 그 상품 블록의 해당 탭으로 바뀌고 그 위치까지 스크롤됩니다.</Row>
              <Row left={<span style={{ color: '#d32f2f' }}>⚠ 먼저</span>}><b>"탭" 방식 상품 블록</b>을 먼저 만들어야 선택지가 생깁니다. 없으면 버튼을 눌러도 안내만 뜹니다.</Row>
            </div>
          </div>

          {/* E. 팝업 자세히 */}
          <SubTitle><ExpandOutlined style={{ color: '#13c2c2' }} /> STEP E. 팝업 영역 (가장 기능이 많아요)</SubTitle>
          <Note>팝업은 클릭하면 화면 위에 뜨는 이미지 창입니다. 쿠폰 안내, 이벤트 공지 등에 씁니다. 설정 창은 아래와 같습니다.</Note>
          <ModalMock title="팝업 영역 설정" okText="적용">
            <Space style={{ marginBottom: 10 }} wrap>
              <Button size="small" icon={<UploadOutlined />}>팝업 이미지 추가 (2/10)</Button>
              <Checkbox checked>우상단 X 닫기 버튼 표시</Checkbox>
            </Space>
            <div style={{ border: '1px solid #f0f0f0', borderRadius: 6, padding: 10 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>팝업 이미지 1</span>
                <span style={{ flex: 1 }} />
                <Button size="small">↑</Button><Button size="small">↓</Button><Button size="small" danger>이미지 삭제</Button>
              </div>
              {/* 팝업 이미지 위 영역 편집 미니 데모 */}
              <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
                <div style={{ width: 260, maxWidth: '100%', aspectRatio: '3/4', background: 'linear-gradient(135deg,#e6fffb,#d0f0ec)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5bbab0', fontSize: 12 }}>팝업 이미지</div>
                <div style={{ position: 'absolute', top: 6, right: 6, width: 44, height: 26, border: '2px solid #ef4444', background: 'rgba(239,68,68,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#b91c1c' }}>닫기</div>
                <div style={{ position: 'absolute', bottom: '18%', left: '15%', width: '55%', height: '20%', border: '2px solid #2563eb', background: 'rgba(37,99,235,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#1d4ed8' }}>링크</div>
              </div>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Space size="small" wrap><span style={{ fontSize: 12, color: '#888' }}>#1</span><Segmented size="small" value="close" options={[{ label: '닫기', value: 'close' }, { label: '링크', value: 'link' }]} /></Space>
                <Space size="small" wrap><span style={{ fontSize: 12, color: '#888' }}>#2</span><Segmented size="small" value="link" options={[{ label: '닫기', value: 'close' }, { label: '링크', value: 'link' }]} /><Input size="small" placeholder="이동할 URL" defaultValue="https://myshop.com/coupon" style={{ width: 200 }} /></Space>
              </div>
            </div>
          </ModalMock>
          <div style={{ marginTop: 12 }}>
            <Row left="① 이미지 추가">[팝업 이미지 추가]로 1~10장 올립니다. <b>2장 이상이면 자동으로 슬라이드</b>(넘어감)됩니다.</Row>
            <Row left="② 닫기 버튼">[우상단 X 닫기 버튼 표시]를 켜면 X 버튼이 생깁니다. 끄면 아래 "닫기 영역"으로만 닫힙니다.</Row>
            <Row left="③ 순서/삭제">각 이미지의 ↑ ↓ 로 순서를 바꾸고, [이미지 삭제]로 뺍니다.</Row>
            <Row left="④ 이미지 안 영역">팝업 이미지 위에서도 드래그로 영역을 그릴 수 있습니다. 영역마다 <b style={{ color: '#b91c1c' }}>닫기</b>(누르면 팝업이 닫힘) 또는 <b style={{ color: '#1d4ed8' }}>링크</b>(URL 이동) 를 고릅니다. 링크면 주소를 입력합니다.</Row>
          </div>

          {/* F. 수정/삭제 */}
          <SubTitle>STEP F. 만든 영역 수정·삭제</SubTitle>
          <Note>이미 그린 색깔 영역을 <b>클릭</b>하면 "영역 편집" 창이 뜹니다. 내용을 바꾼 뒤 [적용], 빼려면 [삭제]를 누릅니다.</Note>
          <div style={{ width: 360, maxWidth: '100%', border: '1px solid #e8e8e8', borderRadius: 10, boxShadow: '0 6px 20px rgba(0,0,0,0.10)', overflow: 'hidden', background: '#fff' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}><span>영역 편집</span><span style={{ color: '#bbb' }}>✕</span></div>
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>URL</div>
              <Input defaultValue="https://myshop.com/event/summer" />
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
              <Button size="small" danger>삭제</Button>
              <Space><Button size="small">취소</Button><Button size="small" type="primary">적용</Button></Space>
            </div>
          </div>

          {/* G. 초보자 실수 모음 */}
          <SubTitle>자주 하는 실수 (체크리스트)</SubTitle>
          <Alert type="warning" showIcon style={{ marginBottom: 8 }}
            message="버튼을 눌렀는데 이미지에 안 그려져요"
            description="이미지 블록을 먼저 선택(주황 테두리)했는지 확인하세요. 선택 없이 버튼만 누르면 안내만 뜹니다." />
          <Alert type="warning" showIcon style={{ marginBottom: 8 }}
            message="탭 이동 버튼이 안 돼요"
            description={'"탭" 방식 상품 블록을 먼저 추가해야 이동할 탭 선택지가 생깁니다.'} />
          <Alert type="warning" showIcon style={{ marginBottom: 8 }}
            message="쿠폰을 넣었는데 라이브에 안 보여요"
            description={'상단 "이벤트 적용 쿠폰" 목록에도 그 쿠폰을 추가해야 합니다.'} />
          <Alert type="info" showIcon
            message="마지막엔 꼭 저장!"
            description="모든 작업은 [이벤트 등록](저장)을 해야 실제 페이지에 반영됩니다." />
        </div>
      ),
    },
    {
      key: 'product',
      label: <Space size={4}><ShoppingCartOutlined />상품 블록</Space>,
      children: (
        <div>
          <Title level={5} style={{ marginTop: 0 }}>상품 블록 (핵심 기능)</Title>
          <Note><Tag>상품 추가</Tag> 버튼을 누르면 설정 창이 열립니다. 순서대로 설정하세요. 아래는 직접 눌러볼 수 있는 데모입니다.</Note>

          <SubTitle>1. 상품 등록 방식</SubTitle>
          <Segmented block value={registerMode} onChange={setRegisterMode}
            options={[{ label: '상품 검색하여 추가', value: 'direct' }, { label: '카테고리 지정하여 불러오기', value: 'category' }]} style={{ maxWidth: 520 }} />
          <Alert style={{ marginTop: 8, maxWidth: 520 }} type="info"
            message={registerMode === 'direct' ? '원하는 상품을 직접 검색해 개별적으로 골라 노출합니다.' : '대분류·소분류를 선택하거나 카테고리 번호를 직접 입력하면, 해당 카테고리 상품이 자동으로 채워집니다.'} />

          <SubTitle>2. 노출 방식</SubTitle>
          <Segmented block value={layoutType} onChange={setLayoutType}
            options={[{ label: '단품', value: 'single' }, { label: '탭', value: 'tabs' }]} style={{ maxWidth: 320 }} />
          <Note style={{ marginTop: 8 }}>
            {layoutType === 'single' ? '선택한 상품들을 하나의 목록으로 쭉 나열합니다.' : '여러 탭을 만들어 탭마다 다른 상품 목록을 보여줍니다. 탭별 그리드·줄당 개수·활성 탭 색을 지정할 수 있고, 최대 11개까지 가능합니다.'}
          </Note>
          {layoutType === 'tabs' && (
            <>
              <Space wrap>
                <span style={{ fontSize: 13, color: '#555' }}>활성 탭 색:</span>
                <ColorPicker defaultValue="#fe6326" />
                <span style={{ fontSize: 13, color: '#555', marginLeft: 8 }}>탭 줄당 개수:</span>
                <Segmented size="small" defaultValue={0} options={[{ label: '자동(1줄)', value: 0 }, { label: '2개씩', value: 2 }, { label: '3개씩', value: 3 }, { label: '4개씩', value: 4 }]} />
              </Space>
              <div style={{ marginTop: 10 }}>
                <Space wrap align="center">
                  <span style={{ fontSize: 13, color: '#555', display: 'inline-flex', alignItems: 'center', gap: 6 }}><ColumnWidthOutlined />탭 영역 너비:</span>
                  <Segmented value={tabWidth} onChange={setTabWidth} options={[{ label: '기본(98%)', value: 'default' }, { label: '꽉 채움(100%)', value: 'full' }]} />
                  <span style={{ fontSize: 12, color: '#999' }}>현재: {tabWidth === 'full' ? '100% (꽉 채움)' : '98% (기본)'}</span>
                </Space>
                <Note color="#aaa" style={{ marginTop: 6 }}>탭 상품 블록 <b>전체 영역의 가로 너비</b>입니다. 기본은 양옆에 살짝 여백을 둔 98%, 꽉 채움은 화면 폭에 딱 맞는 100%입니다. (아래 미리보기에서 좌우 여백 차이를 확인하세요)</Note>
              </div>
            </>
          )}

          <SubTitle>3. 그리드 사이즈 {layoutType === 'tabs' && <span style={{ fontWeight: 'normal', fontSize: 12, color: '#888' }}>(기본값 · 탭별 별도 지정 가능)</span>}</SubTitle>
          <Note>한 줄에 상품을 몇 개씩 배치할지 정합니다.</Note>
          <Space>{[2, 3, 4].map((n) => <GridPreview key={n} size={n} active={gridSize === n} onClick={() => setGridSize(n)} />)}</Space>

          <SubTitle>4. 상품 카드 디자인 <span style={{ fontWeight: 'normal', fontSize: 12, color: '#888' }}>(설정 창의 ② 디자인 탭)</span></SubTitle>
          <Note>상품명·요약설명·가격은 <b>Cafe24 상품 정보에 자동으로 매핑</b>됩니다. 먼저 카드 템플릿(틀)을 고르고, 아래 항목으로 세부 모양을 다듬으세요.</Note>
          <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>카드 템플릿</div>
          <Select style={{ width: '100%', maxWidth: 420 }} value={cardTemplate} onChange={setCardTemplate}
            options={CARD_TEMPLATES.map((t) => ({ value: t.value, label: t.label }))} />
          <div style={{ marginTop: 6, fontSize: 12, color: '#888' }}>{CARD_TEMPLATES.find((t) => t.value === cardTemplate)?.desc}</div>

          <div style={{ marginTop: 10, maxWidth: 520 }}>
            <OptRow visual={CARD_ICON.thumb} title="썸네일 모양" desc="상품 이미지 모서리 — 사각형 / 둥근">
              <Segmented size="small" value={thumbRadius} onChange={setThumbRadius} options={[{ label: '사각형', value: 'square' }, { label: '둥근', value: 'rounded' }]} />
            </OptRow>
            <OptRow visual={CARD_ICON.name} title="상품명 굵기" desc="상품명 글자 굵기 (크기도 작게/보통/크게 선택 가능)">
              <Segmented size="small" value={nameWeight} onChange={setNameWeight} options={[{ label: '보통', value: 500 }, { label: '굵게', value: 700 }]} />
            </OptRow>
            <OptRow visual={CARD_ICON.color} title="할인율 % 색상" desc="할인율 숫자(예: 50%) 색상">
              <ColorPicker value={percentColor} onChangeComplete={(c) => setPercentColor(c.toHexString())} />
            </OptRow>
            <OptRow visual={CARD_ICON.icon} title="아이콘 위치" desc="기본 '안 함' — 고르면 그 위치에 표시">
              <Segmented size="small" value={iconPosition} onChange={setIconPosition}
                options={[{ label: '안 함', value: 'off' }, { label: '좌상', value: 'top-left' }, { label: '우상', value: 'top-right' }, { label: '좌하', value: 'bottom-left' }, { label: '우하', value: 'bottom-right' }]} />
            </OptRow>
            <OptRow visual={CARD_ICON.desc} title="요약설명" desc="기본 '숨김' — 표시하면 크기·굵기도 조절">
              <Segmented size="small" value={!!descHide} onChange={setDescHide} options={[{ label: '표시', value: false }, { label: '숨김', value: true }]} />
            </OptRow>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: '#888', lineHeight: 1.7, background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 8, padding: '8px 10px' }}>
            ※ <b>아이콘 위치</b>는 기본이 <b>'안 함'</b>입니다. Cafe24 어드민에서 <b>'아이콘 꾸미기'</b>를 등록한 상품만, 위치를 고르면 그 자리에 표시됩니다. (미설정 상품은 아이콘 없이 표시)<br />
            ※ <b>요약설명</b>은 기본이 <b>'숨김'</b>입니다. 표시로 바꾸면 Cafe24 어드민의 <b>요약설명 텍스트</b>가 그대로 노출됩니다. (미입력 상품은 자동 생략)
          </div>

          <SubTitle>↓ 선택한 설정 그대로 본 미리보기 <span style={{ fontWeight: 'normal', fontSize: 12, color: '#888' }}>(상품명·가격은 예시)</span></SubTitle>
          <div style={{ border: '1px dashed #d9d9d9', borderRadius: 8, padding: '4px 12px 12px', background: '#fff' }}>
            {layoutType === 'tabs' && (
              <div style={{ width: tabWidth === 'full' ? '100%' : '98%', margin: '0 auto', outline: tabWidth === 'full' ? 'none' : '1px dashed #d0d0d0', outlineOffset: 3, marginTop: 12, marginBottom: 12 }}>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${demoTabs.length}, 1fr)`, gap: 8 }}>
                  {demoTabs.map((t, i) => (
                    <Button key={i} onClick={() => setActiveTab(i)}
                      style={{ borderColor: i === activeTab ? '#fe6326' : undefined, backgroundColor: i === activeTab ? '#fe6326' : '#fff', color: i === activeTab ? '#fff' : 'inherit' }}>{t}</Button>
                  ))}
                </div>
              </div>
            )}
            {renderGrid(gridSize, GUIDE_PRODUCTS, 50, cardTemplate, { thumbRadius, iconPosition, cardStyle: cardStyleDemo })}
          </div>

          <SubTitle>카드 디자인 7종 비교</SubTitle>
          {cardGallery}
          <Alert style={{ marginTop: 12 }} type="warning" showIcon
            message="BEST·NEW 등 아이콘은 Cafe24 어드민에서 '아이콘 꾸미기'를 등록한 상품에만 실제 노출됩니다. (아이콘 위치를 '안 함'으로 두면 표시되지 않습니다)" />

          {/* 5. 상품 롤링 / 스와이퍼 */}
          <SubTitle>5. 상품 롤링 / 스와이퍼 <span style={{ fontWeight: 'normal', fontSize: 12, color: '#888' }}>(설정 창의 ③ 기능 추가 탭 · 선택)</span></SubTitle>
          <Note>그리드처럼 쌓지 않고 <b>좌우로 넘기는 슬라이드</b>로 보여주는 기능입니다. 모바일은 손가락 스와이프, PC는 마우스로 끌어서 넘깁니다. <b>상품 3개 이상</b>부터 사용할 수 있습니다.</Note>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 520, marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}><RetweetOutlined />슬라이드 사용</span>
            <Segmented value={rolling.enabled} onChange={(v) => setR({ enabled: v })} options={[{ label: '사용 안 함', value: false }, { label: '사용', value: true }]} />
          </div>
          {rolling.enabled && (
            <div style={{ maxWidth: 520 }}>
              <OptRow visual={SLIDE_ICON.perView} title="한 화면 개수" desc="한 번에 보일 상품 수 · 2.3 같은 소수도 가능">
                <Space size={6} wrap>
                  <Segmented size="small" value={[0, 1, 2, 3, 4].includes(rolling.perView) ? rolling.perView : ''} onChange={(v) => setR({ perView: v })}
                    options={[{ label: '그리드와 동일', value: 0 }, { label: '1', value: 1 }, { label: '2', value: 2 }, { label: '3', value: 3 }, { label: '4', value: 4 }]} />
                  <InputNumber size="small" min={1} max={6} step={0.1} value={[0, 1, 2, 3, 4].includes(rolling.perView) ? null : rolling.perView} onChange={(v) => setR({ perView: v || 0 })} placeholder="예: 2.3" style={{ width: 88 }} />
                </Space>
              </OptRow>
              <OptRow visual={SLIDE_ICON.peek} title="다음 상품 살짝 보이기" desc="옆 상품 끝을 살짝 노출(peek)">
                <Segmented size="small" value={rolling.peek} onChange={(v) => setR({ peek: v })} options={[{ label: '끔', value: false }, { label: '켬', value: true }]} />
              </OptRow>
              <OptRow visual={SLIDE_ICON.loop} title="무한 반복" desc="끝에서 처음으로 이어짐">
                <Segmented size="small" value={rolling.loop} onChange={(v) => setR({ loop: v })} options={[{ label: '끔', value: false }, { label: '켬', value: true }]} />
              </OptRow>
              <OptRow visual={SLIDE_ICON.autoplay} title="자동 넘김" desc="가만히 둬도 자동으로 (간격 초)">
                <Space size={6}>
                  <Segmented size="small" value={rolling.autoplay} onChange={(v) => setR({ autoplay: v })} options={[{ label: '끔', value: false }, { label: '켬', value: true }]} />
                  <InputNumber size="small" min={1} max={15} value={rolling.interval} onChange={(v) => setR({ interval: v || 3 })} disabled={!rolling.autoplay} style={{ width: 70 }} addonAfter="초" />
                </Space>
              </OptRow>
              <OptRow visual={SLIDE_ICON.arrows} title="좌우 화살표" desc="‹ › 버튼 표시">
                <Segmented size="small" value={rolling.arrows} onChange={(v) => setR({ arrows: v })} options={[{ label: '끔', value: false }, { label: '켬', value: true }]} />
              </OptRow>
              <OptRow visual={SLIDE_ICON.dots} title="점(인디케이터)" desc="● ○ ○ 위치 표시">
                <Segmented size="small" value={rolling.pagination} onChange={(v) => setR({ pagination: v })} options={[{ label: '끔', value: false }, { label: '켬', value: true }]} />
              </OptRow>
            </div>
          )}
          <div style={{ fontSize: 12, color: '#aaa', textAlign: 'center', margin: '12px 0 6px' }}>↓ {rolling.enabled ? '롤링(슬라이드) 미리보기 — 좌우로 끌어보세요' : '그리드 미리보기 (슬라이드 끔)'}</div>
          <div style={{ border: '1px dashed #d9d9d9', borderRadius: 8, padding: '8px 12px 12px', background: '#fff' }}>
            {renderGrid(gridSize, [...GUIDE_PRODUCTS, ...GUIDE_PRODUCTS], 50, cardTemplate, { thumbRadius, iconPosition, cardStyle: cardStyleDemo, rolling })}
          </div>

          {/* 6. 품절(SOLD OUT) */}
          <SubTitle>6. 품절(SOLD OUT) 표시 <span style={{ fontWeight: 'normal', fontSize: 12, color: '#888' }}>(직접 등록한 상품)</span></SubTitle>
          <Note><b>상품 검색하여 추가</b>로 직접 등록한 상품은 상품마다 <b>품절 토글</b>을 켤 수 있습니다. 켜면 카드 전체에 <b>어두운 딤(흐림) + SOLD OUT</b> 글자가 덮이고, <b>클릭(상품 페이지 이동)도 막힙니다</b>.</Note>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, overflow: 'hidden', maxWidth: 320 }}>
                {GUIDE_PRODUCTS.slice(0, 2).map((p, i) => {
                  const on = i === 1 ? soldOutOn : false;
                  return (
                    <div key={p.product_no} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderBottom: '1px solid #f7f7f7' }}>
                      <div style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 4, overflow: 'hidden', background: '#f5f5f5', filter: on ? 'grayscale(1)' : 'none' }}>
                        <img src={p.image_medium} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: on ? '#aaa' : '#333', textDecoration: on ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.product_name}</span>
                      <Checkbox checked={i === 1 ? soldOutOn : false} disabled={i === 0} onChange={(e) => i === 1 && setSoldOutOn(e.target.checked)} />
                      <span style={{ fontSize: 11, color: on ? '#ff4d4f' : '#bbb', width: 56, textAlign: 'right' }}>{on ? 'SOLD OUT' : '판매중'}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>↑ 상품별 품절 토글 (두 번째 상품을 켜고 꺼보세요)</div>
            </div>
            <div style={{ flex: 1, minWidth: 240 }}>
              {renderGrid(2, GUIDE_PRODUCTS.slice(0, 2), 50, cardTemplate, { thumbRadius, iconPosition, cardStyle: cardStyleDemo, soldOutNos: soldOutOn ? [GUIDE_PRODUCTS[1].product_no] : [] })}
              <div style={{ fontSize: 11, color: '#bbb', textAlign: 'center', marginTop: 4 }}>↑ 실제 노출 모습 (품절 상품은 딤 + SOLD OUT)</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'image_slide',
      label: <Space size={4}><PictureOutlined />이미지 슬라이드</Space>,
      children: (
        <div>
          <Title level={5} style={{ marginTop: 0 }}>이미지 슬라이드 블록</Title>
          <Note><Tag>이미지 슬라이드 추가</Tag> 버튼을 누르면 설정 창이 열립니다. <b>여러 장의 이미지(배너)를 좌우로 넘기는 슬라이드</b>로 보여주는 블록입니다. (이미지 1장만 필요하면 일반 "이미지 블록"을 쓰세요)</Note>

          <SubTitle>1. 이미지 추가 <span style={{ fontWeight: 'normal', fontSize: 12, color: '#888' }}>(2장 이상)</span></SubTitle>
          <Note><b>이미지는 2장 이상</b>부터 슬라이드가 됩니다. 각 이미지에 <b>클릭 시 이동 링크</b>를 넣을 수 있고, <b>◀ ▶</b> 로 순서를 바꿉니다.</Note>
          <ModalMock title="이미지 슬라이드 추가" okText="추가">
            <Button size="small" icon={<UploadOutlined />}>이미지 추가 (3장)</Button>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8, marginTop: 10 }}>
              {GUIDE_SLIDES.map((s, i) => (
                <div key={i} style={{ border: '1px solid #eee', borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
                  <div style={{ position: 'relative', aspectRatio: '16/9' }}>
                    <img src={s.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span style={{ position: 'absolute', top: 3, left: 3, background: 'rgba(0,0,0,.55)', color: '#fff', borderRadius: 4, fontSize: 10, padding: '0 5px' }}>{i + 1}</span>
                  </div>
                  <div style={{ padding: 5 }}>
                    <Input size="small" placeholder="클릭 시 이동 링크(선택)" />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      <Space size={2}><Button size="small" type="text">◀</Button><Button size="small" type="text">▶</Button></Space>
                      <Button size="small" type="text" danger>삭제</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ModalMock>

          <SubTitle>2. 슬라이드 옵션 <span style={{ fontWeight: 'normal', fontSize: 12, color: '#888' }}>(상품 롤링과 같은 옵션)</span></SubTitle>
          <Note>상품 롤링과 동일한 방식으로 동작 옵션을 고릅니다. 배너 용도라면 <b>한 화면 개수 1</b>을 권장합니다.</Note>
          <div style={{ maxWidth: 520 }}>
            <OptRow visual={SLIDE_ICON.perView} title="한 화면 개수" desc="한 번에 보일 이미지 수 · 2.3 같은 소수도 가능 (배너는 1 권장)">
              <Space size={6} wrap>
                <Segmented size="small" value={[1, 2, 3].includes(slideSw.perView) ? slideSw.perView : ''} onChange={(v) => setSlideOpt({ perView: v })} options={[{ label: '1', value: 1 }, { label: '2', value: 2 }, { label: '3', value: 3 }]} />
                <InputNumber size="small" min={1} max={6} step={0.1} value={[1, 2, 3].includes(slideSw.perView) ? null : slideSw.perView} onChange={(v) => setSlideOpt({ perView: v || 1 })} placeholder="예: 2.3" style={{ width: 88 }} />
              </Space>
            </OptRow>
            <OptRow visual={SLIDE_ICON.peek} title="다음 이미지 살짝 보이기" desc="옆 이미지 끝을 살짝 노출(peek)">
              <Segmented size="small" value={slideSw.peek} onChange={(v) => setSlideOpt({ peek: v })} options={[{ label: '끔', value: false }, { label: '켬', value: true }]} />
            </OptRow>
            <OptRow visual={SLIDE_ICON.loop} title="무한 반복" desc="끝에서 처음으로 이어짐">
              <Segmented size="small" value={slideSw.loop} onChange={(v) => setSlideOpt({ loop: v })} options={[{ label: '끔', value: false }, { label: '켬', value: true }]} />
            </OptRow>
            <OptRow visual={SLIDE_ICON.autoplay} title="자동 넘김" desc="가만히 둬도 자동으로 (간격 초)">
              <Space size={6}>
                <Segmented size="small" value={slideSw.autoplay} onChange={(v) => setSlideOpt({ autoplay: v })} options={[{ label: '끔', value: false }, { label: '켬', value: true }]} />
                <InputNumber size="small" min={1} max={15} value={slideSw.interval} onChange={(v) => setSlideOpt({ interval: v || 3 })} disabled={!slideSw.autoplay} style={{ width: 70 }} addonAfter="초" />
              </Space>
            </OptRow>
            <OptRow visual={SLIDE_ICON.arrows} title="좌우 화살표" desc="‹ › 버튼 표시">
              <Segmented size="small" value={slideSw.arrows} onChange={(v) => setSlideOpt({ arrows: v })} options={[{ label: '끔', value: false }, { label: '켬', value: true }]} />
            </OptRow>
            <OptRow visual={SLIDE_ICON.dots} title="점(인디케이터)" desc="● ○ ○ 위치 표시">
              <Segmented size="small" value={slideSw.pagination} onChange={(v) => setSlideOpt({ pagination: v })} options={[{ label: '끔', value: false }, { label: '켬', value: true }]} />
            </OptRow>
          </div>

          <SubTitle>↓ 선택한 옵션 그대로 본 미리보기</SubTitle>
          <ImageSlidePreview images={GUIDE_SLIDES} sw={slideSw} />
          <Alert style={{ marginTop: 12 }} type="info" showIcon
            message="이미지는 10MB 이하 · 같은 이미지는 한 번만 업로드됩니다. 라이브에서는 무료 슬라이더로 부드럽게 넘어갑니다." />
        </div>
      ),
    },
    {
      key: 'timesale',
      label: <Space size={4}><ClockCircleOutlined />타임세일</Space>,
      children: (
        <div>
          <Title level={5} style={{ marginTop: 0 }}>타임세일 블록</Title>
          <Note><Tag>타임세일 추가</Tag> 버튼을 누르면 설정 창이 열립니다. <b>종료까지 남은 시간을 보여주는 카운트다운 배너</b>와 <b>할인 상품 목록</b>을 함께 보여줍니다.</Note>
          <Alert style={{ marginBottom: 12 }} type="warning" showIcon
            message="할인 자체는 Cafe24 어드민에서 만듭니다"
            description="이 블록은 이미 만들어 둔 '기간 할인' 또는 '쿠폰'을 골라 예쁘게 보여주는 역할입니다. 할인가는 라이브에서 자동으로 계산되어 표시됩니다." />

          <SubTitle>1. 할인 종류 — 탭 2개</SubTitle>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 230, border: '1px solid #f0f0f0', borderRadius: 8, padding: 14 }}>
              <Tag color="volcano">① 기간할인</Tag>
              <p style={{ fontSize: 13, color: '#555', marginTop: 8, lineHeight: 1.7 }}>Cafe24의 <b>기간 할인(혜택)</b>으로 가격이 내려간 상품에 사용합니다.</p>
            </div>
            <div style={{ flex: 1, minWidth: 230, border: '1px solid #f0f0f0', borderRadius: 8, padding: 14 }}>
              <Tag color="geekblue">② 쿠폰할인</Tag>
              <p style={{ fontSize: 13, color: '#555', marginTop: 8, lineHeight: 1.7 }}><b>쿠폰</b>으로 할인되는 상품에 사용합니다. 쿠폰의 종료일을 카운트다운으로 보여줄 수 있습니다.</p>
            </div>
          </div>

          <SubTitle>2. 대상 지정 방법 — 2가지</SubTitle>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <Steps direction="vertical" size="small" current={-1} items={[
                { title: 'Cafe24에서 불러오기', description: '만들어 둔 기간할인(혜택)이나 쿠폰을 목록에서 고르면, 대상 상품·기간이 자동으로 채워집니다.' },
                { title: '직접 입력', description: <>노출할 <b>상품을 직접 등록</b>하고, <b>시작·종료일</b>을 달력에서 직접 지정합니다. (특정 상품만 골라 보여주고 싶을 때)</> },
              ]} />
            </div>
            <div style={{ flex: 1, minWidth: 280 }}>
              <ModalMock title="타임세일 추가" okText="적용">
                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>할인 종류</div>
                <Segmented size="small" block defaultValue="benefit" options={[{ label: '기간할인', value: 'benefit' }, { label: '쿠폰할인', value: 'coupon' }]} style={{ marginBottom: 10 }} />
                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>대상 지정</div>
                <Segmented size="small" block defaultValue="manual" options={[{ label: 'Cafe24에서 불러오기', value: 'select' }, { label: '직접 입력', value: 'manual' }]} style={{ marginBottom: 10 }} />
                <Space style={{ marginBottom: 10 }} wrap>
                  <Button size="small">상품 직접 등록 (2개)</Button>
                </Space>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>시작 · 종료일</div>
                <Input size="small" readOnly value="2026-06-01 ~ 2026-06-07" style={{ marginBottom: 4 }} />
              </ModalMock>
            </div>
          </div>

          <Note><b>Cafe24에서 불러오기</b>로 기간할인(혜택)이나 쿠폰을 고르면, 설정 창 아래 미리보기에 <b>그 혜택에 실제로 포함된 상품 몇 개</b>를 자동으로 불러와 보여줍니다 — 추가하기 전에 실제 상품으로 확인할 수 있어요. (상품을 못 가져오면 예시 상품으로 표시되고, 라이브 페이지에는 대상 상품 전체가 할인가로 노출됩니다.) <b>직접 입력</b>일 때는 등록한 상품이 그대로 미리보기에 나옵니다.</Note>

          <SubTitle>3. 배너 디자인 & 미리보기</SubTitle>
          <Note>배너 색상(디자인)과 카운트다운 표시 여부를 고릅니다. 아래에서 디자인을 바꿔보세요.</Note>
          <Space wrap style={{ marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: '#555' }}>배너 디자인:</span>
            <Segmented value={tsBanner} onChange={setTsBanner}
              options={Object.keys(TIMESALE_BANNERS).map((k) => ({ value: k, label: TIMESALE_BANNERS[k].label }))} />
          </Space>
          <div style={{ border: '1px dashed #d9d9d9', borderRadius: 8, padding: '12px', background: '#fff' }}>
            <TimesaleBanner title="여름 타임세일" endDate={dayjs().add(2, 'day').add(5, 'hour').toISOString()} showCountdown bannerStyle={tsBanner} />
            {renderGrid(2, GUIDE_PRODUCTS.slice(0, 2), 50, 'badge', { thumbRadius: 'rounded' })}
          </div>
          <Note color="#aaa" style={{ marginTop: 8 }}>카운트다운은 <b>종료 시각까지</b> 실시간으로 줄어듭니다. 종료되면 "종료된 타임세일"로 표시됩니다. 할인가는 라이브에서 자동 계산됩니다.</Note>
        </div>
      ),
    },
    {
      key: 'text',
      label: <Space size={4}><FontSizeOutlined />텍스트</Space>,
      children: (
        <div>
          <Title level={5} style={{ marginTop: 0 }}>텍스트 블록</Title>
          <Note><Tag>텍스트 추가</Tag> 버튼 → 문구 입력 후 정렬·폰트크기·굵기·색상·위아래 여백을 지정합니다. 엔터는 줄바꿈으로 표시됩니다.</Note>
          <Space wrap align="end" style={{ marginBottom: 12 }}>
            <div><div style={{ fontSize: 12, color: '#888' }}>정렬</div><Select defaultValue="center" style={{ width: 110 }}><Option value="left">왼쪽</Option><Option value="center">가운데</Option><Option value="right">오른쪽</Option></Select></div>
            <div><div style={{ fontSize: 12, color: '#888' }}>폰트크기</div><InputNumber defaultValue={24} min={10} max={80} style={{ width: 90 }} /></div>
            <div><div style={{ fontSize: 12, color: '#888' }}>굵기</div><Select defaultValue="bold" style={{ width: 90 }}><Option value="normal">보통</Option><Option value="bold">굵게</Option></Select></div>
            <div><div style={{ fontSize: 12, color: '#888' }}>색상</div><Input type="color" defaultValue="#fe6326" style={{ width: 56, padding: 0, border: 'none', background: 'transparent' }} /></div>
          </Space>
          <div className="preview-block-container" style={{ maxWidth: 460 }}>
            <div className="block-header"><div className="block-title"><FontSizeOutlined /><strong>텍스트 블록</strong></div></div>
            <div className="block-content"><div style={{ textAlign: 'center', fontSize: 24, fontWeight: 'bold', color: '#fe6326' }}>지금이 가장 쌉니다 · 최대 50% OFF</div></div>
          </div>
        </div>
      ),
    },
    {
      key: 'video',
      label: <Space size={4}><YoutubeOutlined />영상</Space>,
      children: (
        <div>
          <Title level={5} style={{ marginTop: 0 }}>영상 블록 (YouTube)</Title>
          <Note><Tag>YouTube 추가</Tag> 버튼 → YouTube <b>링크 또는 영상 ID</b>를 붙여넣고 비율(W/H)과 자동재생을 설정합니다.</Note>
          <Space wrap align="end">
            <div><div style={{ fontSize: 12, color: '#888' }}>YouTube 링크/ID</div><Input style={{ width: 280 }} defaultValue="https://youtu.be/XXXXXXXXXXX" /></div>
            <div><div style={{ fontSize: 12, color: '#888' }}>비율 W</div><InputNumber defaultValue={16} style={{ width: 80 }} /></div>
            <div><div style={{ fontSize: 12, color: '#888' }}>비율 H</div><InputNumber defaultValue={9} style={{ width: 80 }} /></div>
          </Space>
          <div style={{ marginTop: 12 }}>
            <Row left="링크 복사">유튜브 영상에서 [공유] &gt; [동영상 URL 복사]로 얻은 주소를 붙여넣으면 됩니다.</Row>
            <Row left="비율">기본 16:9. 세로 영상이면 9:16 등으로 조정합니다.</Row>
            <Row left="자동재생">켜면 음소거·반복이 자동 적용되어 배너 영상처럼 재생됩니다.</Row>
          </div>
        </div>
      ),
    },
    {
      key: 'notice',
      label: <Space size={4}><ExclamationCircleOutlined />유의사항</Space>,
      children: (
        <div>
          <Title level={5} style={{ marginTop: 0 }}>이벤트 유의사항 블록</Title>
          <Note><Tag>이벤트 유의사항 추가</Tag> 버튼 → 토글 버튼 제목, 이미지(선택), 본문 텍스트(선택), 본문 스타일(배경색·글자색·폰트·줄간격·자간·패딩)을 설정합니다. 이미지·본문 중 하나만 입력해도 됩니다.</Note>
          <div style={{ maxWidth: 460 }}>
            <div style={{ padding: '12px 16px', background: '#f5f5f5', border: '1px solid #e0e0e0', borderRadius: 6, fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>이벤트 유의사항</span><span style={{ fontSize: 12 }}>▾</span>
            </div>
            <div style={{ padding: 16, fontSize: 13, color: '#444', lineHeight: 1.7, border: '1px solid #f0f0f0', borderTop: 'none' }}>
              · 본 이벤트는 재고 소진 시 조기 종료될 수 있습니다.<br />
              · 쿠폰은 1인 1회 다운로드 가능하며 일부 상품은 제외됩니다.<br />
              · 자세한 내용은 고객센터로 문의해 주세요.
            </div>
          </div>
          <Note style={{ marginTop: 8 }}>라이브 페이지에서는 토글 버튼 클릭 시 본문이 슬라이드로 펼쳐집니다.</Note>
        </div>
      ),
    },
    {
      key: 'save',
      label: <Space size={4}><SaveOutlined />미리보기·저장</Space>,
      children: (
        <div>
          <Title level={5} style={{ marginTop: 0 }}>최종 확인 후 저장</Title>
          <Steps direction="vertical" size="small" current={-1} items={[
            { title: '미리보기로 최종 확인', description: '상단 [미리보기] 버튼으로 실제 노출 모습을 확인합니다. 탭·팝업도 클릭해 동작을 확인하세요.' },
            { title: '[이벤트 등록] 클릭', description: '제목과 블록이 모두 채워졌는지 검사한 뒤 저장됩니다. 이미지·팝업 이미지는 이때 서버에 업로드됩니다.' },
            { title: '상세 페이지로 이동', description: '저장되면 상세 페이지로 이동하며, 쇼핑몰에 붙여 넣을 라이브 링크/삽입 코드를 받습니다.' },
            { title: '수정은 [나의 이벤트 목록]에서', description: '쿠폰·페이지 너비는 저장만 하면 자동 반영되고, 블록 구조 변경은 저장(재배포) 후 반영됩니다.' },
          ]} />
          <Space>
            <Button icon={<EyeOutlined />}>미리보기</Button>
            <Button type="primary" icon={<SaveOutlined />}>이벤트 등록</Button>
          </Space>
        </div>
      ),
    },
  ];

  return (
    <Card
      title={<Space><ProfileOutlined /><span>나의 이벤트 제작 사용설명서</span></Space>}
      styles={{ body: { paddingTop: 8 } }}
    >
      <Paragraph type="secondary" style={{ fontSize: 13, marginTop: 0 }}>
        이벤트 페이지 제작에서 사용하는 기능을 하나씩 설명합니다. 상단 탭을 눌러 원하는 기능을 확인하세요.
      </Paragraph>
      <Divider style={{ margin: '8px 0 0' }} />
      <Tabs items={tabs} tabPosition="top" />
    </Card>
  );
}
