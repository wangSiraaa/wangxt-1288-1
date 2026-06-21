import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Select,
  Modal,
  Form,
  DatePicker,
  TimePicker,
  Tag,
  App,
  Popconfirm
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { scheduleApi, toiletApi, userApi } from '@/services/api';
import { Schedule, Toilet, User, PageData } from '@/types';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = TimePicker;

const ScheduleList: React.FC = () => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Schedule[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [toilets, setToilets] = useState<Toilet[]>([]);
  const [cleaners, setCleaners] = useState<User[]>([]);
  const [toiletId, setToiletId] = useState<number | undefined>();
  const [cleanerId, setCleanerId] = useState<number | undefined>();
  const [dateRange, setDateRange] = useState<any[]>([]);
  const [status, setStatus] = useState<string | undefined>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Schedule | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadOptions();
    loadData();
  }, [page, pageSize]);

  const loadOptions = async () => {
    try {
      const [tRes, cRes] = await Promise.all([
        toiletApi.list({ pageSize: 1000 }),
        userApi.cleaners()
      ]);
      setToilets(tRes.list);
      setCleaners(cRes);
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
        params.start_date = dateRange[0].format('YYYY-MM-DD');
        params.end_date = dateRange[1].format('YYYY-MM-DD');
      }
      if (status) params.status = status;
      const res: PageData<Schedule> = await scheduleApi.list(params);
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
    setStatus(undefined);
    setPage(1);
    setTimeout(loadData, 0);
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (item: Schedule) => {
    setEditingItem(item);
    form.setFieldsValue({
      ...item,
      schedule_date: dayjs(item.schedule_date),
      shift_time: [dayjs(item.shift_start, 'HH:mm:ss'), dayjs(item.shift_end, 'HH:mm:ss')]
    });

    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await scheduleApi.delete(id);
      message.success('删除成功');
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const submitData: any = {
        toilet_id: values.toilet_id,
        cleaner_id: values.cleaner_id,
        schedule_date: values.schedule_date.format('YYYY-MM-DD'),
        shift_start: values.shift_time[0].format('HH:mm:ss'),
        shift_end: values.shift_time[1].format('HH:mm:ss'),
        shift_type: values.shift_type
      };
      if (editingItem) {
        await scheduleApi.update(editingItem.id, submitData);
        message.success('更新成功');
      } else {
        await scheduleApi.create(submitData);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const columns = [
    { title: '排班日期', dataIndex: 'schedule_date', width: 120 },
    { title: '公厕', dataIndex: 'toilet_name', width: 150 },
    { title: '公厕地址', dataIndex: 'toilet_address', ellipsis: true },
    { title: '保洁员', dataIndex: 'cleaner_name', width: 100 },
    { title: '联系电话', dataIndex: 'cleaner_phone', width: 130 },
    { title: '班次', dataIndex: 'shift_type', width: 100, render: (v: string) => ({ morning: '早班', afternoon: '午班', night: '晚班', all: '全天' }[v]) },
    { title: '上班时间', dataIndex: 'shift_start', width: 100 },
    { title: '下班时间', dataIndex: 'shift_end', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string) => ({
        scheduled: <Tag color="blue">待执行</Tag>,
        completed: <Tag color="green">已完成</Tag>,
        absent: <Tag color="red">缺岗</Tag>
      }[v])
    },
    {
      title: '操作',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, r: Schedule) => (
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
        <h2 style={{ margin: 0 }}>保洁排班</h2>
        <Space>
          <Button icon={<PlusOutlined />} type="primary" onClick={handleAdd}>新增排班</Button>
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
          <DatePicker.RangePicker
            value={dateRange as any}
            onChange={(v: any) => setDateRange(v)}
          />
          <Select
            placeholder="状态"
            allowClear
            value={status}
            onChange={v => setStatus(v)}
            style={{ width: 120 }}
          >
            <Option value="scheduled">待执行</Option>
            <Option value="completed">已完成</Option>
            <Option value="absent">缺岗</Option>
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
        scroll={{ x: 1300 }}
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
        title={editingItem ? '编辑排班' : '新增排班'}
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
          <Form.Item name="cleaner_id" label="保洁员" rules={[{ required: true, message: '请选择保洁员' }]}>
            <Select placeholder="请选择保洁员" showSearch optionFilterProp="children">
              {cleaners.map(c => <Option key={c.id} value={c.id}>{c.real_name}</Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="schedule_date" label="排班日期" rules={[{ required: true, message: '请选择日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="shift_type" label="班次" rules={[{ required: true }]} initialValue="morning">
            <Select>
              <Option value="morning">早班</Option>
              <Option value="afternoon">午班</Option>
              <Option value="night">晚班</Option>
              <Option value="all">全天</Option>
            </Select>
          </Form.Item>
          <Form.Item name="shift_time" label="工作时间" rules={[{ required: true, message: '请选择工作时间' }]}>
            <RangePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ScheduleList;
