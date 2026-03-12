import type { Express } from "express";
  import { storage } from "../storage";
  import { z } from "zod";
  import { requireAuth } from "../auth";
  import { getTwilioConfig, searchAvailableNumbers, purchaseNumber, releaseNumber, makeOutboundCall, sendSms as twilioSendSms, testConnection, generateVoiceTwiml, generateOutboundTwiml, generateVoicemailTwiml } from "../twilio";

  export function registerPhoneRoutes(app: Express) {
    // Phone System Routes
  app.get("/api/admin/phone-settings", requireAuth, async (req, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const accountSid = await storage.getSetting(`twilio_account_sid:${tenantId}`);
      const authToken = await storage.getSetting(`twilio_auth_token:${tenantId}`);
      res.json({
        configured: !!(accountSid && authToken),
        accountSid: accountSid || "",
        hasAuthToken: !!authToken,
      });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/phone-settings", requireAuth, async (req, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const { accountSid, authToken } = req.body;
      if (accountSid !== undefined) {
        await storage.setSetting(`twilio_account_sid:${tenantId}`, accountSid, "phone");
      }
      if (authToken !== undefined) {
        await storage.setSetting(`twilio_auth_token:${tenantId}`, authToken, "phone");
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/phone-settings/test", requireAuth, async (req, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const config = await getTwilioConfig(storage, tenantId);
      if (!config) return res.status(400).json({ message: "Twilio credentials not configured" });
      const result = await testConnection(config);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/phone-numbers", requireAuth, async (req, res) => {
    try {
      const numbers = await storage.getPhoneNumbersByTenant(req.user!.tenantId);
      res.json(numbers);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/phone-numbers/available", requireAuth, async (req, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const config = await getTwilioConfig(storage, tenantId);
      if (!config) return res.status(400).json({ message: "Twilio credentials not configured" });
      const country = (req.query.country as string) || "US";
      const type = (req.query.type as string) || "local";
      const areaCode = req.query.areaCode as string | undefined;
      const numbers = await searchAvailableNumbers(config, country, type, areaCode);
      res.json(numbers);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/phone-numbers", requireAuth, async (req, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const { number, friendlyName, capabilities, forwardTo, voicemailEnabled, voicemailGreeting, purchaseFromTwilio } = req.body;

      let twilioSid: string | undefined;
      if (purchaseFromTwilio) {
        const config = await getTwilioConfig(storage, tenantId);
        if (!config) return res.status(400).json({ message: "Twilio credentials not configured" });
        const protocol = req.headers["x-forwarded-proto"] || req.protocol;
        const host = req.headers["x-forwarded-host"] || req.headers.host;
        const webhookBaseUrl = `${protocol}://${host}`;
        const purchased = await purchaseNumber(config, number, webhookBaseUrl);
        twilioSid = purchased.sid;
      }

      const phoneNumber = await storage.createPhoneNumber({
        tenantId,
        number,
        friendlyName: friendlyName || number,
        capabilities: capabilities || "voice,sms",
        forwardTo: forwardTo || null,
        voicemailEnabled: voicemailEnabled || false,
        voicemailGreeting: voicemailGreeting || null,
        twilioSid: twilioSid || null,
      });
      res.status(201).json(phoneNumber);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.patch("/api/admin/phone-numbers/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getPhoneNumber(req.params.id);
      if (!existing || existing.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Phone number not found" });
      }
      const updated = await storage.updatePhoneNumber(req.params.id, req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/phone-numbers/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getPhoneNumber(req.params.id);
      if (!existing || existing.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Phone number not found" });
      }
      if (existing.twilioSid) {
        try {
          const config = await getTwilioConfig(storage, req.user!.tenantId);
          if (config) {
            await releaseNumber(config, existing.twilioSid);
          }
        } catch {
        }
      }
      await storage.deletePhoneNumber(req.params.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/call-logs", requireAuth, async (req, res) => {
    try {
      const logs = await storage.getCallLogsByTenant(req.user!.tenantId);
      res.json(logs);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/call-logs/:id", requireAuth, async (req, res) => {
    try {
      const log = await storage.getCallLog(req.params.id);
      if (!log || log.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Call log not found" });
      }
      res.json(log);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/calls", requireAuth, async (req, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const config = await getTwilioConfig(storage, tenantId);
      if (!config) return res.status(400).json({ message: "Twilio credentials not configured" });

      const { from, to } = req.body;
      if (!from || !to) return res.status(400).json({ message: "from and to numbers are required" });

      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const webhookBaseUrl = `${protocol}://${host}`;

      const result = await makeOutboundCall(config, from, to, webhookBaseUrl);

      const phoneNum = await storage.getPhoneNumberByNumber(tenantId, from);
      await storage.createCallLog({
        tenantId,
        phoneNumberId: phoneNum?.id || null,
        direction: "OUTBOUND",
        fromNumber: from,
        toNumber: to,
        status: "QUEUED",
        callSid: result.callSid,
      });

      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/sms", requireAuth, async (req, res) => {
    try {
      const messages = await storage.getSmsByTenant(req.user!.tenantId);
      res.json(messages);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/admin/sms/:id", requireAuth, async (req, res) => {
    try {
      const msg = await storage.getSms(req.params.id);
      if (!msg || msg.tenantId !== req.user!.tenantId) {
        return res.status(404).json({ message: "Message not found" });
      }
      res.json(msg);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/sms", requireAuth, async (req, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const config = await getTwilioConfig(storage, tenantId);
      if (!config) return res.status(400).json({ message: "Twilio credentials not configured" });

      const { from, to, body } = req.body;
      if (!from || !to || !body) return res.status(400).json({ message: "from, to, and body are required" });

      const result = await twilioSendSms(config, from, to, body);

      const phoneNum = await storage.getPhoneNumberByNumber(tenantId, from);
      const smsRecord = await storage.createSms({
        tenantId,
        phoneNumberId: phoneNum?.id || null,
        direction: "OUTBOUND",
        fromNumber: from,
        toNumber: to,
        body,
        status: "SENT",
        messageSid: result.messageSid,
      });

      res.json(smsRecord);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Twilio Webhook Routes (public — called by Twilio)
  app.post("/api/webhooks/twilio/voice", async (req, res) => {
    try {
      const calledNumber = req.body.Called || req.body.To;
      if (!calledNumber) {
        res.type("text/xml").send("<Response><Say>An error occurred.</Say></Response>");
        return;
      }

      const phoneNum = await storage.getPhoneNumberByNumberGlobal(calledNumber);
      if (!phoneNum) {
        res.type("text/xml").send("<Response><Say>This number is not configured.</Say></Response>");
        return;
      }

      await storage.createCallLog({
        tenantId: phoneNum.tenantId,
        phoneNumberId: phoneNum.id,
        direction: "INBOUND",
        fromNumber: req.body.From || "unknown",
        toNumber: calledNumber,
        status: "RINGING",
        callSid: req.body.CallSid || null,
      });

      const twiml = generateVoiceTwiml({
        forwardTo: phoneNum.forwardTo,
        voicemailEnabled: phoneNum.voicemailEnabled,
        voicemailGreeting: phoneNum.voicemailGreeting,
      });

      res.type("text/xml").send(twiml);
    } catch (e: any) {
      res.type("text/xml").send("<Response><Say>An error occurred.</Say></Response>");
    }
  });

  app.post("/api/webhooks/twilio/voice/outbound", async (req, res) => {
    try {
      const to = req.body.To || req.body.Called || "";
      const twiml = generateOutboundTwiml(to);
      res.type("text/xml").send(twiml);
    } catch {
      res.type("text/xml").send("<Response><Say>An error occurred.</Say></Response>");
    }
  });

  app.post("/api/webhooks/twilio/voice/voicemail", async (req, res) => {
    try {
      const calledNumber = req.body.Called || req.body.To;
      const phoneNum = calledNumber ? await storage.getPhoneNumberByNumberGlobal(calledNumber) : null;
      const twiml = generateVoicemailTwiml(phoneNum?.voicemailGreeting);

      if (req.body.CallSid) {
        const log = await storage.getCallLogByCallSid(req.body.CallSid);
        if (log && req.body.RecordingUrl) {
          await storage.updateCallLog(log.id, { voicemailUrl: req.body.RecordingUrl });
        }
      }

      res.type("text/xml").send(twiml);
    } catch {
      res.type("text/xml").send("<Response><Say>An error occurred.</Say></Response>");
    }
  });

  app.post("/api/webhooks/twilio/voice/status", async (req, res) => {
    try {
      const callSid = req.body.CallSid;
      if (!callSid) return res.sendStatus(200);

      const statusMap: Record<string, string> = {
        queued: "QUEUED",
        ringing: "RINGING",
        "in-progress": "IN_PROGRESS",
        completed: "COMPLETED",
        busy: "BUSY",
        "no-answer": "NO_ANSWER",
        failed: "FAILED",
        canceled: "CANCELED",
      };

      const log = await storage.getCallLogByCallSid(callSid);
      if (log) {
        const updateData: any = {};
        if (req.body.CallStatus && statusMap[req.body.CallStatus]) {
          updateData.status = statusMap[req.body.CallStatus];
        }
        if (req.body.CallDuration) {
          updateData.duration = parseInt(req.body.CallDuration, 10);
        }
        if (req.body.RecordingUrl) {
          updateData.recordingUrl = req.body.RecordingUrl;
        }
        if (Object.keys(updateData).length > 0) {
          await storage.updateCallLog(log.id, updateData);
        }
      }
      res.sendStatus(200);
    } catch {
      res.sendStatus(200);
    }
  });

  app.post("/api/webhooks/twilio/sms", async (req, res) => {
    try {
      const toNumber = req.body.To;
      const fromNumber = req.body.From;
      const body = req.body.Body || "";

      if (!toNumber) return res.sendStatus(200);

      const phoneNum = await storage.getPhoneNumberByNumberGlobal(toNumber);
      if (phoneNum) {
        await storage.createSms({
          tenantId: phoneNum.tenantId,
          phoneNumberId: phoneNum.id,
          direction: "INBOUND",
          fromNumber: fromNumber || "unknown",
          toNumber,
          body,
          status: "RECEIVED",
          messageSid: req.body.MessageSid || null,
        });
      }

      res.type("text/xml").send("<Response></Response>");
    } catch {
      res.sendStatus(200);
    }
  });

  app.post("/api/webhooks/twilio/sms/status", async (req, res) => {
    try {
      const messageSid = req.body.MessageSid;
      if (!messageSid) return res.sendStatus(200);

      const statusMap: Record<string, string> = {
        queued: "QUEUED",
        sent: "SENT",
        delivered: "DELIVERED",
        failed: "FAILED",
        undelivered: "FAILED",
      };

      const msg = await storage.getSmsByMessageSid(messageSid);
      if (msg && req.body.MessageStatus && statusMap[req.body.MessageStatus]) {
        await storage.updateSms(msg.id, { status: statusMap[req.body.MessageStatus] as any });
      }
      res.sendStatus(200);
    } catch {
      res.sendStatus(200);
    }
  });
  }
  