// extension.ts — без node-fetch, через https

import * as vscode from 'vscode'
import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import { t } from './lang'

interface ProjectData {
	redmine_project_id: string
	active_issue_id: number
	tracking: boolean
	last_start: string | null
	total_tracked: number
	api_key: string
	redmine_url: string
	activity_id?: number
}

let statusBarItem: vscode.StatusBarItem
let interval: ReturnType<typeof setInterval> | undefined
let projectData: ProjectData
let projectFilePath: string

export function activate(context: vscode.ExtensionContext) {
	const workspaceFolders = vscode.workspace.workspaceFolders
	if (!workspaceFolders) {
		vscode.window.showErrorMessage('No workspace folder open.')
		return
	}

	const workspacePath = workspaceFolders[0].uri.fsPath
	const vscodeDir = path.join(workspacePath, '.vscode')
	projectFilePath = path.join(vscodeDir, 'project.json')

	if (!fs.existsSync(vscodeDir)) fs.mkdirSync(vscodeDir)
	if (fs.existsSync(projectFilePath)) {
		const data = fs.readFileSync(projectFilePath, 'utf8')
		projectData = JSON.parse(data)
	} else {
		projectData = {
			redmine_project_id: '',
			active_issue_id: 0,
			tracking: false,
			last_start: null,
			total_tracked: 0,
			api_key: '',
			redmine_url: '',
			activity_id: 9,
		}
	}

	reloadProjectData()
	saveProjectData()

	statusBarItem = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Left,
		100
	)
	statusBarItem.command = 'devylmRedmine.showContextMenu'
	context.subscriptions.push(statusBarItem)
	updateStatusBar()

	vscode.workspace.onDidChangeTextDocument(() => {
		lastActivityTime = Date.now()

		const autoTracking = vscode.workspace
			.getConfiguration('redmineByDeVylm')
			.get<boolean>('autoTracking')
		if (autoTracking && !projectData.tracking) {
			startTracking()
			vscode.window.showInformationMessage(t('autoStartedDueToEdit'))
		}
	})

	let lastActivityTime = Date.now()

	vscode.window.onDidChangeTextEditorSelection(() => {
		lastActivityTime = Date.now()
	})

	setInterval(() => {
		const idleTimeout =
			vscode.workspace
				.getConfiguration('redmineByDeVylm')
				.get<number>('idleTimeout') || 300
		const autoTracking = vscode.workspace
			.getConfiguration('redmineByDeVylm')
			.get<boolean>('autoTracking')
		if (autoTracking && projectData.tracking) {
			const now = Date.now()
			if ((now - lastActivityTime) / 1000 > idleTimeout) {
				stopTracking()
				vscode.window.showInformationMessage(t('autoStoppedDueToInactivity'))
			}
		}
	}, 10000)

	context.subscriptions.push(
		vscode.commands.registerCommand(
			'devylmRedmine.showContextMenu',
			async () => {
				const autoTracking = vscode.workspace
					.getConfiguration('redmineByDeVylm')
					.get<boolean>('autoTracking')
				let menuItems = []
				if (autoTracking) {
					menuItems = [
						t('setIssue'),
						t('enterTime'),
						t('setActivity'),
						t('sendTime'),
						t('sendTimeAndChangeStatus'),
					]
				} else {
					menuItems = [
						projectData.tracking ? t('stopTracking') : t('startTracking'),
						t('setIssue'),
						t('enterTime'),
						t('setActivity'),
						t('sendTime'),
						t('sendTimeAndChangeStatus'),
					]
				}
				const selection = await vscode.window.showQuickPick(menuItems, {
					placeHolder: t('placeholder'),
				})

				switch (selection) {
					case t('stopTracking'):
						stopTracking()
						break
					case t('startTracking'):
						startTracking()
						break
					case t('setIssue'):
						selectIssueFromList()
						break
					case t('enterTime'):
						const timeInput = await vscode.window.showInputBox({
							prompt: t('enterTimePrompt'),
						})
						if (timeInput) {
							const manual = parseFloat(timeInput)
							if (!isNaN(manual)) {
								projectData.total_tracked = Math.round(manual * 3600)
								saveProjectData()
								updateStatusBar()
								vscode.window.showInformationMessage(
									`${t('manualTimeSet')} ${manual}h`
								)
							}
						}
						break
					case t('sendTime'):
						sendTimeEntry()
						break
					case t('sendTimeAndChangeStatus'):
						if (projectData.total_tracked > 0) {
							await sendTimeEntry()
						}
						await changeIssueStatus()
						break
					case t('setActivity'):
						setActivityId()
						break
				}
			}
		)
	)

	context.subscriptions.push(
		vscode.commands.registerCommand('devylmRedmine.setActivityId', () => {
			setActivityId()
		})
	)

	context.subscriptions.push(
		vscode.commands.registerCommand('devylmRedmine.toggleTracking', () => {
			if (projectData.tracking) {
				stopTracking()
			} else {
				startTracking()
			}
		})
	)

	context.subscriptions.push(
		vscode.commands.registerCommand('devylmRedmine.sendTimeEntry', () => {
			sendTimeEntry()
		})
	)

	context.subscriptions.push(
		vscode.commands.registerCommand('devylmRedmine.setActiveIssue', () => {
			selectIssueFromList()
		})
	)

	context.subscriptions.push(
		vscode.commands.registerCommand('devylmRedmine.setSettings', () => {
			vscode.commands.executeCommand(
				'workbench.action.openSettings',
				'redmineByDeVylm'
			)
		})
	)

	context.subscriptions.push(
		vscode.commands.registerCommand(
			'devylmRedmine.sendTimeAndChangeStatus',
			() => {
				if (projectData.total_tracked > 0) {
					sendTimeEntry()
				}
				changeIssueStatus()
			}
		)
	)
}

