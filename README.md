This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.



# React Native E‑commerce App

> **Tech stack:** React Native, Zustand (or Redux Toolkit + RTK Query), react-native-vision-camera (Code Scanner), @react-native-google-signin/google-signin, react-native-mmkv

---

## Project overview

A simple e‑commerce mobile app showcasing product listing, cart management, product details, barcode scanning and Google Sign‑In. The app consumes the product catalog API provided in the assignment and implements pagination, search, cart persistence, barcode scanning with navigation to product details, and a mock coupon checkout flow.

---

## Architecture

### Folder Structure

```
src/
├── api/          # API calls and network logic
├── assets/       # Images, icons, static files
├── components/   # Reusable UI components
├── navigation/   # App navigation (Stack, Bottom Tabs)
├── screens/      # Login, Products, Details, Cart, Scanner
├── store/        # Zustand stores or Redux slices
└── utils/        # Helpers/utilities (auth, debounce, permissions)
```

* **UI layer**: React Native functional components + React Navigation for screen flow.
* **State layer**: **Zustand** for lightweight global state (cart, auth, UI flags). Optionally a **Redux Toolkit + RTK Query** variant is included for teams that prefer normalized state + built-in data fetching caching.
* **Persistence**: `react-native-mmkv` for fast storage of cart and token. `AsyncStorage` fallback available.
* **Networking**: `fetch` or axios (small wrapper) for API calls. If using RTK Query, network handled by that.
* **Barcode scanning**: `react-native-vision-camera` v4 + Code Scanner plugin for scanning and flashlight.
* **Authentication**: `@react-native-google-signin/google-signin` for Google OAuth.

## Setup instructions

> These are general instructions. Replace `YOUR_GOOGLE_WEB_CLIENT_ID` and other placeholders with real values.

1. **Prerequisites**

   * Node.js (>=16)
   * yarn or npm
   * React Native CLI or Expo preconfigured (this project uses bare React Native)
   * Android Studio / Xcode for simulators or a physical device

2. **Install dependencies**

```bash
# using yarn
yarn install

# or npm
npm install
```

3. **Important native packages to install (examples)**

```
# Google Sign-In
yarn add @react-native-google-signin/google-signin

# Storage
yarn add react-native-mmkv

# Vision Camera + Code Scanner
yarn add react-native-vision-camera
# follow native install steps and add Code Scanner plugin per its README

# (Optional) State: Zustand
yarn add zustand

# (Optional) Redux Toolkit + RTK Query
yarn add @reduxjs/toolkit react-redux

# Other common deps
yarn add react-navigation react-native-gesture-handler react-native-reanimated axios
```

> **Note:** Follow the individual libraries' native installation and pod install steps for iOS:

```bash
cd ios && pod install && cd ..
```

4. **Google Sign-In configuration**

   * Create OAuth 2.0 client IDs in Google Cloud Console.
   * Add `YOUR_GOOGLE_WEB_CLIENT_ID` and configure reversed client id for iOS and SHA-1 for Android.
   * Initialize in app (example in `src/utils/googleAuth.ts`):

```ts
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: 'YOUR_GOOGLE_WEB_CLIENT_ID',
  offlineAccess: true,
});
```

5. **Permissions**

   * Camera: add permissions to AndroidManifest.xml and Info.plist.
   * Microphone (if needed for scanning): add permissions if required.

6. **Environment variables**

   * Create a `.env` (example) with:

```
API_URL=https://catalog-management-system-dev-ak3ogf6zea-uc.a.run.app
GOOGLE_WEB_CLIENT_ID=your_client_id_here
```

7. **Run the app**

```bash
# Android
yarn android
# iOS
yarn ios
```

---

## How to run (development)

* Start Metro: `yarn start`
* Run on Android emulator/device: `yarn android`
* Run on iOS simulator: `yarn ios`
* To produce a release build follow platform-specific docs.

---

## Features implemented

1. **Login Screen**

   * Google Sign-In using `@react-native-google-signin/google-signin`.
   * Authentication state handling (loading, success, error).
   * Tokens/user info stored with `react-native-mmkv`.
   * Logout flow clears storage and navigates to Login.

2. **Products Listing**

   * Grid layout (2 columns) showing image, name, price and discount badge.
   * Quick add/remove to cart from listing.
   * Pagination (load more on scroll) and pull-to-refresh.
   * Search bar with debounced API queries.
   * Floating cart button with item count badge.
   * Skeleton loading state while fetching.

3. **Product Details**

   * Image carousel (zoom with pinch-to-zoom).
   * Product info, quantity selector, add/update cart.
   * Share product using native share sheet.

