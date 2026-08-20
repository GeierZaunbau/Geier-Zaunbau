document.addEventListener('DOMContentLoaded', function () {
	var toggle = document.querySelector('.ggg-nav-toggle');
	var nav = document.querySelector('.ggg-nav');
	var header = document.querySelector('.ggg-header');

	if (toggle && nav) {
		toggle.addEventListener('click', function () {
			var isOpen = header.classList.toggle('is-open');
			toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
		});

		nav.querySelectorAll('a').forEach(function (link) {
			link.addEventListener('click', function () {
				header.classList.remove('is-open');
				toggle.setAttribute('aria-expanded', 'false');
			});
		});
	}

	// Sticky header shrink on scroll (mit Puffer gegen Flackern an der Schwelle)
	var isScrolled = false;
	var ticking = false;
	function updateHeaderState() {
		var y = window.scrollY;
		if (!isScrolled && y > 80) {
			isScrolled = true;
			header.classList.add('is-scrolled');
		} else if (isScrolled && y < 40) {
			isScrolled = false;
			header.classList.remove('is-scrolled');
		}
		ticking = false;
	}
	window.addEventListener('scroll', function () {
		if (!ticking) {
			window.requestAnimationFrame(updateHeaderState);
			ticking = true;
		}
	}, { passive: true });

	// Scroll-reveal animations
	var revealEls = document.querySelectorAll('.ggg-reveal');
	if (revealEls.length && 'IntersectionObserver' in window) {
		var observer = new IntersectionObserver(function (entries) {
			entries.forEach(function (entry) {
				if (entry.isIntersecting) {
					entry.target.classList.add('is-visible');
					observer.unobserve(entry.target);
				}
			});
		}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

		revealEls.forEach(function (el) { observer.observe(el); });
	} else {
		revealEls.forEach(function (el) { el.classList.add('is-visible'); });
	}

	// Lightbox: Projektbilder per Klick vergrößern
	var lightbox = document.getElementById('ggg-lightbox');
	var lightboxImg = document.getElementById('ggg-lightbox-img');
	var lightboxClose = document.getElementById('ggg-lightbox-close');

	function openLightbox(src, alt) {
		lightboxImg.src = src;
		lightboxImg.alt = alt || '';
		lightbox.hidden = false;
	}
	function closeLightbox() {
		lightbox.hidden = true;
		lightboxImg.src = '';
	}

	document.querySelectorAll('.ggg-project__img, .ggg-project__split img').forEach(function (img) {
		img.addEventListener('click', function () {
			openLightbox(img.src, img.alt);
		});
	});
	lightbox.addEventListener('click', closeLightbox);
	lightboxClose.addEventListener('click', function (e) {
		e.stopPropagation();
		closeLightbox();
	});
	document.addEventListener('keydown', function (e) {
		if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
	});
});