function reloadProjectData() {
	const config = vscode.workspace.getConfiguration('redmineByDeVylm')
	projectData.api_key = config.get('apiKey') || projectData.api_key
	projectData.redmine_url = config.get('redmineUrl') || projectData.redmine_url
	projectData.redmine_project_id =
		config.get('projectId') || projectData.redmine_project_id
	projectData.activity_id = config.get('activityId') || projectData.activity_id
}

function startTracking() {
	projectData.tracking = true
	projectData.last_start = new Date().toISOString()
	saveProjectData()
	updateStatusBar()
	interval = setInterval(() => updateStatusBar(), 1000)
}

function stopTracking() {
	if (projectData.last_start) {
		const lastStart = new Date(projectData.last_start)
		const now = new Date()
		const diff = Math.floor((now.getTime() - lastStart.getTime()) / 1000)
		projectData.total_tracked += diff
	}
	projectData.tracking = false
	projectData.last_start = null
	saveProjectData()
	updateStatusBar()
	if (interval) clearInterval(interval)
}

function updateStatusBar() {
	let totalSeconds = projectData.total_tracked
	if (projectData.tracking && projectData.last_start) {
		const lastStart = new Date(projectData.last_start)
		const now = new Date()
		totalSeconds += Math.floor((now.getTime() - lastStart.getTime()) / 1000)
	}
	const h = Math.floor(totalSeconds / 3600)
	const m = Math.floor((totalSeconds % 3600) / 60)
	const s = totalSeconds % 60
	const issue = projectData.active_issue_id
		? `#${projectData.active_issue_id}`
		: t('noIssue')
	statusBarItem.text = `$(clock) ${issue} ${h}h ${m}m ${s}s`
	statusBarItem.tooltip = t('tooltip')
	statusBarItem.show()
}

function saveProjectData() {
	fs.writeFileSync(projectFilePath, JSON.stringify(projectData, null, 2))
}

function sendTimeEntry() {
	stopTracking()
	reloadProjectData()
	const minutes = Math.round(projectData.total_tracked / 60)
	if (
		!projectData.api_key ||
		!projectData.redmine_url ||
		!projectData.active_issue_id ||
		!projectData.activity_id
	) {
		vscode.window.showErrorMessage('Missing required fields.')
		return
	}
	const payload = JSON.stringify({
		time_entry: {
			issue_id: projectData.active_issue_id,
			hours: minutes / 60,
			activity_id: projectData.activity_id,
			comments: 'Auto-tracked from VSCode',
		},
	})
	const url = new URL(
		`${projectData.redmine_url}/time_entries.json?key=${projectData.api_key}`
	)
	const options = {
		hostname: url.hostname,
		path: url.pathname + url.search,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Content-Length': Buffer.byteLength(payload),
		},
	}
	const req = https.request(options, res => {
		res.on('data', d => console.log('Redmine:', d.toString()))
		if (res.statusCode === 201) {
			vscode.window.showInformationMessage(`${t('timeSent')} (${minutes} min)`)
			projectData.total_tracked = 0
			saveProjectData()
			updateStatusBar()
		} else {
			vscode.window.showErrorMessage(`${t('sendError')} ${res.statusCode}`)
		}
	})
	req.on('error', err =>
		vscode.window.showErrorMessage(`${t('requestError')} ${err.message}`)
	)
	req.write(payload)
	req.end()
}

