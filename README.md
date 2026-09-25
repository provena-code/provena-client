# provena-client

An instructor-facing dashboard for browsing and replaying students' programming work. It shows logs collected by the [Provena VSCode plugin](https://github.com/thomaswp/provena-vscode) and stored by the [provena-server](https://github.com/thomaswp/provena-server).

For any file a student worked on, you can replay its full edit history. You can also see which parts of the code the student typed, which were pasted from outside the editor, and which were generated or edited by other tools.

## Setup

### Prerequisites

* A running [provena-server](https://github.com/thomaswp/provena-server). Follow the setup instructions in its README.
* [Node.js](https://nodejs.org/) and npm.

### Install

The project depends on [provena-core](https://github.com/thomaswp/provena-core), which is included as a git submodule. Clone with submodules:

```sh
git clone --recurse-submodules https://github.com/thomaswp/provena-client.git
cd provena-client
npm install
```

If you already cloned without submodules, run `git submodule update --init` before `npm install`.

### Configure

Copy `.env.template` to `.env` and set:

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Root URL of your provena-server, e.g. `http://127.0.0.1:8001`. |
| `VITE_APP_BASE_PATH` | Path the client is served from, e.g. `/provena/`. Defaults to `/`. You can leave it as `/` for local development. |

### Run locally

```sh
npm run dev
```

Vite prints the local URL to open, usually http://localhost:5173.

### Deploy

```sh
npm run build
```

This writes a static site to `dist/`, which you can serve with any web server. Values from `.env` are baked in at build time, so set `VITE_APP_BASE_PATH` to match where the site will be hosted **before** you build.

### Anonymizing students (optional)

By default, the dashboard shows each student's SubjectID as it's stored on the server (for example, their email). To show anonymous IDs instead, and to blank out identifying information in students' code, add a crosswalk. This is mostly intended for research purposes. **Note**: A more robust sepratetion of identifiers from research data is planned in the server, but not yet implemented.

> [!WARNING]
> The crosswalk is compiled into the site, so anyone who can load the site can read it. Only use a crosswalk when running the dashboard **locally** (`npm run dev`). Never deploy or share a build made with a crosswalk, and never commit the crosswalk. Also note that anonymization only affects what the dashboard displays. The server still sends real SubjectIDs to the browser.

1. Create `src/data/crosswalk.csv`. The `src/data` folder is gitignored. The first row must be a header that includes these two columns:

   | Column | Meaning |
   | --- | --- |
   | `SubjectID` | The student's ID as stored on the server. |
   | `AnonID` | The ID to show in the dashboard. Must be unique. |

   Any other columns, such as a username or student number, are treated as identifying information. So is `SubjectID`. Wherever one of these values appears in a student's code, clipboard, or logged events, it's blanked out (█). Matching ignores case and includes matches from every student's row, not just the student you're viewing. So only include identifiers that are unique strings, like usernames or emails. Don't include names or other common words. Values shorter than 3 characters are ignored.

   ```csv
   SubjectID,AnonID,Username
   student1@example.edu,S001,student1
   student2@example.edu,S002,student2
   ```

   Values can't contain commas or quotes.

2. Convert the CSV to JSON:

   ```sh
   npm run crosswalk
   ```

3. Restart `npm run dev`.

When a crosswalk is in use:

* Students who aren't listed in it are hidden.
* Any line in a student's code that begins with `Author:`, `Name:`, `Email:`, `Class:`, or `Lab:` is blanked out entirely.

To turn anonymization off, delete `src/data/crosswalk.json` and restart.

## Using the dashboard

### Logging in

For now you log in with an API key. SSO support is planned. Use any key from the `testing_api_keys` list in your server's `src/write_config.yaml`.

The key is saved in your browser's local storage, so you only need to enter it once. To log out or switch keys, click the logout icon in the top-right corner.

### Browsing

The home page lists all **Assignments** and all **Students**.

* **By assignment:** pick an assignment to see a table of students who worked on it, with each student's last submission time and max score. Click a column header to sort. Select a student to view their files for that assignment.
* **By student:** pick a student to see every file they have worked on, across all assignments.
* **By time range:** on a student's page, choose a start and end time under **Select Time Range**, then click **View Events**. This shows that student's activity across all files within the range. *This view is still in development and may have bugs.*

### Viewing a file's history

Choose a file from the list on the left to open its replay. You can:

* **Replay the history.** Press play, step one frame at a time with the back/forward buttons (hold them down to step continuously), or drag the slider. The frame counter shows your position.
* **Highlight provenance.** Tick the **Highlight** checkbox to color the code by where it came from:

  | Color | Meaning |
  | --- | --- |
  | Green | Typed by the student |
  | Yellow | Generated by the IDE (e.g., autocomplete or formatting) |
  | Gray | Text already in the file when logging began |
  | Purple | Pasted from outside the student's code |
  | Orange | Edited outside the editor |
  | Red | Unknown (can be caused by logging errors) |

* **Jump to when text was written.** Ctrl+click (Cmd+click on macOS) on any part of the code to jump to roughly the frame where it was created.
* **See authorship details.** Hover over any part of the code. The **Span Metadata** panel shows its author and the start and end time of its creation.
* **Inspect logged events.** The **Event Details** panel shows the raw logging event(s) behind the current frame.
* **See the student's clipboard.** The clipboard panel shows what the student had copied at the current frame. For privacy, this only includes text that was copied from, or pasted into, the student's code.
* **Copy the code.** Click the 📄 button next to the file name to copy the code as it appears at the current frame.

### Discontinuities

Red tick marks under the slider mark **discontinuities**. These are points where the logged code didn't match what Provena expected, such as when a file was changed while logging was off. Click a tick mark to jump to that frame. The Event Details panel also shows a **Discontinuity** badge on these frames.

### History generation errors

Provena tries to work out the origin of every character in a student's code, but logging errors sometimes make this impossible. When that happens, a **History Generation Errors** table appears above the viewer. It lists each error and the frame where it happened. The code viewer's border also turns red on frames where the reconstructed history may be inaccurate. These errors are usually minor, but they mean you should interpret the provenance for that file with some care.

### Performance

The dashboard processes logs in your browser, so large logs can take a while to load (around 10 seconds). Loading may slow down or pause if the browser window isn't focused.
