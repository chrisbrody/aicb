// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});