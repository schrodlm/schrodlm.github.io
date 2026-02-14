---
layout: note
title: "Inode"
---

A data structure (in Unix-style [file system](/notes/file-system/)) that stores everything about a [file](/notes/file/) except its name and the actual data. (it stores files metadata)

It contains permissions (read/write/execute, size, owner, and pointers to the disk blocks where the data is actually stored)
