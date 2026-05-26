# AutoEnforcer

A rules engine, threat radar, and thread command toolkit for Reddit moderators who are tired of doing the same cleanup by hand every single day.

## Crowd Control

AutoEnforcer is command-first for moderators who need immediate control in active threads. Use simple comment commands to freeze or reset waves, apply timeout or silence windows, lock down posts, sticky critical context, and undo changes when needed. 

Every command is backed by live subreddit and thread signals so you can quickly target disruptive accounts and stabilize discussions without having to lock them down. 

We don't ban the users either, we put them on timeout for the duration of your choice or you can rate limit them depending on which command you use. You can even target clusters or sections and AutoEnforcer will handle business. 

When a user is timed out their comments are instantly wiped from that thread, and they are sent a message notifying them of the remaining time left. If you rate limit a user you can choose how often you want to allow them to post and how long you want that to last. 

AutoEnforcer will Enforce the rest. With several different commands for many different situations and a rule engine for subs of all sizes, there is no sub too big or too small for AutoEnforcer to handle.

## The Commands

Post these as a moderator comment in the thread you want to act on.
Add `-s` only to group-targeting commands (`!reset`, `!freeze`, `!timeout`, `!silence`) to have AutoEnforcer post and sticky a summary comment of the affected users on the post.
By default, successful mod command comments are auto-removed; add `-v` (or `--visible`) to keep the command comment visible.

- `!reset <minutes>` - remove recent comments in the thread and block the removed authors from future sweeps.
	- Example: `!reset 20`
- `!30mins` - shorthand for `!reset 30`.
	- Example: `!30mins`

- `!freeze ALL` - lock comments in the thread (no removals, no blocked-author list writes).
	- Example: `!freeze ALL -s`

- `!freeze <N>` - lock comments around the command target area: N above and N below the target comment (N is clamped to 5..10).
	- Example: `!freeze 5 -s`

