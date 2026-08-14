document.addEventListener('DOMContentLoaded', function () {
	var calcSection = document.getElementById('rechner');
	if (!calcSection) return;

	var state = {
		zauntyp: 'dsm',
		laenge: 20,
		hoehe: 120,
		hoeheBeton: 200,
		ausfuehrung: 'einseitig',
		streichservice: false,
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
	var hoeheRow = document.getElementById('calc-hoehe-row');
	var hoeheSelect = document.getElementById('calc-hoehe');
	var hoeheBetonRow = document.getElementById('calc-hoehe-beton-row');
	var ausfuehrungRow = document.getElementById('calc-ausfuehrung-row');
	var streichserviceRow = document.getElementById('calc-streichservice-row');
	var streichserviceBox = document.getElementById('calc-streichservice');
	var fundamentRow = document.getElementById('calc-fundament-row');
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

	function setupTiles(groupId, stateKey, onChange) {
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
				if (onChange) onChange();
				triggerUpdate();
			});
		});
	}

	function updateZauntypVisibility() {
		if (state.zauntyp === 'beton') {
			hoeheRow.hidden = true;
			hoeheBetonRow.hidden = false;
			ausfuehrungRow.hidden = false;
			streichserviceRow.hidden = false;
			fundamentRow.hidden = true;
			abstandRow.hidden = true;
			state.pfostenabstand = 2.5;
		} else {
			hoeheRow.hidden = false;
			hoeheBetonRow.hidden = true;
			ausfuehrungRow.hidden = true;
			streichserviceRow.hidden = true;
			fundamentRow.hidden = false;
			if (state.zauntyp === 'wpc') {
				abstandRow.hidden = false;
				state.pfostenabstand = Number(abstandSelect.value);
			} else {
				abstandRow.hidden = true;
				state.pfostenabstand = 2.5;
			}
		}
	}

	setupTiles('calc-zauntyp', 'zauntyp', updateZauntypVisibility);
	setupTiles('calc-fundament', 'fundamentArt');
	setupTiles('calc-hoehe-beton', 'hoeheBeton');
	setupTiles('calc-ausfuehrung', 'ausfuehrung');

	abstandSelect.addEventListener('change', function () {
		state.pfostenabstand = Number(abstandSelect.value);
		triggerUpdate();
	});

	streichserviceBox.addEventListener('change', function () {
		state.streichservice = streichserviceBox.checked;
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
		var effektiveHoehe = state.zauntyp === 'beton' ? Number(state.hoeheBeton) : state.hoehe;
		var hoeheScale = Math.max(0.4, Math.min(1, effektiveHoehe / 200));
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
		var payload = Object.assign({}, state);
		if (state.zauntyp === 'beton') {
			payload.hoehe = state.hoeheBeton;
		}
		fetch('/api/calculate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload),
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

	var zauntypLabels = { dsm: 'Doppelstabmattenzaun', maschendraht: 'Maschendrahtzaun', wpc: 'WPC-Sichtschutzzaun', beton: 'Betonzaun' };
	var fundamentLabels = { beton: 'Punktfundament (Beton)', duebeln: 'Dübeln auf vorhandenem Fundament', einrammen: 'Einrammen (Bodenhülse)' };
	var torLabels = {
		keins: 'kein Tor',
		gartentor_ein: 'Gartentor, einflügelig',
		gartentor_zwei: 'Gartentor, zweiflügelig',
		fluegeltor_ein: 'Flügeltor, einflügelig',
		fluegeltor_zwei: 'Flügeltor, zweiflügelig',
	};
	var gelaendeLabels = { normal: 'normales, ebenes Gelände', hang: 'Hanglage', schwer: 'schwer zugängliches Gelände' };
	var ausfuehrungLabels = { einseitig: 'einseitig', beidseitig: 'beidseitig' };

	var anfragenBtn = document.getElementById('calc-anfragen');
	anfragenBtn.addEventListener('click', function () {
		var lines = [];
		lines.push('Anfrage über den Sofort-Preis-Check:');
		lines.push('');
		lines.push('Zauntyp: ' + zauntypLabels[state.zauntyp]);
		lines.push('Länge: ' + state.laenge + ' m');

		if (state.zauntyp === 'beton') {
			lines.push('Höhe: ' + (state.hoeheBeton === '240' || state.hoeheBeton === 240 ? '2,40 m' : 'bis 2,00 m'));
			lines.push('Ausführung: ' + ausfuehrungLabels[state.ausfuehrung]);
			lines.push('Streichservice: ' + (state.streichservice ? 'ja' : 'nein'));
		} else {
			lines.push('Höhe: ' + state.hoehe + ' cm');
			if (state.zauntyp === 'wpc') {
				lines.push('Pfostenabstand: ' + state.pfostenabstand.toString().replace('.', ',') + ' m');
			}
			lines.push('Befestigung: ' + fundamentLabels[state.fundamentArt]);
		}

		lines.push('Tor: ' + torLabels[state.torTyp]);
		lines.push('Gelände: ' + gelaendeLabels[state.gelaende]);
		lines.push('Demontage Altzaun: ' + (state.demontage ? 'ja' : 'nein'));
		if (state.demontage) {
			lines.push('Entsorgung Altmaterial: ' + (state.entsorgung ? 'ja' : 'nein'));
		}
		if (state.entfernungKm) lines.push('Entfernung von Birkenfeld: ca. ' + state.entfernungKm + ' km');
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
