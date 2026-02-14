---
layout: note
title: "file system"
---

file system is a **software-based** disk management

Its job is to transform massive, messy collection of physical disk blocks into abstractions ([files](/notes/file.html), [directories](/notes/directory.html))

## Defining characteristics
There exists many different implementation of file systems (since file system is purely a software it is much easier to introduce new implementations).

Even through different implementations (e.g. ZFS, XFS, AFS,...) some things remain constant:
1. data structures (what types of on-disk structures are utilized by the file system to organize its data and metadata)
2. access methods (how does FS map the calls made by a process, such as `open()`, `read()`, `write()`, etc., onto its structures)

### API
Since file-system is an abstraction, it provides an API (interface) to manage the underlying data, this interface is called [file system interface](/notes/file-system-interface.html)

### Typically used structures
To manage data, the files system needs to set aside specific areas of the physical disk for different purposes:

- **data region**
	- the most of the disk (where actual contents of the files (*arrays of bytes*) are stored)
- **[inode](/notes/inode.html) table**
	- a dedicated space to store all the [inode](/notes/inode.html) structures
- **bitmaps**
	- simple structures that tell the OS which blocks are free or in use
- **superblock**
	- master record
	- contains metadata about the file system itself (e.g, how many inodes are there, where does the data region begins)

## File system structure
There are several ways to structure a disk as a file system:
- A disk can be used in its entirety for a file system
- A disk can be broken up into multiple partitions, each of which become a virtual disk and can have its own file system
- A multiple physical disks can be combined into one _**volume**_
![Image](/assets/img/Pasted image 20251228111924.png)