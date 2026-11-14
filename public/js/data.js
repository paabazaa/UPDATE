// Site content: products, software, services and programmes.
const DATA = {
  "productCategories": [
    {
      "slug": "sterile-barrier",
      "name": "Sterile Barrier Products",
      "description": "Wraps, cards and test devices for protecting surgical instrument sets during storage and handling."
    },
    {
      "slug": "count-sheet-holders",
      "name": "Instrument Count Sheet Holders",
      "description": "Holders that keep surgical count sheets separate from instruments and implants throughout processing."
    },
    {
      "slug": "workstation-organisation",
      "name": "Workstation Organisation",
      "description": "Racks and storage products that keep commonly used sterile processing supplies organised at each workstation."
    },
    {
      "slug": "monitoring",
      "name": "Monitoring Devices",
      "description": "Indicators and devices used for routine checks and monitoring."
    }
  ],
  "products": [
    {
      "slug": "surgical-tray-integrity-test",
      "name": "Surgical Tray Integrity Test",
      "category": "sterile-barrier",
      "summary": "A simple test that uses the wicking effect of a fluid across a synthetic membrane to help reveal small holes around the retention pins of rigid instrument containers.",
      "image": "productTrayIntegrityTest",
      "body": [
        "Rigid instrument containers can wear around their retention pins over time. Small holes in these areas may compromise the container's barrier and create a route for contamination. Routine inspection helps staff identify damage before a container is returned to use.",
        "The Surgical Tray Integrity Test uses the wicking effect of a fluid on a synthetic membrane to make possible defects around the retention pins easier to see. Staff can then set aside containers that need closer inspection or repair.",
        "The test is intended to support routine checks of rigid containers. When a defect is found, the container can be removed from service and assessed for repair in line with the department's procedures."
      ],
      "features": [
        "Uses the wicking effect of antiseptic fluids across clean synthetic membranes",
        "Magnifies holes around faulty retention pins",
        "Isolates compromised rigid containers for proper repair",
        "Quick and easy to adopt as best practice"
      ],
      "applications": [
        "Operating rooms",
        "Sterile processing departments",
        "Rigid instrument container maintenance"
      ],
      "specifications": [
        {
          "label": "Product code",
          "value": "Available on request"
        },
        {
          "label": "Quantity (box)",
          "value": "Request for a quote"
        }
      ]
    },
    {
      "slug": "ibr-instrument-brush-rack",
      "name": "iBR [Instrument Brush Rack]",
      "category": "workstation-organisation",
      "summary": "A lean production device combining bins, racks, shelves and a french gauge to consolidate sterile processing supplies and ease bottlenecks.",
      "image": "productBrushRack",
      "body": [
        "The name iBR comes from “instrument brush rack”. It combines storage bins, racks, shelves and a French gauge in one workstation organiser. The aim is to keep frequently used sterile processing supplies together and within easy reach.",
        "The iBR can be configured for the needs of a work area and placed on a bench or mounted on a wall. Depending on the setup, it can hold brushes, sponges, tags, test kits, locks, indicators, load stickers, tip protectors, peel packs, count sheet holders, quality assurance cards, labels, tape and stationery. It is intended for use in decontamination, set assembly and sterilisation areas.",
        "Contact us to discuss how the iBR could be arranged for your work area."
      ],
      "features": [
        "Combines bins, racks, shelves and a french gauge",
        "Customisable to each work station",
        "Bench-standing or wall-mounted, using less space",
        "Holds brushes, sponges, tags, test kits, locks, integrators, indicators, load stickers, tip protectors, peel packs, count sheet holders, quality assurance cards, labels, tapes, markers and pens"
      ],
      "applications": [
        "Decontamination",
        "Set assembly",
        "Sterilisation"
      ],
      "specifications": [
        {
          "label": "Product code",
          "value": "Available on request"
        },
        {
          "label": "Quantity (box)",
          "value": "Request for a quote"
        }
      ]
    },
    {
      "slug": "universal-surgical-count-sheet-holder",
      "name": "Universal Surgical Count Sheet Holder",
      "category": "count-sheet-holders",
      "summary": "A Class I medical device that isolates surgical count sheets from instruments and implants to avoid ink stains and paper-particle contaminants.",
      "image": "productCountSheetHolder",
      "body": [
        "The Universal Surgical Count Sheet Holder keeps the count sheet separate from surgical instruments and implants during processing. It is designed to help prevent ink transfer and loose paper particles. The stated compatible sterilisation methods are steam, hydrogen peroxide gas, ethylene oxide and ozone.",
        "The holder is made from surgical polypropylene and is intended for use with rigid containers. Its material and compatibility should be checked against the product instructions and the sterilisation process used by the department.",
        "The holder is designed without the plastic sleeves and adhesive arrangements described above. Follow the product instructions and local procedures when selecting and using any count sheet holder. A holder supports record placement; it does not replace the department's instrument-counting or patient-safety checks."
      ],
      "features": [
        "Class I medical device",
        "Made from surgical polypropylene",
        "Compatible with steam, hydrogen peroxide gas, ethylene oxide and ozone sterilants",
        "No plastics or glues that shield bacteria from sterilant exposure"
      ],
      "applications": [
        "Rigid containers",
        "Surgical instrument sets",
        "Operating rooms and sterile processing departments"
      ],
      "specifications": [
        {
          "label": "Product code",
          "value": "Available on request"
        },
        {
          "label": "Quantity (box)",
          "value": "Request for a quote"
        },
        {
          "label": "Regulatory classification",
          "value": "Class I medical device"
        },
        {
          "label": "Compatible sterilisation methods",
          "value": "Steam, hydrogen peroxide gas, ethylene oxide, ozone"
        }
      ]
    },
    {
      "slug": "surgical-instrument-master-wrap",
      "name": "Surgical Instrument Master Wrap",
      "category": "sterile-barrier",
      "summary": "A Class I medical device using impact displacement technology to prevent holes and secure the integrity of each wrapped surgical instrument tray.",
      "image": "productMasterWrap",
      "body": [
        "Surgical Instrument Master Wrap is designed to help protect a wrapped instrument tray from knocks and handling impacts that may damage the primary wrap. It uses an impact-displacement design and can be used during set assembly, storage, transport and movement to the operating room, in accordance with its instructions for use.",
        "Master Wrap is made from polypropylene and includes a side pouch for the surgical count sheet. The pouch keeps the sheet separate from the wrapped instruments during handling and processing.",
        "The side pouch keeps the count sheet with the tray so staff can refer to it without opening the wrapped set. Follow current AORN guidance and local policy when handling sterile instrument sets."
      ],
      "features": [
        "Class I medical device",
        "Impact displacement technology",
        "Polypropylene, with no dust- or moisture-trapping foam",
        "Smart side pouch isolates count sheets"
      ],
      "applications": [
        "Set assembly",
        "Sterilisation and sterile storage",
        "Case carts and operating rooms"
      ],
      "ifu": {
        "pdf": "/documents/Master-Wrap-Instructions-for-Use-SURGICISS-LTD.pdf",
        "intro": "Master Wrap applies impact displacement to help protect the primary surgical wrap from external forces that could cause punctures, tears and holes. In rare cases, Master Wrap itself may sustain tears or holes while continuing to redirect potentially damaging impact forces to preserve the integrity of wrapped instrument trays. Always inspect tray wraps in accordance with established operating room best practices.",
        "audience": "For sterile processing and operating room personnel",
        "applyNote": "Apply Master Wrap to the wrapped tray as shown. Complete the closure in the final step.",
        "steps": [
          {"title": "Prepare", "text": "Place Master Wrap flat on a wrapping table or bench.", "image": "masterWrapPrepare"},
          {"title": "Position", "text": "Center the wrapped instrument tray on Master Wrap and position it evenly, as shown.", "image": "masterWrapPosition"},
          {"title": "Secure", "text": "Expose the adhesives. Overlap, align and adhere the strap ends together. Tuck in and reinforce the corners for extra protection.", "image": "masterWrapSecure"}
        ],
        "viewsTitle": "Outer-wrap protection using impact displacement",
        "views": [
          {"label": "Close-up view", "image": "masterWrapCloseup"},
          {"label": "Full-tray view", "image": "masterWrapFulltray"}
        ],
        "materials": "Our laboratory testing and feedback from hospitals indicate effective hole prevention. We designed Master Wrap to displace external impact forces and help protect the main surgical wrap. We use nonwoven polypropylene approved for surgical tray wrapping and medical-grade adhesive of the type used in standard instrument peel packs. We specify both materials as compatible with all sterilization methods.",
        "closureTitle": "Closure and processing",
        "closure": [
          "Complete the closure: press down and smooth the adhesive ends repeatedly to bond the straps securely.",
          "Reinforce adhesive areas with sterilization tape as needed.",
          "Tuck in and reinforce the corners for extra protection.",
          "Sterilize using the applicable validated process for the surgical wrap and tray."
        ]
      },
      "specifications": [
        {
          "label": "Product code",
          "value": "Available on request"
        },
        {
          "label": "Quantity (box)",
          "value": "Request for a quote"
        },
        {
          "label": "Regulatory classification",
          "value": "Class I medical device"
        }
      ]
    },
    {
      "slug": "quality-assurance-card",
      "name": "Quality Assurance Card",
      "category": "sterile-barrier",
      "summary": "A colour-changing card that sticks to wrapped surgical instrument sets, giving a surface to write on without compromising the wrap.",
      "image": "productQualityAssuranceCard",
      "body": [
        "The Quality Assurance Card attaches to a wrapped instrument set and provides a surface for written information. Its colour changes as described in the product instructions. It is intended to help staff distinguish sterile sets from non-sterile items.",
        "This quality assurance card is compatible with steam, hydrogen peroxide gas, ethylene oxide gas and ozone sterilisation."
      ],
      "features": [
        "Colour-changing card",
        "Writing surface that does not compromise the wrap",
        "Helps separate sterile from non-sterile instruments",
        "Sticks to wrapped instrument sets"
      ],
      "applications": [
        "Wrapped surgical instrument sets"
      ],
      "specifications": [
        {
          "label": "Product code",
          "value": "Available on request"
        },
        {
          "label": "Quantity (box)",
          "value": "Request for a quote"
        },
        {
          "label": "Compatible sterilisation methods",
          "value": "Steam, hydrogen peroxide gas, ethylene oxide gas, ozone"
        }
      ]
    },
    {
      "slug": "basic-health-monitor",
      "name": "Basic Health Monitor COVIDOT",
      "category": "monitoring",
      "summary": "A wearable monitor with a red thermometer alert for indicating a possible fever, as described in the product instructions.",
      "image": "productHealthMonitor",
      "body": [
        "COVIDOT is a wearable health monitor designed to provide a visible alert when it detects the conditions described in its instructions. It is intended to support preliminary checks and should be used alongside appropriate advice from a qualified healthcare professional.",
        "The device uses a red thermometer symbol to indicate a potential fever. This alert is not a diagnosis and cannot confirm whether someone has COVID-19 or another illness. Anyone with symptoms or concerns should seek advice from a healthcare professional.",
        "The product information also describes a red alert when the device is exposed to ultraviolet light. Use this feature only as described in the manufacturer's instructions. The alert is not a substitute for recognised sun-protection advice or medical assessment.",
        "COVIDOT is intended for preliminary monitoring in settings such as homes, workplaces, schools and healthcare facilities. It does not replace a clinical thermometer, medical assessment or any screening process required by local health guidance."
      ],
      "features": [
        "Highly sensitive red thermometer alert",
        "Early detection of low to high grade fever",
        "Red alert on exposure to potentially harmful ultraviolet light",
        "Designed for everyone, including children"
      ],
      "applications": [
        "At home and at work",
        "Schools and public venues",
        "Preliminary screening in hospitals, clinics and herbal health centres"
      ],
      "specifications": [
        {
          "label": "Product code",
          "value": "Available on request"
        },
        {
          "label": "Quantity (box)",
          "value": "Request for a quote"
        },
        {
          "label": "Regulatory classification",
          "value": "Class I medical device"
        }
      ],
      "application": "Apply the Health Monitor on a clean wrist, chest, neck, forehead or similar. The appearance of a red thermometer on the device, under normal weather conditions, indicates the detection of potential fever. It is highly recommended that you follow up with your medical doctor.",
      "faq": [
        [
          "What is COVIDOT?",
          "COVIDOT is a Class I medical device designed for the early detection of low to high grade fever associated with communicable diseases."
        ],
        [
          "Can COVIDOT be used to monitor basal body temperature?",
          "Yes."
        ],
        [
          "How long can I wear COVIDOT?",
          "As long as you wish, but not to exceed 3 days."
        ],
        [
          "Can children wear COVIDOT?",
          "Yes. COVIDOT is designed for everyone."
        ],
        [
          "Should COVIDOT be used as a screening thermometer?",
          "Yes."
        ],
        [
          "Does a normal red thermometer alert mean I'm sick?",
          "Most likely. Please call your physician."
        ],
        [
          "Is COVIDOT for indoors and outdoors?",
          "Yes. It confirms how your body feels indoors and outdoors. It is a preliminary aid to your health and wellness."
        ],
        [
          "Besides the wrist, can I use COVIDOT on my forehead?",
          "Yes, but it should not be used in the mouth or ear."
        ],
        [
          "Does COVIDOT require special storage?",
          "No. Just store in a cool, dry area."
        ],
        [
          "Can COVIDOT be used to monitor fever after surgery?",
          "Yes. Fever is one of the prime symptoms of surgical site infection, which can be detected with the use of the Basic Health Monitor."
        ]
      ]
    }
  ],
  "software": [
    {
      "slug": "surgiciss-matrix",
      "name": "Sterile Matrix (AI)",
      "summary": "A management system for tracking sterile processing work, equipment and supplies, with reporting tools to help teams review workloads and day-to-day operations.",
      "body": [
        "Sterile Matrix (AI) is a management system for sterile processing departments. It brings together information about instruments, equipment, supplies and staff activity so teams can review their workload and identify issues that may affect operating room preparation.",
        "The system includes tools for workload assessment, staff schedules, attendance and performance records. These tools are intended to help managers organise work and review how the department is operating. They do not replace staff training, clinical judgement or established procedures.",
        "Sterile Matrix provides reports on areas such as productivity, quality, efficiency, risk, compliance and budgets. Managers can use these reports to support operational decisions and identify areas that may need attention. Results depend on the information entered and should be reviewed by the responsible team."
      ],
      "modules": [
        "Workload assessment and staff schedules",
        "Attendance and performance records",
        "Analysis to help identify possible workflow issues",
        "Reports on productivity, quality, efficiency, risk, compliance and budgets"
      ],
      "benefits": [
        "A clearer view of workloads and staff schedules",
        "Records to support routine performance reviews",
        "Reports that help managers identify areas for improvement",
        "Information to support operational planning"
      ],
      "image": "softwareDashboard"
    },
    {
      "slug": "case-cart-matrix",
      "name": "Case Cart Matrix",
      "summary": "A case cart picking system that helps teams organise items for scheduled procedures and keep relevant staff informed about cart preparation.",
      "body": [
        "Case Cart Matrix helps teams prepare case carts for scheduled procedures. It can be used to manage schedules or, where an integration is available, connect with an existing surgery scheduling system.",
        "The system can notify designated team members when cases are scheduled, when carts are pulled and when required items are missing. This helps staff follow up before a procedure is due to begin.",
        "Case Cart Matrix supports batch picking. Staff can collect items for several carts during the same pass through the storage area, where the layout and available space allow. This can reduce repeated trips between shelves, racks and bins.",
        "The system records the items and instrument sets assigned to each procedure and can help teams keep inventory information up to date. It is intended to make missing items and scheduling issues easier to spot; it does not guarantee that errors or delays will be eliminated.",
        "Where supplier integrations are configured, the system can support stock-level monitoring and purchasing workflows. Availability of these functions depends on the supplier connection and the setup in place."
      ],
      "modules": [
        "Batch picking of many case carts at once",
        "Surgery scheduling, or interface with existing scheduling systems",
        "Notifications when cases are scheduled and carts are pulled",
        "Missing item and instrument alerts",
        "Item and set tracking with live inventory",
        "Par level tracking and one-click ordering"
      ],
      "benefits": [
        "A more organised case cart picking process",
        "Fewer repeated trips between storage areas",
        "Earlier visibility of missing items",
        "Better records for planning staff and supplies"
      ],
      "image": "softwareCaseCart"
    },
    {
      "slug": "crash-cart-matrix",
      "name": "Crash Cart Matrix",
      "summary": "A system for recording crash cart checks and flagging items that are nearing or past their expiry dates.",
      "body": [
        "Crash carts need to be checked regularly so that staff can find the equipment and supplies required in an emergency. Keeping inspection records up to date is an important part of that work.",
        "Manual crash cart checks take staff time, particularly when a facility has many carts. The time and cost involved will vary by facility, staffing arrangements and inspection process.",
        "Missed checks, expired supplies and incomplete records can create additional work and may affect readiness. Facilities should set inspection procedures that match their policies and clinical requirements.",
        "Crash Cart Matrix is designed to help teams record crash cart checks and identify items that are approaching or past their expiry dates. The system can support follow-up and exchange workflows, but staff must still carry out the required physical checks."
      ],
      "modules": [
        "Automatic daily monitoring for expired items",
        "Crash cart exchange tracking",
        "Alerts to concerned team members"
      ],
      "benefits": [
        "A record of completed crash cart checks",
        "Alerts for items that need attention",
        "A clearer view of cart exchange activity",
        "Less reliance on manual follow-up alone"
      ],
      "image": "softwareCrashCart"
    },
    {
      "slug": "endoscope-matrix",
      "name": "Endoscope Matrix",
      "summary": "A system for recording endoscope reprocessing steps and monitoring the checks configured by the facility.",
      "body": [
        "Endoscopes must be processed and handled according to the manufacturer's instructions. Missed or incomplete steps in pre-cleaning, testing, cleaning, disinfection or sterilisation can put patients at risk.",
        "Endoscopy teams need clear procedures and suitable training to make sure each scope is processed, checked and stored correctly.",
        "Endoscope Matrix is intended to help teams record the required processing steps for each scope, including pre-cleaning, leak testing, cleaning, disinfection and sterilisation where applicable. Staff should always follow the instructions for the specific endoscope and the equipment used to process it.",
        "The system stores processing records and can provide alerts for the endoscope and disinfectant checks configured by the facility. Staff remain responsible for confirming that each scope and disinfectant is suitable for use."
      ],
      "modules": [
        "Pre-clean, leak test, clean, disinfect or sterilise steps tracked per scope",
        "Manufacturer instructions applied to each scope model",
        "Electronic data on each processed and used endoscope",
        "Automatic endoscope and disinfectant monitoring"
      ],
      "benefits": [
        "A record of the processing steps completed for each scope",
        "Alerts for configured scope and disinfectant checks",
        "Information staff can review during routine checks",
        "Support for local documentation and follow-up procedures"
      ],
      "image": "softwareEndoscope"
    }
  ],
  "services": [
    {
      "slug": "sterile-processing-management-and-leadership",
      "name": "Sterile Processing Management & Leadership",
      "summary": "Management support for departments reviewing their structure, workload or leadership arrangements.",
      "image": "serviceLeadership",
      "body": [
        "A sterile processing department may need stronger day-to-day management, a change in direction, or both. The right approach depends on the department's current workload, staffing and priorities.",
        "We work with decision makers to review how the department is organised and where support is needed. This may include management cover, changes to responsibilities or a plan to address ongoing operational problems.",
        "We review current working practices with senior staff and identify changes that are realistic for the team, equipment and resources available."
      ],
      "includes": [
        "Review of departmental structure and workload",
        "Interim leadership or management support",
        "Standard operating procedure review",
        "Coaching for supervisors and team leaders"
      ]
    },
    {
      "slug": "sterile-processing-morale-boosting-sessions",
      "name": "Sterile Processing Morale Boosting Sessions",
      "summary": "Team sessions focused on workload, communication and the day-to-day issues affecting sterile processing staff.",
      "image": "serviceMorale",
      "body": [
        "Sterile processing teams come to work to prepare instruments and equipment for patient care. Workload, staffing and communication problems can make that job harder than it needs to be.",
        "When a team is under pressure for long periods, communication can suffer and problems may arise between the processing department and theatre staff.",
        "Sessions can cover workload distribution, staff recognition, communication with theatre and recurring issues raised by the team. Supervisors and technicians are both involved."
      ],
      "includes": [
        "Facilitated team sessions on site",
        "Workload and rota review",
        "Communication between theatre and the department",
        "Follow-up session to check what has changed"
      ]
    },
    {
      "slug": "sterile-processing-technician-training-programme",
      "name": "Sterile Processing Technician Training Programme",
      "summary": "Training in sterile processing, using the equipment and instrument sets technicians work with each day.",
      "image": "serviceTraining",
      "body": [
        "Technicians need a sound understanding of sterile processing principles to carry out their work consistently and follow the required procedures.",
        "Our training programme covers decontamination, inspection and assembly, packaging, sterilisation and storage, taught around the equipment and instrument sets the team handles every day rather than as abstract theory.",
        "Programme length, assessment and any certification arrangements are agreed with each customer."
      ],
      "includes": [
        "Decontamination principles and practice",
        "Instrument inspection and assembly",
        "Packaging and sterile barrier systems",
        "Sterilisation, monitoring and storage"
      ]
    }
  ],
  "programmes": [
    {
      "slug": "cost-reduction-programme",
      "name": "Cost Reduction Programme",
      "summary": "A review of instrument spending, repair and replacement decisions, and routine sources of waste.",
      "image": "serviceLeadership",
      "body": [
        "Department costs can build up through routine decisions, including oversized instrument sets, avoidable replacements and stock orders that are not based on actual use.",
        "Our cost reduction programme works through those decisions with the department, using its own records, and reports where money is going and what could reasonably be recovered.",
        "Commercial terms for the SURGICISS programme are set out in the proposal."
      ]
    },
    {
      "slug": "loaner-instrument-processing",
      "name": "Loaner Instrument Processing",
      "summary": "A process for receiving, checking and preparing loaner instrument sets before scheduled procedures.",
      "image": "serviceTraining",
      "body": [
        "Loaner sets can arrive close to the procedure date and may be unfamiliar to the team. Some arrive incomplete or with instructions that need to be reviewed before processing begins.",
        "We help departments put a loaner routine in place: booking-in expectations for suppliers, realistic lead times, inspection at receipt, and a record that stands up when a set is queried afterwards."
      ]
    },
    {
      "slug": "sterile-forensics-programme",
      "name": "Sterile Forensics Programme",
      "summary": "A review of recurring instrument and equipment processing problems, including staining, wet loads and damaged sets.",
      "image": "serviceMorale",
      "body": [
        "Recurring processing problems may continue when the underlying cause has not been identified.",
        "Our sterile forensics programme identifies, classifies and resolves those issues: staining and residue, wet loads, damaged sets, repeated theatre rejections and equipment that never quite performs as it should.",
        "Findings are reported with the evidence behind them, so the department can act on them and show what changed."
      ]
    }
  ]
};
