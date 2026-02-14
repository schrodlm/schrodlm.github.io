A parameter pack (`typename... T`) can hold zero or more type parameters. It's the foundation of variadic templates.

```c++
template <typename... T> // T is a parameter pack 
struct Example; 

Example<int, float, double>; // T... = int, float, double 
Example<char>; // T... = char 
Example<>; // T... = (empty)
```