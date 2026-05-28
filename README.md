# AutoEnforcer

AutoEnforcer is made to enforce the moderators rules & decisions. It is not a replacement moderator, it is not AutoMod. It is a tool that helps moderators enforce actions on a wide spectrum, and made to be reliable. Only you know how to control your community, AutoEnforcer makes it possible to enforce your rules without breaking a sweat, it's built to give moderators the edge they need to handle the tide. 


## AE's Signature Features
Post Menu Features
![Post Cmds](https://seovegas.s3.us-east-2.amazonaws.com/new2/postcmds.png)

Reset Lets you remove all of the posts from the past X minutes up to 120 minutes and banish the users that were caught in the removal from commenting on that post again. (Only affects them from commenting on that post)

![Reset](https://seovegas.s3.us-east-2.amazonaws.com/new2/reset.png)

Drip Mode Toggle will toggle on and off drip mode respectively, Drip Mode is quality and snoo control, it will take action when the post gets hot and start to queue comments from low karma, new accounts, short comments, and a few other factors, while allowing your normal sub contributors to post

![Drip](https://seovegas.s3.us-east-2.amazonaws.com/new2/drip.png)

Sentry Mode Toggle will watch for attempts at brigading by activating and analyzing the comments for patterns it finds and seeing if the commentors have a high match rate of top 5 subs they post in. If so it will lock the post and notify the mods via pm, the sentry mode post will be updated to reflect the people involved.

![Sentry](https://seovegas.s3.us-east-2.amazonaws.com/new2/sentry.png)

Banish is a comment menu option that will remove all of the comments made from the user that you issue the action, from that point forward it will not allow that user to make any more comments on that specific post.

![banish](https://seovegas.s3.us-east-2.amazonaws.com/new2/banish.png)


## 80+ Presets for subreddits of all sizes!

![Rule Studio rules list](https://seovegas.s3.us-east-2.amazonaws.com/ss1.png)

## Features

| Feature | Details |
| --- | --- |
| Custom Derived Scores | Activity Consistency, Submission Diversity, Moderation Pressure, Community Trust, Engagement Quality, and Controversy Index, all computed from live data |
| Vote Pulse Monitor | Samples your top 20 posts every scheduler tick and produces a Manipulation Index, Out-of-Hand Index, Score Volatility, Report Pressure, and High-Risk Post Count |
| Metric-Based Activation | Rule sets can activate only when subreddit or user activity metrics cross thresholds (posts/min, comments/hour, reports/hour, traffic level, user posting cadence) |
| Thread Commands | Moderator command surface for reset, freeze, lockdown, sticky, timeout, silence, banish, Drip Mode, and Sentry Mode with automatic pacing, summary posting, expiry management, and post-menu quick actions |
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


## Privacy

All rule data, user scores, activity metrics, and moderation logs are stored only inside Reddit's own Redis storage layer, scoped to your subreddit. No data is sent to external services. No API keys are required. No third-party analytics, no tracking, no outbound network calls.

## Updates

### v1.3.4

- Added `!banish <user>` thread command and comment-menu action. Banish removes the target user's comments from the current post, blocks future comments from that user on the same post, posts "You have been banished." on the first removed comment in the batch, and posts the same reason on future blocked comments for banished users.
- Added a dedicated post-menu Reset flow with a lookback picker (5/10/15/30/60/90/120 minutes) and increased reset command lookback support to 120 minutes.
- Updated post-menu Drip Mode toggle behavior to correctly detect active post state and switch between enable/disable without false "on" dispatches.
- Updated post-menu Sentry Mode toggle behavior to directly toggle Redis state with stale-key cleanup so on/off status cannot get stuck in an incorrect state.

### v1.3.3
- Updates to companion wiki snapshot

### v1.3.2
- Updated to latest devvit

### v1.3.2

- Drip Mode comments now render the dedicated `crowdcontrol.png` banner. The comment-banner selector previously only matched titles containing "crowd control", so Drip Mode replies fell through to the generic apply banner. Extended the regex so any Drip Mode surface (post-level or sub-wide `!drip on/off` replies) uses the Crowd Control banner.
- Chrome companion: fixed the user dossier modal showing the previous user's body when clicking a new badge. The modal is a singleton, but `openUserModal` no longer leaves stale content behind — it re-renders immediately from the per-badge cache, falls back to a username-specific loading placeholder, and drops late-arriving fetches whose badge is no longer the active one. Clicking an already-cached badge now refreshes from cache instead of skipping the render entirely.

### v1.3.1

- Fixed `!stickycomment` failing with a `comment-sticky-forbidden` error. The Devvit `distinguish` API requires a plain boolean argument — corrected all call sites.
- `!stickycomment` now clears any existing stickied comment on the post before applying the new one, preventing silent rejections when a comment is already stickied.
- Added an `alreadyStickied` guard: if the target comment is already distinguished, the sticky step is skipped and only the timed-release job is scheduled.
- `!sentry` now clears the previous sticky before distinguishing its summary comment, so repeated sentry calls on the same post no longer fail.

### v1.3.0

- Added `!norules [username]` command to clear an active rules challenge for a user. Works in both modmail and comments, matching `!rules` parity.
- Removed a comment-trigger bypass that allowed challenged users to slip thread-command-shaped comments past the rules-challenge enforcer. Challenged users are now always gated until they pass; mods can use `!norules` as the escape hatch.
- `!rules` and `!norules` confirmed working from both modmail and comments, with mod-only authorization and a modlog entry for every action.

### v1.2.0

- Companion Chrome extension wired up end-to-end: encrypted wiki-snapshot publisher on the server, AES-GCM client decryption, multi-subreddit key slots, inline diagnostic pills on posts and comments, and an in-page command palette. See the **Chrome Extension** section below for the full security posture and side-load instructions.
- Hardened the extension runtime: 6-second message timeouts, bounded prefetch concurrency, debounced badge attachment, orphan-popover cleanup, retry-on-click for failed loads, and SPA navigation re-attach so badges survive Reddit's client-side routing.
- Strict per-sub UI gating: pills, dossiers, and the command palette only render on subreddits whose encryption keys you've explicitly registered. Other subs see zero AutoEnforcer UI and zero network activity.
- Badge placement now anchors next to the author byline on both `shreddit-post` feed cards and `shreddit-comment` threads, so pills sit inline with the username instead of grabbing a phantom row above the title.

## Chrome Extension

A companion Chrome extension brings AutoEnforcer's intel and command surface directly into the Reddit web UI without ever leaving the moderator's browser tab.

> **Official Chrome Web Store listing: coming soon** (submitted for review). In the meantime you can side-load the signed build directly from this repo:
>
>
## Visit r/AutoEnforcer for more info
>
> Some browsers and antivirus tools flag unsigned extension zips by default. The hash above lets you confirm the file was not tampered with; full source is GPL-3.0 and auditable in this repo.
>
> **Install:** extract the zip to a folder you will keep, open `chrome://extensions`, toggle **Developer Mode** on, click **Load unpacked**, and select the extracted folder. Pin the icon, then add your subreddit + decryption key from the AutoEnforcer Devvit app.

![Chrome1](https://seovegas.s3.us-east-2.amazonaws.com/commands.png)

![Chrome2](https://seovegas.s3.us-east-2.amazonaws.com/ext1.png)

![Chrome3](https://seovegas.s3.us-east-2.amazonaws.com/ext2.png)

![Chrome4](https://seovegas.s3.us-east-2.amazonaws.com/ext3.png)

### What it does

- **Inline diagnostic pills** on every post and comment in your subreddit - author risk, report pressure, account age, and trust score render right next to the byline so you can triage without clicking through.
- **Click-to-expand dossiers** showing recent history, mod actions, and derived scores for any user, pulled live from your sub's own Redis snapshot.
- **In-page command palette** for issuing thread commands (`!timeout`, `!silence`, `!freeze`, `!lockdown`, etc.) without typing them as comments - keyboard-driven, autocompleted, and scoped to the thread you're viewing.
- **Multi-subreddit slot support** - mods running multiple communities can register a key per sub and the extension auto-gates UI to only show pills on subs you've actually authorized.

### Security posture

The extension is built around a zero-trust, zero-exfiltration model:

- **AES-GCM A256GCM encrypted snapshots.** Diagnostic data never leaves Reddit in cleartext. The server publishes an encrypted JSON snapshot to a moderator-only wiki page on your sub; the extension decrypts it locally in the browser using a key only you hold.
- **64-hex-character encryption keys, stored in `chrome.storage.local` only.** Keys are never synced, never transmitted, never logged. Lose the key, lose the data - that's the point.
- **Per-subreddit key isolation.** Each subreddit slot carries its own key. A compromised key for one sub cannot decrypt another sub's snapshot.
- **Strict subreddit gating.** Pills, dossiers, and the command palette only render on subreddits whose keys you've explicitly added. Browsing r/all or any unconfigured sub shows zero AutoEnforcer UI and makes zero network calls.
- **No external servers.** The extension talks only to `reddit.com`. There is no analytics endpoint, no telemetry, no third-party fetch, no remote config. Inspect the network tab - you'll see Reddit and nothing else.
- **Manifest V3, minimum permissions.** `host_permissions` are scoped to `reddit.com` only. No `<all_urls>`, no `tabs`, no `webRequest`, no `cookies`.
- **Bounded runtime.** Every background message has a 6-second timeout, prefetch concurrency is capped at 3, and badge attachment is debounced - so a flaky network or a hostile page cannot wedge your browser or stampede Reddit's API.
- **Open source, GPL-3.0.** The extension ships from the same repo as the server. Every line of crypto, every network call, every storage write is auditable.

Pairing the extension with AutoEnforcer means your moderation surface lives where you already work - in the thread, on the post, next to the comment - with full cryptographic guarantees that nothing crosses the wire that shouldn't.

## Bugs & feedback

Visit r/AutoEnforcer

## License

This project is licensed under the GNU General Public License v3.0 only (GPL-3.0-only).
