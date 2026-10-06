package edu.met.scms.store;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import edu.met.scms.model.*;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.*;

/**
 * In-memory data store backed by db.json file persistence.
 * This is a 1:1 Java port of the Node.js DataStore class from store.js.
 *
 * On startup:
 *  - If db.json exists → loads it
 *  - Otherwise → seeds from built-in initial data and writes db.json
 *
 * The database file path is configurable via the DB_FILE_PATH env var
 * (property: scms.data.db-path). Default: data/db.json
 */
@Service
public class DataStore {

    private static final Logger log = LoggerFactory.getLogger(DataStore.class);

    @Value("${scms.data.db-path:data/db.json}")
    private String dbFilePath;

    private final ObjectMapper mapper;
    private ScmsData data;

    public DataStore() {
        this.mapper = new ObjectMapper();
        this.mapper.enable(SerializationFeature.INDENT_OUTPUT);
    }

    @PostConstruct
    public void init() {
        File dbFile = new File(dbFilePath);
        try {
            if (dbFile.exists()) {
                this.data = mapper.readValue(dbFile, ScmsData.class);
                log.info("Loaded existing database from {}", dbFile.getAbsolutePath());
            } else {
                this.data = buildInitialData();
                save();
                log.info("Created new database at {}", dbFile.getAbsolutePath());
            }
        } catch (IOException e) {
            log.error("Error loading db.json, falling back to initial seed data: {}", e.getMessage());
            this.data = buildInitialData();
        }
    }

    public synchronized ScmsData get() {
        return this.data;
    }

    public synchronized void save() {
        try {
            File dbFile = new File(dbFilePath);
            dbFile.getParentFile().mkdirs();
            mapper.writeValue(dbFile, this.data);
        } catch (IOException e) {
            log.error("Error saving data to db.json: {}", e.getMessage());
        }
    }

    public synchronized ScmsData reset() {
        this.data = buildInitialData();
        save();
        return this.data;
    }

    // ───────────────────────────────────────────────────────────────
    // Initial Seed Data — exact replica of initialData.js
    // ───────────────────────────────────────────────────────────────

