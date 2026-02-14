It allows you to provide different implementations for specific patterns of template arguments.

We have two types of c++ template specialization:

## 1. Partial Specialization (Pattern Matching)
This is when you specialize a template for a *pattern* of arguments, leaving some template parameters generic.

```c++ 
// Primary template (generic default) 
template <typename T> struct Example; 

// Partial Specialization for the Pointers (T*) 
template <typename T> struct Example<T*> { 
	// Different implementation for pointer types 
};
```
This is often called template pattern matching and is a powerful tool for inspecting types at compile time. It provides a primitive form of pattern matching for the c++ type system.

## 2. Full (Explicit) Specialization
This is when you provide an implementation for one **specific, concrete type**, fixing _all_ template parameters.
```c++
// Primary template (generic default)
template <typename T> struct Example { 
    // Generic implementation 
}; 

// Full Specialization for the concrete type 'int'
template <> struct Example<int> { 
 	// Implementation specifically for 'Example<int>' 
};
```

## Why use it?
Understanding the _why_ helps solidify the concept.

- **Performance/Efficiency:** Providing a faster or more memory-efficient implementation for certain types (e.g., using a C-style array operation for `char*` instead of a generic loop).

- **Unavailable Operations:** If the generic implementation relies on an operation that a specific type doesn't support, a specialization can provide an alternative approach.
    
- **Type Trait Implementation:** Template specialization is the foundation for most c++ type traits (like `std::is_pointer<T>`), which allow you to query properties of types at compile time.