document.addEventListener('DOMContentLoaded', function () {
	var calcSection = document.getElementById('rechner');
	if (!calcSection) return;

	var state = {
		zauntyp: 'dsm',
		laenge: 20,
		hoehe: 120,
		pfostenabstand: 2.5,
		fundamentArt: 'beton',
		torTyp: 'keins',
		gelaende: 'normal',
		demontage: false,
		entsorgung: false,
		entfernungKm: 10,
	};

	var laengeInput = document.getElementById('calc-laenge');
	var laengeValue = document.getElementById('calc-laenge-value');
	var hoeheSelect = document.getElementById('calc-hoehe');
	var abstandRow = document.getElementById('calc-abstand-row');
	var abstandSelect = document.getElementById('calc-abstand');
	var torSelect = document.getElementById('calc-tor');
	var gelaendeSelect = document.getElementById('calc-gelaende');
	var demontageBox = document.getElementById('calc-demontage');
	var entsorgungRow = document.getElementById('calc-entsorgung-row');
	var entsorgungBox = document.getElementById('calc-entsorgung');
	var entfernungInput = document.getElementById('calc-entfernung');
	var terminSelect = document.getElementById('calc-termin');
	var notizField = document.getElementById('calc-notiz');
	var priceEl = document.getElementById('calc-price');
	var svg = document.getElementById('calc-svg');

	function setupTiles(groupId, stateKey) {
		var group = document.getElementById(groupId);
		if (!group) return;
		group.querySelectorAll('.ggg-calc__tile').forEach(function (tile) {
			tile.addEventListener('click', function () {
				group.querySelectorAll('.ggg-calc__tile').forEach(function (t) {
					t.classList.remove('is-active');
					t.setAttribute('aria-checked', 'false');
				});
				tile.classList.add('is-active');
				tile.setAttribute('aria-checked', 'true');
				state[stateKey] = tile.getAttribute('data-value');
				if (stateKey === 'zauntyp') {
					if (state.zauntyp === 'wpc') {
						abstandRow.hidden = false;
						state.pfostenabstand = Number(abstandSelect.value);
					} else {
						abstandRow.hidden = true;
						state.pfostenabstand = 2.5;
					}
				}
				triggerUpdate();
			});
		});
	}
	setupTiles('calc-zauntyp', 'zauntyp');
	setupTiles('calc-fundament', 'fundamentArt');

	abstandSelect.addEventListener('change', function () {
		state.pfostenabstand = Number(abstandSelect.value);
		triggerUpdate();
	});

	laengeInput.addEventListener('input', function () {
		state.laenge = Number(laengeInput.value);
		laengeValue.textContent = state.laenge;
		triggerUpdate();
	});
	hoeheSelect.addEventListener('change', function () {
		state.hoehe = Number(hoeheSelect.value);
		triggerUpdate();
	});
	torSelect.addEventListener('change', function () {
		state.torTyp = torSelect.value;
		triggerUpdate();
	});
	gelaendeSelect.addEventListener('change', function () {
		state.gelaende = gelaendeSelect.value;
		triggerUpdate();
	});
	demontageBox.addEventListener('change', function () {
		state.demontage = demontageBox.checked;
		entsorgungRow.hidden = !state.demontage;
		if (!state.demontage) {
			entsorgungBox.checked = false;
			state.entsorgung = false;
		}
		triggerUpdate();
	});
	entsorgungBox.addEventListener('change', function () {
		state.entsorgung = entsorgungBox.checked;
		triggerUpdate();
	});
	entfernungInput.addEventListener('input', function () {
		state.entfernungKm = Number(entfernungInput.value) || 0;
		triggerUpdate();
	});

	function drawSketch() {
		var hoeheScale = Math.max(0.4, Math.min(1, state.hoehe / 200));
		var fenceTop = 120 - 90 * hoeheScale;
		var postCount = state.laenge > 40 ? 7 : state.laenge > 15 ? 5 : 3;
		var spacing = 300 / (postCount - 1);
		var parts = ['<line x1="10" y1="120" x2="310" y2="120" stroke="var(--ggg-stone)" stroke-width="2"/>'];
		parts.push('<line x1="10" y1="' + fenceTop + '" x2="310" y2="' + fenceTop + '" stroke="var(--ggg-rust-light)" stroke-width="2"/>');
		for (var i = 0; i < postCount; i++) {
			var x = 10 + i * spacing;
			parts.push('<rect x="' + (x - 3) + '" y="' + fenceTop + '" width="6" height="' + (120 - fenceTop) + '" fill="var(--ggg-rust)"/>');
		}
		if (state.torTyp !== 'keins') {
			var gateX = 150;
			parts.push('<rect x="' + (gateX - 20) + '" y="' + fenceTop + '" width="40" height="' + (120 - fenceTop) + '" fill="var(--ggg-bg-darker)" stroke="var(--ggg-cream-dim)" stroke-width="1" stroke-dasharray="3 3"/>');
		}
		svg.innerHTML = parts.join('');
	}

	var debounceTimer = null;
	function triggerUpdate() {
		drawSketch();
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(fetchPrice, 250);
	}

	var lastResult = null;

	function fetchPrice() {
		priceEl.textContent = 'Preis wird berechnet …';
		priceEl.style.opacity = '0.6';
		fetch('/api/calculate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(state),
		})
			.then(function (res) { return res.json(); })
			.then(function (data) {
				if (data.error) throw new Error(data.error);
				lastResult = data;
				priceEl.textContent = data.preisVon.toLocaleString('de-DE') + ' € bis ' + data.preisBis.toLocaleString('de-DE') + ' €';
				priceEl.style.opacity = '1';
			})
			.catch(function () {
				priceEl.textContent = 'Kurz nicht erreichbar, bitte gleich nochmal versuchen';
				priceEl.style.opacity = '1';
			});
	}

	var zauntypLabels = { dsm: 'Doppelstabmattenzaun', maschendraht: 'Maschendrahtzaun', wpc: 'WPC-Sichtschutzzaun' };
	var fundamentLabels = { beton: 'Punktfundament (Beton)', duebeln: 'Dübeln auf vorhandenem Fundament', einrammen: 'Einrammen (Bodenhülse)' };
	var torLabels = { keins: 'kein Tor', einfluegelig: 'einflügeliges Tor', zweifluegelig: 'zweiflügeliges Tor' };
	var gelaendeLabels = { normal: 'normales, ebenes Gelände', hang: 'Hanglage', schwer: 'schwer zugängliches Gelände' };

	var anfragenBtn = document.getElementById('calc-anfragen');
	anfragenBtn.addEventListener('click', function () {
		var lines = [];
		lines.push('Anfrage über den Sofort-Preis-Check:');
		lines.push('');
		lines.push('Zauntyp: ' + zauntypLabels[state.zauntyp]);
		lines.push('Länge: ' + state.laenge + ' m');
		lines.push('Höhe: ' + state.hoehe + ' cm');
		if (state.zauntyp === 'wpc') {
			lines.push('Pfostenabstand: ' + state.pfostenabstand.toString().replace('.', ',') + ' m');
		}
		lines.push('Befestigung: ' + fundamentLabels[state.fundamentArt]);
		lines.push('Tor: ' + torLabels[state.torTyp]);
		lines.push('Gelände: ' + gelaendeLabels[state.gelaende]);
		lines.push('Demontage Altzaun: ' + (state.demontage ? 'ja' : 'nein'));
		if (state.demontage) {
			lines.push('Entsorgung Altmaterial: ' + (state.entsorgung ? 'ja' : 'nein'));
		}
		lines.push('Entfernung von Birkenfeld: ca. ' + state.entfernungKm + ' km');
		if (terminSelect.value) lines.push('Wunschtermin: ' + terminSelect.value);
		if (lastResult) lines.push('Geschätzte Preisspanne: ' + lastResult.preisVon + ' € bis ' + lastResult.preisBis + ' €');
		if (notizField.value.trim()) {
			lines.push('');
			lines.push('Anmerkungen: ' + notizField.value.trim());
		}

		var nachrichtField = document.querySelector('#kontakt textarea[name="Nachricht"]');
		var leistungSelect = document.querySelector('#kontakt select[name="Leistung"]');
		if (nachrichtField) nachrichtField.value = lines.join('\n');
		if (leistungSelect) leistungSelect.value = 'Zaunbau/Gartenservice';

		var kontaktSection = document.getElementById('kontakt');
		if (kontaktSection) kontaktSection.scrollIntoView({ behavior: 'smooth' });
	});

	drawSketch();
	fetchPrice();
});
