Tool for processing WFTDA statsbook files.  Will read a WFTDA Excel spreadsheet file and produce a list of detected errors.  Will also save the game in DerbyJSON format.

List of errors currently checked:

Scores:

1. NP checked with points.
2. No points (including a zero) entered, but NP *not* checked.
3. "Lead" checked for both jammers.
4. "Call" checked for both jammers.
5. "Injury" checked on one team but not the other.
6. Star pass for only one team.

Penalties:

1. "FO" entered for skater with fewer than 7 penalties.
2. Seven or more penalties without "FO" or expulsion code entered.
3. Expulsion code entered for jam with no penalty.

Lineups:

1. Players listed more than once in the same jam on the lineup tab.
2. "I" or "|" in lineups without the player being in the box already.

Lineups + Penalties:

1. Penalties on skaters not listed on the lineup for that jam.
2. "X" in lineups without a matching penalty.
3. "/" in lineups without a matching penalty.
4. "S" or "$" in lineups without a matching penalty.
5. Penalty recorded without a "X", "/", "S", or "$". 

Scores + Penalties

1. Jammers with lead and a penalty, but not marked "lost."

Flamingo icon from http://www.iconsmind.com