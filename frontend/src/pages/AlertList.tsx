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
  Card,
  Statistic,
  Row,
  Col,
  DatePicker,
  Badge
} from 'antd';
import {
  ReloadOutlined,
  CheckOutlined,
  CloseOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  BellOutlined
} from '@ant-design/icons';
import { alertApi, toiletApi } from '@/services/api';
import { Alert, Toilet, PageData } from '@/types';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const AlertList: React.FC = () => {
  const { message, modal } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Alert[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [summary, setSummary] = useState<any>({});
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [alertType, setAlertType] = useState<string | undefined>();
  const [toiletId, setToiletId] = useState<number | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [level, setLevel] = useState<string | undefined>();
  const [handleModalVisible, setHandleModalVisible] = useState(false);
  const [handlingItem, setHandlingItem] = useState<Alert | null>(null);
  const [handleType, setHandleType] = useState<'handle' | 'ignore'>('handle');
  const [form] = Form.useForm();

  useEffect(() => {
    loadOptions();
    loadData();
    loadSummary();
  }, [page, pageSize]);

  const loadOptions = async () => {
    try {
      const tRes = await toiletApi.list({ pageSize: 1000 });
      setToilets(tRes.list);
    } catch (e) {
      console.error(e);
    }
  };

  const loadSummary = async () => {
    try {
      const s = await alertApi.summary();
      setSummary(s);
    } catch (e) {
      console.error(e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (alertType) params.alert_type = alertType;
      if (toiletId) params.toilet_id = toiletId;
      if (status) params.status = status;
      if (level) params.level = level;
      const res: PageData<Alert> = await alertApi.list(params);
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
    setAlertType(undefined);
    setToiletId(undefined);
    setStatus(undefined);
    setLevel(undefined);
    setPage(1);
    setTimeout(loadData, 0);
  };

  const handleCheck = async () => {
    try {
      await alertApi.check();
      message.success('预警检查完成');
      loadData();
      loadSummary();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAlert = (item: Alert, type: 'handle' | 'ignore') => {
    setHandlingItem(item);
    setHandleType(type);
    form.resetFields();
    setHandleModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!handlingItem) return;
    try {
      const values = await form.validateFields();
      if (handleType === 'handle') {
        await alertApi.handle(handlingItem.id, values);
        message.success('已处理');
      } else {
        await alertApi.ignore(handlingItem.id, values);
        message.success('已忽略');
      }
      setHandleModalVisible(false);
      loadData();
      loadSummary();
    } catch (e) {
      console.error(e);
    }
  };

  const typeConfig: any = {
    absent: { color: 'red', icon: <ExclamationCircleOutlined />, text: '缺岗预警' },
    low_stock: { color: 'orange', icon: <WarningOutlined />, text: '库存预警' },
    complaint_overdue: { color: 'purple', icon: <InfoCircleOutlined />, text: '投诉超时' }
  };

  const statusConfig: any = {
    active: { color: 'red', text: '活跃' },
    handled: { color: 'green', text: '已处理' },
    ignored: { color: 'default', text: '已忽略' }
  };

  const levelConfig: any = {
    danger: { color: '#ff4d4f', icon: <ExclamationCircleOutlined />, text: '危险' },
    warning: { color: '#faad14', icon: <WarningOutlined />, text: '警告' },
    info: { color: '#1677ff', icon: <InfoCircleOutlined />, text: '提示' }
  };

  const columns = [
    {
      title: '预警级别',
      dataIndex: 'level',
      width: 100,
      render: (v: string) => {
        const cfg = levelConfig[v] || levelConfig.info;
        return <Tag color={cfg.color} icon={cfg.icon}>{cfg.text}</Tag>;
      }
    },
    {
      title: '预警类型',
      dataIndex: 'alert_type',
      width: 120,
      render: (v: string) => {
        const cfg = typeConfig[v] || { color: 'default', text: v };
        return <Tag color={cfg.color} icon={cfg.icon}>{cfg.text}</Tag>;
      }
    },
    { title: '公厕', dataIndex: 'toilet_name', width: 150, render: (v: string) => v || '-' },
    { title: '标题', dataIndex: 'title' },
    { title: '内容', dataIndex: 'content', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) => {
        const cfg = statusConfig[v] || statusConfig.active;
        return <Badge status={v === 'active' ? 'error' : v === 'handled' ? 'success' : 'default'} text={cfg.text} />;
      }
    },
    { title: '处理人', dataIndex: 'handler_name', width: 100, render: (v: string) => v || '-' },
    { title: '创建时间', dataIndex: 'created_at', width: 160, render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, r: Alert) => (
        <Space>
          {r.status === 'active' && (
            <>
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleAlert(r, 'handle')}>处理</Button>
              <Button type="link" size="small" icon={<CloseOutlined />} onClick={() => handleAlert(r, 'ignore')}>忽略</Button>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>预警管理</h2>
        <Space>
          <Button icon={<BellOutlined />} onClick={handleCheck}>执行预警检查</Button>
          <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="活跃预警总数"
              value={summary.total || 0}
              prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="缺岗预警"
              value={summary.absent || 0}
              prefix={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="库存预警"
              value={summary.low_stock || 0}
              prefix={<WarningOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="投诉超时预警"
              value={summary.complaint_overdue || 0}
              prefix={<InfoCircleOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <div className="table-toolbar">
        <div className="search-form">
          <Select
            placeholder="预警类型"
            allowClear
            value={alertType}
            onChange={v => setAlertType(v)}
            style={{ width: 140 }}
          >
            {Object.keys(typeConfig).map(k => (
              <Option key={k} value={k}>{typeConfig[k].text}</Option>
            ))}
          </Select>
          <Select
            placeholder="选择公厕"
            allowClear
            showSearch
            optionFilterProp="children"
            value={toiletId}
            onChange={v => setToiletId(v)}
            style={{ width: 180 }}
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
            placeholder="预警级别"
            allowClear
            value={level}
            onChange={v => setLevel(v)}
            style={{ width: 120 }}
          >
            {Object.keys(levelConfig).map(k => (
              <Option key={k} value={k}>{levelConfig[k].text}</Option>
            ))}
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
        title={handleType === 'handle' ? '处理预警' : '忽略预警'}
        open={handleModalVisible}
        onOk={handleSubmit}
        onCancel={() => setHandleModalVisible(false)}
        width={500}
      >
        {handlingItem && (
          <div style={{ marginBottom: 16, padding: 12, background: handlingItem.level === 'danger' ? '#fff1f0' : handlingItem.level === 'warning' ? '#fffbe6' : '#e6f4ff', borderRadius: 6 }}>
            <p style={{ margin: 0 }}><b>类型：</b>{typeConfig[handlingItem.alert_type]?.text || handlingItem.alert_type}</p>
            <p style={{ margin: 0 }}><b>公厕：</b>{handlingItem.toilet_name || '-'}</p>
            <p style={{ margin: 0 }}><b>标题：</b>{handlingItem.title}</p>
            <p style={{ margin: 0 }}><b>内容：</b>{handlingItem.content}</p>
          </div>
        )}
        <Form form={form} layout="vertical">
          <Form.Item name="handle_remark" label={handleType === 'handle' ? '处理说明' : '忽略原因'}>
            <TextArea rows={3} placeholder={handleType === 'handle' ? '请输入处理说明' : '请输入忽略原因'} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AlertList;
