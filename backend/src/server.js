const express = require('express');
const cors = require('cors');
const path = require('path');
const complaintRoutes = require('./routes/complaintRoutes');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- THE FIX ---
// Since server.js is inside 'src', we use '..' to go UP one level 
// to find the 'uploads' folder in the root directory.
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Use Routes
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.use('/api/complaints', complaintRoutes);