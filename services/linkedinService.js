import axios from "axios";
import crypto from "node:crypto";
import admin from "firebase-admin";

let firebaseApp;

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    const error = new Error(`${name} is required.`);
    error.statusCode = 500;
    throw error;
  }

  return value;
}

function getFirebaseCredential() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    const error = new Error(
      "Firebase Admin SDK is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY."
    );
    error.statusCode = 500;
    throw error;
  }

  return admin.credential.cert({
    projectId,
    clientEmail,
    privateKey
  });
}

function getFirebaseAuth() {
  if (!firebaseApp) {
    firebaseApp = admin.apps.length
      ? admin.app()
      : admin.initializeApp({
          credential: getFirebaseCredential()
        });
  }

  return admin.auth(firebaseApp);
}

function extractProfilePhoto(profile) {
  const displayImage = profile?.profilePicture?.["displayImage~"]?.elements;
  if (Array.isArray(displayImage) && displayImage.length > 0) {
    const lastElement = displayImage[displayImage.length - 1];
    const identifiers = lastElement?.identifiers;
    if (Array.isArray(identifiers) && identifiers.length > 0) {
      return identifiers[0]?.identifier || "";
    }
  }

  return "";
}

export function generateOauthState() {
  return crypto.randomBytes(24).toString("hex");
}

export function buildLinkedInAuthorizationUrl(state) {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: getRequiredEnv("LINKEDIN_CLIENT_ID"),
    redirect_uri: getRequiredEnv("LINKEDIN_REDIRECT_URI"),
    scope: "openid profile email",
    state
  });

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

export async function exchangeCodeForAccessToken(code) {
  const response = await axios.post(
    "https://www.linkedin.com/oauth/v2/accessToken",
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getRequiredEnv("LINKEDIN_REDIRECT_URI"),
      client_id: getRequiredEnv("LINKEDIN_CLIENT_ID"),
      client_secret: getRequiredEnv("LINKEDIN_CLIENT_SECRET")
    }).toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      timeout: 15000
    }
  );

  if (!response.data?.access_token) {
    const error = new Error("LinkedIn token exchange did not return an access token.");
    error.statusCode = 502;
    throw error;
  }

  return response.data.access_token;
}

export async function fetchLinkedInProfile(accessToken) {
  const response = await axios.get("https://api.linkedin.com/v2/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    params: {
      projection: "(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))"
    },
    timeout: 15000
  });

  return response.data;
}

export async function fetchLinkedInEmail(accessToken) {
  const response = await axios.get("https://api.linkedin.com/v2/emailAddress", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    params: {
      q: "members",
      projection: "(elements*(handle~))"
    },
    timeout: 15000
  });

  const email = response.data?.elements?.[0]?.["handle~"]?.emailAddress;
  if (!email) {
    const error = new Error("LinkedIn did not return an email address.");
    error.statusCode = 502;
    throw error;
  }

  return email;
}

export function normalizeLinkedInUser(profile, email) {
  const firstName = profile?.localizedFirstName || "";
  const lastName = profile?.localizedLastName || "";
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();

  return {
    linkedinId: profile?.id || "",
    email,
    firstName,
    lastName,
    name: name || email,
    picture: extractProfilePhoto(profile),
    provider: "linkedin"
  };
}

export async function createOrGetUser(linkedinUser) {
  const firebaseAuth = getFirebaseAuth();

  try {
    const existingUser = await firebaseAuth.getUserByEmail(linkedinUser.email);
    const providerIds = new Set((existingUser.providerData || []).map((item) => item.providerId));
    const customClaims = {
      ...(existingUser.customClaims || {}),
      provider: "linkedin",
      linkedinId: linkedinUser.linkedinId
    };

    if (!providerIds.has("linkedin.com")) {
      customClaims.providers = Array.from(new Set([...(existingUser.customClaims?.providers || []), "linkedin"]));
    }

    await firebaseAuth.updateUser(existingUser.uid, {
      displayName: existingUser.displayName || linkedinUser.name,
      photoURL: existingUser.photoURL || linkedinUser.picture || undefined
    });
    await firebaseAuth.setCustomUserClaims(existingUser.uid, customClaims);

    return {
      uid: existingUser.uid,
      email: existingUser.email || linkedinUser.email,
      name: existingUser.displayName || linkedinUser.name,
      picture: existingUser.photoURL || linkedinUser.picture || "",
      provider: "linkedin",
      linkedinId: linkedinUser.linkedinId
    };
  } catch (error) {
    if (error.code !== "auth/user-not-found") {
      throw error;
    }
  }

  const createdUser = await firebaseAuth.createUser({
    email: linkedinUser.email,
    displayName: linkedinUser.name,
    photoURL: linkedinUser.picture || undefined,
    emailVerified: true
  });

  await firebaseAuth.setCustomUserClaims(createdUser.uid, {
    provider: "linkedin",
    providers: ["linkedin"],
    linkedinId: linkedinUser.linkedinId
  });

  return {
    uid: createdUser.uid,
    email: createdUser.email || linkedinUser.email,
    name: createdUser.displayName || linkedinUser.name,
    picture: createdUser.photoURL || linkedinUser.picture || "",
    provider: "linkedin",
    linkedinId: linkedinUser.linkedinId
  };
}
