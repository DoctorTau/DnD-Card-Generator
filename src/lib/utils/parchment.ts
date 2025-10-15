export function parchmentCSS(intensity: number) {
    const i = Math.max(0, Math.min(1, intensity));
    const a = 0.25 * i, b = 0.35 * i;
    return `
    radial-gradient(120% 100% at 10% 0%, rgba(80,60,20,${a}) 0%, rgba(0,0,0,0) 50%),
    radial-gradient(140% 120% at 90% 10%, rgba(60,40,15,${a}) 0%, rgba(0,0,0,0) 55%),
    radial-gradient(140% 130% at 50% 100%, rgba(90,70,30,${b}) 0%, rgba(0,0,0,0) 60%),
    linear-gradient(180deg, rgba(255,245,220,1) 0%, rgba(244,232,200,1) 50%, rgba(236,221,190,1) 100%),
    repeating-linear-gradient(180deg, rgba(0,0,0,${0.03 * i}) 0 1px, transparent 1px 3px)
  `;
}

export const mm = (n: number) => `${n}mm`;
export const mmNum = (n: number) => n;

export function fancyCoverFallback() {
    return `
    radial-gradient(60% 80% at 20% 20%, rgba(255, 230, 180, .7), rgba(0,0,0,0) 60%),
    radial-gradient(50% 70% at 80% 30%, rgba(255, 210, 140, .6), rgba(0,0,0,0) 60%),
    radial-gradient(120% 140% at 50% 100%, rgba(140, 90, 20, .35), rgba(0,0,0,0) 60%),
    linear-gradient(135deg, #654321 0%, #3b2716 50%, #1c120a 100%)
  `;
}