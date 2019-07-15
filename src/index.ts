export namespace Forms {
    interface Common {
        required?: boolean;
        disabled?: boolean;
        default_value?: any;
        widget?: string;
        placeholder?: string;
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

    export interface Form {
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

    export function Form<T>(target: T) {
        if (isForm(target)) {
            (target as any).prototype!.___getSchema = () => {
                return (target as any).prototype.___formSchema.map((func: () => any) => func()) as any;
            };
        } else {
            throw new Error("Form with no fields");
        }
        return target;
    }

    export function Input<T>(args: {
                dtype?: "text" | "number" | "email", 
                max_length?: number, 
                min_length?: number, 
            } & Common  = {dtype: 'text'}) {
        return (target: T, propertyKey: string | symbol) => {
            addToPrototype(target, () => ({
                key: propertyKey,
                type: "input",
                ...args,
                input_type: args.dtype || "text"
            }));
        };
    }

    export function Custom<T>({ widget }: { widget: string }) {
        return (target: T, propertyKey: string | symbol) => {
            addToPrototype(target, () => ({
                key: propertyKey,
                type: "custom",
                widget: widget,
            }));
        };
    }


    export function list<T>({
        required,
        default_value,
        disabled,
        listof,
        max_length,
        min_length,
        widget,
        placeholder,

    }: { listof: () => any, max_length?: number, min_length?: number } & Common) {
        return (target: T, propertyKey: string | symbol) => {
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
        };
    }

    export function Timestamp<T>(args: {range? : boolean} & Common={}) {
        return (target: T, propertyKey: string | symbol) => {
            addToPrototype(target, () => ({
                key: propertyKey,
                type: "timestamp",
                ...args
            }));
        };
    }

    export function Select<T>(args: { options: Array<Options<T>> } & Common) {
        return <T>(target: T, propertyKey: string | symbol) => {
            addToPrototype(target, () => ({
                key: propertyKey,
                type: "select",
                ...args
            }));
        };
    }

    export function Radio<T>(args: { options: Options<T>[] } & Common ) {
        return (target: T, propertyKey: string | symbol) => {
            addToPrototype(target, () => ({
                key: propertyKey,
                type: "radio",
                ...args
            }));
        };
    }


    export function File<T>(args: {file_types:string[], upload_url?: string} &  Common = {file_types: []} ) {
        return (target: T, propertyKey: string | symbol) => {
            addToPrototype(target, () => ({
                key: propertyKey,
                type: "file",
                ...args
            }));
        };
    }

    /**
     * Renders branch based on value of branchKey
     */
    export function Branch<T>({ branch_key, branches }: { branch_key: keyof T; branches: () => { [name: string]: any } }) {
        return <T>(target: T, propertyKey: string | symbol) => {
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
        };
    }

    export function SubSchema<T>({ schema, widget }: { schema: any; widget?: any }) {
        return (target: T, propertyKey: string | symbol) => {
            addToPrototype(target, () => ({
                key: propertyKey,
                schema: getSchema(schema),
                widget: widget,
                type: "subtype",
            }));
        };
    }
}
