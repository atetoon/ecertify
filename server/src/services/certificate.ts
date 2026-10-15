import path from "node:path"

import puppeteer from "puppeteer"

import QRCode from "qrcode"

import crypto from "node:crypto"

import {

  PDFDocument,

} from "pdf-lib"



import { prisma } from "../prisma.js"



import {

  getObject,

  uploadPdf,

} from "../r2.js"



interface TemplateField {

  id: string

  type:

    | "name"

    | "eventName"

    | "date"

    | "certificateId"

    | "qrCode"

    | "custom"

  label: string

  content: string

  x: number

  y: number

  fontFamily: string

  fontSize: number

  fontWeight:

    | "normal"

    | "medium"

    | "semibold"

    | "bold"

  textAlign:

    | "left"

    | "center"

    | "right"

}



interface CertificateValues {

  name: string

  eventName: string

  date: string

  certificateId: string

  verificationUrl: string

}



function generateCertificateId(): string {

  const year =

    new Date().getFullYear()



  const randomPart =

    crypto

      .randomBytes(6)

      .toString("hex")

      .toUpperCase()



  return `CERT${year}${randomPart}`

}



async function generateUniqueCertificateId(): Promise<string> {

  for (;;) {

    const certificateId =

      generateCertificateId()



    const existing =

      await prisma.certificate.findUnique({

        where: {

          certificateId,

        },

        select: {

          id: true,

        },

      })



    if (!existing) {

      return certificateId

    }

  }

}



function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}


function weightValue(

  weight: TemplateField["fontWeight"],

): number {

  switch (weight) {

    case "medium":

      return 500



    case "semibold":

      return 600



    case "bold":

      return 700



    default:

      return 400

  }

}



function resolveFieldContent(

  field: TemplateField,

  values: CertificateValues,

): string {

  switch (field.type) {

    case "name":

      return values.name



    case "eventName":

      return values.eventName



    case "date":

      return values.date



    case "certificateId":

      return values.certificateId



    case "qrCode":

      return values.verificationUrl



    case "custom":

      return field.content

        .replaceAll(

          "{{name}}",

          values.name,

        )

        .replaceAll(

          "{{eventName}}",

          values.eventName,

        )

        .replaceAll(

          "{{date}}",

          values.date,

        )

        .replaceAll(

          "{{certificateId}}",

          values.certificateId,

        )

        .replaceAll(

          "{{verificationUrl}}",

          values.verificationUrl,

        )



    default:

      return field.content

  }

}



async function getR2Buffer(

  key: string,

): Promise<Buffer> {

  const object =

    await getObject(key)



  if (!object.Body) {

    throw new Error(

      "Template background is unavailable",

    )

  }



  const bytes =

    await object.Body.transformToByteArray()



  return Buffer.from(bytes)

}



function renderFields(

  fields: TemplateField[],

  values: CertificateValues,

  qrCodeDataUrl: string,

): string {

  console.log(
    "PDF FIELD SIZES:",
    fields.map((field) => ({
      type: field.type,
      content: field.content,
      fontSize: field.fontSize,
      fontFamily: field.fontFamily,
    })),
  );

  return fields

    .map((field) => {

      if (field.type === "qrCode") {

        return `

          <img

            src="${qrCodeDataUrl}"

            style="

              position:absolute;

              left:${field.x}%;

              top:${field.y}%;

              width:90px;

              height:90px;

              transform:translate(-50%,-50%);

            "

            alt="Verification QR code"

          />

        `

      }



      const content =

        escapeHtml(

          resolveFieldContent(

            field,

            values,

          ),

        )



      return `

        <div
          class="certificate-field"
          style="

            position:absolute;

            left:${field.x}%;

            top:${field.y}%;

            transform:translate(-50%,-50%);

            font-family: '${field.fontFamily === "Quicksand" ? "Quicksand" : field.fontFamily}';
            font-size: ${Number(field.fontSize) || 40}px;

            font-weight:${weightValue(field.fontWeight)};

            text-align:${field.textAlign};

            white-space:nowrap;

            color:#111111;

          "

        >

          ${content}

        </div>

      `

    })

    .join("")

}



async function renderHtmlToPdf(
  html: string,
): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: path.join(
      process.env.PUPPETEER_CACHE_DIR ??
        path.join(process.env.HOME ?? "/opt/render", ".cache", "puppeteer"),
      "chrome",
      "linux-154.0.8037.57",
      "chrome-linux64",
      "chrome",
    ),
  })

  try {
    const page = await browser.newPage()

    await page.setViewport({
      width: 1123,
      height: 794,
      deviceScaleFactor: 1,
    })

    await page.setContent(html, {
      waitUntil: "load",
    })

    await page.evaluate(async () => {
      await document.fonts.ready
    })

    return Buffer.from(
      await page.pdf({
        format: "A4",
        landscape: true,
        printBackground: true,
        pageRanges: "1",
        preferCSSPageSize: false,
        margin: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        },
      }),
    )
  } finally {
    await browser.close()
  }
}


async function createDynamicPdf(

  fields: TemplateField[],

  values: CertificateValues,

  qrCodeDataUrl: string,

): Promise<Buffer> {

  const renderedFields =

    renderFields(

      fields,

      values,

      qrCodeDataUrl,

    )



  const html = `

<!DOCTYPE html>

<html>

<head>

  <meta charset="UTF-8" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet" />



  <style>

    * {

      box-sizing: border-box;

    }



    html,
    body {
      margin: 0;
      padding: 0;
      width: 297mm;
      height: 210mm;
      background: transparent;
      overflow: hidden;
    }



    body {

      position: relative;

    }

  </style>

</head>



<body>

  ${renderedFields}

</body>

</html>

`



  return renderHtmlToPdf(html)

}



