---
date: 2026-10-20
project: rentczecher
session: 18
tags:
- devlog
prs:
- https://github.com/schrodlm/rentczecher/pull/146
- https://github.com/schrodlm/rentczecher/pull/147
title: "2026-10-20 Finding your way around a flat"
---
## Summary
A day of making the app nicer to live in. Every flat now has a number, a name and a picture, so it is easy to remember and point at. A flat with an exact location shows on a street map, with links to Mapy.cz and Google Maps. The app can show how far each flat lies from the nearest metro, tram stop, school or whatever else matters. The top bar, the profile tabs and the inbox got bigger and clearer.

## Goal
Make a flat recognisable at a glance and its surroundings easy to judge, and fix the small things that made the app feel unfinished.

## Done
- **A number and a name for every flat.** Each profile numbers the flats it finds in the order it found them, so a flat reads like "#124 Přístavní, Holešovice · 23 000 Kč". The name is the two finest names of where it lies, its street and part of town, or its part of town and district. The number is softer than the name, so the place leads.
- **Its photo as its picture.** Rows and the details show the flat's main photo, with the portal's logo small on the corner. A flat without a photo yet gets a plain gray tile with a house.
- **A street map.** A flat with an exact location gets a panel of its own with an OpenStreetMap street map, which opens over the whole window. Under it are links to Mapy.cz and Google Maps, for Street View and directions.
- **What is nearby.** In a flat's details I can choose kinds of places, such as metro, tram, train, bus, supermarket, school, kindergarten, pharmacy, park, theatre and cinema. The choice applies to the whole profile. The details show the nearest of each with its distance, and every row shows up to three of them.
- **A clearer top bar.** The scan button, the most important one, is bigger with a soft glow and sits in the middle of the bar. The profile tabs are bigger and join the inbox below them, and editing a profile is a gear inside its tab.
- **A friendlier inbox.** The new, favourite and viewed sections fold away and stay folded. The list is wider so names fit, the rows are bigger and easier to read, and each row's score is a plain ring like the one in the details.

## Decisions
- **Numbers count per profile.** A flat watched by two profiles has two numbers, but "#124" reads as the 124th flat this search found, which is what I expect.
- **The number is written down when a flat is found.** Working it out on the fly would shift every number as old flats are deleted after ninety days. A number only helps if it never changes.
- **The real photo, not a pixel picture.** I tried turning the main photo into a coarse pixel grid like a profile icon. At row size the real photo is just as recognisable and looks better.
- **No Google map inside the app.** It needs a key tied to a billing account, which an open-source app would have to ship, and it would tell Google which flats I look at. OpenStreetMap needs neither, and Google is a link away.
- **Nearby places live and in the panel only.** They come from OpenStreetMap's query service, Overpass, asked by the panel for the area around the profile's flats, one request per kind. Nothing is stored. It is extra information, so when the service is busy it simply does not show.
- **Three servers with a time limit.** The public Overpass servers are run by volunteers and are often full. A busy one tends to hold a request rather than refuse it, so each gets six seconds before the next is asked.

## Problems and surprises
- **The map shone through every window.** The map library stacks its layers very high, so the street map stayed bright above the dark background of the photo viewer and the profile editor. Keeping its layers inside the map fixed it.
- **The map never moved.** Stepping to the next flat updated everything except the street map, which kept the first flat's point.
- **A gray map in a narrow window.** A map made while its pane was hidden measured itself as nothing and stayed gray when the pane appeared.
- **A column the database never got.** My own database had already run the earlier version of the photo migration, so it never got the new number column and every scan failed. I added the column by hand and kept my test data. Real 0.1.0 databases run the whole migration and are fine.
- **Overpass was down while I tested.** The main server refused every connection and the others were slow, which is what made me add the time limit.

## Learned
- **A stored order beats a computed one when people remember it.** Anything a person will say out loud has to stay put.
- **Free public services need patience built in.** Giving each one a few seconds and moving on keeps the app from waiting on the slowest.

## Next
- Watch how often the nearby places stay empty. If it is often, bundle them with the app the way place names are.
- Release 0.2.0.

---

**References:** street map [#146](https://github.com/schrodlm/rentczecher/pull/146) · names, pictures, top bar, inbox and nearby places [#147](https://github.com/schrodlm/rentczecher/pull/147) · picture idea [#106](https://github.com/schrodlm/rentczecher/issues/106)
