const express = require('express');
const cors = require('cors');
const config = require('./config');
const { globalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const cardsRoutes = require('./routes/cards');
const chatRoutes = require('./routes/chat');
const eventsRoutes = require('./routes/events');
const tagsRoutes = require('./routes/tags');
const adminCardsRoutes = require('./routes/admin/cards');
const adminAnalyticsRoutes = require('./routes/admin/analytics');
const adminTagsRoutes = require('./routes/admin/tags');
const adminRagTestRoutes = require('./routes/admin/ragTest');

const app = express();

app.use(cors({
  origin: config.cors.origins,
  credentials: true
}));
app.use(express.json({ limit: '2mb' }));
app.use(globalLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/cards', cardsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/admin', adminCardsRoutes);
app.use('/api/admin', adminAnalyticsRoutes);
app.use('/api/admin/tags', adminTagsRoutes);
app.use('/api/admin/rag-test', adminRagTestRoutes);

app.use(errorHandler);

module.exports = app;
