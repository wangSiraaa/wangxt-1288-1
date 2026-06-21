const Router = require('koa-router');
const Database = require('../models/db');
const { authMiddleware } = require('../middleware/auth');
const supplyService = require('../services/supplyService');

const router = new Router();

router.use(authMiddleware);

router.get('/', async ctx => {
  const { page = 1, pageSize = 10, keyword, area_id, status, level } = ctx.query;
  const offset = (page - 1) * pageSize;
  
  let where = 'WHERE 1=1';
  const params = [];
  
  if (area_id) {
    where += ' AND t.area_id = ?';
    params.push(area_id);
  }
  if (status) {
    where += ' AND t.status = ?';
    params.push(status);
  }
  if (level) {
    where += ' AND t.level = ?';
    params.push(level);
  }
  if (keyword) {
    where += ' AND (t.code LIKE ? OR t.name LIKE ? OR t.address LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  const toilets = await Database.query(
    `SELECT t.*, a.name as area_name, 
     CASE WHEN t.toilet_paper_stock <= t.toilet_paper_threshold THEN 1 ELSE 0 END as toilet_paper_low,
     CASE WHEN t.hand_sanitizer_stock <= t.hand_sanitizer_threshold THEN 1 ELSE 0 END as hand_sanitizer_low
     FROM toilets t LEFT JOIN areas a ON t.area_id = a.id 
     ${where} ORDER BY t.id DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize), parseInt(offset)]
  );

  const total = await Database.getOne(`SELECT COUNT(*) as count FROM toilets t ${where}`, params);

  ctx.body = {
    code: 200,
    data: {
      list: toilets,
      total: total.count,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }
  };
});

router.get('/stats', async ctx => {
  const total = await Database.getOne('SELECT COUNT(*) as count FROM toilets');
  const normal = await Database.getOne("SELECT COUNT(*) as count FROM toilets WHERE status = 'normal'");
  const lowStock = await Database.query(
    `SELECT id, code, name, toilet_paper_stock, toilet_paper_threshold, hand_sanitizer_stock, hand_sanitizer_threshold 
     FROM toilets 
     WHERE toilet_paper_stock <= toilet_paper_threshold OR hand_sanitizer_stock <= hand_sanitizer_threshold 
     LIMIT 10`
  );
  ctx.body = {
    code: 200,
    data: {
      total: total.count,
      normal: normal.count,
      lowStock: lowStock
    }
  };
});

router.get('/:id', async ctx => {
  const toilet = await Database.getOne(
    'SELECT t.*, a.name as area_name FROM toilets t LEFT JOIN areas a ON t.area_id = a.id WHERE t.id = ?',
    [ctx.params.id]
  );
  ctx.body = { code: 200, data: toilet };
});

router.post('/', async ctx => {
  const id = await Database.insert('toilets', ctx.request.body);
  ctx.body = { code: 200, message: '创建成功', data: { id } };
});

router.put('/:id', async ctx => {
  const data = ctx.request.body;
  const oldToilet = await Database.getOne('SELECT * FROM toilets WHERE id = ?', [ctx.params.id]);
  await Database.update('toilets', data, 'id = ?', [ctx.params.id]);
  await supplyService.checkAndGenerateSupplyOrder(ctx.params.id, oldToilet, data);
  ctx.body = { code: 200, message: '更新成功' };
});

router.delete('/:id', async ctx => {
  await Database.delete('toilets', 'id = ?', [ctx.params.id]);
  ctx.body = { code: 200, message: '删除成功' };
});

router.put('/:id/stock', async ctx => {
  const { toilet_paper_stock, hand_sanitizer_stock } = ctx.request.body;
  const oldToilet = await Database.getOne('SELECT * FROM toilets WHERE id = ?', [ctx.params.id]);
  const data = {};
  if (toilet_paper_stock !== undefined) data.toilet_paper_stock = toilet_paper_stock;
  if (hand_sanitizer_stock !== undefined) data.hand_sanitizer_stock = hand_sanitizer_stock;
  await Database.update('toilets', data, 'id = ?', [ctx.params.id]);
  const newData = { ...oldToilet, ...data };
  await supplyService.checkAndGenerateSupplyOrder(ctx.params.id, oldToilet, newData);
  ctx.body = { code: 200, message: '库存更新成功' };
});

module.exports = router;
