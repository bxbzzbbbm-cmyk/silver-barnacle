import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_test_TYooMQauvdEDq54NiTphI7jx');

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#32325d',
      lineHeight: '18px',
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: 'antialiased',
      fontSize: '16px',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a',
    },
  },
};

const panelStyles = {
  panel: {
    flex: '1 1 400px',
    background: 'rgba(26, 26, 46, 0.9)',
    borderRadius: '16px',
    padding: '32px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
    border: '1px solid rgba(0, 212, 255, 0.15)',
    minWidth: '320px',
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#00d4ff',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  trialBanner: {
    background: 'linear-gradient(135deg, #00d4ff, #0078d4)',
    borderRadius: '10px',
    padding: '16px 20px',
    marginBottom: '24px',
    textAlign: 'center',
  },
  trialTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '4px',
  },
  trialSubtitle: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  cardWrapper: {
    background: '#fff',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  submitBtn: {
    width: '100%',
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #00d4ff, #0078d4)',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  disabledBtn: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  message: {
    marginTop: '16px',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    textAlign: 'center',
  },
  successMsg: {
    background: 'rgba(76, 175, 80, 0.15)',
    color: '#4caf50',
    border: '1px solid rgba(76, 175, 80, 0.3)',
  },
  errorMsg: {
    background: 'rgba(255, 75, 75, 0.15)',
    color: '#ff4b4b',
    border: '1px solid rgba(255, 75, 75, 0.3)',
  },
  priceInfo: {
    textAlign: 'center',
    marginBottom: '20px',
    color: '#8a8a9a',
    fontSize: '14px',
  },
  priceAmount: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#e0e0e0',
    display: 'block',
  },
  pricePer: {
    fontSize: '14px',
    color: '#8a8a9a',
  },
};

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setMessage({ type: 'error', text: 'Stripe has not loaded yet.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // In a real integration, you would create a PaymentMethod here via stripe.createPaymentMethod
      // and then pass it to your server. For this mock, we just POST card details placeholder.
      const res = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method_id: 'mock_pm',
        }),
      });
      const data = await res.json();

      if (data.success) {
        const trialEnd = new Date(data.trial_end).toLocaleDateString();
        setMessage({
          type: 'success',
          text: `🎉 7-day free trial activated! Trial ends on ${trialEnd}`,
        });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to create subscription.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={panelStyles.cardWrapper}>
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>

      <button
        style={{
          ...panelStyles.submitBtn,
          ...(loading ? panelStyles.disabledBtn : {}),
        }}
        disabled={!stripe || loading}
      >
        {loading ? 'Processing...' : 'Start 7-Day Free Trial'}
      </button>

      {message && (
        <div
          style={{
            ...panelStyles.message,
            ...(message.type === 'success' ? panelStyles.successMsg : panelStyles.errorMsg),
          }}
        >
          {message.text}
        </div>
      )}
    </form>
  );
}

export default function StripeCheckout({ vpnStatus }) {
  return (
    <div style={panelStyles.panel}>
      <div style={panelStyles.title}>💳 Subscribe</div>

      <div style={panelStyles.trialBanner}>
        <div style={panelStyles.trialTitle}>7-Day Free Trial</div>
        <div style={panelStyles.trialSubtitle}>No charge today — cancel anytime before trial ends</div>
      </div>

      <div style={panelStyles.priceInfo}>
        <span style={panelStyles.priceAmount}>$9.99</span>
        <span style={panelStyles.pricePer}>/month after trial</span>
      </div>

      <Elements stripe={stripePromise}>
        <CheckoutForm />
      </Elements>
    </div>
  );
}
