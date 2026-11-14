// Site content: products, software, services and programmes.
const DATA = {
  "productCategories": [
    {
      "slug": "sterile-barrier",
      "name": "Sterile Barrier Products",
      "description": "Wraps, cards and test devices that protect the sterile barrier from the moment a set leaves the sterilizer until it is opened in theatre."
    },
    {
      "slug": "count-sheet-holders",
      "name": "Instrument Count Sheet Holders",
      "description": "Holders that keep surgical count sheets separate from instruments and implants throughout processing."
    },
    {
      "slug": "workstation-organisation",
      "name": "Workstation Organisation",
      "description": "Racks and storage devices that consolidate sterile services supplies and ease bottlenecks at each work station."
    },
    {
      "slug": "monitoring",
      "name": "Monitoring Devices",
      "description": "Simple indicators that support routine monitoring and everyday compliance checks."
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
      "summary": "A Class I medical device for the early detection of low to high grade fever associated with communicable diseases, with a highly sensitive red thermometer alert.",
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
        "Workload assessment and work schedules",
        "Attendance and general performance management",
        "Predictive algorithms to minimise errors and delay",
        "Real-time analysis of productivity, quality, efficiency, risk, compliance and budgets"
      ],
      "benefits": [
        "Right-first-time results in sterile processing departments, operating rooms and patient care areas",
        "Fewer medical errors and operating room delays",
        "Lower cost of surgery and patient care",
        "Sound, swift decision making from real-time clinical data"
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
        "Case carts picked ten times faster and accurately",
        "Far less walking and wasted effort",
        "Fewer errors, scheduling conflicts and surgical delays",
        "Labour freed up for other areas"
      ],
      "image": "softwareCaseCart"
    },
    {
      "slug": "crash-cart-matrix",
      "name": "Crash Cart Matrix",
      "summary": "The first of its kind: automatic daily monitoring of crash carts for expired items, with faster exchanges and no phone calls.",
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
        "Expired items never reach a patient",
        "Shorter crash cart exchange times",
        "No phone calls for crash carts",
        "Lower cost of daily monitoring, delay and waste"
      ],
      "image": "softwareCrashCart"
    },
    {
      "slug": "endoscope-matrix",
      "name": "Endoscope Matrix",
      "summary": "Smart endoscope reprocessing control: each scope pre-cleaned, leak tested, cleaned, disinfected or sterilised as the manufacturer specifies, with expiry alerts.",
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
        "Each scope reprocessed as its manufacturer specifies",
        "Technicians and end-users alerted to expired scopes and patient risk",
        "Patient safety and regulatory compliance upheld",
        "Swift decisions from electronic data"
      ],
      "image": "softwareEndoscope"
    }
  ],
  "services": [
    {
      "slug": "sterile-processing-management-and-leadership",
      "name": "Sterile Processing Management & Leadership",
      "summary": "Support for decision makers deciding whether their department needs steady management or genuine change.",
      "image": "serviceLeadership",
      "body": [
        "Change is what distinguishes a leader from a manager. Leaders take an institution to a new level; managers hold the level that has been reached. Both matter, and they rarely sit in the same person.",
        "For a sterile services department to thrive, decision makers first have to be honest about what the department needs. If change is required, the department needs a leader. If the department is already sound, it needs a manager. Departments that are struggling are often given a manager when what they needed was a leader — which is one reason turnover in sterile services management is so high.",
        "There are also times when theatre staff and processing technicians cannot see that anything is wrong, because they have not had sight of a better standard. Limitations start to look like the normal order of business. We work alongside senior staff to set out what the department actually needs and what it would take to get there."
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
      "summary": "Practical sessions for teams that are overstretched, so the department stops running on goodwill alone.",
      "image": "serviceMorale",
      "body": [
        "All things being equal, nobody comes to work to do harm. Processing technicians come in to deliver clean, sterile, functional and relevant instruments.",
        "There are times, though, when a team is overworked and overwhelmed, and morale falls far enough to affect what reaches theatre. When that happens, blame tends to travel between departments and very little improves.",
        "Our sessions deal with the causes rather than the symptoms: workload distribution, recognition, communication with theatre, and the small daily frustrations that wear a team down. We work with the whole team, not only the supervisors."
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
      "summary": "Core knowledge of sterile sciences for technicians, taught around the equipment and sets they handle every day.",
      "image": "serviceTraining",
      "body": [
        "No one can give what they do not have. A processing technician cannot deliver dependable instrument outcomes without a working knowledge of sterile sciences.",
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
      "summary": "A structured review of instrument spend, repair and replacement decisions and the waste hidden inside routine processing.",
      "image": "serviceLeadership",
      "body": [
        "A great deal of the money a department spends is committed by habit: sets built larger than the procedure needs, instruments replaced when they could be repaired, consumables ordered because a shelf looks empty.",
        "Our cost reduction programme works through those decisions with the department, using its own records, and reports where money is going and what could reasonably be recovered.",
        "Commercial terms for the SURGICISS programme are set out in the proposal."
      ]
    },
    {
      "slug": "loaner-instrument-processing",
      "name": "Loaner Instrument Processing",
      "summary": "A workable routine for loaner sets, which usually arrive late, heavy, incomplete and unfamiliar to the team.",
      "image": "serviceTraining",
      "body": [
        "Loaner sets are the most demanding trays a department handles. They often arrive dirty, heavy and incomplete, with assembly instructions the team has never seen before, and they are needed for a list that has already been booked.",
        "We help departments put a loaner routine in place: booking-in expectations for suppliers, realistic lead times, inspection at receipt, and a record that stands up when a set is queried afterwards."
      ]
    },
    {
      "slug": "sterile-forensics-programme",
      "name": "Sterile Forensics Programme",
      "summary": "Investigation of recurring instrument and equipment processing problems, from the routine to the genuinely complex.",
      "image": "serviceMorale",
      "body": [
        "Some processing problems keep coming back regardless of how much effort is put into them, because the cause sits somewhere nobody has looked.",
        "Our sterile forensics programme identifies, classifies and resolves those issues: staining and residue, wet loads, damaged sets, repeated theatre rejections and equipment that never quite performs as it should.",
        "Findings are reported with the evidence behind them, so the department can act on them and show what changed."
      ]
    }
  ]
};
