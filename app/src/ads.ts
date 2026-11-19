import Constants, { ExecutionEnvironment } from 'expo-constants';

// Expo Go har inte Google Mobile Ads native modul kompilerad i sin standard-binär.
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  (Constants as any).appOwnership === 'expo';

let mobileAds: any = null;
let BannerAd: any = null;
let BannerAdSize: any = {
  BANNER: 'BANNER',
  LARGE_BANNER: 'LARGE_BANNER',
  MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE',
  FULL_BANNER: 'FULL_BANNER',
  LEADERBOARD: 'LEADERBOARD',
};
let TestIds: any = {
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
};

if (!isExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const adsModule = require('react-native-google-mobile-ads');
    mobileAds = adsModule.default || adsModule;
    BannerAd = adsModule.BannerAd;
    BannerAdSize = adsModule.BannerAdSize || BannerAdSize;
    TestIds = adsModule.TestIds || TestIds;
  } catch (err) {
    console.warn('Google Mobile Ads inte tillgängligt i denna miljö:', err);
  }
}

export { mobileAds, BannerAd, BannerAdSize, TestIds, isExpoGo };
