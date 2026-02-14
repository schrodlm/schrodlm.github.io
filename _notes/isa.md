---
layout: note
title: "isa"
---

Instruction set architecture (ISA) is an abstract model that serves as a interface between hardware and software.

It serves as a blueprint of manufacturers on what CPU design should look like. 
	This means that two processor with very different processor design techniques (microarchitectures) can **share a common ISA**.
	For example, the Intel Pentium and the AMD Athlon implement nearly identical versions of the x86 instruction set, but they have radically different internal designs.
	
Specific implementation of a ISA is called a **microarchitecture**. Keep in mind that it is not a hardware realization.
# What does ISA define
What exactly does ISA defines varies across different ISAs. In general you can assume that it defines:
1. **set of [machine instructions](/notes/machine-instruction/) of a processor**
	- `add`, `sub`, `mult`, `mov`, ...
2. supported data types
	- IEEE 754 floating point numbers, integers, ...
3. [addressing modes](/notes/addressing-modes/)
	- direct, indirect, 
4. set of registers (if it is not *stack-based ISA*)
	- number of registers, usecase and meaning of specific registers
5. memory organisation
	address space, byte ordering, consistency model
# Importance of the ISA
You can get the feeling this is an very important concept in computer architecture just by what it defines.As it was said before, ISA is a basically an interface between your hardware and your software. But what does this really mean? Let's explore this.

ISA is basically an only way that you can interact with hardware. To command the computer, you need to speak it's language and the instructions are the words of a computer language, in that sense ISA is it's whole vocabulary. It is the only way you can talk to your machine.
![Image](/assets/img/isa_as_an_interface.png)
## Abstraction hierarchy
![Image](/assets/img/abstraction_hierarchy.png)


## What problem does it solve?

### Compatibility and portability of software
ISA provides a standard interface between the hardware and software. It ensures that a software written for a particular ISA can run on any microprocessor that implements that ISA.
This compatibility allows softare developers to write applications that can be executed on a wide range of microprocessors without requiring significant modifications or recompilations.

### Software development
ISA defines the available instructions, [addressing modes](/notes/addressing-modes/) and data types that programmers use to write software. **It provides a high level abstraction of the underlying software**, so there is no need for developer to understand microprocessor's internal design.

### Performance optimization
ISA influences the performance of a microprocessor. The selection and design of instructions impact the execution speed, code density and efficiency of the processor.


## Examples of ISA used today
x86, ARM, RISC-V, AVR


# Taxonomy of ISA
![Image](/assets/img/Pasted image 20240924212540.png)