const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const app = express();

// Import routes
const authRoutes = require('./api/auth');
const grammarRoutes = require('./api/grammar');

// Security middleware
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://www.gstatic.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://identitytoolkit.googleapis.com'],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"]
    }
}));

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const rateLimit = require('express-rate-limit');
app.use('/api/', rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/grammar', grammarRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});