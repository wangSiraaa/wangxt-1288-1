const jwt = require('jsonwebtoken');
const config = require('../config');

const authMiddleware = async (ctx, next) => {
  const token = ctx.headers['authorization']?.replace('Bearer ', '');
  
  if (!token) {
    ctx.status = 401;
    ctx.body = { code: 401, message: '未提供认证令牌' };
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    ctx.state.user = decoded;
    await next();
  } catch (error) {
    ctx.status = 401;
    ctx.body = { code: 401, message: '认证令牌无效或已过期' };
  }
};

const roleMiddleware = (roles) => {
  return async (ctx, next) => {
    const user = ctx.state.user;
    if (!user || !roles.includes(user.role)) {
      ctx.status = 403;
      ctx.body = { code: 403, message: '权限不足' };
      return;
    }
    await next();
  };
};

module.exports = { authMiddleware, roleMiddleware };
