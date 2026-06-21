import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Space, App } from 'antd';
import {
  HomeOutlined,
  AlertOutlined,
  ToolOutlined,
  ShoppingOutlined,
  MessageOutlined,
  TeamOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { toiletApi, supplyApi, repairApi, complaintApi, alertApi } from '@/services/api';
import { Alert, Toilet } from '@/types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [toiletStats, setToiletStats] = useState<any>({});
  const [supplyStats, setSupplyStats] = useState<any>({});
  const [repairStats, setRepairStats] = useState<any>({});
  const [complaintStats, setComplaintStats] = useState<any>({});
  const [alertSummary, setAlertSummary] = useState<any>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [lowStockToilets, setLowStockToilets] = useState<Toilet[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [ts, ss, rs, cs, als, alt] = await Promise.all([
        toiletApi.stats(),
        supplyApi.stats(),
        repairApi.stats(),
        complaintApi.stats(),
        alertApi.summary(),
        alertApi.list({ status: 'active', pageSize: 10 })
      ]);
      setToiletStats(ts);
      setSupplyStats(ss);
      setRepairStats(rs);
      setComplaintStats(cs);
      setAlertSummary(als);
      setAlerts(alt.list);
      setLowStockToilets(ts.lowStock || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const alertColumns = [
    {
      title: '预警级别',
      dataIndex: 'level',
      width: 100,
      render: (level: string) => {
        const config: any = {
          danger: { color: 'red', icon: <ExclamationCircleOutlined />, text: '危险' },
          warning: { color: 'orange', icon: <WarningOutlined />, text: '警告' },
          info: { color: 'blue', icon: <InfoCircleOutlined />, text: '提示' }
        };
        const cfg = config[level] || config.info;
        return <Tag color={cfg.color} icon={cfg.icon}>{cfg.text}</Tag>;
      }
    },
    { title: '预警类型', dataIndex: 'alert_type', width: 120, render: (t: string) => ({
      absent: '缺岗预警',
      low_stock: '库存预警',
      complaint_overdue: '投诉超时'
    }[t] || t) },
    { title: '标题', dataIndex: 'title' },
    { title: '内容', dataIndex: 'content', ellipsis: true },
    { title: '时间', dataIndex: 'created_at', width: 160 }
  ];

  const stockColumns = [
    { title: '编号', dataIndex: 'code', width: 100 },
    { title: '名称', dataIndex: 'name' },
    { title: '厕纸库存', dataIndex: 'toilet_paper_stock', width: 100, render: (v: number, r: Toilet) => (
      <Space>
        <span>{v}包</span>
        {v <= r.toilet_paper_threshold && <Tag color="red">低</Tag>}
      </Space>
    )},
    { title: '洗手液库存', dataIndex: 'hand_sanitizer_stock', width: 100, render: (v: number, r: Toilet) => (
      <Space>
        <span>{v}瓶</span>
        {v <= r.hand_sanitizer_threshold && <Tag color="red">低</Tag>}
      </Space>
    )}
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 style={{ margin: 0 }}>数据看板</h2>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card hoverable onClick={() => navigate('/toilets')}>
            <Statistic
              title="公厕总数"
              value={toiletStats.total || 0}
              prefix={<HomeOutlined style={{ color: '#1677ff' }} />}
              valueStyle={{ color: '#1677ff' }}
              suffix={`正常 ${toiletStats.normal || 0}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card hoverable onClick={() => navigate('/alerts')}>
            <Statistic
              title="活跃预警"
              value={alertSummary.total || 0}
              prefix={<AlertOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
              suffix={`缺岗${alertSummary.absent || 0} / 库存${alertSummary.low_stock || 0}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card hoverable onClick={() => navigate('/repairs')}>
            <Statistic
              title="待处理维修"
              value={(repairStats.pending || 0) + (repairStats.assigned || 0) + (repairStats.repairing || 0)}
              prefix={<ToolOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
              suffix={`已完成 ${repairStats.completed || 0}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card hoverable onClick={() => navigate('/supplies')}>
            <Statistic
              title="待处理补给"
              value={(supplyStats.pending || 0) + (supplyStats.assigned || 0) + (supplyStats.delivering || 0)}
              prefix={<ShoppingOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
              suffix={`已完成 ${supplyStats.completed || 0}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card hoverable onClick={() => navigate('/complaints')}>
            <Statistic
              title="处理中投诉"
              value={(complaintStats.pending || 0) + (complaintStats.processing || 0) + (complaintStats.reviewing || 0)}
              prefix={<MessageOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
              suffix={`今日 ${complaintStats.today || 0} 新增`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card hoverable onClick={() => navigate('/users')}>
            <Statistic
              title="人员管理"
              value="-"
              prefix={<TeamOutlined style={{ color: '#13c2c2' }} />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="预警信息" extra={<a onClick={() => navigate('/alerts')}>查看全部</a>}>
            <Table
              loading={loading}
              columns={alertColumns}
              dataSource={alerts}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="低库存公厕" extra={<a onClick={() => navigate('/toilets')}>查看全部</a>}>
            <Table
              loading={loading}
              columns={stockColumns}
              dataSource={lowStockToilets}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
