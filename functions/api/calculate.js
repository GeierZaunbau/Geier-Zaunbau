// Cloudflare Pages Function
// Läuft ausschließlich serverseitig bei Cloudflare. Der Quellcode dieser Datei
// wird niemals an den Browser ausgeliefert - nur das Ergebnis (JSON) geht raus.
// Rechenlogik, Preise und Faktoren bleiben damit für Website-Besucher unsichtbar.

const MONTAGE_RATES = {
	maschendraht: { min: 20, max: 30 },
	dsm: { min: 30, max: 60 },
	wpc: { min: 50, max: 90 },
};

// Materialrechnung Punktfundament (Beton):
// Loch 30x30x80cm, davon 10cm Kies-Drainage + 70cm Setz-Fix, inkl. 8% Verschnitt
// Kies: 9L netto -> 1 Sack (25kg, ca. 16L) x 3,69€ = 3,69€
// Setz-Fix: 63L netto -> 6 Säcke (25kg, 13L Ergiebigkeit) x 8,99€ = 53,94€
const FUNDAMENT_BETON_PRO_PFOSTEN = 57.63;

const FUNDAMENT_RATES = {
	duebeln: { min: 10, max: 20 },
	einrammen: { min: 15, max: 25 },
};

const TOR_PREISE = {
	gartentor_ein: 150,
	gartentor_zwei: 200,
	fluegeltor_ein: 180,
	fluegeltor_zwei: 200,
};

const GELAENDE_FAKTOR = {
	normal: 1.0,
	hang: 1.15,
	schwer: 1.2,
};

const DEMONTAGE_RATE = { min: 8, max: 15 };
const ENTSORGUNG_RATE = { min: 5, max: 10 };

const ANFAHRT_PAUSCHALE = 25;
const ANFAHRT_PRO_KM = 0.8;

const MATTENBREITE_STANDARD = 2.5; // Meter, Standard-Pfostenabstand für DSM und Maschendraht
const MATTENBREITE_ERLAUBT_WPC = [1.8, 2.5]; // Meter, wählbare Pfostenabstände für WPC
const HOEHE_FUNDAMENT_SCHWELLE = 150; // cm
const HOEHE_FUNDAMENT_AUFSCHLAG = 1.2;

// Betonzaun: Material + Montage + Fundament sind hier bereits im Meterpreis enthalten
const BETONZAUN_RATES = {
	einseitig: { bis2m: 80, m240: 110 },
	beidseitig: { bis2m: 100, m240: 115 },
};
const BETONZAUN_STREICHSERVICE_PRO_METER = 26;
const BETONZAUN_PUFFER = 0.08; // 8% Spanne nach oben/unten, da Meterpreis sonst exakt fix wäre

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

function round50(value) {
	return Math.round(value / 50) * 50;
}

