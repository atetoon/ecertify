import {



  useEffect,



  useRef,



  useState,



  type DragEvent,



  type ReactNode,



} from "react"



import {



  useNavigate,



  useParams,



} from "react-router-dom"







import {



  ChevronLeft,



  ChevronRight,



  FileUp,



  Plus,



  Type,



  CalendarDays,



  Hash,



  QrCode,



  Trash2,



  AlignLeft,



  AlignCenter,



  AlignRight,



  Check,



} from "lucide-react"







import OrganizerLayout from "@/components/organizer/organizer-layout"







type FieldType =



  | "name"



  | "eventName"



  | "date"



  | "certificateId"



  | "qrCode"



  | "custom"







type TextAlign =



  | "left"



  | "center"



  | "right"







type FontWeight =



  | "normal"



  | "medium"



  | "semibold"



  | "bold"







interface TemplateFieldData {



  id: string



  type: FieldType



  label: string



  content: string



  x: number



  y: number



  fontFamily: string



  fontSize: number



  fontWeight: FontWeight



  textAlign: TextAlign



}







const fieldDefaults: Record<



  FieldType,



  {



    label: string



    content: string



    x: number



    y: number



  }



> = {



  name: {



    label: "Name",



    content: "Dhruv Pandey",



    x: 50,



    y: 48,



  },







  eventName: {



    label: "Event Name",



    content: "IDEATHON 2026",



    x: 50,



    y: 62,



  },







  date: {



    label: "Date",



    content: "26 September 2026",



    x: 50,



    y: 70,



  },







  certificateId: {



    label: "Certificate ID",



    content: "CERT2026004821",



    x: 50,



    y: 87,



  },







  qrCode: {



    label: "QR Code",



    content: "CERT2026004821",



    x: 50,



    y: 78,



  },







  custom: {



    label: "Custom Field",



    content: "Custom Field",



    x: 50,



    y: 35,



  },



}







const fieldIcons: Record<



  FieldType,



  ReactNode



> = {



  name: <Type className="h-4 w-4" />,



  eventName: (



    <Type className="h-4 w-4" />



  ),



  date: (



    <CalendarDays className="h-4 w-4" />



  ),



  certificateId: (



    <Hash className="h-4 w-4" />



  ),



  qrCode: (



    <QrCode className="h-4 w-4" />



  ),



  custom: (



    <Type className="h-4 w-4" />



  ),



}







const fieldLabels: Record<



  FieldType,



  string



> = {



  name: "Name",



  eventName: "Event Name",



  date: "Date",



  certificateId: "Certificate ID",



  qrCode: "QR Code",



  custom: "Custom Field",



}







const defaultFields: TemplateFieldData[] =



  [



    {



      id: "name-default",



      type: "name",



      label: "Name",



      content: "Dhruv Pandey",



      x: 50,



      y: 48,



      fontFamily: "Quicksand",



      fontSize: 36,



      fontWeight: "semibold",



      textAlign: "center",



    },







    {



      id: "event-default",



      type: "eventName",



      label: "Event Name",



      content: "IDEATHON 2026",



      x: 50,



      y: 62,



      fontFamily: "Quicksand",



      fontSize: 24,



      fontWeight: "bold",



      textAlign: "center",



    },







    {



      id: "date-default",



      type: "date",



      label: "Date",



      content: "26 September 2026",



      x: 50,



      y: 70,



      fontFamily: "Quicksand",



      fontSize: 14,



      fontWeight: "normal",



      textAlign: "center",



    },







    {



      id: "qr-default",



      type: "qrCode",



      label: "QR Code",



      content: "CERT2026004821",



      x: 50,



      y: 78,



      fontFamily: "Quicksand",



      fontSize: 14,



      fontWeight: "normal",



      textAlign: "center",



    },







    {



      id: "certificate-id-default",



      type: "certificateId",



      label: "Certificate ID",



      content: "CERT2026004821",



      x: 50,



      y: 87,



      fontFamily: "Quicksand",



      fontSize: 14,



      fontWeight: "normal",



      textAlign: "center",



    },



  ]







function cloneDefaultFields() {



  return defaultFields.map((field) => ({



    ...field,



  }))



}







