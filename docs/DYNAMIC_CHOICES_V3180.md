# v3.18.0 — Dynamic Character Choices

Cumulative release from production main v3.12.0, including v3.13–v3.17. Use the reviewed Worker upgrade procedure before deploying the cumulative frontend. No new D1 table or write path.

## What changed

Pending choices now derive their completion from actual character data rather than a text note. Old imported labels are migration hints; a legacy resolved flag cannot prove a typed selection. The seven Aelyn-style requirements map to typed selectors for skill proficiency sources, Deft Explorer (Expertise plus two languages), Weapon Mastery, Druidic Warrior, Primal Companion, Ranger prepared spells, and Standard Array. Other characters use the same rules and supported selectors. The generic skill and mastery paths are not tied to a character name. Bard/Rogue/Ranger Expertise and the existing Student of War selector are also routed. Unsupported choices remain pending for review rather than accepting arbitrary text. Genuine DM review entries require the Creator/DM.

- Skills: fixed background skills, class options, supported multiclass sources and Human/Elf species choices; distinct picks, preserved recorded feature/feat sources. DM confirmation required to remove otherwise unassigned existing proficiencies.
- Expertise: select from proficient skills and record the source; Deft Explorer includes two language selections.
- Weapon Mastery: legal eligible weapon kinds and exact capacity.
- Druidic Warrior: two Druid cantrips, only when the character has this fighting style or an unresolved imported requirement for it. Guidance and Starry Wisp are not prohibited by PHB 2024; other-source spells are excluded where recorded.
- Primal Companion: existing class-linked form selector; actual companion record satisfies the choice.
- Ranger spells: 2024 level table and indexed legal Ranger spell options; Hunter's Mark plus Favored Enemy uses, Wood Elf spells when lineage is recognized, and single-class Ranger spell slots. Beast Master and Hunter supported. Other Ranger subclass spell tables and multiclass slot rules remain for further work.
- Standard Array: all six unique scores and background-specific boosts; initial rebuild supported through level 3. CON changes adjust HP, but armor/loadout AC and special feature overrides require review. Level 4+ initial rebuild and subsequent ASI bookkeeping are not automated.

The selections update the character draft and dirty state; no extra network writes. Existing owner/DM authorization and revision checks remain. Specific server-side rules validation for the new choice metadata is not yet implemented.

The spell index includes factual spell metadata from SRD 5.2.1 (Wizards of the Coast LLC, CC BY 4.0, https://www.dndbeyond.com/srd and https://creativecommons.org/licenses/by/4.0/), adapted from downfallx/dnd-5e-srd-markdown spells.md, and PHB 2024 spell-list metadata (no full PHB descriptions copied). Newly indexed spells may link conceptually to the full official rule reference and do not all have automated combat effects.

References: https://www.dndbeyond.com/sources/dnd/br-2024/character-classes ; https://www.dndbeyond.com/sources/dnd/br-2024/character-origins . Aelyn-like fixture is a regression test, not access to the live character. No existing character is modified by this code until the user confirms a choice and presses global Save. Verify the actual imported record in staging and test mobile popups before deployment.