async function createImageBackgroundPdf(

  background: Buffer,

  contentType: string,

  fields: TemplateField[],

  values: CertificateValues,

  qrCodeDataUrl: string,

): Promise<Buffer> {

  const backgroundDataUrl =

    `data:${contentType};base64,${background.toString("base64")}`



  const renderedFields =

    renderFields(

      fields,

      values,

      qrCodeDataUrl,

    )



  const html = `

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap" rel="stylesheet" />



<style>

* {

  box-sizing: border-box;

}



html,
body {
  margin: 0;
  padding: 0;
  width: 297mm;
  height: 210mm;
  overflow: hidden;
}



body {

  position: relative;

  background-image: url("${backgroundDataUrl}");

  background-size: 100% 100%;

  background-position: center;

  background-repeat: no-repeat;

}

</style>

</head>



<body>

${renderedFields}

</body>

</html>

`



  return renderHtmlToPdf(html)

}



async function mergePdfBackground(

  background: Buffer,

  overlay: Buffer,

): Promise<Buffer> {

  const backgroundPdf =

    await PDFDocument.load(

      background,

    )



  const overlayPdf =

    await PDFDocument.load(

      overlay,

    )



  const backgroundPages =

    backgroundPdf.getPages()



  const page =

    backgroundPages[0]



  if (!page) {

    throw new Error(

      "Template PDF contains no pages",

    )

  }



  const embeddedPages =

    await backgroundPdf.embedPdf(

      overlayPdf,

      [0],

    )



  const embeddedPage =

    embeddedPages[0]



  if (!embeddedPage) {

    throw new Error(

      "Unable to create certificate overlay",

    )

  }



  const {

    width,

    height,

  } = page.getSize()



  const overlayWidth =

    embeddedPage.width



  const overlayHeight =

    embeddedPage.height



  if (

    overlayWidth <= 0 ||

    overlayHeight <= 0

  ) {

    throw new Error(

      "Invalid certificate overlay dimensions",

    )

  }



  page.drawPage(

    embeddedPage,

    {

      x: 0,

      y: 0,

      xScale:

        width / overlayWidth,

      yScale:

        height / overlayHeight,

    },

  )



  return Buffer.from(

    await backgroundPdf.save(),

  )

}



export async function issueCertificate(

  participantId: string,

  organizerId: string,

) {

  const participant =

    await prisma.participant.findUnique({

      where: {

        id: participantId,

      },

      include: {

        event: {

          include: {

            template: true,

          },

        },

        certificate: true,

      },

    })



  if (!participant) {

    throw new Error(

      "Participant not found",

    )

  }



  if (

    participant.event.organizerId !==

    organizerId

  ) {

    throw new Error(

      "You do not have access to this participant",

    )

  }



  if (!participant.eligible) {

    throw new Error(

      "Participant is not eligible for a certificate",

    )

  }



  if (participant.certificate) {

    return participant.certificate

  }



  const certificateId =

    await generateUniqueCertificateId()



  const clientUrl =

    process.env.CLIENT_URL ??

    "http://localhost:5173"



  const verificationUrl =

    `${clientUrl}/verify/${certificateId}`



  const qrCodeDataUrl =

    await QRCode.toDataURL(

      verificationUrl,

      {

        width: 220,

        margin: 1,

      },

    )



  const issuedAt =

    new Date()



  const formattedDate =

    issuedAt.toLocaleDateString(

      "en-IN",

      {

        day: "numeric",

        month: "long",

        year: "numeric",

      },

    )



  const values: CertificateValues = {

    name: participant.name,

    eventName:

      participant.event.name,

    date: formattedDate,

    certificateId,

    verificationUrl,

  }



  const templateFields =

    Array.isArray(

      participant.event.template?.fields,

    )

      ? participant.event.template

          .fields as unknown as TemplateField[]

      : []



  let pdf: Buffer



  const backgroundKey =

    participant.event.template

      ?.backgroundKey



  const backgroundType =

    participant.event.template

      ?.backgroundType



  if (

    backgroundKey &&

    backgroundType ===

      "application/pdf"

  ) {

    const background =

      await getR2Buffer(

        backgroundKey,

      )



    const overlay =

      await createDynamicPdf(

        templateFields,

        values,

        qrCodeDataUrl,

      )



    pdf =

      await mergePdfBackground(

        background,

        overlay,

      )

  } else if (

    backgroundKey &&

    backgroundType &&

    (

      backgroundType ===

        "image/png" ||

      backgroundType ===

        "image/jpeg"

    )

  ) {

    const background =

      await getR2Buffer(

        backgroundKey,

      )



    pdf =

      await createImageBackgroundPdf(

        background,

        backgroundType,

        templateFields,

        values,

        qrCodeDataUrl,

      )

  } else {

    pdf =

      await createDynamicPdf(

        templateFields,

        values,

        qrCodeDataUrl,

      )

  }



  const pdfKey =

    `certificates/${participant.event.id}/${certificateId}.pdf`



  await uploadPdf(

    pdfKey,

    pdf,

  )



  const certificate =

    await prisma.certificate.create({

      data: {

        certificateId,

        eventId:

          participant.event.id,

        participantId:

          participant.id,

        issuedAt,

        status: "ISSUED",

        pdfKey,

      },

    })



  return certificate

}