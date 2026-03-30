const KEY = "approval_banner";

export const getBannerState = () => {
  const data = sessionStorage.getItem(KEY);
  return data ? JSON.parse(data) : null;
};

export const setBannerDismissed = (count: number) => {
  sessionStorage.setItem(
    KEY,
    JSON.stringify({
      dismissedAt: Date.now(),
      count,
    })
  );
};

export const shouldShowBanner = (count: number) => {
  const state = getBannerState();

  if (!state) return true;

  const { dismissedAt, count: oldCount } = state;

  const DAY = 24 * 60 * 60 * 1000;

  if (count > oldCount) return true;
  if (Date.now() - dismissedAt > DAY) return true;

  return false;
};