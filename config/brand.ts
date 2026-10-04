/**
 * Source unique de l'identité Terra Nova.
 *
 * Les surfaces ne doivent pas importer la configuration de la landing pour afficher la marque :
 * la landing est une page, la marque est transverse.
 */
export const BRAND_NAME = "Terra Nova"

/**
 * Tracé blanc du glyphe, utilisé comme masque CSS (voir `.brand-mark`).
 * Le blanc n'est jamais visible : il ne sert que de forme à teinter.
 */
export const BRAND_MARK_MASK = "/img/brand/terra-nova-mark-white.png"

/** Ratio largeur/hauteur du glyphe, mesuré sur l'asset 512x474. */
export const BRAND_MARK_RATIO = 512 / 474
