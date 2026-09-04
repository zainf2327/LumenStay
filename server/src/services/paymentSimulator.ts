export interface PaymentResult {
  success: boolean;
  transactionId: string;
  authCode: string;
  last4: string;
  brand: string;
  amount: number;
  currency: string;
  processor: 'Square' | 'Elavon';
  timestamp: string;
  message: string;
}

export function simulatePaymentTokenization(cardNumber: string): string {
  const clean = cardNumber.replace(/\s+/g, '');
  const last4 = clean.slice(-4) || '4242';
  return `tok_sq_${Date.now()}_${last4}`;
}

export function processTokenizedCharge(
  token: string,
  amount: number,
  currency = 'USD',
  processor: 'Square' | 'Elavon' = 'Square'
): PaymentResult {
  const transactionId = `txn_${processor.toLowerCase()}_${Math.random().toString(36).substring(2, 11)}`;
  const authCode = `AUTH-${Math.floor(100000 + Math.random() * 900000)}`;
  const last4 = token.includes('_') ? token.split('_').pop() || '4242' : '4242';

  return {
    success: true,
    transactionId,
    authCode,
    last4,
    brand: last4.startsWith('3') ? 'Amex' : (last4.startsWith('5') ? 'Mastercard' : 'Visa'),
    amount,
    currency,
    processor,
    timestamp: new Date().toISOString(),
    message: 'Payment authorized and settled successfully via hosted secure token.',
  };
}