    private ScmsData buildInitialData() {
        ScmsData seed = new ScmsData();

        // Tenant
        Tenant tenant = new Tenant();
        tenant.setId("tenant_met_mgmt");
        tenant.setOrganization("MET Bhujbal Knowledge City");
        tenant.setInstitute("MET Institute of Management");
        tenant.setDepartment("Department of Management Studies (DMS)");
        tenant.setAcademicYear("AY 2026–2027 (Odd Semester)");
        tenant.setAccreditation("Autonomous • AICTE Approved • NAAC 'A+' Grade • NBA Tier-1");
        tenant.setAddress("Bhujbal Knowledge City, Bandra Reclamation, Bandra (West), Mumbai 400 050");
        tenant.setSchema("tenant_met_iom_dms");
        seed.setTenant(tenant);

        // Users
        seed.setUsers(new ArrayList<>(Arrays.asList(
                createUser("usr_hod_01", "Prof. Nilesh Bread", "HOD", "hod@met.edu",
                        "Head of Department & Professor", "ACTIVE", "NB", "Management Studies", null),
                createUser("usr_fac_01", "Prof. Shubhangi Phade", "FACULTY", "shubhangi@met.edu",
                        "Assistant Professor & Event Lead", "ACTIVE", "SP", "Management Studies", null),
                createUser("usr_fac_02", "Prof. Akshay Kale", "FACULTY", "akshay@met.edu",
                        "Academic Co-ordinator & Assistant Professor", "ACTIVE", "AK", "Management Studies", null),
                createUser("usr_fac_03", "Dr. Rahul Sharma", "FACULTY", "rahul.sharma@met.edu",
                        "Associate Professor (Finance)", "PENDING_HOD_APPROVAL", "RS", "Management Studies", "2026-09-28 09:15 AM"),
                createUser("usr_fac_04", "Prof. Meera Nair", "FACULTY", "meera.nair@met.edu",
                        "Assistant Professor (Marketing)", "PENDING_HOD_APPROVAL", "MN", "Management Studies", "2026-09-28 11:30 AM")
        )));

        // Historical Reminders
        seed.setHistoricalReminders(new ArrayList<>(Arrays.asList(
                createReminder("rem-001", "Annual State-Level Hackathon & Innovation Conclave", "Competition",
                        "2025-10-05", "2026-10-05", "2026-09-28", 7, true, "ACTIVE_ALERT",
                        Map.of("participants", 240, "budget", "₹1,50,000", "winners", "Team AlgoKnights (VJTI)", "coordinator", "Prof. Akshay Kale")),
                createReminder("rem-002", "National Faculty Development Program (FDP) on AI in Finance", "Workshop",
                        "2025-10-08", "2026-10-08", "2026-10-01", 10, false, "UPCOMING",
                        Map.of("participants", 65, "budget", "₹85,000", "resourcePerson", "Dr. A. Swaminathan (HDFC AMC)", "coordinator", "Prof. Shubhangi Phade"))
        )));

        // Event Reports
        seed.setEventReports(new ArrayList<>(Arrays.asList(
                createPendingReport("RPT-2026-GL-104", "Industry 4.0 & Supply Chain Masterclass", "Guest Lecture",
                        "Prof. Akshay Kale", "akshay@met.edu", "2 hours ago", "2026-09-26",
                        "10:00 AM - 01:00 PM", "Executive Seminar Hall, 4th Floor",
                        "Mr. Rajiv Singhania, VP Supply Chain, Mahindra Logistics", 185,
                        "Prof. Akshay Kale, Prof. Shubhangi Phade", 4,
                        "To provide real-world insights into automated warehouse robotics, real-time telemetry, and cold-chain resilience.",
                        "Keynote presentation followed by live telemetry simulation and student Q&A on ERP procurement.",
                        "Students understood ERP-integrated warehouse management systems and modern procurement KPIs.",
                        "NAAC Criterion 1.3.2 • Course Outcome: MBA-SCM-401"),
                createPendingReport("RPT-2026-WS-088", "Algorithmic Trading & High-Frequency Quantitative Finance", "Workshop",
                        "Prof. Shubhangi Phade", "shubhangi@met.edu", "Yesterday", "2026-09-24",
                        "09:30 AM - 04:30 PM", "Computer Lab 3 & Bloomberg Terminal Room",
                        "Dr. Neha Varma, Quantitative Researcher, Alpha Capital", 120,
                        "Prof. Shubhangi Phade", 6,
                        "Hands-on execution of Python backtesting for moving-average crossover strategies.",
                        "Algorithmic backtesting labs using Jupyter notebooks with real-time tick data.",
                        "Participants deployed real-time paper trading algorithms with risk-reward ratios calculated.",
                        "NAAC Criterion 1.3.3 • Course Outcome: MBA-FIN-304"),
                createRejectedReport(),
                createApprovedReport()
        )));

        // Meetings
        seed.setMeetings(new ArrayList<>(Arrays.asList(
                createPendingMeeting(),
                createApprovedMeeting()
        )));

        // Calendar Events
        seed.setCalendarEvents(new ArrayList<>(Arrays.asList(
                createCalendarEvent("cal-01", "2026-09-29", "10:00 AM - 12:30 PM", "BoS Curriculum Alignment & Credit Audit Meeting", "Meeting", "Boardroom A", "Academic Governance"),
                createCalendarEvent("cal-02", "2026-10-02", "Full Day", "Mahatma Gandhi Jayanti", "Holiday", "Campus Closed", "Statutory Holiday"),
                createCalendarEvent("cal-03", "2026-10-05", "09:00 AM - 06:00 PM", "Annual State-Level Hackathon 2026 (Anniversary Re-run)", "Competition", "Auditorium & Innovation Hub", "Flagship Event"),
                createCalendarEvent("cal-04", "2026-10-08", "10:30 AM - 04:30 PM", "National FDP on AI in Finance & Algorithmic Banking", "Workshop", "Executive Seminar Hall", "Faculty Development"),
                createCalendarEvent("cal-05", "2026-10-14", "10:00 AM - 01:30 PM", "National Conclave on Generative AI & FinTech Disruption", "Guest Lecture", "Convention Center, MET", "Guest Conclave"),
                createCalendarEvent("cal-06", "2026-10-18", "10:00 AM - 05:00 PM", "MBA Mid-Term Review & Continuous Evaluation Defense", "Academic", "Classrooms 401-408", "Examinations")
        )));

        // Audit Log
        seed.setAuditLog(new ArrayList<>(Arrays.asList(
                new AuditLogEntry("2026-09-28 11:30 AM", "System", "FACULTY_REGISTRATION", "Prof. Meera Nair submitted registration (Status: PENDING_HOD_APPROVAL)"),
                new AuditLogEntry("2026-09-28 09:15 AM", "System", "FACULTY_REGISTRATION", "Dr. Rahul Sharma submitted registration (Status: PENDING_HOD_APPROVAL)"),
                new AuditLogEntry("2026-09-28 08:00 AM", "System Cron", "HISTORICAL_REMINDER_TRIGGER", "7-Day Radar fired for State-Level Hackathon (Original: 2025-10-05)"),
                new AuditLogEntry("2026-09-26 04:15 PM", "Prof. Akshay Kale", "EVENT_REPORT_SUBMITTED", "Submitted 'Industry 4.0 & Supply Chain Masterclass' for HOD Review"),
                new AuditLogEntry("2026-09-25 05:00 PM", "Prof. Nilesh Bread (HOD)", "MOM_GENERATION", "Formalized Board of Studies Q3 Minutes of Meeting"),
                new AuditLogEntry("2026-09-23 03:20 PM", "Prof. Nilesh Bread (HOD)", "EVENT_REPORT_REJECTED", "Returned Industrial Visit RPT-2026-IV-045 with revision note on GPS metadata"),
                new AuditLogEntry("2026-09-18 11:45 AM", "Prof. Nilesh Bread (HOD)", "EVENT_REPORT_APPROVED", "Approved National Seminar RPT-2026-SEM-082 with digital signature")
        )));

        return seed;
    }

