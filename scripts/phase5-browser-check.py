from playwright.sync_api import sync_playwright
import os


with sync_playwright() as playwright:
    browser = getattr(playwright, os.environ.get("MANDATO_BROWSER", "chromium")).launch(headless=True)
    context = browser.new_context()
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.on("console", lambda message: errors.append(f"console:{message.type}:{message.text}") if message.type == "error" else None)
    page.on("requestfailed", lambda request: errors.append(f"requestfailed:{request.url}:{request.failure}"))
    page.goto("http://127.0.0.1:4173", wait_until="networkidle")
    page.get_by_role("button", name="08 Ayuda").click()
    page.get_by_role("heading", name="Primeros diez minutos").wait_for()
    contrast_failures = page.evaluate("""() => {
      const channel = (color) => color.match(/[\\d.]+/g)?.map(Number) ?? [0, 0, 0, 1];
      const luminance = (color) => {
        const [r, g, b] = channel(color).slice(0, 3).map((value) => { const c=value/255; return c<=.04045 ? c/12.92 : ((c+.055)/1.055)**2.4; });
        return .2126*r+.7152*g+.0722*b;
      };
      const failures=[];
      for (const node of document.querySelectorAll('.help-view *')) {
        if (!node.innerText?.trim()) continue;
        const style=getComputedStyle(node);
        if (Number(style.fontSize.replace('px','')) < 12 || style.opacity === '0') continue;
        let parent=node, background=getComputedStyle(document.documentElement).backgroundColor;
        while (parent && parent !== document.documentElement) {
          const candidate=getComputedStyle(parent).backgroundColor;
          if (channel(candidate)[3] !== 0 && !candidate.startsWith('rgba(0, 0, 0, 0)')) { background=candidate; break; }
          parent=parent.parentElement;
        }
        const [fgR,fgG,fgB]=channel(style.color), [bgR,bgG,bgB]=channel(background);
        const fg=`rgb(${fgR},${fgG},${fgB})`, bg=`rgb(${bgR},${bgG},${bgB})`;
        const values=[luminance(fg),luminance(bg)].sort((a,b)=>b-a), ratio=(values[0]+.05)/(values[1]+.05);
        if (ratio<4.5) failures.push({text:node.innerText.trim().slice(0,50),foreground:style.color,background,ratio:Number(ratio.toFixed(2))});
      }
      return failures;
    }""")
    assert not contrast_failures, contrast_failures
    first_step = page.get_by_role("checkbox").first
    first_step.check()
    page.get_by_role("searchbox").fill("censura")
    assert page.get_by_text("Una votación para quitarle el poder", exact=False).is_visible()
    page.get_by_role("button", name="Grande", exact=True).click()
    assert page.evaluate("getComputedStyle(document.documentElement).fontSize") == "18px"
    page.wait_for_function("navigator.serviceWorker.controller !== null", timeout=10000)
    await_controller = page.evaluate("navigator.serviceWorker.controller.scriptURL")
    assert await_controller.endswith("/sw.js"), await_controller
    context.set_offline(True)
    offline_response = page.reload(wait_until="networkidle")
    assert offline_response and offline_response.ok
    assert page.get_by_text("Una carrera. Un país real.").is_visible()
    page.get_by_role("button", name="08 Ayuda").click(timeout=3000)
    page.get_by_role("heading", name="Primeros diez minutos").wait_for()
    assert page.get_by_role("checkbox").first.is_checked()
    page.get_by_role("link", name="Privacidad").click()
    page.get_by_role("heading", name="Aviso de privacidad").wait_for()
    page.goto("http://127.0.0.1:4173", wait_until="networkidle")
    assert page.get_by_text("Una carrera. Un país real.").is_visible()
    page.get_by_role("link", name="Créditos y fuentes").click()
    page.get_by_role("heading", name="Créditos y fuentes", exact=True).wait_for()
    assert page.get_by_role("heading", name="Venezuela", exact=True).is_visible()
    license_url = page.get_by_role("link", name="Avisos y licencias", exact=False).get_attribute("href")
    assert page.evaluate("async (url) => (await (await fetch(url)).text()).includes('MIT')", license_url)
    assert not errors, errors
    print("OK: Ayuda, glosario, tamaño de texto, progreso local, aviso de privacidad y navegación sin red.")
    print("Service worker activo:", await_controller)
    browser.close()
