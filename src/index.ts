import * as joi from "joi";
import "reflect-metadata";

export namespace Forms {
    interface Common {
        required?: boolean;
        disabled?: boolean;
        default_value?: any;
        widget?: string;
        placeholder?: string;
        tooltip?: string;
    }

    const schemaSymbol = Symbol("Joi object schema");
    type Omit<T, K> = { [P in Exclude<keyof T, K>]: T[P] };
    type OptionalKeys<T> = { [key in keyof T]?: T[key] };
    type FormData<T> = OptionalKeys<Omit<T, keyof BaseForm<any>>>;
    export class BaseForm<T extends BaseForm<T>> extends class {
        public [schemaSymbol]: joi.ObjectSchema;
    } {
        public static getValidationSchema(): joi.ObjectSchema {
            return this.prototype[schemaSymbol];
        }

        public static getUISchema(): Common[] {
            return getSchema(this);
        }

        constructor(data: FormData<T>) {
            super();
            const validate = this.validate;
            Object.assign(this, { ...this, ...data });
        }

        public validate(options: joi.ValidationOptions = {}): Promise<this> {
            return new Promise((resolve, reject) => {
                const schema = (this as any)[schemaSymbol] as joi.ObjectSchema;
                schema.validate(this, options, (error, value) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(value);
                });
            });
        }
    }

    function isValidatorClass(target: any): target is typeof BaseForm {
        if (!target) {
            return false;
        }
        if (
            target[schemaSymbol] ||
            (target.prototype && target.prototype[schemaSymbol])
        ) {
            return true;
        }
        return false;
    }

    function getObjectSchema(target: any): joi.Schema {
        if (isValidatorClass(target)) {
            return target.getValidationSchema();
        }
        return joi.optional();
    }

    export interface Options<T> {
        view_value: string;
        value: T;
    }

    export function getSchema(target: any) {
        if (isForm(target)) {
            return (target as any).prototype[formSchemSymbol].map(
                (func: () => any) => func()
            );
        }
    }

    export type AdminInterface<T> = { [name in keyof T]?: T[name] };
    const formSchemSymbol = Symbol("Ui form schema");
    const getSchemaFuncSymbol = Symbol("Ui form schema");
    interface Form {
        [formSchemSymbol]: Array<() => any>;
        [getSchemaFuncSymbol]: () => any;
    }

    function addToPrototype(cls: any, data: any) {
        makeForm(cls);
        if (isForm(cls)) {
            cls[formSchemSymbol].push(data);
        }
    }

    function makeForm(target: any) {
        if (!Boolean(target[formSchemSymbol])) {
            target[formSchemSymbol] = [];
        }
    }

    export function isForm(target: any): target is Form {
        return (
            Boolean(target[formSchemSymbol]) ||
            (target.prototype && target.prototype[formSchemSymbol])
        );
    }

    export function Form<T extends Function>(target: T) {
        if (isValidatorClass(target)) {
            // Create joi object schema if validators are provided
            target.prototype[schemaSymbol] = joi.object(
                target.prototype[schemaSymbol]
            );
            target.getValidationSchema = BaseForm.getValidationSchema;
            target.getUISchema = BaseForm.getUISchema;
            target.prototype.validate = BaseForm.prototype.validate;
        }
        if (isForm(target)) {
            target.prototype[getSchemaFuncSymbol] = () => {
                return target.prototype[formSchemSymbol].map(
                    (func: () => any) => func()
                ) as any;
            };
        } else {
            throw new Error("Form with no fields");
        }

        return target;
    }

    function addJoiSchema(
        target: any,
        propertyKey: string | symbol,
        predicate: (validator: typeof joi) => joi.Schema | undefined
    ) {
        if (!target[schemaSymbol]) {
            Object.defineProperty(target, schemaSymbol, {
                writable: true,
                value: {}
            });
        }
        const schema = predicate(joi);
        if (schema) {
            target[schemaSymbol][propertyKey] = schema;
        } else {
            target[schemaSymbol][propertyKey] = joi.optional();
        }
    }
    function WrapValidator<T extends PropertyDecorator>(func: T) {
        const optionalValidationWrapper = (
            target: any,
            propertyKey: string | symbol
        ) => {
            addJoiSchema(target, propertyKey, e => e.optional());
            func(target, propertyKey);
        };
        const validatorFunc = (
            predicate: (value: typeof joi) => joi.Schema
        ) => {
            return (target: any, propertyKey: string | symbol) => {
                optionalValidationWrapper(target, propertyKey);
                addJoiSchema(target, propertyKey, predicate);
            };
        };
        (optionalValidationWrapper as any).Validate = validatorFunc;
        return optionalValidationWrapper as T & {
            Validate: typeof validatorFunc;
        };
    }

    export function Validate(predicate: (value: typeof joi) => joi.Schema) {
        return (target: any, propertyKey: string | symbol) => {
            addJoiSchema(target, propertyKey, predicate);
        };
    }

    export function Input(
        args: {
            dtype?: "text" | "number" | "email";
            max_length?: number;
            min_length?: number;
        } & Common = { dtype: "text" }
    ) {
        return WrapValidator(<T>(target: T, propertyKey: string | symbol) => {
            addToPrototype(target, () => ({
                key: propertyKey,
                type: "input",
                ...args,
                input_type: args.dtype || "text"
            }));
        });
    }

    export function Custom({ widget }: Common) {
        return WrapValidator(<T>(target: T, propertyKey: string | symbol) => {
            addToPrototype(target, () => ({
                key: propertyKey,
                type: "custom",
                widget: widget
            }));
        });
    }

    export function List({
        required,
        default_value,
        disabled,
        listof,
        max_length,
        min_length,
        widget,
        placeholder
    }: {
        listof: () => any;
        max_length?: number;
        min_length?: number;
    } & Common) {
        return <T>(target: T, propertyKey: string | symbol) => {
            const listItem = listof();
            const schema = getObjectSchema(listItem);
            if (schema) {
                addJoiSchema(target, propertyKey, e =>
                    joi.array().items(schema)
                );
            } else {
                addJoiSchema(target, propertyKey, e => joi.array());
            }
            addToPrototype(target, () => {
                return {
                    required: required,
                    key: propertyKey,
                    type: "list",
                    listof: getSchema(listItem),
                    disabled: disabled,
                    default: default_value || propertyKey,
                    max_length: max_length,
                    min_length: min_length,
                    widget: widget,
                    placeholder: placeholder
                };
            });
        };
    }

    export function Timestamp(args: { range?: boolean } & Common = {}) {
        return WrapValidator(<T>(target: T, propertyKey: string | symbol) => {
            addToPrototype(target, () => ({
                key: propertyKey,
                type: "timestamp",
                ...args
            }));
        });
    }

    export function Select<T = any>(
        args: { options: Array<Options<T>> } & Common
    ) {
        return WrapValidator(<T>(target: T, propertyKey: string | symbol) => {
            addJoiSchema(target, propertyKey, e =>
                e.valid(args.options.map(e => e.value))
            );
            addToPrototype(target, () => ({
                key: propertyKey,
                type: "select",
                ...args
            }));
        });
    }

    export function File(
        args: { file_types: string[]; upload_url?: string } & Common = {
            file_types: []
        }
    ) {
        return WrapValidator(<T>(target: T, propertyKey: string | symbol) => {
            addToPrototype(target, () => ({
                key: propertyKey,
                type: "file",
                ...args
            }));
        });
    }

    /**
     * Renders branch based on value of branchKey
     */
    export function Branch<T>({
        branch_key,
        branches
    }: {
        branch_key: keyof T;
        branches: () => { [name: string]: any };
    }) {
        return <T>(target: T, propertyKey: string | symbol) => {
            const processedBranches: any = {};
            let schema: any = joi.valid("nothing");
            Object.keys(branches()).forEach((branchName: string) => {
                const branch = branches()[branchName];
                const then = getObjectSchema(branch);
                schema = joi.when(branch_key as string, {
                    is: branchName,
                    then: then,
                    otherwise: schema
                });

                processedBranches[branchName] = getSchema(branch);
            });
            if (schema) {
                addJoiSchema(target, propertyKey, e => e.required());
            } else {
                addJoiSchema(target, propertyKey, e => e.optional());
            }
            addToPrototype(target, () => ({
                branch_key: branch_key,
                branches: processedBranches,
                key: propertyKey,
                type: "branch"
            }));
        };
    }

    export function SubSchema({
        schema,
        widget
    }: {
        schema: any;
        widget?: any;
    }) {
        return <T>(target: T, propertyKey: string | symbol) => {
            addToPrototype(target, () => ({
                key: propertyKey,
                schema: getSchema(schema),
                widget: widget,
                type: "subtype"
            }));
            addJoiSchema(target, propertyKey, e => getObjectSchema(schema));
        };
    }
}
