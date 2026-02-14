---
layout: note
title: "Term"
---

**Term** is the most **basic unit** or **operand** within a programming language expression. It represents a single, static value or a straightforward way to access one.

- **Key Property:** It **already is a value** or a straightforward way to access one.
    
- **Examples:** Literals (numbers, strings), variables, or a parenthesized sub-expression.

## Examples

| Category                          | Description                                                     | C++ example              | Lisp example             | Prolog example               |
| --------------------------------- | --------------------------------------------------------------- | ------------------------ | ------------------------ | ---------------------------- |
| **Literals**                      | Fixed, constant values.                                         | `100`, `"hello"`, `3.14` | `100`, `"hello"`, `3.14` | `100`, `hello` (atom)        |
| **Variables**                     | Named storage locations.                                        | `x`, `user_count`        | `x`, `user-count`        | `X`, `Y` (variables)         |
| **Function Calls**                | If the call returns a value directly.                           | `get_time()`             | `(get-time)`             | *Arithmetic only:* `sin(90)` |


## Why is it useful

### 1. Establishes Parsing Rules
The language grammar needs to distinguish between atomic values and composite operations. Without a clear term definition, the parser wouldn't know where expressions begin and end
### 2. Enables Operator Precedence 
Terms are used for precedence hierarchies. By defining what is an indivisible unit, the language can build up layers of operators with different precedence. 
In C++, without understanding terms, even `x+++y` becomes ambiguous (is it `x++ + y` or `x + ++y`?).

### 3. Type Checking Boundaries
Type systems need to know what units to check. Terms are where types originate—a literal has a type, a variable has a type. Expressions then propagate and validate these types through operations.

## How does it correspond with AST?
- The term/expression hierarchy directly shapes the [abstract syntax tree](/notes/abstract-syntax-tree/) (AST).
	- Term nodes are the leaves of AST.
	- expression nodes are the internal operations. 
	- This ensures the internal representation accurately reflects the intended computation order.
This can remove ambiguity of programs 

## Relation to expression
- $\text{term} + \text{ operator } + \text{term} = \text{ expression}$ 
- every Term is a trivial expression, as it evaluates to itself. 
- expression necessarily involves an operation (e.g., addition, comparison, function application), term doesn't