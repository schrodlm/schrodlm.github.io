
The `mmap()` (memory map) system call maps files, device or anonymous memory into the virtual address space of a process

Once mapped, the process can directly access the mapped memory just like accessing regular arrays.

## How it Works (The Mechanics)

What really happens is that the kernel establishes a direct mapping in the process's page tables.

- The kernel handles transparent synchronization of the mapped pages to the underlying file or device.
- 
- The mapping is performed on demand: pages are only loaded into physical memory (RAM) when the process first tries to access them (a page fault occurs), a concept called lazy loading.


## Use case
There are two important flags of `mmap` that drastically change how it behaves.

### `MAP_PRIVATE`
The MAP_PRIVATE flag creates a private, copy-on-write (CoW) mapping of the file.

- Writes: Modifications made by the process are private and are made to a newly allocated anonymous physical page (via CoW).
- Isolation: Changes are not visible to other processes mapping the same file, and they are never written back to the underlying file on disk.
- Use Case: Provides an efficient, zero-copy way to create an isolated, temporary working copy of a file's content in memory.

**Important note**
This seems not that useful for me (a end user), but this is actually how mmap is used to most. This is how shared libraries (.so, .dll). The dynamic linker/loader uses `MAP_PRIVATE` when loading the code (text) segment of dynamic libraries (.so files). This allows all processes using the same library to initially share the same physical pages of the library's code, saving physical RAM.

### `MAP_SHARED`
The MAP_SHARED flag creates a shared mapping of the file.

- Writes: Modifications are made directly to the shared physical pages of memory.
- Visibility: Changes are immediately visible to all other processes that have mapped the same region of the same file.
- Persistence: Changes are written back to the underlying file on disk (though not necessarily immediately, due to write caching).
- Use Case: Ideal for Inter-Process Communication (IPC) and for making persistent changes to a file from memory.

## Distinction between traditional read/write semantics

#### My understanding
When a process memory maps a file. What it does is that file is saved somewhere in physical memory (meaning physical frame, possibly multiple). When you memory map it to the process, OS pick a virtual page and maps it onto that physical frame representing the file.

As opposed to read/write semantics that copies the contents of the file to the memory (stack, heap) of the file.

#### Detailed

1. <u>Memory-mapping using `mmap`</u>
	- **Zero-Copy**. The kernel maps the file's data (residing in the kernel page cache) directly into the process's virtual address space
	- **Data Flow:** No data is copied across the kernel/userspace boundary.
	- **Access:** Data is accessed directly by **pointer dereference** (like an array).
	- Extremely **fast** for large files because it avoids data movement and leverages hardware (MMU) for access.
	- **Result:** The file's contents **share** physical memory with the process.

2. <u>Traditional I/O (read/write)</u>
	- **Double-Copy** (or buffering). Data is moved explicitly between memory regions using system calls.
	- **Data Flow (Read):**
		1. disk → kernel buffer
		2. kernel buffer → userspace buffer (first copy).
	- **Access:** Data is accessed indirectly by calling the `read()` or `write()` system calls.
	- **Result:** The file's contents are copied into a buffer you manually allocate on the **heap or stack**.

## Limitations
`mmap()` requires a source that can be logically mapped into memory, which usually means a file on a file system or a block device. You **cannot** use `mmap()` to read or write data to:

- **Network Sockets:** Data is a transient stream.
    
- **Pipes and FIFOs:** Data is consumed and disappears.
    
- **Terminals:** Data is interactive and sequential.
---
You can summarize the choice like this: **Use `mmap()` when you want to treat a file as a block of memory; use `read()`/`write()` when you want to treat the data as a stream.**