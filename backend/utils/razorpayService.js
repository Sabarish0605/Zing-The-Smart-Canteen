const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

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