// netlify/functions/login.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI; // ton URI MongoDB dans Netlify Environment Variables
let client;

export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { email, password } = JSON.parse(event.body || "{}");

    if (!email || !password) {
      return { statusCode: 400, body: JSON.stringify({ success: false, error: "Email ou mot de passe manquant" }) };
    }

    // Connecter à MongoDB (réutilisation si client déjà existant)
    if (!client) {
      client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
      await client.connect();
    }

    const db = client.db("smartparking"); // Nom de ta DB
    const usersCollection = db.collection("users");

    const user = await usersCollection.findOne({ email });

    if (!user || user.password !== password) { // ⚠️ hash password recommandé pour prod
      return { statusCode: 401, body: JSON.stringify({ success: false, error: "Identifiants incorrects" }) };
    }

    // Retourner le token et les infos utilisateur
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        token: "fake-jwt-token", // tu peux utiliser JWT pour prod
        user: { email: user.email, role: user.role, name: user.name }
      })
    };

  } catch (error) {
    console.error("Erreur login:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: "Erreur serveur" })
    };
  }
}
