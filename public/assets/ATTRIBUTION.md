# Character artwork references

- `capri-body.webp`: copied unchanged from the user's `E:\Capri_data\Capri_model_1.webp`. Original artist/source not supplied. Used as a local reference prototype, not represented as newly authored art.
- `capri-faces.png`: copied unchanged from `docs/faces.png` in https://github.com/mochiiwuff/capri-desktop . The upstream revision and original URL are recorded in `SOURCES.json` (entry `faces.png`).

Upstream credits Capri / Cyberpunk to CD PROJEKT RED, Studio Trigger and Netflix. Its artwork is explicitly excluded from the repository code license. The face strip supplies eight reference images, not a complete facial rig.


The imported renderer and acting code, source revision and license are retained in `public/vendor/capri-desktop/`. See the root `THIRD_PARTY_NOTICES.md`.

The current default sprites in `lachy/` are adapted from [Lachy's Capri project](https://github.com/lachydotmcg/capri-desktop), revision `eb1aecd4831829285044b87111497668024a0695`. Artwork and animation are by that project's artist, who prefers to stay private. Original cell proportions and placement are retained inside smaller fixed-size tiles; 30 fps loops retain their original frames and duration. The complete license, Required Notices and source hashes are retained under `public/vendor/lachy-capri/` and in the root notices file. `point.png` is the earlier mochiiwuff pointing act, resized for compatibility.

The retired shader atlas and its duplicate prepared image were removed. The original full-body reference remains in mochi/capri-full.png; the retained point pose keeps the Required Notices in THIRD_PARTY_NOTICES.md.

Three additional references were supplied by the project user in E:/Capri_data
on 2026-11-03 and copied unchanged as mochi/user-thinking.webp,
mochi/user-eyes.webp and mochi/user-wink.webp. Original filenames and SHA-256
hashes are recorded in mochi/USER-SOURCE.json; no additional authorship or
licensing is asserted for these supplied references.
