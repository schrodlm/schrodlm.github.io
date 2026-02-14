---
layout: note
title: "Pagemap"
---

Pagemap is a linux interface (rather a [pseudofile](/notes/pseudofile/) system) that is part of /proc filesystem. 

It allows userspace programs to examine the page tables and related information by reading files in /proc

More details can be found [here](https://www.kernel.org/doc/html/v4.18/admin-guide/mm/pagemap.html).

## Entry
`pagemap` of course consists of entries. The whole virtual file is a blob of binary data that contain information about a virtual page, including:
- **Bit 63:** Page **Present** in RAM
- **Bit 62:** Page **Swapped** out
- **Bits 54-0:** The **Page Frame Number (PFN)** if the page is present, or the swap location if it's swapped.

Each entry is 8-bytes in size.

## Use cases
The ability to programmatically read and decode the `/proc/pid/pagemap` file is primarily used for **advanced low-level memory analysis and debugging** by operating system developers, security researchers, and performance engineers.

## How to use
You can't simply do something like `cat /proc/self/pagemap`. The file's size is enormous. It is a virtual file that contains a 64-bit entry for every single possible virtual page in the process's address space.

Let's do the math:
- A 64-bit process has a virtual address space that can be up to $2^{64}$ bytes, on modern CPUs it's more likely to be $2^{48}$. If we 
- Assuming $2^48$ size of address space and $4$KB ($2^{12}$) page size, there are $2^{48}/2^{12} = 2^{36}$
- Each record inside `pagemap`is 8-bytes. 
- Thus each file is something like $2^{36} \times 8 \approx 549$ gigabytes.

The `/proc/pid/pagemap` file is meant to be used in conjunction with the human-readable `/proc/pid/maps` file, and you must use a tool that knows how to read binary data and _seek_ to the relevant locations.

1. **Read `/proc/self/maps`**: Use this file to find the **virtual address ranges** (the start and end addresses) that are actually mapped and contain content (code, stack, heap, etc.).
    
2. **Calculate Offset**: For a given virtual address, you calculate the offset into `/proc/self/pagemap` using:
    
    $$\text{FileOffset}=(\frac{\text{PageSize}}{\text{VirtualAddress}​})\times \text{EntrySize (} 8 \text{ bytes)} $$
    
3. **Seek and Read**: Open `/proc/self/pagemap` in a program (like a C program or a Python script), use `lseek()` or similar to jump to the calculated **File Offset**, and read a single 64-bit (8-byte) binary entry.
    
4. **Decode**: The program then decodes the 64-bit binary value to extract the page frame number (PFN) and status flags.