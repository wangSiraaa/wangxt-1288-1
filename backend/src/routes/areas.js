const Router = require('koa-router');
const Database = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = new Router();

router.use(authMiddleware);

router.get('/', async ctx => {
  const areas = await Database.query(
    `SELECT a.*, u.real_name as supervisor_name 
     FROM areas a LEFT JOIN users u ON a.supervisor_id = u.id 
     ORDER BY a.id`
  );
  ctx.body = { code: 200, data: areas };
});

router.get('/:id', async ctx => {
  const area = await Database.getOne(
    `SELECT a.*, u.real_name as supervisor_name 
     FROM areas a LEFT JOIN users u ON a.supervisor_id = u.id 
     WHERE a.id = ?`,
    [ctx.params.id]
  );
  ctx.body = { code: 200, data: area };
});

router.post('/', async ctx => {
  const id = await Database.insert('areas', ctx.request.body);
  ctx.body = { code: 200, message: '创建成功', data: { id } };
});

router.put('/:id', async ctx => {
  await Database.update('areas', ctx.request.body, 'id = ?', [ctx.params.id]);
  ctx.body = { code: 200, message: '更新成功' };
});

router.delete('/:id', async ctx => {
  await Database.delete('areas', 'id = ?', [ctx.params.id]);
  ctx.body = { code: 200, message: '删除成功' };
});

module.exports = router;
