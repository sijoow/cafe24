import React from 'react';
import { Link, useParams } from 'react-router-dom';
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
  const base = mallId ? `/${mallId}` : '';
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
      <Menu mode="inline" theme="dark" inlineCollapsed={collapsed} style={{ flex:1, borderRight:0 }}>
        <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
          <Link to={`${base}/dashboard`}>대시보드</Link>
        </Menu.Item>
        <Menu.ItemGroup key="event" title="이벤트">
          <Menu.Item key="create" icon={<AppstoreOutlined />}>
            <Link to={`${base}/event/create`}>이벤트 제작</Link>
          </Menu.Item>
          <Menu.Item key="list" icon={<UnorderedListOutlined />}>
            <Link to={`${base}/event/list`}>이벤트 목록</Link>
          </Menu.Item>
        </Menu.ItemGroup>
        <Menu.ItemGroup key="stats" title="통계">
          <Menu.Item key="pageview" icon={<BarChartOutlined />}>
            <Link to={`${base}/stats/pageview`}>페이지뷰 통계</Link>
          </Menu.Item>
          <Menu.Item key="participation" icon={<TeamOutlined />}>
            <Link to={`${base}/stats/participation`}>참여자 통계</Link>
          </Menu.Item>
          <Menu.Item key="environment" icon={<ShareAltOutlined />}>
            <Link to={`${base}/stats/environment`}>유입 환경</Link>
          </Menu.Item>
        </Menu.ItemGroup>
      </Menu>
    </div>
  );
}
