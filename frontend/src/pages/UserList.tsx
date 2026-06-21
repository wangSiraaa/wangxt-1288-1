import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Select,
  Modal,
  Form,
  Tag,
  App,
  Input,
  Switch,
  Popconfirm
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { userApi, areaApi } from '@/services/api';
import { User, Area, PageData } from '@/types';
import dayjs from 'dayjs';

const { Option } = Select;

const UserList: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [areas, setAreas] = useState<Area[]>([]);
  const [keyword, setKeyword] = useState('');
  const [role, setRole] = useState<string | undefined>();
  const [areaId, setAreaId] = useState<number | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<User | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadAreas();
    loadData();
  }, [page, pageSize]);

  const loadAreas = async () => {
    try {
      const a = await areaApi.list();
      setAreas(a);
    } catch (e) {
      console.error(e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (keyword) params.keyword = keyword;
      if (role) params.role = role;
      if (areaId) params.area_id = areaId;
      const res: PageData<User> = await userApi.list(params);
      setData(res.list);
      setTotal(res.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => { setPage(1); loadData(); };

  const handleReset = () => {
    setKeyword('');
    setRole(undefined);
    setAreaId(undefined);
    setPage(1);
    setTimeout(loadData, 0);
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ status: 1 });
    setModalVisible(true);
  };

  const handleEdit = (item: User) => {
    setEditingItem(item);
    form.setFieldsValue({ ...item, password: '' });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await userApi.delete(id);
      message.success('删除成功');
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!values.password || values.password === '') delete values.password;
      if (editingItem) {
        await userApi.update(editingItem.id, values);
        message.success('更新成功');
      } else {
        if (!values.password) {
          message.error('请设置初始密码');
          return;
        }
        await userApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const roleConfig: any = {
    admin: { color: 'red', text: '系统管理员' },
    supervisor: { color: 'blue', text: '片区主管' },
    hotline: { color: 'purple', text: '热线人员' },
    cleaner: { color: 'green', text: '保洁员' }
  };

  const columns = [
    { title: '账号', dataIndex: 'username', width: 120 },
    { title: '姓名', dataIndex: 'real_name', width: 100 },
    { title: '手机号', dataIndex: 'phone', width: 140 },
    {
      title: '角色',
      dataIndex: 'role',
      width: 120,
      render: (v: string) => {
        const cfg = roleConfig[v] || roleConfig.cleaner;
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      }
    },
    { title: '所属片区', dataIndex: 'area_name', width: 120, render: (v: string) => v || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: number) => v === 1 ? <Tag color="green">启用</Tag> : <Tag color="red">禁用</Tag>
    },
    { title: '创建时间', dataIndex: 'created_at', width: 160, render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, r: User) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)}>编辑</Button>
          {r.username !== 'admin' && (
            <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>用户管理</h2>
        <Space>
          <Button icon={<PlusOutlined />} type="primary" onClick={handleAdd}>新增用户</Button>
          <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
        </Space>
      </div>

      <div className="table-toolbar">
        <div className="search-form">
          <Input
            placeholder="搜索账号/姓名/手机号"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 220 }}
          />
          <Select
            placeholder="角色"
            allowClear
            value={role}
            onChange={v => setRole(v)}
            style={{ width: 140 }}
          >
            {Object.keys(roleConfig).map(k => (
              <Option key={k} value={k}>{roleConfig[k].text}</Option>
            ))}
          </Select>
          <Select
            placeholder="片区"
            allowClear
            value={areaId}
            onChange={v => setAreaId(v)}
            style={{ width: 150 }}
          >
            {areas.map(a => <Option key={a.id} value={a.id}>{a.name}</Option>)}
          </Select>
          <Button type="primary" onClick={handleSearch}>搜索</Button>
          <Button onClick={handleReset}>重置</Button>
        </div>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={data}
        rowKey="id"
        scroll={{ x: 1200 }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: t => `共 ${t} 条`,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); }
        }}
      />

      <Modal
        title={editingItem ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="username" label="登录账号" rules={[{ required: true, message: '请输入登录账号' }]}>
            <Input placeholder="请输入登录账号" />
          </Form.Item>
          <Form.Item
            name="password"
            label={editingItem ? '新密码（留空不修改' : '初始密码'}
            rules={editingItem ? [] : [{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder={editingItem ? '留空则不修改密码' : '请输入初始密码'} />
          </Form.Item>
          <Form.Item name="real_name" label="真实姓名" rules={[{ required: true, message: '请输入真实姓名' }]}>
            <Input placeholder="请输入真实姓名" />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色' }]} initialValue="cleaner">
            <Select>
              {Object.keys(roleConfig).map(k => (
                <Option key={k} value={k}>{roleConfig[k].text}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="area_id" label="所属片区">
            <Select placeholder="请选择所属片区" allowClear>
              {areas.map(a => <Option key={a.id} value={a.id}>{a.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态" valuePropName="checked" initialValue={1}>
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserList;
