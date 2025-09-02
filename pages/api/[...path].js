export default async function handler(req, res) {
  const { path } = req.query;
  const pathString = Array.isArray(path) ? path.join('/') : path;
  
  // Target the robot-sms.xyz domain
  const targetUrl = `https://robot-sms.xyz/${pathString}`;
  const url = new URL(targetUrl);
  
  // Add query parameters
  const searchParams = new URLSearchParams(req.url.split('?')[1] || '');
  searchParams.forEach((value, key) => {
    if (key !== 'path') {
      url.searchParams.append(key, value);
    }
  });
  
  try {
    // Forward headers but remove problematic ones
    const headers = { ...req.headers };
    delete headers.host;
    delete headers['x-forwarded-for'];
    delete headers['x-forwarded-proto'];
    delete headers['x-forwarded-host'];
    
    const response = await fetch(url.toString(), {
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
      // Replace absolute URLs in HTML to go through proxy
      const modifiedHtml = html.replace(
        /https:\/\/robot-sms\.xyz/g, 
        req.headers.host ? `https://${req.headers.host}/api` : '/api'
      );
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