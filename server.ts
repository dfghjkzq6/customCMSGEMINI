import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Note: In this environment, we use the client SDK configuration for the admin SDK 
// if service account is not provided, but here we can just use the environment's 
// default credentials or the projectId from the config.
// However, since we are in a Cloud Run environment, it should auto-detect.
// For simplicity in this specific AIS environment, we'll use the projectId from the config.
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };

initializeApp({
  projectId: firebaseConfig.projectId,
});

const db = getFirestore();
// Use the specific database ID if provided in the config
const firestore = firebaseConfig.firestoreDatabaseId 
  ? db.terminate().then(() => getFirestore(firebaseConfig.firestoreDatabaseId))
  : db;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- REST API Layer ---

  // Helper to get collection name from model
  const getCollectionName = async (modelName: string) => {
    const modelsRef = db.collection("dataModels");
    const snapshot = await modelsRef.where("collectionName", "==", modelName).get();
    if (snapshot.empty) return modelName; // Fallback to the name itself
    return snapshot.docs[0].data().collectionName;
  };

  // Generic CRUD endpoints
  app.get("/api/:collection", async (req, res) => {
    try {
      const { collection: colName } = req.params;
      const snapshot = await db.collection(colName).get();
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/:collection/:id", async (req, res) => {
    try {
      const { collection: colName, id } = req.params;
      const doc = await db.collection(colName).doc(id).get();
      if (!doc.exists) return res.status(404).json({ error: "Not found" });
      res.json({ id: doc.id, ...doc.data() });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/:collection", async (req, res) => {
    try {
      const { collection: colName } = req.params;
      const docRef = await db.collection(colName).add({
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const newDoc = await docRef.get();
      res.status(201).json({ id: newDoc.id, ...newDoc.data() });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/:collection/:id", async (req, res) => {
    try {
      const { collection: colName, id } = req.params;
      await db.collection(colName).doc(id).update({
        ...req.body,
        updatedAt: new Date(),
      });
      const updatedDoc = await db.collection(colName).doc(id).get();
      res.json({ id: updatedDoc.id, ...updatedDoc.data() });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/:collection/:id", async (req, res) => {
    try {
      const { collection: colName, id } = req.params;
      await db.collection(colName).doc(id).delete();
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
