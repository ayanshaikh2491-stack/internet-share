"""Verify spacing fix"""
from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    
    for w, h, name in [(1280, 800, 'desktop'), (390, 844, 'mobile')]:
        page = browser.new_page(viewport={'width': w, 'height': h})
        page.goto('https://client-inky-iota.vercel.app', wait_until='networkidle')
        time.sleep(2)
        
        # Check cutoff elements (excluding intentional glow orbs)
        cutoff = page.evaluate("""() => {
            const issues = [];
            document.querySelectorAll('*:not(.absolute)').forEach(el => {
                const r = el.getBoundingClientRect();
                if (r.width <= 0) return;
                const outside = r.right > window.innerWidth + 2 || r.bottom > window.innerHeight + 2 || r.left < -2;
                if (outside && el.children.length > 0 && el !== document.body) {
                    let t = (el.textContent || '').trim().slice(0,25);
                    if (t) issues.push(el.tagName + ': ' + t);
                }
            });
            return issues.slice(0, 8);
        }""")
        
        if cutoff:
            print(f'{name} - CUT OFF: {cutoff}')
        else:
            print(f'{name} - All good ✅')
        
        page.screenshot(path=f'C:/Users/TAUSHEF/Documents/demon/_screenshots/fixed-{name}.png')
        page.close()
    
    browser.close()
    print('Done!')
