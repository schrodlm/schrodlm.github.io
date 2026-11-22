# Latin Modern Roman

The printed CV is set in Latin Modern Roman 10, regular, italic and bold, by
Bogusław Jackowski and Janusz M. Nowacki for the TeX users groups, after
Donald E. Knuth's Computer Modern. The originals are the OpenType files
`lmroman10-regular.otf`, `lmroman10-italic.otf` and `lmroman10-bold.otf` of
the Latin Modern fonts, from <https://www.gust.org.pl/projects/e-foundry/latin-modern>
or the `lm` package on CTAN, <https://ctan.org/pkg/lm>.

    Copyright 2003--2021 by B. Jackowski and J.M. Nowacki
    (on behalf of TeX Users Groups).
    This work is released under the GUST Font License.

## What I changed

The files here are derived from those originals by `scripts/fonts/latin-modern.sh`,
which only:

- keeps the characters of Latin and Latin Extended, and the punctuation,
  arrows and symbols a CV uses, and drops the rest;
- converts each font from OpenType to WOFF2, under a new file name,
  `latin-modern-roman-<style>.woff2`.

The outlines, metrics and names inside the fonts are unchanged. The fonts are
not endorsed by their authors or by GUST.

## The GUST Font License

```
% This is version 1.0, dated 22 June 2009, of the GUST Font License.
% (GUST is the Polish TeX Users Group, http://www.gust.org.pl)
%
% For the most recent version of this license see
% http://www.gust.org.pl/fonts/licenses/GUST-FONT-LICENSE.txt
% or
% http://tug.org/fonts/licenses/GUST-FONT-LICENSE.txt
%
% This work may be distributed and/or modified under the conditions
% of the LaTeX Project Public License, either version 1.3c of this
% license or (at your option) any later version.
%
% Please also observe the following clause:
% 1) it is requested, but not legally required, that derived works be
%    distributed only after changing the names of the fonts comprising this
%    work and given in an accompanying "manifest", and that the
%    files comprising the Work, as listed in the manifest, also be given
%    new names. Any exceptions to this request are also given in the
%    manifest.
%
%    We recommend the manifest be given in a separate file named
%    MANIFEST-<fontid>.txt, where <fontid> is some unique identification
%    of the font family. If a separate "readme" file accompanies the Work,
%    we recommend a name of the form README-<fontid>.txt.
%
% The latest version of the LaTeX Project Public License is in
% http://www.latex-project.org/lppl.txt and version 1.3c or later
% is part of all distributions of LaTeX version 2006/05/20 or later.
```
