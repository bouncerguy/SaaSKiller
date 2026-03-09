import { storage } from "./storage";
import { db } from "./db";
import { tenants, customers, leads, products, tickets, invoices, timeEntries, forms, emailTemplates, agents, mediaAssets, pipelines } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  const existing = await db.select().from(tenants).where(eq(tenants.slug, "default"));

  let tenant;
  let user;

  if (existing.length > 0) {
    tenant = existing[0];
    const users = await storage.getUsersByTenant(tenant.id);
    user = users.find(u => u.email === "alex@acmeconsulting.com");
    if (!user) {
      console.log("Seed tenant exists but user not found, skipping...");
      return;
    }
  } else {
    console.log("Seeding database...");

    tenant = await storage.createTenant({
      name: "Acme Consulting",
      slug: "default",
      brandColor: "#1d4ed8",
      timezone: "America/New_York",
      logoUrl: null,
    });

    const passwordHash = await bcrypt.hash("password123", 10);

    user = await storage.createUser({
      tenantId: tenant.id,
      name: "Alex Johnson",
      email: "alex@acmeconsulting.com",
      role: "OWNER",
      passwordHash,
    });

    const quickChat = await storage.createEventType({
      tenantId: tenant.id,
      ownerUserId: user.id,
      slug: "quick-chat",
      title: "Quick Chat",
      description: "A brief 15-minute introductory call to discuss your needs.",
      durationMinutes: 15,
      locationType: "VIDEO",
      locationValue: "Google Meet",
      color: "#059669",
      isActive: true,
      questionsJson: "[]",
    });

    const consultation = await storage.createEventType({
      tenantId: tenant.id,
      ownerUserId: user.id,
      slug: "consultation",
      title: "Strategy Consultation",
      description: "A 45-minute in-depth session to explore your project goals and create an action plan.",
      durationMinutes: 45,
      locationType: "VIDEO",
      locationValue: "Zoom",
      color: "#7c3aed",
      isActive: true,
      questionsJson: "[]",
    });

    await storage.createEventType({
      tenantId: tenant.id,
      ownerUserId: user.id,
      slug: "design-review",
      title: "Design Review",
      description: "30-minute session to review designs, wireframes, or prototypes.",
      durationMinutes: 30,
      locationType: "VIDEO",
      locationValue: "Google Meet",
      color: "#dc2626",
      isActive: true,
      questionsJson: "[]",
    });

    const weekdays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"] as const;
    for (const day of weekdays) {
      await storage.createAvailabilityRule({
        tenantId: tenant.id,
        userId: user.id,
        dayOfWeek: day,
        startTime: "09:00",
        endTime: "12:00",
        timezone: "America/New_York",
      });
      await storage.createAvailabilityRule({
        tenantId: tenant.id,
        userId: user.id,
        dayOfWeek: day,
        startTime: "13:00",
        endTime: "17:00",
        timezone: "America/New_York",
      });
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setMinutes(tomorrowEnd.getMinutes() + 15);

    await storage.createBooking({
      tenantId: tenant.id,
      eventTypeId: quickChat.id,
      hostUserId: user.id,
      inviteeName: "Sarah Mitchell",
      inviteeEmail: "sarah@example.com",
      startAt: tomorrow,
      endAt: tomorrowEnd,
      timezone: "America/New_York",
      status: "CONFIRMED",
      notes: "Looking forward to discussing the new project!",
      cancelReason: null,
    });

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 3);
    nextWeek.setHours(14, 0, 0, 0);

    const nextWeekEnd = new Date(nextWeek);
    nextWeekEnd.setMinutes(nextWeekEnd.getMinutes() + 45);

    await storage.createBooking({
      tenantId: tenant.id,
      eventTypeId: consultation.id,
      hostUserId: user.id,
      inviteeName: "David Chen",
      inviteeEmail: "david@techstartup.io",
      startAt: nextWeek,
      endAt: nextWeekEnd,
      timezone: "America/Los_Angeles",
      status: "CONFIRMED",
      notes: "Want to discuss our product roadmap and marketing strategy.",
      cancelReason: null,
    });

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2);
    pastDate.setHours(11, 0, 0, 0);

    const pastEnd = new Date(pastDate);
    pastEnd.setMinutes(pastEnd.getMinutes() + 30);

    await storage.createBooking({
      tenantId: tenant.id,
      eventTypeId: quickChat.id,
      hostUserId: user.id,
      inviteeName: "Emily Rodriguez",
      inviteeEmail: "emily@creativestudio.co",
      startAt: pastDate,
      endAt: pastEnd,
      timezone: "America/Chicago",
      status: "CONFIRMED",
      notes: null,
      cancelReason: null,
    });

    await storage.createBooking({
      tenantId: tenant.id,
      eventTypeId: consultation.id,
      hostUserId: user.id,
      inviteeName: "Marcus Thompson",
      inviteeEmail: "marcus@fintech.com",
      startAt: pastDate,
      endAt: pastEnd,
      timezone: "Europe/London",
      status: "CANCELED",
      notes: "Had to reschedule due to conflict.",
      cancelReason: "Schedule conflict",
    });
  }

  const tenantId = tenant.id;
  const userId = user.id;

  const existingCustomers = await db.select().from(customers).where(eq(customers.tenantId, tenantId));
  let customer1, customer2, customer3, customer4;

  if (existingCustomers.length === 0) {
    console.log("Seeding customers...");
    customer1 = await storage.createCustomer({
      tenantId,
      userId,
      name: "Sarah Mitchell",
      businessName: "Mitchell & Associates",
      email: "sarah@mitchellassociates.com",
      phone: "+1 (555) 234-5678",
      address: "450 Park Avenue, Suite 800, New York, NY 10022",
      billingType: "monthly",
      paymentStatus: "CURRENT",
      isActive: true,
    });
    customer2 = await storage.createCustomer({
      tenantId,
      userId,
      name: "David Chen",
      businessName: "TechStartup.io",
      email: "david@techstartup.io",
      phone: "+1 (555) 987-6543",
      address: "1200 Innovation Way, San Jose, CA 95110",
      billingType: "quarterly",
      paymentStatus: "CURRENT",
      isActive: true,
    });
    customer3 = await storage.createCustomer({
      tenantId,
      userId,
      name: "Emily Rodriguez",
      businessName: "Creative Studio Co.",
      email: "emily@creativestudio.co",
      phone: "+1 (555) 345-6789",
      address: "78 Design District, Austin, TX 73301",
      billingType: "monthly",
      paymentStatus: "PAST_DUE_30",
      isActive: true,
    });
    customer4 = await storage.createCustomer({
      tenantId,
      userId,
      name: "Marcus Thompson",
      businessName: "FinTech Solutions Ltd",
      email: "marcus@fintechsolutions.com",
      phone: "+44 20 7946 0958",
      address: "25 Canary Wharf, London E14 5AB, UK",
      billingType: "yearly",
      paymentStatus: "CURRENT",
      isActive: true,
    });
  } else {
    customer1 = existingCustomers[0];
    customer2 = existingCustomers[1] || existingCustomers[0];
    customer3 = existingCustomers[2] || existingCustomers[0];
    customer4 = existingCustomers[3] || existingCustomers[0];
  }

  const existingPipelines = await db.select().from(pipelines).where(eq(pipelines.tenantId, tenantId));
  let pipeline;
  if (existingPipelines.length === 0) {
    console.log("Seeding pipeline...");
    pipeline = await storage.createPipeline({
      tenantId,
      name: "Sales Pipeline",
      stages: '["New Lead","Contacted","Qualified","Proposal","Negotiation","Won","Lost"]',
      isDefault: true,
    });
  } else {
    pipeline = existingPipelines[0];
  }

  const existingLeads = await db.select().from(leads).where(eq(leads.tenantId, tenantId));
  if (existingLeads.length === 0) {
    console.log("Seeding leads...");
    await storage.createLead({
      tenantId,
      name: "Rachel Kim",
      email: "rachel@greenleafventures.com",
      phone: "+1 (555) 456-7890",
      source: "Website Contact Form",
      pipelineId: pipeline.id,
      stage: "Qualified",
      awarenessData: null,
    });
    await storage.createLead({
      tenantId,
      name: "James Wilson",
      email: "jwilson@bluechipenterprises.com",
      phone: "+1 (555) 567-8901",
      source: "LinkedIn",
      pipelineId: pipeline.id,
      stage: "Proposal",
      awarenessData: null,
    });
    await storage.createLead({
      tenantId,
      name: "Priya Patel",
      email: "priya@novadigital.io",
      phone: "+1 (555) 678-9012",
      source: "Referral",
      pipelineId: pipeline.id,
      stage: "Contacted",
      awarenessData: null,
    });
    await storage.createLead({
      tenantId,
      name: "Tom Harris",
      email: "tom@harrisholdings.com",
      phone: "+1 (555) 789-0123",
      source: "Trade Show",
      pipelineId: pipeline.id,
      stage: "New Lead",
      awarenessData: null,
    });
  }

  const existingProducts = await db.select().from(products).where(eq(products.tenantId, tenantId));
  if (existingProducts.length === 0) {
    console.log("Seeding products...");
    await storage.createProduct({
      tenantId,
      name: "Strategy Consultation Package",
      description: "Comprehensive business strategy analysis including market research, competitive positioning, and a 90-day action plan.",
      price: 250000,
      billingCycle: "ONE_TIME",
      category: "Consulting",
      isActive: true,
    });
    await storage.createProduct({
      tenantId,
      name: "Monthly Retainer - Growth",
      description: "Ongoing strategic advisory services with weekly check-ins, priority support, and quarterly business reviews.",
      price: 500000,
      billingCycle: "MONTHLY",
      category: "Retainers",
      isActive: true,
    });
    await storage.createProduct({
      tenantId,
      name: "Website Redesign",
      description: "Full website redesign including UX audit, wireframing, visual design, and development handoff.",
      price: 750000,
      billingCycle: "ONE_TIME",
      category: "Design",
      isActive: true,
    });
    await storage.createProduct({
      tenantId,
      name: "Annual Support Plan",
      description: "12-month technical support plan with 24/7 availability, bug fixes, and performance monitoring.",
      price: 1200000,
      billingCycle: "YEARLY",
      category: "Support",
      isActive: true,
    });
  }

  const existingTickets = await db.select().from(tickets).where(eq(tickets.tenantId, tenantId));
  if (existingTickets.length === 0) {
    console.log("Seeding tickets...");
    await storage.createTicket({
      tenantId,
      subject: "Login page not loading on mobile devices",
      description: "Multiple users have reported that the login page fails to render properly on iOS Safari and Android Chrome. The form fields are not visible.",
      priority: "HIGH",
      status: "OPEN",
      assignedUserId: userId,
      customerId: customer2.id,
      createdByUserId: userId,
    });
    await storage.createTicket({
      tenantId,
      subject: "Invoice PDF generation error",
      description: "When generating PDF invoices with more than 10 line items, the system throws a timeout error. Smaller invoices work fine.",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      assignedUserId: userId,
      customerId: customer1.id,
      createdByUserId: userId,
    });
    await storage.createTicket({
      tenantId,
      subject: "Request for custom branding options",
      description: "Client is requesting the ability to customize email template colors and add their company logo to all outbound communications.",
      priority: "LOW",
      status: "WAITING",
      assignedUserId: null,
      customerId: customer3.id,
      createdByUserId: userId,
    });
    await storage.createTicket({
      tenantId,
      subject: "Data export not including all fields",
      description: "CSV export from the CRM module is missing the phone number and address fields. All other fields export correctly.",
      priority: "MEDIUM",
      status: "RESOLVED",
      assignedUserId: userId,
      customerId: customer4.id,
      createdByUserId: userId,
    });
  }

  const existingInvoices = await db.select().from(invoices).where(eq(invoices.tenantId, tenantId));
  if (existingInvoices.length === 0) {
    console.log("Seeding invoices...");
    const dueDate1 = new Date();
    dueDate1.setDate(dueDate1.getDate() + 30);

    await storage.createInvoice({
      tenantId,
      customerId: customer1.id,
      invoiceNumber: "INV-0001",
      status: "SENT",
      subtotal: 250000,
      tax: 20000,
      total: 270000,
      dueDate: dueDate1,
      notes: "Strategy consultation package - Phase 1",
      lineItemsJson: JSON.stringify([
        { description: "Strategy Consultation Package", quantity: 1, unitPrice: 250000, total: 250000 }
      ]),
    });

    const dueDate2 = new Date();
    dueDate2.setDate(dueDate2.getDate() - 15);

    await storage.createInvoice({
      tenantId,
      customerId: customer2.id,
      invoiceNumber: "INV-0002",
      status: "PAID",
      subtotal: 500000,
      tax: 40000,
      total: 540000,
      dueDate: dueDate2,
      notes: "Monthly retainer - January",
      lineItemsJson: JSON.stringify([
        { description: "Monthly Retainer - Growth", quantity: 1, unitPrice: 500000, total: 500000 }
      ]),
    });

    const dueDate3 = new Date();
    dueDate3.setDate(dueDate3.getDate() - 45);

    await storage.createInvoice({
      tenantId,
      customerId: customer3.id,
      invoiceNumber: "INV-0003",
      status: "OVERDUE",
      subtotal: 750000,
      tax: 60000,
      total: 810000,
      dueDate: dueDate3,
      notes: "Website redesign - full project",
      lineItemsJson: JSON.stringify([
        { description: "UX Audit & Wireframing", quantity: 1, unitPrice: 200000, total: 200000 },
        { description: "Visual Design", quantity: 1, unitPrice: 300000, total: 300000 },
        { description: "Development Handoff", quantity: 1, unitPrice: 250000, total: 250000 }
      ]),
    });

    await storage.createInvoice({
      tenantId,
      customerId: customer4.id,
      invoiceNumber: "INV-0004",
      status: "DRAFT",
      subtotal: 1200000,
      tax: 0,
      total: 1200000,
      dueDate: null,
      notes: "Annual support plan renewal",
      lineItemsJson: JSON.stringify([
        { description: "Annual Support Plan", quantity: 1, unitPrice: 1200000, total: 1200000 }
      ]),
    });
  }

  const existingTimeEntries = await db.select().from(timeEntries).where(eq(timeEntries.tenantId, tenantId));
  if (existingTimeEntries.length === 0) {
    console.log("Seeding time entries...");
    const today = new Date();

    const te1Start = new Date(today);
    te1Start.setDate(te1Start.getDate() - 1);
    te1Start.setHours(9, 0, 0, 0);
    const te1End = new Date(te1Start);
    te1End.setHours(11, 30, 0, 0);

    await storage.createTimeEntry({
      tenantId,
      userId,
      customerId: customer1.id,
      description: "Strategy workshop preparation and market research",
      startAt: te1Start,
      endAt: te1End,
      durationMinutes: 150,
      billable: true,
      hourlyRate: 15000,
    });

    const te2Start = new Date(today);
    te2Start.setDate(te2Start.getDate() - 1);
    te2Start.setHours(13, 0, 0, 0);
    const te2End = new Date(te2Start);
    te2End.setHours(15, 0, 0, 0);

    await storage.createTimeEntry({
      tenantId,
      userId,
      customerId: customer2.id,
      description: "Product roadmap review and technical architecture discussion",
      startAt: te2Start,
      endAt: te2End,
      durationMinutes: 120,
      billable: true,
      hourlyRate: 15000,
    });

    const te3Start = new Date(today);
    te3Start.setDate(te3Start.getDate() - 2);
    te3Start.setHours(10, 0, 0, 0);
    const te3End = new Date(te3Start);
    te3End.setHours(12, 0, 0, 0);

    await storage.createTimeEntry({
      tenantId,
      userId,
      customerId: customer3.id,
      description: "Website UX audit and wireframe review session",
      startAt: te3Start,
      endAt: te3End,
      durationMinutes: 120,
      billable: true,
      hourlyRate: 17500,
    });

    const te4Start = new Date(today);
    te4Start.setDate(te4Start.getDate() - 3);
    te4Start.setHours(14, 0, 0, 0);
    const te4End = new Date(te4Start);
    te4End.setHours(15, 30, 0, 0);

    await storage.createTimeEntry({
      tenantId,
      userId,
      customerId: null,
      description: "Internal team meeting and process improvement planning",
      startAt: te4Start,
      endAt: te4End,
      durationMinutes: 90,
      billable: false,
      hourlyRate: null,
    });

    const te5Start = new Date(today);
    te5Start.setDate(te5Start.getDate() - 4);
    te5Start.setHours(9, 30, 0, 0);
    const te5End = new Date(te5Start);
    te5End.setHours(13, 0, 0, 0);

    await storage.createTimeEntry({
      tenantId,
      userId,
      customerId: customer4.id,
      description: "Quarterly business review and KPI analysis presentation",
      startAt: te5Start,
      endAt: te5End,
      durationMinutes: 210,
      billable: true,
      hourlyRate: 20000,
    });
  }

  const existingForms = await db.select().from(forms).where(eq(forms.tenantId, tenantId));
  if (existingForms.length === 0) {
    console.log("Seeding forms...");
    await storage.createForm({
      tenantId,
      name: "Contact Us",
      description: "General inquiry form for prospective clients",
      slug: "contact-us",
      status: "PUBLISHED",
      fieldsJson: JSON.stringify([
        { id: "name", type: "text", label: "Full Name", required: true, placeholder: "Enter your full name" },
        { id: "email", type: "email", label: "Email Address", required: true, placeholder: "you@company.com" },
        { id: "phone", type: "phone", label: "Phone Number", required: false, placeholder: "+1 (555) 000-0000" },
        { id: "company", type: "text", label: "Company Name", required: false, placeholder: "Your company" },
        { id: "service", type: "select", label: "Service Interest", required: true, options: ["Strategy Consulting", "Design Services", "Technical Advisory", "Other"] },
        { id: "message", type: "textarea", label: "How can we help?", required: true, placeholder: "Tell us about your project..." }
      ]),
      settingsJson: JSON.stringify({ submitButtonText: "Send Message", successMessage: "Thank you for reaching out! We will get back to you within 24 hours." }),
      createdByUserId: userId,
    });

    await storage.createForm({
      tenantId,
      name: "Project Intake",
      description: "Detailed project requirements gathering form for new engagements",
      slug: "project-intake",
      status: "PUBLISHED",
      fieldsJson: JSON.stringify([
        { id: "contact_name", type: "text", label: "Contact Name", required: true, placeholder: "Your name" },
        { id: "contact_email", type: "email", label: "Contact Email", required: true, placeholder: "you@company.com" },
        { id: "company_name", type: "text", label: "Company Name", required: true, placeholder: "Your company" },
        { id: "company_url", type: "url", label: "Company Website", required: false, placeholder: "https://yourcompany.com" },
        { id: "budget", type: "select", label: "Estimated Budget", required: true, options: ["Under $5,000", "$5,000 - $15,000", "$15,000 - $50,000", "$50,000+"] },
        { id: "timeline", type: "select", label: "Desired Timeline", required: true, options: ["ASAP", "1-3 months", "3-6 months", "6+ months"] },
        { id: "project_details", type: "textarea", label: "Project Description", required: true, placeholder: "Describe your project goals, requirements, and any relevant context..." },
        { id: "terms", type: "checkbox", label: "I agree to be contacted about this project inquiry", required: true }
      ]),
      settingsJson: JSON.stringify({ submitButtonText: "Submit Inquiry", successMessage: "Your project inquiry has been received. Our team will review and respond within 2 business days." }),
      createdByUserId: userId,
    });
  }

  const existingTemplates = await db.select().from(emailTemplates).where(eq(emailTemplates.tenantId, tenantId));
  if (existingTemplates.length === 0) {
    console.log("Seeding email templates...");
    await storage.createEmailTemplate({
      tenantId,
      name: "Welcome Email",
      subject: "Welcome to Acme Consulting, {{customer_name}}!",
      bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<h2 style="color: #1d4ed8;">Welcome aboard, {{customer_name}}!</h2>
<p>Thank you for choosing Acme Consulting. We are excited to partner with you on your business journey.</p>
<p>Here is what you can expect next:</p>
<ul>
<li>A kickoff call to discuss your goals and priorities</li>
<li>Access to your client portal for project tracking</li>
<li>Regular progress updates and strategic insights</li>
</ul>
<p>If you have any questions, do not hesitate to reach out to your dedicated consultant.</p>
<p>Best regards,<br/>The Acme Consulting Team</p>
</div>`,
      bodyText: "Welcome aboard, {{customer_name}}! Thank you for choosing Acme Consulting. We are excited to partner with you on your business journey.",
      category: "transactional",
      variablesJson: JSON.stringify(["customer_name", "consultant_name", "portal_link"]),
      createdByUserId: userId,
      isActive: true,
    });

    await storage.createEmailTemplate({
      tenantId,
      name: "Invoice Reminder",
      subject: "Reminder: Invoice #{{invoice_number}} is due on {{due_date}}",
      bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<h2 style="color: #1d4ed8;">Payment Reminder</h2>
<p>Dear {{customer_name}},</p>
<p>This is a friendly reminder that invoice <strong>#{{invoice_number}}</strong> for <strong>{{amount}}</strong> is due on <strong>{{due_date}}</strong>.</p>
<p>If you have already submitted payment, please disregard this notice.</p>
<p>For any questions about your invoice, please contact our billing team.</p>
<p>Thank you,<br/>Acme Consulting Billing</p>
</div>`,
      bodyText: "Dear {{customer_name}}, This is a reminder that invoice #{{invoice_number}} for {{amount}} is due on {{due_date}}.",
      category: "notification",
      variablesJson: JSON.stringify(["customer_name", "invoice_number", "amount", "due_date"]),
      createdByUserId: userId,
      isActive: true,
    });

    await storage.createEmailTemplate({
      tenantId,
      name: "Meeting Follow-Up",
      subject: "Great meeting today, {{customer_name}}!",
      bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
<h2 style="color: #1d4ed8;">Meeting Summary</h2>
<p>Hi {{customer_name}},</p>
<p>Thank you for taking the time to meet with us today. Here is a quick summary of what we discussed:</p>
<p>{{meeting_notes}}</p>
<p><strong>Next Steps:</strong></p>
<p>{{action_items}}</p>
<p>Looking forward to our continued partnership.</p>
<p>Best,<br/>{{consultant_name}}</p>
</div>`,
      bodyText: "Hi {{customer_name}}, Thank you for meeting with us today. Next steps: {{action_items}}",
      category: "transactional",
      variablesJson: JSON.stringify(["customer_name", "meeting_notes", "action_items", "consultant_name"]),
      createdByUserId: userId,
      isActive: true,
    });
  }

  const existingAgents = await db.select().from(agents).where(eq(agents.tenantId, tenantId));
  if (existingAgents.length === 0) {
    console.log("Seeding agents...");
    await storage.createAgent({
      tenantId,
      name: "New Lead Notifier",
      description: "Automatically sends a Slack notification and welcome email when a new lead is captured through any form submission.",
      status: "ACTIVE",
      triggerType: "form_submission",
      triggerConfig: JSON.stringify({ formSlug: "contact-us", channel: "#sales-leads" }),
      actionsJson: JSON.stringify([
        { type: "send_notification", config: { channel: "slack", message: "New lead: {{lead_name}} from {{company}}" } },
        { type: "send_email", config: { template: "welcome", to: "{{lead_email}}" } },
        { type: "create_lead", config: { pipeline: "Sales Pipeline", stage: "New Lead" } }
      ]),
      createdByUserId: userId,
    });

    await storage.createAgent({
      tenantId,
      name: "Overdue Invoice Reminder",
      description: "Checks for overdue invoices daily and sends automated payment reminder emails to the associated customers.",
      status: "ACTIVE",
      triggerType: "schedule",
      triggerConfig: JSON.stringify({ cron: "0 9 * * *", timezone: "America/New_York" }),
      actionsJson: JSON.stringify([
        { type: "query_invoices", config: { status: "OVERDUE" } },
        { type: "send_email", config: { template: "invoice-reminder", to: "{{customer_email}}" } },
        { type: "log_activity", config: { action: "invoice_reminder_sent" } }
      ]),
      createdByUserId: userId,
    });
  }

  const existingMedia = await db.select().from(mediaAssets).where(eq(mediaAssets.tenantId, tenantId));
  if (existingMedia.length === 0) {
    console.log("Seeding media assets...");
    await storage.createMediaAsset({
      tenantId,
      filename: "acme-logo.png",
      originalName: "acme-logo.png",
      mimeType: "image/png",
      sizeBytes: 45320,
      url: "/uploads/acme-logo.png",
      alt: "Acme Consulting logo",
      tagsJson: JSON.stringify(["branding", "logo"]),
      folder: "branding",
      uploadedByUserId: userId,
    });
    await storage.createMediaAsset({
      tenantId,
      filename: "team-photo.jpg",
      originalName: "team-photo-2024.jpg",
      mimeType: "image/jpeg",
      sizeBytes: 2340000,
      url: "/uploads/team-photo.jpg",
      alt: "Acme Consulting team at annual retreat",
      tagsJson: JSON.stringify(["team", "culture", "about-us"]),
      folder: "marketing",
      uploadedByUserId: userId,
    });
    await storage.createMediaAsset({
      tenantId,
      filename: "case-study-techstartup.pdf",
      originalName: "Case Study - TechStartup.io Growth Strategy.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1560000,
      url: "/uploads/case-study-techstartup.pdf",
      alt: "TechStartup.io growth strategy case study",
      tagsJson: JSON.stringify(["case-study", "portfolio", "strategy"]),
      folder: "documents",
      uploadedByUserId: userId,
    });
    await storage.createMediaAsset({
      tenantId,
      filename: "proposal-template.docx",
      originalName: "Acme Consulting Proposal Template.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      sizeBytes: 89400,
      url: "/uploads/proposal-template.docx",
      alt: "Standard proposal template",
      tagsJson: JSON.stringify(["template", "proposal", "sales"]),
      folder: "templates",
      uploadedByUserId: userId,
    });
  }

  console.log("Seed data created successfully!");
  console.log("Default login: alex@acmeconsulting.com / password123");
}
