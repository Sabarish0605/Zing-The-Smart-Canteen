const cron = require('node-cron');
const db = require('../database');
const { processRefund } = require('./razorpayService');

function startOrderCancellationJob() {
  cron.schedule('*/5 * * * *', async () => {
    console.log('🔍 Checking for expired orders...');
    
    const now = new Date().toISOString();
    
    db.all(`
      SELECT * FROM orders 
      WHERE status = 'active' 
      AND auto_cancel_at < ? 
      AND cancelled_at IS NULL
    `, [now], async (err, orders) => {
      if (err) return;
      
      for (const order of orders) {
        try {
          let refundAmount = 0;
          let refundStatus = 'failed';
          
          if (order.razorpay_payment_id) {
            const refund = await processRefund(order.razorpay_payment_id, order.total_amount);
            refundAmount = refund.amount / 100;
            refundStatus = refund.status;
          }
          
          db.run(`
            UPDATE orders 
            SET status = 'cancelled',
                cancelled_at = ?,
                cancellation_reason = 'Not picked up in time',
                refund_amount = ?,
                refund_status = ?
            WHERE order_id = ?
          `, [now, refundAmount, refundStatus, order.order_id]);
          
          db.all(`SELECT item_id, quantity FROM order_items WHERE order_id = ?`, 
            [order.order_id], (err, items) => {
              items.forEach(item => {
                db.run(`UPDATE menu_items SET stock = stock + ? WHERE id = ?`, 
                  [item.quantity, item.item_id]);
              });
            });
          
          console.log(`✅ Auto-cancelled: ${order.order_id}`);
        } catch (error) {
          console.error('Error:', error);
        }
      }
    });
  });
}

function startPaymentHistoryCleanup() {
  cron.schedule('0 0 * * *', () => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    db.run(`DELETE FROM payment_history WHERE created_at < ?`, 
      [sevenDaysAgo.toISOString()]);
  });
}

module.exports = { startOrderCancellationJob, startPaymentHistoryCleanup };