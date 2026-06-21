const Router = require('koa-router');
const Database = require('../models/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const supplyService = require('../services/supplyService');

const router = new Router();

router.use(authMiddleware);

router.get('/', async ctx => {
  const { page = 1, pageSize = 10, toilet_id, status, order_type, start_date, end_date } = ctx.query;
  const offset = (page - 1) * pageSize;
  
  let where = 'WHERE 1=1';
  const params = [];
  
  if (toilet_id) {
    where += ' AND so.toilet_id = ?';
    params.push(toilet_id);
  }
  if (status) {
    where += ' AND so.status = ?';
    params.push(status);
  }
  if (order_type) {
    where += ' AND so.order_type = ?';
    params.push(order_type);
  }
  if (start_date) {
    where += ' AND so.created_at >= ?';
    params.push(start_date);
  }
  if (end_date) {
    where += ' AND so.created_at <= ?';
    params.push(end_date);
  }

  const orders = await Database.query(
    `SELECT so.*, t.name as toilet_name, t.code as toilet_code, t.address as toilet_address,
            u1.real_name as assigned_name, u2.real_name as creator_name
     FROM supply_orders so 
     LEFT JOIN toilets t ON so.toilet_id = t.id
     LEFT JOIN users u1 ON so.assigned_to = u1.id
     LEFT JOIN users u2 ON so.created_by = u2.id
     ${where} ORDER BY so.created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize), parseInt(offset)]
  );

  const total = await Database.getOne(`SELECT COUNT(*) as count FROM supply_orders so ${where}`, params);

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
  const pending = await Database.getOne("SELECT COUNT(*) as count FROM supply_orders WHERE status = 'pending'");
  const assigned = await Database.getOne("SELECT COUNT(*) as count FROM supply_orders WHERE status = 'assigned'");
  const delivering = await Database.getOne("SELECT COUNT(*) as count FROM supply_orders WHERE status = 'delivering'");
  const completed = await Database.getOne("SELECT COUNT(*) as count FROM supply_orders WHERE status = 'completed'");
  
  ctx.body = {
    code: 200,
    data: {
      pending: pending.count,
      assigned: assigned.count,
      delivering: delivering.count,
      completed: completed.count
    }
  };
});

router.get('/:id', async ctx => {
  const order = await Database.getOne(
    `SELECT so.*, t.name as toilet_name, u1.real_name as assigned_name, u2.real_name as creator_name
     FROM supply_orders so 
     LEFT JOIN toilets t ON so.toilet_id = t.id
     LEFT JOIN users u1 ON so.assigned_to = u1.id
     LEFT JOIN users u2 ON so.created_by = u2.id
     WHERE so.id = ?`,
    [ctx.params.id]
  );
  ctx.body = { code: 200, data: order };
});

router.post('/', async ctx => {
  const data = ctx.request.body;
  data.order_no = data.order_no || 'SP' + Date.now() + Math.floor(Math.random() * 1000);
  data.order_type = data.order_type || 'manual';
  data.created_by = ctx.state.user.id;
  const id = await Database.insert('supply_orders', data);
  ctx.body = { code: 200, message: '补给单创建成功', data: { id } };
});

router.put('/:id', async ctx => {
  const data = ctx.request.body;
  await Database.update('supply_orders', data, 'id = ?', [ctx.params.id]);
  ctx.body = { code: 200, message: '更新成功' };
});

router.post('/:id/assign', roleMiddleware(['supervisor', 'admin']), async ctx => {
  const { assigned_to } = ctx.request.body;
  await Database.update(
    'supply_orders',
    { status: 'assigned', assigned_to, assigned_at: new Date() },
    'id = ?',
    [ctx.params.id]
  );
  ctx.body = { code: 200, message: '派发成功' };
});

router.post('/:id/complete', async ctx => {
  const order = await Database.getOne('SELECT * FROM supply_orders WHERE id = ?', [ctx.params.id]);
  if (!order) {
    ctx.status = 404;
    ctx.body = { code: 404, message: '补给单不存在' };
    return;
  }
  
  await Database.transaction(async (conn) => {
    await conn.execute(
      'UPDATE supply_orders SET status = ?, completed_at = NOW() WHERE id = ?',
      ['completed', ctx.params.id]
    );
    
    if (order.toilet_paper_qty > 0 || order.hand_sanitizer_qty > 0) {
      const toilet = await conn.execute('SELECT * FROM toilets WHERE id = ?', [order.toilet_id]);
      const currentToilet = toilet[0][0];
      const newToiletPaper = (currentToilet.toilet_paper_stock || 0) + (order.toilet_paper_qty || 0);
      const newHandSanitizer = (currentToilet.hand_sanitizer_stock || 0) + (order.hand_sanitizer_qty || 0);
      await conn.execute(
        'UPDATE toilets SET toilet_paper_stock = ?, hand_sanitizer_stock = ? WHERE id = ?',
        [newToiletPaper, newHandSanitizer, order.toilet_id]
      );
    }
  });
  
  ctx.body = { code: 200, message: '补给完成，库存已更新' };
});

router.delete('/:id', async ctx => {
  await Database.delete('supply_orders', 'id = ?', [ctx.params.id]);
  ctx.body = { code: 200, message: '删除成功' };
});

router.post('/check-stock', roleMiddleware(['supervisor', 'admin']), async ctx => {
  const count = await supplyService.checkAllToiletsStock();
  ctx.body = { code: 200, message: `检查完成，处理了 ${count} 个低库存公厕` };
});

module.exports = router;
