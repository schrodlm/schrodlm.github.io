---
layout: note
title: "c++ template meta-programming"
---

Template meta-programming in C++ is as far as I understand it completely different concept from actually programming in C++. I want to showcase several of it's important concepts. From my experience they are best understood on an example:

I want to introduce a compile-time utility for manipulating lists of types.
```c++
template <typename... T>
struct TypeList;

template <typename... Lists>
struct TypeListConcatImpl;
  
template <typename List>
struct TypeListConcatImpl<List> {
	using R = List;
};

template <typename... T1, typename... T2, typename... Rest>
struct TypeListConcatImpl<TypeList<T1...>, TypeList<T2...>, Rest...> {
	using R = TypeListConcatImpl<TypeList<T1..., T2...>, Rest...>::R;
};

/// Concatenates TypeList<A, B>, Typelist<C, D>, Typelist<E> -> TypeList<A, B, C, D, E>
template <typename... Lists>
using TypeListConcat = TypeListConcatImpl<Lists...>::R;

template <typename... T>
struct TypeList {
	static constexpr size_t size = sizeof...(T);
}
```
Now what this code allows is for example this:
```c++
using Numbers = TypeList<int, float, long>;
using Chars = TypeList<char>;
using Bools = TypeList<bool>;
using All = TypeListConcat<Numbers, Chars, Bools>;

std::cout << "Size of All: " << All::size << std::endl;
```
## Concepts
Okay, how does it work and what concepts does it use?

Let's start from the first line, `TypeList<int, float, long>`. You generate something called a [c++ parameter pack](/notes/c-parameter-pack/). It can hold zero or more type parameters. This is basic templating usage, the interesting things happen when we want to concatenate.

Let's look at `using All = TypeListConcat<Numbers, Chars, Bools>` and keep in mind that this is done in compile-time.

We will create a new `TypeListConcat` with the template `<TypeList<int, float, long>, TypeList<char>, TypeList<bool>>`(using names get resolved). Thanks to the `using` keyword this will in turn call our recursive compile-time construct.

```c++
//base case
template <typename List>
struct TypeListConcatImpl<List> {
	using R = List;
};

//recursive case
template <typename... T1, typename... T2, typename... Rest>
struct TypeListConcatImpl<TypeList<T1...>, TypeList<T2...>, Rest...> {
	using R = TypeListConcatImpl<TypeList<T1..., T2...>, Rest...>::R;
};
```
This uses a concept called [c++ template specialization](/notes/c-template-specialization/) and an idea of recursion. It basically tries to pattern match (partial specialization) the arguments to either the recursive case or the base case. If we pattern match to the recursive case, we glue together the first two arguments and recurse again, until we reach the base case where the list is completely concatenated.

### Pattern Matching Details

When the compiler sees `TypeListConcatImpl<TypeList<int, float, long>, TypeList<char>, TypeList<bool>>`, it matches against the recursive case pattern:
```c++
TypeListConcatImpl<TypeList<T1...>, TypeList<T2...>, Rest...>
```
The compiler **deduces**:
- `T1... = int, float, long` (contents extracted from first TypeList)
- `T2... = char` (contents extracted from second TypeList)
- `Rest... = TypeList<bool>` (remaining arguments)
- 
Then it creates: `TypeListConcatImpl<TypeList<int, float, long, char>, TypeList<bool>>::R`

The recursion continues until only one TypeList remains, matching the base case.

## How does it work at compile time?
Template meta-programming operates entirely during compilation through a process called c++ template instantiation.