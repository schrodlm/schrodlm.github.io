---
layout: note
title: "type class pattern"
---

The main point of the type class pattern is to **add new functionality to existing code without modifying that code.**

It's a way to achieve compile-time [polymorphism](/notes/polymorphism/) that is more flexible and less invasive than inheritance.

It works by decoupling the data (like `class Person`) from the behaviors that act on it (like `toJson`).

## Comparison with typical approaches
In a traditional OOP approach, if you wanted to make several different classes "serializable" (like `JsonSerializer`), you would have two main options:
1. **Inheritance:** Make them all inherit from a `JsonSerializable` superclass.
2. **Interfaces:** Make them all implement a `JsonSerializable` interface.

### ## Key Benefits
- **1. Works on Code You Don't Own:** You can add functions to types you didn't write, like `String`, `Int`, or classes from an external library. (Inheritance can't do this).
- **2. Context-Specific Behavior:** You can have multiple implementations for the same type. For example, you could import `prettyJsonSerializer` in one place and `compactJsonSerializer` in another. (Inheritance locks you into one implementation).
- **3. Separation of Concerns:** Your data classes (like `Person`) stay simple and clean. They don't get bloated with methods from dozens of different behaviors (like `toJson`, `isEqual`, `toXml`, etc.).


### Languages that support it
It's enabled by two specific language features:
1. **Generics** (parametric polymorphism), e.g., `template <typename T>` or `trait JsonSerializer[T]`.
2. **Contextual Resolution** (a way for the compiler to find a type-based value in scope), e.g., C++ **[c++ template specialization](/notes/c-template-specialization/)** or Scala's **`given`/`using`** (implicits)
	- this provides more granular approach

## Examples
### Minimal example in C++
```c++
#include <iostream>
#include <string>

// 1. The Type Class (Trait)
// We define a generic template...
template <typename T>
struct Showable;

// 2. The Consumer (Function)
// This function relies on the specialized Showable<T> existing.
template <typename T>
void printThing(T x) {
  // 3. (Implicit) The Instance is "found" here!
  // The compiler looks for the specific specialization Showable<int>
  std::cout << Showable<T>::show(x) << std::endl;
}

// 3. The Instance (Given)
// ...and then we provide a concrete *specialization* for 'int'.
// This is the C++ equivalent of a 'given'.
template <>
struct Showable<int> {
  static std::string show(int x) {
    return "The Int is " + std::to_string(x);
  }
};

// 4. The Application
int main() {
  printThing(42); 
  // Output: The Int is 42
}
```

### JsonSerializer in Scala
```scala

trait JsonSerializer[T]:  
  def serialize(obj: T): String  
  
  extension (x: T)  
    def toJson: String = serialize(x)  
  
object JsonSerializer:  
  given stringSerializer: JsonSerializer[String] with  
    def serialize(s: String) = s"\"${s}\""  
  
  given intSerializer: JsonSerializer[Int] with  
    def serialize(s: Int) = s.toString()  
  
  given listSerializer[T](using JsonSerializer[T]): JsonSerializer[List[T]] with  
    def serialize(lst: List[T]) =  
      val lines = for (entry <- lst) yield {  
        val value = summon[JsonSerializer[T]].toJson(entry)  
        s"${value}"  
      }  
      lines.mkString("[",", ", "]");  
  
  given mapSerializer[T1, T2](using JsonSerializer[T1])(using JsonSerializer[T2]): JsonSerializer[Map[T1,T2]] with  
    override def serialize(m: Map[T1, T2]): String =  
      val lines = for ((k,v) <- m) yield {  
        s"${k.toJson}: ${v.toJson}"  
      }  
  
      lines.mkString("{",", ","}");  
  
class PhoneNo(val prefix: Int, val number: Int)  
  
object PhoneNo:  
    given JsonSerializer[PhoneNo] with  
      def serialize(p: PhoneNo) =  
        import JsonSerializer.given  
        s"""{"prefix": ${p.prefix.toJson}, "number": ${p.number.toJson}}"""  
  
class Person(val firstName: String, val lastName: String, val phone: PhoneNo)  
  given JsonSerializer[Person] with  
    def serialize(p: Person) =  
      import JsonSerializer.given  
      s"""{"firstName": ${p.firstName.toJson}, "lastName": ${p.lastName.toJson}, "phone:" ${p.phone.toJson}}"""  
  
class Address(val person: Person, val street: String, val city: String)  
  given JsonSerializer[Address] with  
    def serialize(a: Address) =  
      import JsonSerializer.given  
      s"""{"person": ${a.person.toJson}, "street": ${a.street.toJson}, "city": ${a.city.toJson}}"""  
  
  
object JsonSerializerTest:  
  def main(args: Array[String]): Unit =  
    import JsonSerializer.given  
    val a1 = "Hello"  
    println(a1.toJson) // "Hello"  
  
    val a2 = 12  
    println(a2.toJson) // 12  
  
    val b1 = List("ab", "cd")  
    val b2 = List("ef", "gh")  
    println(b1.toJson) // [ "ab", "cd" ]  
  
    val c1 = List(b1, b2)  
    println(c1.toJson) // [ [ "ab", "cd" ], [ "ef", "gh" ] ]  
  
    val c2 = Map("b1" -> b1, "b2" -> b2)  
    println(c2.toJson) // { "b1": [ "ab", "cd" ], "b2": [ "ef", "gh" ] }  
  
    val d1 = Person("John", "Doe", PhoneNo(1, 123456))  
    val d2 = Person("Jane", "X", PhoneNo(420, 345678))  
    println(d1.toJson) // { "firstName": "John", "lastName": "Doe", "phone": { "prefix": 1, "number": 123456 } }  
  
    val e1 = Address(d1, "Bugmore Lane 3", "Lerfourche")  
    val e2 = Address(d2, "West End Woods 1", "Holmefefer")  
  
    val f = List(e1, e2)  
    println(f.toJson)
```