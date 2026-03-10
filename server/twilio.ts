import Twilio from "twilio";
import type { storage as storageType } from "./storage";

type Storage = typeof storageType;

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
}

export async function getTwilioConfig(storage: Storage, tenantId: string): Promise<TwilioConfig | null> {
  const accountSid = await storage.getSetting(`twilio_account_sid:${tenantId}`);
  const authToken = await storage.getSetting(`twilio_auth_token:${tenantId}`);
  if (!accountSid || !authToken) return null;
  return { accountSid, authToken };
}

export function createTwilioClient(config: TwilioConfig) {
  return Twilio(config.accountSid, config.authToken);
}

export async function searchAvailableNumbers(
  config: TwilioConfig,
  country: string = "US",
  type: string = "local",
  areaCode?: string
) {
  const client = createTwilioClient(config);
  let query: any;

  if (type === "tollFree") {
    query = client.availablePhoneNumbers(country).tollFree;
  } else if (type === "mobile") {
    query = client.availablePhoneNumbers(country).mobile;
  } else {
    query = client.availablePhoneNumbers(country).local;
  }

  const params: any = { limit: 20 };
  if (areaCode) params.areaCode = areaCode;

  const numbers = await query.list(params);
  return numbers.map((n: any) => ({
    phoneNumber: n.phoneNumber,
    friendlyName: n.friendlyName,
    locality: n.locality,
    region: n.region,
    capabilities: {
      voice: n.capabilities?.voice ?? false,
      sms: n.capabilities?.sms ?? false,
      mms: n.capabilities?.mms ?? false,
    },
  }));
}

export async function purchaseNumber(config: TwilioConfig, phoneNumber: string, webhookBaseUrl: string) {
  const client = createTwilioClient(config);
  const purchased = await client.incomingPhoneNumbers.create({
    phoneNumber,
    voiceUrl: `${webhookBaseUrl}/api/webhooks/twilio/voice`,
    voiceMethod: "POST",
    statusCallback: `${webhookBaseUrl}/api/webhooks/twilio/voice/status`,
    statusCallbackMethod: "POST",
    smsUrl: `${webhookBaseUrl}/api/webhooks/twilio/sms`,
    smsMethod: "POST",
  });
  return {
    sid: purchased.sid,
    phoneNumber: purchased.phoneNumber,
    friendlyName: purchased.friendlyName,
  };
}

export async function releaseNumber(config: TwilioConfig, twilioSid: string) {
  const client = createTwilioClient(config);
  await client.incomingPhoneNumbers(twilioSid).remove();
}

export async function makeOutboundCall(
  config: TwilioConfig,
  from: string,
  to: string,
  webhookBaseUrl: string
) {
  const client = createTwilioClient(config);
  const call = await client.calls.create({
    from,
    to,
    url: `${webhookBaseUrl}/api/webhooks/twilio/voice/outbound`,
    statusCallback: `${webhookBaseUrl}/api/webhooks/twilio/voice/status`,
    statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
    statusCallbackMethod: "POST",
  });
  return {
    callSid: call.sid,
    status: call.status,
  };
}

export async function sendSms(config: TwilioConfig, from: string, to: string, body: string) {
  const client = createTwilioClient(config);
  const message = await client.messages.create({
    from,
    to,
    body,
    statusCallback: undefined,
  });
  return {
    messageSid: message.sid,
    status: message.status,
  };
}

export async function testConnection(config: TwilioConfig): Promise<{ success: boolean; accountName?: string; error?: string }> {
  try {
    const client = createTwilioClient(config);
    const account = await client.api.accounts(config.accountSid).fetch();
    return { success: true, accountName: account.friendlyName };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to connect to Twilio" };
  }
}

export function validateTwilioSignature(
  authToken: string,
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  try {
    return Twilio.validateRequest(authToken, signature, url, params);
  } catch {
    return false;
  }
}

export function generateOutboundTwiml(to: string) {
  const VoiceResponse = Twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();
  const dial = response.dial();
  dial.number(to);
  return response.toString();
}

export function generateVoicemailTwiml(greeting?: string | null) {
  const VoiceResponse = Twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();
  response.say(greeting || "The person you are trying to reach is unavailable. Please leave a message after the beep.");
  response.record({
    maxLength: 120,
    transcribe: false,
    playBeep: true,
  });
  response.say("Thank you for your message. Goodbye.");
  response.hangup();
  return response.toString();
}

export function generateVoiceTwiml(options: {
  forwardTo?: string | null;
  voicemailEnabled?: boolean;
  voicemailGreeting?: string | null;
}) {
  const VoiceResponse = Twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  if (options.forwardTo) {
    response.say("Please hold while we connect your call.");
    const dial = response.dial({
      timeout: 20,
      action: options.voicemailEnabled ? "/api/webhooks/twilio/voice/voicemail" : undefined,
    });
    dial.number(options.forwardTo);
  } else if (options.voicemailEnabled) {
    response.say(options.voicemailGreeting || "Please leave a message after the beep.");
    response.record({
      maxLength: 120,
      transcribe: false,
      playBeep: true,
    });
  } else {
    response.say("Thank you for calling. No one is available to take your call at this time. Goodbye.");
    response.hangup();
  }

  return response.toString();
}
