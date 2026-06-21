import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  Modal,
  Form,
  InputNumber,
  Tag,
  App,
  Popconfirm
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { toiletApi, areaApi } from '@/services/api';
import { Toilet, Area, PageData } from '@/types';
import dayjs from 'dayjs';

const { Option } = Select;

const ToiletList: React.FC = () => {
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Toilet[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [areas, setAreas] = useState<Area[]>([]);
  const [keyword, setKeyword] = useState('');
  const [areaId, setAreaId] = useState<number | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Toilet | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadAreas();
    loadData();
  }, [page, pageSize]);

  const loadAreas = async () => {
    try {
      const data = await areaApi.list();
      setAreas(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (keyword) params.keyword = keyword;
      if (areaId) params.area_id = areaId;
      if (status) params.status = status;
      const res: PageData<Toilet> = await toiletApi.list(params);
      setData(res.list);
      setTotal(res.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  const handleReset = () => {
    setKeyword('');
    setAreaId(undefined);
    setStatus(undefined);
    setPage(1);
    setTimeout(loadData, 0);
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (item: Toilet) => {
    setEditingItem(item);
    form.setFieldsValue(item);
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await toiletApi.delete(id);
      message.success('删除成功');
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingItem) {
        await toiletApi.update(editingItem.id, values);
        message.success('更新成功');
      } else {
        await toiletApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const columns = [
    { title: '公厕编号', dataIndex: 'code', width: 100 },
    { title: '公厕名称', dataIndex: 'name', width: 150 },
    { title: '地址', dataIndex: 'address', ellipsis: true },
    { title: '所属片区', dataIndex: 'area_name', width: 100 },
    { title: '等级', dataIndex: 'level', width: 80, render: (v: string) => ({ A: <Tag color="red">A</Tag>, B: <Tag color="orange">B</Tag>, C: <Tag color="blue">C</Tag> }[v]) },
    {
      title: '厕纸库存',
      dataIndex: 'toilet_paper_stock',
      width: 110,
      render: (v: number, r: Toilet) => (
        <Space>
          {v}包
          {r.toilet_paper_low ? <Tag color="red">低</Tag> : <Tag color="green">正常</Tag>}
        </Space>
      )
    },
    {
      title: '洗手液库存',
      dataIndex: 'hand_sanitizer_stock',
      width: 110,
      render: (v: number, r: Toilet) => (
        <Space>
          {v}瓶
          {r.hand_sanitizer_low ? <Tag color="red">低</Tag> : <Tag color="green">正常</Tag>}
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) => ({
        normal: <Tag color="green">正常</Tag>,
        closed: <Tag color="default">关闭</Tag>,
        maintenance: <Tag color="orange">维护中</Tag>
      }[v])
    },
    { title: '创建时间', dataIndex: 'created_at', width: 160, render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, r: Toilet) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>公厕管理</h2>
        <Space>
          <Button icon={<PlusOutlined />} type="primary" onClick={handleAdd}>新增公厕</Button>
          <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
        </Space>
      </div>

      <div className="table-toolbar">
        <div className="search-form">
          <Input
            placeholder="搜索编号/名称/地址"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 220 }}
          />
          <Select
            placeholder="选择片区"
            allowClear
            value={areaId}
            onChange={v => setAreaId(v)}
            style={{ width: 150 }}
          >
            {areas.map(a => <Option key={a.id} value={a.id}>{a.name}</Option>)}
          </Select>
          <Select
            placeholder="状态"
            allowClear
            value={status}
            onChange={v => setStatus(v)}
            style={{ width: 120 }}
          >
            <Option value="normal">正常</Option>
            <Option value="closed">关闭</Option>
            <Option value="maintenance">维护中</Option>
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
        title={editingItem ? '编辑公厕' : '新增公厕'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="公厕编号" rules={[{ required: true, message: '请输入公厕编号' }]}>
            <Input placeholder="请输入公厕编号" />
          </Form.Item>
          <Form.Item name="name" label="公厕名称" rules={[{ required: true, message: '请输入公厕名称' }]}>
            <Input placeholder="请输入公厕名称" />
          </Form.Item>
          <Form.Item name="address" label="地址" rules={[{ required: true, message: '请输入地址' }]}>
            <Input.TextArea rows={2} placeholder="请输入地址" />
          </Form.Item>
          <Form.Item name="area_id" label="所属片区" rules={[{ required: true, message: '请选择片区' }]}>
            <Select placeholder="请选择片区">
              {areas.map(a => <Option key={a.id} value={a.id}>{a.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="level" label="公厕等级" rules={[{ required: true }]} initialValue="B">
            <Select>
              <Option value="A">A级</Option>
              <Option value="B">B级</Option>
              <Option value="C">C级</Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]} initialValue="normal">
            <Select>
              <Option value="normal">正常</Option>
              <Option value="closed">关闭</Option>
              <Option value="maintenance">维护中</Option>
            </Select>
          </Form.Item>
          <Space size={24} wrap>
            <Form.Item name="toilet_paper_stock" label="厕纸库存(包)" rules={[{ required: true }]} initialValue={0}>
              <InputNumber min={0} style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="toilet_paper_threshold" label="厕纸预警阈值" rules={[{ required: true }]} initialValue={10}>
              <InputNumber min={0} style={{ width: 150 }} />
            </Form.Item>
          </Space>
          <Space size={24} wrap>
            <Form.Item name="hand_sanitizer_stock" label="洗手液库存(瓶)" rules={[{ required: true }]} initialValue={0}>
              <InputNumber min={0} style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="hand_sanitizer_threshold" label="洗手液预警阈值" rules={[{ required: true }]} initialValue={5}>
              <InputNumber min={0} style={{ width: 150 }} />
            </Form.Item>
          </Space>
          <Space size={24} wrap>
            <Form.Item name="peak_start_time" label="高峰开始时间" initialValue="07:00:00">
              <Input placeholder="HH:mm:ss" />
            </Form.Item>
            <Form.Item name="peak_end_time" label="高峰结束时间" initialValue="09:00:00">
              <Input placeholder="HH:mm:ss" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
};

export default ToiletList;
