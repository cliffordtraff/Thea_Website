const galleryLoader = String.raw`
(() => {
  if (window.__theaGalleryLoader) return;

  const INITIAL_COUNT = 4;
  const FAST_THRESHOLD_MS = 600;
  const FAST_BYTES_PER_SECOND = 150000;
  const MODE_TTL_MS = 5 * 60 * 1000;
  const STORAGE_KEY = "thea-gallery-connection-v2";
  const states = new WeakMap();

  const imagesFor = (stage) =>
    Array.from(stage.querySelectorAll("img[data-gallery-image]"));

  const refreshImages = (state) => {
    const images = imagesFor(state.stage);
    if (images.length >= state.images.length) state.images = images;
    return state.images;
  };

  const updateIdle = (state) => {
    state.stage.dataset.galleryQueueIdle =
      state.queue.length === 0 && !state.active && state.pending === 0
        ? "true"
        : "false";
  };

  const reveal = (state, image) => {
    const index = Number(image.dataset.galleryIndex);
    if (Number.isFinite(index)) state.settled[index] = true;
    refreshImages(state);
    if (state.urgent.has(image)) image.dataset.sequenceReady = "true";
    while (state.settled[state.next]) {
      const nextImage = state.images[state.next];
      if (!nextImage) break;
      nextImage.dataset.sequenceReady = "true";
      state.next += 1;
    }
  };

  const install = (state, image) => {
    const policyKey =
      state.mode === "fast" ? "deferredSrcsetFast" : "deferredSrcsetSlow";
    const picture = image.closest("picture");
    picture
      ?.querySelectorAll(
        "source[data-deferred-srcset], source[data-deferred-srcset-slow]",
      )
      .forEach((source) => {
        const srcset =
          source.dataset[policyKey] || source.dataset.deferredSrcset;
        if (srcset) source.srcset = srcset;
        delete source.dataset.deferredSrcset;
        delete source.dataset.deferredSrcsetSlow;
        delete source.dataset.deferredSrcsetFast;
      });

    const srcset = image.dataset[policyKey] || image.dataset.deferredSrcset;
    const src = image.dataset.deferredSrc;
    if (srcset) image.srcset = srcset;
    if (src) image.src = src;
    delete image.dataset.deferredSrcset;
    delete image.dataset.deferredSrcsetSlow;
    delete image.dataset.deferredSrcsetFast;
    delete image.dataset.deferredSrc;
  };

  const observe = (state, image, done) => {
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      image.removeEventListener("load", finish);
      image.removeEventListener("error", finish);
      reveal(state, image);
      done();
    };

    image.addEventListener("load", finish, { once: true });
    image.addEventListener("error", finish, { once: true });
    install(state, image);
    if (image.complete && (image.currentSrc || image.src)) queueMicrotask(finish);
  };

  const loadParallel = (state, image) => {
    state.pending += 1;
    updateIdle(state);
    observe(state, image, () => {
      state.pending -= 1;
      updateIdle(state);
    });
  };

  const drain = (state) => {
    if (state.active || state.mode !== "slow") return;
    const image = state.queue.shift();
    if (!image) {
      updateIdle(state);
      return;
    }

    state.active = true;
    updateIdle(state);
    observe(state, image, () => {
      state.active = false;
      drain(state);
    });
  };

  const request = (stage, requestedImages, options = {}) => {
    const state = states.get(stage) || start(stage);
    if (!state) return;
    const urgent = options.urgent === true;

    if (!state.mode) {
      Array.from(requestedImages).forEach((image) => {
        if (
          image instanceof HTMLImageElement &&
          image.dataset.deferredSrc &&
          !state.waiting.some((item) => item.image === image)
        ) {
          state.waiting.push({ image, urgent });
        }
      });
      return;
    }

    const images = Array.from(requestedImages)
      .filter(
        (image) => image instanceof HTMLImageElement && image.dataset.deferredSrc,
      )
      .sort(
        (a, b) =>
          Number(a.dataset.galleryIndex) - Number(b.dataset.galleryIndex),
      );

    if (state.mode === "fast") {
      images.forEach((image) => {
        if (state.requested.has(image)) return;
        state.requested.add(image);
        loadParallel(state, image);
      });
      return;
    }

    // User-visible work outranks the background serial queue. A fast desktop
    // gesture can cross several frames before one hotel-Wi-Fi request finishes;
    // start the destination window in parallel and allow those photographs to
    // reveal independently. The initial opening batch never uses this path.
    if (urgent) {
      images.forEach((image) => {
        state.urgent.add(image);
        if (state.requested.has(image)) {
          const queuedIndex = state.queue.indexOf(image);
          if (queuedIndex < 0) return;
          state.queue.splice(queuedIndex, 1);
        } else {
          state.requested.add(image);
        }
        loadParallel(state, image);
      });
      updateIdle(state);
      drain(state);
      return;
    }

    const queued = [];
    images.forEach((image) => {
      if (state.requested.has(image)) {
        return;
      }
      state.requested.add(image);
      queued.push(image);
    });
    state.queue = state.queue.concat(queued);
    updateIdle(state);
    drain(state);
  };

  const connectionSignature = (connection) =>
    connection
      ? [connection.effectiveType || "", connection.saveData ? "1" : "0"].join(":")
      : "unavailable";

  const connectionIsConstrained = (connection) =>
    connection?.saveData ||
    connection?.effectiveType === "slow-2g" ||
    connection?.effectiveType === "2g" ||
    connection?.effectiveType === "3g";

  const connectionIsClearlyFast = (connection) =>
    connection?.effectiveType === "4g" && connection?.downlink >= 2;

  const savedMode = (connection) => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null");
      if (
        (saved?.mode === "fast" || saved?.mode === "slow") &&
        saved.expires > Date.now() &&
        saved.signature === connectionSignature(connection)
      ) {
        return saved.mode;
      }
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    } catch {
      return null;
    }
  };

  const classify = (image, elapsed) => {
    const connection = navigator.connection;
    if (connectionIsConstrained(connection)) return "slow";

    const saved = savedMode(connection);
    if (saved) return saved;

    const currentUrl = image.currentSrc || image.src;
    const timing = performance
      .getEntriesByType("resource")
      .find((entry) => entry.name === currentUrl);
    if (!timing) return connectionIsClearlyFast(connection) ? "fast" : "slow";

    const duration = timing?.duration || elapsed;
    const cacheHit = timing?.transferSize === 0 && timing?.decodedBodySize > 0;
    if (cacheHit) return "fast";

    const responseDuration = timing
      ? Math.max(1, timing.responseEnd - timing.responseStart)
      : duration;
    const transferredBytes = timing?.encodedBodySize || timing?.transferSize || 0;
    const bytesPerSecond = (transferredBytes * 1000) / responseDuration;
    return duration <= FAST_THRESHOLD_MS &&
      (transferredBytes > 0
        ? bytesPerSecond >= FAST_BYTES_PER_SECOND
        : connectionIsClearlyFast(connection))
      ? "fast"
      : "slow";
  };

  function start(stage) {
    if (!(stage instanceof HTMLElement)) return null;
    const existing = states.get(stage);
    if (existing) {
      refreshImages(existing);
      if (existing.mode) {
        request(stage, existing.images.slice(1, INITIAL_COUNT));
      }
      return existing;
    }

    const images = imagesFor(stage);
    const first = images[0];
    if (!first) return null;

    const state = {
      stage,
      images,
      mode: null,
      queue: [],
      requested: new WeakSet(),
      urgent: new WeakSet(),
      settled: [],
      next: 0,
      active: false,
      pending: 0,
      waiting: [],
    };
    states.set(stage, state);
    stage.dataset.galleryQueueIdle = "false";
    const startedAt = performance.now();

    observe(state, first, () => {
      refreshImages(state);
      state.mode = classify(first, performance.now() - startedAt);
      stage.dataset.galleryLoadMode = state.mode;
      document.documentElement.dataset.galleryConnection = state.mode;
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            mode: state.mode,
            expires: Date.now() + MODE_TTL_MS,
            signature: connectionSignature(navigator.connection),
          }),
        );
      } catch {}
      const waiting = state.waiting.splice(0);
      request(stage, state.images.slice(1, INITIAL_COUNT));
      waiting.forEach(({ image, urgent }) =>
        request(stage, [image], { urgent }),
      );
      window.dispatchEvent(
        new CustomEvent("thea:gallery-mode", { detail: { mode: state.mode } }),
      );
      updateIdle(state);
    });

    return state;
  }

  window.__theaGalleryLoader = { start, request };

  navigator.connection?.addEventListener?.("change", () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
    const connection = navigator.connection;
    document.querySelectorAll("[data-gallery-stage]").forEach((stage) => {
      const state = states.get(stage);
      if (!state) return;
      const nextMode = connectionIsConstrained(connection)
        ? "slow"
        : connectionIsClearlyFast(connection)
          ? "fast"
          : state.mode;
      if (!nextMode || nextMode === state.mode) return;
      state.mode = nextMode;
      stage.dataset.galleryLoadMode = nextMode;
      document.documentElement.dataset.galleryConnection = nextMode;
      if (nextMode === "fast") {
        const queued = state.queue.splice(0);
        queued.forEach((image) => {
          loadParallel(state, image);
        });
      }
      updateIdle(state);
      drain(state);
    });
  });

  const scan = () =>
    document.querySelectorAll("[data-gallery-stage]").forEach(start);
  const observer = new MutationObserver(scan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        scan();
        observer.disconnect();
      },
      { once: true },
    );
  } else {
    scan();
    observer.disconnect();
  }
})();
`;

/**
 * Starts the first-photo-first queue during HTML parsing, before React hydrates.
 * This keeps later image URLs undiscoverable until the first frame settles.
 */
export function GalleryImageBootstrap() {
  return (
    <script
      id="thea-gallery-image-loader"
      dangerouslySetInnerHTML={{ __html: galleryLoader }}
    />
  );
}
