import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath, pathToFileURL } from "url";
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

const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(firebaseConfig.firestoreDatabaseId)
  : getFirestore();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- Plugin System ---
  const pluginsDir = path.join(process.cwd(), "plugins");

  async function loadPlugins() {
    console.log("Scanning for plugins...");
    if (!fs.existsSync(pluginsDir)) {
      fs.mkdirSync(pluginsDir);
    }

    const pluginFolders = fs.readdirSync(pluginsDir);
    for (const folder of pluginFolders) {
      const pluginPath = path.join(pluginsDir, folder, "index.ts");
      if (fs.existsSync(pluginPath)) {
        try {
          // In this environment, we might need to use dynamic import with tsx or similar
          // Since server.ts is run with tsx, we can import .ts files
          const pluginModule = await import(pathToFileURL(pluginPath).href);
          const { manifest } = pluginModule;

          if (manifest) {
            const pluginsRef = db.collection("plugins");
            const snapshot = await pluginsRef.where("name", "==", manifest.name).get();

            if (snapshot.empty) {
              await pluginsRef.add({
                ...manifest,
                status: "inactive",
                createdAt: new Date(),
              });
              console.log(`Registered plugin: ${manifest.name}`);
            } else {
              // Update existing manifest if needed
              await snapshot.docs[0].ref.update({
                ...manifest,
              });
              console.log(`Updated plugin: ${manifest.name}`);
            }
          }
        } catch (error) {
          console.error(`Failed to load plugin from ${folder}:`, error);
        }
      }
    }
  }

  // Run loader on startup
  await loadPlugins();

  // Plugin Management Endpoints
  app.get("/api/plugins", async (req, res) => {
    try {
      const snapshot = await db.collection("plugins").get();
      const plugins = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.json(plugins);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/plugins/:id/activate", async (req, res) => {
    try {
      const { id } = req.params;
      await db.collection("plugins").doc(id).update({ status: "active" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/plugins/:id/deactivate", async (req, res) => {
    try {
      const { id } = req.params;
      await db.collection("plugins").doc(id).update({ status: "inactive" });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Run plugin endpoint
  app.post("/api/plugins/:folder/run", async (req, res) => {
    try {
      const { folder } = req.params;
      const pluginPath = path.join(pluginsDir, folder, "index.ts");
      if (!fs.existsSync(pluginPath)) {
        return res.status(404).json({ error: "Plugin not found" });
      }

      const pluginModule = await import(pathToFileURL(pluginPath).href);
      if (typeof pluginModule.run === "function") {
        const result = await pluginModule.run(db, req.body);
        res.json(result);
      } else {
        res.status(400).json({ error: "Plugin does not export a run function" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

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
