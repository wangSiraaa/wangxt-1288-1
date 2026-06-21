import React from 'react';
import { Form, Input, Button, Card, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/services/api';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { message, loading } = App.useApp();
  const [submitLoading, setSubmitLoading] = React.useState(false);

  const onFinish = async (values: { username: string; password: string }) => {
    setSubmitLoading(true);
    try {
      const data = await authApi.login(values);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      message.success('登录成功');
      navigate('/dashboard');
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-title">
          <h1>环卫公厕巡检系统</h1>
          <p>请登录您的账号</p>
        </div>
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          initialValues={{ username: 'admin', password: '123456' }}
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="密码" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={submitLoading}
            >
              登录
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', color: '#999', fontSize: 12 }}>
            <p>默认账号：admin / 123456</p>
            <p>保洁员：cleaner01 / 123456</p>
            <p>主管：supervisor01 / 123456</p>
            <p>热线：hotline01 / 123456</p>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
