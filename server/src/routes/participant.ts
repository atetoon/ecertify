import { Router } from "express"

import type { AuthenticatedRequest } from "../middleware/auth.js"

import { prisma } from "../prisma.js"

const router = Router()

function getStringParam(
  value: string | string[] | undefined,
): string | null {
  if (typeof value === "string") {
    return value
  }

  return null
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
  })
}

/*
 * GET /api/events/:eventId/participants
 */
router.get(
  "/:eventId/participants",
  async (req: AuthenticatedRequest, res) => {
    try {
      const organizerId = req.organizerId
      const eventId = getStringParam(req.params.eventId)

      if (!organizerId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        })
        return
      }

      if (!eventId) {
        res.status(400).json({
          success: false,
          message: "Invalid event ID",
        })
        return
      }

      const event = await getOwnedEvent(
        eventId,
        organizerId,
      )

      if (!event) {
        res.status(404).json({
          success: false,
          message: "Event not found",
        })
        return
      }

      const participants =
        await prisma.participant.findMany({
          where: {
            eventId,
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            name: true,
            email: true,
            eligible: true,
            createdAt: true,
          },
        })

      res.json({
        success: true,
        participants,
        total: participants.length,
        eligible: participants.filter(
          (participant) => participant.eligible,
        ).length,
      })
    } catch (error) {
      console.error(
        "Fetch participants error:",
        error,
      )

      res.status(500).json({
        success: false,
        message: "Unable to load participants",
      })
    }
  },
)

/*
 * PATCH /api/events/:eventId/participants/:participantId
 */
router.patch(
  "/:eventId/participants/:participantId",
  async (req: AuthenticatedRequest, res) => {
    try {
      const organizerId = req.organizerId
      const eventId = getStringParam(req.params.eventId)
      const participantId = getStringParam(
        req.params.participantId,
      )

      const { eligible } = req.body

      if (!organizerId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        })
        return
      }

      if (!eventId || !participantId) {
        res.status(400).json({
          success: false,
          message: "Invalid event or participant ID",
        })
        return
      }

      if (typeof eligible !== "boolean") {
        res.status(400).json({
          success: false,
          message: "Eligible must be a boolean",
        })
        return
      }

      const event = await getOwnedEvent(
        eventId,
        organizerId,
      )

      if (!event) {
        res.status(404).json({
          success: false,
          message: "Event not found",
        })
        return
      }

      const participant =
        await prisma.participant.findFirst({
          where: {
            id: participantId,
            eventId,
          },
        })

      if (!participant) {
        res.status(404).json({
          success: false,
          message: "Participant not found",
        })
        return
      }

      const updated =
        await prisma.participant.update({
          where: {
            id: participant.id,
          },
          data: {
            eligible,
          },
          select: {
            id: true,
            name: true,
            email: true,
            eligible: true,
            createdAt: true,
          },
        })

      res.json({
        success: true,
        participant: updated,
      })
    } catch (error) {
      console.error(
        "Update participant eligibility error:",
        error,
      )

      res.status(500).json({
        success: false,
        message:
          "Unable to update participant eligibility",
      })
    }
  },
)

/*
 * PATCH /api/events/:eventId/participants
 *
 * Bulk update participant eligibility.
 */
router.patch(
  "/:eventId/participants",
  async (req: AuthenticatedRequest, res) => {
    try {
      const organizerId = req.organizerId
      const eventId = getStringParam(req.params.eventId)

      const { participantIds, eligible } = req.body

      if (!organizerId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        })
        return
      }

      if (!eventId) {
        res.status(400).json({
          success: false,
          message: "Invalid event ID",
        })
        return
      }

      if (!Array.isArray(participantIds)) {
        res.status(400).json({
          success: false,
          message: "participantIds must be an array",
        })
        return
      }

      if (
        participantIds.some(
          (id) => typeof id !== "string",
        )
      ) {
        res.status(400).json({
          success: false,
          message:
            "participantIds must contain valid participant IDs",
        })
        return
      }

      if (typeof eligible !== "boolean") {
        res.status(400).json({
          success: false,
          message: "Eligible must be a boolean",
        })
        return
      }

      const event = await getOwnedEvent(
        eventId,
        organizerId,
      )

      if (!event) {
        res.status(404).json({
          success: false,
          message: "Event not found",
        })
        return
      }

      if (participantIds.length === 0) {
        res.json({
          success: true,
          updated: 0,
        })
        return
      }

      const result =
        await prisma.participant.updateMany({
          where: {
            eventId,
            id: {
              in: participantIds,
            },
          },
          data: {
            eligible,
          },
        })

      res.json({
        success: true,
        updated: result.count,
      })
    } catch (error) {
      console.error(
        "Bulk participant eligibility error:",
        error,
      )

      res.status(500).json({
        success: false,
        message:
          "Unable to update participant eligibility",
      })
    }
  },
)

export default router