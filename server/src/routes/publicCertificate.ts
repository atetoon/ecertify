import { Router } from "express"

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

/*
 * GET /api/certificates/:certificateId
 *
 * Public certificate verification.
 *
 * No authentication required.
 */
router.get(
  "/:certificateId",
  async (req, res) => {
    try {
      const certificateId = getStringParam(
        req.params.certificateId,
      )

      if (!certificateId) {
        res.status(400).json({
          success: false,
          message: "Invalid certificate ID",
        })
        return
      }

      const certificate =
        await prisma.certificate.findUnique({
          where: {
            certificateId,
          },
          include: {
            participant: {
              select: {
                name: true,
              },
            },
            event: {
              select: {
                name: true,
                organization: true,
                date: true,
              },
            },
          },
        })

      if (!certificate) {
        res.status(404).json({
          success: false,
          status: "INVALID",
          message: "Certificate not found",
        })
        return
      }

      /*
       * The certificate can be publicly verified when it is
       * currently issued or has previously been verified.
       */
      if (
        certificate.status === "REVOKED"
      ) {
        res.json({
          success: true,
          status: "REVOKED",
          certificate: {
            certificateId: certificate.certificateId,
            recipient: certificate.participant.name,
            event: certificate.event.name,
            organization: certificate.event.organization,
            issuedDate: certificate.issuedAt,
            revokedDate: null,
          },
        })
        return
      }

      if (
        certificate.status === "REMOVED"
      ) {
        res.json({
          success: true,
          status: "REMOVED",
          certificate: {
            certificateId: certificate.certificateId,
          },
        })
        return
      }

      /*
       * Mark the certificate as verified after a successful
       * public verification.
       */
      if (certificate.status === "ISSUED") {
        await prisma.certificate.update({
          where: {
            id: certificate.id,
          },
          data: {
            status: "VERIFIED",
            verifiedAt: new Date(),
          },
        })
      }

      res.json({
        success: true,
        status: "VERIFIED",
        certificate: {
          certificateId: certificate.certificateId,
          recipient: certificate.participant.name,
          event: certificate.event.name,
          organization: certificate.event.organization,
          issuedDate: certificate.issuedAt,
          revokedDate: null,
        },
      })
    } catch (error) {
      console.error(
        "Public certificate verification error:",
        error,
      )

      res.status(500).json({
        success: false,
        message: "Unable to verify certificate",
      })
    }
  },
)

export default router