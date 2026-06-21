const Database = require('../models/db');
const { v4: uuidv4 } = require('uuid');

class SupplyService {
  async checkAndGenerateSupplyOrder(toiletId, oldData, newData) {
    const toilet = newData || await Database.getOne('SELECT * FROM toilets WHERE id = ?', [toiletId]);
    if (!toilet) return;

    const needsSupply = [];
    let toiletPaperQty = 0;
    let handSanitizerQty = 0;

    if (toilet.toilet_paper_stock <= toilet.toilet_paper_threshold) {
      needsSupply.push('toilet_paper');
      toiletPaperQty = Math.max(20, toilet.toilet_paper_threshold * 2 - toilet.toilet_paper_stock);
    }

    if (toilet.hand_sanitizer_stock <= toilet.hand_sanitizer_threshold) {
      needsSupply.push('hand_sanitizer');
      handSanitizerQty = Math.max(10, toilet.hand_sanitizer_threshold * 2 - toilet.hand_sanitizer_stock);
    }

    if (needsSupply.length === 0) return;

    const existingOrder = await Database.getOne(
      "SELECT * FROM supply_orders WHERE toilet_id = ? AND status IN ('pending', 'assigned', 'delivering') ORDER BY id DESC LIMIT 1",
      [toiletId]
    );

    if (existingOrder) {
      if (existingOrder.toilet_paper_qty < toiletPaperQty || existingOrder.hand_sanitizer_qty < handSanitizerQty) {
        await Database.update(
          'supply_orders',
          {
            toilet_paper_qty: Math.max(existingOrder.toilet_paper_qty, toiletPaperQty),
            hand_sanitizer_qty: Math.max(existingOrder.hand_sanitizer_qty, handSanitizerQty)
          },
          'id = ?',
          [existingOrder.id]
        );
      }
      return existingOrder.id;
    }

    const orderNo = 'SP' + Date.now() + Math.floor(Math.random() * 1000);
    const orderId = await Database.insert('supply_orders', {
      order_no: orderNo,
      toilet_id: toiletId,
      order_type: 'auto',
      status: 'pending',
      toilet_paper_qty: toiletPaperQty,
      hand_sanitizer_qty: handSanitizerQty,
      remark: '系统自动生成补给单：' + needsSupply.join('、') + '库存不足'
    });

    await Database.insert('alerts', {
      alert_type: 'low_stock',
      toilet_id: toiletId,
      title: '耗材库存不足预警',
      content: `${toilet.name} 的${needsSupply.includes('toilet_paper') ? '厕纸' : ''}${needsSupply.length === 2 ? '和' : ''}${needsSupply.includes('hand_sanitizer') ? '洗手液' : ''}库存不足，已自动生成补给单`,
      level: 'warning',
      status: 'active'
    });

    return orderId;
  }

  async checkAllToiletsStock() {
    const toilets = await Database.query(
      'SELECT * FROM toilets WHERE toilet_paper_stock <= toilet_paper_threshold OR hand_sanitizer_stock <= hand_sanitizer_threshold'
    );
    
    for (const toilet of toilets) {
      await this.checkAndGenerateSupplyOrder(toilet.id);
    }
    return toilets.length;
  }
}

module.exports = new SupplyService();
