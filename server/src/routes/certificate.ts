import { Router } from "express"

import type { AuthenticatedRequest } from "../middleware/auth.js"

import { prisma } from "../prisma.js"
import { getPdf } from "../r2.js"
import { issueCertificate } from "../services/certificate.js"

const router = Router()

function getStringParam(
  value: string | string[] | undefined,
): string | null {
  if (typeof value === "string") {
    return value
  }

  return null
}

/*
 * GET /api/events/:eventId/certificates
 *
 * Get all certificates belonging to an event.
 */
router.get(
  "/:eventId/certificates",
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

      const event = await prisma.event.findFirst({
        where: {
          id: eventId,
          organizerId,
        },
        select: {
          id: true,
          name: true,
          organization: true,
        },
      })

      if (!event) {
        res.status(404).json({
          success: false,
          message: "Event not found",
        })
        return
      }

      const certificates = await prisma.certificate.findMany({
        where: {
          eventId,
        },
        include: {
          participant: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          issuedAt: "desc",
        },
      })

      res.json({
        success: true,
        event,
        certificates: certificates.map((certificate) => ({
          id: certificate.id,
          certificateId: certificate.certificateId,
          participantId: certificate.participantId,
          participant: certificate.participant.name,
          email: certificate.participant.email,
          issuedAt: certificate.issuedAt,
          verifiedAt: certificate.verifiedAt,
          status: certificate.status,
        })),
      })
    } catch (error) {
      console.error("Fetch certificates error:", error)

      res.status(500).json({
        success: false,
        message: "Unable to load certificates",
      })
    }
  },
)

/*
 * POST /api/events/:eventId/certificates/issue
 *
 * Issue certificates to selected participants.
 */
router.post(
  "/:eventId/certificates/issue",
  async (req: AuthenticatedRequest, res) => {
    try {
      const organizerId = req.organizerId
      const eventId = getStringParam(req.params.eventId)
      const { participantIds } = req.body

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
          (id: unknown) => typeof id !== "string",
        )
      ) {
        res.status(400).json({
          success: false,
          message: "participantIds must contain valid IDs",
        })
        return
      }

      const event = await prisma.event.findFirst({
        where: {
          id: eventId,
          organizerId,
        },
      })

      if (!event) {
        res.status(404).json({
          success: false,
          message: "Event not found",
        })
        return
      }

      const results: Array<{
        participantId: string
        certificateId: string
        accessCode?: string
      }> = []

      const errors: Array<{
        participantId: string
        message: string
      }> = []

      for (const participantId of participantIds as string[]) {
        try {
          const participant = await prisma.participant.findFirst({
            where: {
              id: participantId,
              eventId,
            },
          })

          if (!participant) {
            throw new Error(
              "Participant not found for this event",
            )
          }

          const certificate = await issueCertificate(
            participantId,
            organizerId,
          )

          const result: {
            participantId: string
            certificateId: string
            accessCode?: string
          } = {
            participantId,
            certificateId: certificate.certificateId,
          }

          if (
            "accessCode" in certificate &&
            typeof certificate.accessCode === "string"
          ) {
            result.accessCode = certificate.accessCode
          }

          results.push(result)
        } catch (error) {
          errors.push({
            participantId,
            message:
              error instanceof Error
                ? error.message
                : "Unable to issue certificate",
          })
        }
      }

      res.status(201).json({
        success: true,
        issued: results,
        errors,
      })
    } catch (error) {
      console.error("Certificate issuance error:", error)

      res.status(500).json({
        success: false,
        message: "Unable to issue certificates",
      })
    }
  },
)

/*
 * PATCH /api/events/:eventId/certificates/:certificateId/revoke
 */
router.patch(
  "/:eventId/certificates/:certificateId/revoke",
  async (req: AuthenticatedRequest, res) => {
    try {
      const organizerId = req.organizerId
      const eventId = getStringParam(req.params.eventId)
      const certificateId = getStringParam(req.params.certificateId)

      if (!organizerId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        })
        return
      }

      if (!eventId || !certificateId) {
        res.status(400).json({
          success: false,
          message: "Invalid event or certificate ID",
        })
        return
      }

      const certificate = await prisma.certificate.findFirst({
        where: {
          eventId,
          certificateId,
          event: { organizerId },
        },
      })

      if (!certificate) {
        res.status(404).json({
          success: false,
          message: "Certificate not found",
        })
        return
      }

      if (certificate.status === "REVOKED") {
        res.status(409).json({
          success: false,
          message: "Certificate is already revoked",
        })
        return
      }

      if (certificate.status === "REMOVED") {
        res.status(409).json({
          success: false,
          message: "Removed certificates cannot be revoked",
        })
        return
      }

      const updated = await prisma.certificate.update({
        where: { id: certificate.id },
        data: { status: "REVOKED" },
      })

      res.json({
        success: true,
        message: "Certificate revoked successfully",
        certificate: {
          id: updated.id,
          certificateId: updated.certificateId,
          status: updated.status,
        },
      })
    } catch (error) {
      console.error("Certificate revoke error:", error)
      res.status(500).json({
        success: false,
        message: "Unable to revoke certificate",
      })
    }
  },
)

/*
 * GET /api/events/:eventId/certificates/:certificateId/pdf
 *
 * Stream a certificate PDF from R2.
 */
router.get(
  "/:eventId/certificates/:certificateId/pdf",
  async (req: AuthenticatedRequest, res) => {
    try {
      const organizerId = req.organizerId
      const eventId = getStringParam(req.params.eventId)
      const certificateId = getStringParam(
        req.params.certificateId,
      )

      if (!organizerId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        })
        return
      }

      if (!eventId || !certificateId) {
        res.status(400).json({
          success: false,
          message: "Invalid event or certificate ID",
        })
        return
      }

      const certificate = await prisma.certificate.findFirst({
        where: {
          eventId,
          certificateId,
          event: {
            organizerId,
          },
        },
      })

      if (!certificate) {
        res.status(404).json({
          success: false,
          message: "Certificate not found",
        })
        return
      }

      if (!certificate.pdfKey) {
        res.status(404).json({
          success: false,
          message: "Certificate PDF is not available",
        })
        return
      }

      const object = await getPdf(certificate.pdfKey)

      if (!object.Body) {
        res.status(404).json({
          success: false,
          message: "Certificate PDF is not available",
        })
        return
      }

      const body = object.Body

      if (typeof body.transformToByteArray !== "function") {
        res.status(500).json({
          success: false,
          message: "Unable to read certificate PDF",
        })
        return
      }

      const bytes = await body.transformToByteArray()

      res.setHeader("Content-Type", "application/pdf")

      res.setHeader(
        "Content-Disposition",
        `inline; filename="${certificate.certificateId}.pdf"`,
      )

      res.send(Buffer.from(bytes))
    } catch (error) {
      console.error("Certificate PDF fetch error:", error)

      res.status(500).json({
        success: false,
        message: "Unable to load certificate PDF",
      })
    }
  },
)

export default router
