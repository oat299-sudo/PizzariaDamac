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

      // We use our own node fetch to follow redirects or just get the location header if manual redirect used
      const fetchRes = await fetch(url, { redirect: 'manual' });
      const location = fetchRes.headers.get('location');
      
      if (location) {
        return res.json({ targetUrl: location });
      } else {
        return res.json({ targetUrl: url }); // maybe it wasn't a shortlink
      }
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

      const response = await fetch('https://rest.lalamove.com/v3/quotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `hmac ${apiKey}:${time}:${signature}`,
          'Market': 'TH'
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

      const response = await fetch('https://rest.lalamove.com/v3/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `hmac ${apiKey}:${time}:${signature}`,
          'Market': 'TH'
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
