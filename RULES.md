# Chamo Online Rules & Gameplay

## 🎮 Game Overview

Chamo Online is a live multiplayer social deduction game.

- 4–10 players per lobby
- One player is secretly the **Chamo**
- Everyone else knows the **Secret Word**
- The Chamo does not know the Secret Word

Players give short clues through voice or text, debate, then vote. The Chamo tries to blend in, or guess the word if caught.

Each round lasts about **5–8 minutes**.

## 🧩 Game Setup (Automatic)

Once players join a lobby:

- The system randomly assigns roles:
  - 1 Chamo
  - Remaining players are **In the Know**
- A Topic Grid appears on screen
- The system randomly selects a Secret Word
- Non-Chamo players see the word on their screen
- The Chamo sees: **"You are the Chamo."**
- No one else knows who the Chamo is

## 🕒 Round Structure

### Phase 1 – Silent Read (10–15 seconds)

- Non-Chamo players read the Secret Word
- The Chamo waits (no word shown)
- This phase prevents immediate reactions that could reveal confusion

### Phase 2 – Clue Submission

Each player must submit **one single-word clue**.

Two possible formats:

- **Option A – Simultaneous Reveal (Recommended)**
  - All players type their clue privately
  - When the timer ends, all clues are revealed at once
  - This prevents players from copying or adjusting based on others
- **Option B – Timed Turn Order**
  - Players give clues in a randomized order
  - Each player has 10 seconds to respond

Clue rules:

- Only one word
- No numbers, initials, or spelling hints
- No direct translations
- No inside jokes outside the platform

Breaking rules results in:

- Auto-warning
- Repeat offense = auto-loss for that round

### Phase 3 – Open Discussion (60–120 seconds)

Players discuss via:

- Voice chat (ideal)
- Or text chat

Discussion goals:

- Identify suspicious clues
- Defend your own clue
- Analyze patterns

The Chamo should:

- Sound confident
- Avoid overexplaining
- Use other clues to narrow down the Secret Word

A visible countdown timer keeps debate tight.

### Phase 4 – Voting

- All players vote privately
- Votes reveal simultaneously
- Player with the most votes is accused

If there is a tie:

- Only tied players enter a 30-second sudden-death discussion
- Revote among tied players only

## 🏁 Resolution

If the accused player is **not** the Chamo:

- The Chamo wins immediately

If the accused player **is** the Chamo:

- The Chamo gets a final screen: **"Guess the Secret Word."**
- They type their guess within 15 seconds
- Correct guess → Chamo wins
- Incorrect guess → Other players win

## 🏆 Scoring System (Online Adaptation)

Suggested ranked scoring:

- Chamo survives vote → +3 points
- Chamo caught but guesses correctly → +2 points
- Chamo caught and fails → +3 points split among non-Chamo players
- Correct vote against Chamo → +2 individual points
- Incorrect vote → 0 points

Optional: Hidden MMR / skill ranking.

## 🔄 Multiple Rounds

After each round:

- Roles reshuffle automatically
- New topic and word generated
- Previous chat clears to prevent meta-gaming

## 🧠 Online-Specific Strategy Changes

For non-Chamo players:

- Watch typing speed (hesitation can be suspicious)
- Look for vague umbrella words
- Notice who mirrors others too closely

For the Chamo:

- Choose flexible words (for example: "color," "tool," "animal")
- Avoid extreme specificity
- Pay attention to overlap between clues
- Blend in socially; tone matters

## ⚙ Optional Online Features

To enhance digital play:

- Anonymous clue mode (no names until after reveal)
- Emoji reactions during discussion
- Spectator mode
- Replay of clues at end of round
- "Bluff Meter" showing how many times a player survived as Chamo
- Custom topic packs
- Themed seasonal word sets

## 🎯 What Makes Chamo Online Unique

Compared to in-person play:

- Simultaneous clue reveal increases fairness
- Faster pacing
- More structured timers
- Reduced social pressure for shy players
- Greater replayability through automation

## ✅ Next Steps to Change the Game to These Rules

1. Align core game constraints in `js/config.js`.
   - Change lobby limits to 4–10 players.
   - Split timers by phase (silent read, clue submission, discussion, final guess).

2. Replace the current topic-vote opening flow with direct role + word assignment.
   - On round start, randomly assign 1 Chamo.
   - Randomly select a topic and secret word.
   - Show word only to non-Chamo players.

3. Add explicit round phases to the lobby game state in Firebase.
   - `silent_read` → `clue_submission` → `discussion` → `voting` → `resolution`.
   - Persist phase timestamps so all clients stay synchronized.

4. Implement clue submission system in UI and backend.
   - One-word validation only.
   - Add two modes: simultaneous reveal (recommended) and timed turn order.
   - Prevent editing clues after submission.

5. Enforce clue rules automatically.
   - Block disallowed clue formats (numbers/initials/etc.).
   - Add warning tracking and round auto-loss on repeated violations.

6. Extend voting logic for tie handling.
   - Detect ties for highest votes.
   - Run 30-second tie-only discussion.
   - Trigger revote among tied players only.

7. Add Chamo final-guess mechanic after being correctly accused.
   - Show "Guess the Secret Word" prompt only to the accused Chamo.
   - Enforce 15-second timer.
   - Resolve win/loss based on guess correctness.

8. Add round scoring and multi-round persistence.
   - Track per-player points by the scoring model in this document.
   - Keep scores across rounds in lobby state.
   - Reshuffle roles and clear previous chat each new round.

9. Add/upgrade communication layer support.
   - Ensure text chat is available during discussion.
   - Add voice chat integration if required for your target experience.

10. Update UX copy and test coverage.
   - Match on-screen instructions to these rules in all phases.
   - Add test checklist for happy path, ties, invalid clues, disconnect/rejoin, and host transfer.
