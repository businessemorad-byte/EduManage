// ─── Payment Provider Abstraction ──────────────────────────────

export type CheckoutSession = {
  sessionId: string;
  url: string;
  status: "PENDING" | "COMPLETED" | "CANCELED" | "FAILED";
  amount: number;
  currency: string;
  providerRef?: string;
};

export type PaymentResult = {
  success: boolean;
  providerRef?: string;
  status: "SUCCEEDED" | "FAILED" | "PROCESSING";
  error?: string;
};

export type RefundResult = {
  success: boolean;
  providerRef?: string;
  status: "SUCCEEDED" | "FAILED" | "PENDING";
  error?: string;
};

export interface PaymentProvider {
  name: string;
  createCheckout(params: {
    amount: number;
    currency: string;
    organizationId: string;
    subscriptionId: string;
    planCode: string;
    interval: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutSession>;
  verifyPayment(providerRef: string): Promise<PaymentResult>;
  processRefund(paymentRef: string, amount: number, reason?: string): Promise<RefundResult>;
}

// ─── Provider Registry ────────────────────────────────────────

const providers = new Map<string, PaymentProvider>();

export function registerProvider(provider: PaymentProvider) {
  providers.set(provider.name, provider);
}

export function getProvider(name?: string): PaymentProvider | undefined {
  return providers.get(name ?? "mock") ?? providers.get("mock");
}

// ─── Mock Provider (local dev) ────────────────────────────────

class MockPaymentProvider implements PaymentProvider {
  name = "mock";

  async createCheckout(params: {
    amount: number;
    currency: string;
    organizationId: string;
    subscriptionId: string;
    planCode: string;
    interval: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutSession> {
    return {
      sessionId: `mock_cs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      url: `${params.successUrl}?session_id=mock_cs_${Date.now()}`,
      status: "PENDING",
      amount: params.amount,
      currency: params.currency,
    };
  }

  async verifyPayment(providerRef: string): Promise<PaymentResult> {
    // Simulate: refs starting with "fail_" = failed payment
    if (providerRef.startsWith("fail_")) {
      return { success: false, status: "FAILED", error: "Simulated payment failure" };
    }
    return { success: true, providerRef, status: "SUCCEEDED" };
  }

  async processRefund(paymentRef: string, amount: number, reason?: string): Promise<RefundResult> {
    void paymentRef; void amount; void reason;
    return { success: true, providerRef: `mock_refund_${Date.now()}`, status: "SUCCEEDED" };
  }
}

// Register mock provider by default
registerProvider(new MockPaymentProvider());
