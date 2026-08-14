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
});
