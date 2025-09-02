# Robot SMS Proxy

A Next.js proxy server deployed on Vercel to access robot-sms.xyz from any location.

## Deployment Steps

1. Push this repository to GitHub
2. Connect your GitHub repository to Vercel
3. Deploy automatically

## Usage

### Website Access
- Access the main website at: `https://your-vercel-domain.vercel.app/api/`

### API Access  
- Replace `https://robot-sms.xyz` with `https://your-vercel-domain.vercel.app/api` in your API calls

### Examples
```
Original: https://robot-sms.xyz/api/endpoint
Proxied:  https://your-vercel-domain.vercel.app/api/api/endpoint

Original: https://robot-sms.xyz/login
Proxied:  https://your-vercel-domain.vercel.app/api/login
```

## Features
- Bypasses geographic restrictions
- Supports all HTTP methods (GET, POST, PUT, DELETE, etc.)
- Forwards headers and response codes
- Works with both website browsing and API calls
- Automatic URL rewriting for seamless experience