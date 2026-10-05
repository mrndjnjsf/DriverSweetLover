# Optional supporter full resets

Each career receives three full resets, shared across owned cars. The allowance
is saved with the career; older saves without it receive three on migration.
Full resets repair the active car, refill oil and fuel, and preserve upgrades,
tuning, money, objectives, mileage and other cars. Normal game-money services
remain available. Keyboard R / recovery controls reposition the car without
restoring part health or fuel and do not spend a full reset.

Entering the graffiti code unlocks unlimited full resets for that career.
Edit `src/config/support.js` to set the HTTPS donation URL and graffiti text.
Changing the code does not revoke already-unlocked saves. The current code is
SHIFT3. The roadside wall is three blocks west of the map's central intersection,
on the north sidewalk. On custom smaller maps the location clamps to column zero.
The art and checker use the same configuration. No paid reset transaction or
donation verification is claimed by the game.

## Donor delivery

Send `docs/supporter-clue.svg` as the email clue attachment after confirming a
donation through your provider. Email template:

Subject: Your CarPG city clue

Thanks for supporting CarPG! Your donation helps keep the game free.
The attached map leads to a painted roadside wall: from the central intersection,
travel three blocks west and look on the north sidewalk. The letters and number
painted there are your Garage password. Enter it in the phone's Garage app to
unlock unlimited full car resets on your current save.

Automated donor emails are not implemented. Configure a donation provider and
email integration outside GitHub Pages before advertising automatic delivery.
Do not put payment or email-service credentials into this repository or browser
configuration. Until a URL is configured, the game shows "Donation page coming soon."

## Static-host limitations

This is an honor-system perk. All code and graffiti are public assets. Save data
is browser-local: clearing storage restores the allowance, and editing storage
or inspecting code can unlock the perk. There is no purchase proof, account-wide
entitlement or cross-device recovery. Enforced monetization would require a
backend verifying payment webhooks and account entitlements. This lightweight
version deliberately does not ask for payment while its donation URL is unset.