function createField(



  type: FieldType



): TemplateFieldData {



  const defaults =



    fieldDefaults[type]







  const offset =



    Math.random() * 10 - 5







  return {



    id: `${type}-${Date.now()}-${Math.random()



      .toString(36)



      .slice(2, 8)}`,







    type,



    label: defaults.label,



    content: defaults.content,







    x: Math.min(



      90,



      Math.max(



        10,



        defaults.x + offset



      )



    ),







    y: Math.min(



      90,



      Math.max(



        10,



        defaults.y + offset



      )



    ),







    fontFamily: "Quicksand",







    fontSize:



      type === "name"



        ? 36



        : type === "eventName"



          ? 24



          : type === "custom"



            ? 20



            : 14,







    fontWeight:



      type === "name" ||



      type === "eventName"



        ? "semibold"



        : "normal",







    textAlign: "center",



  }



}







/* ============================================================



   TEMPLATE SIDEBAR



============================================================ */







interface TemplateSidebarProps {



  open: boolean



  onToggle: () => void



  onAddField: (



    type: FieldType



  ) => void



  selectedField:



    | TemplateFieldData



    | null



  onUpdateField: (



    id: string,



    updates: Partial<TemplateFieldData>



  ) => void



  onDeleteField: () => void



  saved: boolean



  eventId?: string



  uploadingBackground: boolean



  onUploadBackground: (file: File) => Promise<void>



}







