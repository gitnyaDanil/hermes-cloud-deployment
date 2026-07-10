import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import yaml from 'js-yaml'; // We will use js-yaml to read the config safely

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const DB_PATH = process.env.DB_PATH;
const SOUL_PATH = process.env.SOUL_PATH;
const CONFIG_PATH = process.env.CONFIG_PATH;

// Database connection helper
const getDb = () => {
    return new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
        if (err) {
            console.error('Error opening database:', err.message);
        }
    });
};

// API Endpoint: Get general status and metrics
app.get('/api/status', (req, res) => {
    const db = getDb();
    
    // Get total conversation sessions, total messages, and total estimated cost
    const query = `
        SELECT 
            COUNT(id) as total_sessions, 
            SUM(message_count) as total_messages,
            SUM(estimated_cost_usd) as total_cost 
        FROM sessions
    `;
    
    db.get(query, [], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        // Read LiteLLM config
        let liteLlmConfig = null;
        try {
            if (fs.existsSync(CONFIG_PATH)) {
                const fileContents = fs.readFileSync(CONFIG_PATH, 'utf8');
                liteLlmConfig = yaml.load(fileContents);
            }
        } catch (e) {
            console.error('Failed to parse LiteLLM config:', e.message);
        }

        res.json({
            database_connected: true,
            total_sessions: row.total_sessions || 0,
            total_messages: row.total_messages || 0,
            total_cost: row.total_cost ? parseFloat(row.total_cost.toFixed(4)) : 0,
            config: liteLlmConfig ? {
                model_alias: 'default-model',
                target_model: liteLlmConfig.model_list?.[0]?.model_name || 'unknown',
                litellm_version: 'v1.40+',
                fallbacks_enabled: !!liteLlmConfig.model_list?.[0]?.litellm_params?.fallbacks
            } : null
        });
    });
    
    db.close();
});

// API Endpoint: List conversations
app.get('/api/conversations', (req, res) => {
    const db = getDb();
    const query = `
        SELECT id, title, started_at, model, message_count, estimated_cost_usd 
        FROM sessions 
        WHERE archived = 0
        ORDER BY started_at DESC 
        LIMIT 50
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
    
    db.close();
});

// API Endpoint: Get message history for a conversation
app.get('/api/conversations/:id', (req, res) => {
    const db = getDb();
    const query = `
        SELECT role, content, timestamp, token_count, reasoning_content 
        FROM messages 
        WHERE session_id = ? AND active = 1
        ORDER BY timestamp ASC
    `;
    
    db.all(query, [req.params.id], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
    
    db.close();
});

// API Endpoint: Read system prompt (SOUL.md)
app.get('/api/soul', (req, res) => {
    try {
        if (fs.existsSync(SOUL_PATH)) {
            const soulContent = fs.readFileSync(SOUL_PATH, 'utf8');
            res.json({ soul: soulContent });
        } else {
            res.status(404).json({ error: 'SOUL.md file not found.' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});
