---
layout: note
title: "directory"
---

directory is a concept used as an abstraction in the virtualization of storage

A directory is essentially a list of [inodes](/notes/inode.html) with their assigned names. The list includes and entry for 
- itself (`.`),
- its parent (`..`)
- each of its children

By placing directories within directories, users are able to build [directory tree](/notes/directory-tree.html), under which all files and directories are stored.

