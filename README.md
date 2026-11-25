# Perfumes El Bro

Node/Express storefront: Stripe Checkout, live reviews (SQLite + Server-Sent Events), WhatsApp ordering, ES/EN.

## Run
```bash
cp .env.example .env      # fill in Stripe keys
npm install
npm start                 # http://localhost:3000
DEV_PLACEHOLDER_PRICES=1 npm start   # local only: $49.90 test price on unpriced products
```

## Before going live
1. **Zelle and Venmo**: set `ZELLE_ID` (email or phone), `ZELLE_NAME` and `VENMO_HANDLE` as environment variables (or in `site.config.json` under `payments`). A button only shows once its handle is set. The customer fills in shipping details, gets an order code (EB-XXXXXX) to put in the payment note, and confirms on WhatsApp.
   - See orders: `curl -H "x-admin-token: $ADMIN_TOKEN" https://yourdomain/api/orders`
   - Mark one paid: `curl -X PATCH -H "x-admin-token: $ADMIN_TOKEN" https://yourdomain/api/orders/EB-XXXXXX/paid`
2. **Card and Apple Pay (Stripe)**: put `STRIPE_SECRET_KEY` in the environment, then in the Stripe dashboard turn on Apple Pay and Google Pay under Settings > Payment methods. Add a webhook to `{SITE_URL}/api/stripe/webhook` for `checkout.session.completed` and set `STRIPE_WEBHOOK_SECRET`. Set `SHIPPING_CENTS` if shipping is not free. Without a Stripe key the card button reports that online card payment is unavailable and Zelle, Venmo and WhatsApp keep working.
3. **Prices**: `$80` per bottle, `$90` for Louis Vuitton (rule in `server.js`). An explicit `"price"` in `data/products.json` wins.
4. **Socials**: fill the URLs in `site.config.json` (`socials`). Empty ones are hidden.
5. **Deploy** somewhere with a persistent disk. `render.yaml` and `Dockerfile` are included (Render: New > Blueprint). `data/store.db` holds reviews and orders. Set `NODE_ENV=production`, `SITE_URL=https://yourdomain`, `ADMIN_TOKEN`.

## Catalog / images
- Edit `data/products.json`; put new photos in `productImages/`; run `npm run images` (outputs WebP to `public/img`).
- Every photo is rebuilt onto the same dark stage (1200x1960) with the store's business card under the bottles (`scripts/assets/business-card.png`). Phone photos get a spotlight so shelves and boxes fall into shadow. Photos that already show an old card use `"cardAt": [centerX, centerY, width]` (fractions of the photo) so the new card is laid over it. Extra photos of a product go in `"alt": [...]` and show as thumbnails in the product dialog.
- Delete a review: `curl -X DELETE -H "x-admin-token: $ADMIN_TOKEN" https://yourdomain/api/reviews/<id>`

## Hero and collection videos
`public/video/hero-{men,women,unisex}.mp4` are stock clips from [Mixkit](https://mixkit.co/license/#videoFree) (Mixkit Free License: free for commercial use, no attribution required): "Pressing down on a bottle of perfume" (20766), "Japanese cherry blossom in spring" (48889) and "Golden particles" (46317). Posters are frames from the same clips.

## 360° product view
The product dialog shows a drag-to-rotate turntable when a product has frames, otherwise a small 3D tilt of the single photo.
To add a turntable: put 12 to 36 photos taken around the bottle (phone on a turntable, same distance and light, in order) in `productImages/360/<product id>/`, then run `npm run images` and restart. The product id is the `id` in `data/products.json`.

## Orders and customer texts

1. Set `ADMIN_TOKEN` (a long random string) in the host's environment variables.
2. Open `https://your-domain/admin`, enter the token. Orders appear newest first.
3. Each order has ready-written texts (English and Spanish): order received, payment reminder, payment received, shipped (with optional tracking). Tapping one opens the phone's Messages app with the text filled in. Check it and press send.
4. Use "Mark as paid" and "Mark as shipped" to move the order along. Edit the wording in `public/admin.html` (the `T` object).

Texts are sent from the owner's own phone. Sending them automatically without a tap needs an SMS provider such as Twilio, which can be added later next to Stripe.
