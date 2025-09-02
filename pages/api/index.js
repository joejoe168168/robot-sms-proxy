export default async function handler(req, res) {
  // When accessing /api/, proxy to robot-sms.xyz root
  const targetUrl = 'https://robot-sms.xyz/';
  
  try {
    // Forward headers but remove problematic ones
    const headers = { ...req.headers };
    delete headers.host;
    delete headers['x-forwarded-for'];
    delete headers['x-forwarded-proto'];
    delete headers['x-forwarded-host'];
    delete headers['x-real-ip'];
    delete headers.referer;
    delete headers.origin;
    
    // Add CORS headers for cross-origin requests
    headers['access-control-allow-origin'] = '*';
    headers['access-control-allow-methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    headers['access-control-allow-headers'] = 'Content-Type, Authorization';
    
    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }
    
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body,
    });
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Forward response headers
    response.headers.forEach((value, key) => {
      if (key !== 'content-encoding' && key !== 'transfer-encoding' && key !== 'content-length') {
        res.setHeader(key, value);
      }
    });
    
    res.status(response.status);
    
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      const data = await response.json();
      res.json(data);
    } else if (contentType.includes('text/html')) {
      const html = await response.text();
      const baseUrl = req.headers.host ? `https://${req.headers.host}/api` : '/api';
      
      // Comprehensive URL rewriting for HTML
      const modifiedHtml = html
        .replace(/https:\/\/robot-sms\.xyz/g, baseUrl)
        .replace(/http:\/\/robot-sms\.xyz/g, baseUrl)
        .replace(/"\/([^"]*?)"/g, `"${baseUrl}/$1"`)
        .replace(/'\/([^']*?)'/g, `'${baseUrl}/$1'`)
        .replace(/url\(\/([^)]*?)\)/g, `url(${baseUrl}/$1)`)
        .replace(/src=\/([^\s>]*)/g, `src=${baseUrl}/$1`)
        .replace(/href=\/([^\s>]*)/g, `href=${baseUrl}/$1`);
      
      res.send(modifiedHtml);
    } else {
      const data = await response.text();
      res.send(data);
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy request failed', details: error.message });
  }
}