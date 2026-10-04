(function () {
  'use strict';

  var isTouch = window.matchMedia('(pointer: coarse)').matches;
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* ============ swift custom smooth scroll ============ *
   * scroll-behavior: smooth was removed on purpose. This hand-tuned
   * version is quicker and uses the same swift easing as everything else. */
  function easeSwift(t) {
    // cubic-bezier(.16, 1, .3, 1) approximated as an easeOutQuint-ish curve
    return 1 - Math.pow(1 - t, 4);
  }

  function smoothScrollTo(targetY, duration) {
    var startY = window.scrollY;
    var distance = targetY - startY;
    var startTime = null;

    function step(timestamp) {
      if (startTime === null) startTime = timestamp;
      var elapsed = timestamp - startTime;
      var progress = Math.min(elapsed / duration, 1);
      window.scrollTo(0, startY + distance * easeSwift(progress));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function scrollToHash(hash) {
    var target = document.querySelector(hash);
    if (!target) return;
    var targetY = target.getBoundingClientRect().top + window.scrollY - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 84) + 1;
    var duration = prefersReducedMotion ? 0 : 520;
    if (duration === 0) {
      window.scrollTo(0, targetY);
    } else {
      smoothScrollTo(targetY, duration);
    }
  }

  document.querySelectorAll('[data-smooth-scroll]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var hash = link.getAttribute('href');
      if (!hash || hash.charAt(0) !== '#') return;
      e.preventDefault();
      scrollToHash(hash);
      history.pushState(null, '', hash);
    });
  });

  /* ============ click wiggle ============ *
   * A little burst of strokes wherever you click. One throwaway node per
   * click, removed when its animation ends so nothing accumulates. */
  if (!prefersReducedMotion) {
    var WIGGLE_SVG = (function () {
      var strokes = '';
      for (var i = 0; i < 6; i++) {
        // alternating ink and sage, rotated into a radial burst
        var color = i % 2 === 0 ? '#4A342E' : '#A9BB52';
        strokes += '<path d="M20 9q2.5-3 0-6" stroke="' + color + '" transform="rotate(' + (i * 60) + ' 20 20)"/>';
      }
      return '<svg viewBox="0 0 40 40" width="44" height="44" fill="none" stroke-width="2.2" stroke-linecap="round">' + strokes + '</svg>';
    })();

    document.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return; // primary press only, no context menus
      var burst = document.createElement('span');
      burst.className = 'click-wiggle';
      burst.setAttribute('aria-hidden', 'true');
      burst.style.left = e.clientX + 'px';
      burst.style.top = e.clientY + 'px';
      burst.innerHTML = WIGGLE_SVG;
      document.body.appendChild(burst);
      var cleanup = function () { burst.remove(); };
      burst.addEventListener('animationend', cleanup);
      // backgrounded tabs can skip the animation entirely, and then animationend
      // never fires and these would pile up, so always sweep it regardless
      window.setTimeout(cleanup, 1000);
    }, { passive: true });
  }

  /* ============ scroll progress bar ============ */
  var progressBar = document.getElementById('scrollProgressBar');
  function updateScrollProgress() {
    var scrollTop = window.scrollY;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = pct + '%';
  }
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  updateScrollProgress();

  /* ============ scroll reveal ============ */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in-view'); });
  }

  /* ============ journey stops, revealed one at a time ============ *
   * Deliberately a scroll check rather than an IntersectionObserver. A narrow
   * observer band does give a nice one-at-a-time cadence, but an element that
   * skips the band in a single jump (fast scroll, or a nav click straight into
   * the section) never changes intersection state, so the callback never fires
   * and that stop stays invisible for good. Measuring each stop's top against a
   * trigger line every scroll frame has no such gap. Four elements, so it's cheap. */
  var journeyItems = Array.prototype.slice.call(document.querySelectorAll('.journey-item'));
  if (prefersReducedMotion) {
    journeyItems.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var pendingStops = journeyItems.slice();

    function revealJourneyStops() {
      if (!pendingStops.length) return;
      var triggerLine = window.innerHeight * 0.78;
      pendingStops = pendingStops.filter(function (el) {
        if (el.getBoundingClientRect().top < triggerLine) {
          el.classList.add('is-visible');
          return false;
        }
        return true;
      });
    }

    window.addEventListener('scroll', rafThrottle(revealJourneyStops), { passive: true });
    window.addEventListener('resize', rafThrottle(revealJourneyStops));
    revealJourneyStops();
  }

  /* ============ mobile nav ============ */
  var navToggle = document.getElementById('navToggle');
  var mobileNav = document.getElementById('mobileNav');

  function closeMobileNav() {
    navToggle.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
    mobileNav.classList.remove('open');
    document.body.classList.remove('menu-open');
    document.body.style.overflow = '';
  }

  navToggle.addEventListener('click', function () {
    var isOpen = mobileNav.classList.toggle('open');
    navToggle.classList.toggle('active', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('menu-open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  mobileNav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      closeMobileNav();
      var hash = link.getAttribute('href');
      if (hash && hash.charAt(0) === '#') {
        // let the click settle, then scroll (nav is gone by then, so no offset flash)
        setTimeout(function () { scrollToHash(hash); }, 50);
      }
    });
  });

  /* ============ nav shadow on scroll ============ */
  var siteNav = document.getElementById('siteNav');
  window.addEventListener('scroll', function () {
    siteNav.style.boxShadow = window.scrollY > 40 ? '0 1px 0 rgba(74,52,46,0.12)' : 'none';
  }, { passive: true });

  /* ============ frame stamp strips: half-speed parallax ============ *
   * The strips are fixed to the viewport edges, so instead of moving them we
   * drift their tiling background upward at half the scroll rate. Same effect
   * as the reference site, and the repeat means it never runs out no matter how
   * long the page gets. One custom property drives both strips. */
  if (!prefersReducedMotion) {
    var STRIP_RATE = 0.5;
    function updateStripShift() {
      document.documentElement.style.setProperty(
        '--strip-shift', (-window.scrollY * STRIP_RATE) + 'px');
    }
    window.addEventListener('scroll', rafThrottle(updateStripShift), { passive: true });
    updateStripShift();
  }

  /* ============ fortune tab: fades in once you scroll past Work ============ */
  var fortuneTab = document.getElementById('fortuneTab');
  var valuesSection = document.getElementById('values');
  /* guarded: observe() throws on null, and that exception used to abort the rest
     of this file, taking the corkboard layout and everything after it down. */
  if (fortuneTab && valuesSection && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      fortuneTab.classList.toggle('visible', entries[0].isIntersecting);
    }, { threshold: 0.1 }).observe(valuesSection);
  } else if (fortuneTab) {
    fortuneTab.classList.add('visible');
  }

  /* ============ intro folder ============ *
   * The folder in her outstretched hand. Clicking fans the three intro cards
   * out of the pocket; clicking again (or Escape) tucks them back. rafThrottle
   * is declared below but hoisted, so the parallax sections can still use it. */
  var introFolder = document.getElementById('introFolder');
  var introOverlay = document.getElementById('introOverlay');
  var introDialogClose = document.getElementById('introDialogClose');
  var introLastFocused = null;

  if (introFolder && introOverlay) {
    var openIntro = function () {
      introLastFocused = document.activeElement;
      introFolder.classList.add('is-open');
      introFolder.setAttribute('aria-expanded', 'true');
      introOverlay.hidden = false;
      document.body.style.overflow = 'hidden';
      // next frame, so hidden -> visible and the transition do not collapse into one jump
      window.requestAnimationFrame(function () {
        introOverlay.classList.add('open');
        if (introDialogClose) { introDialogClose.focus(); }
      });
    };

    var closeIntro = function () {
      introOverlay.classList.remove('open');
      introFolder.classList.remove('is-open');
      introFolder.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      window.setTimeout(function () {
        introOverlay.hidden = true;
        if (introLastFocused && introLastFocused.focus) { introLastFocused.focus(); }
      }, 320);
    };

    introFolder.addEventListener('click', function () {
      if (introFolder.getAttribute('aria-expanded') === 'true') { closeIntro(); }
      else { openIntro(); }
    });

    if (introDialogClose) { introDialogClose.addEventListener('click', closeIntro); }

    introOverlay.addEventListener('click', function (e) {
      if (e.target === introOverlay) { closeIntro(); }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !introOverlay.hidden) { closeIntro(); }
    });
  }

  function rafThrottle(fn) {
    var ticking = false;
    return function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () { fn(); ticking = false; });
      }
    };
  }

  /* ============ scroll-linked interactivity between sections ============ *
   * A section-to-viewport progress helper, 0 as it enters from the bottom,
   * 1 once it has fully scrolled past the top. */
  function sectionProgress(rect) {
    var vh = window.innerHeight;
    return Math.max(0, Math.min(1, (vh - rect.top) / (vh + rect.height)));
  }

  var journeyPathEl = document.querySelector('.journey-path');
  var trailPath = document.querySelector('.timeline__path');
  if (journeyPathEl && trailPath && !prefersReducedMotion) {
    // Deliberately NOT tied to the full (tall) container height, or it stays
    // part-drawn the instant it enters view and never catches up. Instead it
    // starts at 0 the moment the top edge appears and finishes within about
    // three quarters of one viewport height of scrolling, so it reads as
    // "drawing in as you scroll" rather than "already there".
    function updateTrail() {
      var rect = journeyPathEl.getBoundingClientRect();
      var vh = window.innerHeight;
      var progress = Math.max(0, Math.min(1, (vh - rect.top) / (vh * 0.75)));
      // reveals top-to-bottom by clipping away the not-yet-reached portion
      trailPath.style.clipPath = 'inset(0 0 ' + ((1 - progress) * 100) + '% 0)';
    }
    window.addEventListener('scroll', rafThrottle(updateTrail), { passive: true });
    window.addEventListener('resize', rafThrottle(updateTrail));
    updateTrail();
  }

  var workBand = document.querySelector('#work .band');
  if (workBand && !prefersReducedMotion) {
    function updateBandParallax() {
      var rect = workBand.parentElement.getBoundingClientRect();
      var progress = sectionProgress(rect); // 0..1 across the section's scroll life
      var shift = (progress - 0.5) * 40; // drifts +-20px, band trails the content slightly
      workBand.style.transform = 'translateY(' + shift + 'px)';
    }
    window.addEventListener('scroll', rafThrottle(updateBandParallax), { passive: true });
    window.addEventListener('resize', rafThrottle(updateBandParallax));
    updateBandParallax();
  }

  var pinboard = document.getElementById('corkboard');
  if (pinboard && !prefersReducedMotion) {
    function updatePinboardParallax() {
      var progress = sectionProgress(pinboard.getBoundingClientRect());
      var shift = (progress - 0.5) * 24;
      pinboard.style.transform = 'translateY(' + shift + 'px)';
    }
    window.addEventListener('scroll', rafThrottle(updatePinboardParallax), { passive: true });
    window.addEventListener('resize', rafThrottle(updatePinboardParallax));
    updatePinboardParallax();
  }

  /* Everything below belongs to the portfolio page only. Without this guard the
     first missing element throws and aborts the rest of the file, which is how
     renaming #notes to #values silently killed the corkboard layout. Bailing
     here keeps the shared pieces above (nav, reveals, scroll) running on
     skills.html and fortune.html. */
  if (!document.getElementById('polaroidStack')) { return; }

  /* ============ polaroid stack ============ */
  var stack = document.getElementById('polaroidStack');
  var polaroids = Array.prototype.slice.call(stack.children);
  var prevBtn = document.getElementById('prevSlide');
  var nextBtn = document.getElementById('nextSlide');
  var dotsWrap = document.getElementById('carouselDots');
  var order = polaroids.map(function (_, i) { return i; });

  polaroids.forEach(function (_, i) {
    var dot = document.createElement('button');
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', 'Go to project ' + (i + 1));
    dot.addEventListener('click', function () { goToIndex(i); });
    dotsWrap.appendChild(dot);
  });
  var dots = Array.prototype.slice.call(dotsWrap.children);

  function render() {
    order.forEach(function (slideIndex, pos) {
      polaroids[slideIndex].setAttribute('data-pos', String(pos));
    });
    dots.forEach(function (d, i) { d.classList.toggle('active', i === order[0]); });
  }

  function next() {
    order.push(order.shift());
    render();
  }
  function prev() {
    order.unshift(order.pop());
    render();
  }
  function goToIndex(targetIndex) {
    while (order[0] !== targetIndex) { order.push(order.shift()); }
    render();
  }

  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  var workSection = document.getElementById('work');
  var workInView = false;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      workInView = entries[0].isIntersecting;
    }, { threshold: 0.3 }).observe(workSection);
  }
  document.addEventListener('keydown', function (e) {
    if (modalOpen) return;
    if (!workInView) return;
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
  });

  var touchStartX = 0, touchDeltaX = 0;
  stack.addEventListener('touchstart', function (e) {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  stack.addEventListener('touchmove', function (e) {
    touchDeltaX = e.touches[0].clientX - touchStartX;
  }, { passive: true });
  stack.addEventListener('touchend', function () {
    if (Math.abs(touchDeltaX) > 50) {
      touchDeltaX < 0 ? next() : prev();
    }
    touchDeltaX = 0;
  });

  render();

  function measureNaturalHeight(el) {
    var prevPosition = el.style.position;
    var prevHeight = el.style.height;
    el.style.position = 'static';
    el.style.height = 'auto';
    var h = el.offsetHeight;
    el.style.position = prevPosition;
    el.style.height = prevHeight;
    return h;
  }

  function sizeStackToContent() {
    var tallest = Math.max.apply(null, polaroids.map(measureNaturalHeight));
    stack.style.height = tallest + 'px';
  }
  sizeStackToContent();

  var stackResizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(stackResizeTimer);
    stackResizeTimer = setTimeout(sizeStackToContent, 150);
  });

  /* ============ case study modal ============ */
  var modalOverlay = document.getElementById('modalOverlay');
  var modal = document.getElementById('modal');
  var modalBody = document.getElementById('modalBody');
  var modalClose = document.getElementById('modalClose');
  var modalOpen = false;
  var lastFocused = null;

  function openModal(projectId, trigger) {
    var template = document.getElementById('project-' + projectId);
    if (!template) return;
    modalBody.innerHTML = '';
    modalBody.appendChild(template.content.cloneNode(true));

    lastFocused = trigger || document.activeElement;
    modalOverlay.hidden = false;
    document.body.style.overflow = 'hidden';
    // next frame, so the hidden -> visible change and the opacity transition don't collapse into one jump
    requestAnimationFrame(function () {
      modalOverlay.classList.add('open');
      modalOpen = true;
      modalClose.focus();
    });
  }

  function closeModal() {
    modalOverlay.classList.remove('open');
    modalOpen = false;
    document.body.style.overflow = '';
    window.setTimeout(function () {
      modalOverlay.hidden = true;
      if (lastFocused) lastFocused.focus();
    }, 320);
  }

  document.querySelectorAll('[data-open-modal]').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      openModal(trigger.getAttribute('data-open-modal'), trigger);
    });
  });

  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modalOpen) closeModal();
  });

  /* ============ pinboard: ruler ticks ============ */
  var rulerTop = document.getElementById('rulerTop');
  var rulerLeft = document.getElementById('rulerLeft');
  var TICK_SPACING = 42;

  function buildRuler(el, length, axis) {
    el.innerHTML = '';
    var count = Math.floor(length / TICK_SPACING);
    for (var i = 1; i <= count; i++) {
      var tick = document.createElement('span');
      tick.className = 'tick';
      tick.textContent = String(i);
      tick.style[axis] = (i * TICK_SPACING) + 'px';
      el.appendChild(tick);
    }
  }

  function buildRulers() {
    if (rulerTop) buildRuler(rulerTop, rulerTop.getBoundingClientRect().width, 'left');
    if (rulerLeft) buildRuler(rulerLeft, rulerLeft.getBoundingClientRect().height, 'top');
  }
  buildRulers();

  var rulerResizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(rulerResizeTimer);
    rulerResizeTimer = setTimeout(buildRulers, 150);
  });

  /* ============ corkboard: drag (desktop) + tap-to-place (touch) ============ */
  var corkboard = document.getElementById('corkboard');
  var stickies = Array.prototype.slice.call(corkboard.querySelectorAll('.sticky'));
  var pickedNote = null;

  function placeWithinBounds(el) {
    var boardRect = corkboard.getBoundingClientRect();
    var elRect = el.getBoundingClientRect();
    var maxLeft = corkboard.clientWidth - elRect.width;
    var maxTop = corkboard.clientHeight - elRect.height;
    var left = elRect.left - boardRect.left;
    var top = elRect.top - boardRect.top;
    left = Math.max(0, Math.min(left, maxLeft));
    top = Math.max(0, Math.min(top, maxTop));
    el.style.left = left + 'px';
    el.style.top = top + 'px';
  }

  /* The notes used to carry fixed --x/--y percentages. Percentages of a board
     that narrows do not keep 172px notes apart: at 820 two collided and one
     escaped, at 390 six collided, because placeWithinBounds then clamped the
     strays onto the same edge. So the board lays itself out instead, fitting as
     many columns as the current width allows and jittering each note off its
     cell so it still reads as hand-pinned rather than a grid. */
  var STICKY_GAP = 16;
  var MAX_COLS = 4;

  function jitter(i, seed, range) {
    var n = Math.sin((i + 1) * seed) * 10000;
    return ((n - Math.floor(n)) - 0.5) * 2 * range;
  }

  function layoutStickies() {
    var pending = stickies.filter(function (el) { return el.dataset.moved !== '1'; });
    if (!pending.length) { return; }

    /* clientWidth, not getBoundingClientRect: absolutely positioned children sit
       against the padding box, so the 9px board border is not theirs to use. */
    var boardW = corkboard.clientWidth;
    var boardH = corkboard.clientHeight;

    /* sizes may differ, so the grid is cut from the largest item rather than
       from whatever happens to be first in the DOM */
    var noteW = Math.max.apply(null, pending.map(function (el) { return el.offsetWidth; }));
    var noteH = Math.max.apply(null, pending.map(function (el) { return el.offsetHeight; }));
    /* each item is rotated, so its painted box is wider than its layout box;
       column fitting has to use the painted width or neighbours collide */
    var paintedW = Math.max.apply(null, pending.map(function (el) {
      return el.getBoundingClientRect().width;
    }));

    var cols = Math.floor((boardW + STICKY_GAP) / (paintedW + STICKY_GAP));
    cols = Math.max(1, Math.min(MAX_COLS, cols));
    var rows = Math.ceil(pending.length / cols);

    var cellH = noteH + STICKY_GAP;
    /* grow the board to the rows it actually needs, rather than squeezing rows
       into a fixed 520px and letting the tall polaroids overlap */
    var cs = window.getComputedStyle(corkboard);
    var chrome = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
      + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
    corkboard.style.minHeight = Math.ceil(rows * cellH + chrome) + 'px';
    boardH = corkboard.clientHeight;

    var cellW = boardW / cols;
    var topPad = Math.max(0, (boardH - cellH * rows) / 2);

    pending.forEach(function (el, i) {
      var row = Math.floor(i / cols);
      var col = i % cols;
      // last row gets centred so a short row does not hang off to one side
      var inRow = Math.min(cols, pending.length - row * cols);
      var rowOffset = (cols - inRow) * cellW / 2;

      var left = rowOffset + col * cellW + (cellW - noteW) / 2 + jitter(i, 12.9898, 10);
      var top = topPad + row * cellH + (cellH - el.offsetHeight) / 2 + jitter(i, 78.233, 9);

      left = Math.max(0, Math.min(left, boardW - noteW));
      top = Math.max(0, Math.min(top, boardH - el.offsetHeight));
      el.style.left = Math.round(left) + 'px';
      el.style.top = Math.round(top) + 'px';
    });
  }

  function placeNoteAt(el, clientX, clientY) {
    var boardRect = corkboard.getBoundingClientRect();
    var elRect = el.getBoundingClientRect();
    var left = clientX - boardRect.left - elRect.width / 2;
    var top = clientY - boardRect.top - elRect.height / 2;
    var maxLeft = corkboard.clientWidth - elRect.width;
    var maxTop = corkboard.clientHeight - elRect.height;
    left = Math.max(0, Math.min(left, maxLeft));
    top = Math.max(0, Math.min(top, maxTop));
    el.style.left = left + 'px';
    el.style.top = top + 'px';
  }

  layoutStickies();

  stickies.forEach(function (el) {
    var dragging = false;
    var moved = false;
    var offsetX = 0, offsetY = 0;

    el.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') {
        // touch: tap-to-pick-up, then tap-a-spot-to-place, no continuous drag
        e.preventDefault();
        if (pickedNote === el) {
          pickedNote.classList.remove('is-picked');
          pickedNote = null;
        } else {
          if (pickedNote) pickedNote.classList.remove('is-picked');
          pickedNote = el;
          el.classList.add('is-picked');
        }
        return;
      }

      dragging = true;
      moved = false;
      el.setPointerCapture(e.pointerId);
      el.style.zIndex = 50;
      el.style.transition = 'none';
      var elRect = el.getBoundingClientRect();
      offsetX = e.clientX - elRect.left;
      offsetY = e.clientY - elRect.top;
    });

    el.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      moved = true;
      var boardRect = corkboard.getBoundingClientRect();
      var elRect = el.getBoundingClientRect();
      var maxLeft = corkboard.clientWidth - elRect.width;
      var maxTop = corkboard.clientHeight - elRect.height;
      var left = e.clientX - boardRect.left - offsetX;
      var top = e.clientY - boardRect.top - offsetY;
      left = Math.max(0, Math.min(left, maxLeft));
      top = Math.max(0, Math.min(top, maxTop));
      el.style.left = left + 'px';
      el.style.top = top + 'px';
      el.dataset.moved = '1';
    });

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      el.style.zIndex = '';
      el.style.transition = '';
      try { el.releasePointerCapture(e.pointerId); } catch (err) { /* noop */ }
    }
    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointercancel', endDrag);
  });

  corkboard.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'touch' || !pickedNote) return;
    if (e.target.closest('.sticky')) return; // tapping another note is handled by its own listener
    placeNoteAt(pickedNote, e.clientX, e.clientY);
    pickedNote.dataset.moved = '1';
    pickedNote.classList.remove('is-picked');
    pickedNote = null;
  });

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      /* Once the visitor has rearranged the board it is theirs. Relaying out
         only the untouched notes would shuffle them on top of the one they
         moved, since the layout has no idea where it went. */
      var arranged = stickies.some(function (el) { return el.dataset.moved === '1'; });
      if (arranged) { stickies.forEach(placeWithinBounds); }
      else { layoutStickies(); }
    }, 150);
  });

  /* ============ connect: copy email to clipboard ============ */
  var emailCard = document.getElementById('emailCard');
  var emailCardSub = document.getElementById('emailCardSub');
  if (emailCard) {
    emailCard.addEventListener('click', function () {
      var address = emailCard.getAttribute('data-email');
      var originalText = emailCardSub.textContent;

      function showCopied() {
        emailCardSub.textContent = 'Copied to clipboard';
        window.setTimeout(function () { emailCardSub.textContent = originalText; }, 1800);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(address).then(showCopied, function () {
          fallbackCopy(address);
          showCopied();
        });
      } else {
        fallbackCopy(address);
        showCopied();
      }
    });
  }

  /* ============ postcard ============ *
   * Composes a mailto from the chosen reason plus the note. Static site, no
   * backend, so this hands off to the visitor's own mail client. That can
   * silently do nothing if they have none configured, which is why the status
   * line always points at the copy-the-address fallback underneath. */
  var postcard = document.getElementById('postcard');
  var postcardSend = document.getElementById('postcardSend');
  var postcardNote = document.getElementById('postcardNote');
  var postcardStatus = document.getElementById('postcardStatus');
  /* The note grows with what you write, snapped to whole ruled lines so the
     last line of ruling always sits under a line of text. Replaces the native
     resize grip, which looked like a form control on a paper card. */
  if (postcardNote) {
    var growNote = function () {
      var cs = window.getComputedStyle(postcardNote);
      var lh = parseFloat(cs.lineHeight);
      var pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      if (!lh) { return; }
      postcardNote.style.height = 'auto';
      var lines = Math.max(4, Math.ceil((postcardNote.scrollHeight - pad) / lh));
      postcardNote.style.height = (lines * lh + pad) + 'px';
    };
    postcardNote.addEventListener('input', growNote);
    growNote();
  }

  var reasonTags = Array.prototype.slice.call(document.querySelectorAll('.reason-tag'));
  var chosenSubject = '';

  reasonTags.forEach(function (tag) {
    tag.setAttribute('aria-pressed', 'false');
    tag.addEventListener('click', function () {
      var alreadyOn = tag.getAttribute('aria-pressed') === 'true';
      reasonTags.forEach(function (t) { t.setAttribute('aria-pressed', 'false'); });
      if (alreadyOn) {
        chosenSubject = '';
      } else {
        tag.setAttribute('aria-pressed', 'true');
        chosenSubject = tag.getAttribute('data-subject');
      }
    });
  });

  if (postcardSend && emailCard) {
    postcardSend.addEventListener('click', function () {
      var address = emailCard.getAttribute('data-email');
      var subject = chosenSubject || 'Hello from your portfolio';
      var body = postcardNote ? postcardNote.value.trim() : '';

      window.location.href = 'mailto:' + address +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(body);

      if (postcard) postcard.classList.add('is-posted');
      if (postcardStatus) {
        postcardStatus.textContent =
          'Your mail app should be opening. If it did not, tap Email on the right to copy the address instead.';
      }
    });
  }

  function fallbackCopy(text) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try { document.execCommand('copy'); } catch (err) { /* noop */ }
    document.body.removeChild(textarea);
  }
})();
