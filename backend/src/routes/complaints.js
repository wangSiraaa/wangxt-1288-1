const Router = require('koa-router');
const Database = require('../models/db');
const { authMiddleware } = require('../middleware/auth');

const router = new Router();

router.use(authMiddleware);

router.get('/', async ctx => {
  const { page = 1, pageSize = 10, toilet_id, status, source, priority, keyword, handler_id, start_date, end_date } = ctx.query;
  const offset = (page - 1) * pageSize;
  
  let where = 'WHERE 1=1';
  const params = [];
  
  if (toilet_id) {
    where += ' AND c.toilet_id = ?';
    params.push(toilet_id);
  }
  if (status) {
    where += ' AND c.status = ?';
    params.push(status);
  }
  if (source) {
    where += ' AND c.source = ?';
    params.push(source);
  }
  if (priority) {
    where += ' AND c.priority = ?';
    params.push(priority);
  }
  if (handler_id) {
    where += ' AND c.handler_id = ?';
    params.push(handler_id);
  }
  if (keyword) {
    where += ' AND (c.complaint_no LIKE ? OR c.title LIKE ? OR c.content LIKE ? OR c.complainant_name LIKE ? OR c.complainant_phone LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  if (start_date) {
    where += ' AND c.created_at >= ?';
    params.push(start_date);
  }
  if (end_date) {
    where += ' AND c.created_at <= ?';
    params.push(end_date);
  }

  const complaints = await Database.query(
    `SELECT c.*, t.name as toilet_name, t.code as toilet_code, t.address as toilet_address,
            u1.real_name as handler_name, u2.real_name as hotline_name,
            (SELECT COUNT(*) FROM complaint_reviews cr WHERE cr.complaint_id = c.id) as review_count
     FROM complaints c 
     LEFT JOIN toilets t ON c.toilet_id = t.id
     LEFT JOIN users u1 ON c.handler_id = u1.id
     LEFT JOIN users u2 ON c.hotline_id = u2.id
     ${where} ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
    [...params, parseInt(pageSize), parseInt(offset)]
  );

  const total = await Database.getOne(`SELECT COUNT(*) as count FROM complaints c ${where}`, params);

  ctx.body = {
    code: 200,
    data: {
      list: complaints,
      total: total.count,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    }
  };
});

router.get('/stats', async ctx => {
  const pending = await Database.getOne("SELECT COUNT(*) as count FROM complaints WHERE status = 'pending'");
  const processing = await Database.getOne("SELECT COUNT(*) as count FROM complaints WHERE status = 'processing'");
  const reviewing = await Database.getOne("SELECT COUNT(*) as count FROM complaints WHERE status = 'reviewing'");
  const closed = await Database.getOne("SELECT COUNT(*) as count FROM complaints WHERE status = 'closed'");
  const today = await Database.getOne("SELECT COUNT(*) as count FROM complaints WHERE DATE(created_at) = CURDATE()");
  
  ctx.body = {
    code: 200,
    data: {
      pending: pending.count,
      processing: processing.count,
      reviewing: reviewing.count,
      closed: closed.count,
      today: today.count
    }
  };
});

router.get('/:id', async ctx => {
  const complaint = await Database.getOne(
    `SELECT c.*, t.name as toilet_name, u1.real_name as handler_name, u2.real_name as hotline_name
     FROM complaints c 
     LEFT JOIN toilets t ON c.toilet_id = t.id
     LEFT JOIN users u1 ON c.handler_id = u1.id
     LEFT JOIN users u2 ON c.hotline_id = u2.id
     WHERE c.id = ?`,
    [ctx.params.id]
  );
  
  if (complaint) {
    const reviews = await Database.query(
      `SELECT cr.*, u.real_name as reviewer_name 
       FROM complaint_reviews cr 
       LEFT JOIN users u ON cr.reviewer_id = u.id
       WHERE cr.complaint_id = ? ORDER BY cr.review_time DESC`,
      [ctx.params.id]
    );
    complaint.reviews = reviews;
  }
  
  ctx.body = { code: 200, data: complaint };
});

router.post('/', async ctx => {
  const data = ctx.request.body;
  data.complaint_no = data.complaint_no || 'CP' + Date.now() + Math.floor(Math.random() * 1000);
  data.hotline_id = data.hotline_id || ctx.state.user.id;
  const id = await Database.insert('complaints', data);
  ctx.body = { code: 200, message: '投诉创建成功', data: { id } };
});

router.put('/:id', async ctx => {
  await Database.update('complaints', ctx.request.body, 'id = ?', [ctx.params.id]);
  ctx.body = { code: 200, message: '更新成功' };
});

router.post('/:id/assign', async ctx => {
  const { handler_id } = ctx.request.body;
  await Database.update(
    'complaints',
    { status: 'processing', handler_id },
    'id = ?',
    [ctx.params.id]
  );
  ctx.body = { code: 200, message: '分派成功' };
});

router.post('/:id/review', async ctx => {
  const { review_result, review_content, photo_urls, longitude, latitude } = ctx.request.body;
  
  if (!review_result || !review_content) {
    ctx.status = 400;
    ctx.body = { code: 400, message: '复查结果和内容不能为空' };
    return;
  }
  
  await Database.insert('complaint_reviews', {
    complaint_id: ctx.params.id,
    reviewer_id: ctx.state.user.id,
    review_time: new Date(),
    review_result,
    review_content,
    photo_urls: photo_urls ? JSON.stringify(photo_urls) : null,
    longitude,
    latitude
  });
  
  if (review_result === 'passed') {
    await Database.update('complaints', { status: 'reviewing' }, 'id = ?', [ctx.params.id]);
  }
  
  ctx.body = { code: 200, message: '复查记录保存成功' };
});

router.post('/:id/close', async ctx => {
  const complaint = await Database.getOne('SELECT * FROM complaints WHERE id = ?', [ctx.params.id]);
  
  if (!complaint) {
    ctx.status = 404;
    ctx.body = { code: 404, message: '投诉不存在' };
    return;
  }
  
  const reviewCount = await Database.getOne(
    'SELECT COUNT(*) as count FROM complaint_reviews WHERE complaint_id = ?',
    [ctx.params.id]
  );
  
  if (reviewCount.count < 1) {
    ctx.status = 400;
    ctx.body = { code: 400, message: '投诉关闭前必须至少关联一次复查记录' };
    return;
  }
  
  const passedReview = await Database.getOne(
    "SELECT * FROM complaint_reviews WHERE complaint_id = ? AND review_result = 'passed' ORDER BY review_time DESC LIMIT 1",
    [ctx.params.id]
  );
  
  if (!passedReview) {
    ctx.status = 400;
    ctx.body = { code: 400, message: '必须有至少一次复查通过才能关闭投诉' };
    return;
  }
  
  await Database.update(
    'complaints',
    { status: 'closed', closed_at: new Date() },
    'id = ?',
    [ctx.params.id]
  );
  
  ctx.body = { code: 200, message: '投诉已关闭' };
});

router.delete('/:id', async ctx => {
  await Database.delete('complaint_reviews', 'complaint_id = ?', [ctx.params.id]);
  await Database.delete('complaints', 'id = ?', [ctx.params.id]);
  ctx.body = { code: 200, message: '删除成功' };
});

module.exports = router;
