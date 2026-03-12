import express from "express";
import cors from "cors";
import puppeteer from "puppeteer-core";

const app = express();

const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";
const CHROME_EXECUTABLE_PATH =
  process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium";

const corsOptions = {
  origin: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(express.json({ limit: "2mb" }));

function normalizeUrl(input) {
  const trimmed = String(input || "").trim();
  if (!trimmed) {
    throw new Error("URL을 입력해주세요.");
  }

  const withProtocol = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  const url = new URL(withProtocol);

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("http 또는 https 주소만 분석할 수 있습니다.");
  }

  return url.toString();
}

app.get("/", (_req, res) => {
  res.json({
    success: true,
    service: "site-template-crawler-api",
    message: "crawler api is running"
  });
});

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    service: "site-template-crawler-api",
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

app.post("/crawl", async (req, res) => {
  let browser;

  try {
    const sourceUrl = normalizeUrl(req.body?.url);

    browser = await puppeteer.launch({
      executablePath: CHROME_EXECUTABLE_PATH,
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-features=site-per-process",
        "--hide-scrollbars"
      ],
      defaultViewport: {
        width: 1440,
        height: 2200
      }
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );

    await page.goto(sourceUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    });

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const html = await page.content();
    const title = await page.title();
    const resolvedUrl = page.url();

    const screenshotBase64 = await page.screenshot({
      encoding: "base64",
      fullPage: true,
      type: "jpeg",
      quality: 60
    });

    return res.json({
      success: true,
      sourceUrl,
      resolvedUrl,
      title: title || sourceUrl,
      html,
      screenshot: `data:image/jpeg;base64,${screenshotBase64}`,
      timestamp: new Date().toISOString(),
      size: {
        html: `${(html.length / 1024).toFixed(2)} KB`,
        screenshot: `${(screenshotBase64.length / 1024).toFixed(2)} KB`
      }
    });
  } catch (error) {
    console.error("crawl error:", error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        // ignore
      }
    }
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Not Found: ${req.method} ${req.originalUrl}`
  });
});

app.listen(PORT, HOST, () => {
  console.log(`crawler api listening on http://${HOST}:${PORT}`);
  console.log(`chrome executable path: ${CHROME_EXECUTABLE_PATH}`);
});