function TemplateSidebar({



  open,



  onToggle,



  onAddField,



  selectedField,



  onUpdateField,



  onDeleteField,



  saved,



  eventId,



  uploadingBackground,



  onUploadBackground,



}: TemplateSidebarProps) {



  const handleDragStart = (



    event: DragEvent<HTMLButtonElement>,



    type: FieldType



  ) => {



    event.dataTransfer.setData(



      "application/ecertify-field",



      type



    )







    event.dataTransfer.effectAllowed =



      "copy"



  }







  return (



    <aside



      className={[



        "relative h-full border-r border-zinc-200 bg-white",



        "dark:border-zinc-800 dark:bg-[#0b0b0d]",



        "transition-[width] duration-300 ease-in-out",



        open ? "w-72" : "w-12",



      ].join(" ")}



    >



      <button



        type="button"



        onClick={onToggle}



        className="absolute -right-3 top-6 z-30 flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm transition-colors hover:text-zinc-950 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:text-white"



        aria-label={



          open



            ? "Collapse template sidebar"



            : "Expand template sidebar"



        }



      >



        {open ? (



          <ChevronLeft className="h-3.5 w-3.5" />



        ) : (



          <ChevronRight className="h-3.5 w-3.5" />



        )}



      </button>







      {open && (



        <div className="flex h-full flex-col overflow-y-auto">



          <div className="border-b border-zinc-200 px-5 py-5 dark:border-zinc-800">



            <div className="flex items-start justify-between">



              <div>



                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">



                  {eventId



                    ? "Event Template"



                    : "Certificate"}



                </p>







                <h2 className="mt-1 font-['Quicksand'] text-xl font-bold">



                  Template



                </h2>



              </div>







              {saved && (

                <div className="flex items-center gap-1.5 pt-1 text-[10px] font-medium text-zinc-400">

                  <Check className="h-3 w-3" />

                  Saved

                </div>

              )}



            </div>







            {eventId && (



              <p className="mt-2 truncate text-[11px] text-zinc-400">



                Event: {eventId}



              </p>



            )}



          </div>







          {selectedField ? (



            <div className="border-b border-zinc-200 dark:border-zinc-800">



              <div className="flex items-center justify-between px-5 py-4">



                <div>



                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">



                    Selected Field



                  </p>







                  <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">



                    {selectedField.label}



                  </p>



                </div>







                <button



                  type="button"



                  onClick={



                    onDeleteField



                  }



                  className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"



                  aria-label="Delete selected field"



                >



                  <Trash2 className="h-4 w-4" />



                </button>



              </div>







              <div className="space-y-4 px-5 pb-5">



                {selectedField.type !==



                  "qrCode" && (



                  <div>



                    <label className="mb-1.5 block text-xs font-medium text-zinc-500">



                      Text



                    </label>







                    <input



                      type="text"



                      value={



                        selectedField.content



                      }



                      onChange={(event) =>



                        onUpdateField(



                          selectedField.id,



                          {



                            content:



                              event.target



                                .value,



                          }



                        )



                      }



                      className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none transition-colors focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"



                    />



                  </div>



                )}







                {selectedField.type !==



                  "qrCode" && (



                  <div>



                    <label className="mb-1.5 block text-xs font-medium text-zinc-500">



                      Font



                    </label>







                    <select



                      value={



                        selectedField.fontFamily



                      }



                      onChange={(event) =>



                        onUpdateField(



                          selectedField.id,



                          {



                            fontFamily:



                              event.target



                                .value,



                          }



                        )



                      }



                      className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-900"



                    >



                      <option value="Quicksand">



                        Quicksand



                      </option>







                      <option value="Arial">



                        Arial



                      </option>







                      <option value="Georgia">



                        Georgia



                      </option>







                      <option value="Times New Roman">



                        Times New Roman



                      </option>







                      <option value="Courier New">



                        Courier New



                      </option>



                    </select>



                  </div>



                )}







                {selectedField.type !==



                  "qrCode" && (



                  <div>



                    <div className="mb-1.5 flex items-center justify-between">



                      <label className="text-xs font-medium text-zinc-500">



                        Size



                      </label>







                      <span className="text-xs text-zinc-400">



                        {



                          selectedField.fontSize



                        }



                        px



                      </span>



                    </div>







                    <input



                      type="range"



                      min="8"



                      max="72"



                      value={



                        selectedField.fontSize



                      }



                      onChange={(event) =>



                        onUpdateField(



                          selectedField.id,



                          {



                            fontSize:



                              Number(



                                event.target



                                  .value



                              ),



                          }



                        )



                      }



                      className="w-full accent-zinc-900 dark:accent-white"



                    />



                  </div>



                )}







                {selectedField.type !==



                  "qrCode" && (



                  <div>



                    <label className="mb-1.5 block text-xs font-medium text-zinc-500">



                      Weight



                    </label>







                    <select



                      value={



                        selectedField.fontWeight



                      }



                      onChange={(event) =>



                        onUpdateField(



                          selectedField.id,



                          {



                            fontWeight:



                              event.target



                                .value as FontWeight,



                          }



                        )



                      }



                      className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-900"



                    >



                      <option value="normal">



                        Regular



                      </option>







                      <option value="medium">



                        Medium



                      </option>







                      <option value="semibold">



                        Semibold



                      </option>







                      <option value="bold">



                        Bold



                      </option>



                    </select>



                  </div>



                )}







                {selectedField.type !==



                  "qrCode" && (



                  <div>



                    <label className="mb-1.5 block text-xs font-medium text-zinc-500">



                      Alignment



                    </label>







                    <div className="flex rounded-md border border-zinc-200 p-1 dark:border-zinc-700">



                      <AlignmentButton



                        active={



                          selectedField.textAlign ===



                          "left"



                        }



                        onClick={() =>



                          onUpdateField(



                            selectedField.id,



                            {



                              textAlign:



                                "left",



                            }



                          )



                        }



                      >



                        <AlignLeft className="h-4 w-4" />



                      </AlignmentButton>







                      <AlignmentButton



                        active={



                          selectedField.textAlign ===



                          "center"



                        }



                        onClick={() =>



                          onUpdateField(



                            selectedField.id,



                            {



                              textAlign:



                                "center",



                            }



                          )



                        }



                      >



                        <AlignCenter className="h-4 w-4" />



                      </AlignmentButton>







                      <AlignmentButton



                        active={



                          selectedField.textAlign ===



                          "right"



                        }



                        onClick={() =>



                          onUpdateField(



                            selectedField.id,



                            {



                              textAlign:



                                "right",



                            }



                          )



                        }



                      >



                        <AlignRight className="h-4 w-4" />



                      </AlignmentButton>



                    </div>



                  </div>



                )}







                <p className="text-[10px] leading-4 text-zinc-400">



                  Drag the field directly on



                  the certificate to change its



                  position.



                </p>



              </div>



            </div>



          ) : (



            <>



              <div className="border-b border-zinc-200 p-5 dark:border-zinc-800">



                <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-600 transition-colors hover:border-zinc-500 hover:bg-zinc-50 hover:text-zinc-950 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-100">

                <FileUp className="h-4 w-4" />

                {uploadingBackground ? "Uploading..." : "Upload Background"}

                <input

                  type="file"

                  accept="application/pdf,image/png,image/jpeg"

                  className="hidden"

                  disabled={uploadingBackground}

                  onChange={async (event) => {

                    const file = event.target.files?.[0]

                    event.target.value = ""

                    if (!file) return

                    await onUploadBackground(file)

                  }}

                />

              </label>

              <p className="mt-2 text-[10px] leading-4 text-zinc-400">

                PDF, PNG or JPEG · max 15 MB

              </p>



              </div>







              <div className="p-5">



                <div className="mb-4 flex items-center justify-between">



                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">



                    Fields



                  </p>







                  <button



                    type="button"



                    onClick={() =>



                      onAddField("custom")



                    }



                    className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"



                    aria-label="Add custom field"



                  >



                    <Plus className="h-4 w-4" />



                  </button>



                </div>







                <div className="space-y-2">



                  {(



                    Object.keys(



                      fieldLabels



                    ) as FieldType[]



                  )



                    .filter(



                      (type) =>



                        type !== "custom"



                    )



                    .map((type) => (



                      <TemplateField



                        key={type}



                        type={type}



                        icon={



                          fieldIcons[type]



                        }



                        label={



                          fieldLabels[type]



                        }



                        onClick={() =>



                          onAddField(type)



                        }



                        onDragStart={



                          handleDragStart



                        }



                      />



                    ))}



                </div>







                <p className="mt-5 text-[11px] leading-5 text-zinc-400">



                  Click a field to add it to



                  the certificate, or drag it



                  directly onto the preview.



                </p>



              </div>



            </>



          )}



        </div>



      )}



    </aside>



  )



}







