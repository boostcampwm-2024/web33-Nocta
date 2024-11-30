import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  // 각 테스트 케이스의 타임아웃 시간
  timeout: 30000,
  // 테스트 실행 시 기본 설정
  expect: {
    timeout: 5000,
  },
  // 테스트 실행자 수
  workers: process.env.CI ? 1 : undefined,
  // 테스트 리포터 설정
  reporter: "html",

  use: {
    // 베이스 URL 설정
    baseURL: "http://localhost:5173/",
    // 트레이스 설정
    trace: "on-first-retry",
    // 스크린샷 설정
    screenshot: "only-on-failure",
  },

  // 테스트할 브라우저 프로젝트 설정
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
});