4. **Cart**

   * Full list of cart items with quantity controls and remove with confirmation.
   * Mock coupon code apply flow.
   * Price breakdown: subtotal, discount, tax (configurable), total.
   * Checkout button (mock flow).
   * Empty cart state with CTA to continue shopping.
   * Cart persisted using `react-native-mmkv`.

5. **Barcode Scanner**

   * Barcode/QR scanner implemented using `react-native-vision-camera` v4 + Code Scanner plugin.
   * Camera permission handling and flashlight toggle.
   * On scan: match scanned code against `variants[].barcodes[]` from API results and navigate to Product Details.
   * Scan history (stores last 5 scans in MMKV).

---

## API usage

**Endpoint**

```
POST https://catalog-management-system-dev-ak3ogf6zea-uc.a.run.app/cms/product/v2/filter/product
```

**Example cURL**

```bash
curl --location 'https://catalog-management-system-dev-ak3ogf6zea-uc.a.run.app/cms/product/v2/filter/product' \
--header 'accept: application/json' \
--header 'Content-Type: application/json' \
--header 'x-internal-call: true' \
--data '{ "page": "1", "pageSize": "10", "sort": { "creationDateSortOption": "DESC" } }'
```

**Notes**

* For barcode scanning: when a barcode is scanned, search the fetched product list's `variants[].barcodes[]` array to find an exact match; if found, open that product's details.
* Implement pagination using `page` and `pageSize` in the request body. For search, include the search term in the filter body (see `api/` file for request builder).

---

## List of npm packages used (with justification)

* `react-native` — framework.
* `@react-native-google-signin/google-signin` — Google OAuth sign-in.
* `react-native-vision-camera` — high performance camera for barcode scanning.
* `react-native-mmkv` — fast, efficient storage for tokens and cart persistence.
* `zustand` — minimal, easy-to-use global state for cart and UI flags. (Optional alternative: `@reduxjs/toolkit` + `react-redux` + `@reduxjs/toolkit/query` for teams that want normalized data caching and developer tools.)
* `react-navigation` and related libs (`@react-navigation/native`, `react-native-gesture-handler`, `react-native-reanimated`) — screen navigation.
* `axios` (or `fetch`) — API requests. Axios can simplify interceptors and error handling.
* `react-native-snap-carousel` or similar — image carousel for product images.
* `react-native-share` — to share product links/details.
* `react-native-vector-icons` — icons for UI (badges, buttons).
* `react-native-modal` (optional) — confirmation and coupon modal.

---

## Screenshots / GIFs

*Add screenshots or short GIFs of the app here. Recommended assets:*

* Login screen with Google button
* Products grid with badges and floating cart
* Product detail carousel
* Cart screen showing price breakdown
* Barcode scanner UI with flashlight toggle

(Insert images into repository `docs/screenshots/` and link them in this README.)

---

## Testing & Debugging

* Use React Native Debugger or Flipper for network and state inspection.
* Unit test critical helpers (price calculation, coupon logic).
* E2E tests: recommend Detox for native E2E when on bare RN.

---

## Known limitations & future improvements

* Search/filtering is server-driven and depends on API support for search fields.
* Coupon application is mocked — integrate real coupon validation during backend integration.
* Offline mode: add local caching of product list and queueing for checkout.
* Add real payments integration (Stripe/PayPal) for checkout flow.

---

## FAQ

**Q: Which state library should I use — Zustand or Redux Toolkit?**
A: Use **Zustand** for a compact project where quick development and smaller bundle size matter. Use **Redux Toolkit + RTK Query** when you need advanced caching, normalized data, and devtools for larger teams.

**Q: How are tokens stored securely?**
A: Tokens and small user info are stored in `react-native-mmkv` (faster than AsyncStorage). For production security consider native Keychain/Keystore or encrypted storage.

**Q: How does barcode scanning find a product?**
A: After scanning, the app compares the scanned code to the `variants[].barcodes[]` arrays returned by the API. If matched, the app fetches or navigates to the matching product detail.

**Q: What if the API is slow or returns errors?**
A: App shows skeleton loading states and friendly error messages with 'Retry'. Implement retry/backoff at network layer if needed.

**Q: Is user data persisted across installs?**
A: Data stored in MMKV persists across app restarts and updates but not across uninstall/reinstall. For long-term persistence, sync carts to backend for logged-in users.

---

## Contact / Contribution

If you want changes to the README or need additional instructions (CI/CD, release build steps, or a Redux variant sample) — open an issue in the repo or contact the project author.

---

*Generated README — edit screenshots, client IDs, and platform-specific native steps before publishing.*
