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
  Rate,
  Upload,
  Descriptions,
  Divider,
  List,
  Avatar
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  CheckOutlined,
  SendOutlined,
  EditOutlined,
  CloseCircleOutlined,
  UploadOutlined,
  EyeOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { complaintApi, toiletApi, userApi } from '@/services/api';
import { Complaint, Toilet, User, PageData, ComplaintReview } from '@/types';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const ComplaintList: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Complaint[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [stats, setStats] = useState<any>({});
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [toiletId, setToiletId] = useState<number | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [priority, setPriority] = useState<string | undefined>();
  const [keyword, setKeyword] = useState('');
  const [dateRange, setDateRange] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [assignVisible, setAssignVisible] = useState(false);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Complaint | null>(null);
  const [assigningItem, setAssigningItem] = useState<Complaint | null>(null);
  const [reviewingItem, setReviewingItem] = useState<Complaint | null>(null);
  const [detailItem, setDetailItem] = useState<Complaint | null>(null);
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [reviewForm] = Form.useForm();

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
      const s = await complaintApi.stats();
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
      if (priority) params.priority = priority;
      if (keyword) params.keyword = keyword;
      if (dateRange && dateRange.length === 2) {
        params.start_date = dateRange[0].format('YYYY-MM-DD');
        params.end_date = dateRange[1].format('YYYY-MM-DD');
      }
      const res: PageData<Complaint> = await complaintApi.list(params);
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
    setToiletId(undefined);
    setStatus(undefined);
    setPriority(undefined);
    setDateRange([]);
    setPage(1);
    setTimeout(loadData, 0);
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (item: Complaint) => {
    setEditingItem(item);
    form.setFieldsValue(item);
    setModalVisible(true);
  };

  const handleAssign = (item: Complaint) => {
    setAssigningItem(item);
    assignForm.resetFields();
    setAssignVisible(true);
  };

  const handleReview = (item: Complaint) => {
    setReviewingItem(item);
    reviewForm.resetFields();
    setReviewVisible(true);
  };

  const handleViewDetail = async (item: Complaint) => {
    try {
      const detail = await complaintApi.detail(item.id);
      setDetailItem(detail);
      setDetailVisible(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClose = async (item: Complaint) => {
    try {
      await complaintApi.close(item.id);
      message.success('投诉已关闭');
      loadData();
      loadStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingItem) {
        await complaintApi.update(editingItem.id, values);
        message.success('更新成功');
      } else {
        await complaintApi.create(values);
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
      await complaintApi.assign(assigningItem.id, values);
      message.success('分派成功');
      setAssignVisible(false);
      loadData();
      loadStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReviewSubmit = async () => {
    if (!reviewingItem) return;
    try {
      const values = await reviewForm.validateFields();
      await complaintApi.review(reviewingItem.id, values);
      message.success('复查记录保存成功');
      setReviewVisible(false);
      loadData();
      loadStats();
    } catch (e) {
      console.error(e);
    }
  };

  const statusConfig: any = {
    pending: { color: 'orange', text: '待处理' },
    processing: { color: 'blue', text: '处理中' },
    reviewing: { color: 'cyan', text: '待复查' },
    closed: { color: 'green', text: '已关闭' }
  };

  const priorityConfig: any = {
    low: { color: 'blue', text: '低' },
    medium: { color: 'orange', text: '中' },
    high: { color: 'red', text: '高' },
    urgent: { color: 'magenta', text: '紧急' }
  };

  const sourceConfig: any = {
    hotline: '热线电话',
    online: '线上反馈',
    onsite: '现场投诉',
    other: '其他渠道'
  };

  const columns = [
    { title: '投诉编号', dataIndex: 'complaint_no', width: 150 },
    { title: '公厕', dataIndex: 'toilet_name', width: 130 },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    {
      title: '来源',
      dataIndex: 'source',
      width: 100,
      render: (v: string) => sourceConfig[v] || v
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 90,
      render: (v: string) => {
        const cfg = priorityConfig[v] || priorityConfig.medium;
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      }
    },
    { title: '复查次数', dataIndex: 'review_count', width: 90, render: (v: number) => v || 0 },
    { title: '投诉人', dataIndex: 'complainant_name', width: 100, render: (v: string) => v || '-' },
    { title: '处理人', dataIndex: 'handler_name', width: 100, render: (v: string) => v || '-' },
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
      width: 280,
      fixed: 'right' as const,
      render: (_: any, r: Complaint) => (
        <Space size={4} wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(r)}>详情</Button>
          {r.status === 'pending' && (
            <>
              <Button type="link" size="small" icon={<SendOutlined />} onClick={() => handleAssign(r)}>分派</Button>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)}>编辑</Button>
            </>
          )}
          {(r.status === 'pending' || r.status === 'processing' || r.status === 'reviewing') && (
            <Button type="link" size="small" icon={<MessageOutlined />} onClick={() => handleReview(r)}>复查</Button>
          )}
          {r.status === 'reviewing' && (r.review_count || 0) >= 1 && (
            <Button type="link" size="small" icon={<CloseCircleOutlined />} onClick={() => handleClose(r)}>关闭</Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>投诉处理</h2>
        <Space>
          <Button icon={<PlusOutlined />} type="primary" onClick={handleAdd}>新增投诉</Button>
          <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={4}><Card><Statistic title="待处理" value={stats.pending || 0} valueStyle={{ color: '#fa8c16' }} /></Card></Col>
        <Col xs={12} sm={4}><Card><Statistic title="处理中" value={stats.processing || 0} valueStyle={{ color: '#1677ff' }} /></Card></Col>
        <Col xs={12} sm={4}><Card><Statistic title="待复查" value={stats.reviewing || 0} valueStyle={{ color: '#13c2c2' }} /></Card></Col>
        <Col xs={12} sm={4}><Card><Statistic title="已关闭" value={stats.closed || 0} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col xs={12} sm={4}><Card><Statistic title="今日新增" value={stats.today || 0} valueStyle={{ color: '#722ed1' }} /></Card></Col>
      </Row>

      <div className="table-toolbar">
        <div className="search-form">
          <Input
            placeholder="搜索编号/标题/内容/投诉人"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 240 }}
          />
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
          <Select placeholder="状态" allowClear value={status} onChange={v => setStatus(v)} style={{ width: 120 }}>
            {Object.keys(statusConfig).map(k => <Option key={k} value={k}>{statusConfig[k].text}</Option>)}
          </Select>
          <Select placeholder="优先级" allowClear value={priority} onChange={v => setPriority(v)} style={{ width: 120 }}>
            {Object.keys(priorityConfig).map(k => <Option key={k} value={k}>{priorityConfig[k].text}</Option>)}
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
        scroll={{ x: 1500 }}
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
        title={editingItem ? '编辑投诉' : '新增投诉'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="toilet_id" label="涉及公厕" rules={[{ required: true, message: '请选择公厕' }]}>
                <Select placeholder="请选择公厕" showSearch optionFilterProp="children">
                  {toilets.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="source" label="投诉来源" rules={[{ required: true }]} initialValue="hotline">
                <Select>
                  {Object.keys(sourceConfig).map(k => <Option key={k} value={k}>{sourceConfig[k]}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="priority" label="优先级" rules={[{ required: true }]} initialValue="medium">
                <Select>
                  {Object.keys(priorityConfig).map(k => <Option key={k} value={k}>{priorityConfig[k].text}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="投诉类型">
                <Input placeholder="如：清洁问题、设备故障等" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="title" label="投诉标题" rules={[{ required: true, message: '请输入投诉标题' }]}>
            <Input placeholder="请简要描述投诉标题" />
          </Form.Item>
          <Form.Item name="content" label="投诉内容" rules={[{ required: true, message: '请输入投诉内容' }]}>
            <TextArea rows={4} placeholder="请详细描述投诉内容" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="complainant_name" label="投诉人姓名">
                <Input placeholder="请输入投诉人姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="complainant_phone" label="投诉人电话">
                <Input placeholder="请输入投诉人联系电话" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title="分派投诉"
        open={assignVisible}
        onOk={handleAssignSubmit}
        onCancel={() => setAssignVisible(false)}
        width={450}
      >
        <Form form={assignForm} layout="vertical">
          {assigningItem && (
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
              <p style={{ margin: 0 }}><b>编号：</b>{assigningItem.complaint_no}</p>
              <p style={{ margin: 0 }}><b>标题：</b>{assigningItem.title}</p>
              <p style={{ margin: 0 }}><b>公厕：</b>{assigningItem.toilet_name}</p>
            </div>
          )}
          <Form.Item name="handler_id" label="处理人" rules={[{ required: true, message: '请选择处理人' }]}>
            <Select placeholder="请选择处理人" showSearch optionFilterProp="children">
              {users.filter(u => ['supervisor', 'admin', 'cleaner'].includes(u.role)).map(u => (
                <Option key={u.id} value={u.id}>{u.real_name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="投诉复查"
        open={reviewVisible}
        onOk={handleReviewSubmit}
        onCancel={() => setReviewVisible(false)}
        width={500}
      >
        <Form form={reviewForm} layout="vertical">
          <Form.Item name="review_result" label="复查结果" rules={[{ required: true, message: '请选择复查结果' }]}>
            <Select placeholder="请选择复查结果">
              <Option value="passed">通过（问题已解决）</Option>
              <Option value="failed">未通过（问题未解决）</Option>
              <Option value="recheck">待再次复查</Option>
            </Select>
          </Form.Item>
          <Form.Item name="review_content" label="复查内容" rules={[{ required: true, message: '请输入复查内容' }]}>
            <TextArea rows={4} placeholder="请描述复查情况，包括问题是否解决、现场状况等" />
          </Form.Item>
          <Form.Item label="复查照片">
            <Upload
              action="#"
              listType="picture-card"
              multiple
              beforeUpload={() => { message.info('图片上传演示'); return false; }}
            >
              <UploadOutlined />
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="投诉详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        width={700}
        footer={[<Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>]}
      >
        {detailItem && (
          <div>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="投诉编号">{detailItem.complaint_no}</Descriptions.Item>
              <Descriptions.Item label="状态">
                {(() => { const cfg = statusConfig[detailItem.status]; return <Tag color={cfg?.color}>{cfg?.text}</Tag>; })()}
              </Descriptions.Item>
              <Descriptions.Item label="公厕">{detailItem.toilet_name}</Descriptions.Item>
              <Descriptions.Item label="来源">{sourceConfig[detailItem.source]}</Descriptions.Item>
              <Descriptions.Item label="优先级">
                {(() => { const cfg = priorityConfig[detailItem.priority]; return <Tag color={cfg?.color}>{cfg?.text}</Tag>; })()}
              </Descriptions.Item>
              <Descriptions.Item label="类型">{detailItem.category || '-'}</Descriptions.Item>
              <Descriptions.Item label="投诉人">{detailItem.complainant_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{detailItem.complainant_phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="处理人">{detailItem.handler_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="热线人员">{detailItem.hotline_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{dayjs(detailItem.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              <Descriptions.Item label="关闭时间">{detailItem.closed_at ? dayjs(detailItem.closed_at).format('YYYY-MM-DD HH:mm:ss') : '-'}</Descriptions.Item>
              <Descriptions.Item label="标题" span={2}>{detailItem.title}</Descriptions.Item>
              <Descriptions.Item label="投诉内容" span={2}>{detailItem.content}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">复查记录 ({detailItem.reviews?.length || 0})</Divider>
            {detailItem.reviews && detailItem.reviews.length > 0 ? (
              <List
                dataSource={detailItem.reviews}
                renderItem={(item: ComplaintReview) => (
                  <List.Item key={item.id}>
                    <List.Item.Meta
                      avatar={<Avatar>{(item.reviewer_name || 'U')[0]}</Avatar>}
                      title={
                        <Space>
                          <span>{item.reviewer_name}</span>
                          <Tag color={item.review_result === 'passed' ? 'green' : item.review_result === 'failed' ? 'red' : 'orange'}>
                            {item.review_result === 'passed' ? '通过' : item.review_result === 'failed' ? '未通过' : '待复查'}
                          </Tag>
                          <span style={{ color: '#999', fontSize: 12 }}>
                            {dayjs(item.review_time).format('YYYY-MM-DD HH:mm:ss')}
                          </span>
                        </Space>
                      }
                      description={item.review_content}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <p style={{ color: '#999', textAlign: 'center', padding: '20px 0' }}>暂无复查记录</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ComplaintList;
