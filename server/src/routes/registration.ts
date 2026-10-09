import { Router } from "express"
import bcrypt from "bcrypt"
import { randomInt } from "node:crypto"

import { prisma } from "../prisma.js"
import { sendAccessCodeEmail } from "../email.js"

const router = Router()

const ACCESS_CODE_LENGTH = 8
const ACCESS_CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

type ResponseValue = string | boolean

function getStringParam(
  value: string | string[] | undefined,
): string | null {
  return typeof value === "string" ? value : null
}

function generateAccessCode(): string {
  let code = ""

  for (let i = 0; i < ACCESS_CODE_LENGTH; i++) {
    code += ACCESS_CODE_CHARS[randomInt(ACCESS_CODE_CHARS.length)]
  }

  return code
}

function normaliseLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
}

function getFieldValue(
  responses: Record<string, ResponseValue>,
  fieldId: string,
): ResponseValue | undefined {
  return responses[fieldId]
}

function isEmptyValue(value: ResponseValue | undefined): boolean {
  if (typeof value === "boolean") {
    return false
  }

  return value === undefined || value.trim() === ""
}

/*
 * GET /api/register/:eventSlug
 *
 * Public registration form.
 */
router.get(
  "/:eventSlug",
  async (req, res) => {
    try {
      const eventSlug = getStringParam(req.params.eventSlug)

      if (!eventSlug) {
        res.status(400).json({
          success: false,
          message: "Invalid event slug",
        })
        return
      }

      const event = await prisma.event.findUnique({
        where: {
          slug: eventSlug,
        },
        include: {
          fields: {
            orderBy: {
              position: "asc",
            },
          },
        },
      })

      if (!event) {
        res.status(404).json({
          success: false,
          message: "Event not found",
        })
        return
      }

      res.json({
        success: true,
        event: {
          id: event.id,
          name: event.name,
          slug: event.slug,
          description: event.description,
          date: event.date,
          organization: event.organization,
          status: event.status,
          fields: event.fields.map((field) => ({
            id: field.id,
            label: field.label,
            type: field.type,
            required: field.required,
            options: field.options,
            position: field.position,
          })),
        },
      })
    } catch (error) {
      console.error("Load registration form error:", error)

      res.status(500).json({
        success: false,
        message: "Unable to load registration form",
      })
    }
  },
)

/*
 * POST /api/register/:eventSlug
 *
 * Submit a public registration.
 */
router.post(
  "/:eventSlug",
  async (req, res) => {
    try {
      const eventSlug = getStringParam(req.params.eventSlug)

      if (!eventSlug) {
        res.status(400).json({
          success: false,
          message: "Invalid event slug",
        })
        return
      }

      const { responses } = req.body as {
        responses?: Record<string, ResponseValue>
      }

      if (
        !responses ||
        typeof responses !== "object" ||
        Array.isArray(responses)
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid registration responses",
        })
        return
      }

      const event = await prisma.event.findUnique({
        where: {
          slug: eventSlug,
        },
        include: {
          fields: {
            orderBy: {
              position: "asc",
            },
          },
        },
      })

      if (!event) {
        res.status(404).json({
          success: false,
          message: "Event not found",
        })
        return
      }

      /*
       * Find the Name and Email fields using their actual field IDs.
       *
       * Name can be identified by:
       *   - label: Name
       *
       * Email can be identified by:
       *   - EMAIL field type
       *   - label: Email
       *
       * This is important because the frontend correctly stores
       * responses using field IDs, not "name" / "email" keys.
       */
      const nameField = event.fields.find(
        (field) =>
          normaliseLabel(field.label) === "name",
      )

      const emailField = event.fields.find(
        (field) =>
          field.type === "EMAIL" ||
          normaliseLabel(field.label) === "email",
      )

      if (!nameField || !emailField) {
        res.status(400).json({
          success: false,
          message:
            "Registration form must contain Name and Email fields",
        })
        return
      }

      const nameValue = getFieldValue(
        responses,
        nameField.id,
      )

      const emailValue = getFieldValue(
        responses,
        emailField.id,
      )

      if (isEmptyValue(nameValue)) {
        res.status(400).json({
          success: false,
          message: "Name is required",
        })
        return
      }

      if (isEmptyValue(emailValue)) {
        res.status(400).json({
          success: false,
          message: "Email is required",
        })
        return
      }

      if (
        typeof nameValue !== "string" ||
        typeof emailValue !== "string"
      ) {
        res.status(400).json({
          success: false,
          message: "Name and Email must be text values",
        })
        return
      }

      const name = nameValue.trim()
      const email = emailValue.trim().toLowerCase()

      /*
       * Validate every required field.
       */
      for (const field of event.fields) {
        if (!field.required) {
          continue
        }

        const value = getFieldValue(
          responses,
          field.id,
        )

        if (isEmptyValue(value)) {
          res.status(400).json({
            success: false,
            message: `${field.label} is required`,
          })
          return
        }
      }

      /*
       * Basic email validation.
       */
      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      if (!emailPattern.test(email)) {
        res.status(400).json({
          success: false,
          message: "Please enter a valid email address",
        })
        return
      }

      /*
       * Prevent duplicate registrations for the same event.
       */
      const existingParticipant =
        await prisma.participant.findFirst({
          where: {
            eventId: event.id,
            email,
          },
          select: {
            id: true,
          },
        })

      if (existingParticipant) {
        res.status(409).json({
          success: false,
          message:
            "This email address is already registered for this event",
        })
        return
      }

      /*
       * Generate an 8-character participant access code.
       *
       * Only the hash is stored in PostgreSQL.
       * The plaintext code is returned once and emailed to the participant.
       */
      let accessCode = ""
      let accessCodeHash = ""
      let created = false

      for (let attempt = 0; attempt < 10; attempt++) {
        const candidate = generateAccessCode()
        const candidateHash = await bcrypt.hash(
          candidate,
          12,
        )

        try {
          const participant =
            await prisma.participant.create({
              data: {
                eventId: event.id,
                name,
                email,
                responses,
                eligible: false,
                accessCodeHash: candidateHash,
              },
            })

          accessCode = candidate
          accessCodeHash = participant.accessCodeHash
          created = true
          break
        } catch (error) {
          /*
           * accessCodeHash is unique. If an extremely unlikely
           * collision occurs, generate another code.
           */
          const message =
            error instanceof Error
              ? error.message
              : ""

          if (
            !message
              .toLowerCase()
              .includes("accesscodehash")
          ) {
            throw error
          }
        }
      }

      if (!created || !accessCode || !accessCodeHash) {
        throw new Error(
          "Unable to generate a unique access code",
        )
      }

      /*
       * Email the access code.
       *
       * Email failure does NOT undo the registration.
       * The participant still receives the code in the API response,
       * while the server logs the email failure.
       */
      try {
        await sendAccessCodeEmail({
          email,
          name,
          eventName: event.name,
          accessCode,
        })
      } catch (error) {
        console.error(
          "Unable to send access code email:",
          error,
        )
      }

      res.status(201).json({
        success: true,
        message: "Registration successful",
        accessCode,
      })
    } catch (error) {
      console.error("Registration error:", error)

      res.status(500).json({
        success: false,
        message: "Unable to complete registration",
      })
    }
  },
)

export default router