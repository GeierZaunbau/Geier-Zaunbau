// Cloudflare Pages Function
// Läuft ausschließlich serverseitig bei Cloudflare. Der Quellcode dieser Datei
// wird niemals an den Browser ausgeliefert - nur das Ergebnis (JSON) geht raus.
// Rechenlogik, Preise und Faktoren bleiben damit für Website-Besucher unsichtbar.

const MONTAGE_RATES = {
	maschendraht: { min: 20, max: 30 },
	dsm: { min: 30, max: 60 },
	wpc: { min: 50, max: 90 },
};

const FUNDAMENT_RATES = {
	beton: { min: 20, max: 40 },
	duebeln: { min: 10, max: 20 },
	einrammen: { min: 15, max: 25 },
};

const TOR_PREISE = {
	keins: 0,
	einfluegelig: 150,
	zweifluegelig: 200,
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

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

function round50(value) {
	return Math.round(value / 50) * 50;
}

export async function onRequestPost(context) {
	try {
		const body = await context.request.json();

		const zauntyp = body.zauntyp;
		const laenge = clamp(Number(body.laenge) || 0, 1, 500);
		const hoehe = clamp(Number(body.hoehe) || 120, 60, 250);
		const fundamentArt = body.fundamentArt || 'beton';
		const torTyp = body.torTyp || 'keins';
		const gelaende = body.gelaende || 'normal';
		const demontage = !!body.demontage;
		const entsorgung = demontage && !!body.entsorgung;
		const entfernungKm = clamp(Number(body.entfernungKm) || 0, 0, 200);

		if (!MONTAGE_RATES[zauntyp]) {
			return new Response(JSON.stringify({ error: 'Unbekannter Zauntyp' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const montageRate = MONTAGE_RATES[zauntyp];
		let montageMin = laenge * montageRate.min;
		let montageMax = laenge * montageRate.max;

		let pfostenabstand = MATTENBREITE_STANDARD;
		if (zauntyp === 'wpc') {
			const angefragterAbstand = Number(body.pfostenabstand);
			pfostenabstand = MATTENBREITE_ERLAUBT_WPC.includes(angefragterAbstand) ? angefragterAbstand : 1.8;
		}
		const pfostenAnzahl = Math.ceil(laenge / pfostenabstand) + 1;
		const fundRate = FUNDAMENT_RATES[fundamentArt] || FUNDAMENT_RATES.beton;
		let fundMin = pfostenAnzahl * fundRate.min;
		let fundMax = pfostenAnzahl * fundRate.max;

		if (hoehe > HOEHE_FUNDAMENT_SCHWELLE) {
			fundMin *= HOEHE_FUNDAMENT_AUFSCHLAG;
			fundMax *= HOEHE_FUNDAMENT_AUFSCHLAG;
		}

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

		const gFaktor = GELAENDE_FAKTOR[gelaende] || 1.0;

		let subtotalMin = (montageMin + fundMin + demontageMin + entsorgungMin) * gFaktor;
		let subtotalMax = (montageMax + fundMax + demontageMax + entsorgungMax) * gFaktor;

		const torPreis = TOR_PREISE[torTyp] || 0;
		const anfahrt = ANFAHRT_PAUSCHALE + entfernungKm * ANFAHRT_PRO_KM;

		let totalMin = subtotalMin + torPreis + anfahrt;
		let totalMax = subtotalMax + torPreis + anfahrt;

		totalMin = round50(totalMin);
		totalMax = round50(totalMax);

		if (totalMax <= totalMin) {
			totalMax = totalMin + 100;
		}

		return new Response(
			JSON.stringify({
				preisVon: totalMin,
				preisBis: totalMax,
				pfostenAnzahl,
			}),
			{ headers: { 'Content-Type': 'application/json' } }
		);
	} catch (err) {
		return new Response(JSON.stringify({ error: 'Berechnung fehlgeschlagen' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}
