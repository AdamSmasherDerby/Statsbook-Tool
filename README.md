Statsbook Tool is a utility for processing WFTDA statsbook files.  It will read a WFTDA Excel spreadsheet file and produce a list of detected errors.  It will also save the game in DerbyJSON format, in case that proves useful.

At present it supports the 2017 and 2018 statsbook formats.  Feed it an older statsbook at your own peril.

List of errors currently checked:

Scores:

1. NP checked with points.
2. No points (including a zero) entered, but NP *not* checked.
3. "Lead" checked for both jammers.
4. "Call" checked for both jammers.
5. "Injury" checked on one team but not the other.
6. Star pass for only one team.
7. Jam number out of sequence.
8. Points given to more than one jammer in the same trip during a star pass.

Penalties:

1. "FO" entered for skater with fewer than 7 penalties.
2. Seven or more penalties without "FO" or expulsion code entered.
3. Expulsion code entered for jam with no penalty.
4. Penalty code without jam number, or jam number without penalty.

Lineups:

1. Players listed more than once in the same jam on the lineup tab.
2. "I" or "|" in lineups without the player being in the box already.
3. Skater previously seated in the box with no code on present line.
4. Skater seated in a prior jam with no marked exit from the box.
5. "$" or "S" entered for a skater already in the box.
6. "No Pivot" not checked after star pass.

Lineups + Penalties:

1. Penalties on skaters not listed on the lineup for that jam.
2. "X" in lineups without a matching penalty.
3. "/" in lineups without a matching penalty.
4. "S" or "$" in lineups without a matching penalty.
5. Penalty recorded without a "X", "/", "S", or "$". 

Scores + Penalties:

1. Jammers with lead and a penalty, but not marked "lost."
2. Penalties recorded in jam numbers that are not present on the score sheet.

Warnings:
1. Errors that may be correctly entered substitutions.
2. No box entry listed for skater penalized in last jam.
3. No points and no initial trip checked for a jammer who passes the star.
4. Lost lead checked without a penalty in the corresponding jam.
5. Missing data from IGRF

Flamingo icon from http://www.iconsmind.com