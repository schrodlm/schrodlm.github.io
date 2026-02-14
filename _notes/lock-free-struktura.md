---
layout: note
title: "lock-free struktura"
---

datová struktura určena pro použití v multi-threaded prostředí

- Spoléhají se na **atomické operace** (např. [CAS](/notes/cas.html), [LLSC](/notes/llsc.html))
- Vlákna se nikdy neblokují, pouze mohou **opakovat operaci**


## Porovnání se zámkovými strukturami
[zámky vs lock-free struktury](/notes/zamky-vs-lock-free-struktury.html)