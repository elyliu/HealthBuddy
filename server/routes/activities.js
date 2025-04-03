// Update an activity
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { description, date } = req.body;
    const userId = req.user.id;

    // Verify activity belongs to user
    const activity = await pool.query(
      'SELECT * FROM activities WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (activity.rows.length === 0) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Update the activity
    const updatedActivity = await pool.query(
      'UPDATE activities SET description = $1, date = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
      [description, date, id, userId]
    );

    res.json(updatedActivity.rows[0]);
  } catch (error) {
    console.error('Error updating activity:', error);
    res.status(500).json({ message: 'Error updating activity' });
  }
});

// Delete an activity
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify activity belongs to user
    const activity = await pool.query(
      'SELECT * FROM activities WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (activity.rows.length === 0) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Delete the activity
    await pool.query(
      'DELETE FROM activities WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ message: 'Error deleting activity' });
  }
});

module.exports = router; 