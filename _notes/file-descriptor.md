---
layout: note
title: "file descriptor"
---

file descriptor is essentially just a runtime filename used by processes

When process opens a file, the OS doesn't want to look up the [inode](/notes/inode/) of the [file](/notes/file/) every time you read a byte.

OS returns a file descriptor - which is just a small integer (conventionally process has three predefined file descriptors:
- 0: stdin
- 1: stdout
- 2: stderr
**Note on Redirection:** When you use a command like `ls > files.txt` in a shell, the shell is essentially closing FD 1 and reopening it so that it points to the inode of `files.txt` instead of the terminal.


FD acts as an index into a table (each process has one) which contains pointers to specific files (remembering the current offset)
![Image](/assets/img/Pasted image 20251228104951.png)

## Added security
Working with file paths (strings) is susceptible to [TOCTTOU](/notes/tocttou/) attacks. The link between name and the [inode](/notes/inode/) can be changed anytime.

## Processes sharing a file descriptor table
Even if some other process reads the same file at the same time, each will have its own entry in the open file table. In this way, each reading or writing of a file is independent, and each has its own current
offset while it accesses the given file. However, there are a few cases where an entry in the open file table is shared. One of those cases occurs when a parent process creates a child process with `fork()`.

Sharing open file table entries across parent and child is occasionally
useful. For example, if you create a number of processes that are cooper-
atively working on a task, they can write to the same output file without
any extra coordination.
![Image](/assets/img/Pasted image 20251228121247.png)
