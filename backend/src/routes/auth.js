const Router = require('koa-router');
const jwt = require('jsonwebtoken');
const Database = require('../models/db');
const config = require('../config');

const router = new Router();

router.post('/login', async ctx => {
  const { username, password } = ctx.request.body;
  
  if (!username || !password) {
    ctx.status = 400;
    ctx.body = { code: 400, message: '用户名和密码不能为空' };
    return;
  }

  const user = await Database.getOne(
    'SELECT id, username, real_name, phone, role, area_id, status FROM users WHERE username = ? AND password = ?',
    [username, password]
  );

  if (!user) {
    ctx.status = 401;
    ctx.body = { code: 401, message: '用户名或密码错误' };
    return;
  }

  if (user.status !== 1) {
    ctx.status = 403;
    ctx.body = { code: 403, message: '账号已被禁用' };
    return;
  }

  const token = jwt.sign(user, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

  ctx.body = {
    code: 200,
    message: '登录成功',
    data: {
      token,
      user
    }
  };
});

router.post('/logout', async ctx => {
  ctx.body = { code: 200, message: '退出成功' };
});

module.exports = router;
