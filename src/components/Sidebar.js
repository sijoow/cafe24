// src/components/Sidebar.jsx
import React from 'react';
import { Menu } from 'antd';
import { Link } from 'react-router-dom';
import {
  DashboardOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  BarChartOutlined,
  TeamOutlined,
  ShareAltOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import { useMall } from '../App';      // MallContext 훅
import './Sidebar.css';

export default function Sidebar({ collapsed, onToggle }) {
  const mallId = useMall();           // 필요하면 헤더·툴팁 등에 표시

  return (
    <div className="sidebar-wrapper">
      <div className="sidebar-header">
        <img
          src="https://pub-25b16c9ef8e146749bc48d4a80b1ad5e.r2.dev/icon_png.png"
          alt="로고"
          className="sidebar-logo"
        />
        <span className="collapse-icon" onClick={onToggle}>
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </span>
      </div>

      <Menu
        mode="inline"
        theme="dark"
        inlineCollapsed={collapsed}
        style={{ flex: 1, borderRight: 0 }}
      >
        {/* ── 대시보드 ─────────────────── */}
        <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
          <Link to="/dashboard">대시보드</Link>
        </Menu.Item>

        {/* ── 이벤트 ───────────────────── */}
        <Menu.ItemGroup key="event" title="이벤트">
          <Menu.Item key="event:create" icon={<AppstoreOutlined />}>
            <Link to="/event/create">이벤트 제작</Link>
          </Menu.Item>
          <Menu.Item key="event:list" icon={<UnorderedListOutlined />}>
            <Link to="/event/list">나의 이벤트 목록</Link>
          </Menu.Item>
        </Menu.ItemGroup>

        {/* ── 통계 ─────────────────────── */}
        <Menu.ItemGroup key="stats" title="통계">
          <Menu.Item key="stats:pageview" icon={<BarChartOutlined />}>
            <Link to="/stats/pageview">페이지뷰 통계</Link>
          </Menu.Item>
          <Menu.Item key="stats:participation" icon={<TeamOutlined />}>
            <Link to="/stats/participation">참여자 현황</Link>
          </Menu.Item>
          <Menu.Item key="stats:environment" icon={<ShareAltOutlined />}>
            <Link to="/stats/environment">유입 환경</Link>
          </Menu.Item>
        </Menu.ItemGroup>
      </Menu>

      {/* (선택) 현재 Mall 표시 */}
      {mallId && !collapsed && (
        <div className="mall-id-banner">현재 몰: {mallId}</div>
      )}
    </div>
  );
}
