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
  Popconfirm,
  DatePicker,
  Input,
  Card,
  Statistic,
  Row,
  Col,
  Upload
} from 'antd';
import { PlusOutlined, EditOutlined, ReloadOutlined, CheckOutlined, SendOutlined, PlayCircleOutlined, UploadOutlined } from '@ant-design/icons';
import { repairApi, toiletApi, userApi } from '@/services/api';
import { RepairOrder, Toilet, User, PageData } from '@/types';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const RepairList: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RepairOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [stats, setStats] = useState<any>({});
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [toiletId, setToiletId] = useState<number | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [faultLevel, setFaultLevel] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [assignVisible, setAssignVisible] = useState(false);
  const [completeVisible, setCompleteVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<RepairOrder | null>(null);
  const [assigningItem, setAssigningItem] = useState<RepairOrder | null>(null);
  const [completingItem, setCompletingItem] = useState<RepairOrder | null>(null);
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [completeForm] = Form.useForm();

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
      const s = await repairApi.stats();
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
      if (faultLevel) params.fault_level = faultLevel;
      if (dateRange && dateRange.length === 2) {
        params.start_date = dateRange[0].format('YYYY-MM-DD');
        params.end_date = dateRange[1].format('YYYY-MM-DD');
      }
      const res: PageData<RepairOrder> = await repairApi.list(params);
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
    setFaultLevel(undefined);
    setDateRange([]);
    setPage(1);
    setTimeout(loadData, 0);
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (item: RepairOrder) => {
    setEditingItem(item);
    form.setFieldsValue(item);
    setModalVisible(true);
  };

  const handleAssign = (item: RepairOrder) => {
    setAssigningItem(item);
    assignForm.resetFields();
    setAssignVisible(true);
  };

  const handleStart = async (id: number) => {
    try {
      await repairApi.start(id);
      message.success('已开始维修');
      loadData();
      loadStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleComplete = (item: RepairOrder) => {
    setCompletingItem(item);
    completeForm.resetFields();
    setCompleteVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingItem) {
        await repairApi.update(editingItem.id, values);
        message.success('更新成功');
      } else {
        await repairApi.create(values);
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
      await repairApi.assign(assigningItem.id, values);
      message.success('派发成功');
      setAssignVisible(false);
      loadData();
      loadStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCompleteSubmit = async () => {
    if (!completingItem) return;
    try {
      const values = await completeForm.validateFields();
      await repairApi.complete(completingItem.id, values);
      message.success('维修完成');
      setCompleteVisible(false);
      loadData();
      loadStats();
    } catch (e) {
      console.error(e);
    }
  };

  const statusConfig: any = {
    pending: { color: 'orange', text: '待处理' },
    assigned: { color: 'blue', text: '已派发' },
    repairing: { color: 'cyan', text: '维修中' },
    completed: { color: 'green', text: '已完成' },
    cancelled: { color: 'default', text: '已取消' }
  };

  const levelConfig: any = {
    low: { color: 'blue', text: '低' },
    medium: { color: 'orange', text: '中' },
    high: { color: 'red', text: '高' },
    urgent: { color: 'magenta', text: '紧急' }
  };

  const columns = [
    { title: '维修单号', dataIndex: 'order_no', width: 150 },
    { title: '公厕', dataIndex: 'toilet_name', width: 150 },
    { title: '设备名称', dataIndex: 'equipment_name', width: 120 },
    { title: '故障描述', dataIndex: 'fault_description', ellipsis: true },
    {
      title: '故障级别',
      dataIndex: 'fault_level',
      width: 90,
      render: (v: string) => {
        const cfg = levelConfig[v] || levelConfig.medium;
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      }
    },
    { title: '报修人', dataIndex: 'reporter_name', width: 100, render: (v: string) => v || '-' },
    { title: '维修人员', dataIndex: 'assigned_name', width: 100, render: (v: string) => v || '-' },
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
      width: 200,
      fixed: 'right' as const,
      render: (_: any, r: RepairOrder) => (
        <Space size={4}>
          {r.status === 'pending' && (
            <>
              <Button type="link" size="small" icon={<SendOutlined />} onClick={() => handleAssign(r)}>派发</Button>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)}>编辑</Button>
            </>
          )}
          {r.status === 'assigned' && (
            <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => handleStart(r.id)}>开始维修</Button>
          )}
          {r.status === 'repairing' && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleComplete(r)}>完成</Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>设备维修</h2>
        <Space>
          <Button icon={<PlusOutlined />} type="primary" onClick={handleAdd}>新增工单</Button>
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
          <Card><Statistic title="维修中" value={stats.repairing || 0} valueStyle={{ color: '#13c2c2' }} /></Card>
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
            placeholder="故障级别"
            allowClear
            value={faultLevel}
            onChange={v => setFaultLevel(v)}
            style={{ width: 120 }}
          >
            {Object.keys(levelConfig).map(k => (
              <Option key={k} value={k}>{levelConfig[k].text}</Option>
            ))}
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
        title={editingItem ? '编辑工单' : '新增工单'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={550}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="toilet_id" label="公厕" rules={[{ required: true, message: '请选择公厕' }]}>
            <Select placeholder="请选择公厕" showSearch optionFilterProp="children">
              {toilets.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="equipment_name" label="设备名称" rules={[{ required: true, message: '请输入设备名称' }]}>
            <Input placeholder="如：水龙头、冲水阀、烘干机等" />
          </Form.Item>
          <Form.Item name="fault_description" label="故障描述" rules={[{ required: true, message: '请输入故障描述' }]}>
            <TextArea rows={3} placeholder="请详细描述故障情况" />
          </Form.Item>
          <Form.Item name="fault_level" label="故障级别" rules={[{ required: true }]} initialValue="medium">
            <Select>
              {Object.keys(levelConfig).map(k => (
                <Option key={k} value={k}>{levelConfig[k].text}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="photo_url" label="故障照片">
            <Upload
              action="#"
              listType="picture"
              beforeUpload={() => { message.info('图片上传演示，请自行对接文件服务'); return false; }}
            >
              <Button icon={<UploadOutlined />}>上传照片</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="派发维修工单"
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
              <p style={{ margin: 0 }}><b>设备：</b>{assigningItem.equipment_name}</p>
              <p style={{ margin: 0 }}><b>故障：</b>{assigningItem.fault_description}</p>
            </div>
          )}
          <Form.Item name="assigned_to" label="维修人员" rules={[{ required: true, message: '请选择维修人员' }]}>
            <Select placeholder="请选择维修人员" showSearch optionFilterProp="children">
              {users.filter(u => ['supervisor', 'admin', 'cleaner'].includes(u.role)).map(u => (
                <Option key={u.id} value={u.id}>{u.real_name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="完成维修"
        open={completeVisible}
        onOk={handleCompleteSubmit}
        onCancel={() => setCompleteVisible(false)}
        width={450}
      >
        <Form form={completeForm} layout="vertical">
          <Form.Item name="repair_result" label="维修结果" rules={[{ required: true, message: '请输入维修结果' }]}>
            <TextArea rows={4} placeholder="请描述维修处理结果" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RepairList;
