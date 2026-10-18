
import { Router } from "express";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import { comparePassword, hashPassword } from "../auth.js";
import { prisma } from "../prisma.js";

const router = Router();

// GET /api/settings
router.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const organizerId = req.organizerId;

    if (!organizerId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const organizer = await prisma.organizer.findUnique({
      where: { id: organizerId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!organizer) {
      res.status(404).json({
        success: false,
        message: "Organizer not found",
      });
      return;
    }

    res.json({ success: true, organizer });
  } catch (error) {
    console.error("Fetch settings error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to load settings",
    });
  }
});

// PATCH /api/settings/profile
router.patch(
  "/profile",
  async (req: AuthenticatedRequest, res) => {
    try {
      const organizerId = req.organizerId;
      const { name } = req.body;

      if (!organizerId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      if (typeof name !== "string" || !name.trim()) {
        res.status(400).json({
          success: false,
          message: "A valid name is required",
        });
        return;
      }

      if (name.trim().length > 100) {
        res.status(400).json({
          success: false,
          message: "Name must be 100 characters or fewer",
        });
        return;
      }

      const organizer = await prisma.organizer.update({
        where: { id: organizerId },
        data: { name: name.trim() },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

      res.json({
        success: true,
        message: "Profile updated successfully",
        organizer,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to update profile",
      });
    }
  },
);

// POST /api/settings/password
router.post(
  "/password",
  async (req: AuthenticatedRequest, res) => {
    try {
      const organizerId = req.organizerId;
      const { currentPassword, newPassword } = req.body;

      if (!organizerId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      if (
        typeof currentPassword !== "string" ||
        typeof newPassword !== "string"
      ) {
        res.status(400).json({
          success: false,
          message: "Current and new passwords are required",
        });
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({
          success: false,
          message: "New password must be at least 8 characters",
        });
        return;
      }

      if (newPassword === currentPassword) {
        res.status(400).json({
          success: false,
          message: "New password must differ from current password",
        });
        return;
      }

      const organizer = await prisma.organizer.findUnique({
        where: { id: organizerId },
        select: {
          id: true,
          passwordHash: true,
        },
      });

      if (!organizer) {
        res.status(404).json({
          success: false,
          message: "Organizer not found",
        });
        return;
      }

      const validPassword = await comparePassword(
        currentPassword,
        organizer.passwordHash,
      );

      if (!validPassword) {
        res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
        return;
      }

      const passwordHash = await hashPassword(newPassword);

      await prisma.organizer.update({
        where: { id: organizerId },
        data: { passwordHash },
      });

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        success: false,
        message: "Unable to change password",
      });
    }
  },
);

export default router;