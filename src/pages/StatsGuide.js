// src/pages/StatsGuide.js
// 통계 사용설명서 — 사이드바 "통계 사용설명서" 메뉴 전용 페이지.
import React from 'react';
import { Card, Typography, Tag, Space, Divider, Alert } from 'antd';
import {
  BarChartOutlined, DashboardOutlined, TeamOutlined, ShareAltOutlined, ShoppingCartOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

const SubTitle = ({ children }) => (
  <h4 style={{ margin: '18px 0 8px', color: '#1f1f1f', display: 'flex', alignItems: 'center', gap: 6 }}>{children}</h4>
);
const Row = ({ left, children }) => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '9px 0', borderBottom: '1px solid #f5f5f5' }}>
    <div style={{ flexShrink: 0, width: 120, fontWeight: 600, color: '#444' }}>{left}</div>
    <div style={{ flex: 1, color: '#555', fontSize: 13, lineHeight: 1.7 }}>{children}</div>
  </div>
);

export default function StatsGuide() {
  return (
    <Card
      title={<Space><BarChartOutlined /><span>통계 사용설명서</span></Space>}
      styles={{ body: { paddingTop: 12 } }}
    >
      <Title level={5} style={{ marginTop: 0 }}>통계 화면 읽는 법</Title>
      <Paragraph type="secondary" style={{ fontSize: 13 }}>
        좌측 「대시보드」와 「통계」 메뉴에서 이벤트 성과를 봅니다. 모든 통계는 상단의 <Text strong>이벤트 선택 + 기간 선택</Text>에 따라 갱신됩니다.
      </Paragraph>
      <Divider style={{ margin: '8px 0 4px' }} />

      <SubTitle><DashboardOutlined /> 대시보드 (종합)</SubTitle>
      <Row left="무엇을 보나">선택한 이벤트의 방문·재방문, 디바이스 추이, 쿠폰 발급/사용, 상품 성과를 한 화면에 모아 봅니다.</Row>
      <Row left="페이지(URL)">같은 이벤트를 여러 URL에 설치하면 데이터가 흩어집니다. 그래서 기본은 <b>"전체(합산)"</b> — 모든 URL을 합쳐 보여줍니다. 특정 URL만 보려면 드롭다운에서 선택하세요. (목록은 최근 방문순)</Row>
      <Row left="이동/복사">'이벤트 페이지 이동'·'링크 복사'는 가장 최근 URL(대표)을 사용합니다. (먼저 홈페이지 주소 설정 필요)</Row>

      <SubTitle><BarChartOutlined /> 페이지뷰 통계</SubTitle>
      <Row left="무엇을 보나">이벤트 페이지의 일자별 조회수·방문자(신규/재방문) 추이.</Row>

      <SubTitle><ShareAltOutlined /> 유입 환경</SubTitle>
      <Row left="무엇을 보나">방문자의 기기(PC/모바일)와 유입 경로(referrer)별 분포.</Row>

      <SubTitle><ShoppingCartOutlined /> 상품 클릭데이터</SubTitle>
      <Row left="무엇을 보나">이벤트 안에서 어떤 상품이 많이 눌렸는지 순위. 인기 상품 파악·진열 개선에 활용.</Row>

      <SubTitle><TeamOutlined /> 쿠폰 다운로드 / 주문 완료 <Tag>임시 숨김</Tag></SubTitle>
      <Row left="현재 상태">데이터가 충분치 않아 메뉴에서 임시로 숨겨둔 상태입니다. (수집은 계속되며 데이터는 보존됩니다.) 쿠폰·배너(URL)·팝업·탭 <b>클릭 영역</b>은 집계되고 있어, 데이터가 쌓이면 다시 노출할 수 있습니다.</Row>

      <Alert style={{ marginTop: 16 }} type="info" showIcon
        message="데이터는 이벤트를 라이브에 노출한 뒤 방문·클릭부터 누적됩니다 (과거 소급 집계 없음). 수치가 0이면 아직 방문/클릭이 없거나, 설치(삽입) 코드가 해당 페이지에 들어갔는지 확인하세요." />
    </Card>
  );
}
