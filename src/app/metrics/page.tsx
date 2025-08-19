'use client';

import { useState, useEffect, FC } from 'react';
import Link from 'next/link';

interface MetricsResponse extends Record<string, unknown> {}

const MetricsDisplay: FC<{ metrics: MetricsResponse }> = ({ metrics }) => (
  <div className="response-container">
    <h2>Live Metrics</h2>
    <pre>{JSON.stringify(metrics, null, 2)}</pre>
  </div>
);

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/v1/metrics', {
          headers: {
            'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || '',          
          },
        });

        if (!res.ok) {
          throw new Error(`Error: ${res.status} ${res.statusText}`);
        }

        const data: MetricsResponse = await res.json();
        setMetrics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return (
    <main>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>PayNow Metrics</h1>
        <Link href="/" style={{ textDecoration: 'none', color: '#0052cc', fontWeight: 500 }}>
          &larr; Back to Payments
        </Link>
      </div>
      <p>Live operational metrics from the backend service.</p>
      
      {isLoading && <p>Loading metrics...</p>}
      {error && <div className="response-container"><pre>{error}</pre></div>}
      {metrics && <MetricsDisplay metrics={metrics} />}
    </main>
  );
}
