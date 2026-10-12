// server/src/routes/outreach.js
import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Public: Submit an outreach contact
router.post('/', async (req, res) => {
  try {
    const { name, email, company } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('outreach_contacts')
      .insert([{ name, email, company }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: 'Contact added', data });
  } catch (error) {
    console.error('Outreach insert error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Get all outreach contacts
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('outreach_contacts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ data });
  } catch (error) {
    console.error('Outreach fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Update contact status
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabaseAdmin
      .from('outreach_contacts')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Contact updated', data });
  } catch (error) {
    console.error('Outreach update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Delete a contact
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('outreach_contacts')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Outreach delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;