function AlignmentButton({



  active,



  onClick,



  children,



}: {



  active: boolean



  onClick: () => void



  children: ReactNode



}) {



  return (



    <button



      type="button"



      onClick={onClick}



      className={[



        "flex h-8 flex-1 items-center justify-center rounded",



        "transition-colors",



        active



          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"



          : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100",



      ].join(" ")}



    >



      {children}



    </button>



  )



}







/* ============================================================



   SIDEBAR FIELD



============================================================ */







interface TemplateFieldProps {



  type: FieldType



  icon: ReactNode



  label: string



  onClick: () => void



  onDragStart: (



    event: DragEvent<HTMLButtonElement>,



    type: FieldType



  ) => void



}







function TemplateField({



  type,



  icon,



  label,



  onClick,



  onDragStart,



}: TemplateFieldProps) {



  return (



    <button



      type="button"



      draggable



      onClick={onClick}



      onDragStart={(event) =>



        onDragStart(event, type)



      }



      className="flex w-full cursor-grab items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-3 text-left text-sm text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 active:cursor-grabbing dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"



    >



      <span className="text-zinc-400">



        {icon}



      </span>







      <span>{label}</span>



    </button>



  )



}







/* ============================================================



   FIELD RENDERING



============================================================ */







function RenderField({



  field,



  selected,



  onSelect,



  onPointerDown,



}: {



  field: TemplateFieldData



  selected: boolean



  onSelect: () => void



  onPointerDown: (



    event: React.PointerEvent<HTMLDivElement>



  ) => void



}) {



  const baseClass =



    "absolute select-none cursor-move whitespace-nowrap"







  const selectedClass = selected



    ? "rounded-md outline outline-2 outline-dashed outline-zinc-400 outline-offset-4"



    : ""







  const commonStyle = {



    left: `${field.x}%`,



    top: `${field.y}%`,



    transform:



      "translate(-50%, -50%)",



    fontFamily: field.fontFamily,



    fontSize: `${(field.fontSize / 1120) * 100}cqw`,



    fontWeight:



      field.fontWeight === "normal"



        ? 400



        : field.fontWeight ===



            "medium"



          ? 500



          : field.fontWeight ===



              "semibold"



            ? 600



            : 700,



    textAlign: field.textAlign,



  } as const







  const commonProps = {



    className: `${baseClass} ${selectedClass}`,



    style: commonStyle,



    onPointerDown,



    onClick: (



      event: React.MouseEvent<HTMLDivElement>



    ) => {



      event.stopPropagation()



      onSelect()



    },



  }







  if (field.type === "qrCode") {



    return (



      <div {...commonProps}>



        <div className="flex h-14 w-14 items-center justify-center border border-zinc-300 bg-white">



          <QrCode className="h-9 w-9 text-zinc-800" />



        </div>







        <p className="mt-1 text-center text-[8px] text-zinc-400">



          {field.content}



        </p>



      </div>



    )



  }







  return (



    <div {...commonProps}>



      <span className="text-zinc-900">



        {field.content}



      </span>



    </div>



  )



}







