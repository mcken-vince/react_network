export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request entity too large' });
  }

  res.status(500).json({ error: 'Something went wrong!' });
};