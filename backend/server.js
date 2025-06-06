const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/Users');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => console.log('Connecté à MongoDB'));
mongoose.connection.on('error', (err) => console.error('Erreur de connexion:', err));

const authMiddleware = require('./authMiddleware');

const app = express();
app.use(cors());
app.use(express.json());

// Inscription
app.post('/api/register', async (req, res) => {
  console.log('Requête d\'inscription reçue:', req.body);
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'Utilisateur déjà existant' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({ name, email, password: hashedPassword });
  await newUser.save();

  res.json({ success: true });
});


// Connexion
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Identifiants invalides' });
  }

  const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });

  res.json({ token });
});


// Ajout d'un endpoint pour récupérer l'utilisateur connecté.
app.get('/api/me', authMiddleware, async (req, res) => {
  const user = await User.findOne({ email: req.user.email });
  if (!user) {
    return res.status(404).json({ message: 'Utilisateur introuvable' });
  }

  res.json({ name: user.name, email: user.email });
});

// Mise à jour utilisateur
app.put('/api/users', authMiddleware, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const updates = {};
    
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (password) updates.password = await bcrypt.hash(password, 10);
    
    const user = await User.findOneAndUpdate(
      { email: req.user.email },
      updates,
      { new: true }
    );
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Suppression utilisateur
app.delete('/api/users', authMiddleware, async (req, res) => {
  try {
    await User.findOneAndDelete({ email: req.user.email });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


app.listen(3000, () => {
  console.log('Backend running on http://localhost:3000');
});
