let isNavigating = false;

export const safePush = (
  options: { pathname: string; params?: object } | string,
  delay = 500
) => {
  if (isNavigating) return;
  isNavigating = true;

  const router = require('expo-router').useRouter();
  if (typeof options === 'string') {
    router.push(options);
  } else {
    router.push({
      pathname: options.pathname,
      params: options.params
    });
  }

  setTimeout(() => {
    isNavigating = false;
  }, delay);
};
  