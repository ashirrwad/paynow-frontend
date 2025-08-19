'use client';

import { useState, FC } from 'react';
import Link from 'next/link';

interface AgentTrace {
  step: string;
  detail: string;
}

interface ApiResponse {
  success: boolean;
  data?: {
    decision: string;
    reasons: string[];
    requestId: string;
    agentTrace: AgentTrace[];
  };
  error?: {
    code: string;
    message: string;
  };
  message?: string;
  timestamp: string;
}

const AgentTraceDisplay: FC<{ trace: AgentTrace[] }> = ({ trace }) => (
  <div>
    <h2>Agent Trace</h2>
    <ul className="trace-list">
      {trace.map((item, index) => (
        <li key={index} className="trace-item">
          <strong>{item.step.replace(/_/g, ' ')}:</strong> {item.detail}
        </li>
      ))}
    </ul>
  </div>
);

const ResponseDisplay: FC<{ response: ApiResponse }> = ({ response }) => (
  <div className="response-container">
    <h2>Backend Response</h2>
    <pre>{JSON.stringify(response, null, 2)}</pre>
    {response.data?.agentTrace && <AgentTraceDisplay trace={response.data.agentTrace} />}
  </div>
);

export default function Home() {
  const [formData, setFormData] = useState({
    customerId: 'c_customer_001',
    amount: '125.50',
    currency: 'USD',
    payeeId: 'p_merchant_789',
    idempotencyKey: `idempotency-key-${Date.now()}`,
  });
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/v1/payments/decide', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',          
        },
        body: JSON.stringify({ ...formData, amount: parseFloat(formData.amount) }),
      });

      const data: ApiResponse = await res.json();
      setResponse(data);

    } catch (err) {
      // This will be a network error, the backend error is in the json response
      const errorResponse: ApiResponse = {
        success: false,
        error: {
            code: 'NETWORK_ERROR',
            message: err instanceof Error ? err.message : 'An unknown network error occurred',
        },
        timestamp: new Date().toISOString(),
      };
      setResponse(errorResponse);
    } finally {
      setIsLoading(false);
      // Refresh idempotency key for next transaction
      setFormData(prev => ({ ...prev, idempotencyKey: `idempotency-key-${Date.now()}`}));
    }
  };

  return (
    <main>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>PayNow Agent Assist</h1>
        <Link href="/metrics" style={{ textDecoration: 'none', color: '#0052cc', fontWeight: 500 }}>
          View Metrics &rarr;
        </Link>
      </div>
      <p>Frontend to demonstrate the payment decision API.</p>
      
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="customerId">Customer ID</label>
              <input type="text" id="customerId" name="customerId" value={formData.customerId} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label htmlFor="amount">Amount</label>
              <input type="text" id="amount" name="amount" value={formData.amount} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label htmlFor="currency">Currency</label>
              <input type="text" id="currency" name="currency" value={formData.currency} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label htmlFor="payeeId">Payee ID</label>
              <input type="text" id="payeeId" name="payeeId" value={formData.payeeId} onChange={handleInputChange} />
            </div>
            <div className="form-group" style={{gridColumn: 'span 2'}}>
              <label htmlFor="idempotencyKey">Idempotency Key (auto-refreshed)</label>
              <input type="text" id="idempotencyKey" name="idempotencyKey" value={formData.idempotencyKey} readOnly />
            </div>
          </div>
          <div style={{display: 'flex', justifyContent:'flex-end', marginTop: '16px'}}>
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Make Payment Decision'}
            </button>
          </div>
        </form>
      </div>

      {response && <ResponseDisplay response={response} />}
    </main>
  );
}