import { Router } from "express"
import { Prisma } from "../generated/prisma/client.js"

import { prisma } from "../prisma.js"
import type { AuthenticatedRequest } from "../middleware/auth.js"

const router = Router()

type RegistrationFieldType =
  | "SHORT_TEXT"
  | "LONG_TEXT"
  | "EMAIL"
  | "NUMBER"
  | "PHONE"
  | "DATE"
  | "DROPDOWN"
  | "CHECKBOX"
  | "RADIO"

const validFieldTypes: RegistrationFieldType[] = [
  "SHORT_TEXT",
  "LONG_TEXT",
  "EMAIL",
  "NUMBER",
  "PHONE",
  "DATE",
  "DROPDOWN",
  "CHECKBOX",
  "RADIO",
]

function getEventId(req: AuthenticatedRequest): string | null {
  const { eventId } = req.params

  if (typeof eventId !== "string") {
    return null
  }

  return eventId
}

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

async function createUniqueSlug(name: string): Promise<string> {
  const baseSlug = createSlug(name)

  let slug = baseSlug
  let counter = 2

  while (await prisma.event.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}

router.post("/", async (req: AuthenticatedRequest, res) => {
  try {
    const organizerId = req.organizerId

    if (!organizerId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      })
      return
    }

    const { name, description, date, organization } = req.body

    if (!name || !date || !organization) {
      res.status(400).json({
        success: false,
        message: "Name, date and organization are required",
      })
      return
    }

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
      res.status(400).json({
        success: false,
        message: "Invalid event date",
      })
      return
    }

    const slug = await createUniqueSlug(String(name))

    const event = await prisma.event.create({
      data: {
        organizerId,
        name: String(name).trim(),
        slug,
        description: description
          ? String(description).trim()
          : null,
        date: parsedDate,
        organization: String(organization).trim(),
      },
    })

    res.status(201).json({
      success: true,
      event,
    })
  } catch (error) {
    console.error("Create event error:", error)

    res.status(500).json({
      success: false,
      message: "Unable to create event",
    })
  }
})

router.get("/", async (req: AuthenticatedRequest, res) => {
  try {
    const organizerId = req.organizerId

    if (!organizerId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      })
      return
    }

    const events = await prisma.event.findMany({
      where: { organizerId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            participants: true,
            certificates: true,
          },
        },
      },
    })

    res.json({
      success: true,
      events,
    })
  } catch (error) {
    console.error("Get events error:", error)

    res.status(500).json({
      success: false,
      message: "Unable to fetch events",
    })
  }
})

router.get("/:eventId/registration", async (
  req: AuthenticatedRequest,
  res,
) => {
  try {
    const organizerId = req.organizerId
    const eventId = getEventId(req)

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
      event,
    })
  } catch (error) {
    console.error("Get registration settings error:", error)

    res.status(500).json({
      success: false,
      message: "Unable to fetch registration settings",
    })
  }
})

router.put("/:eventId/registration", async (
  req: AuthenticatedRequest,
  res,
) => {
  try {
    const organizerId = req.organizerId
    const eventId = getEventId(req)

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

    const existingEvent = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizerId,
      },
    })

    if (!existingEvent) {
      res.status(404).json({
        success: false,
        message: "Event not found",
      })
      return
    }

    const {
      name,
      description,
      date,
      organization,
      fields,
    } = req.body

    if (!name || !date || !organization) {
      res.status(400).json({
        success: false,
        message: "Name, date and organization are required",
      })
      return
    }

    if (!Array.isArray(fields)) {
      res.status(400).json({
        success: false,
        message: "Fields must be an array",
      })
      return
    }

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) {
      res.status(400).json({
        success: false,
        message: "Invalid event date",
      })
      return
    }

    for (const field of fields) {
      if (
        !field ||
        typeof field.label !== "string" ||
        !field.label.trim()
      ) {
        res.status(400).json({
          success: false,
          message: "Every registration field needs a label",
        })
        return
      }

      if (
        typeof field.type !== "string" ||
        !validFieldTypes.includes(field.type)
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid registration field type",
        })
        return
      }

      if (typeof field.required !== "boolean") {
        res.status(400).json({
          success: false,
          message: "Invalid required value",
        })
        return
      }
    }

    const event = await prisma.$transaction(async (tx) => {
      await tx.event.update({
        where: {
          id: eventId,
        },
        data: {
          name: String(name).trim(),
          description: description
            ? String(description).trim()
            : null,
          date: parsedDate,
          organization: String(organization).trim(),
        },
      })

      await tx.registrationField.deleteMany({
        where: {
          eventId,
        },
      })

      if (fields.length > 0) {
        await tx.registrationField.createMany({
          data: fields.map(
            (
              field: {
                label: string
                type: RegistrationFieldType
                required: boolean
                options?: unknown
              },
              index: number,
            ) => ({
              eventId,
              label: field.label.trim(),
              type: field.type,
              required: field.required,
              options:
                Array.isArray(field.options)
                  ? field.options
                  : Prisma.JsonNull,
              position: index,
            }),
          ),
        })
      }

      return tx.event.findUniqueOrThrow({
        where: {
          id: eventId,
        },
        include: {
          fields: {
            orderBy: {
              position: "asc",
            },
          },
        },
      })
    })

    res.json({
      success: true,
      event,
    })
  } catch (error) {
    console.error("Save registration settings error:", error)

    res.status(500).json({
      success: false,
      message: "Unable to save registration settings",
    })
  }
})

