import { redac } from "./mod.ts"

let a = 0
let b = 0

const fa = () => a++
const fb = (n: number) => a+=b

const [mfa, $a] = redac(fa, () => a)
const [mfb, $b] = redac(fb, () => b)