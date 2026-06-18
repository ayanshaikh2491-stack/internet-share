"""Deep layout analysis - find spacing & cutoff issues"""
from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    
    # Check multiple screen sizes
    for w, h, name in [(1280, 800, 'desktop'), (390, 844, 'mobile')]:
        page = browser.new_page(viewport={'width': w, 'height': h})
        page.goto('https://client-inky-iota.vercel.app', wait_until='networkidle')
        time.sleep(3)
        
        issues = []
        
        # Check 1: Elements cut off (partially outside viewport)
        cutoff = page.evaluate("""() => {
            const issues = [];
            document.querySelectorAll('*').forEach(el => {
                const r = el.getBoundingClientRect();
                if (r.width <= 0 || r.height <= 0) return;
                
                // Check if element is partially outside viewport
                const outsideRight = r.right > window.innerWidth + 1;
                const outsideBottom = r.bottom > window.innerHeight + 1;
                const outsideLeft = r.left < -1;
                const outsideTop = r.top < -1 && el !== document.body && el !== document.documentElement;
                
                if (outsideRight || outsideBottom || outsideLeft || outsideTop) {
                    let text = (el.textContent || '').trim().slice(0, 30);
                    let cls = (el.className || '').toString().slice(0, 25);
                    issues.push({
                        tag: el.tagName,
                        class: cls,
                        text: text,
                        rect: { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom), w: Math.round(r.width) },
                        viewW: window.innerWidth,
                        outside: {
                            right: outsideRight ? Math.round(r.right - window.innerWidth) + 'px' : false,
                            bottom: outsideBottom ? Math.round(r.bottom - window.innerHeight) + 'px' : false,
                            left: outsideLeft ? Math.round(r.left) + 'px' : false,
                        }
                    });
                }
            });
            return issues.slice(0, 15);
        }""")
        
        if cutoff:
            print(f'\n{name.upper()} - CUTOFF ELEMENTS:')
            for c in cutoff:
                dirs = [k for k, v in c['outside'].items() if v]
                print(f'  {c["tag"]} .{c["class"]} - {", ".join(dirs)} = {c["text"]}')
                print(f'    rect: {c["rect"]}')
        else:
            print(f'\n{name.upper()} - No cutoff elements ✅')
        
        # Check 2: Spacing issues - overlapping elements
        overlap = page.evaluate("""() => {
            const issues = [];
            const els = document.querySelectorAll('button, input, a, h1, h2, h3, p, div[class*="card"], div[class*="Card"]');
            const rects = [];
            els.forEach(el => {
                const r = el.getBoundingClientRect();
                if (r.width > 10 && r.height > 10) {
                    rects.push({ el: el.tagName + (el.className ? '.' + el.className.toString().slice(0,20) : ''), text: (el.textContent || '').trim().slice(0,25), r: {l:r.left, t:r.top, r:r.right, b:r.bottom} });
                }
            });
            return rects.slice(0, 40);
        }""")
        
        # Check for large gaps
        print(f'  Total visible elements: {len(overlap)}')
        
        page.screenshot(path=f'C:/Users/TAUSHEF/Documents/demon/_screenshots/debug-{name}.png')
        page.close()
    
    browser.close()
    print('\nAnalysis complete!')
