import { chromium } from 'playwright-core'

const executablePath =
  process.env.HOME + '/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome'

const browser = await chromium.launch({
  executablePath,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
})

const errors = []
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`console: ${msg.text()}`)
})
page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))

await page.goto('http://localhost:5180/', { waitUntil: 'networkidle' })
await page.waitForTimeout(2800)
await page.screenshot({ path: '/tmp/opencode/ogbon-desktop-fold.png' })

for (const id of ['intelligence', 'decisions', 'human']) {
  await page.locator('#' + id).scrollIntoViewIfNeeded()
  await page.waitForTimeout(1300)
  await page.screenshot({ path: `/tmp/opencode/ogbon-${id}.png` })
}

await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(700)
await page.screenshot({ path: '/tmp/opencode/ogbon-desktop-full.png', fullPage: true })

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
mobile.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`mobile console: ${msg.text()}`)
})
mobile.on('pageerror', (err) => errors.push(`mobile pageerror: ${err.message}`))
await mobile.goto('http://localhost:5180/', { waitUntil: 'networkidle' })
await mobile.waitForTimeout(2800)
await mobile.screenshot({ path: '/tmp/opencode/ogbon-mobile-fold.png' })

for (const id of ['intelligence', 'decisions', 'human']) {
  await mobile.locator('#' + id).scrollIntoViewIfNeeded()
  await mobile.waitForTimeout(1200)
  await mobile.screenshot({ path: `/tmp/opencode/ogbon-mobile-${id}.png` })
}

await mobile.evaluate(() => window.scrollTo(0, 0))
await mobile.waitForTimeout(600)
await mobile.screenshot({ path: '/tmp/opencode/ogbon-mobile-full.png', fullPage: true })

await mobile.evaluate(() => window.scrollTo(0, 0))
await mobile.waitForTimeout(300)
await mobile.locator('[data-menu-btn]').click()
await mobile.waitForTimeout(700)
await mobile.screenshot({ path: '/tmp/opencode/ogbon-mobile-menu.png' })

const overflow = await mobile.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  innerWidth: window.innerWidth,
}))

console.log(JSON.stringify({ errors, overflow }, null, 2))
await browser.close()