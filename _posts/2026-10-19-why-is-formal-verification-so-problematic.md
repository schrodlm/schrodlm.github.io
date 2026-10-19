---
layout: post
title: "Why is formal verification so problematic"
date: 2026-10-19
categories: jekyll update
---
> This is my interpretation of, and a sort of skim through, an influential paper by Richard DeMillo, Richard Lipton and Alan Perlis titled "*Social Processes and Proofs of Theorems and Programs*".
> In my opinion, this paper is becoming extremely relevant again in the new age of AI.

## Proofs and what they represent
Formal verification will not play the same role in programming as proof does in mathematics.

In mathematics, the device used to establish correctness COULD theoretically be a long chain of formal logic, but the authors argue that mathematicians actually use **proofs**.

A proof is not what the name suggests: it is not a definitive guarantee that an idea is correct. A proof is considered definitive only once it has gone through a social process:

1. **Peer review and debate**

   A mathematician writes a proof draft: a document that builds on axioms and already accepted results to derive some new fact. It is then presented to the community.

2. **Internalization and simplification**

   Other mathematicians read it, try to understand it and simplify the steps.

3. **Application of the theorem**

   Over time, people build on top of the theorem. The more it is used, the more confidence in it grows.

### Why?
The authors cite Bertrand Russell and his (and Whitehead's) *Principia Mathematica* as both the magnum opus of the formalist view of mathematics and its deathblow.

Russell was able to show that proofs can be reduced to formal, symbolic deductions, but he failed to get beyond the elementary facts of arithmetic. In effect, he showed that it can't be done in practice.

### The chosen few theorems
One point the authors make is that roughly 200,000 theorems are published every year (god knows how many are being published with AI assistance nowadays), and only a few of them come to be understood and believed by sizable groups of mathematicians. The rest are discredited or forgotten.

### Mathematicians make errors in proofs
Errors are present in a huge number of papers originally presented as proofs, even ones by famous mathematicians. The authors list a few famous examples and make the point that mathematicians' errors are found and corrected not by formal logic, but by other mathematicians.

### Closing note on proofs
This whole first half of the paper is meant to free readers who are not steeped in mathematics from the delusion that proofs are absolute truths. They are not. Thinking back on what I learned about proofs at university, I can confidently agree with the authors.

## How this maps onto software
The same social mechanisms that make proofs work doom any concept of a proof in software.

Software can, in theory, be formally verified, since programming is so Boolean in nature. But a verification can never go through the same process as a proof does, because verifications are unreadable: they can't acquire credibility gradually, and they can't be generalized, transformed or connected to other disciplines.

So the analogy that initially seemed very natural:

| Mathematics | Programming  |
| ----------- | ------------ |
| theorem     | program      |
| proof       | verification |

doesn't make much sense anymore. In a sense, the program itself works more like a proof than anything else. A program can actually go through the same social process as a proof, so the specification of the program is the natural analogue of the theorem:

| Mathematics                    | Programming   |
| ------------------------------ | ------------- |
| theorem                        | specification |
| proof                          | program       |
| imaginary formal demonstration | verification  |

We thus need to check that a program is consistent with its specification. This only has value if the specification and the program are derived independently. Imagine a programmer who writes a sloppy piece of code full of bugs and then, instead of describing what the app should do, writes a specification that describes what the app happens to do. Of course the code is going to match the specification.

The authors argue that this criterion is easily met in the toy-program environment of experimental verification, but not in practice. Specs change according to schedules. When a program fails, it is rewritten with knowledge of the verification. Simply put, real life is messier.

### The automatic verifiers of today
Today, automated verifiers exist. They use ideas from the theory of computation, transforming the problem into SAT or SMT formulas, so the need for other humans to check a verification is mostly gone. Still, formally verifying a piece of software is incredibly time-consuming, often nonsensical work, and it is reserved for only the most critical infrastructure.

In the authors' time, such technology did not exist, yet they tackled the idea of an automatic verifier and described it in a way that is remarkably close to what it is today:

> The programmer inserts his 300-line input/output package into the verifier. Several hours later, he returns. There is his 20,000-line verification and the message "*VERIFIED*."

The problem with this approach is that we now blindly believe something we can't really understand. This is referred to as the Titanic effect: "The severity with which a system fails is directly proportional to the intensity of the designer's belief that it cannot fail."

### Even more problems
Even if we squint as hard as we can and imagine an all-powerful automatic verifier that stamps a program "*VERIFIED*", what does the programmer really know? That it is logically correct. What about reliability and safety? They don't know within what limits it will work.

Imagine code for an automatic braking system that gets a "*VERIFIED*" stamp because the math proves: _When the pedal is pressed, the brakes engage._

- **What the programmer knows:** The code logic works.
- **What they don't know:** Whether the brakes will fail on **black ice**, or whether a **bald tire** will make the car slide anyway.

### The guts of a big software system
One defense of verification can be offered: the scaling-up argument.

> Big production systems are made up of nothing more than algorithms and model programs. Once verified, algorithms and model programs can make up large, workaday production systems, and the verification of a big system will be a sum of small, attractive verifications of its components.

The authors call this naive, and I have to agree. A software system is composed of countless patches, ad hoc constructions, hotfixes and angry docstrings. More than half of the code in any real production system is user interface — informal structures that are unverifiable by definition.

Such systems are also not really stable. The code keeps changing, and as we programmers know, it is very brittle: one small change can break the whole system. It is the most beautiful real-world showcase of the butterfly effect, and a daily occurrence for a lot of us.

### A perfect piece of code does not exist
Every engineer eventually comes to the conclusion that people can't create perfect mechanisms. What we can do is create reliable ones.

What does reliable mean? In the authors' words, it never means perfect:

> There is no way to deduce logically that bridges stand, or that airplanes fly, or that power stations deliver electricity. True, no bridges would fall, no airplanes would crash, no electrical systems black out if engineers would first demonstrate their perfection before building them - **true because they would never be built at all**.

### A reusable structure as a concept
With these ideas in mind, how can one help make programming more like engineering and mathematics — reliable? The 40+-year-old paper suggests we should introduce generalizations that build their reliability the same way proofs do: by people using them.

## The parallel with AI
Software engineers today can, if they wish, write only a description of the program and let the model take over.

In effect, this means creating a proof from an often poorly written and poorly thought-out specification. A proof not checked by a single person, trusted truly blindly. Blinder than ever before.

And remember that a specification only has value if it is derived independently of the program. When the same model writes the code, the tests and sometimes even the spec, that independence is gone. The code will always match the specification, because both describe what the app happens to do.

One could argue that AI can also produce formal, machine-checked proofs of its own code. But that just brings us back to the programmer with a 300-line program and a 20,000-line verification stamped "*VERIFIED*" that nobody will ever read. Same Titanic effect, now at scale.

I mentioned reusable structures. Libraries are a concept in a similar sense. We generally tend to trust libraries, because we believe they have been reviewed and critically thought about. Now they can be generated automatically, on a whim, from a poorly written prompt. How do we avoid the Titanic effect sooner or later? I am not sure.

What I fear is this: historically, we trusted software systems because they had been rigorously tested and vetted by thousands of eyes, either in-house (for closed-source projects) or by anyone (for open-source projects). AI threatens to replace this social process with instant code generation, giving us the illusion of functional software without any human ever understanding how or why it works.
