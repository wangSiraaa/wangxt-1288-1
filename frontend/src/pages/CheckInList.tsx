import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Select,
  DatePicker,
  Tag,
  Rate,
  Modal,
  Form,
  Input,
  App,
  Upload,
  Card,
  Row,
  Col
} from 'antd';
import { PlusOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons';
import { checkInApi, toiletApi, userApi, scheduleApi } from '@/services/api';
import { CheckIn, Toilet, User, PageData, Schedule } from '@/types';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const CheckInList: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CheckIn[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [cleaners, setCleaners] = useState<User[]>([]);
  const [toiletId, setToiletId] = useState<number | undefined>();
  const [cleanerId, setCleanerId] = useState<number | undefined>();
  const [dateRange, setDateRange] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<CheckIn | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [form] = Form.useForm();

  const user: User | null = localStorage.getItem('user')
    ? JSON.parse(localStorage.getItem('user')!)
    : null;

  useEffect(() => {
    loadOptions();
    loadData();
  }, [page, pageSize]);

  const loadOptions = async () => {
    try {
      const toiletRes = await toiletApi.list({ pageSize: 1000 });
      setToilets(toiletRes.list);
      const cleanerRes = await userApi.cleaners();
      setCleaners(cleanerRes);
    } catch (e) {
      console.error(e);
    }
  };

  const loadSchedules = async (cleanerId: number) => {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const res = await scheduleApi.list({
        cleaner_id: cleanerId,
        schedule_date: today,
        status: 'scheduled'
      });
      setSchedules(res.list);
    } catch (e) {
      console.error(e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = { page, pageSize };
      if (toiletId) params.toilet_id = toiletId;
      if (cleanerId) params.cleaner_id = cleanerId;
      if (dateRange && dateRange.length === 2) {
        params.start_time = dateRange[0].format('YYYY-MM-DD HH:mm:ss');
        params.end_time = dateRange[1].format('YYYY-MM-DD HH:mm:ss');
      }
      const res: PageData<CheckIn> = await checkInApi.list(params);
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
    setToiletId(undefined);
    setCleanerId(undefined);
    setDateRange([]);
    setPage(1);
    setTimeout(loadData, 0);
  };

  const handleAdd = () => {
    form.resetFields();
    if (user?.role === 'cleaner') {
      form.setFieldsValue({ cleaner_id: user.id });
      loadSchedules(user.id);
    }
    setModalVisible(true);
  };

  const handleViewDetail = (item: CheckIn) => {
    setCurrentItem(item);
    setDetailVisible(true);
  };

  const handleCleanerChange = (cleanerId: number) => {
    loadSchedules(cleanerId);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const submitData: any = {
        ...values,
        check_in_time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        cleanliness_score: values.cleanliness_score || 0
      };
      await checkInApi.create(submitData);
      message.success('打卡成功');
      setModalVisible(false);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const columns = [
    { title: '打卡时间', dataIndex: 'check_in_time', width: 170, render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm:ss') },
    { title: '公厕', dataIndex: 'toilet_name', width: 150 },
    { title: '保洁员', dataIndex: 'cleaner_name', width: 100 },
    {
      title: '打卡类型',
      dataIndex: 'check_in_type',
      width: 100,
      render: (v: string) => ({ on_duty: <Tag color="green">上班打卡</Tag>, off_duty: <Tag color="orange">下班打卡</Tag>, patrol: <Tag color="blue">巡查打卡</Tag> }[v])
    },
    { title: '清洁评分', dataIndex: 'cleanliness_score', width: 100, render: (v: number) => v ? <Rate disabled value={v} allowHalf /> : '-' },
    { title: '现场状态', dataIndex: 'status_remark', ellipsis: true },
    {
      title: '操作',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, r: CheckIn) => (
        <Button type="link" size="small" onClick={() => handleViewDetail(r)}>详情</Button>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>打卡记录</h2>
        <Space>
          <Button icon={<PlusOutlined />} type="primary" onClick={handleAdd}>新增打卡</Button>
          <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
        </Space>
      </div>

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
            placeholder="选择保洁员"
            allowClear
            showSearch
            optionFilterProp="children"
            value={cleanerId}
            onChange={v => setCleanerId(v)}
            style={{ width: 150 }}
          >
            {cleaners.map(c => <Option key={c.id} value={c.id}>{c.real_name}</Option>)}
          </Select>
          <RangePicker showTime onChange={(v: any) => setDateRange(v)} />
          <Button type="primary" onClick={handleSearch}>搜索</Button>
          <Button onClick={handleReset}>重置</Button>
        </div>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={data}
        rowKey="id"
        scroll={{ x: 1100 }}
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
        title="保洁员打卡"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={550}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="cleaner_id" label="保洁员" rules={[{ required: true, message: '请选择保洁员' }]}>
                <Select
                  placeholder="请选择保洁员"
                  showSearch
                  optionFilterProp="children"
                  disabled={user?.role === 'cleaner'}
                  onChange={handleCleanerChange}
                >
                  {cleaners.map(c => <Option key={c.id} value={c.id}>{c.real_name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="schedule_id" label="所属排班">
                <Select placeholder="请选择排班（可选）">
                  {schedules.map(s => (
                    <Option key={s.id} value={s.id}>
                      {s.toilet_name} {dayjs(s.schedule_date).format('MM-DD')} {s.shift_start}-{s.shift_end}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="toilet_id" label="公厕" rules={[{ required: true, message: '请选择公厕' }]}>
            <Select placeholder="请选择公厕" showSearch optionFilterProp="children">
              {toilets.map(t => <Option key={t.id} value={t.id}>{t.name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="check_in_type" label="打卡类型" rules={[{ required: true }]} initialValue="on_duty">
            <Select>
              <Option value="on_duty">上班打卡</Option>
              <Option value="off_duty">下班打卡</Option>
              <Option value="patrol">巡查打卡</Option>
            </Select>
          </Form.Item>
          <Form.Item name="cleanliness_score" label="清洁评分" initialValue={5}>
            <Rate allowHalf />
          </Form.Item>
          <Form.Item name="status_remark" label="现场状态备注">
            <TextArea rows={3} placeholder="请输入现场状态备注（如：设备正常、厕纸充足等）" />
          </Form.Item>
          <Form.Item name="photo_url" label="现场照片">
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
        title="打卡详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[<Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>]}
        width={600}
      >
        {currentItem && (
          <div>
            <p><b>打卡时间：</b>{dayjs(currentItem.check_in_time).format('YYYY-MM-DD HH:mm:ss')}</p>
            <p><b>公厕：</b>{currentItem.toilet_name}</p>
            <p><b>保洁员：</b>{currentItem.cleaner_name}</p>
            <p><b>打卡类型：</b>{
              { on_duty: '上班打卡', off_duty: '下班打卡', patrol: '巡查打卡' }[currentItem.check_in_type]
            }</p>
            {currentItem.cleanliness_score && <p><b>清洁评分：</b><Rate disabled value={currentItem.cleanliness_score} allowHalf /></p>}
            {currentItem.status_remark && <p><b>现场备注：</b>{currentItem.status_remark}</p>}
            {currentItem.longitude && currentItem.latitude && (
              <p><b>位置：</b>{currentItem.longitude}, {currentItem.latitude}</p>
            )}
            {currentItem.photo_url && (
              <p><b>现场照片：</b></p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CheckInList;
