## [Forms-Annotation] Beautiful code is what I seek.
<span class="badge-npmversion"><a href="https://www.npmjs.com/package/@junaid1460/forms-annotations" title="View this project on NPM"><img src="https://img.shields.io/npm/v/@junaid1460/forms-annotations.svg" alt="NPM version" /></a></span>

```shell

npm i @junaid1460/forms-annotations
```

### Requirements
typescript 3 (es6)

### Usage

```typescript
import { Forms } from '.';


@Forms.Form
class ActionButton  {
    @Forms.Input().Validate(e => e.string().required())
    public action: string;
}
@Forms.Form
class AnotherForm  {

    @Forms.Input().Validate(e => e.string().required())
    public label?:  string;
}

// Customize
const RequiredText = () => Forms.Input().Validate(e => e.string().required())
@Forms.Form
class MyForm extends Forms.BaseForm<MyForm> {

    @RequiredText()
    name?: any

    @Forms.Input({dtype: "email"})
    @Forms.Validate(e => e.string().required())
    email: string

    @Forms.Select({
        options: [{
            value: "values",
            view_value: "sdfsdf"
        }, {
            value: "another",
            view_value: ""
        }]
    })
    options?: any

    @Forms.Branch<MyForm>({
        branch_key: "options",
        branches:() => ({
            values: ActionButton,
            another: AnotherForm
        })
    })
    test?: any

    @Forms.SubSchema({schema: AnotherForm})
    value: AnotherForm;
}


const data= new MyForm({
    email: 'junaid1460@gmail.com',
    name: "junaid",
    options: "values",
    test: {
        label: "My label"
    },
    value: {
        label: "Hello world"
    } 
})

console.log(data.validate().then(e => console.log(e)))
console.log(MyForm.getValidationSchema())
console.log(MyForm.getUISchema())
console.log(data)


/**

    example.ts:65
    internals.Object {isJoi: true, _currentJoi: module.exports.internals.Any, _type: "object", _settings: null, _baseType: undefined, …}
    example.ts:66
    Array(5) [Object, Object, Object, Object, Object]
    example.ts:67
    MyForm {email: "Test", name: "he", options: "values", test: Object, value: Object}
    example.ts:68
    (node:6365) UnhandledPromiseRejectionWarning: ValidationError: child "test" fails because [child "action" fails because ["action" is required]]
        at Object.exports.process (/Users/muhammadjunaid/loco/forms-annotations/node_modules/joi/lib/errors.js:203:19)
        at internals.Object._validateWithOptions (/Users/muhammadjunaid/loco/forms-annotations/node_modules/joi/lib/types/any/index.js:764:31)
        at internals.Object.validate (/Users/muhammadjunaid/loco/forms-annotations/node_modules/joi/lib/types/any/index.js:798:21)
        at validate.Promise (/Users/muhammadjunaid/loco/forms-annotations/src/index.ts:31:23)
        at new Promise (<anonymous>)
        at MyForm.validate (/Users/muhammadjunaid/loco/forms-annotations/src/index.ts:29:20)
        at Object.<anonymous> (/Users/muhammadjunaid/loco/forms-annotations/src/example.ts:65:18)
        at Module._compile (internal/modules/cjs/loader.js:773:14)
        at Object.Module._extensions..js (internal/modules/cjs/loader.js:787:10)
        at Module.load (internal/modules/cjs/loader.js:653:32)
    warning.js:18

 */

```