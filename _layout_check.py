"""Layout analysis with Playwright"""
from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    
    sizes = [(1280, 800, 'desktop'), (768, 1024, 'tablet'), (390, 844, 'mobile')]
    
    for w, h, name in sizes:
        page = browser.new_page(viewport={'width': w, 'height': h})
        page.goto('https://client-inky-iota.vercel.app', wait_until='networkidle')
        time.sleep(3)
        
        body = page.evaluate("""() => {
            const b = document.body;
            const s = getComputedStyle(b);
            return {
                bg: s.backgroundColor,
                scrollW: b.scrollWidth,
                scrollH: b.scrollHeight,
                clientW: document.documentElement.clientWidth,
            };
        }""")
        print(f'{name}: scroll={body["scrollW"]}x{body["scrollH"]}, clientW={body["clientW"]}')
        
        # Check horizontal scroll
        if body['scrollW'] > body['clientW'] + 2:
            print(f'  !! HORIZONTAL SCROLL! Diff: {body["scrollW"] - body["clientW"]}px')
        
        # Find overflowing elements
        overflow = page.evaluate("""() => {
            const items = [];
            document.querySelectorAll('*').forEach(el => {
                const r = el.getBoundingClientRect();
                if (r.right > window.innerWidth + 5 && el.children.length > 0) {
                    let cls = el.className || '';
                    if (typeof cls !== 'string') cls = '';
                    items.push(el.tagName + (cls ? '.' + cls.slice(0,20) : ''));
                }
            });
            return items.slice(0, 8);
        }""")
        if overflow:
            print(f'  Overflowing: {overflow}')
        
        page.screenshot(path=f'C:/Users/TAUSHEF/Documents/demon/_screenshots/layout-{name}.png')
        page.close()
    
    browser.close()
    print('Done!')
