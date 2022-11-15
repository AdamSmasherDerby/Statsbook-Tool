Statsbook Tool is a utility for processing WFTDA statsbook files.  It will read a WFTDA Excel spreadsheet file and produce a list of detected errors.  In addition, it can export rosters from the IGRF page of the StatsBook in .xml format for importation to CRG Scoreboard. It can also save the game in DerbyJSON format, in case that proves useful for some reason. 

This software is not provided, endorsed, produced, or supported by the WFTDA.  It is not guaranteed to work, to be free of false positives, false negatives, random bugs, or apocalyptic curses.

At present it supports the 2017, 2018, and 2019 statsbook formats.  Feed it an older statsbook at your own peril. Note that the 2019 statsbook release also substantially changed how lineups are entered.  The program determines which data entry method you should be using based on the file type - if you're using a 2019 statsbook file, you should be using the 2019 instructions.

Installable binaries are located at:
https://github.com/AdamSmasherDerby/Statsbook-Tool/releases

[![ko-fi](https://www.ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/J3J11GKIZ)

## Installation instructions:

*Windows:* Download and run <code>Stastbook.Tool.Setup.x.x.x-Windows.exe</code>

*Mac:* Download and run the <code>Statsbook.Tool-x.x.x.dmg</code> file. Drag the flamingo onto the folder. Right or control click the StatsBook Tool program and select "open." Agree to run the software, despite dire warnings of awful consequences. (The awful consequences are that I have not ponied up $100 for a Developer certificate to sign the code.)

*Linux:* Download <code>stastbooktool.AppImage</code>, then type "chmod a+x statsbooktool-1.1.2-x86_64.AppImage" to make the file executable.


## List of errors currently checked:

### Scores:

1. NI checked with points.
2. No points (including a zero) entered, but NI *not* checked.
3. "Lead" checked for both jammers.
4. "Call" checked for both jammers.
5. "Injury" checked on one team but not the other.
6. Star pass for only one team.
7. Jam number out of sequence.
8. Points given to more than one jammer in the same trip during a star pass.
9. Skipped column on score sheet.
10. SP* with jammer number entered.
11. Points scored with no lead jammer and 'lost' not recorded for the scoring team.
12. Jammer not on IGRF.
13. SP and "lead" without "lost."

### Penalties:

1. "FO" entered for skater with fewer than 7 penalties.
2. Seven or more penalties without "FO" or expulsion code entered.
3. Expulsion code entered for jam with no penalty.
4. Penalty code without jam number, or jam number without penalty.
5. Skater not on IGRF.
6. Invalid jam number on penalty sheet.

### Lineups:

1. Skater not on IGRF.
2. Players listed more than once in the same jam on the lineup tab.
3. Skater previously seated in the box with no code on present line.
4. Skater seated in a prior jam with no marked exit from the box.
5. "$" or "S" entered for a skater already in the box.
6. "No Pivot" not checked after star pass.
7. Skaters entered on lines beginning with "SP*".
8. "ᚾ" entered instead of "X". (2018 and earlier)
9. "I" or "|" in lineups without the player being in the box already. (2018 and earlier)
10. Star pass recorded for a lineup with no pivot.

### Lineups + Penalties:

1. Penalties on skaters not listed on the lineup for that jam.
2. "+" or "X" in lineups without a matching penalty.
3. "-" or "/" in lineups without a matching penalty.
4. "S" or "$" in lineups without a matching penalty.
5. Penalty recorded without a box entry. 
6. Fouled out skater still in box.

### Scores + Penalties:

1. Penalties recorded in jam numbers that are not present on the score sheet.

### Warnings:
1. Errors that may be correctly entered substitutions.
2. No box entry listed for skater penalized in last jam.
3. No points and no initial trip checked for a jammer who passes the star.
4. Lost lead checked without a penalty in the corresponding jam.
5. Missing data from IGRF
6. Jam called for injury checked without a corresponding "3" on the lineups tab.
7. Jammers with lead and a penalty, but not marked "lost."
8. Empty box on the lineup sheet without an accompanying comment.
9. Check for out of date statsbook file version.
10. Check for six penalties plus an expulsion. (Possible incorrectly entered seventh penalty)

Flamingo icon from http://www.iconsmind.com

### Release Notes

* 1.0.0 - May 11, 2018
    * Initial public release.
* 1.1.0 - May 18, 2018
    * Export to CRG.
    * Tolerance for lowercase 'sp' and 'x'.
    * Check for negative and zero jam numbers.
    * Check for points scored with no lead jammer and lost not checked.
* 1.1.1 - May 20, 2018
    * Bugfix for CRG Export option to handle special characters correctly.
* 1.1.2 - June 3, 2018
    * Move Lead / Penalty / Not Lost from errors to warnings.
    * Add check for skaters on SP* lines.
    * Doesn't crash on missing jam numbers.
    * Added game clock cells to statsbook template for compatibility with CRG Import Tool.
* 1.1.3 - June 6, 2018
    * Fixed bug in SP* check.
    * Clarified that Warnings are not necessarily errors.
* 1.1.4 - June 12, 2018
    * Added keyboard shortcut for exit.
    * Detects letters entered as jam numbers.
    * Fixed bug in CRG Export introduced in 1.1.1.
* 1.1.5 - June 25, 2018
    * Fixed bug with reading injuries in lineups.
    * Added tooltips to error list.
    * Added check for ᚾ in lineups.
    * Added check for fouled out skater still in box.
* 1.1.6 - October 27, 2018
    * Added checks for skaters not on IGRF. (Duplicates conditional formatting from StatsBook.)
    * Updated dependencies.
    * Doesn't crash when checking one period games.
* 2.0.0 - December 15, 2018
    * Updated for 2019 Statsbook revision.
* 2.0.1 - January 29, 2019
    * Fixed spelling error in report.
    * Will warn for blank lineup cells not accompanied by a comment.
* 2.0.2 - February 25, 2019
    * Fixed "S without penalty" error when it should have been "$ without penalty."
    * Explicitly checks for valid jam numbers on the score sheet.
    * Updated error message to more explicitly account for substitutes.
    * Updated error message to account for SP during initial scoring trip.
    * Updated error message to account for a skater in queue for an entire jam.
* 2.1.0 - March 16, 2019
    * Added check for latest version
* 2.1.1 - March 20, 2019
    * More robust ignoring of comments
* 2.1.2 - May 22, 2019
    * Checks for valid jam numbers for foulouts or expulsions.
    * Added icon to draw attention to explanatory tooltips.
    * Adds the ability to copy text from the error report.
* 2.1.3 - June 7, 2019
    * Doesn't crash on spaces after "SP" or "SP*" entries.
    * Fixed appearance of "refresh" button.
    * Added check for "SP" and "Lead" without "Lost".
    * Added warning for out of date statsbook file version.
* 2.1.4 - July 8, 2019
    * Fixed crash if the jam AFTER the last one is a whitespace.
    * Added ability to export to new CRG 4.0 JSON format
    * Reduced liklihood of UUID collisions.
    * Changed derbyJSON export from UTF-8 to UTF-16
* 2.1.5 - August 5, 2019
    * Fixed display if team name not entered.
    * Handle skaters substituted out of the box correctly.
* 2.2.0 - December 9, 2019
    * With CRG 4.0 making more data, we're going to find some more cracks in this tool. First round of bug fixes.
* 2.2.1 - July 12, 2020
    * Add warning to check for six penalties and an expulsion.
    * Internal upgrade to Electron 9 for security reasons.
* 2.2.2 - July 19, 2020
    * Fix bug introduced in 2.2.1 where sub-windows wouldn't run properly.
* 2.2.3 - July 21, 2020
    * Repair broken "refresh" button.
* 2.2.4 - October 18, 2020
    * Update to Electron 10 - no changes for users
* 2.2.5 - June 7, 2022
    * Fix weird bug where, with no changes to the software or the statsbook, it nonetheless stopped failing gracefully when no time was present.  I blame Bill Gates.  
    * May or may not also fix a bug where European users saw the date off by one day on the display.
* 2.2.6 - November 15, 2022
    * Upgrade to new version of xlsx importer to fix issue with extlst tag not being parsed correctly.