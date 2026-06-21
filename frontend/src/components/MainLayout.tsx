import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button, Space } from 'antd';
import {
  DashboardOutlined,
  HomeOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  ShoppingOutlined,
  ToolOutlined,
  MessageOutlined,
  AlertOutlined,
  TeamOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { User } from '@/types';
import { alertApi } from '@/services/api';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '数据看板' },
  { key: '/toilets', icon: <HomeOutlined />, label: '公厕管理' },
  { key: '/schedules', icon: <CalendarOutlined />, label: '保洁排班' },
  { key: '/check-ins', icon: <CheckSquareOutlined />, label: '打卡记录' },
  { key: '/supplies', icon: <ShoppingOutlined />, label: '耗材补给' },
  { key: '/repairs', icon: <ToolOutlined />, label: '设备维修' },
  { key: '/complaints', icon: <MessageOutlined />, label: '投诉处理' },
  { key: '/alerts', icon: <AlertOutlined />, label: '预警管理' },
  { key: '/users', icon: <TeamOutlined />, label: '用户管理' }
];

const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  const user: User | null = localStorage.getItem('user')
    ? JSON.parse(localStorage.getItem('user')!)
    : null;

  useEffect(() => {
    loadAlertSummary();
  }, []);

  const loadAlertSummary = async () => {
    try {
      const data = await alertApi.summary();
      setAlertCount(data.total || 0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: '个人信息' },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout }
    ]
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="light">
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #f0f0f0',
            fontSize: collapsed ? 14 : 18,
            fontWeight: 600,
            color: '#1677ff'
          }}
        >
          {collapsed ? '公厕' : '环卫公厕巡检系统'}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <DashboardOutlined /> : <DashboardOutlined />}
            onClick={() => setCollapsed(!collapsed)}
          />
          <Space size={16}>
            <Badge count={alertCount} size="small">
              <Button
                type="text"
                icon={<BellOutlined style={{ fontSize: 18 }} />}
                onClick={() => navigate('/alerts')}
              />
            </Badge>
            <Dropdown menu={userMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <span>{user?.real_name || '用户'}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: 0, background: '#f5f5f5', overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
