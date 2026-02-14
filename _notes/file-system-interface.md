Create interface for abstraction created from introducing [file system](/notes/file-system/)

This is the API that allows a user-space program to request services from the kernel. Without this interface, a programmer would have to manually calculate disk offsets and flip bits in a bitmap—the OS handles that complexity for us.

The interface is a set of system calls provided by the OS to manage the virtualization of storage.

## Creating files
`open()` takes a human-readable path (e.g., `/home/user/file.txt`) and returns a [file descriptor](/notes/file-descriptor/)
- OS performs a path resolution to find the [inode](/notes/inode/) number

## Accessing files
- `read()` and `write()` allow process to interact with the array of bytes representing data of a file
- `lseek()` allow random access
- `close()` tells the OS the process is done with the file. OS can then clean up the allocated resources.

## Naming and metadata
The interfaces allows us to manipulate the metadata of files as well.
- **`mkdir()` / `rmdir()`**: Used to create/delete directory files (the name-to-inode mappings).
- **`stat()` / `fstat()`**: Allows a program to view the metadata inside [inode](/notes/inode/) without actually opening or reading the file data.
- **`link()`** (hard links): Creates a new name in a directory that points to an _existing_ inode number.
- **`unlink()`**: Removes a name from a directory.

### The "Everything is a File" Unified Interface

Unix uses the same interface (`read`/`write`/`close`) for things that aren't technically files on a disk. This is a core design philosophy:

- **Pipes:** Communication between processes.
- **Devices:** Hardware like keyboards or disks (found in `/dev/`).
- **Sockets:** Network communication.

> **Why this matters:** A programmer can write a tool that processes a "stream of bytes" and it will work whether the data comes from a local `.txt` file, a network connection, or a user typing at a keyboard.