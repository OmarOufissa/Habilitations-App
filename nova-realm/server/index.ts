import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { getDatabase } from "./db";

// Initialize database on server creation
let dbInitialized = false;

async function initializeDbOnce() {
  if (!dbInitialized) {
    try {
      await getDatabase();
      dbInitialized = true;
    } catch (err) {
      console.error("Failed to initialize database:", err);
    }
  }
}

export function createServer() {
  const app = express();

  // Initialize database
  initializeDbOnce();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Database ready middleware
  app.use(async (_req, _res, next) => {
    try {
      await initializeDbOnce();
      next();
    } catch (err) {
      console.error("Database not ready:", err);
      next();
    }
  });

  // Health check
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Seed database (development only)
  app.post("/api/seed", async (_req, res) => {
    try {
      await getDatabase(); // Ensure DB is initialized
      const { seedDatabase } = await import("./seed");
      seedDatabase();
      res.json({ message: "Database seeded successfully" });
    } catch (err) {
      console.error("Seeding error:", err);
      res.status(500).json({ message: "Error seeding database" });
    }
  });

  // Import employees from TSV/Excel data
  app.post("/api/import-employees", async (req, res) => {
    try {
      const { tsvData } = req.body;
      if (!tsvData) {
        return res.status(400).json({ message: "TSV data required" });
      }

      await getDatabase();
      const { parseEmployeesFromTSV, importEmployees } = await import(
        "./import-employees"
      );

      const employees = parseEmployeesFromTSV(tsvData);
      const result = await importEmployees(employees);

      res.json({
        message: "Import completed",
        ...result,
      });
    } catch (err) {
      console.error("Import error:", err);
      res.status(500).json({ message: "Error importing employees" });
    }
  });

  // Auth routes (lazy load)
  app.post("/api/auth/login", async (req, res) => {
    const { handleLogin } = await import("./routes/auth");
    handleLogin(req, res);
  });

  app.post("/api/auth/logout", async (req, res) => {
    const { handleLogout } = await import("./routes/auth");
    handleLogout(req, res);
  });

  app.post("/api/auth/refresh", async (req, res) => {
    const { handleRefresh } = await import("./routes/auth");
    handleRefresh(req, res);
  });

  // Protected employee routes (lazy load)
  app.get("/api/employees", async (req, res, next) => {
    const { authMiddleware, getEmployees } = await import(
      "./routes/employees"
    );
    authMiddleware(req, res, () => getEmployees(req, res));
  });

  app.post("/api/employees", async (req, res, next) => {
    const { authMiddleware, createEmployee } = await import(
      "./routes/employees"
    );
    authMiddleware(req, res, () => createEmployee(req, res));
  });

  app.get("/api/employees/:id", async (req, res) => {
    const { authMiddleware, getEmployee } = await import(
      "./routes/employees"
    );
    authMiddleware(req, res, () => getEmployee(req, res));
  });

  app.put("/api/employees/:id", async (req, res) => {
    const { authMiddleware, updateEmployee } = await import(
      "./routes/employees"
    );
    authMiddleware(req, res, () => updateEmployee(req, res));
  });

  app.delete("/api/employees/:id", async (req, res) => {
    const { authMiddleware, deleteEmployee } = await import(
      "./routes/employees"
    );
    authMiddleware(req, res, () => deleteEmployee(req, res));
  });

  // Organizational structure routes
  app.get("/api/divisions", async (req, res) => {
    const { getDivisions } = await import("./routes/employees");
    getDivisions(req, res);
  });

  app.get("/api/divisions/:divisionId/services", async (req, res) => {
    const { getServicesByDivision } = await import("./routes/employees");
    getServicesByDivision(req, res);
  });

  app.get("/api/services/:serviceId/sections", async (req, res) => {
    const { getSectionsByService } = await import("./routes/employees");
    getSectionsByService(req, res);
  });

  app.get("/api/sections/:sectionId/equipes", async (req, res) => {
    const { getEquipesBySection } = await import("./routes/employees");
    getEquipesBySection(req, res);
  });

  // Habilitation management routes
  app.post("/api/habilitations", async (req, res) => {
    const { authMiddleware, createHabilitation } = await import(
      "./routes/employees"
    );
    authMiddleware(req, res, () => createHabilitation(req, res));
  });

  app.put("/api/habilitations/:habId", async (req, res) => {
    const { authMiddleware, updateHabilitation } = await import(
      "./routes/employees"
    );
    authMiddleware(req, res, () => updateHabilitation(req, res));
  });

  app.delete("/api/habilitations/:habId", async (req, res) => {
    const { authMiddleware, deleteHabilitation } = await import(
      "./routes/employees"
    );
    authMiddleware(req, res, () => deleteHabilitation(req, res));
  });

  return app;
}
