const Router = require('koa-router');
const Database = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = new Router();

router.use(authMiddleware);

router.get('/', async ctx => {
  const { page = 1, pageSize = 10, role, keyword, area_id } = ctx.query;
  const offset = (page - 1) * pageSize;
  
  let where = 'WHERE 1=1';
  const params = [];
  
  if (role) {
    where += ' AND role = ?';
    params.push(role);
  }
  if (area_id) {
    where += ' AND area_id = ?';
    params.push(area_id);
  }
  if (keyword) {
    where += ' AND (username LIKE ? OR real_name LIKE ? OR phone LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const users = await Database.query(
    `SELECT u.*, a.name as area_name FROM users u 
     LEFT JOIN areas a ON u.area_id = a.id 
     ${where} ORDER BY u.id DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize), parseInt(offset)]
  );

  const total = await Database.getOne(`SELECT COUNT(*) as count FROM users ${where}`, params);

  ctx.body = {
    code: 200,
    data: {
      list: users,
      total: total.count,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }
  };
});

router.get('/:id', async ctx => {
  const user = await Database.getOne(
    'SELECT u.*, a.name as area_name FROM users u LEFT JOIN areas a ON u.area_id = a.id WHERE u.id = ?',
    [ctx.params.id]
  );
  ctx.body = { code: 200, data: user };
});

router.post('/', async ctx => {
  const data = ctx.request.body;
  const id = await Database.insert('users', data);
  ctx.body = { code: 200, message: '创建成功', data: { id } };
});

router.put('/:id', async ctx => {
  const data = ctx.request.body;
  if (data.password === '') delete data.password;
  await Database.update('users', data, 'id = ?', [ctx.params.id]);
  ctx.body = { code: 200, message: '更新成功' };
});

router.delete('/:id', async ctx => {
  await Database.delete('users', 'id = ?', [ctx.params.id]);
  ctx.body = { code: 200, message: '删除成功' };
});

router.get('/list/cleaners', async ctx => {
  const cleaners = await Database.query(
    "SELECT id, real_name, phone, area_id FROM users WHERE role = 'cleaner' AND status = 1 ORDER BY real_name"
  );
  ctx.body = { code: 200, data: cleaners };
});

module.exports = router;
