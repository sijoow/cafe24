// src/components/Sidebar.jsx
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

export default function Sidebar({ collapsed, onToggle }) {
  const { mallId } = useParams();  // URL 파라미터

  // /:mallId 아래에서 상대경로로 이동
  const base = `/${mallId}`;

  return (
    <div className="sidebar-wrapper">
      {/* ...헤더 생략... */}
      <Menu theme="dark" mode="inline" inlineCollapsed={collapsed}>
        <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
          <Link to={`${base}/dashboard`}>대시보드</Link>
        </Menu.Item>
        <Menu.ItemGroup key="event" title="이벤트">
          <Menu.Item key="event:create" icon={<AppstoreOutlined />}>
            <Link to={`${base}/event/create`}>이벤트 제작</Link>
          </Menu.Item>
          <Menu.Item key="event:list" icon={<UnorderedListOutlined />}>
            <Link to={`${base}/event/list`}>내 이벤트</Link>
          </Menu.Item>
        </Menu.ItemGroup>
        <Menu.ItemGroup key="stats" title="통계">
          <Menu.Item key="stats:pageview" icon={<BarChartOutlined />}>
            <Link to={`${base}/stats/pageview`}>페이지뷰</Link>
          </Menu.Item>
          <Menu.Item key="stats:participation" icon={<TeamOutlined />}>
            <Link to={`${base}/stats/participation`}>참여자</Link>
          </Menu.Item>
          <Menu.Item key="stats:environment" icon={<ShareAltOutlined />}>
            <Link to={`${base}/stats/environment`}>유입환경</Link>
          </Menu.Item>
        </Menu.ItemGroup>
      </Menu>
    </div>
  );
}