/* ============================================================



   CERTIFICATE PREVIEW



============================================================ */







interface CertificatePreviewProps {



  fields: TemplateFieldData[]



  selectedFieldId: string | null

  backgroundUrl: string | null

  backgroundType: "image" | "pdf" | null

  onSelectField: (



    id: string | null



  ) => void



  onMoveField: (



    id: string,



    x: number,



    y: number



  ) => void



  onDropField: (



    type: FieldType,



    x: number,



    y: number



  ) => void



}







function CertificatePreview({



  fields,



  selectedFieldId,

  backgroundUrl,

  backgroundType,

  onSelectField,



  onMoveField,



  onDropField,



}: CertificatePreviewProps) {



  const certificateRef =



    useRef<HTMLDivElement>(null)







  const getPositionFromPointer = (



    clientX: number,



    clientY: number



  ) => {



    const element =



      certificateRef.current







    if (!element) {



      return {



        x: 50,



        y: 50,



      }



    }







    const rect =



      element.getBoundingClientRect()







    const x =



      ((clientX - rect.left) /



        rect.width) *



      100







    const y =



      ((clientY - rect.top) /



        rect.height) *



      100







    return {



      x: Math.min(



        96,



        Math.max(4, x)



      ),



      y: Math.min(



        94,



        Math.max(4, y)



      ),



    }



  }







  const handleDrop = (



    event: DragEvent<HTMLDivElement>



  ) => {



    event.preventDefault()







    const type =



      event.dataTransfer.getData(



        "application/ecertify-field"



      ) as FieldType







    if (!type) return







    const position =



      getPositionFromPointer(



        event.clientX,



        event.clientY



      )







    onDropField(



      type,



      position.x,



      position.y



    )



  }







  const handlePointerDown = (



    event: React.PointerEvent<HTMLDivElement>,



    fieldId: string



  ) => {



    event.stopPropagation()







    const element =



      certificateRef.current







    if (!element) return







    const field = fields.find(



      (item) => item.id === fieldId



    )







    if (!field) return







    onSelectField(fieldId)







    const rect =



      element.getBoundingClientRect()







    const startX = event.clientX



    const startY = event.clientY







    const initialX = field.x



    const initialY = field.y







    const handlePointerMove = (



      moveEvent: PointerEvent



    ) => {



      const deltaX =



        ((moveEvent.clientX -



          startX) /



          rect.width) *



        100







      const deltaY =



        ((moveEvent.clientY -



          startY) /



          rect.height) *



        100







      onMoveField(



        fieldId,



        Math.min(



          96,



          Math.max(



            4,



            initialX + deltaX



          )



        ),



        Math.min(



          94,



          Math.max(



            4,



            initialY + deltaY



          )



        )



      )



    }







    const handlePointerUp = () => {



      window.removeEventListener(



        "pointermove",



        handlePointerMove



      )







      window.removeEventListener(



        "pointerup",



        handlePointerUp



      )



    }







    window.addEventListener(



      "pointermove",



      handlePointerMove



    )







    window.addEventListener(



      "pointerup",



      handlePointerUp



    )



  }







  return (



    <div className="flex h-full w-full items-center justify-center overflow-hidden p-4 sm:p-6">



      <div



        ref={certificateRef}
        style={{ containerType: "inline-size" }}



        onDragOver={(event) => {



          event.preventDefault()







          event.dataTransfer.dropEffect =



            "copy"



        }}



        onDrop={handleDrop}



        onClick={() =>



          onSelectField(null)



        }



        className="



          relative



          aspect-[1.414/1]



          h-[min(76vh,calc(100vh-8rem))]



          max-h-full



          max-w-full



          overflow-hidden



          bg-white



          shadow-[0_20px_60px_rgba(0,0,0,0.15)]



        "



      >



        {backgroundUrl && backgroundType === "image" && (
          <img
            src={backgroundUrl}
            alt="Certificate template"
            className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
          />
        )}

        {backgroundUrl && backgroundType === "pdf" && (
          <iframe
            src={backgroundUrl}
            title="Certificate template"
            className="pointer-events-none absolute inset-0 z-0 h-full w-full border-0"
          />
        )}

        {!backgroundUrl && (
          <>
        <div className="pointer-events-none absolute inset-4 border border-zinc-300 sm:inset-6" />







        <div className="pointer-events-none absolute inset-6 border border-zinc-200 sm:inset-8" />







        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-10 text-center sm:px-16">



          <p className="text-[clamp(7px,0.9vw,12px)] font-semibold uppercase tracking-[0.35em] text-zinc-400">



            Certificate of Participation



          </p>







          <h1 className="mt-[3%] font-['Quicksand'] text-[clamp(22px,3.7vw,52px)] font-bold tracking-tight text-zinc-900">



            CERTIFICATE



          </h1>







          <p className="mt-[2%] text-[clamp(7px,0.9vw,13px)] text-zinc-500">



            This certificate is proudly



            presented to



          </p>







          <div className="absolute bottom-[9%] left-[11%] right-[11%] flex items-end justify-between">



            <div className="text-left">



              <div className="mb-1 h-px w-16 bg-zinc-400 sm:w-20" />







              <p className="text-[clamp(5px,0.6vw,10px)] text-zinc-500">



                IGNITE



              </p>



            </div>







            <div className="text-right">



              <div className="mb-1 ml-auto h-px w-16 bg-zinc-400 sm:w-20" />







              <p className="text-[clamp(5px,0.6vw,10px)] text-zinc-500">



                ORGANIZER



              </p>



            </div>



          </div>



        </div>







          </>
        )}

        {fields.map((field) => (



          <RenderField



            key={field.id}



            field={field}



            selected={



              field.id ===



              selectedFieldId



            }



            onSelect={() =>



              onSelectField(field.id)



            }



            onPointerDown={(event) =>



              handlePointerDown(



                event,



                field.id



              )



            }



          />



        ))}



      </div>



    </div>



  )



}







