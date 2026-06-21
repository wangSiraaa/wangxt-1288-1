const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const cors = require('koa-cors');
const config = require('./config');

const authRoutes = require('./routes/auth');
const toiletRoutes = require('./routes/toilets');
const scheduleRoutes = require('./routes/schedules');
const checkInRoutes = require('./routes/checkIns');
const supplyRoutes = require('./routes/supplies');
const repairRoutes = require('./routes/repairs');
const complaintRoutes = require('./routes/complaints');
const alertRoutes = require('./routes/alerts');
const userRoutes = require('./routes/users');
const areaRoutes = require('./routes/areas');
const alertService = require('./services/alertService');

const app = new Koa();
const router = new Router({ prefix: '/api' });

app.use(cors());
app.use(bodyParser({ jsonLimit: '10mb' }));

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    console.error('Server Error:', error);
    ctx.status = error.status || 500;
    ctx.body = {
      code: ctx.status,
      message: error.message || '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
});

router.use('/auth', authRoutes.routes());
router.use('/toilets', toiletRoutes.routes());
router.use('/schedules', scheduleRoutes.routes());
router.use('/check-ins', checkInRoutes.routes());
router.use('/supplies', supplyRoutes.routes());
router.use('/repairs', repairRoutes.routes());
router.use('/complaints', complaintRoutes.routes());
router.use('/alerts', alertRoutes.routes());
router.use('/users', userRoutes.routes());
router.use('/areas', areaRoutes.routes());

app.use(router.routes());
app.use(router.allowedMethods());

router.get('/health', ctx => {
  ctx.body = { code: 200, message: '服务运行正常', timestamp: new Date().toISOString() };
});

setInterval(() => {
  alertService.checkAndGenerateAlerts().catch(err => {
    console.error('预警检查失败:', err);
  });
}, 60 * 1000);

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`环卫公厕巡检系统后端服务已启动: http://localhost:${PORT}`);
});
