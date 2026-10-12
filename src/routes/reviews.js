// server/src/routes/reviews.js
import express from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Public: Get all approved reviews
router.get('/approved', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch approved reviews error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ data });
  } catch (error) {
    console.error('Reviews fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Public: Submit a review
router.post('/', async (req, res) => {
  try {
    const { author, rating, comment } = req.body;

    if (!author || !rating) {
      return res.status(400).json({ error: 'Author and rating are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .insert([{ 
        author, 
        rating, 
        comment: comment || null,
      }])
      .select()
      .single();

    if (error) {
      console.error('Review insert error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ message: 'Review submitted for approval', data });
  } catch (error) {
    console.error('Review submit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Get all reviews (requires auth)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch all reviews error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ data });
  } catch (error) {
    console.error('Reviews fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Approve or reject a review (requires auth)
router.patch('/:id/approve', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_approved } = req.body;

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .update({ is_approved })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Review approval error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ 
      message: `Review ${is_approved ? 'approved' : 'rejected'}`, 
      data 
    });
  } catch (error) {
    console.error('Review approval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Delete a review (requires auth)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Review delete error:', error);
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Review delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;