// server/src/routes/chat.js
import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Public: Get messages for a session (visitor polls this)
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  } catch (error) {
    console.error('Chat fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Public: Send a message from visitor
router.post('/', async (req, res) => {
  try {
    const { session_id, sender_name, message } = req.body;

    if (!session_id || !message) {
      return res.status(400).json({ error: 'Session ID and message are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .insert([{
        session_id,
        sender: 'visitor',
        sender_name: sender_name || 'Visitor',
        message,
      }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ data });
  } catch (error) {
    console.error('Chat send error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Get all sessions summary
router.get('/sessions', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .select('session_id, sender_name, message, created_at, is_read')
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });

    // Group by session_id
    const sessions = {};
    for (const row of data) {
      const id = row.session_id;
      if (!sessions[id]) {
        sessions[id] = {
          session_id: id,
          sender_name: row.sender_name || 'Visitor',
          last_message: row.message,
          last_at: row.created_at,
          unread: 0,
        };
      }
      if (!row.is_read) sessions[id].unread += 1;
    }

    res.json({ data: Object.values(sessions) });
  } catch (error) {
    console.error('Chat sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Get messages for a session
router.get('/admin/session/:sessionId', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Mark all visitor messages as read
    await supabaseAdmin
      .from('chat_messages')
      .update({ is_read: true })
      .eq('session_id', sessionId)
      .eq('sender', 'visitor');

    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  } catch (error) {
    console.error('Chat admin fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Reply to a session
router.post('/admin/reply', requireAuth, async (req, res) => {
  try {
    const { session_id, message } = req.body;

    if (!session_id || !message) {
      return res.status(400).json({ error: 'Session ID and message are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('chat_messages')
      .insert([{
        session_id,
        sender: 'admin',
        sender_name: 'ISDL Team',
        message,
        is_read: true,
      }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ data });
  } catch (error) {
    console.error('Chat reply error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Delete a session
router.delete('/admin/session/:sessionId', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const { error } = await supabaseAdmin
      .from('chat_messages')
      .delete()
      .eq('session_id', sessionId);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Chat deleted' });
  } catch (error) {
    console.error('Chat delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;