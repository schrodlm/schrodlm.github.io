---
layout: note
title: "file"
---

file is a concept used as an abstraction in the virtualization of storage

- simply a linear array of bytes, each of which you can read or write
- each file has some kind of **low-level name** (in Unix systems). This name is reffered to as its [inode](/notes/inode/)

- files are contained in [directories](/notes/directory/) (which are just files as well)
- directories and files together create what is called a [file system](/notes/file-system/)
- processes refer to files using [file descriptors](/notes/file-descriptor/) instead of its inode
- Unix system also use concept of [pseudofiles](/notes/pseudofile/)

## Acessing a file
To work with file abstraction concept introduced by [file system](/notes/file-system/). The underlying operating system provides an API ([file system interface](/notes/file-system-interface/))

## What do operating system know about a file
In most systems, the OS does not know much about the structure of the file (what it is). The responsibility of the file system is simply to store such data persistently on disk and make sure that when data is requested they can be retrieved correctly.