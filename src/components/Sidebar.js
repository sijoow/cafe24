// src/components/Sidebar.jsx

import React from 'react';
import { Link } from 'react-router-dom';
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
  return (
    <div className="sidebar-wrapper">
      {/* ─── 로고 + 토글 ─── */}
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

      {/* ─── 메뉴 ─── */}
      <Menu
        mode="inline"
        theme="dark"
        inlineCollapsed={collapsed}
        defaultSelectedKeys={['dashboard']}
        style={{ flex: 1, borderRight: 0 }}
      >
        {/* 대시보드 */}
        <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
          <Link to="/dashboard">대시보드</Link>
        </Menu.Item>

        {/* 이벤트 그룹 */}
        <Menu.ItemGroup key="event" title="이벤트">
          <Menu.Item key="event:create" icon={<AppstoreOutlined />}>
            <Link to="/event/create">이벤트 페이지 제작</Link>
          </Menu.Item>
          <Menu.Item key="event:list" icon={<UnorderedListOutlined />}>
            <Link to="/event/list">나의 이벤트 목록</Link>
          </Menu.Item>
        </Menu.ItemGroup>

        {/* 통계 그룹 */}
        <Menu.ItemGroup key="stats" title="통계">
          <Menu.Item key="stats:pageview" icon={<BarChartOutlined />}>
            <Link to="/stats/pageview">페이지뷰 통계</Link>
          </Menu.Item>
          <Menu.Item key="stats:participation" icon={<TeamOutlined />}>
            <Link to="/stats/participation">이벤트 참여자 현황</Link>
          </Menu.Item>
           <Menu.Item key="stats:environment" icon={<ShareAltOutlined />}>
            <Link to="/stats/environment">유입 환경</Link>
          </Menu.Item>
        </Menu.ItemGroup>
      </Menu>
    </div>
  );
}
