const Router = require('koa-router');
const Database = require('../models/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const alertService = require('../services/alertService');

const router = new Router();

router.use(authMiddleware);

router.get('/', async ctx => {
  const { page = 1, pageSize = 10, alert_type, toilet_id, status, level } = ctx.query;
  const offset = (page - 1) * pageSize;
  
  let where = 'WHERE 1=1';
  const params = [];
  
  if (alert_type) {
    where += ' AND a.alert_type = ?';
    params.push(alert_type);
  }
  if (toilet_id) {
    where += ' AND a.toilet_id = ?';
    params.push(toilet_id);
  }
  if (status) {
    where += ' AND a.status = ?';
    params.push(status);
  }
  if (level) {
    where += ' AND a.level = ?';
    params.push(level);
  }

  const alerts = await Database.query(
    `SELECT a.*, t.name as toilet_name, t.code as toilet_code, u.real_name as handler_name
     FROM alerts a 
     LEFT JOIN toilets t ON a.toilet_id = t.id
     LEFT JOIN users u ON a.handled_by = u.id
     ${where} ORDER BY a.created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize), parseInt(offset)]
  );

  const total = await Database.getOne(`SELECT COUNT(*) as count FROM alerts a ${where}`, params);

  ctx.body = {
    code: 200,
    data: {
      list: alerts,
      total: total.count,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }
  };
});

router.get('/summary', async ctx => {
  const summary = await alertService.getActiveAlertsSummary();
  ctx.body = { code: 200, data: summary };
});

router.get('/:id', async ctx => {
  const alert = await Database.getOne(
    `SELECT a.*, t.name as toilet_name, u.real_name as handler_name
     FROM alerts a 
     LEFT JOIN toilets t ON a.toilet_id = t.id
     LEFT JOIN users u ON a.handled_by = u.id
     WHERE a.id = ?`,
    [ctx.params.id]
  );
  ctx.body = { code: 200, data: alert };
});

router.put('/:id/handle', roleMiddleware(['supervisor', 'admin']), async ctx => {
  const { handle_remark } = ctx.request.body;
  await Database.update(
    'alerts',
    { status: 'handled', handled_by: ctx.state.user.id, handled_at: new Date(), handle_remark },
    'id = ?',
    [ctx.params.id]
  );
  ctx.body = { code: 200, message: '预警已处理' };
});

router.put('/:id/ignore', roleMiddleware(['supervisor', 'admin']), async ctx => {
  const { handle_remark } = ctx.request.body;
  await Database.update(
    'alerts',
    { status: 'ignored', handled_by: ctx.state.user.id, handled_at: new Date(), handle_remark },
    'id = ?',
    [ctx.params.id]
  );
  ctx.body = { code: 200, message: '预警已忽略' };
});

router.post('/check', roleMiddleware(['supervisor', 'admin']), async ctx => {
  await alertService.checkAndGenerateAlerts();
  ctx.body = { code: 200, message: '预警检查完成' };
});

module.exports = router;
