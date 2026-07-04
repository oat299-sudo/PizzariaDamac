import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON middleware
  app.use(express.json());

  // API to unshorten Google Map links
  app.post("/api/resolve-link", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: "Missing url" });
      }

      let finalUrl = url;
      try {
        // Follow redirects to get the ultimate destination URL which contains coordinates
        const response = await fetch(url, { 
          method: 'GET',
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        finalUrl = response.url;
      } catch (err) {
        // Fallback to manual redirect if follow fails
        const response = await fetch(url, { method: 'GET', redirect: 'manual' });
        finalUrl = response.headers.get('location') || url;
      }

      return res.json({ targetUrl: finalUrl });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/config", (req, res) => {
    res.json({
      GOOGLE_MAPS_PLATFORM_KEY: process.env.GOOGLE_MAPS_PLATFORM_KEY || process.env.VITE_GOOGLE_MAPS_PLATFORM_KEY || ''
    });
  });

  // --- LALAMOVE BACKEND INTEGRATION ---
  // Status check to see if Lalamove real connection is active (configured & reachable)
  app.get("/api/lalamove/status", async (req, res) => {
    try {
      const apiKey = process.env.LALAMOVE_API_KEY;
      const apiSecret = process.env.LALAMOVE_API_SECRET;
      
      if (!apiKey || !apiSecret) {
        return res.json({
          configured: false,
          status: 'offline',
          message: 'Lalamove API Keys are missing. Please add LALAMOVE_API_KEY and LALAMOVE_API_SECRET to the environment.'
        });
      }

      // Perform a real query to GET /v3/cities to verify connection
      const time = new Date().getTime().toString();
      const method = 'GET';
      const requestPath = '/v3/cities';
      const body = '';
      const rawSignature = `${time}\r\n${method}\r\n${requestPath}\r\n\r\n${body}`;
      const signature = crypto.createHmac('sha256', apiSecret).update(rawSignature).digest('hex');
      const requestId = `REQ-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

      const response = await fetch('https://rest.lalamove.com/v3/cities', {
        method: 'GET',
        headers: {
          'Authorization': `hmac ${apiKey}:${time}:${signature}`,
          'Market': 'TH',
          'Request-ID': requestId
        }
      });

      if (response.ok) {
        return res.json({
          configured: true,
          status: 'online',
          message: 'Connected to Lalamove Production API successfully!'
        });
      } else {
        const errData = await response.json().catch(() => ({}));
        return res.json({
          configured: true,
          status: 'offline',
          message: 'Lalamove API returned error status ' + response.status,
          error: errData
        });
      }
    } catch (e: any) {
      console.error("Lalamove status check failed", e);
      return res.json({
        configured: true,
        status: 'offline',
        message: `Connection error: ${e.message}`
      });
    }
  });

  // We MUST keep the API Key and Secret on the server to prevent them from being stolen.
  app.post("/api/lalamove/quote", async (req, res) => {
    try {
      const apiKey = process.env.LALAMOVE_API_KEY;
      const apiSecret = process.env.LALAMOVE_API_SECRET;
      
      if (!apiKey || !apiSecret) {
        return res.status(500).json({ error: "Lalamove API Keys are missing in Secrets." });
      }

      const time = new Date().getTime().toString();
      const method = 'POST';
      const requestPath = '/v3/quotations';
      const body = JSON.stringify(req.body);
      const rawSignature = `${time}\r\n${method}\r\n${requestPath}\r\n\r\n${body}`;
      const signature = crypto.createHmac('sha256', apiSecret).update(rawSignature).digest('hex');
      const requestId = `REQ-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

      const response = await fetch('https://rest.lalamove.com/v3/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `hmac ${apiKey}:${time}:${signature}`,
          'Market': 'TH',
          'Request-ID': requestId
        },
        body: body
      });

      const data = await response.json();
      
      if (!response.ok) {
        return res.status(response.status).json({ error: data });
      }

      return res.json(data);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/lalamove/order", async (req, res) => {
    try {
      const apiKey = process.env.LALAMOVE_API_KEY;
      const apiSecret = process.env.LALAMOVE_API_SECRET;
      
      if (!apiKey || !apiSecret) {
        return res.status(500).json({ error: "Lalamove API Keys are missing in Secrets." });
      }

      const time = new Date().getTime().toString();
      const method = 'POST';
      const requestPath = '/v3/orders';
      const body = JSON.stringify(req.body);
      const rawSignature = `${time}\r\n${method}\r\n${requestPath}\r\n\r\n${body}`;
      const signature = crypto.createHmac('sha256', apiSecret).update(rawSignature).digest('hex');
      const requestId = `REQ-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

      const response = await fetch('https://rest.lalamove.com/v3/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `hmac ${apiKey}:${time}:${signature}`,
          'Market': 'TH',
          'Request-ID': requestId
        },
        body: body
      });

      const data = await response.json();
      
      if (!response.ok) {
        return res.status(response.status).json({ error: data });
      }

      return res.json(data);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
