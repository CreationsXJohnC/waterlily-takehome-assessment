/**
 * Deployment verification script
 *
 * Runs end-to-end checks against a deployed URL (or local dev):
 * 1) Signup or login
 * 2) Fetch survey
 * 3) Submit answers
 * 4) Fetch my responses and verify the latest entry
 *
 * Usage:
 *   BASE_URL=https://your-vercel-url node survey-app/scripts/verify-deploy.js
 *   node survey-app/scripts/verify-deploy.js --url https://your-vercel-url
 * Defaults to http://localhost:3000 if no URL provided.
 */

const BASE_URL = (() => {
  const arg = process.argv.find((a) => a.startsWith("--url="));
  if (arg) return arg.replace("--url=", "");
  return process.env.BASE_URL || "http://localhost:3000";
})();

const testEmail = process.env.TEST_EMAIL || "verify.user@example.com";
const testPassword = process.env.TEST_PASSWORD || "VerifyPass!123";
const testName = process.env.TEST_NAME || "Verify User";

/** Simple cookie jar for the auth token cookie. */
let cookieHeader = ""; // e.g. "token=..." to send on subsequent requests

function log(step, msg) {
  console.log(`[${step}] ${msg}`);
}

function fail(step, error) {
  console.error(`\n❌ ${step} failed:`);
  if (error?.stack) console.error(error.stack);
  else console.error(error);
  process.exit(1);
}

function getSetCookieHeaders(res) {
  try {
    // Node 20+ (undici) exposes getSetCookie()
    const arr = res.headers.getSetCookie?.();
    if (Array.isArray(arr)) return arr;
  } catch {}
  const one = res.headers.get("set-cookie");
  return one ? [one] : [];
}

function updateCookieFromResponse(res) {
  const cookies = getSetCookieHeaders(res);
  const tokenCookie = cookies.find((c) => c && c.startsWith("token="));
  if (tokenCookie) {
    // Extract just the name=value pair
    const pair = tokenCookie.split(";")[0];
    cookieHeader = pair;
  }
}

async function postJson(path, body) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
    body: JSON.stringify(body),
  });
  return res;
}

async function getJson(path) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    },
  });
  return res;
}

async function stepSignupOrLogin() {
  log("auth", `Attempting signup at ${BASE_URL}/api/auth/signup`);
  let res = await postJson("/api/auth/signup", {
    email: testEmail,
    password: testPassword,
    name: testName,
  });

  if (res.status === 409) {
    log("auth", "User exists, trying login");
    res = await postJson("/api/auth/login", { email: testEmail, password: testPassword });
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Auth failed with ${res.status}: ${text}`);
  }
  updateCookieFromResponse(res);
  if (!cookieHeader) throw new Error("Missing auth cookie after signup/login");

  const statusRes = await getJson("/api/auth/status");
  const status = await statusRes.json();
  if (!status.authenticated) throw new Error("Auth status reports unauthenticated");
  log("auth", `Authenticated as userId=${status.userId}`);
  return status.userId;
}

async function stepFetchSurvey() {
  log("survey", "Fetching survey definition");
  const res = await getJson("/api/survey");
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Survey fetch failed with ${res.status}: ${text}`);
  }
  const survey = await res.json();
  if (!survey?.id || !Array.isArray(survey?.questions)) {
    throw new Error("Survey shape invalid: missing id or questions");
  }
  log("survey", `Survey id=${survey.id}, questions=${survey.questions.length}`);
  return survey;
}

function buildAnswers(questions) {
  return questions.map((q) => {
    let value = "";
    const type = String(q.type || "text");
    if (type === "select") {
      const opts = String(q.options || "").split(",").map((s) => s.trim()).filter(Boolean);
      value = opts[0] || "Option";
    } else if (type === "number") {
      value = "42";
    } else if (type === "date") {
      value = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    } else {
      value = "Verification value";
    }
    return { questionId: q.id, value };
  });
}

async function stepSubmitAnswers(survey) {
  log("submit", `Submitting answers for survey ${survey.id}`);
  const answers = buildAnswers(survey.questions);
  const res = await postJson("/api/survey/submit", { surveyId: survey.id, answers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Submit failed with ${res.status}: ${text}`);
  }
  const data = await res.json();
  log("submit", `Response id=${data.id}`);
  return data.id;
}

async function stepVerifyMyResponses(surveyId) {
  log("verify", "Fetching my responses");
  const res = await getJson("/api/responses/me");
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Responses fetch failed with ${res.status}: ${text}`);
  }
  const list = await res.json();
  if (!Array.isArray(list) || list.length === 0) throw new Error("No responses returned");
  const latest = list[0];
  if (!latest?.id || latest?.survey?.id !== surveyId) {
    throw new Error("Latest response does not match expected surveyId");
  }
  const answerCount = Array.isArray(latest.answers) ? latest.answers.length : 0;
  log("verify", `Latest response id=${latest.id}, answers=${answerCount}`);
}

async function main() {
  console.log(`\n=== Deployment Verification ===\nBASE_URL: ${BASE_URL}\n`);
  try {
    const userId = await stepSignupOrLogin();
    const survey = await stepFetchSurvey();
    await stepSubmitAnswers(survey);
    await stepVerifyMyResponses(survey.id);
    console.log("\n✅ Verification complete: auth, survey, submit, responses all OK");
  } catch (e) {
    fail("verification", e);
  }
}

main();