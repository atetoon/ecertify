import "dotenv/config";

import cors from "cors";
import express from "express";

import { comparePassword, createToken, hashPassword } from "./auth.js";
import { requireAuth } from "./middleware/auth.js";
import { prisma } from "./prisma.js";

import eventsRouter from "./routes/events.js";
import registrationRouter from "./routes/registration.js";
import templateRouter from "./routes/template.js";
import participantRouter from "./routes/participant.js";
import certificateRouter from "./routes/certificate.js";
import publicCertificateRouter from "./routes/publicCertificate.js";
import publicAccessRouter from "./routes/publicAccess.js";
import dashboardRouter from "./routes/dashboard.js";

const app = express();

const port = Number(process.env.PORT ?? 5001);

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.CLIENT_URL,
].filter((origin): origin is string => Boolean(origin)));

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without an Origin header (e.g. local CLI tools).
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  }),
);

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "Welcome to the eCERTIFY API",
  });
});

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      message: "eCERTIFY API is running",
      database: "connected",
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed",
      database: "disconnected",
    });
  }
});

/*
 * Public routes
 */
app.use("/api/register", registrationRouter);
app.use("/api/certificates", publicCertificateRouter);
app.use("/api/certificates/access", publicAccessRouter);

/*
 * Organizer authentication
 */
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      res.status(400).json({
        success: false,
        message: "Email is required",
      });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
      return;
    }

    const existingOrganizer = await prisma.organizer.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingOrganizer) {
      res.status(409).json({
        success: false,
        message: "An organizer with this email already exists",
      });
      return;
    }

    const passwordHash = await hashPassword(password);

    const organizer = await prisma.organizer.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
      },
    });

    const token = createToken(organizer.id);

    res.status(201).json({
      success: true,
      token,
      organizer: {
        id: organizer.id,
        name: organizer.name,
        email: organizer.email,
      },
    });
  } catch (error) {
    console.error("Organizer registration error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to create organizer",
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const organizer = await prisma.organizer.findUnique({
      where: { email: normalizedEmail },
    });

    if (!organizer) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    const validPassword = await comparePassword(
      password,
      organizer.passwordHash,
    );

    if (!validPassword) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    const token = createToken(organizer.id);

    res.json({
      success: true,
      token,
      organizer: {
        id: organizer.id,
        name: organizer.name,
        email: organizer.email,
      },
    });
  } catch (error) {
    console.error("Organizer login error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to login",
    });
  }
});

/*
 * Organizer protected routes
 */
app.use("/api/dashboard", requireAuth, dashboardRouter);
app.use("/api/events", requireAuth, eventsRouter);
app.use("/api/events", requireAuth, participantRouter);
app.use("/api/events", requireAuth, certificateRouter);
app.use("/api/events", requireAuth, templateRouter);

app.listen(port, () => {
  console.log(`eCERTIFY server running on http://localhost:${port}`);
});