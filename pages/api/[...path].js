export default async function handler(req, res) {
  const { path } = req.query;
  const pathString = Array.isArray(path) ? path.join('/') : (path || '');
  
  // Target the robot-sms.xyz domain
  const targetUrl = `https://robot-sms.xyz/${pathString}`;
  const url = new URL(targetUrl);
  
  // Add query parameters from the original request
  const originalUrl = new URL(req.url, `http://${req.headers.host}`);
  originalUrl.searchParams.forEach((value, key) => {
    if (!key.startsWith('path') && key !== 'vercelCacheBuster') {
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
    
    const response = await fetch(url.toString(), {
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
    } else if (contentType.includes('javascript') || pathString.endsWith('.js')) {
      const jsContent = await response.text();
      const baseUrl = req.headers.host ? `https://${req.headers.host}/api` : '/api';
      
      // Rewrite JavaScript URLs and API calls
      const modifiedJs = jsContent
        .replace(/https:\/\/robot-sms\.xyz/g, baseUrl)
        .replace(/http:\/\/robot-sms\.xyz/g, baseUrl)
        .replace(/"\/api\/([^"]*)"/g, `"${baseUrl}/api/$1"`)
        .replace(/'\/api\/([^']*)'/g, `'${baseUrl}/api/$1'`)
        .replace(/fetch\("\/([^"]*)"/g, `fetch("${baseUrl}/$1"`)
        .replace(/fetch\('\/([^']*)'/g, `fetch('${baseUrl}/$1'`)
        .replace(/axios\.get\("\/([^"]*)"/g, `axios.get("${baseUrl}/$1"`)
        .replace(/axios\.post\("\/([^"]*)"/g, `axios.post("${baseUrl}/$1"`)
        // Fix Vite asset paths in __vite__mapDeps arrays
        .replace(/"assets\/([^"]*)"/g, `"${baseUrl}/assets/$1"`)
        .replace(/'assets\/([^']*)'/g, `'${baseUrl}/assets/$1'`)
        // Fix ES module imports - handle ./ relative imports
        .replace(/from"\.\/([^"]+)"/g, `from"${baseUrl}/$1"`)
        .replace(/from'\.\/([^']+)'/g, `from'${baseUrl}/$1'`)
        .replace(/import"\.\/([^"]+)"/g, `import"${baseUrl}/$1"`)
        .replace(/import'\.\/([^']+)'/g, `import'${baseUrl}/$1'`)
        // Fix asset references that start with / (avoiding double slashes)
        .replace(/"\//g, `"${baseUrl}/`)
        .replace(/'\//g, `'${baseUrl}/`)
        // Fix general relative asset paths (but avoid ones already processed)
        .replace(/"([^"]*\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot))"/g, (match, path) => {
          // Skip if already has baseUrl or is absolute
          if (path.includes(baseUrl) || path.startsWith('http') || path.startsWith('data:')) {
            return match;
          }
          // Handle relative paths that don't start with /
          return `"${baseUrl}/${path.replace(/^\.?\//, '')}"`;
        })
        .replace(/'([^']*\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot))'/g, (match, path) => {
          // Skip if already has baseUrl or is absolute
          if (path.includes(baseUrl) || path.startsWith('http') || path.startsWith('data:')) {
            return match;
          }
          // Handle relative paths that don't start with /
          return `'${baseUrl}/${path.replace(/^\.?\//, '')}'`;
        })
        // Clean up any double slashes that might have been created
        .replace(new RegExp(`${baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}//+`, 'g'), `${baseUrl}/`);
      
      res.setHeader('Content-Type', 'application/javascript');
      res.send(modifiedJs);
    } else {
      // For other content types (CSS, images, etc.)
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy request failed', details: error.message });
  }
}