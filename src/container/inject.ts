
import "reflect-metadata";

export const injectionMetadataKey = Symbol("inject-key");

export function inject(key: string|Function) {
    return (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
        let existingInjections: Array<string|Function> = Reflect.getOwnMetadata(injectionMetadataKey, target) || [];
        existingInjections[parameterIndex] = key;
        Reflect.defineMetadata(injectionMetadataKey, existingInjections, target);
    }
}