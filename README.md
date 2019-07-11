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

@Forms.form
class MyForm {

    @Forms.input()
    name: string

    @Forms.input({type: "email"})
    email: string
}

console.log(Forms.getSchema(MyForm))

/**
 * 
 * @example 
 * [ { required: undefined,
 *     key: 'name',
 *     type: 'input',
 *     value_type: 'text',
 *     disabled: undefined,
 *     default: 'name',
 *     max_length: undefined,
 *     min_length: undefined,
 *     widget: undefined },
 *   { required: undefined,
 *     key: 'email',
 *     type: 'input',
 *     value_type: 'email',
 *     disabled: undefined,
 *     default: 'email',
 *     max_length: undefined,
 *     min_length: undefined,
 *     widget: undefined } ]
 */

```