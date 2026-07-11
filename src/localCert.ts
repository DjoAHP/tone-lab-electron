// Certificat auto-signé pour le serveur HTTPS local (hôtes "tonelab.local",
// "localhost" et 127.0.0.1).
//
// Pourquoi ? Depuis octobre 2025, YouTube exige que les vidéos intégrées soient
// chargées depuis une origine HTTPS avec un Referer https valide et cohérent
// (sinon erreurs 150/152/153). En servant le renderer via https://tonelab.local
// (mappé sur 127.0.0.1), la page a une vraie origine https et un Referer https
// cohérent → l'intégration YouTube fonctionne comme sur la PWA.
//
// Le SAN "localhost" permet aussi de servir Vite en HTTPS sur localhost pour
// `npm run dev` (ouvert dans un navigateur), sans dépendre du certificat
// auto-généré par Vite (qui déclenche ERR_SSL_VERSION_OR_CIPHER_MISMATCH sur
// Windows/Chrome).
//
// Ce certificat n'est utilisé QUE localement (localhost) et son erreur de
// validation est explicitement acceptée dans main.ts (événement certificate-error)
// et dans le navigateur (avertissement auto-signé à accepter une fois).
// Il ne présente aucun risque de sécurité : il ne sert jamais de trafic réseau.

export const LOCAL_CERT = `-----BEGIN CERTIFICATE-----
MIIDNzCCAh+gAwIBAgIUVbE0kH6kiGMKEXWqyQhHmYxhqJIwDQYJKoZIhvcNAQEL
BQAwGDEWMBQGA1UEAwwNdG9uZWxhYi5sb2NhbDAeFw0yNjA3MTExMTM2MzFaFw0z
NjA3MDgxMTM2MzFaMBgxFjAUBgNVBAMMDXRvbmVsYWIubG9jYWwwggEiMA0GCSqG
SIb3DQEBAQUAA4IBDwAwggEKAoIBAQC5pdBpPMUou3UhcsdcQltH9GuxORjdxsSL
YRw1aNnYKG2wjJsVs0UNCJqWG5K6MPHmwXiY/GBETKk0rFaXgpacuYvsDXDm1cZi
N6VIBpKWs2FRq57NjbfLrxEAJdoJ0AVteECngKlC0GD2GSB9t6K1bh1mSuEL7V9M
EBCMsKzaoegFUkDY1SY3hEglkbGY3XRjAXKZKOLQiBfY3JEUQOXbgEknjH5+REZc
hJK0FSyO9lU+5pHoLveobL5CtdkMBBMPFd3SEmpFMEp/nCZmNEkY0KkVpImA+FgX
cVqINaM+Mwaw6Wy7/l7g/KzbkvCTSwyCNyrS3f65YTwB2lmUt7t1AgMBAAGjeTB3
MCkGA1UdEQQiMCCCDXRvbmVsYWIubG9jYWyCCWxvY2FsaG9zdIcEfwAAATAJBgNV
HRMEAjAAMAsGA1UdDwQEAwIFoDATBgNVHSUEDDAKBggrBgEFBQcDATAdBgNVHQ4E
FgQUOF8lMGJuS63OuiiALpCmsy3ekq4wDQYJKoZIhvcNAQELBQADggEBABMeKroI
bMm5ErIUY9cV+iTlrz3fwFby+zXpMt0Y1fB7kDObCvn/kAzhOu5JNVuk5b/pMXib
Uxp5EwePFrhZbdc8IaFwWG2LAIir1TBEbhuDrz1CrZ4MlHLOLh8Cu9ppt29ALeR3
DoquLbncdMxKzP/ZzIm7xQuTCqsYVzUTqXEalAv4hsvimwRlY6mX+iPI1twlrNWj
8EO+QTqu0xNtRW2XjiU1QvLirrgrcTKEstpG/0NunMCxs7gz4uQ6BT7xoikCS73j
U8dPaXLCB8HFrDTHUF8tewB34tqm2hwcPq5lUaTD69qn0tWQjQxydcRqqm8/WxP2
pgPh7F4UMkVAXC0=
-----END CERTIFICATE-----`;

