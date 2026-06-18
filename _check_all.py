"""Check all screens layout"""
from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)  # Show browser so user can see
    page = browser.new_page(viewport={'width': 1280, 'height': 800})
    
    print("1. Auth screen loaded.")
    print("   Look at the browser window.")
    print("   I'll click Sign In to go to Home...")
    
    page.goto('https://client-inky-iota.vercel.app', wait_until='networkidle')
    time.sleep(2)
    
    # Click the "Create Account" text/link to switch to sign up mode, then check
    # Actually let's just go to the home screen directly by clicking sign in
    # The auth form has fake data / real API. Let's try submitting
    page.fill('input[type="email"]', 'test@test.com')
    page.fill('input[type="password"]', 'test123456')
    
    # Click Sign In button
    page.locator('button:has-text("Sign In")').click()
    time.sleep(5)  # Wait for API timeout
    
    page.screenshot(path='C:/Users/TAUSHEF/Documents/demon/_screenshots/home-screen.png')
    print("2. Tried login, screenshot saved as home-screen.png")
    print("Check the screenshots folder for all images!")
    
    browser.close()