    // ──── Helper methods for building seed data ────

    private User createUser(String id, String name, String role, String email,
                            String designation, String status, String avatar, String department, String registeredAt) {
        User u = new User();
        u.setId(id);
        u.setName(name);
        u.setRole(role);
        u.setEmail(email);
        u.setDesignation(designation);
        u.setStatus(status);
        u.setAvatar(avatar);
        u.setDepartment(department);
        u.setRegisteredAt(registeredAt);
        return u;
    }

    private HistoricalReminder createReminder(String id, String eventTitle, String eventType,
                                               String originalDate, String anniversaryDate, String triggerDate,
                                               int daysRemaining, boolean isToday, String status, Map<String, Object> stats) {
        HistoricalReminder r = new HistoricalReminder();
        r.setId(id);
        r.setEventTitle(eventTitle);
        r.setEventType(eventType);
        r.setOriginalDate(originalDate);
        r.setAnniversaryDate(anniversaryDate);
        r.setReminderTriggerDate(triggerDate);
        r.setDaysRemaining(daysRemaining);
        r.setIsToday(isToday);
        r.setPriorYearStats(new LinkedHashMap<>(stats));
        r.setStatus(status);
        return r;
    }

    private EventReport createPendingReport(String id, String title, String type, String submittedBy,
                                             String email, String submittedTime, String date, String time,
                                             String venue, String speaker, int attendees, String faculty,
                                             int photos, String objectives, String activities, String outcomes, String curriculum) {
        EventReport r = new EventReport();
        r.setId(id);
        r.setTitle(title);
        r.setType(type);
        r.setSubmittedBy(submittedBy);
        r.setSubmittedByEmail(email);
        r.setSubmittedTime(submittedTime);
        r.setDate(date);
        r.setTime(time);
        r.setVenue(venue);
        r.setSpeaker(speaker);
        r.setAttendees(attendees);
        r.setFacultyInvolved(faculty);
        r.setQuorumStatus("100% Biometric Verified");
        r.setPhotosAttached(photos);
        r.setStatus("PENDING_HOD_APPROVAL");
        r.setObjectives(objectives);
        r.setActivities(activities);
        r.setOutcomes(outcomes);
        r.setCurriculumMapping(curriculum);
        return r;
    }

    private EventReport createRejectedReport() {
        EventReport r = new EventReport();
        r.setId("RPT-2026-IV-045");
        r.setTitle("Industrial Visit to National Stock Exchange (NSE) & SEBI Bhavan");
        r.setType("Industrial Visit");
        r.setSubmittedBy("Prof. Shubhangi Phade");
        r.setSubmittedByEmail("shubhangi@met.edu");
        r.setSubmittedTime("Sept 23, 2026");
        r.setDate("2026-09-22");
        r.setTime("09:00 AM - 05:00 PM");
        r.setVenue("BKC Financial District, Mumbai");
        r.setSpeaker("Mr. T. Srinivasan, Chief Education Officer, NSE");
        r.setAttendees(94);
        r.setFacultyInvolved("Prof. Shubhangi Phade, Prof. Akshay Kale");
        r.setQuorumStatus("100% Verified");
        r.setPhotosAttached(8);
        r.setStatus("REJECTED");
        r.setRejectionReason("GPS timestamp metadata was missing on 2 site photographs. Please re-upload verified geotagged photos and resubmit.");
        r.setObjectives("Exposure to clearing corporation architectures, settlement cycles (T+1), and investor grievance cells.");
        r.setActivities("Live trading floor observation and interaction with regulatory surveillance team.");
        r.setOutcomes("Comprehensive field visit report prepared by students with compliance case study.");
        r.setCurriculumMapping("NAAC Criterion 1.3.4 • Course Outcome: MBA-FIN-202");
        return r;
    }

