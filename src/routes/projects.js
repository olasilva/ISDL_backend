// server/src/routes/projects.js
import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Client: Get their own project & Bank Details
router.get('/my-project', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('client_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(); 

    if (error) throw error;
    
    // Send back project data AND the bank details from .env
    res.json({ 
      data: data || null,
      bankDetails: {
        bankName: process.env.BANK_NAME,
        accountName: process.env.BANK_ACCOUNT_NAME,
        accountNumber: process.env.BANK_ACCOUNT_NUMBER,
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Get ALL projects
router.get('/all', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    res.json({ data });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: Create a project
router.post('/', requireAuth, async (req, res) => {
  try {
    const { client_email, project_name, domain_name, amount_due } = req.body;
    
    const { data: { users }, error: userErr } = await supabaseAdmin.auth.admin.listUsers();
    if (userErr) throw userErr;
    
    const client = users.find(u => u.email === client_email);
    if (!client) return res.status(404).json({ error: 'Client email not found.' });

    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert([{ 
        client_id: client.id, 
        project_name, 
        domain_name, 
        amount_due: parseFloat(amount_due),
        status: 'pending' 
      }])
      .select()
      .single();

    if (error) throw error;
    res.json({ data });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: Update status/progress AND mark as paid
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { status, progress, domain_name, is_paid } = req.body;
    
    // Build update object dynamically
    const updates = {};
    if (status !== undefined) updates.status = status;
    if (progress !== undefined) updates.progress = progress;
    if (domain_name !== undefined) updates.domain_name = domain_name;
    if (is_paid !== undefined) {
      updates.is_paid = is_paid;
      if (is_paid) updates.amount_due = 0; // Clear amount due
    }

    const { data, error } = await supabaseAdmin
      .from('projects')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ data });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Client: Claim they have made the bank transfer
router.post('/claim-payment', requireAuth, async (req, res) => {
  try {
    const { project_id, payment_reference } = req.body;
    
    const { data, error } = await supabaseAdmin
      .from('projects')
      .update({ 
        payment_claimed: true,
        payment_reference: payment_reference || 'No reference provided'
      })
      .eq('id', project_id)
      .eq('client_id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Payment claim submitted', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;