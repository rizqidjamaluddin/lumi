import {expect} from "chai";
import {PandoraContainer} from "../../src/container/pandora.container";
import {BindingNotFoundException} from "../../src/container/support/binding-not-found.exception";
import {Inject} from "../../src/container/inject";

export function start(): PandoraContainer {
    return new PandoraContainer;
}

export class Foo {
    public param = 0;
    check() {
        return true;
    }
}

export class FooExtension extends Foo {
}

export class Bar {
}

export class BarExtension extends Bar{
}

class FooParent {
    constructor(public child: Foo) {
    }
}

export class FooGrandparent {
    constructor(public child: FooParent) {
    }
}

export class FooDouble {
    constructor(public child1: Foo, public child2: Foo) {
    }
}


export class FooInjected {
    constructor(@Inject(Foo) public foo: Foo, @Inject(Bar) public bar: Bar) {
    }
}

describe('PandoraContainer', function () {
    it('throws an exception on a missing binding', function () {
        expect(() => {
            start().get('nonexistent')
        }).to.throw(BindingNotFoundException);
    });
    describe('> hooks', function () {
        it('can accept a building hook', function () {
            // building hooks allow SPs to do something upon registered classes when they're being built.
            // great for .on() handlers!
            const c = start();
            c.when(Foo, (foo: Foo) => {
                foo.param = 1;
            });
            expect(c.get<Foo>(Foo).param).to.equal(1);
        });
    });
    describe('#bind', function () {
        it('instantiates a class implicitly', function () {
            const c = start();
            expect(c.get<Foo>(Foo)).to.be.an.instanceOf(Foo);
        });
        it('can accept basic class reference bindings', function () {
            const c = start();
            c.bind(Foo, 'Foo');
            expect(c.get<Foo>('Foo')).to.be.an.instanceOf(Foo);
            expect(c.get<Foo>(Foo)).to.be.an.instanceOf(Foo);
        });
        it('assumes the reference class name as an implicit key', function () {
            const c = start();
            c.bind(Foo);
            expect(c.get<Foo>('Foo')).to.be.an.instanceOf(Foo);
            expect(c.get<Foo>(Foo)).to.be.an.instanceOf(Foo);
        });
        it('defaults to unshared', function () {
            const c = start();
            c.bind(Foo);
            let resultOne = c.get<Foo>(Foo);
            let resultTwo = c.get<Foo>(Foo);
            expect(resultOne).to.not.equal(resultTwo);
        });
        it('can be shared', function () {
            const c = start();
            c.bind(Foo).share();
            let resultOne = c.get<Foo>(Foo);
            let resultTwo = c.get<Foo>(Foo);
            expect(resultOne).to.equal(resultTwo);
        });
        it('lazy-loads instances', function () {
            class LazyLoader {
                public static instantiated: boolean = false;

                constructor() {
                    LazyLoader.instantiated = true;
                }
            }

            const c = start();
            c.bind(LazyLoader).share();
            expect(LazyLoader.instantiated).to.be.false;
            c.get<LazyLoader>(LazyLoader);
            expect(LazyLoader.instantiated).to.be.true;
        });
        it('can be shared post-binding', function () {
            const c = start();
            let binding = c.bind(Foo);
            let resultOne = c.get<Foo>(Foo);
            let resultTwo = c.get<Foo>(Foo);
            expect(resultOne).to.not.equal(resultTwo);
            binding.share();
            let resultThree = c.get<Foo>(Foo);
            let resultFour = c.get<Foo>(Foo);
            expect(resultThree).to.equal(resultFour);
        });
        it('can be overridden', function () {
            class Override {
            }
            const c = start();
            c.bind(Foo, 'binding');
            expect(c.get<Foo>('binding')).to.be.an.instanceOf(Foo);
            c.bind(Override, 'binding');
            expect(c.get<Override>('binding')).to.be.an.instanceOf(Override);
        });
        describe('> dependency injection', function () {
            it('can be given explicit bindings', function () {
                const c1 = start();
                c1.bind(Foo);
                c1.bind(FooParent).using(['Foo']);
                const resultOne = c1.get<FooParent>(FooParent);
                expect(resultOne).to.be.an.instanceof(FooParent);
                expect(resultOne.child).to.be.an.instanceof(Foo);
            });
            it('can be given class reference bindings', function () {
                const c = start();
                // c.bind(Foo);
                c.bind(FooParent).using([Foo]);
                const resultOne = c.get<FooParent>(FooParent);
                expect(resultOne).to.be.an.instanceof(FooParent);
                expect(resultOne.child).to.be.an.instanceof(Foo);
            });
            it('can use parameter decorator bindings', function () {
                const c = start();
                c.bind(Foo);
                c.bind(FooInjected);
                let result = c.get<FooInjected>(FooInjected);
                expect(result.foo).to.be.an.instanceof(Foo);
                expect(result.bar).to.be.an.instanceof(Bar); // test implicit binding here
            });
            it('prioritizes user-defined explicit bindings over decorators', function () {
                const c = start();
                c.bind(FooInjected).using([FooExtension, Bar]);
                let result = c.get<FooInjected>(FooInjected);
                expect(result.foo).to.be.an.instanceof(FooExtension);
                expect(result.bar).to.be.an.instanceof(Bar);
            });
            it('allows null in user-defined bindings to indicate to use decorator bindings instead', function () {
                const c = start();
                c.bind(FooInjected).using([null, BarExtension]);
                let result = c.get<FooInjected>(FooInjected);
                expect(result.foo).to.be.an.instanceof(Foo);
                expect(result.bar).to.be.an.instanceof(BarExtension);
            });
            it('respects shared bindings in children', function () {
                const c = start();
                c.bind(Foo).share();
                c.bind(FooParent).using([Foo]);
                expect(c.get<FooParent>(FooParent).child).to.equal(c.get<FooParent>(FooParent).child);
            });
            it('can handle multiple explicit bindings', function () {
                const c = start();
                c.bind(Foo);
                c.bind(FooDouble).using([Foo, Foo]);
                const result = c.get<FooDouble>(FooDouble);
                expect(result).to.be.an.instanceof(FooDouble);
                expect(result.child1).to.be.an.instanceof(Foo);
                expect(result.child2).to.be.an.instanceof(Foo);
            });
            it('can handle multiple explicit bindings as an argument list', function () {
                const c = start();
                c.bind(Foo);
                c.bind(FooDouble).using(Foo, Foo);
                const result = c.get<FooDouble>(FooDouble);
                expect(result).to.be.an.instanceof(FooDouble);
                expect(result.child1).to.be.an.instanceof(Foo);
                expect(result.child2).to.be.an.instanceof(Foo);
            });
            it('allows null when using an argument list', function () {
                const c = start();
                c.bind(FooInjected).using(null, BarExtension);
                let result = c.get<FooInjected>(FooInjected);
                expect(result.foo).to.be.an.instanceof(Foo);
                expect(result.bar).to.be.an.instanceof(BarExtension);
            });
            it('follows nested explicit bindings', function () {
                const c = start();
                c.bind(Foo);
                c.bind(FooParent).using([Foo]);
                c.bind(FooGrandparent).using([FooParent]);
                const result = c.get<FooGrandparent>(FooGrandparent);
                expect(result).to.be.an.instanceof(FooGrandparent);
                expect(result.child).to.be.an.instanceof(FooParent);
                expect(result.child.child).to.be.an.instanceof(Foo);
            });
            // todo: test support for interfaces
        });
    });
});