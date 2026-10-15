
import "dotenv/config"
import readline from "node:readline/promises"
import { stdin as input, stdout as output } from "node:process"

import { hashPassword } from "../src/auth.js"
import { prisma } from "../src/prisma.js"

async function main() {
  const rl = readline.createInterface({ input, output })

  try {
    const name = (await rl.question("Organizer name: ")).trim()
    const email = (await rl.question("Organizer email: "))
      .trim()
      .toLowerCase()
    const password = await rl.question(
      "Organizer password (input will be visible): ",
    )

    if (!name || !email || password.length < 8) {
      throw new Error(
        "Name and email are required; password must be at least 8 characters.",
      )
    }

    const existing = await prisma.organizer.findUnique({
      where: { email },
    })

    if (existing) {
      throw new Error("An organizer with this email already exists.")
    }

    const passwordHash = await hashPassword(password)

    const organizer = await prisma.organizer.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true },
    })

    console.log("Organizer created successfully:")
    console.log(organizer)
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error("Failed to create organizer:", error)
  process.exitCode = 1
})
