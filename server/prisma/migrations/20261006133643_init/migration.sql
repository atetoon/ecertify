-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'REGISTRATION_OPEN', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RegistrationFieldType" AS ENUM ('SHORT_TEXT', 'LONG_TEXT', 'EMAIL', 'NUMBER', 'PHONE', 'DATE', 'DROPDOWN', 'CHECKBOX', 'RADIO');

-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('ISSUED', 'VERIFIED', 'REVOKED', 'REMOVED');

-- CreateEnum
CREATE TYPE "TemplateFieldType" AS ENUM ('NAME', 'EVENT_NAME', 'DATE', 'CERTIFICATE_ID', 'QR_CODE', 'CUSTOM');

-- CreateEnum
CREATE TYPE "FontWeight" AS ENUM ('NORMAL', 'MEDIUM', 'SEMIBOLD', 'BOLD');

-- CreateEnum
CREATE TYPE "TextAlign" AS ENUM ('LEFT', 'CENTER', 'RIGHT');

-- CreateTable
CREATE TABLE "Organizer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organizer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "organizerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "organization" TEXT NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrationField" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "RegistrationFieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "responses" JSONB NOT NULL,
    "eligible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "fields" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "status" "CertificateStatus" NOT NULL DEFAULT 'ISSUED',
    "pdfKey" TEXT,
    "accessCodeHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organizer_email_key" ON "Organizer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE INDEX "Event_organizerId_idx" ON "Event"("organizerId");

-- CreateIndex
CREATE INDEX "RegistrationField_eventId_idx" ON "RegistrationField"("eventId");

-- CreateIndex
CREATE INDEX "Participant_eventId_idx" ON "Participant"("eventId");

-- CreateIndex
CREATE INDEX "Participant_eventId_email_idx" ON "Participant"("eventId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "Template_eventId_key" ON "Template"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_certificateId_key" ON "Certificate"("certificateId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificate_participantId_key" ON "Certificate"("participantId");

-- CreateIndex
CREATE INDEX "Certificate_eventId_idx" ON "Certificate"("eventId");

-- CreateIndex
CREATE INDEX "Certificate_status_idx" ON "Certificate"("status");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "Organizer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationField" ADD CONSTRAINT "RegistrationField_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Template" ADD CONSTRAINT "Template_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
