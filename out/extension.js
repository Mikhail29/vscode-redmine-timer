"use strict";
// extension.ts — без node-fetch, через https
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const https = __importStar(require("https"));
const lang_1 = require("./lang");
let statusBarItem;
let interval;
let projectData;
let projectFilePath;
function activate(context) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder open.');
        return;
    }
    const workspacePath = workspaceFolders[0].uri.fsPath;
    const vscodeDir = path.join(workspacePath, '.vscode');
    projectFilePath = path.join(vscodeDir, 'project.json');
    if (!fs.existsSync(vscodeDir))
        fs.mkdirSync(vscodeDir);
    if (fs.existsSync(projectFilePath)) {
        const data = fs.readFileSync(projectFilePath, 'utf8');
        projectData = JSON.parse(data);
    }
    else {
        projectData = {
            redmine_project_id: '',
            active_issue_id: 0,
            tracking: false,
            last_start: null,
            total_tracked: 0,
            api_key: '',
            redmine_url: '',
            activity_id: 9,
        };
    }
    reloadProjectData();
    saveProjectData();
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.command = 'devylmRedmine.showContextMenu';
    context.subscriptions.push(statusBarItem);
    updateStatusBar();
    vscode.workspace.onDidChangeTextDocument(() => {
        lastActivityTime = Date.now();
        const autoTracking = vscode.workspace
            .getConfiguration('redmineByDeVylm')
            .get('autoTracking');
        if (autoTracking && !projectData.tracking) {
            startTracking();
            vscode.window.showInformationMessage((0, lang_1.t)('autoStartedDueToEdit'));
        }
    });
    let lastActivityTime = Date.now();
    vscode.window.onDidChangeTextEditorSelection(() => {
        lastActivityTime = Date.now();
    });
    setInterval(() => {
        const idleTimeout = vscode.workspace
            .getConfiguration('redmineByDeVylm')
            .get('idleTimeout') || 300;
        const autoTracking = vscode.workspace
            .getConfiguration('redmineByDeVylm')
            .get('autoTracking');
        if (autoTracking && projectData.tracking) {
            const now = Date.now();
            if ((now - lastActivityTime) / 1000 > idleTimeout) {
                stopTracking();
                vscode.window.showInformationMessage((0, lang_1.t)('autoStoppedDueToInactivity'));
            }
        }
    }, 10000);
    context.subscriptions.push(vscode.commands.registerCommand('devylmRedmine.showContextMenu', async () => {
        const selection = await vscode.window.showQuickPick([
            projectData.tracking ? (0, lang_1.t)('stopTracking') : (0, lang_1.t)('startTracking'),
            (0, lang_1.t)('setIssue'),
            (0, lang_1.t)('enterTime'),
            (0, lang_1.t)('setActivity'),
            (0, lang_1.t)('sendTime'),
            (0, lang_1.t)('sendTimeAndChangeStatus'),
        ], { placeHolder: (0, lang_1.t)('placeholder') });
        switch (selection) {
            case (0, lang_1.t)('stopTracking'):
                stopTracking();
                break;
            case (0, lang_1.t)('startTracking'):
                startTracking();
                break;
            case (0, lang_1.t)('setIssue'):
                selectIssueFromList();
                break;
            case (0, lang_1.t)('enterTime'):
                const timeInput = await vscode.window.showInputBox({
                    prompt: (0, lang_1.t)('enterTimePrompt'),
                });
                if (timeInput) {
                    const manual = parseFloat(timeInput);
                    if (!isNaN(manual)) {
                        projectData.total_tracked = Math.round(manual * 3600);
                        saveProjectData();
                        updateStatusBar();
                        vscode.window.showInformationMessage(`${(0, lang_1.t)('manualTimeSet')} ${manual}h`);
                    }
                }
                break;
            case (0, lang_1.t)('sendTime'):
                sendTimeEntry();
                break;
            case (0, lang_1.t)('sendTimeAndChangeStatus'):
                if (projectData.total_tracked > 0) {
                    await sendTimeEntry();
                }
                await changeIssueStatus();
                break;
            case (0, lang_1.t)('setActivity'):
                setActivityId();
                break;
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('devylmRedmine.setActivityId', () => {
        setActivityId();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('devylmRedmine.toggleTracking', () => {
        if (projectData.tracking) {
            stopTracking();
        }
        else {
            startTracking();
        }
    }));
    context.subscriptions.push(vscode.commands.registerCommand('devylmRedmine.sendTimeEntry', () => {
        sendTimeEntry();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('devylmRedmine.setActiveIssue', () => {
        selectIssueFromList();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('devylmRedmine.setSettings', () => {
        vscode.commands.executeCommand('workbench.action.openSettings', 'redmineByDeVylm');
    }));
    context.subscriptions.push(vscode.commands.registerCommand('devylmRedmine.sendTimeAndChangeStatus', () => {
        if (projectData.total_tracked > 0) {
            sendTimeEntry();
        }
        changeIssueStatus();
    }));
}
exports.activate = activate;
function reloadProjectData() {
    const config = vscode.workspace.getConfiguration('redmineByDeVylm');
    projectData.api_key = config.get('apiKey') || projectData.api_key;
    projectData.redmine_url = config.get('redmineUrl') || projectData.redmine_url;
    projectData.redmine_project_id =
        config.get('projectId') || projectData.redmine_project_id;
    projectData.activity_id = config.get('activityId') || projectData.activity_id;
}
function startTracking() {
    projectData.tracking = true;
    projectData.last_start = new Date().toISOString();
    saveProjectData();
    updateStatusBar();
    interval = setInterval(() => updateStatusBar(), 1000);
}
function stopTracking() {
    if (projectData.last_start) {
        const lastStart = new Date(projectData.last_start);
        const now = new Date();
        const diff = Math.floor((now.getTime() - lastStart.getTime()) / 1000);
        projectData.total_tracked += diff;
    }
    projectData.tracking = false;
    projectData.last_start = null;
    saveProjectData();
    updateStatusBar();
    if (interval)
        clearInterval(interval);
}
function updateStatusBar() {
    let totalSeconds = projectData.total_tracked;
    if (projectData.tracking && projectData.last_start) {
        const lastStart = new Date(projectData.last_start);
        const now = new Date();
        totalSeconds += Math.floor((now.getTime() - lastStart.getTime()) / 1000);
    }
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const issue = projectData.active_issue_id
        ? `#${projectData.active_issue_id}`
        : (0, lang_1.t)('noIssue');
    statusBarItem.text = `$(clock) ${issue} ${h}h ${m}m ${s}s`;
    statusBarItem.tooltip = (0, lang_1.t)('tooltip');
    statusBarItem.show();
}
function saveProjectData() {
    fs.writeFileSync(projectFilePath, JSON.stringify(projectData, null, 2));
}
function sendTimeEntry() {
    stopTracking();
    reloadProjectData();
    const minutes = Math.round(projectData.total_tracked / 60);
    if (!projectData.api_key ||
        !projectData.redmine_url ||
        !projectData.active_issue_id ||
        !projectData.activity_id) {
        vscode.window.showErrorMessage('Missing required fields.');
        return;
    }
    const payload = JSON.stringify({
        time_entry: {
            issue_id: projectData.active_issue_id,
            hours: minutes / 60,
            activity_id: projectData.activity_id,
            comments: 'Auto-tracked from VSCode',
        },
    });
    const url = new URL(`${projectData.redmine_url}/time_entries.json?key=${projectData.api_key}`);
    const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
        },
    };
    const req = https.request(options, res => {
        res.on('data', d => console.log('Redmine:', d.toString()));
        if (res.statusCode === 201) {
            vscode.window.showInformationMessage(`${(0, lang_1.t)('timeSent')} (${minutes} min)`);
            projectData.total_tracked = 0;
            saveProjectData();
            updateStatusBar();
        }
        else {
            vscode.window.showErrorMessage(`${(0, lang_1.t)('sendError')} ${res.statusCode}`);
        }
    });
    req.on('error', err => vscode.window.showErrorMessage(`${(0, lang_1.t)('requestError')} ${err.message}`));
    req.write(payload);
    req.end();
}
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https
            .get(url, res => {
            let data = '';
            res.on('data', chunk => (data += chunk));
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                }
                catch (e) {
                    reject(e);
                }
            });
        })
            .on('error', reject);
    });
}
async function setActivityId() {
    reloadProjectData();
    if (!projectData.api_key || !projectData.redmine_url) {
        vscode.window.showErrorMessage('Missing Redmine API key or URL');
        return;
    }
    try {
        const url = `${projectData.redmine_url}/enumerations/time_entry_activities.json?key=${projectData.api_key}`;
        const json = await fetchJson(url);
        const activities = json.time_entry_activities;
        const pickItems = activities.map((act) => ({
            label: act.name,
            description: `ID: ${act.id}`,
            id: act.id,
        }));
        const picked = await vscode.window.showQuickPick(pickItems, {
            placeHolder: (0, lang_1.t)('chooseActivity'),
            matchOnDescription: true,
        });
        if (picked) {
            projectData.activity_id = picked.id;
            saveProjectData();
            vscode.window.showInformationMessage(`${(0, lang_1.t)('activitySet')} ${picked.label}`);
        }
    }
    catch (err) {
        vscode.window.showErrorMessage(`${(0, lang_1.t)('requestError')} ${err.message}`);
    }
}
async function selectIssueFromList() {
    reloadProjectData();
    if (!projectData.api_key ||
        !projectData.redmine_url ||
        !projectData.redmine_project_id) {
        vscode.window.showErrorMessage((0, lang_1.t)('missingRequiredConfiguration'));
        return;
    }
    vscode.window.showInformationMessage((0, lang_1.t)('fetchingIssues'));
    const url = `${projectData.redmine_url}/issues.json?key=${projectData.api_key}&project_id=${projectData.redmine_project_id}&limit=100`;
    try {
        const json = await fetchJson(url);
        const issues = json.issues;
        if (!issues.length) {
            vscode.window.showWarningMessage((0, lang_1.t)('noIssuesFound'));
            return;
        }
        const pickItems = issues.map((issue) => ({
            label: `[#${issue.id}] ${issue.subject}`,
            description: issue.description || '',
            issueId: issue.id,
        }));
        const picked = await vscode.window.showQuickPick(pickItems, {
            placeHolder: (0, lang_1.t)('chooseIssue'),
            matchOnDescription: true,
        });
        if (picked) {
            if (projectData.active_issue_id != picked.issueId &&
                projectData.total_tracked > 0) {
                if (projectData.tracking) {
                    stopTracking();
                }
                sendTimeEntry();
            }
            projectData.active_issue_id = picked.issueId;
            saveProjectData();
            updateStatusBar();
            vscode.window.showInformationMessage(`${(0, lang_1.t)('setIssueConfirm')} #${picked.issueId}`);
        }
    }
    catch (err) {
        vscode.window.showErrorMessage(`${(0, lang_1.t)('requestError')} ${err.message}`);
    }
}
async function changeIssueStatus() {
    reloadProjectData();
    const url = `${projectData.redmine_url}/issue_statuses.json?key=${projectData.api_key}`;
    try {
        const json = await fetchJson(url);
        const statuses = json.issue_statuses;
        if (!statuses || statuses.length === 0) {
            vscode.window.showWarningMessage((0, lang_1.t)('noStatusesFound'));
            return;
        }
        const pickItems = statuses.map((status) => ({
            label: status.name,
            description: `ID: ${status.id}`,
            id: status.id,
        }));
        const picked = await vscode.window.showQuickPick(pickItems, {
            placeHolder: (0, lang_1.t)('chooseStatus'),
            matchOnDescription: true,
        });
        if (!picked)
            return;
        const issueId = projectData.active_issue_id;
        const updateUrl = `${projectData.redmine_url}/issues/${issueId}.json?key=${projectData.api_key}`;
        const payload = JSON.stringify({ issue: { status_id: picked.id } });
        const options = {
            method: 'PUT',
            hostname: new URL(updateUrl).hostname,
            path: new URL(updateUrl).pathname + new URL(updateUrl).search,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload),
            },
        };
        const req = https.request(options, res => {
            if (res.statusCode === 204) {
                vscode.window.showInformationMessage(`${(0, lang_1.t)('statusUpdated')} ${picked.label}`);
            }
            else {
                vscode.window.showErrorMessage(`${(0, lang_1.t)('statusUpdateFailed')} ${res.statusCode}`);
            }
        });
        req.on('error', err => {
            vscode.window.showErrorMessage(`${(0, lang_1.t)('requestError')} ${err.message}`);
        });
        req.write(payload);
        req.end();
    }
    catch (err) {
        vscode.window.showErrorMessage(`${(0, lang_1.t)('requestError')} ${err.message}`);
    }
}