/* ============================================================



   TEMPLATE PAGE



============================================================ */







export default function Template() {

  const { eventId } = useParams()

  const navigate = useNavigate()



  const [templateSidebarOpen, setTemplateSidebarOpen] = useState(true)

  const [saved, setSaved] = useState(false)

  const [loading, setLoading] = useState(Boolean(eventId))

  const [saving, setSaving] = useState(false)

  const [uploadingBackground, setUploadingBackground] = useState(false)

  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null)

  const [backgroundType, setBackgroundType] = useState<"image" | "pdf" | null>(null)

  const backgroundObjectUrlRef = useRef<string | null>(null)

  const [error, setError] = useState<string | null>(null)



  const [fields, setFields] =

    useState<TemplateFieldData[]>(cloneDefaultFields)



  const [selectedFieldId, setSelectedFieldId] =

    useState<string | null>(null)



  const selectedField =

    fields.find((field) => field.id === selectedFieldId) ?? null



  const saveTimerRef = useRef<number | null>(null)

  const hasLoadedTemplateRef = useRef(false)



  const getToken = () => localStorage.getItem("ecertify_token")

  useEffect(() => {
    return () => {
      if (backgroundObjectUrlRef.current) {
        URL.revokeObjectURL(backgroundObjectUrlRef.current)
      }
    }
  }, [])



  useEffect(() => {

    if (!eventId) {

      setLoading(false)

      hasLoadedTemplateRef.current = true

      return

    }



    let cancelled = false



    const loadTemplate = async () => {

      setLoading(true)

      setError(null)

      hasLoadedTemplateRef.current = false



      const token = getToken()

      if (!token) {

        navigate("/login")

        return

      }



      try {

        const response = await fetch(

          `http://localhost:5001/api/events/${eventId}/template`,

          { headers: { Authorization: `Bearer ${token}` } },

        )



        if (response.status === 401) {

          localStorage.removeItem("ecertify_token")

          navigate("/login")

          return

        }



        const data = await response.json()

        if (!response.ok || !data.success) {

          throw new Error(data.message || "Unable to load template")

        }



        if (cancelled) return



        const persistedBackgroundUrl =
          data.template?.backgroundUrl ??
          data.template?.background_url ??
          data.template?.background?.url ??
          data.backgroundUrl ??
          data.background?.url ??
          null

        const persistedBackgroundType =
          data.template?.backgroundType ??
          data.template?.background_type ??
          data.template?.background?.type ??
          data.backgroundType ??
          data.background?.type ??
          null

        if (persistedBackgroundUrl) {
          setBackgroundUrl(persistedBackgroundUrl)
          setBackgroundType(
            persistedBackgroundType === "pdf" ? "pdf" : "image",
          )
        } else {
          setBackgroundUrl(null)
          setBackgroundType(null)
        }

        const serverFields = data.template?.fields

        setFields(

          Array.isArray(serverFields) && serverFields.length > 0

            ? serverFields

            : cloneDefaultFields(),

        )

        setSelectedFieldId(null)

        hasLoadedTemplateRef.current = true

      } catch (loadError) {

        if (cancelled) return



        console.error("Template load error:", loadError)

        setError(

          loadError instanceof Error

            ? loadError.message

            : "Unable to load template",

        )

        setFields(cloneDefaultFields())
        setBackgroundUrl(null)
        setBackgroundType(null)

        hasLoadedTemplateRef.current = true

      } finally {

        if (!cancelled) setLoading(false)

      }

    }



    void loadTemplate()

    return () => {

      cancelled = true

    }

  }, [eventId, navigate])



  useEffect(() => {

    if (!eventId || !hasLoadedTemplateRef.current) return



    if (saveTimerRef.current !== null) {

      window.clearTimeout(saveTimerRef.current)

    }



    saveTimerRef.current = window.setTimeout(async () => {

      const token = getToken()

      if (!token) {

        navigate("/login")

        return

      }



      setSaving(true)

      setError(null)



      try {

        const response = await fetch(

          `http://localhost:5001/api/events/${eventId}/template`,

          {

            method: "PUT",

            headers: {

              Authorization: `Bearer ${token}`,

              "Content-Type": "application/json",

            },

            body: JSON.stringify({ fields }),

          },

        )



        if (response.status === 401) {

          localStorage.removeItem("ecertify_token")

          navigate("/login")

          return

        }



        const data = await response.json()

        if (!response.ok || !data.success) {

          throw new Error(data.message || "Unable to save template")

        }



        setSaved(true)

        window.setTimeout(() => setSaved(false), 1200)

      } catch (saveError) {

        console.error("Template save error:", saveError)

        setError(

          saveError instanceof Error

            ? saveError.message

            : "Unable to save template",

        )

        setSaved(false)

      } finally {

        setSaving(false)

      }

    }, 700)



    return () => {

      if (saveTimerRef.current !== null) {

        window.clearTimeout(saveTimerRef.current)

      }

    }

  }, [fields, eventId, navigate])



  const uploadBackground = async (file: File) => {

    if (!eventId) {

      setError("A specific event is required to upload a background.")

      return

    }



    if (file.size > 15 * 1024 * 1024) {

      setError("Background file must be 15 MB or smaller.")

      return

    }



    if (!new Set(["application/pdf", "image/png", "image/jpeg"]).has(file.type)) {

      setError("Only PDF, PNG and JPEG backgrounds are supported.")

      return

    }



    const token = getToken()

    if (!token) {

      navigate("/login")

      return

    }



    if (backgroundObjectUrlRef.current) {
      URL.revokeObjectURL(backgroundObjectUrlRef.current)
    }

    const localPreviewUrl = URL.createObjectURL(file)
    backgroundObjectUrlRef.current = localPreviewUrl
    setBackgroundUrl(localPreviewUrl)
    setBackgroundType(file.type === "application/pdf" ? "pdf" : "image")

    setUploadingBackground(true)

    setError(null)



    try {

      const response = await fetch(

        `http://localhost:5001/api/events/${eventId}/template/background`,

        {

          method: "POST",

          headers: {

            Authorization: `Bearer ${token}`,

            "Content-Type": file.type,

          },

          body: file,

        },

      )



      if (response.status === 401) {

        localStorage.removeItem("ecertify_token")

        navigate("/login")

        return

      }



      const data = await response.json()

      if (!response.ok || !data.success) {

        throw new Error(data.message || "Unable to upload background")

      }



      const uploadedBackgroundUrl =
        data.backgroundUrl ??
        data.background?.url ??
        data.template?.backgroundUrl ??
        data.template?.background?.url ??
        null

      if (uploadedBackgroundUrl) {

        setBackgroundUrl(uploadedBackgroundUrl)

        if (backgroundObjectUrlRef.current) {

          URL.revokeObjectURL(backgroundObjectUrlRef.current)

          backgroundObjectUrlRef.current = null

        }

      }



      setSaved(true)

      window.setTimeout(() => setSaved(false), 1200)

    } catch (uploadError) {

      console.error("Template background upload error:", uploadError)

      setError(

        uploadError instanceof Error

          ? uploadError.message

          : "Unable to upload background",

      )

    } finally {

      setUploadingBackground(false)

    }

  }



  const addField = (



    type: FieldType



  ) => {



    const field = createField(type)







    setFields((current) => [



      ...current,



      field,



    ])







    setSelectedFieldId(field.id)



  }







  const addDroppedField = (



    type: FieldType,



    x: number,



    y: number



  ) => {



    const field = createField(type)







    const newField = {



      ...field,



      x,



      y,



    }







    setFields((current) => [



      ...current,



      newField,



    ])







    setSelectedFieldId(



      newField.id



    )



  }







  const updateField = (



    id: string,



    updates: Partial<TemplateFieldData>



  ) => {



    setFields((current) =>



      current.map((field) =>



        field.id === id



          ? {



              ...field,



              ...updates,



            }



          : field



      )



    )



  }







  const moveField = (



    id: string,



    x: number,



    y: number



  ) => {



    updateField(id, {



      x,



      y,



    })



  }







  const deleteSelectedField = () => {



    if (!selectedFieldId) {



      return



    }







    setFields((current) =>



      current.filter(



        (field) =>



          field.id !==



          selectedFieldId



      )



    )







    setSelectedFieldId(null)



  }







  return (



    <OrganizerLayout



      initialSidebarOpen={false}



      secondarySidebar={



        <TemplateSidebar



          open={templateSidebarOpen}



          onToggle={() =>



            setTemplateSidebarOpen(



              (value) => !value



            )



          }



          onAddField={addField}



          selectedField={



            selectedField



          }



          onUpdateField={



            updateField



          }



          onDeleteField={



            deleteSelectedField



          }



          saved={saved}

        eventId={eventId}

        uploadingBackground={uploadingBackground}

        onUploadBackground={uploadBackground}

      />



      }



    >



      <main



        className={[



          "relative h-[calc(100vh-6rem)] overflow-hidden",



          "bg-zinc-50 dark:bg-[#08080a]",



          "transition-[padding] duration-300 ease-in-out",



          templateSidebarOpen



            ? "pl-72"



            : "pl-12",



        ].join(" ")}



      >



      {error && (

        <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-medium text-red-600 shadow-sm dark:border-red-900/50 dark:bg-zinc-900 dark:text-red-400">

          {error}

        </div>

      )}



      {saving && !error && (

        <div className="absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">

          Saving...

        </div>

      )}



      {loading && (

        <div className="absolute inset-0 z-40 flex items-center justify-center bg-zinc-50/80 backdrop-blur-[2px] dark:bg-[#08080a]/80">

          <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">

            Loading template...

          </div>

        </div>

      )}



        <CertificatePreview



          fields={fields}



          selectedFieldId={



            selectedFieldId



          }

          backgroundUrl={backgroundUrl}

          backgroundType={backgroundType}



          onSelectField={



            setSelectedFieldId



          }



          onMoveField={moveField}



          onDropField={



            addDroppedField



          }



        />



      </main>



    </OrganizerLayout>



  )



}