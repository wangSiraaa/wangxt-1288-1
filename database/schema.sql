-- 环卫公厕巡检系统数据库
CREATE DATABASE IF NOT EXISTS toilet_inspection DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE toilet_inspection;

-- 用户表（保洁员、片区主管、热线人员）
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE COMMENT '登录账号',
  password VARCHAR(255) NOT NULL COMMENT '密码',
  real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
  phone VARCHAR(20) COMMENT '手机号',
  role ENUM('cleaner', 'supervisor', 'hotline', 'admin') NOT NULL DEFAULT 'cleaner' COMMENT '角色',
  area_id INT COMMENT '负责片区ID',
  status TINYINT DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role (role),
  INDEX idx_area (area_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 片区表
CREATE TABLE IF NOT EXISTS areas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL COMMENT '片区名称',
  description VARCHAR(500) COMMENT '片区描述',
  supervisor_id INT COMMENT '片区主管ID',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supervisor_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='片区表';

-- 公厕表
CREATE TABLE IF NOT EXISTS toilets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL UNIQUE COMMENT '公厕编号',
  name VARCHAR(100) NOT NULL COMMENT '公厕名称',
  address VARCHAR(500) NOT NULL COMMENT '地址',
  area_id INT NOT NULL COMMENT '所属片区',
  longitude DECIMAL(10, 7) COMMENT '经度',
  latitude DECIMAL(10, 7) COMMENT '纬度',
  level ENUM('A', 'B', 'C') DEFAULT 'B' COMMENT '公厕等级',
  opening_hours VARCHAR(100) COMMENT '开放时间',
  status ENUM('normal', 'closed', 'maintenance') DEFAULT 'normal' COMMENT '状态',
  toilet_paper_stock INT DEFAULT 0 COMMENT '厕纸库存（包）',
  toilet_paper_threshold INT DEFAULT 10 COMMENT '厕纸预警阈值',
  hand_sanitizer_stock INT DEFAULT 0 COMMENT '洗手液库存（瓶）',
  hand_sanitizer_threshold INT DEFAULT 5 COMMENT '洗手液预警阈值',
  peak_start_time TIME DEFAULT '07:00:00' COMMENT '高峰开始时间',
  peak_end_time TIME DEFAULT '09:00:00' COMMENT '高峰结束时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_area (area_id),
  INDEX idx_status (status),
  FOREIGN KEY (area_id) REFERENCES areas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='公厕表';

-- 保洁排班表
CREATE TABLE IF NOT EXISTS schedules (
  id INT PRIMARY KEY AUTO_INCREMENT,
  toilet_id INT NOT NULL COMMENT '公厕ID',
  cleaner_id INT NOT NULL COMMENT '保洁员ID',
  schedule_date DATE NOT NULL COMMENT '排班日期',
  shift_start TIME NOT NULL COMMENT '上班时间',
  shift_end TIME NOT NULL COMMENT '下班时间',
  shift_type ENUM('morning', 'afternoon', 'night', 'all') DEFAULT 'morning' COMMENT '班次',
  status ENUM('scheduled', 'completed', 'absent') DEFAULT 'scheduled' COMMENT '状态',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_toilet_date (toilet_id, schedule_date),
  INDEX idx_cleaner_date (cleaner_id, schedule_date),
  FOREIGN KEY (toilet_id) REFERENCES toilets(id),
  FOREIGN KEY (cleaner_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='保洁排班表';

-- 打卡记录表
CREATE TABLE IF NOT EXISTS check_ins (
  id INT PRIMARY KEY AUTO_INCREMENT,
  schedule_id INT NOT NULL COMMENT '排班ID',
  toilet_id INT NOT NULL COMMENT '公厕ID',
  cleaner_id INT NOT NULL COMMENT '保洁员ID',
  check_in_time DATETIME NOT NULL COMMENT '打卡时间',
  check_in_type ENUM('on_duty', 'off_duty', 'patrol') DEFAULT 'on_duty' COMMENT '打卡类型',
  longitude DECIMAL(10, 7) COMMENT '打卡经度',
  latitude DECIMAL(10, 7) COMMENT '打卡纬度',
  photo_url VARCHAR(500) COMMENT '现场照片URL',
  status_remark VARCHAR(500) COMMENT '现场状态备注',
  cleanliness_score INT COMMENT '清洁评分（1-5）',
  equipment_status JSON COMMENT '设备状态',
  supply_status JSON COMMENT '耗材状态',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_schedule (schedule_id),
  INDEX idx_toilet_time (toilet_id, check_in_time),
  INDEX idx_cleaner_time (cleaner_id, check_in_time),
  FOREIGN KEY (schedule_id) REFERENCES schedules(id),
  FOREIGN KEY (toilet_id) REFERENCES toilets(id),
  FOREIGN KEY (cleaner_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='打卡记录表';

-- 耗材补给单表
CREATE TABLE IF NOT EXISTS supply_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_no VARCHAR(50) NOT NULL UNIQUE COMMENT '补给单号',
  toilet_id INT NOT NULL COMMENT '公厕ID',
  order_type ENUM('auto', 'manual') DEFAULT 'auto' COMMENT '生成方式',
  status ENUM('pending', 'assigned', 'delivering', 'completed', 'cancelled') DEFAULT 'pending' COMMENT '状态',
  toilet_paper_qty INT DEFAULT 0 COMMENT '厕纸数量',
  hand_sanitizer_qty INT DEFAULT 0 COMMENT '洗手液数量',
  remark VARCHAR(500) COMMENT '备注',
  assigned_to INT COMMENT '派发人员ID',
  assigned_at DATETIME COMMENT '派发时间',
  completed_at DATETIME COMMENT '完成时间',
  created_by INT COMMENT '创建人',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_toilet (toilet_id),
  INDEX idx_status (status),
  INDEX idx_assigned (assigned_to),
  FOREIGN KEY (toilet_id) REFERENCES toilets(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='耗材补给单表';

-- 维修工单表
CREATE TABLE IF NOT EXISTS repair_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_no VARCHAR(50) NOT NULL UNIQUE COMMENT '维修单号',
  toilet_id INT NOT NULL COMMENT '公厕ID',
  equipment_name VARCHAR(100) NOT NULL COMMENT '设备名称',
  fault_description VARCHAR(500) NOT NULL COMMENT '故障描述',
  fault_level ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium' COMMENT '故障级别',
  status ENUM('pending', 'assigned', 'repairing', 'completed', 'cancelled') DEFAULT 'pending' COMMENT '状态',
  photo_url VARCHAR(500) COMMENT '故障照片URL',
  reporter_id INT COMMENT '报修人ID',
  assigned_to INT COMMENT '维修人员ID',
  assigned_at DATETIME COMMENT '派发时间',
  completed_at DATETIME COMMENT '完成时间',
  repair_result VARCHAR(500) COMMENT '维修结果',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_toilet (toilet_id),
  INDEX idx_status (status),
  INDEX idx_assigned (assigned_to),
  FOREIGN KEY (toilet_id) REFERENCES toilets(id),
  FOREIGN KEY (reporter_id) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='维修工单表';

-- 投诉记录表
CREATE TABLE IF NOT EXISTS complaints (
  id INT PRIMARY KEY AUTO_INCREMENT,
  complaint_no VARCHAR(50) NOT NULL UNIQUE COMMENT '投诉编号',
  toilet_id INT NOT NULL COMMENT '公厕ID',
  source ENUM('hotline', 'online', 'onsite', 'other') DEFAULT 'hotline' COMMENT '投诉来源',
  category VARCHAR(100) COMMENT '投诉类型',
  title VARCHAR(200) NOT NULL COMMENT '投诉标题',
  content TEXT NOT NULL COMMENT '投诉内容',
  complainant_name VARCHAR(50) COMMENT '投诉人姓名',
  complainant_phone VARCHAR(20) COMMENT '投诉人电话',
  status ENUM('pending', 'processing', 'reviewing', 'closed') DEFAULT 'pending' COMMENT '状态',
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium' COMMENT '优先级',
  handler_id INT COMMENT '处理人ID',
  hotline_id INT COMMENT '热线人员ID',
  linked_complaint_id INT COMMENT '关联投诉ID',
  closed_at DATETIME COMMENT '关闭时间',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_toilet (toilet_id),
  INDEX idx_status (status),
  INDEX idx_handler (handler_id),
  INDEX idx_hotline (hotline_id),
  FOREIGN KEY (toilet_id) REFERENCES toilets(id),
  FOREIGN KEY (handler_id) REFERENCES users(id),
  FOREIGN KEY (hotline_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='投诉记录表';

-- 投诉复查记录表
CREATE TABLE IF NOT EXISTS complaint_reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  complaint_id INT NOT NULL COMMENT '投诉ID',
  reviewer_id INT NOT NULL COMMENT '复查人ID',
  review_time DATETIME NOT NULL COMMENT '复查时间',
  review_result ENUM('passed', 'failed', 'recheck') NOT NULL COMMENT '复查结果',
  review_content TEXT NOT NULL COMMENT '复查内容',
  photo_urls JSON COMMENT '复查照片',
  longitude DECIMAL(10, 7) COMMENT '复查经度',
  latitude DECIMAL(10, 7) COMMENT '复查纬度',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_complaint (complaint_id),
  INDEX idx_reviewer (reviewer_id),
  FOREIGN KEY (complaint_id) REFERENCES complaints(id),
  FOREIGN KEY (reviewer_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='投诉复查记录表';

-- 预警记录表
CREATE TABLE IF NOT EXISTS alerts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  alert_type ENUM('absent', 'low_stock', 'complaint_overdue') NOT NULL COMMENT '预警类型',
  toilet_id INT COMMENT '公厕ID',
  schedule_id INT COMMENT '排班ID（缺岗预警）',
  title VARCHAR(200) NOT NULL COMMENT '预警标题',
  content VARCHAR(500) NOT NULL COMMENT '预警内容',
  level ENUM('info', 'warning', 'danger') DEFAULT 'warning' COMMENT '预警级别',
  status ENUM('active', 'handled', 'ignored') DEFAULT 'active' COMMENT '状态',
  handled_by INT COMMENT '处理人ID',
  handled_at DATETIME COMMENT '处理时间',
  handle_remark VARCHAR(500) COMMENT '处理备注',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type (alert_type),
  INDEX idx_toilet (toilet_id),
  INDEX idx_status (status),
  FOREIGN KEY (toilet_id) REFERENCES toilets(id),
  FOREIGN KEY (handled_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预警记录表';

-- 初始化数据
INSERT INTO users (username, password, real_name, phone, role, status) VALUES
('admin', '123456', '系统管理员', '13800000000', 'admin', 1),
('supervisor01', '123456', '张主管', '13800000001', 'supervisor', 1),
('hotline01', '123456', '李热线', '13800000002', 'hotline', 1),
('cleaner01', '123456', '王保洁', '13800000003', 'cleaner', 1),
('cleaner02', '123456', '赵保洁', '13800000004', 'cleaner', 1),
('cleaner03', '123456', '钱保洁', '13800000005', 'cleaner', 1);

INSERT INTO areas (name, description, supervisor_id) VALUES
('东城区', '包含城东所有公厕', 2),
('西城区', '包含城西所有公厕', 2),
('南城区', '包含城南所有公厕', 2);

INSERT INTO toilets (code, name, address, area_id, longitude, latitude, level, toilet_paper_stock, toilet_paper_threshold, hand_sanitizer_stock, hand_sanitizer_threshold) VALUES
('TC-001', '人民公园公厕', '人民公园东门', 1, 116.4074, 39.9042, 'A', 15, 10, 8, 5),
('TC-002', '解放路公厕', '解放路128号', 1, 116.4174, 39.9142, 'B', 5, 10, 3, 5),
('TC-003', '中心广场公厕', '中心广场南侧', 2, 116.3974, 39.9042, 'A', 20, 10, 10, 5),
('TC-004', '火车站公厕', '火车站出站口', 2, 116.3874, 39.8942, 'A', 8, 10, 2, 5),
('TC-005', '文化街公厕', '文化街56号', 3, 116.4074, 39.8942, 'B', 12, 10, 6, 5);