    private EventReport createApprovedReport() {
        EventReport r = new EventReport();
        r.setId("RPT-2026-SEM-082");
        r.setTitle("National Seminar on Sustainable ESG Investment & Green Financing");
        r.setType("Seminar");
        r.setSubmittedBy("Prof. Shubhangi Phade");
        r.setSubmittedByEmail("shubhangi@met.edu");
        r.setDate("2026-09-16");
        r.setTime("10:00 AM - 04:00 PM");
        r.setVenue("Convention Center, MET Bhujbal Knowledge City");
        r.setSpeaker("Mr. S. Ramakrishnan, VP ESG Advisory, Tata Consultancy Services");
        r.setAttendees(320);
        r.setFacultyInvolved("Prof. Shubhangi Phade, Prof. Nilesh Bread");
        r.setQuorumStatus("100% Biometric Verified");
        r.setPhotosAttached(6);
        r.setStatus("APPROVED");
        r.setApprovedBy("Prof. Nilesh Bread (HOD)");
        r.setApprovalDate("2026-09-18");
        r.setDigitalSignatureHash("SHA256: 8f9b2d073c...9a41ee");
        r.setDocumentRef("MET/IOM/DMS/2026/SEM-082");
        r.setObjectives("Examine evolving SEBI BRSR Core frameworks and ESG risk assessment models.");
        r.setActivities("Panel discussion with corporate sustainability directors and institutional ESG underwriters.");
        r.setOutcomes("Students compiled 5 institutional ESG due-diligence framework case studies.");
        return r;
    }

    private Meeting createPendingMeeting() {
        Meeting m = new Meeting();
        m.setId("MOM-2026-BOS-03");
        m.setTitle("Board of Studies (BoS) Q3 Curriculum Review Meeting");
        m.setCommittee("Board of Studies in Management");
        m.setDate("2026-09-25");
        m.setTime("10:00 AM - 12:30 PM");
        m.setVenue("Conference Boardroom A");
        m.setChairperson("Prof. Nilesh Bread (Head of Department)");
        m.setMembersPresent("Prof. Nilesh Bread, Prof. Akshay Kale, Prof. Shubhangi Phade, External Expert: Mr. R. Singhania");
        m.setAgenda("1. Review of Odd-Semester AY 2026-27 Electives.\n2. Inclusion of Generative AI in Financial Risk Modelling (4 Credits).\n3. Academic Calendar and Industrial Visit Schedule Ratification.");
        m.setDiscussionPoints("External expert emphasized aligning syllabus with industry cloud compliance. Credit weightage discussed.");
        m.setDecisions("Resolved unanimously to introduce MBA-FIN-408 'Generative AI in Financial Engineering' with immediate effect. Approved industrial visit proposal for NSE/SEBI.");
        m.setActionItems(Arrays.asList(
                new ActionItem("Draft course syllabus guidelines", "Prof. Akshay Kale", "2026-10-05"),
                new ActionItem("Confirm student registrations & bus logistics", "Prof. Shubhangi Phade", "2026-10-07")
        ));
        m.setStatus("PENDING_HOD_APPROVAL");
        m.setSubmittedBy("Prof. Akshay Kale");
        return m;
    }

    private Meeting createApprovedMeeting() {
        Meeting m = new Meeting();
        m.setId("MOM-2026-FAC-01");
        m.setTitle("Department Faculty Planning & Accreditation Review");
        m.setCommittee("Department Academic Committee");
        m.setDate("2026-09-12");
        m.setTime("02:00 PM - 03:30 PM");
        m.setVenue("DMS Meeting Room");
        m.setChairperson("Prof. Nilesh Bread (Head of Department)");
        m.setMembersPresent("All 28 Faculty Members Present");
        m.setAgenda("1. NAAC SSR Criterion 1 documentation audit.\n2. Workload distribution for Odd Sem.\n3. Historical event reminder protocol.");
        m.setDiscussionPoints("Reviewed documentation bottleneck. Adopted SCMS enter-once workflow.");
        m.setDecisions("All workshop and guest lecture reports to be submitted within 48 hours of completion.");
        m.setActionItems(Collections.singletonList(
                new ActionItem("Upload past year event records for 7-day radar", "Prof. Shubhangi Phade", "2026-09-20")
        ));
        m.setStatus("APPROVED");
        m.setApprovedBy("Prof. Nilesh Bread (HOD)");
        m.setApprovalDate("2026-09-13");
        m.setSubmittedBy("Prof. Shubhangi Phade");
        return m;
    }

    private CalendarEvent createCalendarEvent(String id, String date, String time, String title, String type, String venue, String tag) {
        CalendarEvent e = new CalendarEvent();
        e.setId(id);
        e.setDate(date);
        e.setTime(time);
        e.setTitle(title);
        e.setType(type);
        e.setVenue(venue);
        e.setTag(tag);
        return e;
    }
}
