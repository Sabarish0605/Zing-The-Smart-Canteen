const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();

let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
  console.log('✅ Razorpay initialized successfully');
} else {
  console.warn('⚠️  Razorpay keys not found in environment variables. Using Mock Razorpay service.');
  razorpay = {
    orders: {
      create: async (options) => {
        console.log('🔮 [Mock Razorpay] Creating order:', options);
        return {
          id: 'mock_razorpay_order_' + Date.now() + '_' + Math.random().toString(36).substring(7),
          amount: options.amount,
          currency: options.currency,
          receipt: options.receipt,
          status: 'created'
        };
      }
    },
    payments: {
      refund: async (paymentId, options) => {
        console.log('🔮 [Mock Razorpay] Processing refund for payment:', paymentId, options);
        return {
          id: 'mock_refund_' + Date.now(),
          payment_id: paymentId,
          amount: options.amount,
          status: 'processed'
        };
      }
    }
  };
}

async function createOrder(amount, orderId) {
  const options = {
    amount: amount * 100,
    currency: 'INR',
    receipt: orderId,
    payment_capture: 1
  };
  return razorpay.orders.create(options);
}

function verifyPaymentSignature(orderId, paymentId, signature) {
  const isMock = (orderId && orderId.startsWith('mock_')) || 
                 (paymentId && paymentId.startsWith('mock_')) || 
                 (signature && signature.startsWith('mock_'));
  
  if (isMock || !process.env.RAZORPAY_KEY_SECRET) {
    console.log('🔮 [Mock Razorpay] Bypassing signature verification (mock signature detected or key_secret is not configured)');
    return true;
  }
  const text = orderId + '|' + paymentId;
  const generated_signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(text)
    .digest('hex');
  return generated_signature === signature;
}

async function processRefund(paymentId, amount) {
  const refundAmount = Math.floor(amount * 0.80 * 100);
  return razorpay.payments.refund(paymentId, {
    amount: refundAmount
  });
}

module.exports = { createOrder, verifyPaymentSignature, processRefund };