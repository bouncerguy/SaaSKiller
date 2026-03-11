import type { SocialAccount } from "@shared/schema";

interface PostResult {
  success: boolean;
  error?: string;
  platformPostId?: string;
}

export async function postToTwitter(account: SocialAccount, content: string, _mediaUrl?: string): Promise<PostResult> {
  try {
    if (!account.apiKey || !account.apiSecret || !account.accessToken || !account.accessTokenSecret) {
      return { success: false, error: "Missing Twitter API credentials (API Key, API Secret, Access Token, Access Token Secret)" };
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = Math.random().toString(36).substring(2);

    const params: Record<string, string> = {
      oauth_consumer_key: account.apiKey,
      oauth_nonce: nonce,
      oauth_signature_method: "HMAC-SHA1",
      oauth_timestamp: timestamp,
      oauth_token: account.accessToken,
      oauth_version: "1.0",
    };

    const { createHmac } = await import("crypto");

    const baseUrl = "https://api.twitter.com/2/tweets";
    const paramString = Object.keys(params).sort().map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join("&");
    const baseString = `POST&${encodeURIComponent(baseUrl)}&${encodeURIComponent(paramString)}`;
    const signingKey = `${encodeURIComponent(account.apiSecret)}&${encodeURIComponent(account.accessTokenSecret)}`;
    const signature = createHmac("sha1", signingKey).update(baseString).digest("base64");

    const authHeader = `OAuth ${Object.entries(params).map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`).join(", ")}, oauth_signature="${encodeURIComponent(signature)}"`;

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: content }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return { success: false, error: `Twitter API error (${response.status}): ${errorData}` };
    }

    const data = await response.json() as any;
    return { success: true, platformPostId: data.data?.id };
  } catch (err: any) {
    return { success: false, error: `Twitter error: ${err.message}` };
  }
}

export async function postToFacebook(account: SocialAccount, content: string, mediaUrl?: string): Promise<PostResult> {
  try {
    if (!account.accessToken || !account.pageId) {
      return { success: false, error: "Missing Facebook credentials (Page Access Token, Page ID)" };
    }

    const url = mediaUrl
      ? `https://graph.facebook.com/v18.0/${account.pageId}/photos`
      : `https://graph.facebook.com/v18.0/${account.pageId}/feed`;

    const body: Record<string, string> = { access_token: account.accessToken };
    if (mediaUrl) {
      body.url = mediaUrl;
      body.caption = content;
    } else {
      body.message = content;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return { success: false, error: `Facebook API error (${response.status}): ${errorData}` };
    }

    const data = await response.json() as any;
    return { success: true, platformPostId: data.id || data.post_id };
  } catch (err: any) {
    return { success: false, error: `Facebook error: ${err.message}` };
  }
}

export async function postToLinkedIn(account: SocialAccount, content: string, _mediaUrl?: string): Promise<PostResult> {
  try {
    if (!account.accessToken) {
      return { success: false, error: "Missing LinkedIn credentials (Access Token)" };
    }

    const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { "Authorization": `Bearer ${account.accessToken}` },
    });

    if (!profileResponse.ok) {
      return { success: false, error: `LinkedIn profile fetch failed (${profileResponse.status})` };
    }

    const profile = await profileResponse.json() as any;
    const personUrn = `urn:li:person:${profile.sub}`;

    const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${account.accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        author: personUrn,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: { text: content },
            shareMediaCategory: "NONE",
          },
        },
        visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      return { success: false, error: `LinkedIn API error (${response.status}): ${errorData}` };
    }

    const data = await response.json() as any;
    return { success: true, platformPostId: data.id };
  } catch (err: any) {
    return { success: false, error: `LinkedIn error: ${err.message}` };
  }
}

