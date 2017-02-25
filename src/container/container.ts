import {ClassReferenceBinding} from "./bindings/class-reference.binding";
import {Binding} from "./bindings/binding";
export interface Container {

    bind(reference: Function, key?: string): ClassReferenceBinding;

    factory(factory: Function, key?: string): this;

    singleton(instance: Object, key?: string): this;

    applyBinding(binding: Binding, key: String): this;

    get<T>(key: string|Function): T;

    when(key: string|Function, callback: Function): this;
}