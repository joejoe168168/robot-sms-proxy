import { useEffect, useState } from 'react';

export default function Home() {
  const [proxyUrl, setProxyUrl] = useState('');
  
  useEffect(() => {
    setProxyUrl(window.location.origin);
  }, []);
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Robot SMS Proxy</h1>
      <p>This proxy allows you to access robot-sms.xyz from any location.</p>
      
      <h2>Usage:</h2>
      <h3>For Website Access:</h3>
      <p>Access the website at: <code>{proxyUrl}/api/</code></p>
      
      <h3>For API Calls:</h3>
      <p>Replace <code>https://robot-sms.xyz</code> with <code>{proxyUrl}/api</code></p>
      
      <h3>Examples:</h3>
      <ul>
        <li>Website: <a href="/api/" target="_blank">{proxyUrl}/api/</a></li>
        <li>API endpoint: <code>{proxyUrl}/api/your-api-endpoint</code></li>
      </ul>
      
      <p><strong>Note:</strong> All requests will be proxied through this Vercel deployment to bypass geographic restrictions.</p>
    </div>
  );
}