export const LOCAL_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC5pdBpPMUou3Uh
csdcQltH9GuxORjdxsSLYRw1aNnYKG2wjJsVs0UNCJqWG5K6MPHmwXiY/GBETKk0
rFaXgpacuYvsDXDm1cZiN6VIBpKWs2FRq57NjbfLrxEAJdoJ0AVteECngKlC0GD2
GSB9t6K1bh1mSuEL7V9MEBCMsKzaoegFUkDY1SY3hEglkbGY3XRjAXKZKOLQiBfY
3JEUQOXbgEknjH5+REZchJK0FSyO9lU+5pHoLveobL5CtdkMBBMPFd3SEmpFMEp/
nCZmNEkY0KkVpImA+FgXcVqINaM+Mwaw6Wy7/l7g/KzbkvCTSwyCNyrS3f65YTwB
2lmUt7t1AgMBAAECggEABXf6lBF+5towpGtd1qiYhDtCmcnKZ/YL+r4uHp9riYjG
umlZ642l9v/JCasaa1CaP52wJprFhzE4xFNL69xVd03OZSN8OOzZzWyQNXdVVGyD
iti7cpiqgcCBwrKCIiO2C1+P2xV2eqebYSIGqTmzrYrTFTC03rb/lFhoL3kXBJWs
5pSMG5fQzaitjCLoVa36TXiiqqanpPcf+oSAh47aZR/3dSkwn1l7Cp7rx7QuEkXJ
N64m4FCCeQyGlJBMf5vWMibbQxbvDH9eo2NWWnumP8tLCdn/BeoqS4KejlFE437O
kfZmb+vMbuVDAe6gc3u1G0L9GdytHpoNKGfrlWbcHQKBgQDl1l8omjgaq0BRMBP2
y37AznXRV/x7ITyauk47fWHiqv4K6GWC7vYSKSJwLifDUHyX5+ho1XaxSjR1HYiI
DOMNtETBEXF2jtGr9Lj3Mi+1tmK5qUkunKl+JjvIRPbhsU1PhEKotm0pahwc/8yB
4yIrC69JT48QdMppoBnOnvmi0wKBgQDOx7kdtrvMPgvItEp4p/61KbmA2cUbYowA
75IAD5++1uF1T+MLxKPYhrnLjZfb//8YnNEVFwD7KFygw+QmldYqX6UX9yT3yU6r
Efb03DZWmkF+afxaz9TJIliKMTvnOJ76I+IMbsiuybbn9EjDayxxrkDWfvEElIcQ
PN4DYlvrlwKBgDpgls7zTOjJMo7sjUWULl++kQJZPNHxgTkztQc7M4+lKt2OZao6
E9pNBGhF8OeVG/BhgRCPl5Q0atqMY89appkmfogjbBRW9j6c7BYtcxzOdIj/zIzA
UfSutWSKz8JHjIFz8JJ1s4hfYUCkYEdlb5pLX3xZbtcZMwhdF/D5RCLtAoGBALQz
d45+hfC7DZfuDoxRkvYcE45Hua9g1TOnk+u7sfIk3zxVzz6dMlBrMJVEotfVo2C2
oLspXfCCvx5XOIerwoUQ7xYQikXqSEVrFXVUR4J3UaYyBPq67ewOo2xi9ZpOTLUe
+krtbLRuE5jW2WZ8CrJTMiv7Wl0sdvven3gBiqunAoGAJ5XMFACw2+OfKrNRi1bD
XPK05SBQHw7WAVhg6EJnNxsyUGgI9/D9/ANiPOgca2Y6jrLWgbBMiWFhiNHfd8df
QKAxjOYzr1rM2z4EBoS67rrF7d0wrjWO+FUx/0j4i6gjyYXLavxgOKxrpaUda/Pb
Z4CaHLibQzaabqJQ8i4Zl4E=
-----END PRIVATE KEY-----`;
