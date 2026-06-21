const Router = require('koa-router');
const Database = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = new Router();

router.use(authMiddleware);

router.get('/', async ctx => {
  const { page = 1, pageSize = 10, toilet_id, cleaner_id, schedule_date, start_date, end_date, status } = ctx.query;
  const offset = (page - 1) * pageSize;
  
  let where = 'WHERE 1=1';
  const params = [];
  
  if (toilet_id) {
    where += ' AND s.toilet_id = ?';
    params.push(toilet_id);
  }
  if (cleaner_id) {
    where += ' AND s.cleaner_id = ?';
    params.push(cleaner_id);
  }
  if (schedule_date) {
    where += ' AND s.schedule_date = ?';
    params.push(schedule_date);
  }
  if (start_date) {
    where += ' AND s.schedule_date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    where += ' AND s.schedule_date <= ?';
    params.push(end_date);
  }
  if (status) {
    where += ' AND s.status = ?';
    params.push(status);
  }

  const schedules = await Database.query(
    `SELECT s.*, t.name as toilet_name, t.code as toilet_code, t.address as toilet_address,
            u.real_name as cleaner_name, u.phone as cleaner_phone
     FROM schedules s 
     LEFT JOIN toilets t ON s.toilet_id = t.id
     LEFT JOIN users u ON s.cleaner_id = u.id
     ${where} ORDER BY s.schedule_date DESC, s.shift_start LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize), parseInt(offset)]
  );

  const total = await Database.getOne(`SELECT COUNT(*) as count FROM schedules s ${where}`, params);

  ctx.body = {
    code: 200,
    data: {
      list: schedules,
      total: total.count,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }
  };
});

router.get('/:id', async ctx => {
  const schedule = await Database.getOne(
    `SELECT s.*, t.name as toilet_name, u.real_name as cleaner_name 
     FROM schedules s 
     LEFT JOIN toilets t ON s.toilet_id = t.id
     LEFT JOIN users u ON s.cleaner_id = u.id
     WHERE s.id = ?`,
    [ctx.params.id]
  );
  ctx.body = { code: 200, data: schedule };
});

router.post('/', async ctx => {
  const data = ctx.request.body;
  const id = await Database.insert('schedules', data);
  ctx.body = { code: 200, message: '排班创建成功', data: { id } };
});

router.post('/batch', async ctx => {
  const { schedules } = ctx.request.body;
  const ids = [];
  for (const schedule of schedules) {
    const id = await Database.insert('schedules', schedule);
    ids.push(id);
  }
  ctx.body = { code: 200, message: '批量排班成功', data: { ids } };
});

router.put('/:id', async ctx => {
  await Database.update('schedules', ctx.request.body, 'id = ?', [ctx.params.id]);
  ctx.body = { code: 200, message: '更新成功' };
});

router.delete('/:id', async ctx => {
  await Database.delete('schedules', 'id = ?', [ctx.params.id]);
  ctx.body = { code: 200, message: '删除成功' };
});

module.exports = router;
