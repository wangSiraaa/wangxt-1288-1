const Router = require('koa-router');
const Database = require('../models/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = new Router();

router.use(authMiddleware);

router.get('/', async ctx => {
  const { page = 1, pageSize = 10, toilet_id, status, fault_level, start_date, end_date } = ctx.query;
  const offset = (page - 1) * pageSize;
  
  let where = 'WHERE 1=1';
  const params = [];
  
  if (toilet_id) {
    where += ' AND ro.toilet_id = ?';
    params.push(toilet_id);
  }
  if (status) {
    where += ' AND ro.status = ?';
    params.push(status);
  }
  if (fault_level) {
    where += ' AND ro.fault_level = ?';
    params.push(fault_level);
  }
  if (start_date) {
    where += ' AND ro.created_at >= ?';
    params.push(start_date);
  }
  if (end_date) {
    where += ' AND ro.created_at <= ?';
    params.push(end_date);
  }

  const orders = await Database.query(
    `SELECT ro.*, t.name as toilet_name, t.code as toilet_code, t.address as toilet_address,
            u1.real_name as reporter_name, u2.real_name as assigned_name
     FROM repair_orders ro 
     LEFT JOIN toilets t ON ro.toilet_id = t.id
     LEFT JOIN users u1 ON ro.reporter_id = u1.id
     LEFT JOIN users u2 ON ro.assigned_to = u2.id
     ${where} ORDER BY ro.created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize), parseInt(offset)]
  );

  const total = await Database.getOne(`SELECT COUNT(*) as count FROM repair_orders ro ${where}`, params);

  ctx.body = {
    code: 200,
    data: {
      list: orders,
      total: total.count,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }
  };
});

router.get('/stats', async ctx => {
  const pending = await Database.getOne("SELECT COUNT(*) as count FROM repair_orders WHERE status = 'pending'");
  const assigned = await Database.getOne("SELECT COUNT(*) as count FROM repair_orders WHERE status = 'assigned'");
  const repairing = await Database.getOne("SELECT COUNT(*) as count FROM repair_orders WHERE status = 'repairing'");
  const completed = await Database.getOne("SELECT COUNT(*) as count FROM repair_orders WHERE status = 'completed'");
  
  ctx.body = {
    code: 200,
    data: {
      pending: pending.count,
      assigned: assigned.count,
      repairing: repairing.count,
      completed: completed.count
    }
  };
});

router.get('/:id', async ctx => {
  const order = await Database.getOne(
    `SELECT ro.*, t.name as toilet_name, u1.real_name as reporter_name, u2.real_name as assigned_name
     FROM repair_orders ro 
     LEFT JOIN toilets t ON ro.toilet_id = t.id
     LEFT JOIN users u1 ON ro.reporter_id = u1.id
     LEFT JOIN users u2 ON ro.assigned_to = u2.id
     WHERE ro.id = ?`,
    [ctx.params.id]
  );
  ctx.body = { code: 200, data: order };
});

router.post('/', async ctx => {
  const data = ctx.request.body;
  data.order_no = data.order_no || 'RP' + Date.now() + Math.floor(Math.random() * 1000);
  data.reporter_id = data.reporter_id || ctx.state.user.id;
  const id = await Database.insert('repair_orders', data);
  ctx.body = { code: 200, message: '维修工单创建成功', data: { id } };
});

router.put('/:id', async ctx => {
  await Database.update('repair_orders', ctx.request.body, 'id = ?', [ctx.params.id]);
  ctx.body = { code: 200, message: '更新成功' };
});

router.post('/:id/assign', roleMiddleware(['supervisor', 'admin']), async ctx => {
  const { assigned_to } = ctx.request.body;
  await Database.update(
    'repair_orders',
    { status: 'assigned', assigned_to, assigned_at: new Date() },
    'id = ?',
    [ctx.params.id]
  );
  ctx.body = { code: 200, message: '派发成功' };
});

router.post('/:id/start', async ctx => {
  await Database.update(
    'repair_orders',
    { status: 'repairing' },
    'id = ?',
    [ctx.params.id]
  );
  ctx.body = { code: 200, message: '已开始维修' };
});

router.post('/:id/complete', async ctx => {
  const { repair_result } = ctx.request.body;
  await Database.update(
    'repair_orders',
    { status: 'completed', repair_result, completed_at: new Date() },
    'id = ?',
    [ctx.params.id]
  );
  ctx.body = { code: 200, message: '维修完成' };
});

router.delete('/:id', async ctx => {
  await Database.delete('repair_orders', 'id = ?', [ctx.params.id]);
  ctx.body = { code: 200, message: '删除成功' };
});

module.exports = router;
