import * as joi from 'joi';

export namespace Forms {
    interface Common {
        required?: boolean;
        disabled?: boolean;
        default_value?: any;
        widget?: string;
        placeholder?: string;
        tooltip?: string;
    }

    const schemaSymbol=  Symbol("Joi object schema")
    type Omit<T, K> = { [P in Exclude<keyof T, K>]: T[P]; }
    type FormData<T> = Omit<T, keyof BaseForm<any>>
    export class BaseForm<T extends BaseForm<T>> {

        static getValidationSchema(): joi.ObjectSchema  {
            return (this.prototype as any)[schemaSymbol]
        }

        static getUISchema(): Common[]  {
            return getSchema(this)
        }
        
        validate(): Promise<this> {
            return new Promise((resolve, reject) => {
               const schema = ( this as any)[schemaSymbol] as joi.ObjectSchema;
               schema.validate(this, {}, (error, value) =>  {
                   if(error) {
                       return reject(error)
                   }
                   resolve(value)
               })
            })
        }

        constructor(data : FormData<T>) {
            const validate = this.validate
            Object.assign(this, {...this, ...data, })
        }
    }



    export interface Options<T> {
        view_value: string;
        value: T;
    }

    export function getSchema(target: any) {
        if (isForm(target)) {
            return (target as any).prototype.___formSchema.map((func: () => any) => func());
        }
    }

    export type AdminInterface<T> = { [name in keyof T]?: T[name] };

    interface Form {
        ___formSchema: Array<() => any>;
        ___getSchema(): () => any;
    }

    function addToPrototype(cls: any, data: any) {
        makeForm(cls);
        if (isForm(cls)) {
            cls.___formSchema.push(data);
        }
    }

    function makeForm(target: any) {
        if (!Boolean(target.___formSchema)) {
            target.___formSchema = [];
        }
    }

    export function isForm(target: any): target is Form {
        return Boolean(target.___formSchema) || (target.prototype && target.prototype.___formSchema);
    }

    export function Form<T extends any>(target: T) {
        if (isForm(target)) {
            (target as any).prototype!.___getSchema = () => {
                return (target as any).prototype.___formSchema.map((func: () => any) => func()) as any;
            };
            if(target.prototype[schemaSymbol]) {
                // Create joi object schema if validators are provided
                target.prototype[schemaSymbol] = joi.object(target.prototype[schemaSymbol] )
            }
        } else {
            throw new Error("Form with no fields");
        }
        return target;
    }

    function addJoiSchema(target: any, propertyKey: string|symbol, predicate: (validator: typeof joi) => joi.Schema) {
        if(!target[schemaSymbol]) {
            Object.defineProperty(target, schemaSymbol, {
                writable: true,
                value:  {}
            });
        }
        target[schemaSymbol][propertyKey] = predicate(joi)
    }
    function WrapValidator<T extends PropertyDecorator>(func: T) {
        const validatorFunc  = (predicate: (value:typeof joi) => joi.Schema) => {
            return (target: any, propertyKey: string | symbol) => {
                func(target, propertyKey)
                addJoiSchema(target, propertyKey, predicate)
            }
        }
        (func as any).Validate = validatorFunc;
        return func as T & {Validate: typeof validatorFunc }
    }

    export function Validate(predicate: (value:typeof joi) => joi.Schema) {
        return (target: any, propertyKey: string | symbol) => {
            addJoiSchema(target, propertyKey, predicate)
        }
    } 


    export function Input(args: {
                dtype?: "text" | "number" | "email", 
                max_length?: number, 
                min_length?: number, 
            } & Common  = {dtype: 'text'}) {
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
                widget: widget,
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
        placeholder,

    }: { listof: () => any, max_length?: number, min_length?: number } & Common) {
        return WrapValidator(<T>(target: T, propertyKey: string | symbol) => {
            addToPrototype(target, () => {
                const listItem = listof();
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
        });
    }

    export function Timestamp(args: {range? : boolean} & Common={}) {
        return WrapValidator(<T>(target: T, propertyKey: string | symbol) => {
            addToPrototype(target, () => ({
                key: propertyKey,
                type: "timestamp",
                ...args
            }));
        });
    }

    export function Select<T=any>(args: { options: Array<Options<T>> } & Common) {
        return WrapValidator(<T>(target: T, propertyKey: string | symbol) => {
            addToPrototype(target, () => ({
                key: propertyKey,
                type: "select",
                ...args
            }));
        });
    }

    export function Radio<T=any>(args: { options: Options<T>[] } & Common ) {
        return WrapValidator(<T>(target: T, propertyKey: string | symbol) => {
            addToPrototype(target, () => ({
                key: propertyKey,
                type: "radio",
                ...args
            }));
        });
    }


    export function File(args: {file_types:string[], upload_url?: string} &  Common = {file_types: []} ) {
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
    export function Branch<T>({ branch_key, branches }: { branch_key: keyof T; branches: () => { [name: string]: any } }) {
        return WrapValidator(<T>(target: T, propertyKey: string | symbol) => {
            const processedBranches: any = {};
            Object.keys(branches()).forEach((e: string) => {
                const branch = branches()[e];
                processedBranches[e] = getSchema(branch);
            });
            addToPrototype(target, () => ({
                branch_key: branch_key,
                branches: processedBranches,
                key: propertyKey,
                type: "branch",
            }));
        });
    }

    export function SubSchema({ schema, widget }: { schema: any; widget?: any }) {
        return WrapValidator(<T>(target: T, propertyKey: string | symbol) => {
            addToPrototype(target, () => ({
                key: propertyKey,
                schema: getSchema(schema),
                widget: widget,
                type: "subtype",
            }));
        });
    }
}
