// server/src/routes/inbox.js
import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Public: Submit a contact form message
router.post('/', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('inbox_messages')
      .insert([{ name, email, message }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: 'Message sent successfully', data });
  } catch (error) {
    console.error('Inbox insert error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Get all messages
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('inbox_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ data });
  } catch (error) {
    console.error('Inbox fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Mark message as read
router.patch('/:id/read', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('inbox_messages')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Message marked as read', data });
  } catch (error) {
    console.error('Inbox update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Delete a message
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('inbox_messages')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Inbox delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;