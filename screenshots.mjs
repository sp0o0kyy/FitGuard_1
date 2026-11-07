import { chromium } from "playwright-core";
import fs from "fs";

const outDir = "./screenshots";
fs.mkdirSync(outDir, { recursive: true });

async function loginCookie(identifier, password) {
  const r = await fetch("http://127.0.0.1:3000/api/trpc/auth.login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ json: { identifier, password } }),
  });
  const cookie = r.headers.get("set-cookie");
  const m = cookie && cookie.match(/fp_session=([^;]+)/);
  if (!m) throw new Error("no cookie");
  return m[1];
}

async function run() {
  const browser = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  const snap = async (context, name, path, full = true, wait = 1500) => {
    const page = await context.newPage();
    try {
      await page.goto("http://localhost:3000" + path, { waitUntil: "networkidle", timeout: 20000 });
      await page.waitForTimeout(wait);
      await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: full });
      console.log("OK", name);
    } catch (e) {
      console.error("FAIL", name, e.message);
    } finally {
      await page.close();
    }
  };

  // 1. Anon
  const anon = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await snap(anon, "01_landing_desktop", "/");
  await snap(anon, "02_login", "/login");
  await snap(anon, "03_register", "/register");
  await anon.close();

  // 2. Coach desktop
  const coachCookie = await loginCookie("coach", "coach123");
  const coach = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await coach.addCookies([{ name: "fp_session", value: coachCookie, domain: "localhost", path: "/" }]);
  await snap(coach, "04_coach_dashboard", "/coach/dashboard", true, 2000);
  await snap(coach, "05_coach_trainees", "/coach/trainees");
  await snap(coach, "06_coach_trainee_ivan", "/coach/trainees/2", true, 2500);
  await snap(coach, "07_coach_codes", "/coach/codes");
  await coach.close();

  // 3. Coach mobile
  const coachMob = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
  });
  await coachMob.addCookies([{ name: "fp_session", value: coachCookie, domain: "localhost", path: "/" }]);
  await snap(coachMob, "08_coach_dashboard_mobile", "/coach/dashboard", true, 2000);
  await snap(coachMob, "09_coach_trainee_ivan_mobile", "/coach/trainees/2", true, 2500);
  await coachMob.close();

  // 4. Trainee desktop
  const ivanCookie = await loginCookie("ivan", "ivan123");
  const trainee = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await trainee.addCookies([{ name: "fp_session", value: ivanCookie, domain: "localhost", path: "/" }]);
  await snap(trainee, "10_trainee_dashboard", "/trainee/dashboard");
  await snap(trainee, "11_workout_form", "/trainee/workout/new");
  await snap(trainee, "12_workout_detail_ai_report", "/trainee/workout/6", true, 2500);
  await snap(trainee, "13_workout_history", "/trainee/history");
  await snap(trainee, "14_measurements", "/trainee/measurements");
  await snap(trainee, "15_my_coaches", "/trainee/coaches");
  await snap(trainee, "16_profile", "/profile");
  await trainee.close();

  // 5. Trainee mobile
  const traineeMob = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true,
  });
  await traineeMob.addCookies([{ name: "fp_session", value: ivanCookie, domain: "localhost", path: "/" }]);
  await snap(traineeMob, "17_trainee_dashboard_mobile", "/trainee/dashboard");
  await snap(traineeMob, "18_workout_form_mobile", "/trainee/workout/new");
  await snap(traineeMob, "19_workout_detail_mobile", "/trainee/workout/6", true, 2500);
  await traineeMob.close();

  await browser.close();
  console.log("DONE");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
