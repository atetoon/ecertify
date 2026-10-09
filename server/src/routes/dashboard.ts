import { Router } from "express"
import type { AuthenticatedRequest } from "../middleware/auth.js"
import { prisma } from "../prisma.js"

const router = Router()

/*
 * GET /api/dashboard
 *
 * Returns genuine organizer-scoped dashboard statistics.
 */
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
      where: {
        organizerId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        organization: true,
        date: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            participants: true,
            certificates: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    const eventIds = events.map((event) => event.id)

    if (eventIds.length === 0) {
      res.json({
        success: true,
        stats: {
          totalEvents: 0,
          totalParticipants: 0,
          totalCertificates: 0,
          verifiedCertificates: 0,
          revokedCertificates: 0,
        },
        events: [],
        recentActivity: [],
      })
      return
    }

    const [
      totalParticipants,
      totalCertificates,
      verifiedCertificates,
      revokedCertificates,
      recentCertificates,
      recentParticipants,
    ] = await Promise.all([
      prisma.participant.count({
        where: {
          eventId: {
            in: eventIds,
          },
        },
      }),

      prisma.certificate.count({
        where: {
          eventId: {
            in: eventIds,
          },
        },
      }),

      prisma.certificate.count({
        where: {
          eventId: {
            in: eventIds,
          },
          status: "VERIFIED",
        },
      }),

      prisma.certificate.count({
        where: {
          eventId: {
            in: eventIds,
          },
          status: "REVOKED",
        },
      }),

      prisma.certificate.findMany({
        where: {
          eventId: {
            in: eventIds,
          },
        },
        select: {
          certificateId: true,
          issuedAt: true,
          verifiedAt: true,
          status: true,
          participant: {
            select: {
              name: true,
            },
          },
          event: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          issuedAt: "desc",
        },
        take: 5,
      }),

      prisma.participant.findMany({
        where: {
          eventId: {
            in: eventIds,
          },
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
          event: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),
    ])

    const recentActivity = [
      ...recentCertificates.map((certificate) => ({
        type:
          certificate.status === "VERIFIED"
            ? "certificate_verified"
            : "certificate_issued",
        title:
          certificate.status === "VERIFIED"
            ? "Certificate verified"
            : "Certificate issued",
        description:
          certificate.status === "VERIFIED"
            ? `${certificate.certificateId} was verified`
            : `${certificate.participant.name} received a certificate`,
        timestamp:
          certificate.verifiedAt ?? certificate.issuedAt,
      })),
      ...recentParticipants.map((participant) => ({
        type: "registration",
        title: "New registration",
        description: `${participant.name} registered for ${participant.event.name}`,
        timestamp: participant.createdAt,
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() -
          new Date(a.timestamp).getTime(),
      )
      .slice(0, 5)

    res.json({
      success: true,
      stats: {
        totalEvents: events.length,
        totalParticipants,
        totalCertificates,
        verifiedCertificates,
        revokedCertificates,
      },
      events,
      recentActivity,
    })
  } catch (error) {
    console.error("Dashboard error:", error)

    res.status(500).json({
      success: false,
      message: "Unable to load dashboard",
    })
  }
})

export default router