export async function postToInstagram(account: SocialAccount, content: string, mediaUrl?: string): Promise<PostResult> {
  try {
    if (!account.accessToken || !account.pageId) {
      return { success: false, error: "Missing Instagram credentials (Access Token, Instagram Business Account ID)" };
    }

    if (!mediaUrl) {
      return { success: false, error: "Instagram requires an image URL for posts" };
    }

    const containerResponse = await fetch(
      `https://graph.facebook.com/v18.0/${account.pageId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: mediaUrl,
          caption: content,
          access_token: account.accessToken,
        }),
      }
    );

    if (!containerResponse.ok) {
      const errorData = await containerResponse.text();
      return { success: false, error: `Instagram container error (${containerResponse.status}): ${errorData}` };
    }

    const container = await containerResponse.json() as any;

    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${account.pageId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: container.id,
          access_token: account.accessToken,
        }),
      }
    );

    if (!publishResponse.ok) {
      const errorData = await publishResponse.text();
      return { success: false, error: `Instagram publish error (${publishResponse.status}): ${errorData}` };
    }

    const data = await publishResponse.json() as any;
    return { success: true, platformPostId: data.id };
  } catch (err: any) {
    return { success: false, error: `Instagram error: ${err.message}` };
  }
}

export async function testTwitterConnection(account: SocialAccount): Promise<PostResult> {
  try {
    if (!account.apiKey || !account.apiSecret || !account.accessToken || !account.accessTokenSecret) {
      return { success: false, error: "Missing Twitter API credentials" };
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = Math.random().toString(36).substring(2);
    const { createHmac } = await import("crypto");

    const baseUrl = "https://api.twitter.com/2/users/me";
    const params: Record<string, string> = {
      oauth_consumer_key: account.apiKey,
      oauth_nonce: nonce,
      oauth_signature_method: "HMAC-SHA1",
      oauth_timestamp: timestamp,
      oauth_token: account.accessToken,
      oauth_version: "1.0",
    };

    const paramString = Object.keys(params).sort().map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join("&");
    const baseString = `GET&${encodeURIComponent(baseUrl)}&${encodeURIComponent(paramString)}`;
    const signingKey = `${encodeURIComponent(account.apiSecret)}&${encodeURIComponent(account.accessTokenSecret)}`;
    const signature = createHmac("sha1", signingKey).update(baseString).digest("base64");

    const authHeader = `OAuth ${Object.entries(params).map(([k, v]) => `${encodeURIComponent(k)}="${encodeURIComponent(v)}"`).join(", ")}, oauth_signature="${encodeURIComponent(signature)}"`;

    const response = await fetch(baseUrl, {
      headers: { "Authorization": authHeader },
    });

    if (!response.ok) {
      return { success: false, error: `Twitter verification failed (${response.status})` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: `Twitter test failed: ${err.message}` };
  }
}

export async function testFacebookConnection(account: SocialAccount): Promise<PostResult> {
  try {
    if (!account.accessToken || !account.pageId) {
      return { success: false, error: "Missing Facebook credentials" };
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${account.pageId}?access_token=${account.accessToken}&fields=name`
    );

    if (!response.ok) {
      return { success: false, error: `Facebook verification failed (${response.status})` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: `Facebook test failed: ${err.message}` };
  }
}

export async function testLinkedInConnection(account: SocialAccount): Promise<PostResult> {
  try {
    if (!account.accessToken) {
      return { success: false, error: "Missing LinkedIn access token" };
    }

    const response = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { "Authorization": `Bearer ${account.accessToken}` },
    });

    if (!response.ok) {
      return { success: false, error: `LinkedIn verification failed (${response.status})` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: `LinkedIn test failed: ${err.message}` };
  }
}

export async function testInstagramConnection(account: SocialAccount): Promise<PostResult> {
  try {
    if (!account.accessToken || !account.pageId) {
      return { success: false, error: "Missing Instagram credentials" };
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${account.pageId}?access_token=${account.accessToken}&fields=username`
    );

    if (!response.ok) {
      return { success: false, error: `Instagram verification failed (${response.status})` };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: `Instagram test failed: ${err.message}` };
  }
}

const platformPosters: Record<string, (account: SocialAccount, content: string, mediaUrl?: string) => Promise<PostResult>> = {
  twitter: postToTwitter,
  facebook: postToFacebook,
  linkedin: postToLinkedIn,
  instagram: postToInstagram,
};

const platformTesters: Record<string, (account: SocialAccount) => Promise<PostResult>> = {
  twitter: testTwitterConnection,
  facebook: testFacebookConnection,
  linkedin: testLinkedInConnection,
  instagram: testInstagramConnection,
};

export async function postToPlatform(account: SocialAccount, content: string, mediaUrl?: string): Promise<PostResult> {
  const poster = platformPosters[account.platform];
  if (!poster) return { success: false, error: `Unsupported platform: ${account.platform}` };
  return poster(account, content, mediaUrl);
}

export async function testPlatformConnection(account: SocialAccount): Promise<PostResult> {
  const tester = platformTesters[account.platform];
  if (!tester) return { success: false, error: `Unsupported platform: ${account.platform}` };
  return tester(account);
}
