import {Binding} from "./binding";
import {Container} from "../container";
import * as _ from "lodash";
import {injectionMetadataKey} from "../inject";

export class ClassReferenceBinding extends Binding {

    protected cache: any|undefined;
    protected injections: Array<string|Function|null> = [];
    protected evaluated: boolean = false;

    constructor(protected reference: any) {
        super();
    }

    using(dependencies: Array<string|Function|null>)
    using(firstDependency: string|Function|null, ... moreDependencies: Array<string|Function|null>)
    using(dependencies: Array<string|Function|null>|string|Function|null, ... moreDependencies: Array<string|Function|null>): this {
        if(dependencies instanceof Array) {
            // arguments in array, discard rest
            this.injections = dependencies;
        } else {
            moreDependencies.unshift(dependencies);
            this.injections = moreDependencies;
        }
        return this;
    }

    get(container: Container): any {
        // only merge metadata injections once
        if (!this.evaluated) this.mergeMetadataInjections();
        if (this.shared) {
            if (this.cache) {
                return this.cache;
            } else {
                this.cache = this.buildInstance(container);
                return this.cache;
            }
        } else {
            return this.buildInstance(container);
        }
    }

    protected buildInstance(container: Container): any {
        return new this.reference(... this.injections.map(injection => {
            return injection == null ? null : container.get(injection);
        }));
    }

    protected mergeMetadataInjections () {
        const metadata = <Array<string|Function>>Reflect.getMetadata(injectionMetadataKey, this.reference);
        if (metadata && metadata.length > 0) {
            // we'll merge metadata/decorator injections on top of user-defined injections; users have priority
            let combinedInjections: Array<string|Function|null> = [];
            let counter = 0;
            while(true) {
                // break if neither injections nor metadata have any more arguments
                if (!(counter in this.injections) && !(counter in metadata)) break;
                // use metadata injection first if available
                if (counter in metadata && metadata[counter] != null){
                    combinedInjections[counter] = metadata[counter];
                }
                if (counter in this.injections && this.injections[counter] != null){
                    combinedInjections[counter] = this.injections[counter];
                }
                counter++;
            }
            this.injections = combinedInjections;
        }
        this.evaluated = true;
    }
}