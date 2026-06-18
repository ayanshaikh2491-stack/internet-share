"""Full Playwright audit with console errors"""
from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    
    for w, h, name in [(1280, 800, 'desktop'), (390, 844, 'mobile')]:
        page = browser.new_page(viewport={'width': w, 'height': h})
        
        # Catch console errors
        console_errors = []
        page.on("console", lambda msg: console_errors.append(f"{msg.type}: {msg.text}") if msg.type == "error" else None)
        
        page.goto('https://client-inky-iota.vercel.app', wait_until='networkidle')
        time.sleep(3)
        
        # Take screenshot
        page.screenshot(path=f'C:/Users/TAUSHEF/Documents/demon/_screenshots/audit-{name}.png')
        
        # Report
        print(f'\n=== {name.upper()} ===')
        
        if console_errors:
            print(f'Console errors ({len(console_errors)}):')
            for e in console_errors[:10]:
                print(f'  🔴 {e}')
        else:
            print('No console errors ✅')
        
        # Check page load status
        status = page.evaluate("""() => {
            return {
                readyState: document.readyState,
                title: document.title,
                bodyChildren: document.body.children.length,
                doctype: document.doctype ? document.doctype.name : 'none'
            }
        }""")
        print(f'Status: {status}')
        
        # Check if React rendered properly
        root = page.evaluate("""() => {
            const root = document.getElementById('root');
            if (!root) return 'no root';
            return { children: root.children.length, html: root.innerHTML.slice(0, 100) };
        }""")
        print(f'Root: {root}')
        
        page.close()
    
    browser.close()
    print('\n=== AUDIT COMPLETE ===')