router.get("/:eventId", async (req: AuthenticatedRequest, res) => {
  try {
    const organizerId = req.organizerId
    const eventId = getEventId(req)

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
      include: {
        _count: {
          select: {
            participants: true,
            certificates: true,
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

    const verifiedCount = await prisma.certificate.count({
      where: {
        eventId,
        status: "VERIFIED",
      },
    })

    res.json({
      success: true,
      event: {
        ...event,
        verifiedCount,
      },
    })
  } catch (error) {
    console.error("Get event error:", error)

    res.status(500).json({
      success: false,
      message: "Unable to fetch event",
    })
  }
})

router.put("/:eventId", async (req: AuthenticatedRequest, res) => {
  try {
    const organizerId = req.organizerId
    const eventId = getEventId(req)

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

    const existingEvent = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizerId,
      },
    })

    if (!existingEvent) {
      res.status(404).json({
        success: false,
        message: "Event not found",
      })
      return
    }

    const {
      name,
      description,
      date,
      organization,
      status,
    } = req.body

    const updateData: {
      name?: string
      description?: string | null
      date?: Date
      organization?: string
      status?: "DRAFT" | "REGISTRATION_OPEN" | "REGISTRATION_CLOSED" | "COMPLETED"    } = {}

    if (name !== undefined) {
      updateData.name = String(name).trim()
    }

    if (description !== undefined) {
      updateData.description = description
        ? String(description).trim()
        : null
    }

    if (date !== undefined) {
      const parsedDate = new Date(date)

      if (Number.isNaN(parsedDate.getTime())) {
        res.status(400).json({
          success: false,
          message: "Invalid event date",
        })
        return
      }

      updateData.date = parsedDate
    }

    if (organization !== undefined) {
      updateData.organization = String(organization).trim()
    }

    if (status !== undefined) {
      if (
        status !== "DRAFT" &&
        status !== "REGISTRATION_OPEN" &&
        status !== "REGISTRATION_CLOSED" &&
        status !== "COMPLETED"
      ) {
        res.status(400).json({
          success: false,
          message: "Invalid event status",
        })
        return
      }

      updateData.status = status
    }

    const event = await prisma.event.update({
      where: {
        id: eventId,
      },
      data: updateData,
    })

    res.json({
      success: true,
      event,
    })
  } catch (error) {
    console.error("Update event error:", error)

    res.status(500).json({
      success: false,
      message: "Unable to update event",
    })
  }
})

router.delete("/:eventId", async (req: AuthenticatedRequest, res) => {
  try {
    const organizerId = req.organizerId
    const eventId = getEventId(req)

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
    })

    if (!event) {
      res.status(404).json({
        success: false,
        message: "Event not found",
      })
      return
    }

    await prisma.event.delete({
      where: {
        id: eventId,
      },
    })

    res.json({
      success: true,
      message: "Event deleted successfully",
    })
  } catch (error) {
    console.error("Delete event error:", error)

    res.status(500).json({
      success: false,
      message: "Unable to delete event",
    })
  }
})

export default router