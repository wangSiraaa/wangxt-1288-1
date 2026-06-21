const Database = require('../models/db');
const dayjs = require('dayjs');

class AlertService {
  async checkAndGenerateAlerts() {
    await this.checkPeakAbsentAlerts();
    await this.checkComplaintOverdueAlerts();
  }

  async checkPeakAbsentAlerts() {
    const now = dayjs();
    const today = now.format('YYYY-MM-DD');
    const currentTime = now.format('HH:mm:ss');

    const peakSchedules = await Database.query(
      `SELECT s.*, t.name as toilet_name, t.peak_start_time, t.peak_end_time, u.real_name as cleaner_name
       FROM schedules s 
       LEFT JOIN toilets t ON s.toilet_id = t.id
       LEFT JOIN users u ON s.cleaner_id = u.id
       WHERE s.schedule_date = ? AND s.status = 'scheduled'
       AND s.shift_start <= t.peak_end_time AND s.shift_end >= t.peak_start_time
       AND ? >= ADDTIME(s.shift_start, '00:15:00')
       AND ? <= t.peak_end_time`,
      [today, currentTime, currentTime]
    );

    for (const schedule of peakSchedules) {
      const hasCheckIn = await Database.getOne(
        `SELECT * FROM check_ins 
         WHERE schedule_id = ? AND check_in_type = 'on_duty' 
         AND DATE(check_in_time) = ?`,
        [schedule.id, today]
      );

      if (!hasCheckIn) {
        const existingAlert = await Database.getOne(
          `SELECT * FROM alerts 
           WHERE alert_type = 'absent' AND schedule_id = ? AND status = 'active' 
           AND DATE(created_at) = ?`,
          [schedule.id, today]
        );

        if (!existingAlert) {
          await Database.insert('alerts', {
            alert_type: 'absent',
            toilet_id: schedule.toilet_id,
            schedule_id: schedule.id,
            title: '高峰时段缺岗预警',
            content: `${schedule.toilet_name} 高峰时段缺岗：保洁员 ${schedule.cleaner_name} 未按时打卡，排班时间 ${schedule.shift_start} - ${schedule.shift_end}`,
            level: 'danger',
            status: 'active'
          });
        }
      }
    }
  }

  async checkComplaintOverdueAlerts() {
    const overdueComplaints = await Database.query(
      `SELECT c.*, t.name as toilet_name 
       FROM complaints c 
       LEFT JOIN toilets t ON c.toilet_id = t.id
       WHERE c.status IN ('pending', 'processing') 
       AND c.created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)`
    );

    for (const complaint of overdueComplaints) {
      const existingAlert = await Database.getOne(
        "SELECT * FROM alerts WHERE alert_type = 'complaint_overdue' AND title LIKE ? AND status = 'active'",
        [`%${complaint.complaint_no}%`]
      );

      if (!existingAlert) {
        await Database.insert('alerts', {
          alert_type: 'complaint_overdue',
          toilet_id: complaint.toilet_id,
          title: '投诉处理超时预警',
          content: `投诉 ${complaint.complaint_no}（${complaint.title}）已超过24小时未处理，涉及公厕：${complaint.toilet_name}`,
          level: 'warning',
          status: 'active'
        });
      }
    }
  }

  async getActiveAlertsSummary() {
    const absent = await Database.getOne("SELECT COUNT(*) as count FROM alerts WHERE alert_type = 'absent' AND status = 'active'");
    const lowStock = await Database.getOne("SELECT COUNT(*) as count FROM alerts WHERE alert_type = 'low_stock' AND status = 'active'");
    const complaintOverdue = await Database.getOne("SELECT COUNT(*) as count FROM alerts WHERE alert_type = 'complaint_overdue' AND status = 'active'");
    
    return {
      absent: absent.count,
      low_stock: lowStock.count,
      complaint_overdue: complaintOverdue.count,
      total: parseInt(absent.count) + parseInt(lowStock.count) + parseInt(complaintOverdue.count)
    };
  }
}

module.exports = new AlertService();