export async function onRequestPost(context) {
	try {
		const contentType = context.request.headers.get('content-type') || '';
		if (!contentType.toLowerCase().includes('application/json')) {
			return json({ error: 'Ungültiger Inhaltstyp' }, 415);
		}
		const contentLength = Number(context.request.headers.get('content-length') || 0);
		if (contentLength > 12000) return json({ error: 'Anfrage zu groß' }, 413);
		const body = await context.request.json();
		if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Ungültige Anfrage' }, 400);
		const allowedKeys = new Set(['zauntyp','laenge','hoehe','hoeheBeton','ausfuehrung','streichservice','pfostenabstand','fundamentArt','tore','gelaende','demontage','entsorgung','entfernungKm']);
		for (const key of Object.keys(body)) {
			if (!allowedKeys.has(key)) return json({ error: 'Ungültiger Parameter' }, 400);
		}

		const zauntyp = body.zauntyp;
		const laenge = clamp(Number(body.laenge) || 0, 1, 500);
		const gelaende = body.gelaende || 'normal';
		const demontage = !!body.demontage;
		const entsorgung = demontage && !!body.entsorgung;
		const entfernungKm = clamp(Number(body.entfernungKm) || 0, 0, 200);

		const toreListe = Array.isArray(body.tore) ? [...new Set(body.tore)].slice(0, 4) : [];
		const allowedTore = new Set(Object.keys(TOR_PREISE));
		if (toreListe.some(key => typeof key !== 'string' || !allowedTore.has(key))) return json({ error: 'Ungültige Torauswahl' }, 400);
		const torPreis = toreListe.reduce(function (summe, key) {
			return summe + (TOR_PREISE[key] || 0);
		}, 0);

		const anfahrt = ANFAHRT_PAUSCHALE + entfernungKm * ANFAHRT_PRO_KM;
		if (!Object.prototype.hasOwnProperty.call(GELAENDE_FAKTOR, gelaende)) return json({ error: 'Ungültige Geländewahl' }, 400);
		const gFaktor = GELAENDE_FAKTOR[gelaende];

		let demontageMin = 0;
		let demontageMax = 0;
		if (demontage) {
			demontageMin = laenge * DEMONTAGE_RATE.min;
			demontageMax = laenge * DEMONTAGE_RATE.max;
		}
		let entsorgungMin = 0;
		let entsorgungMax = 0;
		if (entsorgung) {
			entsorgungMin = laenge * ENTSORGUNG_RATE.min;
			entsorgungMax = laenge * ENTSORGUNG_RATE.max;
		}

		// --- Betonzaun: eigener Rechenweg, da Meterpreis bereits alles enthält ---
		if (zauntyp === 'beton') {
			const ausfuehrung = body.ausfuehrung === 'beidseitig' ? 'beidseitig' : body.ausfuehrung === 'einseitig' ? 'einseitig' : null;
			if (!ausfuehrung) return json({ error: 'Ungültige Ausführung' }, 400);
			const hoeheKey = Number(body.hoehe) >= 240 ? 'm240' : 'bis2m';
			const meterpreis = BETONZAUN_RATES[ausfuehrung][hoeheKey];

			let subtotal = laenge * meterpreis;
			if (body.streichservice) {
				subtotal += laenge * BETONZAUN_STREICHSERVICE_PRO_METER;
			}
			subtotal = subtotal * gFaktor;
			subtotal += demontageMin + entsorgungMin;

			const gesamt = subtotal + torPreis + anfahrt;
			let totalMin = round50(gesamt * (1 - BETONZAUN_PUFFER));
			let totalMax = round50(gesamt * (1 + BETONZAUN_PUFFER));
			if (totalMax <= totalMin) totalMax = totalMin + 100;

			return json({ preisVon: totalMin, preisBis: totalMax, pfostenAnzahl: null });
		}

		// --- Alle anderen Zauntypen: Montage + separates Fundament ---
		if (!MONTAGE_RATES[zauntyp]) {
			return json({ error: 'Unbekannter Zauntyp' }, 400);
		}

		const hoehe = clamp(Number(body.hoehe) || 120, 60, 250);
		const fundamentArt = body.fundamentArt || 'beton';
		if (!['beton', 'duebeln', 'einrammen'].includes(fundamentArt)) return json({ error: 'Ungültige Befestigung' }, 400);

		const montageRate = MONTAGE_RATES[zauntyp];
		let montageMin = laenge * montageRate.min;
		let montageMax = laenge * montageRate.max;

		let pfostenabstand = MATTENBREITE_STANDARD;
		if (zauntyp === 'wpc') {
			const angefragterAbstand = Number(body.pfostenabstand);
			pfostenabstand = MATTENBREITE_ERLAUBT_WPC.includes(angefragterAbstand) ? angefragterAbstand : 1.8;
		}
		const pfostenAnzahl = Math.ceil(laenge / pfostenabstand) + 1;

		let fundMin, fundMax;
		if (fundamentArt === 'beton') {
			fundMin = fundMax = pfostenAnzahl * FUNDAMENT_BETON_PRO_PFOSTEN;
		} else {
			const fundRate = FUNDAMENT_RATES[fundamentArt] || FUNDAMENT_RATES.duebeln;
			fundMin = pfostenAnzahl * fundRate.min;
			fundMax = pfostenAnzahl * fundRate.max;
		}

		if (hoehe > HOEHE_FUNDAMENT_SCHWELLE) {
			fundMin *= HOEHE_FUNDAMENT_AUFSCHLAG;
			fundMax *= HOEHE_FUNDAMENT_AUFSCHLAG;
		}

		let subtotalMin = (montageMin + fundMin + demontageMin + entsorgungMin) * gFaktor;
		let subtotalMax = (montageMax + fundMax + demontageMax + entsorgungMax) * gFaktor;

		let totalMin = subtotalMin + torPreis + anfahrt;
		let totalMax = subtotalMax + torPreis + anfahrt;

		totalMin = round50(totalMin);
		totalMax = round50(totalMax);

		if (totalMax <= totalMin) {
			totalMax = totalMin + 100;
		}

		return json({ preisVon: totalMin, preisBis: totalMax, pfostenAnzahl });
	} catch (err) {
		return json({ error: 'Berechnung fehlgeschlagen' }, 500);
	}
}

function json(data, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
	});
}
