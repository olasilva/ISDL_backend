// server/src/routes/updates.js
import express from 'express';
import multer from 'multer';
import { supabaseAdmin } from '../config/supabase.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Configure multer to store files in memory (we'll upload to Supabase Storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Helper: Upload image to Supabase Storage
const uploadImage = async (file) => {
  const fileExt = file.originalname.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `updates/${fileName}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('update-images')
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  // Get public URL
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('update-images')
    .getPublicUrl(filePath);

  return publicUrl;
};

// Public: Get all published updates
router.get('/published', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_updates')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  } catch (error) {
    console.error('Updates fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Get all updates
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_updates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ data });
  } catch (error) {
    console.error('Updates fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: Create a new update (with optional image)
router.post('/', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { title, content, published } = req.body;
    let image_url = null;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    // Upload image if provided
    if (req.file) {
      image_url = await uploadImage(req.file);
    }

    const { data, error } = await supabaseAdmin
      .from('site_updates')
      .insert([{ 
        title, 
        content, 
        published: published === 'true' || published === true,
        image_url,
      }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ message: 'Update created', data });
  } catch (error) {
    console.error('Update create error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Admin: Update an existing update
router.put('/:id', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, published } = req.body;
    
    // Fetch the current update to get old image
    const { data: existing } = await supabaseAdmin
      .from('site_updates')
      .select('image_url')
      .eq('id', id)
      .single();

    let image_url = existing?.image_url;

    // If new image uploaded, delete old one and upload new
    if (req.file) {
      if (existing?.image_url) {
        const oldPath = existing.image_url.split('/update-images/')[1];
        if (oldPath) {
          await supabaseAdmin.storage.from('update-images').remove([oldPath]);
        }
      }
      image_url = await uploadImage(req.file);
    }

    const { data, error } = await supabaseAdmin
      .from('site_updates')
      .update({ 
        title, 
        content, 
        published: published === 'true' || published === true,
        image_url,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Update saved', data });
  } catch (error) {
    console.error('Update save error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Admin: Delete an update
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get the image URL first
    const { data: existing } = await supabaseAdmin
      .from('site_updates')
      .select('image_url')
      .eq('id', id)
      .single();

    // Delete image from storage
    if (existing?.image_url) {
      const oldPath = existing.image_url.split('/update-images/')[1];
      if (oldPath) {
        await supabaseAdmin.storage.from('update-images').remove([oldPath]);
      }
    }

    const { error } = await supabaseAdmin
      .from('site_updates')
      .delete()
      .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Update deleted successfully' });
  } catch (error) {
    console.error('Update delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;