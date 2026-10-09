import { Router } from "express"
import bcrypt from "bcrypt"

import { prisma } from "../prisma.js"
import { getPdf } from "../r2.js"

const router = Router()

const ACCESS_CODE_REGEX = /^[A-Z0-9]{8}$/

async function findParticipantByAccessCode(
  accessCode: string,
) {
  const participants =
    await prisma.participant.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        accessCodeHash: true,
        certificate: {
          select: {
            certificateId: true,
            issuedAt: true,
            verifiedAt: true,
            status: true,
            pdfKey: true,
          },
        },
        event: {
          select: {
            name: true,
          },
        },
      },
    })

  for (const participant of participants) {
    const matches = await bcrypt.compare(
      accessCode,
      participant.accessCodeHash,
    )

    if (matches) {
      return participant
    }
  }

  return null
}

/*
 * GET /api/certificates/access/:accessCode
 *
 * Find the certificate belonging to a participant's
 * private 8-character access code.
 */
router.get(
  "/:accessCode",
  async (req, res) => {
    try {
      const accessCode = String(
        req.params.accessCode ?? "",
      )
        .trim()
        .toUpperCase()

      if (!ACCESS_CODE_REGEX.test(accessCode)) {
        res.status(400).json({
          success: false,
          code: "INVALID_ACCESS_CODE",
          message:
            "Access code must be exactly 8 letters and numbers.",
        })
        return
      }

      const participant =
        await findParticipantByAccessCode(
          accessCode,
        )

      if (!participant) {
        res.status(404).json({
          success: false,
          code: "INVALID_ACCESS_CODE",
          message: "Invalid access code.",
        })
        return
      }

      const certificate =
        participant.certificate

      if (!certificate) {
        res.status(404).json({
          success: false,
          code: "NOT_ISSUED",
          message:
            "Your certificate has not been issued yet.",
        })
        return
      }

      if (certificate.status === "REVOKED") {
        res.status(403).json({
          success: false,
          code: "REVOKED",
          message:
            "This certificate has been revoked.",
        })
        return
      }

      if (certificate.status === "REMOVED") {
        res.status(404).json({
          success: false,
          code: "REMOVED",
          message:
            "This certificate is no longer available.",
        })
        return
      }

      if (!certificate.pdfKey) {
        res.status(404).json({
          success: false,
          code: "PDF_UNAVAILABLE",
          message:
            "Certificate PDF is not available yet.",
        })
        return
      }

      res.json({
        success: true,
        certificate: {
          certificateId:
            certificate.certificateId,
          participant: participant.name,
          event: participant.event.name,
          issuedAt: certificate.issuedAt,
          verifiedAt: certificate.verifiedAt,
          status: certificate.status,
        },
      })
    } catch (error) {
      console.error(
        "Public certificate access error:",
        error,
      )

      res.status(500).json({
        success: false,
        message:
          "Unable to retrieve certificate.",
      })
    }
  },
)

/*
 * GET /api/certificates/access/:accessCode/pdf
 *
 * Stream the participant's certificate PDF
 * directly from Cloudflare R2.
 */
router.get(
  "/:accessCode/pdf",
  async (req, res) => {
    try {
      const accessCode = String(
        req.params.accessCode ?? "",
      )
        .trim()
        .toUpperCase()

      if (!ACCESS_CODE_REGEX.test(accessCode)) {
        res.status(400).json({
          success: false,
          code: "INVALID_ACCESS_CODE",
          message:
            "Access code must be exactly 8 letters and numbers.",
        })
        return
      }

      const participant =
        await findParticipantByAccessCode(
          accessCode,
        )

      if (!participant) {
        res.status(404).json({
          success: false,
          code: "INVALID_ACCESS_CODE",
          message: "Invalid access code.",
        })
        return
      }

      const certificate =
        participant.certificate

      if (!certificate) {
        res.status(404).json({
          success: false,
          code: "NOT_ISSUED",
          message:
            "Your certificate has not been issued yet.",
        })
        return
      }

      if (certificate.status === "REVOKED") {
        res.status(403).json({
          success: false,
          code: "REVOKED",
          message:
            "This certificate has been revoked.",
        })
        return
      }

      if (certificate.status === "REMOVED") {
        res.status(404).json({
          success: false,
          code: "REMOVED",
          message:
            "This certificate is no longer available.",
        })
        return
      }

      if (!certificate.pdfKey) {
        res.status(404).json({
          success: false,
          code: "PDF_UNAVAILABLE",
          message:
            "Certificate PDF is not available yet.",
        })
        return
      }

      const object = await getPdf(
        certificate.pdfKey,
      )

      if (!object.Body) {
        res.status(404).json({
          success: false,
          code: "PDF_UNAVAILABLE",
          message:
            "Certificate PDF is not available.",
        })
        return
      }

      const body = object.Body

      if (
        typeof body.transformToByteArray !==
        "function"
      ) {
        res.status(500).json({
          success: false,
          message:
            "Unable to read certificate PDF.",
        })
        return
      }

      const bytes =
        await body.transformToByteArray()

      res.setHeader(
        "Content-Type",
        "application/pdf",
      )

      res.setHeader(
        "Content-Disposition",
        `inline; filename="${certificate.certificateId}.pdf"`,
      )

      res.send(Buffer.from(bytes))
    } catch (error) {
      console.error(
        "Public certificate PDF error:",
        error,
      )

      res.status(500).json({
        success: false,
        message:
          "Unable to retrieve certificate PDF.",
      })
    }
  },
)

export default router