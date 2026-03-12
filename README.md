# site-template-crawler-api

Puppeteer 기반 크롤링 API 서버

## 엔드포인트
- GET /health
- POST /crawl

## 요청 예시
{
  "url": "https://example.com"
}

## 응답 예시
{
  "success": true,
  "sourceUrl": "https://example.com",
  "resolvedUrl": "https://example.com/",
  "title": "Example Domain",
  "html": "<!doctype html>...",
  "screenshot": "data:image/jpeg;base64,...",
  "timestamp": "2026-03-12T00:00:00.000Z",
  "size": {
    "html": "12.34 KB",
    "screenshot": "245.12 KB"
  }
}
