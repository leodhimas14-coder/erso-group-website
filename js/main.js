(function () {
  'use strict';

  var journey = document.getElementById('journey');
  var scrollCue = document.getElementById('scrollCue');
  if (!journey) return;

  var els = {
    bgIndustrial: document.querySelector('.bg-industrial'),
    bgYard: document.querySelector('.bg-yard'),
    bgRoad: document.querySelector('.bg-road'),
    bgOcean: document.querySelector('.bg-ocean'),
    bgSky: document.querySelector('.bg-sky'),
    bgArrival: document.querySelector('.bg-arrival'),
    factory: document.getElementById('factory'),
    inspector: document.getElementById('inspector'),
    containerBox: document.getElementById('containerBox'),
    crane: document.getElementById('crane'),
    craneBoom: document.getElementById('craneBoom'),
    craneHook: document.getElementById('craneHook'),
    truck: document.getElementById('truck'),
    road: document.getElementById('road'),
    roadTruck: document.getElementById('roadTruck'),
    ocean: document.getElementById('ocean'),
    ship: document.getElementById('ship'),
    cloud1: document.getElementById('cloud1'),
    cloud2: document.getElementById('cloud2'),
    plane: document.getElementById('plane'),
    customs: document.getElementById('customs'),
    stamp: document.getElementById('stamp'),
    heroContent: document.getElementById('heroContent')
  };

  // ---------- helpers ----------
  function clamp01(v) { return Math.min(1, Math.max(0, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t * t * (3 - 2 * t); } // smoothstep
  function localT(p, start, end) { return clamp01((p - start) / (end - start)); }
  // trapezoidal fade window: fades in between a-b, holds, fades out between c-d
  function fadeWindow(p, a, b, c, d) {
    if (p <= a || p >= d) return 0;
    if (p < b) return clamp01((p - a) / (b - a));
    if (p < c) return 1;
    return clamp01(1 - (p - c) / (d - c));
  }

  function getProgress() {
    var rect = journey.getBoundingClientRect();
    var total = journey.offsetHeight - window.innerHeight;
    if (total <= 0) return 1;
    var scrolled = -rect.top;
    return clamp01(scrolled / total);
  }

  function set(el, transform, opacity) {
    if (!el) return;
    el.style.transform = transform;
    if (opacity !== undefined) el.style.opacity = opacity;
  }

  // ---------- per-element updaters ----------
  function updateBackgrounds(p) {
    els.bgIndustrial.style.opacity = fadeWindow(p, -0.001, 0, 0.13, 0.16);
    els.bgYard.style.opacity = fadeWindow(p, 0.13, 0.16, 0.40, 0.44);
    els.bgRoad.style.opacity = fadeWindow(p, 0.40, 0.44, 0.585, 0.62);
    els.bgOcean.style.opacity = fadeWindow(p, 0.57, 0.61, 0.775, 0.81);
    els.bgSky.style.opacity = fadeWindow(p, 0.76, 0.80, 0.935, 0.965);
    els.bgArrival.style.opacity = fadeWindow(p, 0.93, 0.97, 2, 2); // never fades out
  }

  function updateFactory(p) {
    var opacity = fadeWindow(p, -0.001, 0, 0.06, 0.13);
    var t = ease(localT(p, 0, 0.08));
    set(els.factory, 'translate(-50%,-50%) translateX(' + lerp(-6, 0, t) + '%)', opacity);
  }

  function updateInspector(p) {
    var opacity = fadeWindow(p, 0.075, 0.095, 0.14, 0.17);
    var t = ease(localT(p, 0.08, 0.15));
    set(els.inspector, 'translate(-50%,-50%) translateY(' + lerp(-14, 0, t) + 'px) scale(' + lerp(0.8, 1, t) + ')', opacity);
  }

  function updateContainer(p) {
    var x = 0, y = 0, scale = 1, opacity = 0;
    if (p < 0.08) {
      opacity = fadeWindow(p, 0.02, 0.045, 1, 1);
      x = -25;
    } else if (p < 0.15) {
      opacity = 1; x = 0; y = 0; scale = 1;
    } else if (p < 0.28) {
      opacity = 1;
      var t3 = ease(localT(p, 0.15, 0.28));
      y = lerp(0, -16, Math.min(1, t3 / 0.6));
      x = lerp(0, 18, Math.max(0, (t3 - 0.4)) / 0.6);
    } else if (p < 0.34) {
      opacity = 1;
      var t4 = ease(localT(p, 0.28, 0.34));
      x = lerp(18, 0, t4); y = lerp(-16, -6, t4); scale = lerp(1, 1.3, t4);
    } else if (p < 0.42) {
      opacity = 1;
      var t5 = ease(localT(p, 0.34, 0.42));
      x = lerp(0, 20, t5); y = lerp(-6, 6, t5); scale = lerp(1.3, 0.88, t5);
    } else if (p < 0.52) {
      var t6 = ease(localT(p, 0.42, 0.52));
      x = lerp(20, 95, t6); y = 6; scale = 0.88;
      opacity = 1 - clamp01((t6 - 0.55) / 0.45);
    } else {
      opacity = 0;
    }
    set(els.containerBox, 'translate(-50%,-50%) translate(' + x + '%, ' + y + '%) scale(' + scale + ')', opacity);
  }

  function updateCrane(p) {
    var opacity = fadeWindow(p, 0.13, 0.165, 0.255, 0.29);
    var x = -14, boomRot = -22, hookY = 0;
    if (p >= 0.13 && p < 0.29) {
      var t = ease(localT(p, 0.15, 0.28));
      x = lerp(-14, 0, Math.min(1, t / 0.25));
      var grab = t < 0.25 ? 0 : clamp01((t - 0.25) / 0.25);
      boomRot = lerp(-22, -4, grab);
      var lift = t < 0.5 ? grab : lerp(1, 0.35, clamp01((t - 0.5) / 0.25));
      hookY = lerp(0, -18, lift);
      if (t > 0.75) {
        x = lerp(0, -14, (t - 0.75) / 0.25);
      }
    }
    set(els.crane, 'translate(-50%,-50%) translateX(' + x + '%)', opacity);
    if (els.craneBoom) els.craneBoom.style.transform = 'rotate(' + boomRot + 'deg)';
    if (els.craneHook) els.craneHook.style.transform = 'translateY(' + hookY + '%)';
  }

  function updateTruck(p) {
    var opacity = fadeWindow(p, 0.32, 0.35, 0.495, 0.545);
    var x = -55;
    if (p >= 0.32 && p < 0.55) {
      if (p < 0.42) {
        x = -8;
      } else {
        var t = ease(localT(p, 0.42, 0.52));
        x = lerp(-8, 85, t);
      }
    }
    set(els.truck, 'translate(-50%,-50%) translateX(' + x + '%)', opacity);
  }

  function updateRoad(p) {
    var opacity = fadeWindow(p, 0.50, 0.535, 0.585, 0.63);
    if (els.road) els.road.style.opacity = opacity;
    var t = ease(localT(p, 0.52, 0.60));
    set(els.roadTruck, 'translate(-50%,-50%) translate(' + lerp(-26, 30, t) + '%, ' + lerp(24, -26, t) + '%) rotate(' + lerp(0, 18, t) + 'deg)');
  }

  function updateOcean(p) {
    var opacity = fadeWindow(p, 0.57, 0.615, 0.775, 0.82);
    var t = ease(localT(p, 0.60, 0.68));
    set(els.ocean, 'translateY(' + lerp(24, 0, t) + '%)', opacity);
  }

  function updateShip(p) {
    var opacity = fadeWindow(p, 0.64, 0.685, 0.775, 0.805);
    var t = ease(localT(p, 0.68, 0.78));
    set(els.ship, 'translate(-50%,-50%) translateX(' + lerp(-28, 12, t) + '%) scale(' + lerp(1.15, 0.82, t) + ')', opacity);
  }

  function updateSky(p) {
    var t = ease(localT(p, 0.78, 0.90));
    var cloudOpacity = fadeWindow(p, 0.76, 0.80, 0.94, 0.98);
    set(els.cloud1, 'translateX(' + lerp(-25, 65, t) + '%)', cloudOpacity);
    set(els.cloud2, 'translateX(' + lerp(115, -45, t) + '%)', cloudOpacity);
    var planeOpacity = fadeWindow(p, 0.79, 0.82, 0.875, 0.905);
    set(els.plane, 'translate(-50%,-50%) translateX(' + lerp(-65, 65, ease(localT(p, 0.80, 0.90))) + '%)', planeOpacity);
  }

  function updateCustoms(p) {
    var opacity = fadeWindow(p, 0.89, 0.915, 0.945, 0.975);
    set(els.customs, 'translate(-50%,-50%)', opacity);
    var t = ease(localT(p, 0.90, 0.95));
    set(els.stamp, 'translate(-50%,-50%) translateY(' + lerp(-45, 0, t) + '%) rotate(' + lerp(-18, 0, t) + 'deg)', t);
  }

  function updateHero(p) {
    var t = ease(localT(p, 0.95, 1.0));
    set(els.heroContent, 'translate(-50%,-50%) translateY(' + lerp(24, 0, t) + 'px)', t);
    els.heroContent.style.pointerEvents = p >= 0.985 ? 'auto' : 'none';
  }

  function updateScrollCue(p) {
    if (!scrollCue) return;
    scrollCue.classList.toggle('is-hidden', p > 0.03);
  }

  function updateScene(p) {
    updateBackgrounds(p);
    updateFactory(p);
    updateInspector(p);
    updateContainer(p);
    updateCrane(p);
    updateTruck(p);
    updateRoad(p);
    updateOcean(p);
    updateShip(p);
    updateSky(p);
    updateCustoms(p);
    updateHero(p);
    updateScrollCue(p);
  }

  // ---------- reduced motion: static final frame ----------
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    journey.classList.add('reduced-motion');
    updateScene(1);
    return;
  }

  // ---------- rAF-driven scroll loop ----------
  function loop() {
    updateScene(getProgress());
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

})();
