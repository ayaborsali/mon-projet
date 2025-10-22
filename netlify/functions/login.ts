import { MongoClient } from "mongodb";

// URL de ta base MongoDB (mettre dans Netlify Environment Variables)
const MONGODB_URI = process.env.MONGO_URI;

const client = new MongoClient(MONGODB_URI);

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { email, password } = JSON.parse(event.body);

    await client.connect();
    const db = client.db("smartparking");
    const users = db.collection("users");

    const user = await users.findOne({ email, password });

    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ success: false, error: "Email ou mot de passe invalide" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        token: "fake-jwt-token", // tu peux générer un vrai JWT ici
        user: { email: user.email, role: user.role },
      }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ success: false, error: "Erreur serveur" }) };
  }
}
