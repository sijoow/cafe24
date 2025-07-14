// src/components/Sidebar.jsx
import React from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { Menu } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  BarChartOutlined,
  TeamOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import './Sidebar.css';

export default function Sidebar({ collapsed, onToggle }) {
  const { mallId } = useParams();
  const { pathname } = useLocation();

  // 현재 경로에서 mallId 다음의 첫 번째 토큰을 키로 사용
  // 예: /:mallId/dashboard → key = 'dashboard'
  const currentKey = pathname.split('/')[2] || 'dashboard';

  // 공통 prefix
  const prefix = `/${mallId}`;

  return (
    <div className="sidebar-wrapper">
      {/* 로고 + 토글 */}
      <div className="sidebar-header">
        <img
          src="https://pub-25b16c9ef8e146749bc48d4a80b1ad5e.r2.dev/icon_png.png"
          alt="몬몬 로고"
          className="sidebar-logo"
        />
        <span className="collapse-icon" onClick={onToggle}>
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </span>
      </div>

      {/* 메뉴 */}
      <Menu
        mode="inline"
        theme="dark"
        inlineCollapsed={collapsed}
        selectedKeys={[currentKey]}
        style={{ flex: 1, borderRight: 0 }}
      >
        {/* 대시보드 */}
        <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
          <Link to={`${prefix}/dashboard`}>대시보드</Link>
        </Menu.Item>

        {/* 이벤트 그룹 */}
        <Menu.ItemGroup key="event" title="이벤트">
          <Menu.Item key="event">
            <Link to={`${prefix}/event/create`} icon={<AppstoreOutlined />}>
              이벤트 페이지 제작
            </Link>
          </Menu.Item>
          <Menu.Item key="event">
            <Link to={`${prefix}/event/list`} icon={<UnorderedListOutlined />}>
              나의 이벤트 목록
            </Link>
          </Menu.Item>
        </Menu.ItemGroup>

        {/* 통계 그룹 */}
        <Menu.ItemGroup key="stats" title="통계">
          <Menu.Item key="stats">
            <Link to={`${prefix}/stats/pageview`} icon={<BarChartOutlined />}>
              페이지뷰 통계
            </Link>
          </Menu.Item>
          <Menu.Item key="stats">
            <Link to={`${prefix}/stats/participation`} icon={<TeamOutlined />}>
              이벤트 참여자 현황
            </Link>
          </Menu.Item>
          <Menu.Item key="stats">
            <Link to={`${prefix}/stats/environment`} icon={<ShareAltOutlined />}>
              유입 환경
            </Link>
          </Menu.Item>
        </Menu.ItemGroup>
      </Menu>
    </div>
  );
}
