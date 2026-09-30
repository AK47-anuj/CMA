// MET Institute of Management - Smart College Management System (SCMS)
// Initial Seed Data Store

const SCMS_DATA = {
  tenant: {
    id: "tenant_met_mgmt",
    organization: "MET Bhujbal Knowledge City",
    institute: "MET Institute of Management",
    department: "Department of Management Studies (DMS)",
    academicYear: "AY 2026–2027 (Odd Semester)",
    accreditation: "Autonomous • AICTE Approved • NAAC 'A+' Grade • NBA Tier-1",
    address: "Bhujbal Knowledge City, Bandra Reclamation, Bandra (West), Mumbai 400 050",
    schema: "tenant_met_iom_dms"
  },

  // EXACTLY TWO LOGIN ROLES: 'HOD' and 'FACULTY'
  users: [
    {
      id: "usr_hod_01",
      name: "Prof. Nilesh Bread",
      role: "HOD",
      email: "hod@met.edu",
      designation: "Head of Department & Professor",
      status: "ACTIVE",
      avatar: "NB",
      department: "Management Studies"
    },
    {
      id: "usr_fac_01",
      name: "Prof. Shubhangi Phade",
      role: "FACULTY",
      email: "shubhangi@met.edu",
      designation: "Assistant Professor & Event Lead",
      status: "ACTIVE",
      avatar: "SP",
      department: "Management Studies"
    },
    {
      id: "usr_fac_02",
      name: "Prof. Akshay Kale",
      role: "FACULTY",
      email: "akshay@met.edu",
      designation: "Academic Co-ordinator & Assistant Professor",
      status: "ACTIVE",
      avatar: "AK",
      department: "Management Studies"
    },
    {
      id: "usr_fac_03",
      name: "Dr. Rahul Sharma",
      role: "FACULTY",
      email: "rahul.sharma@met.edu",
      designation: "Associate Professor (Finance)",
      status: "PENDING_HOD_APPROVAL",
      registeredAt: "2026-09-28 09:15 AM",
      avatar: "RS",
      department: "Management Studies"
    },
    {
      id: "usr_fac_04",
      name: "Prof. Meera Nair",
      role: "FACULTY",
      email: "meera.nair@met.edu",
      designation: "Assistant Professor (Marketing)",
      status: "PENDING_HOD_APPROVAL",
      registeredAt: "2026-09-28 11:30 AM",
      avatar: "MN",
      department: "Management Studies"
    }
  ],

  historicalReminders: [
    {
      id: "rem-001",
      eventTitle: "Annual State-Level Hackathon & Innovation Conclave",
      eventType: "Competition",
      originalDate: "2025-10-05",
      anniversaryDate: "2026-10-05",
      reminderTriggerDate: "2026-09-28",
      daysRemaining: 7,
      isToday: true,
      priorYearStats: {
        participants: 240,
        budget: "₹1,50,000",
        winners: "Team AlgoKnights (VJTI)",
        coordinator: "Prof. Akshay Kale"
      },
      status: "ACTIVE_ALERT"
    },
    {
      id: "rem-002",
      eventTitle: "National Faculty Development Program (FDP) on AI in Finance",
      eventType: "Workshop",
      originalDate: "2025-10-08",
      anniversaryDate: "2026-10-08",
      reminderTriggerDate: "2026-10-01",
      daysRemaining: 10,
      isToday: false,
      priorYearStats: {
        participants: 65,
        budget: "₹85,000",
        resourcePerson: "Dr. A. Swaminathan (HDFC AMC)",
        coordinator: "Prof. Shubhangi Phade"
      },
      status: "UPCOMING"
    }
  ],

  eventReports: [
    {
      id: "RPT-2026-GL-104",
      title: "Industry 4.0 & Supply Chain Masterclass",
      type: "Guest Lecture",
      submittedBy: "Prof. Akshay Kale",
      submittedByEmail: "akshay@met.edu",
      submittedTime: "2 hours ago",
      date: "2026-09-26",
      time: "10:00 AM - 01:00 PM",
      venue: "Executive Seminar Hall, 4th Floor",
      speaker: "Mr. Rajiv Singhania, VP Supply Chain, Mahindra Logistics",
      attendees: 185,
      facultyInvolved: "Prof. Akshay Kale, Prof. Shubhangi Phade",
      quorumStatus: "100% Biometric Verified",
      photosAttached: 4,
      status: "PENDING_HOD_APPROVAL",
      objectives: "To provide real-world insights into automated warehouse robotics, real-time telemetry, and cold-chain resilience.",
      activities: "Keynote presentation followed by live telemetry simulation and student Q&A on ERP procurement.",
      outcomes: "Students understood ERP-integrated warehouse management systems and modern procurement KPIs.",
      curriculumMapping: "NAAC Criterion 1.3.2 • Course Outcome: MBA-SCM-401"
    },
    {
      id: "RPT-2026-WS-088",
      title: "Algorithmic Trading & High-Frequency Quantitative Finance",
      type: "Workshop",
      submittedBy: "Prof. Shubhangi Phade",
      submittedByEmail: "shubhangi@met.edu",
      submittedTime: "Yesterday",
      date: "2026-09-24",
      time: "09:30 AM - 04:30 PM",
      venue: "Computer Lab 3 & Bloomberg Terminal Room",
      speaker: "Dr. Neha Varma, Quantitative Researcher, Alpha Capital",
      attendees: 120,
      facultyInvolved: "Prof. Shubhangi Phade",
      quorumStatus: "100% Biometric Verified",
      photosAttached: 6,
      status: "PENDING_HOD_APPROVAL",
      objectives: "Hands-on execution of Python backtesting for moving-average crossover strategies.",
      activities: "Algorithmic backtesting labs using Jupyter notebooks with real-time tick data.",
      outcomes: "Participants deployed real-time paper trading algorithms with risk-reward ratios calculated.",
      curriculumMapping: "NAAC Criterion 1.3.3 • Course Outcome: MBA-FIN-304"
    },
    {
      id: "RPT-2026-IV-045",
      title: "Industrial Visit to National Stock Exchange (NSE) & SEBI Bhavan",
      type: "Industrial Visit",
      submittedBy: "Prof. Shubhangi Phade",
      submittedByEmail: "shubhangi@met.edu",
      submittedTime: "Sept 23, 2026",
      date: "2026-09-22",
      time: "09:00 AM - 05:00 PM",
      venue: "BKC Financial District, Mumbai",
      speaker: "Mr. T. Srinivasan, Chief Education Officer, NSE",
      attendees: 94,
      facultyInvolved: "Prof. Shubhangi Phade, Prof. Akshay Kale",
      quorumStatus: "100% Verified",
      photosAttached: 8,
      status: "REJECTED",
      rejectionReason: "GPS timestamp metadata was missing on 2 site photographs. Please re-upload verified geotagged photos and resubmit.",
      objectives: "Exposure to clearing corporation architectures, settlement cycles (T+1), and investor grievance cells.",
      activities: "Live trading floor observation and interaction with regulatory surveillance team.",
      outcomes: "Comprehensive field visit report prepared by students with compliance case study.",
      curriculumMapping: "NAAC Criterion 1.3.4 • Course Outcome: MBA-FIN-202"
    },
    {
      id: "RPT-2026-SEM-082",
      title: "National Seminar on Sustainable ESG Investment & Green Financing",
      type: "Seminar",
      submittedBy: "Prof. Shubhangi Phade",
      submittedByEmail: "shubhangi@met.edu",
      approvedBy: "Prof. Nilesh Bread (HOD)",
      approvalDate: "2026-09-18",
      date: "2026-09-16",
      time: "10:00 AM - 04:00 PM",
      venue: "Convention Center, MET Bhujbal Knowledge City",
      speaker: "Mr. S. Ramakrishnan, VP ESG Advisory, Tata Consultancy Services",
      attendees: 320,
      facultyInvolved: "Prof. Shubhangi Phade, Prof. Nilesh Bread",
      quorumStatus: "100% Biometric Verified",
      photosAttached: 6,
      status: "APPROVED",
      digitalSignatureHash: "SHA256: 8f9b2d073c...9a41ee",
      documentRef: "MET/IOM/DMS/2026/SEM-082",
      objectives: "Examine evolving SEBI BRSR Core frameworks and ESG risk assessment models.",
      activities: "Panel discussion with corporate sustainability directors and institutional ESG underwriters.",
      outcomes: "Students compiled 5 institutional ESG due-diligence framework case studies."
    }
  ],

  meetings: [
    {
      id: "MOM-2026-BOS-03",
      title: "Board of Studies (BoS) Q3 Curriculum Review Meeting",
      committee: "Board of Studies in Management",
      date: "2026-09-25",
      time: "10:00 AM - 12:30 PM",
      venue: "Conference Boardroom A",
      chairperson: "Prof. Nilesh Bread (Head of Department)",
      membersPresent: "Prof. Nilesh Bread, Prof. Akshay Kale, Prof. Shubhangi Phade, External Expert: Mr. R. Singhania",
      agenda: "1. Review of Odd-Semester AY 2026-27 Electives.\n2. Inclusion of Generative AI in Financial Risk Modelling (4 Credits).\n3. Academic Calendar and Industrial Visit Schedule Ratification.",
      discussionPoints: "External expert emphasized aligning syllabus with industry cloud compliance. Credit weightage discussed.",
      decisions: "Resolved unanimously to introduce MBA-FIN-408 'Generative AI in Financial Engineering' with immediate effect. Approved industrial visit proposal for NSE/SEBI.",
      actionItems: [
        { task: "Draft course syllabus guidelines", responsible: "Prof. Akshay Kale", deadline: "2026-10-05" },
        { task: "Confirm student registrations & bus logistics", responsible: "Prof. Shubhangi Phade", deadline: "2026-10-07" }
      ],
      status: "PENDING_HOD_APPROVAL",
      submittedBy: "Prof. Akshay Kale"
    },
    {
      id: "MOM-2026-FAC-01",
      title: "Department Faculty Planning & Accreditation Review",
      committee: "Department Academic Committee",
      date: "2026-09-12",
      time: "02:00 PM - 03:30 PM",
      venue: "DMS Meeting Room",
      chairperson: "Prof. Nilesh Bread (Head of Department)",
      membersPresent: "All 28 Faculty Members Present",
      agenda: "1. NAAC SSR Criterion 1 documentation audit.\n2. Workload distribution for Odd Sem.\n3. Historical event reminder protocol.",
      discussionPoints: "Reviewed documentation bottleneck. Adopted SCMS enter-once workflow.",
      decisions: "All workshop and guest lecture reports to be submitted within 48 hours of completion.",
      actionItems: [
        { task: "Upload past year event records for 7-day radar", responsible: "Prof. Shubhangi Phade", deadline: "2026-09-20" }
      ],
      status: "APPROVED",
      approvedBy: "Prof. Nilesh Bread (HOD)",
      approvalDate: "2026-09-13",
      submittedBy: "Prof. Shubhangi Phade"
    }
  ],

  calendarEvents: [
    {
      id: "cal-01",
      date: "2026-09-29",
      time: "10:00 AM - 12:30 PM",
      title: "BoS Curriculum Alignment & Credit Audit Meeting",
      type: "Meeting",
      venue: "Boardroom A",
      tag: "Academic Governance"
    },
    {
      id: "cal-02",
      date: "2026-10-02",
      time: "Full Day",
      title: "Mahatma Gandhi Jayanti",
      type: "Holiday",
      venue: "Campus Closed",
      tag: "Statutory Holiday"
    },
    {
      id: "cal-03",
      date: "2026-10-05",
      time: "09:00 AM - 06:00 PM",
      title: "Annual State-Level Hackathon 2026 (Anniversary Re-run)",
      type: "Competition",
      venue: "Auditorium & Innovation Hub",
      tag: "Flagship Event"
    },
    {
      id: "cal-04",
      date: "2026-10-08",
      time: "10:30 AM - 04:30 PM",
      title: "National FDP on AI in Finance & Algorithmic Banking",
      type: "Workshop",
      venue: "Executive Seminar Hall",
      tag: "Faculty Development"
    },
    {
      id: "cal-05",
      date: "2026-10-14",
      time: "10:00 AM - 01:30 PM",
      title: "National Conclave on Generative AI & FinTech Disruption",
      type: "Guest Lecture",
      venue: "Convention Center, MET",
      tag: "Guest Conclave"
    },
    {
      id: "cal-06",
      date: "2026-10-18",
      time: "10:00 AM - 05:00 PM",
      title: "MBA Mid-Term Review & Continuous Evaluation Defense",
      type: "Academic",
      venue: "Classrooms 401-408",
      tag: "Examinations"
    }
  ],

  auditLog: [
    { timestamp: "2026-09-28 11:30 AM", actor: "System", action: "FACULTY_REGISTRATION", details: "Prof. Meera Nair submitted registration (Status: PENDING_HOD_APPROVAL)" },
    { timestamp: "2026-09-28 09:15 AM", actor: "System", action: "FACULTY_REGISTRATION", details: "Dr. Rahul Sharma submitted registration (Status: PENDING_HOD_APPROVAL)" },
    { timestamp: "2026-09-28 08:00 AM", actor: "System Cron", action: "HISTORICAL_REMINDER_TRIGGER", details: "7-Day Radar fired for State-Level Hackathon (Original: 2025-10-05)" },
    { timestamp: "2026-09-26 04:15 PM", actor: "Prof. Akshay Kale", action: "EVENT_REPORT_SUBMITTED", details: "Submitted 'Industry 4.0 & Supply Chain Masterclass' for HOD Review" },
    { timestamp: "2026-09-25 05:00 PM", actor: "Prof. Nilesh Bread (HOD)", action: "MOM_GENERATION", details: "Formalized Board of Studies Q3 Minutes of Meeting" },
    { timestamp: "2026-09-23 03:20 PM", actor: "Prof. Nilesh Bread (HOD)", action: "EVENT_REPORT_REJECTED", details: "Returned Industrial Visit RPT-2026-IV-045 with revision note on GPS metadata" },
    { timestamp: "2026-09-18 11:45 AM", actor: "Prof. Nilesh Bread (HOD)", action: "EVENT_REPORT_APPROVED", details: "Approved National Seminar RPT-2026-SEM-082 with digital signature" }
  ]
};

module.exports = SCMS_DATA;
