export class Subscription {
    fnSet = new Set<() => void>()

    add(fn: () => void) {
        this.fnSet.add(fn)
    }

    dispose() {
        const fns = [...this.fnSet]
        this.fnSet.clear()
        fns.forEach(fn => fn())
    }
}