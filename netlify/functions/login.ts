import { Handler } from "@netlify/functions";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs"; // pour vérifier le mot de passe hashé

// Récupérer l'URL MongoDB depuis les variables d'environnement
const MONGODB_URI = process.env.MONGODB_URI || "";
const DB_NAME = process.env.DB_NAME || "smartparking";

let client: MongoClient;

const handler: Handler = async (event, context) => {
  try {
    // Autoriser uniquement POST
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method Not Allowed" }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Données manquantes" }),
      };
    }

    const { email, password } = JSON.parse(event.body);

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email et mot de passe requis" }),
      };
    }

    // Connexion à MongoDB (singleton)
    if (!client) {
      client = new MongoClient(MONGODB_URI);
      await client.connect();
    }
    const db = client.db(DB_NAME);
    const usersCollection = db.collection("users");

    // Chercher l'utilisateur par email
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Email ou mot de passe incorrect" }),
      };
    }

    // Vérifier le mot de passe (si hashé)
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Email ou mot de passe incorrect" }),
      };
    }

    // Générer un token simple (exemple, pour prod utiliser JWT)
    const token = Buffer.from(`${user._id}:${user.role}`).toString("base64");

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          name: user.name,
        },
      }),
    };
  } catch (err: any) {
    console.error("Erreur login function:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur serveur" }),
    };
  }
};

export { handler };
