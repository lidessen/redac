type Setter<T> = (...args: T) => void
type Getter<T> = () => T

const SUB = Symbol('sub')

function redac<T, P, S extends Setter<T>, R extends Getter<P>>(setter: S, getter: R) {
    const listeners = new Set()
    const _setter: R = (...args) => {
        setter(...args)
    }
    Object.defineProperty(getter, SUB, {
        get() {
            return (fn) => {
                listeners.add(fn)
                return () => listeners.delete(fn)
            }
        },
    })
    return [setter, getter]
}

type Observable<T> = T & {
    [SUB]: (fn) => () => void
}

function isObservable<T>(o: T): o is Observable<T> {
    return Object.prototype.hasOwnProperty.call(o, SUB)
}

function watch<T>(o: T, fn: (val: T) => void) {
    if(isObservable(o)) {
        return o[SUB](fn)
    }
    return () => {}
}
