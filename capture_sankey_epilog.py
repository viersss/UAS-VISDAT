import os
import time
from playwright.sync_api import sync_playwright

output_dir = r"C:\Users\viery\.gemini\antigravity-ide\brain\18bff054-ad52-452f-9e1c-816a47890fa7\scratch\screenshots"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={'width': 1440, 'height': 960},
        device_scale_factor=2
    )
    page = context.new_page()
    page.goto('http://localhost:5173/', wait_until='networkidle')
    time.sleep(3)

    # Hide nav
    page.evaluate("() => { const nav = document.querySelector('.story-nav-shell'); if (nav) nav.style.display = 'none'; }")

    # Scroll to Bab 2
    page.locator('#bab-2').scroll_into_view_if_needed()
    time.sleep(2)

    # Wait for Sankey canvas to render
    page.wait_for_selector('#bab-2 canvas', timeout=10000)
    time.sleep(2) # wait for animation

    bab2_main = page.locator('#bab-2 .grid.grid-cols-1.lg\\:grid-cols-\\[320px_minmax\\(0\\,1fr\\)\\]')
    bab2_main.screenshot(path=os.path.join(output_dir, '05_migration_sankey.png'))
    print("Successfully saved 05_migration_sankey.png")

    # Scroll to Epilog
    page.locator('#epilog').scroll_into_view_if_needed()
    time.sleep(1)

    # Epilog cards
    epilog_cards = page.locator('#epilog').locator('.grid.gap-8.lg\\:gap-6.lg\\:grid-cols-3')
    if epilog_cards.count() > 0:
        epilog_cards.screenshot(path=os.path.join(output_dir, '10_epilog_insights.png'))
        print("Successfully saved 10_epilog_insights.png")

    # Also capture Hero cleanly
    page.locator('#hero').scroll_into_view_if_needed()
    time.sleep(1)
    hero = page.locator('#hero')
    hero.screenshot(path=os.path.join(output_dir, '01_hero_metric_strip.png'))
    print("Successfully saved 01_hero_metric_strip.png")

    browser.close()
