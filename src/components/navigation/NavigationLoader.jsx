import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import "./NavigationLoader.css";

const MIN_VISIBLE_TIME = 520;
const FALLBACK_HIDE_TIME = 900;

const getCurrentUrl = () =>
  `${window.location.pathname}${window.location.search}${window.location.hash}`;

const NavigationLoader = ({ children }) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const startedAtRef = useRef(0);
  const hideTimerRef = useRef(null);
  const fallbackTimerRef = useRef(null);

  const clearTimers = useCallback(() => {
    window.clearTimeout(hideTimerRef.current);
    window.clearTimeout(fallbackTimerRef.current);
  }, []);

  const startLoading = useCallback(() => {
    clearTimers();
    startedAtRef.current = Date.now();
    setIsLoading(true);

    fallbackTimerRef.current = window.setTimeout(() => {
      setIsLoading(false);
    }, FALLBACK_HIDE_TIME);
  }, [clearTimers]);

  const stopLoading = useCallback(() => {
    clearTimers();

    const elapsed = Date.now() - startedAtRef.current;
    const remaining = Math.max(MIN_VISIBLE_TIME - elapsed, 180);

    hideTimerRef.current = window.setTimeout(() => {
      setIsLoading(false);
    }, remaining);
  }, [clearTimers]);

  useEffect(() => {
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    const shouldStartForUrl = (url) => {
      if (!url) return true;

      const nextUrl = new URL(url, window.location.origin);
      return nextUrl.origin === window.location.origin && `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}` !== getCurrentUrl();
    };

    window.history.pushState = function pushStateWithLoader(...args) {
      if (shouldStartForUrl(args[2])) startLoading();
      return originalPushState.apply(this, args);
    };

    window.history.replaceState = function replaceStateWithLoader(...args) {
      if (shouldStartForUrl(args[2])) startLoading();
      return originalReplaceState.apply(this, args);
    };

    const handlePopState = () => startLoading();

    window.addEventListener("popstate", handlePopState);

    return () => {
      clearTimers();
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", handlePopState);
    };
  }, [clearTimers, startLoading]);

  useEffect(() => {
    stopLoading();
  }, [location.pathname, location.search, location.hash, stopLoading]);

  const handleClickCapture = (event) => {
    const link = event.target.closest("a[href]");

    if (
      !link ||
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey ||
      link.target === "_blank" ||
      link.hasAttribute("download")
    ) {
      return;
    }

    const nextUrl = new URL(link.href, window.location.origin);
    const isInternalRoute = nextUrl.origin === window.location.origin;
    const isSameRoute = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}` === getCurrentUrl();

    if (isInternalRoute && !isSameRoute) {
      startLoading();
    }
  };

  return (
    <div
      className="navigation-loader-shell"
      onClickCapture={handleClickCapture}
      aria-live="polite"
      aria-busy={isLoading}
    >
      {children}
      <div className={`navigation-loader ${isLoading ? "navigation-loader--visible" : ""}`}>
        <div className="navigation-loader__bar" />
        <div className="navigation-loader__veil">
          {/* <div className="navigation-loader__panel" role="status"> */}
            <span className="navigation-loader__spinner" aria-hidden="true" />
          {/* </div> */}
        </div>
      </div>
    </div>
  );
};

export default NavigationLoader;
