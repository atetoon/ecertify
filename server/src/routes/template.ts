import express, { Router } from "express"

import type {
  AuthenticatedRequest,
} from "../middleware/auth.js"

import { prisma } from "../prisma.js"
import { uploadObject } from "../r2.js"

const router = Router()

const MAX_BACKGROUND_SIZE =
  15 * 1024 * 1024

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
])

function getEventId(
  req: AuthenticatedRequest,
): string | null {
  const value = req.params.eventId

  if (
    typeof value !== "string" ||
    value.length === 0
  ) {
    return null
  }

  return value
}

async function getOwnedEvent(
  eventId: string,
  organizerId: string,
) {
  return prisma.event.findFirst({
    where: {
      id: eventId,
      organizerId,
    },
    select: {
      id: true,
      name: true,
      organization: true,
      date: true,
    },
  })
}

/*
 * GET /api/events/:eventId/template
 */
router.get(
  "/:eventId/template",
  async (
    req: AuthenticatedRequest,
    res,
  ) => {
    try {
      const organizerId =
        req.organizerId

      if (!organizerId) {
        res.status(401).json({
          success: false,
          message:
            "Authentication required",
        })
        return
      }

      const eventId =
        getEventId(req)

      if (!eventId) {
        res.status(400).json({
          success: false,
          message:
            "Invalid event ID",
        })
        return
      }

      const event =
        await getOwnedEvent(
          eventId,
          organizerId,
        )

      if (!event) {
        res.status(404).json({
          success: false,
          message:
            "Event not found",
        })
        return
      }

      const template =
        await prisma.template.findUnique({
          where: {
            eventId,
          },
        })

      res.json({
        success: true,
        event,
        template,
      })
    } catch (error) {
      console.error(
        "Template fetch error:",
        error,
      )

      res.status(500).json({
        success: false,
        message:
          "Unable to load template",
      })
    }
  },
)

/*
 * PUT /api/events/:eventId/template
 */
router.put(
  "/:eventId/template",
  express.json({
    limit: "2mb",
  }),
  async (
    req: AuthenticatedRequest,
    res,
  ) => {
    try {
      const organizerId =
        req.organizerId

      if (!organizerId) {
        res.status(401).json({
          success: false,
          message:
            "Authentication required",
        })
        return
      }

      const eventId =
        getEventId(req)

      if (!eventId) {
        res.status(400).json({
          success: false,
          message:
            "Invalid event ID",
        })
        return
      }

      const event =
        await getOwnedEvent(
          eventId,
          organizerId,
        )

      if (!event) {
        res.status(404).json({
          success: false,
          message:
            "Event not found",
        })
        return
      }

      const {
        fields,
      } = req.body as {
        fields?: unknown
      }

      if (!Array.isArray(fields)) {
        res.status(400).json({
          success: false,
          message:
            "Template fields must be an array",
        })
        return
      }

      const template =
        await prisma.template.upsert({
          where: {
            eventId,
          },
          create: {
            eventId,
            version: 1,
            fields,
          },
          update: {
            fields,
            version: 1,
          },
        })

      res.json({
        success: true,
        template,
      })
    } catch (error) {
      console.error(
        "Template save error:",
        error,
      )

      res.status(500).json({
        success: false,
        message:
          "Unable to save template",
      })
    }
  },
)

/*
 * POST /api/events/:eventId/template/background
 *
 * Raw PDF / PNG / JPEG upload.
 */
router.post(
  "/:eventId/template/background",
  express.raw({
    type: [
      "application/pdf",
      "image/png",
      "image/jpeg",
    ],
    limit: "15mb",
  }),
  async (
    req: AuthenticatedRequest,
    res,
  ) => {
    try {
      const organizerId =
        req.organizerId

      if (!organizerId) {
        res.status(401).json({
          success: false,
          message:
            "Authentication required",
        })
        return
      }

      const eventId =
        getEventId(req)

      if (!eventId) {
        res.status(400).json({
          success: false,
          message:
            "Invalid event ID",
        })
        return
      }

      const event =
        await getOwnedEvent(
          eventId,
          organizerId,
        )

      if (!event) {
        res.status(404).json({
          success: false,
          message:
            "Event not found",
        })
        return
      }

      const header =
        req.headers["content-type"]

      if (typeof header !== "string") {
        res.status(400).json({
          success: false,
          message:
            "Content type is missing",
        })
        return
      }

      const contentType =
        header.split(";")[0]?.trim()

      if (
        typeof contentType !== "string" ||
        !ALLOWED_TYPES.has(contentType)
      ) {
        res.status(400).json({
          success: false,
          message:
            "Only PDF, PNG and JPEG files are supported",
        })
        return
      }

      if (!Buffer.isBuffer(req.body)) {
        res.status(400).json({
          success: false,
          message:
            "Background file is missing",
        })
        return
      }

      if (
        req.body.length >
        MAX_BACKGROUND_SIZE
      ) {
        res.status(413).json({
          success: false,
          message:
            "Background file is too large",
        })
        return
      }

      let extension: string

      if (
        contentType ===
        "application/pdf"
      ) {
        extension = "pdf"
      } else if (
        contentType ===
        "image/png"
      ) {
        extension = "png"
      } else {
        extension = "jpg"
      }

      const key =
        `templates/${eventId}/background.${extension}`

      await uploadObject(
        key,
        req.body,
        contentType,
      )

      const template =
        await prisma.template.upsert({
          where: {
            eventId,
          },
          create: {
            eventId,
            version: 1,
            fields: [],
            backgroundKey: key,
            backgroundType:
              contentType,
          },
          update: {
            backgroundKey: key,
            backgroundType:
              contentType,
          },
        })

      res.json({
        success: true,
        template,
      })
    } catch (error) {
      console.error(
        "Template background upload error:",
        error,
      )

      res.status(500).json({
        success: false,
        message:
          "Unable to upload template background",
      })
    }
  },
)

export default router