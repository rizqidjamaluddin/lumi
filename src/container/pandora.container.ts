import {Container} from "./container";
import {Binding} from "./bindings/binding";
import {ClassReferenceBinding} from "./bindings/class-reference.binding";
import {BindingNotFoundException} from "./support/binding-not-found.exception";

export class PandoraContainer implements Container {

    protected bindings: {[key: string]: Binding} = {};
    protected hooks: {[bindingName: string]: Array<Function>} = {};

    public bind(reference: Function, key?: string): ClassReferenceBinding {
        if (!key) {
            key = reference.name;
        }
        return this.bindings[key] = new ClassReferenceBinding(reference);
    }

    public factory(factory: Function, key?: string): this {
        return this;
    }

    public singleton(instance: Object, key?: string): this {
        return this;
    }

    public applyBinding(binding: Binding, key: string): this {
        this.bindings[key] = binding;
        return this;
    }

    public get<T>(givenKey: string|Function): T {
        let key: string = this.normalizeClassBindingName(givenKey);
        let result: any;
        if (key in this.bindings) {
            result = this.bindings[key].get(this);
        } else {
            if (givenKey instanceof Function) {
                result = new (<any> givenKey);
            } else {
                throw new BindingNotFoundException(key);
            }
        }
        if (key in this.hooks) {
            for (let callback of this.hooks[key]) {
                callback(result);
            }
        }
        return result;
    }

    public when(key: string|Function, callback: Function): this {
        key = this.normalizeClassBindingName(key);
        if (!(key in this.hooks)) this.hooks[key] = [];
        this.hooks[key].push(callback);
        return this;
    }

    protected normalizeClassBindingName (bindingName: string|Function): string {
        return bindingName instanceof Function ? bindingName.name : bindingName;
    }

}