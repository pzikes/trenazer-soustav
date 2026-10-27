# Trenažér číselných soustav

Jednoduchá vzdělávací webová aplikace pro procvičování převodů mezi desítkovou a dvojkovou soustavou. Je určena zejména žákům základních škol a je vytvořena pomocí HTML, CSS a JavaScriptu bez frameworku a dalších závislostí.

## Spuštění

Aplikace používá JavaScriptové moduly, proto ji spusť přes místní webový server, ne otevřením souboru `index.html` přímo z disku.

Například v kořenové složce projektu spusť:

```powershell
python -m http.server 8000
```

Poté otevři v prohlížeči adresu [http://localhost:8000](http://localhost:8000). Server ukončíš klávesami `Ctrl+C`.

Alternativně můžeš ve Visual Studio Code použít rozšíření Live Server a otevřít přes něj soubor `index.html`.

## Jak aplikace funguje

1. Vyber obtížnost a směr převodu.
2. Spusť sadu tlačítkem **Vygenerovat 10 úloh**. Aplikace náhodně vybere deset různých čísel z rozsahu zvolené obtížnosti.
3. U každé úlohy zadej odpověď v cílové soustavě a zvol **Zkontrolovat**.
4. Aplikace ověří povolené znaky, zobrazí výsledek, správnou odpověď a postup řešení. Správnou hodnotu uzná i tehdy, když je zapsaná s úvodními nulami.
5. Po vyhodnocení přejdi na další otázku. Odpověď jedné otázky se vyhodnocuje pouze jednou.
6. V průběhu testu se zobrazuje skóre. Po poslední otázce aplikace zobrazí celkový počet správných odpovědí, procentuální úspěšnost a seznam chybných odpovědí.

Během probíhající sady nelze spustit novou ani změnit její nastavení. Po dokončení můžeš vytvořit další sadu.

### Obtížnosti a směry převodu

- **Lehká:** čísla od 0 do 15
- **Střední:** čísla od 0 do 255
- **Těžká:** čísla od 0 do 1023
- **DEC → BIN:** převod z desítkové do dvojkové soustavy
- **BIN → DEC:** převod z dvojkové do desítkové soustavy

### Ovládání klávesnicí

- V poli odpovědi stiskni `Enter` pro kontrolu.
- Po vyhodnocení stiskni `Enter` na tlačítku **Další úloha** pro pokračování.

## Soubory

- `index.html` — struktura stránky a ovládací prvky.
- `styles.css` — vzhled aplikace a přizpůsobení menším obrazovkám.
- `app.js` — práce s rozhraním, průchod testem, skóre a výsledky.
- `questions.js` — generování úloh, formát zadání, kontrola odpovědí a vysvětlení převodů.
