/**
 * Seed Data Generator for MET SCMS
 * 
 * Generates seed data relative to "today" (from clock.now()) so the demo
 * never goes stale. When DEMO_MODE=true, creates rich scenarios including:
 * - Past approved events with one anniversary exactly 7 days from today
 * - Reports in every status (DRAFT, PENDING, APPROVED, REJECTED)
 * - Meetings in various lifecycle stages
 * - Calendar entries for the current academic year
 * - Demo user accounts with hashed passwords
 */

const bcryptjs = require('bcryptjs');
const crypto = require('crypto');

function generateSeed() {
  const clock = require('../utils/clock');
  const now = clock.now();
  const today = now.toISOString().split('T')[0];
  
  // Helper to format dates
  const fmt = (d) => d.toISOString().split('T')[0];
  const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
  const subDays = (d, n) => addDays(d, -n);
  const subMonths = (d, n) => { const r = new Date(d); r.setMonth(r.getMonth() - n); return r; };
  const addMonths = (d, n) => { const r = new Date(d); r.setMonth(r.getMonth() + n); return r; };

  // Hash password for demo accounts
  const demoPasswordHash = bcryptjs.hashSync('Demo@1234', 10);

  // Event that has anniversary exactly 7 days from today → original was 1 year + 7 days ago
  const reminderEventDate = fmt(subDays(new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()), 0));
  // The anniversary of this event is today's date next year... no, we want anniversary 7 days from now
  // An event on date X has anniversary on same month/day the next year.
  // For a reminder to trigger today, we need: anniversary = today + 7 days, so original date = (today+7) but last year
  const sevenDaysFromNow = addDays(now, 7);
  const eventFor7DayReminder = fmt(new Date(sevenDaysFromNow.getFullYear() - 1, sevenDaysFromNow.getMonth(), sevenDaysFromNow.getDate()));
  
  // Event 10 days from now (for demo clock testing)
  const tenDaysFromNow = addDays(now, 10);
  const eventFor10DayReminder = fmt(new Date(tenDaysFromNow.getFullYear() - 1, tenDaysFromNow.getMonth(), tenDaysFromNow.getDate()));

  // Leap year event: 29 Feb of a past leap year
  const leapYearEvent = '2024-02-29';

  // Past dates for events
  const pastDate1 = fmt(subDays(now, 5));
  const pastDate2 = fmt(subDays(now, 12));
  const pastDate3 = fmt(subDays(now, 20));
  const pastDate4 = fmt(subDays(now, 30));
  const pastDate5 = fmt(subDays(now, 45));
  const pastDate6 = fmt(subDays(now, 60));

  // Future dates for meetings
  const futureDate1 = fmt(addDays(now, 3));
  const futureDate2 = fmt(addDays(now, 8));
  const futureDate3 = fmt(subDays(now, 2)); // recently held

  // Academic year
  const currentYear = now.getFullYear();
  const academicYearStart = now.getMonth() >= 5 ? currentYear : currentYear - 1; // June start

  const data = {
    _schemaVersion: 2,

    tenant: {
      id: 'tenant_met_mgmt',
      organization: 'MET Bhujbal Knowledge City',
      institute: 'MET Institute of Management',
      department: 'Department of Management Studies (DMS)',
      academicYear: `AY ${academicYearStart}–${academicYearStart + 1}`,
      accreditation: "Autonomous • AICTE Approved • NAAC 'A+' Grade • NBA Tier-1",
      address: 'Bhujbal Knowledge City, Bandra Reclamation, Bandra (West), Mumbai 400 050',
      schema: 'tenant_met_iom_dms'
    },

    users: [
      {
        id: 'usr_hod_01',
        name: 'Prof. Nilesh Bread',
        role: 'HOD',
        email: 'hod@met.edu',
        passwordHash: demoPasswordHash,
        authProvider: 'local',
        designation: 'Head of Department & Professor',
        status: 'ACTIVE',
        avatar: 'NB',
        department: 'Management Studies',
        failedLogins: 0,
        lockedUntil: null,
        lastLoginAt: null
      },
      {
        id: 'usr_fac_01',
        name: 'Prof. Shubhangi Phade',
        role: 'FACULTY',
        email: 'shubhangi@met.edu',
        passwordHash: demoPasswordHash,
        authProvider: 'local',
        designation: 'Assistant Professor & Event Lead',
        status: 'ACTIVE',
        avatar: 'SP',
        department: 'Management Studies',
        failedLogins: 0,
        lockedUntil: null,
        lastLoginAt: null
      },
      {
        id: 'usr_fac_02',
        name: 'Prof. Akshay Kale',
        role: 'FACULTY',
        email: 'akshay@met.edu',
        passwordHash: demoPasswordHash,
        authProvider: 'local',
        designation: 'Academic Co-ordinator & Assistant Professor',
        status: 'ACTIVE',
        avatar: 'AK',
        department: 'Management Studies',
        failedLogins: 0,
        lockedUntil: null,
        lastLoginAt: null
      },
      {
        id: 'usr_fac_04',
        name: 'Prof. Meera Nair',
        role: 'FACULTY',
        email: 'meera.nair@met.edu',
        passwordHash: demoPasswordHash,
        authProvider: 'local',
        designation: 'Assistant Professor (Marketing)',
        status: 'PENDING_HOD_APPROVAL',
        registeredAt: fmt(subDays(now, 3)),
        avatar: 'MN',
        department: 'Management Studies',
        failedLogins: 0,
        lockedUntil: null,
        lastLoginAt: null
      }
    ],

    events: [
      {
        id: 'evt_001',
        title: 'Annual State-Level Hackathon & Innovation Conclave',
        type: 'Competition',
        date: eventFor7DayReminder,
        time: '09:00 AM - 06:00 PM',
        venue: 'Auditorium & Innovation Hub',
        guest: 'Dr. Priya Mehta',
        guestDesignation: 'CTO, TechStar Innovations',
        guestOrganisation: 'TechStar Innovations',
        attendees: 240,
        facultyInvolved: 'Prof. Akshay Kale, Prof. Shubhangi Phade',
        objectives: 'To foster innovation and problem-solving skills among students through competitive hackathon challenges.',
        activities: 'State-level hackathon with 20 participating teams, innovation pitches, and expert judging panels.',
        outcomes: 'Team AlgoKnights (VJTI) won first place. 240 participants across 20 colleges.',
        status: 'APPROVED',
        createdBy: 'usr_fac_02',
        createdAt: eventFor7DayReminder,
        feedbackSummary: null,
        attachments: []
      },
      {
        id: 'evt_002',
        title: 'National Faculty Development Program (FDP) on AI in Finance',
        type: 'Workshop',
        date: eventFor10DayReminder,
        time: '10:30 AM - 04:30 PM',
        venue: 'Executive Seminar Hall',
        guest: 'Dr. A. Swaminathan',
        guestDesignation: 'VP Research, HDFC AMC',
        guestOrganisation: 'HDFC AMC',
        attendees: 65,
        facultyInvolved: 'Prof. Shubhangi Phade',
        objectives: 'Hands-on training for faculty on AI applications in financial analytics and risk modelling.',
        activities: 'Interactive sessions with hands-on exercises using Python and ML frameworks.',
        outcomes: 'Faculty members gained practical skills in deploying AI models for financial analysis.',
        status: 'APPROVED',
        createdBy: 'usr_fac_01',
        createdAt: eventFor10DayReminder,
        feedbackSummary: null,
        attachments: []
      },
      {
        id: 'evt_003',
        title: 'Leap Year Special Event — Financial Literacy Day',
        type: 'Seminar',
        date: leapYearEvent,
        time: '10:00 AM - 04:00 PM',
        venue: 'Convention Center, MET',
        guest: 'Mr. Rajan Kapoor',
        guestDesignation: 'Senior Advisor, RBI',
        guestOrganisation: 'Reserve Bank of India',
        attendees: 180,
        facultyInvolved: 'Prof. Nilesh Bread, Prof. Shubhangi Phade',
        objectives: 'Promote financial literacy among students and local community members.',
        activities: 'Keynote speeches, panel discussions, and interactive workshops on personal finance management.',
        outcomes: 'Participants gained comprehensive knowledge about savings, investments, and financial planning.',
        status: 'APPROVED',
        createdBy: 'usr_fac_01',
        createdAt: leapYearEvent,
        feedbackSummary: null,
        attachments: []
      },
      {
        id: 'evt_004',
        title: 'Industry 4.0 & Supply Chain Masterclass',
        type: 'Guest Lecture',
        date: pastDate2,
        time: '10:00 AM - 01:00 PM',
        venue: 'Executive Seminar Hall, 4th Floor',
        guest: 'Mr. Rajiv Singhania',
        guestDesignation: 'VP Supply Chain, Mahindra Logistics',
        guestOrganisation: 'Mahindra Logistics',
        attendees: 185,
        facultyInvolved: 'Prof. Akshay Kale, Prof. Shubhangi Phade',
        objectives: 'To provide real-world insights into automated warehouse robotics, real-time telemetry, and cold-chain resilience.',
        activities: 'Keynote presentation followed by live telemetry simulation and student Q&A on ERP procurement.',
        outcomes: 'Students understood ERP-integrated warehouse management systems and modern procurement KPIs.',
        status: 'APPROVED',
        createdBy: 'usr_fac_02',
        createdAt: pastDate2,
        feedbackSummary: null,
        attachments: []
      },
      {
        id: 'evt_005',
        title: 'Algorithmic Trading & High-Frequency Quantitative Finance',
        type: 'Workshop',
        date: pastDate3,
        time: '09:30 AM - 04:30 PM',
        venue: 'Computer Lab 3 & Bloomberg Terminal Room',
        guest: 'Dr. Neha Varma',
        guestDesignation: 'Quantitative Researcher, Alpha Capital',
        guestOrganisation: 'Alpha Capital',
        attendees: 120,
        facultyInvolved: 'Prof. Shubhangi Phade',
        objectives: 'Hands-on execution of Python backtesting for moving-average crossover strategies.',
        activities: 'Algorithmic backtesting labs using Jupyter notebooks with real-time tick data.',
        outcomes: 'Participants deployed real-time paper trading algorithms with risk-reward ratios calculated.',
        status: 'APPROVED',
        createdBy: 'usr_fac_01',
        createdAt: pastDate3,
        feedbackSummary: null,
        attachments: []
      },
      {
        id: 'evt_006',
        title: 'Industrial Visit to National Stock Exchange (NSE) & SEBI Bhavan',
        type: 'Industrial Visit',
        date: pastDate4,
        time: '09:00 AM - 05:00 PM',
        venue: 'BKC Financial District, Mumbai',
        guest: 'Mr. T. Srinivasan',
        guestDesignation: 'Chief Education Officer, NSE',
        guestOrganisation: 'National Stock Exchange',
        attendees: 94,
        facultyInvolved: 'Prof. Shubhangi Phade, Prof. Akshay Kale',
        objectives: 'Exposure to clearing corporation architectures, settlement cycles (T+1), and investor grievance cells.',
        activities: 'Live trading floor observation and interaction with regulatory surveillance team.',
        outcomes: 'Comprehensive field visit report prepared by students with compliance case study.',
        status: 'APPROVED',
        createdBy: 'usr_fac_01',
        createdAt: pastDate4,
        feedbackSummary: null,
        attachments: []
      },
      {
        id: 'evt_007',
        title: 'National Seminar on Sustainable ESG Investment & Green Financing',
        type: 'Seminar',
        date: pastDate5,
        time: '10:00 AM - 04:00 PM',
        venue: 'Convention Center, MET Bhujbal Knowledge City',
        guest: 'Mr. S. Ramakrishnan',
        guestDesignation: 'VP ESG Advisory, Tata Consultancy Services',
        guestOrganisation: 'Tata Consultancy Services',
        attendees: 320,
        facultyInvolved: 'Prof. Shubhangi Phade, Prof. Nilesh Bread',
        objectives: 'Examine evolving SEBI BRSR Core frameworks and ESG risk assessment models.',
        activities: 'Panel discussion with corporate sustainability directors and institutional ESG underwriters.',
        outcomes: 'Students compiled 5 institutional ESG due-diligence framework case studies.',
        status: 'APPROVED',
        createdBy: 'usr_fac_01',
        createdAt: pastDate5,
        feedbackSummary: null,
        attachments: []
      },
      {
        id: 'evt_008',
        title: 'Entrepreneurship Bootcamp — Startup Weekend',
        type: 'Workshop',
        date: pastDate6,
        time: '09:00 AM - 06:00 PM',
        venue: 'Innovation Hub, MET Campus',
        guest: 'Ms. Ananya Desai',
        guestDesignation: 'Founder & CEO, GreenTech Solutions',
        guestOrganisation: 'GreenTech Solutions',
        attendees: 150,
        facultyInvolved: 'Prof. Akshay Kale',
        objectives: 'Foster entrepreneurial mindset and practical startup skills among MBA students.',
        activities: 'Idea pitching, business model canvas workshops, mentor sessions with industry experts.',
        outcomes: '15 viable startup ideas pitched, 3 selected for incubation support.',
        status: 'APPROVED',
        createdBy: 'usr_fac_02',
        createdAt: pastDate6,
        feedbackSummary: null,
        attachments: []
      }
    ],

    eventReports: [
      {
        id: 'RPT-001',
        eventId: 'evt_004',
        title: 'Industry 4.0 & Supply Chain Masterclass',
        type: 'Guest Lecture',
        submittedBy: 'usr_fac_02',
        submittedByName: 'Prof. Akshay Kale',
        date: pastDate2,
        time: '10:00 AM - 01:00 PM',
        venue: 'Executive Seminar Hall, 4th Floor',
        guest: 'Mr. Rajiv Singhania',
        guestDesignation: 'VP Supply Chain, Mahindra Logistics',
        attendees: 185,
        facultyInvolved: 'Prof. Akshay Kale, Prof. Shubhangi Phade',
        objectives: 'To provide real-world insights into automated warehouse robotics, real-time telemetry, and cold-chain resilience.',
        activities: 'Keynote presentation followed by live telemetry simulation and student Q&A on ERP procurement.',
        outcomes: 'Students understood ERP-integrated warehouse management systems and modern procurement KPIs.',
        status: 'PENDING_HOD_APPROVAL',
        version: 1,
        history: [],
        feedbackSummary: null,
        attachments: [],
        createdAt: pastDate2
      },
      {
        id: 'RPT-002',
        eventId: 'evt_005',
        title: 'Algorithmic Trading & High-Frequency Quantitative Finance',
        type: 'Workshop',
        submittedBy: 'usr_fac_01',
        submittedByName: 'Prof. Shubhangi Phade',
        date: pastDate3,
        time: '09:30 AM - 04:30 PM',
        venue: 'Computer Lab 3 & Bloomberg Terminal Room',
        guest: 'Dr. Neha Varma',
        guestDesignation: 'Quantitative Researcher, Alpha Capital',
        attendees: 120,
        facultyInvolved: 'Prof. Shubhangi Phade',
        objectives: 'Hands-on execution of Python backtesting for moving-average crossover strategies.',
        activities: 'Algorithmic backtesting labs using Jupyter notebooks with real-time tick data.',
        outcomes: 'Participants deployed real-time paper trading algorithms with risk-reward ratios calculated.',
        status: 'PENDING_HOD_APPROVAL',
        version: 1,
        history: [],
        feedbackSummary: null,
        attachments: [],
        createdAt: pastDate3
      },
      {
        id: 'RPT-003',
        eventId: 'evt_006',
        title: 'Industrial Visit to National Stock Exchange (NSE) & SEBI Bhavan',
        type: 'Industrial Visit',
        submittedBy: 'usr_fac_01',
        submittedByName: 'Prof. Shubhangi Phade',
        date: pastDate4,
        time: '09:00 AM - 05:00 PM',
        venue: 'BKC Financial District, Mumbai',
        guest: 'Mr. T. Srinivasan',
        guestDesignation: 'Chief Education Officer, NSE',
        attendees: 94,
        facultyInvolved: 'Prof. Shubhangi Phade, Prof. Akshay Kale',
        objectives: 'Exposure to clearing corporation architectures, settlement cycles (T+1), and investor grievance cells.',
        activities: 'Live trading floor observation and interaction with regulatory surveillance team.',
        outcomes: 'Comprehensive field visit report prepared by students with compliance case study.',
        status: 'REJECTED',
        rejectionReason: 'GPS timestamp metadata was missing on 2 site photographs. Please re-upload verified geotagged photos and resubmit.',
        version: 1,
        history: [
          { action: 'REJECTED', reviewer: 'usr_hod_01', reviewerName: 'Prof. Nilesh Bread', reason: 'GPS timestamp metadata was missing on 2 site photographs.', timestamp: fmt(subDays(now, 28)) }
        ],
        feedbackSummary: null,
        attachments: [],
        createdAt: pastDate4
      },
      {
        id: 'RPT-004',
        eventId: 'evt_007',
        title: 'National Seminar on Sustainable ESG Investment & Green Financing',
        type: 'Seminar',
        submittedBy: 'usr_fac_01',
        submittedByName: 'Prof. Shubhangi Phade',
        date: pastDate5,
        time: '10:00 AM - 04:00 PM',
        venue: 'Convention Center, MET Bhujbal Knowledge City',
        guest: 'Mr. S. Ramakrishnan',
        guestDesignation: 'VP ESG Advisory, Tata Consultancy Services',
        attendees: 320,
        facultyInvolved: 'Prof. Shubhangi Phade, Prof. Nilesh Bread',
        objectives: 'Examine evolving SEBI BRSR Core frameworks and ESG risk assessment models.',
        activities: 'Panel discussion with corporate sustainability directors and institutional ESG underwriters.',
        outcomes: 'Students compiled 5 institutional ESG due-diligence framework case studies.',
        status: 'APPROVED',
        approvedBy: 'usr_hod_01',
        approvedByName: 'Prof. Nilesh Bread (HOD)',
        approvedAt: fmt(subDays(now, 43)),
        documentRef: `MET/IOM/DMS/${currentYear}/SEM-004`,
        digitalSignatureHash: crypto.createHash('sha256').update('RPT-004-approved').digest('hex'),
        version: 1,
        history: [
          { action: 'APPROVED', reviewer: 'usr_hod_01', reviewerName: 'Prof. Nilesh Bread', timestamp: fmt(subDays(now, 43)) }
        ],
        feedbackSummary: {
          responseCount: 38,
          overallAverage: 4.2,
          percentPositive: 82,
          perQuestion: [
            { question: 'Content Quality', average: 4.3 },
            { question: 'Speaker Effectiveness', average: 4.5 },
            { question: 'Relevance to Curriculum', average: 4.0 },
            { question: 'Overall Experience', average: 4.1 }
          ],
          distribution: { 5: 12, 4: 14, 3: 8, 2: 3, 1: 1 },
          comments: [
            'Very insightful session on ESG frameworks.',
            'The panel discussion was extremely engaging.',
            'Would love more hands-on case studies next time.'
          ]
        },
        attachments: [],
        createdAt: pastDate5
      },
      {
        id: 'RPT-005',
        eventId: 'evt_008',
        title: 'Entrepreneurship Bootcamp — Startup Weekend',
        type: 'Workshop',
        submittedBy: 'usr_fac_02',
        submittedByName: 'Prof. Akshay Kale',
        date: pastDate6,
        time: '09:00 AM - 06:00 PM',
        venue: 'Innovation Hub, MET Campus',
        guest: 'Ms. Ananya Desai',
        guestDesignation: 'Founder & CEO, GreenTech Solutions',
        attendees: 150,
        facultyInvolved: 'Prof. Akshay Kale',
        objectives: 'Foster entrepreneurial mindset and practical startup skills among MBA students.',
        activities: 'Idea pitching, business model canvas workshops, mentor sessions with industry experts.',
        outcomes: '15 viable startup ideas pitched, 3 selected for incubation support.',
        status: 'DRAFT',
        version: 1,
        history: [],
        feedbackSummary: null,
        attachments: [],
        createdAt: pastDate6
      }
    ],

    meetings: [
      {
        id: 'MTG-001',
        title: 'Board of Studies (BoS) Q3 Curriculum Review Meeting',
        committee: 'Board of Studies in Management',
        date: futureDate1,
        startTime: '10:00 AM',
        endTime: '12:30 PM',
        venue: 'Conference Boardroom A',
        chairperson: 'usr_hod_01',
        chairpersonName: 'Prof. Nilesh Bread (Head of Department)',
        invitees: ['usr_fac_01', 'usr_fac_02'],
        agendaItems: [
          { title: 'Review of Odd-Semester Electives', presenter: 'Prof. Akshay Kale', duration: '30 min' },
          { title: 'Inclusion of Generative AI in Financial Risk Modelling (4 Credits)', presenter: 'Prof. Shubhangi Phade', duration: '45 min' },
          { title: 'Academic Calendar and Industrial Visit Schedule Ratification', presenter: '', duration: '30 min' }
        ],
        notes: '',
        scheduleStatus: 'SCHEDULED',
        momStatus: 'NOT_STARTED',
        mom: null,
        status: 'ACTIVE',
        createdBy: 'usr_hod_01',
        createdAt: fmt(subDays(now, 1))
      },
      {
        id: 'MTG-002',
        title: 'Department Faculty Planning & Accreditation Review',
        committee: 'Department Academic Committee',
        date: futureDate2,
        startTime: '02:00 PM',
        endTime: '03:30 PM',
        venue: 'Conference Boardroom A',  // Deliberate venue conflict with MTG-001's venue
        chairperson: 'usr_hod_01',
        chairpersonName: 'Prof. Nilesh Bread (Head of Department)',
        invitees: ['usr_fac_01', 'usr_fac_02'],
        agendaItems: [
          { title: 'NAAC SSR Criterion 1 documentation audit', presenter: '', duration: '30 min' },
          { title: 'Workload distribution for Odd Sem', presenter: '', duration: '20 min' },
          { title: 'Historical event reminder protocol', presenter: '', duration: '20 min' }
        ],
        notes: '',
        scheduleStatus: 'SCHEDULED',
        momStatus: 'NOT_STARTED',
        mom: null,
        status: 'ACTIVE',
        createdBy: 'usr_hod_01',
        createdAt: fmt(subDays(now, 2))
      },
      {
        id: 'MTG-003',
        title: 'IQAC Internal Quality Assurance Meeting',
        committee: 'IQAC Committee',
        date: pastDate1,
        startTime: '11:00 AM',
        endTime: '01:00 PM',
        venue: 'DMS Meeting Room',
        chairperson: 'usr_hod_01',
        chairpersonName: 'Prof. Nilesh Bread (Head of Department)',
        invitees: ['usr_fac_01', 'usr_fac_02'],
        agendaItems: [
          { title: 'Review of quality metrics for current semester', presenter: 'Prof. Shubhangi Phade', duration: '30 min' },
          { title: 'Action plan for NAAC peer team visit', presenter: 'Prof. Akshay Kale', duration: '30 min' }
        ],
        notes: '',
        scheduleStatus: 'HELD',
        momStatus: 'NOT_STARTED',
        mom: null,
        status: 'ACTIVE',
        createdBy: 'usr_fac_01',
        createdAt: fmt(subDays(now, 7))
      },
      {
        id: 'MTG-004',
        title: 'Research Committee Quarterly Review',
        committee: 'Research Advisory Committee',
        date: fmt(subDays(now, 15)),
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        venue: 'DMS Meeting Room',
        chairperson: 'usr_hod_01',
        chairpersonName: 'Prof. Nilesh Bread (Head of Department)',
        invitees: ['usr_fac_01', 'usr_fac_02'],
        agendaItems: [
          { title: 'Research publication targets update', presenter: '', duration: '30 min' },
          { title: 'Faculty research grant applications', presenter: '', duration: '30 min' }
        ],
        notes: '',
        scheduleStatus: 'HELD',
        momStatus: 'APPROVED',
        mom: {
          membersPresent: ['usr_hod_01', 'usr_fac_01', 'usr_fac_02'],
          membersAbsent: [],
          discussionPoints: [
            { agendaItemIndex: 0, discussion: 'Reviewed current research publication status. 3 papers published, 5 under review.', decision: 'Set target of 2 more publications by end of semester.' },
            { agendaItemIndex: 1, discussion: 'Discussed UGC and AICTE grant opportunities for faculty.', decision: 'Each faculty to submit at least one grant application by next quarter.' }
          ],
          actionItems: [
            { task: 'Submit research publication progress report', responsibleUserId: 'usr_fac_01', responsibleName: 'Prof. Shubhangi Phade', deadline: fmt(subDays(now, 5)), status: 'COMPLETED' },
            { task: 'Prepare grant application draft for UGC scheme', responsibleUserId: 'usr_fac_02', responsibleName: 'Prof. Akshay Kale', deadline: fmt(addDays(now, 5)), status: 'PENDING' }
          ],
          approvedBy: 'usr_hod_01',
          approvedByName: 'Prof. Nilesh Bread (HOD)',
          approvedAt: fmt(subDays(now, 13))
        },
        status: 'ACTIVE',
        createdBy: 'usr_fac_01',
        createdAt: fmt(subDays(now, 20))
      }
    ],

    calendarEvents: [
      { id: 'cal-01', date: futureDate1, time: '10:00 AM - 12:30 PM', title: 'BoS Curriculum Alignment & Credit Audit Meeting', type: 'Meeting', venue: 'Boardroom A', tag: 'Academic Governance', source: 'MEETING', refId: 'MTG-001', archived: false },
      { id: 'cal-02', date: fmt(addDays(now, 1)), time: 'Full Day', title: 'Mahatma Gandhi Jayanti', type: 'Holiday', venue: 'Campus Closed', tag: 'Statutory Holiday', source: 'MANUAL', refId: null, archived: false },
      { id: 'cal-03', date: fmt(addDays(now, 14)), time: '09:00 AM - 06:00 PM', title: 'Annual State-Level Hackathon (Re-run)', type: 'Competition', venue: 'Auditorium & Innovation Hub', tag: 'Flagship Event', source: 'MANUAL', refId: null, archived: false },
      { id: 'cal-04', date: futureDate2, time: '10:30 AM - 04:30 PM', title: 'National FDP on AI in Finance & Algorithmic Banking', type: 'Workshop', venue: 'Executive Seminar Hall', tag: 'Faculty Development', source: 'MANUAL', refId: null, archived: false },
      { id: 'cal-05', date: fmt(addDays(now, 21)), time: '10:00 AM - 01:30 PM', title: 'National Conclave on Generative AI & FinTech Disruption', type: 'Guest Lecture', venue: 'Convention Center, MET', tag: 'Guest Conclave', source: 'MANUAL', refId: null, archived: false },
      { id: 'cal-06', date: fmt(addDays(now, 28)), time: '10:00 AM - 05:00 PM', title: 'MBA Mid-Term Review & Continuous Evaluation Defense', type: 'Academic', venue: 'Classrooms 401-408', tag: 'Examinations', source: 'MANUAL', refId: null, archived: false },
      { id: 'cal-07', date: fmt(addMonths(now, 1)), time: 'Full Day', title: 'Diwali Break', type: 'Holiday', venue: 'Campus Closed', tag: 'Festival Holiday', source: 'MANUAL', refId: null, archived: false },
      { id: 'cal-08', date: fmt(addMonths(now, 2)), time: '09:00 AM - 05:00 PM', title: 'End Semester Examination Week', type: 'Academic', venue: 'Examination Halls', tag: 'Examinations', source: 'MANUAL', refId: null, archived: false },
      { id: 'cal-09', date: fmt(subDays(now, 3)), time: '02:00 PM - 04:00 PM', title: 'Placement Preparation Workshop', type: 'Workshop', venue: 'Seminar Hall', tag: 'Career Development', source: 'MANUAL', refId: null, archived: false }
    ],

    reminders: [],
    notifications: [
      {
        id: 'notif-001',
        userId: 'usr_hod_01',
        type: 'REPORT_SUBMITTED',
        title: 'Report Submitted for Review',
        body: 'Prof. Akshay Kale submitted "Industry 4.0 & Supply Chain Masterclass" for your review.',
        link: '/reports/RPT-001',
        read: false,
        createdAt: pastDate2
      },
      {
        id: 'notif-002',
        userId: 'usr_hod_01',
        type: 'REPORT_SUBMITTED',
        title: 'Report Submitted for Review',
        body: 'Prof. Shubhangi Phade submitted "Algorithmic Trading Workshop" for your review.',
        link: '/reports/RPT-002',
        read: false,
        createdAt: pastDate3
      },
      {
        id: 'notif-003',
        userId: 'usr_fac_01',
        type: 'REPORT_REJECTED',
        title: 'Report Returned for Revision',
        body: 'HOD returned "Industrial Visit to NSE" — GPS timestamp metadata was missing.',
        link: '/reports/RPT-003',
        read: true,
        createdAt: fmt(subDays(now, 28))
      },
      {
        id: 'notif-004',
        userId: 'usr_hod_01',
        type: 'FACULTY_REGISTRATION',
        title: 'New Faculty Registration',
        body: 'Prof. Meera Nair has requested faculty account approval.',
        link: '/faculty/pending',
        read: false,
        createdAt: fmt(subDays(now, 3))
      }
    ],

    resetTokens: [],

    auditLog: [
      { id: 'aud-01', timestamp: fmt(subDays(now, 3)) + ' 11:30 AM', actor: 'System', actorId: null, action: 'FACULTY_REGISTRATION', details: 'Prof. Meera Nair submitted registration (Status: PENDING_HOD_APPROVAL)' },
      { id: 'aud-02', timestamp: pastDate2 + ' 04:15 PM', actor: 'Prof. Akshay Kale', actorId: 'usr_fac_02', action: 'EVENT_REPORT_SUBMITTED', details: 'Submitted "Industry 4.0 & Supply Chain Masterclass" for HOD Review' },
      { id: 'aud-03', timestamp: fmt(subDays(now, 28)) + ' 03:20 PM', actor: 'Prof. Nilesh Bread (HOD)', actorId: 'usr_hod_01', action: 'EVENT_REPORT_REJECTED', details: 'Returned Industrial Visit RPT-003 with revision note on GPS metadata' },
      { id: 'aud-04', timestamp: fmt(subDays(now, 43)) + ' 11:45 AM', actor: 'Prof. Nilesh Bread (HOD)', actorId: 'usr_hod_01', action: 'EVENT_REPORT_APPROVED', details: 'Approved National Seminar RPT-004 with digital signature' },
      { id: 'aud-05', timestamp: fmt(subDays(now, 20)) + ' 05:00 PM', actor: 'Prof. Nilesh Bread (HOD)', actorId: 'usr_hod_01', action: 'MEETING_SCHEDULED', details: 'Scheduled BoS Curriculum Review Meeting' },
      { id: 'aud-06', timestamp: fmt(subDays(now, 13)) + ' 12:00 PM', actor: 'Prof. Nilesh Bread (HOD)', actorId: 'usr_hod_01', action: 'MOM_APPROVED', details: 'Approved MoM for Research Committee Quarterly Review' }
    ]
  };

  return data;
}

module.exports = generateSeed;
