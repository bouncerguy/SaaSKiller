const HUBSPOT_BASE = "https://api.hubapi.com";

function getAccessToken(): string {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) {
    throw new Error("HUBSPOT_ACCESS_TOKEN is not configured. Add your HubSpot Private App token in Settings → Secrets.");
  }
  return token;
}

async function hubspotFetch(path: string, options: RequestInit = {}) {
  const token = getAccessToken();
  const res = await fetch(`${HUBSPOT_BASE}${path}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HubSpot API error (${res.status}): ${body}`);
  }

  return res.json();
}

export interface HubSpotContact {
  id: string;
  properties: {
    firstname?: string;
    lastname?: string;
    email?: string;
    phone?: string;
    company?: string;
    address?: string;
    lifecyclestage?: string;
    createdate?: string;
  };
}

export interface HubSpotWorkflow {
  id: number;
  name: string;
  type: string;
  enabled: boolean;
  insertedAt: string;
  updatedAt: string;
  actions: any[];
}

export async function fetchHubSpotContacts(limit = 100): Promise<HubSpotContact[]> {
  const allContacts: HubSpotContact[] = [];
  let after: string | undefined;

  do {
    const params = new URLSearchParams({
      limit: String(Math.min(limit, 100)),
      properties: "firstname,lastname,email,phone,company,address,lifecyclestage,createdate",
    });
    if (after) params.set("after", after);

    const data = await hubspotFetch(`/crm/v3/objects/contacts?${params}`);
    allContacts.push(...(data.results || []));

    after = data.paging?.next?.after;
    if (allContacts.length >= limit) break;
  } while (after);

  return allContacts.slice(0, limit);
}

export async function fetchHubSpotWorkflows(): Promise<HubSpotWorkflow[]> {
  try {
    const data = await hubspotFetch("/automation/v4/flows");
    return (data.results || []).map((flow: any) => ({
      id: flow.id,
      name: flow.name || `Workflow ${flow.id}`,
      type: flow.type || "unknown",
      enabled: flow.enabled ?? false,
      insertedAt: flow.insertedAt || flow.createdAt || "",
      updatedAt: flow.updatedAt || "",
      actions: flow.actions || [],
    }));
  } catch (e: any) {
    if (e.message?.includes("403") || e.message?.includes("401")) {
      throw new Error("HubSpot Workflows API access denied. Ensure your Private App has 'Automation' read scope.");
    }
    try {
      const data = await hubspotFetch("/automation/v3/workflows");
      return (data.workflows || []).map((wf: any) => ({
        id: wf.id,
        name: wf.name || `Workflow ${wf.id}`,
        type: wf.type || "unknown",
        enabled: wf.enabled ?? false,
        insertedAt: wf.insertedAt || "",
        updatedAt: wf.updatedAt || "",
        actions: wf.actions || [],
      }));
    } catch {
      throw e;
    }
  }
}

export function mapContactName(contact: HubSpotContact): string {
  const first = contact.properties.firstname || "";
  const last = contact.properties.lastname || "";
  return `${first} ${last}`.trim() || contact.properties.email || "Unknown";
}

export function isHubSpotConfigured(): boolean {
  return !!process.env.HUBSPOT_ACCESS_TOKEN;
}
