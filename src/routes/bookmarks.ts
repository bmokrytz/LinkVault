import { Router, Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import pool from '../db/pool';

const router = Router();

router.post('', async (req: AuthRequest, res: Response): Promise<void> => {
    const { userId } = req.user!;
    const { url, title, tags } = req.body;

    if (!url || !title) {
        res.status(400).json({ error: 'URL and title are required' });
        return;
    }

    if (title.length > 255) {
        res.status(400).json({ error: 'Title must be 255 characters or less' });
        return;
    }

    const query = 'INSERT INTO bookmarks (user_id, url, title, tags) VALUES ($1, $2, $3, $4) RETURNING id, created_at';
    const params = [userId, url, title, tags || []];

    try {
        const result = await pool.query(query, params);
        const bookmark = result.rows[0];

        res.status(201).json({ bookmark: {id: bookmark.id, created_at: bookmark.created_at} })
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('', async (req: AuthRequest, res: Response): Promise<void> => {
    const { userId } = req.user!;
    const { tags } = req.body;

    let query = 'SELECT * FROM bookmarks WHERE user_id = $1';
    const params: any[] = [userId];

    // Add tag filtering if client provided tags
    if (tags && Array.isArray(tags) && tags.length > 0) {
        params.push(tags);
        query += ` AND tags @> $${params.length}`;
    }

    try {
        const result = await pool.query(query, params);
        const bookmarks = result.rows

        res.status(200).json({ bookmarks });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    const { userId } = req.user!;
    const { id } = req.params;

    const query = 'SELECT * FROM bookmarks WHERE user_id = $1 AND id = $2';
    const params = [userId, id];

    try {
        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Bookmark not found' });
            return;
        }

        const bookmark = result.rows[0]

        res.status(200).json({ bookmark });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    const { userId } = req.user!;
    const { id } = req.params;
    const { url, title, tags } = req.body;

    const query = `
        UPDATE bookmarks
        SET
            title = $1,
            url = $2,
            tags = $3,
            updated_at = NOW()
        WHERE id = $4 AND user_id = $5
        RETURNING *;
    `;
    const params = [title, url, tags, id, userId];

    try {
        const result = await pool.query(query, params);
        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Bookmark not found' });
            return;
        }

        const bookmark = result.rows[0];
        res.status(200).json({ bookmark });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    const { userId } = req.user!;
    const { id } = req.params;

    const query = `
        DELETE FROM bookmarks
        WHERE id = $1 AND user_id = $2
        RETURNING id;
    `;
    const params = [id, userId];

    try {
        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            res.status(404).json({ error: 'Bookmark not found' });
            return;
        }

        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;