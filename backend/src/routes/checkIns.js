const Router = require('koa-router');
const Database = require('../models/db');
const { authMiddleware } = require('../middleware/auth');
const supplyService = require('../services/supplyService');

const router = new Router();

router.use(authMiddleware);

router.get('/', async ctx => {
  const { page = 1, pageSize = 10, toilet_id, cleaner_id, schedule_id, start_time, end_time } = ctx.query;
  const offset = (page - 1) * pageSize;
  
  let where = 'WHERE 1=1';
  const params = [];
  
  if (toilet_id) {
    where += ' AND c.toilet_id = ?';
    params.push(toilet_id);
  }
  if (cleaner_id) {
    where += ' AND c.cleaner_id = ?';
    params.push(cleaner_id);
  }
  if (schedule_id) {
    where += ' AND c.schedule_id = ?';
    params.push(schedule_id);
  }
  if (start_time) {
    where += ' AND c.check_in_time >= ?';
    params.push(start_time);
  }
  if (end_time) {
    where += ' AND c.check_in_time <= ?';
    params.push(end_time);
  }

  const checkIns = await Database.query(
    `SELECT c.*, t.name as toilet_name, u.real_name as cleaner_name
     FROM check_ins c 
     LEFT JOIN toilets t ON c.toilet_id = t.id
     LEFT JOIN users u ON c.cleaner_id = u.id
     ${where} ORDER BY c.check_in_time DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize), parseInt(offset)]
  );

  const total = await Database.getOne(`SELECT COUNT(*) as count FROM check_ins c ${where}`, params);

  ctx.body = {
    code: 200,
    data: {
      list: checkIns,
      total: total.count,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }
  };
});

router.get('/:id', async ctx => {
  const checkIn = await Database.getOne(
    `SELECT c.*, t.name as toilet_name, u.real_name as cleaner_name
     FROM check_ins c 
     LEFT JOIN toilets t ON c.toilet_id = t.id
     LEFT JOIN users u ON c.cleaner_id = u.id
     WHERE c.id = ?`,
    [ctx.params.id]
  );
  ctx.body = { code: 200, data: checkIn };
});

router.post('/', async ctx => {
  const data = ctx.request.body;
  const { id, supply_status } = data;
  const checkInId = await Database.insert('check_ins', data);
  
  if (data.schedule_id) {
    await Database.update('schedules', { status: 'completed' }, 'id = ?', [data.schedule_id]);
  }
  
  if (supply_status) {
    const supplyData = typeof supply_status === 'string' ? JSON.parse(supply_status) : supply_status;
    if (supplyData.toilet_paper_low || supplyData.hand_sanitizer_low) {
      await supplyService.checkAndGenerateSupplyOrder(data.toilet_id);
    }
  }
  
  ctx.body = { code: 200, message: '打卡成功', data: { id: checkInId } };
});

module.exports = router;
