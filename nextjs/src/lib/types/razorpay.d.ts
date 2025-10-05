// Razorpay TypeScript definitions for browser SDK
export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  order_id: string;
  handler: (response: RazorpaySuccessResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
    confirm_close?: boolean;
    escape?: boolean;
    backdropclose?: boolean;
  };
  readonly?: {
    email?: boolean;
    contact?: boolean;
    name?: boolean;
  };
  hidden?: {
    email?: boolean;
    contact?: boolean;
  };
  send_sms_hash?: boolean;
  allow_rotation?: boolean;
  retry?: {
    enabled?: boolean;
    max_count?: number;
  };
  timeout?: number;
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export interface Razorpay {
  open(): void;
  on(event: string, callback: (response: unknown) => void): void;
}

export interface RazorpayConstructor {
  new (options: RazorpayOptions): Razorpay;
}

declare global {
  interface Window {
    Razorpay: RazorpayConstructor;
  }
}

