# ⏱️ Redmine Timer for VSCode

Track your development time directly from VSCode and log it into your Redmine projects — with one click.

![Icon](images/icon.png)

---

## 🚀 Features

| Feature                                 | Supported |
| --------------------------------------- | --------- |
| Manual and automatic time tracking      | ✅        |
| Issue selection from Redmine            | ✅        |
| Activity selection (Redmine activities) | ✅        |
| Send tracked time to Redmine            | ✅        |
| Auto-stop on inactivity                 | ✅        |
| Auto-start on code edits                | ✅        |
| Change issue status after time entry    | ✅        |
| Multilanguage UI                        | ✅        |

---

## 🛠️ How It Works

- Track your time manually or automatically.
- Select the active issue from a Redmine project.
- Time is displayed in the VSCode status bar.
- With one click, send time entries directly to Redmine.
- Optionally update issue status after submission.

---

## ⚙️ Extension Settings

Accessible via VSCode settings (`File > Preferences > Settings` or `Ctrl+,`):

| Setting                        | Description                                         |
| ------------------------------ | --------------------------------------------------- |
| `redmineByDeVylm.apiKey`       | Your Redmine API key                                |
| `redmineByDeVylm.redmineUrl`   | Base URL to your Redmine instance (no trailing `/`) |
| `redmineByDeVylm.projectId`    | Redmine project identifier                          |
| `redmineByDeVylm.activityId`   | Default Redmine activity ID                         |
| `redmineByDeVylm.autoTracking` | Enable automatic tracking on code changes           |
| `redmineByDeVylm.idleTimeout`  | Time in seconds before auto-stop due to inactivity  |

---

## 📸 Screenshots

> Coming soon — add your screenshots here.

---

## 🔧 Requirements

- A valid Redmine account
- API access enabled
- Your Redmine instance must support time entries

---

## 🧪 Development

```bash
# install dependencies
npm install

# compile TypeScript
npm run compile

# open VSCode and hit F5 to debug
```

This extension is free and open-source under MIT license. However, to ensure feature stability and avoid fragmentation, all official updates go through pull requests reviewed in this repository.
Forks are welcome, but only the main repo is published to VSCode Marketplace.