![Freeze](https://seovegas.s3.us-east-2.amazonaws.com/freeze.png)

- `!lockdown <minutes>` - lock the post for the given number of minutes.
	- Example: `!lockdown 15`
- `!stickypost [minutes]` - sticky the post, optionally for a duration.
	- Example: `!stickypost 45`
- `!stickycomment [minutes]` - sticky the target comment the moderator is replying to, optionally for a duration.
	- Example: `!stickycomment`
- `!timeout <durationMinutes> <lookbackMinutes>` - timeout matched users for a duration based on the thread history window.
	- Example: `!timeout 30 30 -s`
- `!silence <cooldownSeconds> <durationMinutes> <lookbackMinutes>` - apply a per-user thread cooldown for matched users; if a silenced user comments before cooldown elapses, the comment is removed and they are messaged that they are silenced.
	- Example: `!silence 120 30 30 -s`

	![Silence!](https://seovegas.s3.us-east-2.amazonaws.com/silence.png)

- `!undo` - best-effort undo for reversible thread-command effects in the current thread (timeouts, silence entries, blocked-author entries, lockdown lock, and locked comments within bounded scan limits).
	- Example: `!undo`
- `!undo <username>` - best-effort undo for one user in the current thread.
	- Example: `!undo beneficialant6344`

- `!sentry` - one-shot brigade-signal report for the current post. Scores participant fingerprints against the subreddit baseline (velocity, cross-sub overlap, account quality, engagement) and posts the result as a sticky summary comment. No automatic action.
	- Example: `!sentry`

- `!sentryauto <on|off>` - enable or disable automatic brigade response for the current post. When on, crossing the alert threshold sends a modmail alert, PMs subscribed mods, and locks the post (mods unlock manually).
	- Example: `!sentryauto on`
	- Example: `!sentryauto off`

- `!sentryautoall <on|off>` - subreddit-wide toggle for automatic brigade response on every post going forward. Same actions as `!sentryauto` when threshold is crossed.
	- Example: `!sentryautoall on`

## Modmail Commands

These commands are intended for moderator workflows in modmail.
Control command prefixes accepted by parser: `!command`, `-command`, and `!-command`.

### Help command

- `!help` - modmail-only. Returns the full list of available thread and modmail commands grouped by category (History/User intel, Moderation, Diagnostics, Sentry, Help). Rejected with a hint if used in comments.
	- Example: `!help`

### History command

- `!history user <username> [count]` - fetch user post-history snapshot (1..50, default 50) and deliver the result in modmail.
	- Example: `!history user someuser 25`
	- Example: `!history u/someuser`
- If run from inside a modmail conversation, AutoEnforcer replies in that same conversation.
- If run from a moderator comment context, AutoEnforcer creates a new internal modmail and posts the history there.

### Hotlist commands (modmail control)

- `!hotlistcomment` (or `!hotlistcomments`) - returns numbered hotlist comments, capped to 50.
- `!hotlistpost` (or `!hotlistposts`) - returns numbered hotlist posts, capped to 20.
- `!hotlistuser` (or `!hotlistusers`) - returns numbered hotlist users, capped to 50.
- Output is structured and numerically ordered so each row can be targeted precisely.
- Hotlist replies are posted back into the same modmail conversation.

### Strict range targeting from hotlist output

- Use explicit row numbers and ranges only. Example format: `1,3-4,5` (space-delimited in command: `1 3-4 5`).
- Targets are strict: only the listed rows are selected, nothing in between unless included in a stated range.
- Invalid tokens are rejected (for example, non-numeric, descending ranges, or `0`).

### Follow-up actions on selected rows

- `!timeout <ranges...>` - apply timeout to selected rows when the active hotlist is comments or users.
	- Example: `!timeout 1 3-4 5`
- `!lock <ranges...>` - lock selected rows when the active hotlist is posts.
	- Example: `!lock 2 6-9`
- Follow-up actions are bound to the latest hotlist snapshot in that same modmail conversation.

### Rules challenge command

- `!rules [username]` - moderator-only command that starts the rules challenge flow for a user. Works in modmail and in comments.
	- Example: `!rules`
	- Example: `!rules someuser`
- If username is omitted, AutoEnforcer targets the conversation user (modmail) when available.
- Flow: user acknowledges rules, then answers a random subreddit rule question; until they pass, new posts/comments are removed.

- `!norules [username]` - moderator-only command that clears an active rules challenge for the target user. Works in modmail and in comments.
	- Example: `!norules`
	- Example: `!norules someuser`
- If username is omitted in modmail, AutoEnforcer targets the conversation user when available.

Advanced threat commands use explicit mode and must start with either `preview` or `apply`.
Use `preview` to see targets and planned actions without changing anything.
Use `apply` to execute the action.
Preview summaries are posted as temporary sticky comments and are automatically removed after about 1 minute.

- `!firstwavefreeze <preview|apply> <durationMinutes> <windowMinutes>` - targets early-wave participants within the recent window and freezes their thread comments.
	- Example: `!firstwavefreeze preview 10 15`
	- Example: `!firstwavefreeze apply 10 15`

- `!firstwavetimeout <preview|apply> <durationMinutes> <windowMinutes>` - targets early-wave participants within the recent window and applies a timeout.
	- Example: `!firstwavetimeout preview 20 15`
	- Example: `!firstwavetimeout apply 20 15`

- `!hotlistsilence <preview|apply> <topN> <cooldownSeconds> <durationMinutes> <lookbackMinutes>` - picks the top N highest-risk users from recent thread activity plus report signals, applies silence cooldown, and removes their matching comments.
	- Example: `!hotlistsilence preview 5 120 20 30`
	- Example: `!hotlistsilence apply 5 120 20 30`

![HotList](https://seovegas.s3.us-east-2.amazonaws.com/hotlist.png)


- `!burstlockdown <preview|apply> <threshold> <windowMinutes> [lockMinutes]` - detects burst behavior (comment volume spike) and locks the post when the threshold is met. In `apply` mode, when the threshold is not yet met the app posts a sticky summary comment and rechecks every minute, live-editing that same comment with the latest scan results until the burst is detected (then it locks) or the maximum watch duration elapses. Omit `lockMinutes` or pass `0` for an indefinite lock with no auto-unlock.
	- Example: `!burstlockdown preview 25 5 15`
	- Example: `!burstlockdown apply 25 5 15`
	- Example: `!burstlockdown apply 25 5 0` (indefinite lock when triggered)
	- Example: `!burstlockdown apply 25 5` (indefinite lock when triggered)

	![Burst Lockdown!](https://seovegas.s3.us-east-2.amazonaws.com/burstlockdown.png)

- `!repeaterstimeout <preview|apply> <minRepeats> <durationMinutes> <lookbackMinutes>` - finds repeat participants over a lookback window and applies timeout.
	- Example: `!repeaterstimeout preview 3 20 30`
	- Example: `!repeaterstimeout apply 3 20 30`

- `!newaccountfreeze <preview|apply> <accountAgeDays> <windowMinutes>` - finds very new accounts active in the recent window and freezes their thread comments.
	- Example: `!newaccountfreeze preview 7 30`
	- Example: `!newaccountfreeze apply 7 30`

- `!raidclusterfreeze <preview|apply> <windowSeconds> <minAccounts>` - detects synchronized account clusters in a short interval and freezes their thread comments.
	- Example: `!raidclusterfreeze preview 30 4`
	- Example: `!raidclusterfreeze apply 30 4`

- `!evidencetimeout <preview|apply> <username> <durationMinutes>` - applies a targeted timeout for a specific user when thread evidence is present.
	- Example: `!evidencetimeout preview someuser 15`
	- Example: `!evidencetimeout apply someuser 15`



Notes:
- The command comment itself is treated as moderator control input, not a normal enforcement target.
- Summary comments created with `-s` are best-effort and are only posted when the command succeeds.
- `-s` is only supported by `!reset`, `!freeze`, `!timeout`, and `!silence`.
- Threat-command `preview` summaries are temporary and auto-clean after roughly 1 minute.

## What you'll get

AutoEnforcer is a moderator-only tool that lets you:

- Build complex moderation rules with a visual Rule Studio, no code required
- React to 20+ Reddit event types in real time (post create, comment submit, flair change, reports, AutoModerator filter, and more)
- Evaluate 79 built-in conditions across content, author history, and subreddit context
- Compute custom-derived trust, risk, engagement, controversy, and moderation pressure scores per user
- Monitor your top 20 posts for vote manipulation, score volatility, report pressure, and threads going out of hand
- Deploy one-click rule presets organized by tier (Launch Essentials, Growth Operations, Scale & Resilience, Bot Governance)
- Timeout or silence specific users in a thread with a single comment command
- Lock, sticky, freeze, or reset threads instantly from the comment box
- Track every moderation action in a Redis-backed audit log
- Pace actions automatically to stay within Reddit API rate limits
- Fail open on transient errors so enforcement degrades gracefully instead of breaking

Everything runs inside Reddit on Devvit. There is no external dashboard, no third-party service, no data leaving the platform.

## The Rules

| Rule | Details |
| --- | --- |
| Extended Rules Engine | Condition trees with AND/OR logic, nested groups, and multi-step action chains that fire on any supported Reddit event |
| Rule Studio | A full visual rule builder (React UI served via Devvit webview) for creating, editing, toggling, and deleting rule sets and child rules |
| 79 Condition Library | Content conditions (regex, links, images, score, edits, crossposts), author conditions (karma, age, risk, history, bans, mutes), and context conditions (time of day, traffic level, surge detection, AutoMod match) |


## 80+ Presets for subreddits of all sizes!

![Rule Studio rules list](https://seovegas.s3.us-east-2.amazonaws.com/ss1.png)


## Features

| Feature | Details |
| --- | --- |
| Custom Derived Scores | Activity Consistency, Submission Diversity, Moderation Pressure, Community Trust, Engagement Quality, and Controversy Index, all computed from live data |
| Vote Pulse Monitor | Samples your top 20 posts every scheduler tick and produces a Manipulation Index, Out-of-Hand Index, Score Volatility, Report Pressure, and High-Risk Post Count |
| Metric-Based Activation | Rule sets can activate only when subreddit or user activity metrics cross thresholds (posts/min, comments/hour, reports/hour, traffic level, user posting cadence) |
| Thread Commands | Moderator comment commands for reset, freeze, lockdown, sticky, timeout, and silence with automatic pacing, summary posting, and expiry management |
| Magic Presets | Pre-built rule configurations across four tiers covering spam, self-promo, newcomer risk, civility, harassment, hate speech, brigading, and bot governance |
| Member Scoring | Per-user stats (reports, removals, approvals, post/comment counts, first/last seen) with a computed risk score that feeds into condition evaluation |
| Activity Metrics | Minute-level and hour-level counters for posts, comments, and reports at both subreddit and user scope, with traffic-level classification |
| Action Pacing | Built-in rate-limit awareness with retry logic, exponential backoff, and distributed locking so bulk operations never trip Reddit's API limits |
| Moderation Log | Every action taken by AutoEnforcer is recorded with timestamp, actor, target, and detail for full auditability |
| App Tracker | Monitors other apps installed on your subreddit, logs their install/upgrade events and mod actions for cross-app visibility |
| Idempotency | Deterministic event tokens prevent duplicate processing of the same Reddit event, even under retry or scheduler overlap |
| Graceful Degradation | Every subsystem fails open on transient errors (timeouts, rate limits, network issues) with structured warning logs and bounded retries |

## Installation

Install from the Reddit App Directory and add it to your subreddit. Once installed:

1. Go to your subreddit
2. Open the subreddit menu (three-dot or mod tools)
3. Tap **AutoEnforcer: Rule Studio** to open the visual rule builder

![Menu Item!](https://seovegas.s3.us-east-2.amazonaws.com/ss2.png)

The Rule Studio opens in a webview, accessible only to moderators.

![Rule Studio](https://seovegas.s3.us-east-2.amazonaws.com/ss3.png)

## Usage

1. **Open Rule Studio** from the subreddit menu
2. **Create a Rule Set** — give it a name, pick which events trigger it, and optionally set metric-based activation conditions
3. **Add Rules** — each rule has a condition tree (content checks, author checks, context checks combined with AND/OR logic) and an action chain (remove, approve, comment, flag, send PM, send modmail, mute, webhook, and more)
4. **Or pick a Rule Preset** — choose from pre-built configurations organized by community size and moderation posture (conservative, balanced, strict)
5. **Toggle rules on or off** without deleting them
6. **Use thread commands** when you need immediate action in a specific thread

AutoEnforcer evaluates all supported thread comment commands on every matching comment event, regardless of whether any rule sets are currently enabled. Rule-set evaluation follows your enabled/disabled state, but command detection and command-side enforcement are always active.

The scheduler lifecycle is always-on: AutoEnforcer runs a bootstrap tick during install and upgrade, continues minute ticks via cron, and self-heals from event flow if minute ticks lapse long enough to look stale.

## Privacy

All rule data, user scores, activity metrics, and moderation logs are stored only inside Reddit's own Redis storage layer, scoped to your subreddit. No data is sent to external services. No API keys are required. No third-party analytics, no tracking, no outbound network calls.

## Permissions

| Permission | Why |
| --- | --- |
| Reddit API (moderator scope) | Read posts and comments, remove/approve content, submit comments, distinguish and sticky, lock/unlock posts, ban/unban and mute/unmute users, send PMs and modmail, read mod log, read user profiles |
| Redis | Store rule sets, rules, user stats, activity metrics, vote pulse snapshots, thread command state, moderation logs, idempotency markers, and app tracker data |
| Scheduler | Run the minute-tick for vote pulse collection, sticky release, timeout/silence expiry, and metric-activated rule evaluation |

## Known Limitations

- Thread commands are capped at 50 affected comments per sweep and 250 comments read per thread to stay within API budgets
- Timeout and silence durations max out at 6 hours (360 minutes), with lookback windows up to 24 hours (1440 minutes)
- Sticky durations max out at 60 minutes
- Vote Pulse samples only the top 20 posts per tick (by design, to keep API usage predictable)
- Custom derived scores are heuristic, they are useful signals but not ground truth, we will improve upon these as we grow.

## Updates

### This version

- Added `!norules [username]` command to clear an active rules challenge for a user. Available in both modmail and comment surfaces, matching `!rules` parity.
- Removed a comment-trigger bypass that allowed challenged users to slip thread-command-shaped comments past the rules-challenge enforcer. Challenged users' comments are now always gated until they complete the challenge; mods can use `!norules` from modmail as the escape hatch.
- `!rules` and `!norules` are now confirmed to work from both modmail and comments, with mod-only authorization and a modlog entry for every clear.

## License

This project is licensed under the GNU General Public License v3.0 only (GPL-3.0-only).
