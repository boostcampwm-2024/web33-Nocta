import { test, expect } from "@playwright/test";

test("4명의 사용자가 동시에 문서 편집", async ({ browser }) => {
  // 4개의 독립적인 브라우저 컨텍스트 생성
  const contexts = await Promise.all([
    browser.newContext(),
    browser.newContext(),
    browser.newContext(),
    browser.newContext(),
  ]);

  // 각 컨텍스트에서 새로운 페이지 생성
  const pages = await Promise.all(contexts.map((context) => context.newPage()));

  // 모든 페이지가 동시에 접속
  await Promise.all(pages.map((page) => page.goto("http://localhost:5173/")));

  // 모든 사용자가 동시에 새 문서 버튼 클릭
  await Promise.all(pages.map((page) => page.getByRole("button").nth(1).click()));

  // 모든 사용자가 동시에 새로운 페이지 클릭
  await Promise.all(
    pages.map((page) => page.locator("div").filter({ hasText: "새로운 페이지" }).nth(3).click()),
  );

  // 모든 사용자가 동시에 텍스트 영역 클릭
  await Promise.all(pages.map((page) => page.locator(".textStyle_display-medium16").click()));

  // 모든 사용자가 동시에 텍스트 입력
  await Promise.all(
    pages.map((page, index) =>
      page.locator(".textStyle_display-medium16").fill(`사용자${index + 1}의 텍스트입니다`),
    ),
  );

  // 동기화를 위한 대기
  await pages[0].waitForTimeout(1000);

  // 모든 페이지의 내용 확인
  const contents = await Promise.all(
    pages.map(async (page, index) => {
      const content = await page.locator(".textStyle_display-medium16").textContent();
      console.log(`사용자 ${index + 1}의 화면 내용:`, content);
      return content;
    }),
  );

  // 모든 컨텍스트 정리
  await Promise.all(contexts.map((context) => context.close()));
});
