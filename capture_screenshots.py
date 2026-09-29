import os
import time
from playwright.sync_api import sync_playwright

output_dir = r"C:\Users\viery\.gemini\antigravity-ide\brain\18bff054-ad52-452f-9e1c-816a47890fa7\scratch\screenshots"
os.makedirs(output_dir, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context(
        viewport={'width': 1440, 'height': 960},
        device_scale_factor=2
    )
    page = context.new_page()
    page.goto('http://localhost:5173/', wait_until='networkidle')
    time.sleep(2)

    # 1. Hero & Metric Strip (with navbar visible as part of UI, or without)
    hero = page.locator('#hero')
    hero.screenshot(path=os.path.join(output_dir, '01_hero_metric_strip.png'))
    print("Saved 01_hero_metric_strip.png")

    # Hide floating nav to avoid blocking charts
    page.evaluate("() => { const nav = document.querySelector('.story-nav-shell'); if (nav) nav.style.display = 'none'; }")

    # Scroll to Bab 1
    page.locator('#bab-1').scroll_into_view_if_needed()
    time.sleep(1)

    # 2. Bab 1 - PCA Scatter
    pca_btn = page.get_by_role('button', name='PCA Scatter')
    if pca_btn.count() > 0:
        pca_btn.click()
        time.sleep(1)
    
    # We can screenshot the entire Bab 1 main grid (selector + chart card)
    bab1_main = page.locator('#bab-1 .grid.grid-cols-1.lg\\:grid-cols-\\[340px_minmax\\(0\\,1fr\\)\\]')
    if bab1_main.count() > 0:
        bab1_main.screenshot(path=os.path.join(output_dir, '02_pca_scatter.png'))
    else:
        page.locator('#bab-1').screenshot(path=os.path.join(output_dir, '02_pca_scatter.png'))
    print("Saved 02_pca_scatter.png")

    # 3. Bab 1 - Parallel Coordinates
    parallel_btn = page.get_by_role('button', name='Parallel')
    if parallel_btn.count() > 0:
        parallel_btn.click()
        time.sleep(1)
        if bab1_main.count() > 0:
            bab1_main.screenshot(path=os.path.join(output_dir, '03_parallel_coordinates.png'))
        print("Saved 03_parallel_coordinates.png")

    # 4. Bab 1 - Scatter Matrix
    matrix_btn = page.get_by_role('button', name='Matriks')
    if matrix_btn.count() > 0:
        matrix_btn.click()
        time.sleep(1)
        if bab1_main.count() > 0:
            bab1_main.screenshot(path=os.path.join(output_dir, '04_scatter_matrix.png'))
        print("Saved 04_scatter_matrix.png")

    # Scroll to Bab 2
    page.locator('#bab-2').scroll_into_view_if_needed()
    time.sleep(2)

    # 5. Bab 2 - Sankey Diagram
    sankey_btn = page.get_by_role('button', name='Sankey')
    if sankey_btn.count() > 0:
        sankey_btn.click()
        time.sleep(1)
    
    bab2_main = page.locator('#bab-2 .grid.grid-cols-1.lg\\:grid-cols-\\[320px_minmax\\(0\\,1fr\\)\\]')
    if bab2_main.count() > 0:
        bab2_main.screenshot(path=os.path.join(output_dir, '05_migration_sankey.png'))
    else:
        page.locator('#bab-2').screenshot(path=os.path.join(output_dir, '05_migration_sankey.png'))
    print("Saved 05_migration_sankey.png")

    # 6. Bab 2 - Flowmap
    flowmap_btn = page.get_by_role('button', name='Flowmap')
    if flowmap_btn.count() > 0:
        flowmap_btn.click()
        time.sleep(2)
        if bab2_main.count() > 0:
            bab2_main.screenshot(path=os.path.join(output_dir, '06_migration_flowmap.png'))
        print("Saved 06_migration_flowmap.png")

    # Scroll to Bab 3
    page.locator('#bab-3').scroll_into_view_if_needed()
    time.sleep(2)

    # 7. Bab 3 - Sector Bar Chart
    # Sector chart is inside the relative div with mb-28
    sector_chart = page.locator('#bab-3 .grid.gap-8.lg\\:gap-10.lg\\:grid-cols-\\[0\\.7fr_1\\.3fr\\]')
    if sector_chart.count() > 0:
        sector_chart.screenshot(path=os.path.join(output_dir, '07_sector_bars.png'))
    else:
        page.locator('#bab-3').screenshot(path=os.path.join(output_dir, '07_sector_bars.png'))
    print("Saved 07_sector_bars.png")

    # 8. Bab 3 - Treemap
    treemap_btn = page.get_by_role('button', name='Treemap')
    if treemap_btn.count() > 0:
        treemap_btn.click()
        time.sleep(1)
        treemap_chart = page.locator('#bab-3 .grid.gap-4.lg\\:gap-5.lg\\:grid-cols-\\[1\\.35fr_0\\.65fr\\]')
        if treemap_chart.count() > 0:
            treemap_chart.screenshot(path=os.path.join(output_dir, '08_treemap.png'))
        print("Saved 08_treemap.png")

    # 9. Bab 3 - Sunburst
    sunburst_btn = page.get_by_role('button', name='Sunburst')
    if sunburst_btn.count() > 0:
        sunburst_btn.click()
        time.sleep(1)
        sunburst_chart = page.locator('#bab-3 .grid.gap-4.lg\\:gap-5.lg\\:grid-cols-\\[1\\.25fr_0\\.75fr\\]')
        if sunburst_chart.count() > 0:
            sunburst_chart.screenshot(path=os.path.join(output_dir, '09_sunburst.png'))
        print("Saved 09_sunburst.png")

    # 10. Epilog
    epilog_section = page.locator('#epilog .max-w-5xl')
    if epilog_section.count() > 0:
        epilog_section.screenshot(path=os.path.join(output_dir, '10_epilog_insights.png'))
        print("Saved 10_epilog_insights.png")

    browser.close()
    print("All captures completed successfully!")