function fetchJson(url: string): Promise<any> {
	return new Promise((resolve, reject) => {
		https
			.get(url, res => {
				let data = ''
				res.on('data', chunk => (data += chunk))
				res.on('end', () => {
					try {
						resolve(JSON.parse(data))
					} catch (e) {
						reject(e)
					}
				})
			})
			.on('error', reject)
	})
}

async function setActivityId() {
	reloadProjectData()
	if (!projectData.api_key || !projectData.redmine_url) {
		vscode.window.showErrorMessage('Missing Redmine API key or URL')
		return
	}

	try {
		const url = `${projectData.redmine_url}/enumerations/time_entry_activities.json?key=${projectData.api_key}`
		const json = await fetchJson(url)
		const activities = json.time_entry_activities

		const pickItems = activities.map((act: any) => ({
			label: act.name,
			description: `ID: ${act.id}`,
			id: act.id,
		}))

		const picked = await vscode.window.showQuickPick<{
			label: string
			description: string
			id: number
		}>(pickItems, {
			placeHolder: t('chooseActivity'),
			matchOnDescription: true,
		})

		if (picked) {
			projectData.activity_id = picked.id
			saveProjectData()
			vscode.window.showInformationMessage(
				`${t('activitySet')} ${picked.label}`
			)
		}
	} catch (err: any) {
		vscode.window.showErrorMessage(`${t('requestError')} ${err.message}`)
	}
}

async function selectIssueFromList() {
	reloadProjectData()
	if (
		!projectData.api_key ||
		!projectData.redmine_url ||
		!projectData.redmine_project_id
	) {
		vscode.window.showErrorMessage(t('missingRequiredConfiguration'))
		return
	}

	vscode.window.showInformationMessage(t('fetchingIssues'))
	const url = `${projectData.redmine_url}/issues.json?key=${projectData.api_key}&project_id=${projectData.redmine_project_id}&limit=100`

	try {
		const json = await fetchJson(url)
		const issues = json.issues
		if (!issues.length) {
			vscode.window.showWarningMessage(t('noIssuesFound'))
			return
		}
		const pickItems = issues.map((issue: any) => ({
			label: `[#${issue.id}] ${issue.subject}`,
			description: issue.description || '',
			issueId: issue.id,
		}))
		const picked = await vscode.window.showQuickPick<{
			label: string
			description: string
			issueId: number
		}>(pickItems, {
			placeHolder: t('chooseIssue'),
			matchOnDescription: true,
		})
		if (picked) {
			if (
				projectData.active_issue_id != picked.issueId &&
				projectData.total_tracked > 0
			) {
				if (projectData.tracking) {
					stopTracking()
				}
				sendTimeEntry()
			}
			projectData.active_issue_id = picked.issueId
			saveProjectData()
			updateStatusBar()
			vscode.window.showInformationMessage(
				`${t('setIssueConfirm')} #${picked.issueId}`
			)
		}
	} catch (err: any) {
		vscode.window.showErrorMessage(`${t('requestError')} ${err.message}`)
	}
}

async function changeIssueStatus() {
	reloadProjectData()

	const url = `${projectData.redmine_url}/issue_statuses.json?key=${projectData.api_key}`
	try {
		const json = await fetchJson(url)
		const statuses = json.issue_statuses
		if (!statuses || statuses.length === 0) {
			vscode.window.showWarningMessage(t('noStatusesFound'))
			return
		}

		const pickItems = statuses.map((status: any) => ({
			label: status.name,
			description: `ID: ${status.id}`,
			id: status.id,
		}))

		const picked = await vscode.window.showQuickPick<{
			label: string
			id: number
		}>(pickItems, {
			placeHolder: t('chooseStatus'),
			matchOnDescription: true,
		})

		if (!picked) return

		const issueId = projectData.active_issue_id
		const updateUrl = `${projectData.redmine_url}/issues/${issueId}.json?key=${projectData.api_key}`
		const payload = JSON.stringify({ issue: { status_id: picked.id } })

		const options = {
			method: 'PUT',
			hostname: new URL(updateUrl).hostname,
			path: new URL(updateUrl).pathname + new URL(updateUrl).search,
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': Buffer.byteLength(payload),
			},
		}

		const req = https.request(options, res => {
			if (res.statusCode === 204) {
				vscode.window.showInformationMessage(
					`${t('statusUpdated')} ${picked.label}`
				)
			} else {
				vscode.window.showErrorMessage(
					`${t('statusUpdateFailed')} ${res.statusCode}`
				)
			}
		})

		req.on('error', err => {
			vscode.window.showErrorMessage(`${t('requestError')} ${err.message}`)
		})

		req.write(payload)
		req.end()
	} catch (err: any) {
		vscode.window.showErrorMessage(`${t('requestError')} ${err.message}`)
	}
}
