// backend/routes/auth.js
const express = require('express');
const User = require('../models/User');
const router = express.Router();

// Route de connexion simple
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Tentative de connexion:', email);

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier le statut
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé'
      });
    }

    // Vérifier le mot de passe (simple comparaison)
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe incorrect'
      });
    }

    // Connexion réussie
    res.json({
      success: true,
      message: 'Connexion réussie!',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// Route pour vérifier si un utilisateur existe
router.post('/check-user', async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.findOne({ email });
    
    if (user) {
      res.json({
        exists: true,
        name: user.name
      });
    } else {
      res.json({
        exists: false
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;