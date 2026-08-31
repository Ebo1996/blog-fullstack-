export interface ChapaInitializePayload {
  amount: string;
  currency: string;
  email: string;
  first_name: string;
  last_name: string;
  tx_ref: string;
  callback_url: string;
  return_url: string;
  customization?: {
    title?: string;
    description?: string;
  };
}

export interface ChapaInitializeResponse {
  message: string;
  status: string;
  data: {
    checkout_url: string;
  };
}

export interface ChapaVerifyResponse {
  message: string;
  status: string;
  data: {
    first_name: string;
    last_name: string;
    email: string;
    currency: string;
    amount: string;
    charge: string;
    mode: string;
    method: string;
    type: string;
    status: 'success' | 'failed' | 'pending';
    reference: string;
    tx_ref: string;
    customization: {
      title: string;
      description: string;
    };
    meta: any;
    created_at: string;
    updated_at: string;
  };
}

export interface ChapaWebhookPayload {
  event: string;
  tx_ref: string;
  amount: string;
  currency: string;
  payment_method: string;
  status: string;
  reference: string;
  first_name: string;
  last_name: string;
  email: string;
}
