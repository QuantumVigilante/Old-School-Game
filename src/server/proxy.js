/**
 * @fileoverview Express API proxy for Gemini API.
 * SECURITY: Keeps API key server-side. Client only calls this proxy.
 * Includes input sanitization, rate limiting, and response validation.
 */
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware — allow all origins in production (Cloud Run handles security)
app.use(cors());
app.use(express.json({ limit: '10kb' })); // Limit payload size

// In production, serve the Vite-built static files
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../../dist');
  app.use(express.static(distPath));
}

// Initialize Gemini (server-side only — key never reaches the client)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Simple in-memory rate limiter
const rateLimiter = new Map();
const RATE_LIMIT_WINDOW = 10000; // 10 seconds
const MAX_REQUESTS = 5;

/**
 * Rate limiting middleware.
 */
function rateLimit(req, res, next) {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const windowData = rateLimiter.get(ip) || { count: 0, firstRequest: now };

  if (now - windowData.firstRequest > RATE_LIMIT_WINDOW) {
    rateLimiter.set(ip, { count: 1, firstRequest: now });
    return next();
  }

  if (windowData.count >= MAX_REQUESTS) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again shortly.' });
  }

  windowData.count++;
  rateLimiter.set(ip, windowData);
  next();
}

// NPC response cache (EFFICIENCY: avoids redundant API calls)
const npcCache = new Map();

/**
 * POST /api/generate-level
 * Generates a procedural level using Gemini AI.
 * Body: { prompt: string }
 */
app.post('/api/generate-level', rateLimit, async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (prompt.length > 3000) {
      return res.status(400).json({ error: 'Prompt too long' });
    }

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Try to extract JSON from response (Gemini may wrap in markdown)
    let jsonStr = text;
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    // Attempt to parse
    const parsed = JSON.parse(jsonStr.trim());
    res.json({ levelData: parsed });
  } catch (error) {
    console.error('Level generation error:', error.message);
    res.status(500).json({
      error: 'Failed to generate level',
      fallback: true,
    });
  }
});

/**
 * POST /api/npc-dialog
 * Generates NPC dialog responses with caching.
 * Body: { prompt: string, cacheKey: string }
 */
app.post('/api/npc-dialog', rateLimit, async (req, res) => {
  try {
    const { prompt, cacheKey } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Check cache first (EFFICIENCY)
    if (cacheKey && npcCache.has(cacheKey)) {
      return res.json({ dialog: npcCache.get(cacheKey), cached: true });
    }

    const result = await model.generateContent(prompt);
    const dialog = result.response.text().trim();

    // Cache the response
    if (cacheKey) {
      npcCache.set(cacheKey, dialog);
      // Evict old entries if cache grows too large
      if (npcCache.size > 100) {
        const firstKey = npcCache.keys().next().value;
        npcCache.delete(firstKey);
      }
    }

    res.json({ dialog, cached: false });
  } catch (error) {
    console.error('NPC dialog error:', error.message);
    res.status(500).json({
      error: 'Failed to generate dialog',
      dialog: 'Mama mia! I seem to have lost my words. Try again!',
    });
  }
});

/**
 * Health check endpoint.
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// In production, serve index.html for all non-API routes (SPA fallback)
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../../dist');
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🍄 Mario API proxy running on http://0.0.0.0:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Gemini API key: ${process.env.GEMINI_API_KEY ? '✅ configured' : '❌ missing'}`);
});
