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
    
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });
    
    // Forward response headers
    response.headers.forEach((value, key) => {
      if (key !== 'content-encoding' && key !== 'transfer-encoding') {
        res.setHeader(key, value);
      }
    });
    
    res.status(response.status);
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      res.json(data);
    } else if (contentType && contentType.includes('text/html')) {
      const html = await response.text();
      const baseUrl = req.headers.host ? `https://${req.headers.host}/api` : '/api';
      
      // Replace various URL patterns to go through proxy
      const modifiedHtml = html
        .replace(/https:\/\/robot-sms\.xyz/g, baseUrl)
        .replace(/href="\/([^"]*)/g, `href="${baseUrl}/$1`)
        .replace(/src="\/([^"]*)/g, `src="${baseUrl}/$1`)
        .replace(/action="\/([^"]*)/g, `action="${baseUrl}/$1`)
        .replace(/url\(\/([^)]*)/g, `url(${baseUrl}/$1`);
      
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