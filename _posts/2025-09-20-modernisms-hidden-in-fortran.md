---
layout: post
title: "Modernisms hidden in Fortran"
date: 20.9.2025
categories: jekyll update
---
Fortran is an old language, even the oldest. It was invented during times where tape machines ruled the world, yet some of the concepts it introduced were really ahead of the time and have been the template for a lot of the modern programming languages.

I would like to talk about one of these concepts I found during my crawl through the Fortran documentation.

The concept I want to discuss is a **lists of quantities** and **implied loops** it supported.

Fortran followed the standard I/O API still present in most languages developed today in the form of `READ` and `WRITE`, given the target was little bit different. Because the input and output devices were long deprecated tapes (at least most of the time I think). There were several more IO statements, but that is not important.

These statements could transmission a **list of quantities** between cores and an external storage medium.

List of quantities is a pretty simple concept. It is a Fortran's way of defining how to specify variables or arrays and most surprisingly implied loops inside IO operations. 

### Simple variable list
```FORTRAN

READ 10, A, B, C, K
```
It is pretty self explanatory, it reads values from input device into memory locations `A`, `B`,`C` and `K` in that order. `10` at the start is used for referencing a formatting the READs follows:
```FORTRAN
10 FORMAT(F10.2, F10.2, F10.2)
```

### Simple array list
We have a defined array `X` of 5 elements and we can write it into an output `2` by writing:
```FORTRAN
WRITE (2) X
```
### Implied loops
This is the most interesting part, the variable lists are very simple and the need for such a thing is very intuitive even if no language before existed.

The loops are more interesting, because it shows a sense of forward thinking in my opinion. They transfer a indexed elements of an array using loop controlled statements (`start`, `end`, `step`):
```FORTRAN
READ 15, (A(I), I = 1, 10, 2)
```
This is equivalent to loop running `I=1,3,5,7,9` thus it reads values directly into `A(1), A(3), A(5), A(7) and A(9)`.

You can even do nested loop statements. 
```FORTRAN
WRITE (3) ((MATRIX(I, J), I = 1, 3), J = 1, 2)
```
Outer loop controls `J` and inner loop controls `I` and it will handle writing a multidimensional matrix with custom iteration loops.

This is very interesting to me, because this feature looks very modern and was not present on any of the subsequent list of languages that came after it like Basic, B, C, etc. but in time this feature came back in lot of the modern mainstream languages like Python in the form of **generator expressions and comprehensions** (for example, writing something like 
```python
(matrix[i][j] for j in range(1, 3) for i in range(1, 4))
```
 inside a print function or file write)

Fascinating to think that an idea born in 1950' punch cards and magnetic tape somehow foreshadowed the expressive, concise syntax we assimilate with the modern languages.