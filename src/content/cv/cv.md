---
title: CV
name: Matěj Schrödl
headline: Firmware engineer · C++ · embedded systems
location: Prague, Czech Republic
contacts:
  email: matej.schrodl@gmail.com
  web: https://schrodlm.github.io
  github: https://github.com/schrodlm
  linkedin: https://linkedin.com/in/matej-schrodl354
  leetcode: https://leetcode.com/schrodlm
experience:
  - role: C++ Firmware Developer
    organisation: Prusa Research
    start: 2025-01
    end: present
    items:
      - "I work on the open-source [Buddy firmware](https://github.com/prusa3d/Prusa-Firmware-Buddy), which runs Prusa's CORE One, XL, MK4 and MINI printers: 248 commits to mainline so far, plus code review for my colleagues."
      - text: "**Led the firmware for the CORE One+ (Gen 2) and CORE One L+ editions** (FW 6.8.1, August 2026). I built all four of the release's headline features:"
        items:
          - "**the edition system**, which configures a printer's whole hardware set from a single setting;"
          - "**GT1.5 belts**, with motion parameters resolved at runtime, so one firmware drives both belt types;"
          - '**Expansion Joints Gen 2**, a faster bed heat-absorption model that skips the pre-print "absorbing heat" wait up to 85 °C and roughly halves it above;'
          - "**the Nozzle Wiper** (with a colleague): the print-start wipe, its touchpoint search and its failure handling."
      - "**INDX toolchanger integration.** I planned how the INDX branch (about 13,000 lines) would merge into mainline as nine reviewable modules, then integrated its dock calibration, fan control and load-cell support (FW 6.6)."
      - "**OpenPrintTag NFC reader.** I built an OpenCyphal-over-UART transport for the reader board, with reusable COBS framing and CRC modules under unit tests, and the reader's status and firmware-update screens (FW 8.0). I also defined default material properties in the open [OpenPrintTag specification](https://github.com/OpenPrintTag/openprinttag-specification/pull/150)."
      - "**CORE One L automatic chamber vents.** I created the vent-control module and its new M870 G-code (FW 6.5)."
      - text: "**Jira → Asana migration.** I was the sole engineer moving the firmware and electronics teams (about 50 people) from a self-hosted Jira to Asana in two weeks: about 14,000 issues, with their comments, links and 18 GB of attachments."
        items:
          - A six-phase Python pipeline that resumes after any failure, can't change Jira, and can touch only what it created in Asana.
          - Every comment and attachment checked against the source.
          - Piloted with the team leads; the cutovers ran outside working hours.
  - role: C++ Student Developer
    organisation: Siemens Mobility
    start: 2023-11
    end: 2024-12
    items:
      - Firmware for a **railway point-machine controller**, the actuator that switches trains between tracks, developed under the **CENELEC EN 50128** rail-safety standard (SIL). The system was about a dozen cooperating C++ components with a formal init, configure and cyclic lifecycle.
      - "I owned two of those components end to end, inside a formal safety process: DOORS requirements, formal reviews and the project's C++ style guide."
  - role: Java Junior Developer
    organisation: Trixi s.r.o.
    start: 2023-02
    end: 2023-09
    items:
      - I built the Slovak data ingestion for [Smartform](https://www.smartform.cz/), an address-validation API used by more than 1,000 Czech e-shops and companies (Alza, Zonky, Tipsport). It runs daily S3 imports from the Slovak business register into PostgreSQL, with async REST endpoints. Built with Java, Spring and Liquibase.
education:
  - school: Faculty of Mathematics and Physics, Charles University
    place: Prague, Czech Republic
    degree: "Master's, Computer Science: Software Systems, System Programming specialisation"
    start: 2025-09
    end: present
  - school: Faculty of Information Technology, Czech Technical University
    place: Prague, Czech Republic
    degree: Bachelor's, Informatics, Software Engineering specialisation
    start: 2021-09
    end: 2025-06
    items:
      - "Thesis: *A Benchmarking Framework for Evaluating Rotor Models*, supervised by prof. Christoph Kirsch. The framework is merged into the [Selfie](https://github.com/cksystemsteaching/selfie) project."
projects:
  - name: "[BT](https://github.com/cksystemsteaching/selfie/pull/407): benchmarking SMT models of RISC-V code (my thesis)"
    text: A Python framework that compiles programs to RISC-V, builds models of them with Rotor, runs those models on the Z3 and Bitwuzla solvers, and charts the results. It ran more than 22 hours of benchmarks without losing data, and is merged into Selfie (about 5,000 lines).
  - name: rentczecher
    url: https://rentczecher.cz
    text: A local-first desktop app that watches four Czech property portals, shows each flat once across all of them, and scores it against your preferences. A Python engine (FastAPI, SQLite), a SvelteKit panel and a Tauri shell, shipped as signed, auto-updating installers for Windows, macOS and Linux.
  - name: obsidian-md-converter
    url: https://github.com/schrodlm/obsidian-md-converter
    text: The Python CLI that publishes my Obsidian vault to this site, with about 100 tests, CI and a pre-commit validation hook.
  - name: Coursework highlights
    items:
      - an OS kernel in C, built with a team of three (threads, virtual memory, user processes);
      - a register-level HAL for an NXP S32K118, plus rate-monotonic and FreeRTOS scheduling on STM32;
      - a single-cycle CPU in Verilog implementing an RV32I subset;
      - parallel programming with TBB, SYCL, MPI and Spark.
skills:
  Programming: C++ (17/20/23), C, Python. Also Java, TypeScript and Verilog.
  Embedded: STM32, FreeRTOS, bare-metal drivers, CAN and OpenCyphal, UART, SPI, I²C, Modbus
  Tools: CMake, GCC arm-none-eabi, gdb, OpenOCD, Catch2, pytest, Git, Jenkins, GitHub Actions, Docker, Linux
  Ways of working: code review, a safety-critical process (EN 50128), design records and specs, AI-assisted development
languages:
  Czech: native
  English: fluent
---
Firmware engineer at Prusa Research. I led the firmware for the CORE One+ (Gen 2) and CORE One L+ printer upgrades, and I built and ran my teams' move from Jira to Asana. Master's student in system programming at Charles University.
