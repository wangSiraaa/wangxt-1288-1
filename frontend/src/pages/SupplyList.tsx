import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Select,
  Modal,
  Form,
  InputNumber,
  Tag,
  App,
  Popconfirm,
  DatePicker,
  Input,
  Card,
  Statistic,
  Row,
  Col
} from 'antd';
import { PlusOutlined, EditOutlined, ReloadOutlined, CheckOutlined, SendOutlined, ExclamationOutlined } from '@ant-design/icons';
import { supplyApi, toiletApi, userApi } from '@/services/api';
import { SupplyOrder, Toilet, User, PageData } from '@/types';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const SupplyList: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SupplyOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [stats, setStats] = useState<any>({});
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [toiletId, setToiletId] = useState<number | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [orderType, setOrderType] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [assignVisible, setAssignVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<SupplyOrder | null>(null);
  const [assigningItem, setAssigningItem] = useState<SupplyOrder | null>(null);
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();

  useEffect(() => {
    loadOptions();
    loadData();
    loadStats();
  }, [page, pageSize]);

  const loadOptions = async () => {
    try {
      const [tRes, uRes] = await Promise.all([
        toiletApi.list({ pageSize: 1000 }),
        userApi.list({ pageSize: 1000 })
      ]);
      setToilets(tRes.list);
      setUsers(uRes.list);
    } catch (e) {
      console.error(e);
    }
  };

  const loadStats = async () => {
    try {
      const s = await supplyApi.stats();
      setStats(s);
    } catch (e) {
      console.error(e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (toiletId) params.toilet_id = toiletId;
      if (status) params.status = status;
      if (orderType) params.order_type = orderType;
      if (dateRange && dateRange.length === 2) {
        params.start_date = dateRange[0].format('YYYY-MM-DD');
        params.end_date = dateRange[1].format('YYYY-MM-DD');
      }
      const res: PageData<SupplyOrder> = await supplyApi.list(params);
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
    setToiletId(undefined);
    setStatus(undefined);
    setOrderType(undefined);
    setDateRange([]);
    setPage(1);
    setTimeout(loadData, 0);
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldsValue({ toilet_paper_qty: 0, hand_sanitizer_qty: 0 });
    setModalVisible(true);
  };

  const handleEdit = (item: SupplyOrder) => {
    setEditingItem(item);
    form.setFieldsValue(item);
    setModalVisible(true);
  };

  const handleAssign = (item: SupplyOrder) => {
    setAssigningItem(item);
    assignForm.resetFields();
    setAssignVisible(true);
  };

  const handleComplete = async (id: number) => {
    try {
      await supplyApi.complete(id);
      message.success('补给完成，库存已更新');
      loadData();
      loadStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCheckStock = async () => {
    try {
      await supplyApi.checkStock();
      message.success('库存检查完成');
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingItem) {
        await supplyApi.update(editingItem.id, values);
        message.success('更新成功');
      } else {
        await supplyApi.create(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
      loadStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssignSubmit = async () => {
    if (!assigningItem) return;
    try {
      const values = await assignForm.validateFields();
      await supplyApi.assign(assigningItem.id, values);
      message.success('派发成功');
      setAssignVisible(false);
      loadData();
      loadStats();
    } catch (e) {
      console.error(e);
    }
  };

  const statusConfig: any = {
    pending: { color: 'orange', text: '待处理', action: '处理中' },
    assigned: { color: 'blue', text: '已派发', action: '配送中' },
    delivering: { color: 'cyan', text: '配送中', action: '完成' },
    completed: { color: 'green', text: '已完成', action: '-' },
    cancelled: { color: 'default', text: '已取消', action: '-' }
  };

  const columns = [
    { title: '补给单号', dataIndex: 'order_no', width: 150 },
    { title: '公厕', dataIndex: 'toilet_name', width: 150 },
    { title: '公厕地址', dataIndex: 'toilet_address', ellipsis: true },
    { title: '厕纸(包)', dataIndex: 'toilet_paper_qty', width: 100 },
    { title: '洗手液(瓶)', dataIndex: 'hand_sanitizer_qty', width: 100 },
    { title: '类型', dataIndex: 'order_type', width: 100, render: (v: string) => v === 'auto' ? <Tag color="purple">系统自动</Tag> : <Tag color="cyan">手动创建</Tag> },
    { title: '派发人员', dataIndex: 'assigned_name', width: 100, render: (v: string) => v || '-' },
    { title: '创建时间', dataIndex: 'created_at', width: 160, render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) => {
        const cfg = statusConfig[v] || statusConfig.pending;
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      }
    },
    {
      title: '操作',
      width: 220,
      fixed: 'right' as const,
      render: (_: any, r: SupplyOrder) => (
        <Space size={4}>
          {r.status === 'pending' && (
            <>
              <Button type="link" size="small" icon={<SendOutlined />} onClick={() => handleAssign(r)}>派发</Button>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)}>编辑</Button>
            </>
          )}
          {(r.status === 'pending' || r.status === 'assigned' || r.status === 'delivering') && (
            <Popconfirm title="确认完成补给？将更新公厕库存" onConfirm={() => handleComplete(r.id)}>
              <Button type="link" size="small" icon={<CheckOutlined />}>完成</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>耗材补给</h2>
        <Space>
          <Button icon={<ExclamationOutlined />} onClick={handleCheckStock}>检查所有库存</Button>
          <Button icon={<PlusOutlined />} type="primary" onClick={handleAdd}>新建补给单</Button>
          <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card><Statistic title="待处理" value={stats.pending || 0} valueStyle={{ color: '#fa8c16' }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="已派发" value={stats.assigned || 0} valueStyle={{ color: '#1677ff' }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="配送中" value={stats.delivering || 0} valueStyle={{ color: '#13c2c2' }} /></Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card><Statistic title="已完成" value={stats.completed || 0} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
      </Row>

      <div className="table-toolbar">
        <div className="search-form">
          <Select
            placeholder="选择公厕"
            allowClear
            showSearch
            optionFilterProp="children"
            value={toiletId}
            onChange={v => setToiletId(v)}
            style={{ width: 200 }}
          >
            {toilets.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
          </Select>
          <Select
            placeholder="状态"
            allowClear
            value={status}
            onChange={v => setStatus(v)}
            style={{ width: 120 }}
          >
            {Object.keys(statusConfig).map(k => (
              <Option key={k} value={k}>{statusConfig[k].text}</Option>
            ))}
          </Select>
          <Select
            placeholder="生成方式"
            allowClear
            value={orderType}
            onChange={v => setOrderType(v)}
            style={{ width: 140 }}
          >
            <Option value="auto">系统自动</Option>
            <Option value="manual">手动创建</Option>
          </Select>
          <RangePicker onChange={(v: any) => setDateRange(v)} />
          <Button type="primary" onClick={handleSearch}>搜索</Button>
          <Button onClick={handleReset}>重置</Button>
        </div>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={data}
        rowKey="id"
        scroll={{ x: 1400 }}
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
        title={editingItem ? '编辑补给单' : '新建补给单'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="toilet_id" label="公厕" rules={[{ required: true, message: '请选择公厕' }]}>
            <Select placeholder="请选择公厕" showSearch optionFilterProp="children">
              {toilets.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
            </Select>
          </Form.Item>
          <Space size={24}>
            <Form.Item name="toilet_paper_qty" label="厕纸数量(包)" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="hand_sanitizer_qty" label="洗手液数量(瓶)" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: 150 }} />
            </Form.Item>
          </Space>
          <Form.Item name="remark" label="备注">
            <TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="派发补给单"
        open={assignVisible}
        onOk={handleAssignSubmit}
        onCancel={() => setAssignVisible(false)}
        width={400}
      >
        <Form form={assignForm} layout="vertical">
          {assigningItem && (
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
              <p style={{ margin: 0 }}><b>单号：</b>{assigningItem.order_no}</p>
              <p style={{ margin: 0 }}><b>公厕：</b>{assigningItem.toilet_name}</p>
              <p style={{ margin: 0 }}><b>厕纸：</b>{assigningItem.toilet_paper_qty}包，<b>洗手液：</b>{assigningItem.hand_sanitizer_qty}瓶</p>
            </div>
          )}
          <Form.Item name="assigned_to" label="派发人员" rules={[{ required: true, message: '请选择派发人员' }]}>
            <Select placeholder="请选择派发人员" showSearch optionFilterProp="children">
              {users.filter(u => ['supervisor', 'admin', 'cleaner'].includes(u.role)).map(u => (
                <Option key={u.id} value={u.id}>{u.real_name} ({u.role})</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SupplyList;
